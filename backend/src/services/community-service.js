const crypto = require("node:crypto");
const { pool } = require("../config/database");
const AppError = require("../utils/app-error");

const SUPPORT_CATEGORIES = Object.freeze([
  "Mão de obra",
  "Recursos materiais",
  "Conhecimento",
  "Serviços",
  "Outros",
]);
const REPORT_REASONS = new Set([
  "Conteúdo falso ou enganoso",
  "Risco ou conteúdo malicioso",
  "Informações impróprias",
  "Outro",
]);

const REQUEST_SELECT = `
  SELECT s.*, p.titulo AS projeto_titulo, p.status AS projeto_status,
         escola.nome AS escola_nome, colaborador.nome AS colaborador_nome,
         e.solicitado_por, e.escola_confirmou, e.colaborador_confirmou,
         c.codigo AS certificado_codigo
  FROM solicitacoes_colaboracao s
  JOIN projetos p ON p.id = s.projeto_id
  JOIN usuarios escola ON escola.id = s.escola_id
  JOIN usuarios colaborador ON colaborador.id = s.colaborador_id
  LEFT JOIN encerramentos_colaboracao e ON e.solicitacao_id = s.id
  LEFT JOIN certificados c ON c.solicitacao_id = s.id
`;

function parseId(value, label = "Registro") {
  const id = Number.parseInt(value, 10);
  if (!Number.isInteger(id) || id <= 0) throw new AppError(400, `${label} inválido.`);
  return id;
}

function userId(auth) {
  return parseId(auth?.sub, "Usuário");
}

function text(value, label, min, max, required = true) {
  const normalized = String(value || "").trim();
  if ((required && normalized.length < min) || normalized.length > max) {
    throw new AppError(400, `${label} deve ter entre ${min} e ${max} caracteres.`);
  }
  return normalized;
}

function serializeRequest(row) {
  return {
    id: row.id,
    project: { id: row.projeto_id, title: row.projeto_titulo, status: row.projeto_status },
    school: { id: row.escola_id, name: row.escola_nome },
    supporter: { id: row.colaborador_id, name: row.colaborador_nome },
    category: row.categoria,
    description: row.descricao,
    availability: row.disponibilidade || "",
    status: row.status,
    rejectionReason: row.motivo_recusa || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    acceptedAt: row.accepted_at,
    completedAt: row.completed_at,
    closure: row.solicitado_por ? {
      requestedBy: row.solicitado_por,
      schoolConfirmed: Boolean(row.escola_confirmou),
      supporterConfirmed: Boolean(row.colaborador_confirmou),
    } : null,
    certificateCode: row.certificado_codigo || null,
  };
}

async function requestById(id, database = pool) {
  const [rows] = await database.execute(`${REQUEST_SELECT} WHERE s.id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

function assertParticipant(row, auth) {
  const id = userId(auth);
  if (id !== Number(row.escola_id) && id !== Number(row.colaborador_id)) {
    throw new AppError(403, "Você não participa desta colaboração.");
  }
  return id;
}

async function listCollaborations(auth) {
  const id = userId(auth);
  const [rows] = await pool.execute(
    `${REQUEST_SELECT} WHERE s.escola_id = ? OR s.colaborador_id = ? ORDER BY s.updated_at DESC`,
    [id, id],
  );
  return rows.map(serializeRequest);
}

async function createCollaboration(projectIdValue, payload, auth) {
  if (auth?.tipo !== "colaborador") {
    throw new AppError(403, "Apenas colaboradores podem enviar solicitações.");
  }
  const projectId = parseId(projectIdValue, "Projeto");
  const id = userId(auth);
  const category = text(payload?.category, "A categoria", 2, 60);
  if (!SUPPORT_CATEGORIES.includes(category)) throw new AppError(400, "Categoria de apoio inválida.");
  const description = text(payload?.description, "A descrição", 10, 1500);
  const availability = text(payload?.availability, "A disponibilidade", 0, 200, false);

  const [projects] = await pool.execute(
    `SELECT p.id, p.criador_id, p.status,
            EXISTS(SELECT 1 FROM projeto_categorias_apoio pc WHERE pc.projeto_id=p.id) AS has_categories,
            EXISTS(SELECT 1 FROM projeto_categorias_apoio pc WHERE pc.projeto_id=p.id AND pc.categoria=?) AS allows_category
     FROM projetos p WHERE p.id=? LIMIT 1`,
    [category, projectId],
  );
  const project = projects[0];
  if (!project) throw new AppError(404, "Projeto não encontrado.");
  if (project.status !== "publicado") throw new AppError(409, "Este projeto já foi concluído.");
  if (Number(project.criador_id) === id) throw new AppError(403, "Você não pode colaborar com o próprio projeto.");
  if (project.has_categories && !project.allows_category) {
    throw new AppError(400, "Essa categoria não está disponível neste projeto.");
  }
  const [active] = await pool.execute(
    `SELECT id FROM solicitacoes_colaboracao
     WHERE projeto_id=? AND colaborador_id=? AND status IN ('pendente','aceita') LIMIT 1`,
    [projectId, id],
  );
  if (active[0]) throw new AppError(409, "Você já possui uma solicitação ativa neste projeto.");

  const [result] = await pool.execute(
    `INSERT INTO solicitacoes_colaboracao
      (projeto_id, escola_id, colaborador_id, categoria, descricao, disponibilidade)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [projectId, project.criador_id, id, category, description, availability || null],
  );
  return serializeRequest(await requestById(result.insertId));
}

async function updateCollaboration(requestIdValue, payload, auth) {
  const requestId = parseId(requestIdValue, "Solicitação");
  const row = await requestById(requestId);
  if (!row) throw new AppError(404, "Solicitação não encontrada.");
  if (Number(row.escola_id) !== userId(auth)) {
    throw new AppError(403, "Apenas a escola responsável pode analisar a solicitação.");
  }
  if (row.status !== "pendente") throw new AppError(409, "Esta solicitação já foi analisada.");
  const status = String(payload?.status || "").trim();
  if (!new Set(["aceita", "recusada"]).has(status)) throw new AppError(400, "Situação inválida.");
  const reason = status === "recusada"
    ? text(payload?.reason, "O motivo", 3, 1000)
    : "";
  await pool.execute(
    `UPDATE solicitacoes_colaboracao
     SET status=?, motivo_recusa=?, accepted_at=IF(?='aceita',CURRENT_TIMESTAMP,NULL)
     WHERE id=? AND status='pendente'`,
    [status, reason || null, status, requestId],
  );
  return serializeRequest(await requestById(requestId));
}

async function updateClosure(requestIdValue, action, auth) {
  const requestId = parseId(requestIdValue, "Solicitação");
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const row = await requestById(requestId, connection);
    if (!row) throw new AppError(404, "Solicitação não encontrada.");
    const id = assertParticipant(row, auth);
    if (row.status !== "aceita") throw new AppError(409, "A colaboração precisa estar aceita.");
    if (!new Set(["request", "confirm", "decline"]).has(action)) throw new AppError(400, "Ação inválida.");

    if (action === "request") {
      if (row.solicitado_por) throw new AppError(409, "Já existe um pedido de encerramento.");
      await connection.execute(
        `INSERT INTO encerramentos_colaboracao
          (solicitacao_id, solicitado_por, escola_confirmou, colaborador_confirmou)
         VALUES (?, ?, ?, ?)`,
        [requestId, id, id === Number(row.escola_id), id === Number(row.colaborador_id)],
      );
    } else {
      if (!row.solicitado_por) throw new AppError(409, "Não existe pedido de encerramento.");
      if (action === "decline") {
        await connection.execute("DELETE FROM encerramentos_colaboracao WHERE solicitacao_id=?", [requestId]);
      } else if (id === Number(row.escola_id)) {
        await connection.execute("UPDATE encerramentos_colaboracao SET escola_confirmou=TRUE WHERE solicitacao_id=?", [requestId]);
      } else {
        await connection.execute("UPDATE encerramentos_colaboracao SET colaborador_confirmou=TRUE WHERE solicitacao_id=?", [requestId]);
      }
    }

    const [closures] = await connection.execute(
      "SELECT * FROM encerramentos_colaboracao WHERE solicitacao_id=?",
      [requestId],
    );
    const closure = closures[0];
    if (closure?.escola_confirmou && closure?.colaborador_confirmou) {
      await connection.execute(
        "UPDATE solicitacoes_colaboracao SET status='concluida', completed_at=CURRENT_TIMESTAMP WHERE id=? AND status='aceita'",
        [requestId],
      );
      await connection.execute(
        "INSERT IGNORE INTO recompensas_participacao (solicitacao_id, usuario_id, pontos) VALUES (?, ?, 20)",
        [requestId, row.colaborador_id],
      );
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  return serializeRequest(await requestById(requestId));
}

async function listConversations(auth) {
  const id = userId(auth);
  const [rows] = await pool.execute(
    `${REQUEST_SELECT}
     WHERE (s.escola_id=? OR s.colaborador_id=?) AND s.status IN ('aceita','concluida')
     ORDER BY s.updated_at DESC`,
    [id, id],
  );
  const conversations = [];
  for (const row of rows) {
    const [messages] = await pool.execute(
      "SELECT texto, created_at FROM mensagens_colaboracao WHERE solicitacao_id=? ORDER BY id DESC LIMIT 1",
      [row.id],
    );
    const [unread] = await pool.execute(
      "SELECT COUNT(*) AS total FROM mensagens_colaboracao WHERE solicitacao_id=? AND destinatario_id=? AND read_at IS NULL",
      [row.id, id],
    );
    const otherIsSchool = id === Number(row.colaborador_id);
    conversations.push({
      request: serializeRequest(row),
      other: otherIsSchool
        ? { id: row.escola_id, name: row.escola_nome }
        : { id: row.colaborador_id, name: row.colaborador_nome },
      lastMessage: messages[0]?.texto || "",
      lastMessageAt: messages[0]?.created_at || row.accepted_at,
      unread: Number(unread[0].total),
    });
  }
  return conversations;
}

async function listMessages(requestIdValue, auth) {
  const requestId = parseId(requestIdValue, "Solicitação");
  const row = await requestById(requestId);
  if (!row) throw new AppError(404, "Solicitação não encontrada.");
  assertParticipant(row, auth);
  if (!new Set(["aceita", "concluida"]).has(row.status)) throw new AppError(403, "O chat ainda não foi liberado.");
  const [messages] = await pool.execute(
    `SELECT m.id, m.remetente_id, m.destinatario_id, m.texto, m.created_at, m.read_at,
            u.nome AS remetente_nome
     FROM mensagens_colaboracao m JOIN usuarios u ON u.id=m.remetente_id
     WHERE m.solicitacao_id=? ORDER BY m.id`,
    [requestId],
  );
  return messages.map((message) => ({
    id: message.id,
    sender: { id: message.remetente_id, name: message.remetente_nome },
    recipientId: message.destinatario_id,
    text: message.texto,
    createdAt: message.created_at,
    read: Boolean(message.read_at),
  }));
}

async function sendMessage(requestIdValue, payload, auth) {
  const requestId = parseId(requestIdValue, "Solicitação");
  const row = await requestById(requestId);
  if (!row) throw new AppError(404, "Solicitação não encontrada.");
  const id = assertParticipant(row, auth);
  if (row.status !== "aceita") throw new AppError(409, "Esta conversa está encerrada.");
  if (row.solicitado_por) throw new AppError(409, "A conversa está pausada durante o encerramento.");
  const message = text(payload?.text, "A mensagem", 1, 2000);
  const recipient = id === Number(row.escola_id) ? row.colaborador_id : row.escola_id;
  const [result] = await pool.execute(
    `INSERT INTO mensagens_colaboracao (solicitacao_id, remetente_id, destinatario_id, texto)
     VALUES (?, ?, ?, ?)`,
    [requestId, id, recipient, message],
  );
  const messages = await listMessages(requestId, auth);
  return messages.find((item) => Number(item.id) === Number(result.insertId));
}

async function markMessagesRead(requestIdValue, auth) {
  const requestId = parseId(requestIdValue, "Solicitação");
  const row = await requestById(requestId);
  if (!row) throw new AppError(404, "Solicitação não encontrada.");
  const id = assertParticipant(row, auth);
  await pool.execute(
    "UPDATE mensagens_colaboracao SET read_at=CURRENT_TIMESTAMP WHERE solicitacao_id=? AND destinatario_id=? AND read_at IS NULL",
    [requestId, id],
  );
}

async function issueCertificate(requestIdValue, auth) {
  const requestId = parseId(requestIdValue, "Solicitação");
  const row = await requestById(requestId);
  if (!row) throw new AppError(404, "Solicitação não encontrada.");
  if (Number(row.escola_id) !== userId(auth)) throw new AppError(403, "Apenas a escola responsável pode emitir o certificado.");
  if (row.status !== "concluida") throw new AppError(409, "Conclua a colaboração antes de emitir o certificado.");
  if (row.certificado_codigo) return getCertificate(row.certificado_codigo, auth);
  const code = crypto.randomBytes(20).toString("hex");
  const snapshot = {
    code,
    collaborator: row.colaborador_nome,
    school: row.escola_nome,
    project: row.projeto_titulo,
    contribution: row.descricao,
    category: row.categoria,
    completedAt: row.completed_at,
    issuedAt: new Date().toISOString(),
  };
  await pool.execute(
    "INSERT INTO certificados (solicitacao_id, codigo, snapshot) VALUES (?, ?, ?)",
    [requestId, code, JSON.stringify(snapshot)],
  );
  return snapshot;
}

async function getCertificate(codeValue, auth) {
  const code = String(codeValue || "").trim().toLowerCase();
  if (!/^[a-f0-9]{40}$/.test(code)) throw new AppError(400, "Código de certificado inválido.");
  const [rows] = await pool.execute(
    `SELECT c.snapshot, s.escola_id, s.colaborador_id
     FROM certificados c JOIN solicitacoes_colaboracao s ON s.id=c.solicitacao_id
     WHERE c.codigo=? LIMIT 1`,
    [code],
  );
  const row = rows[0];
  if (!row) throw new AppError(404, "Certificado não encontrado.");
  assertParticipant(row, auth);
  return JSON.parse(row.snapshot);
}

async function progress(auth) {
  const id = userId(auth);
  const [rewardRows] = await pool.execute(
    "SELECT COALESCE(SUM(pontos),0) AS xp, COUNT(*) AS completed FROM recompensas_participacao WHERE usuario_id=?",
    [id],
  );
  const [certificates] = await pool.execute(
    `SELECT c.codigo, c.snapshot, c.created_at
     FROM certificados c JOIN solicitacoes_colaboracao s ON s.id=c.solicitacao_id
     WHERE s.escola_id=? OR s.colaborador_id=? ORDER BY c.created_at DESC`,
    [id, id],
  );
  const xp = Number(rewardRows[0].xp);
  const thresholds = [0, 50, 100, 200, 350, 500, 700];
  const level = thresholds.filter((threshold) => xp >= threshold).length;
  const nextThreshold = thresholds.find((threshold) => threshold > xp) || xp;
  return {
    xp,
    level,
    completed: Number(rewardRows[0].completed),
    nextLevelXp: nextThreshold,
    certificates: certificates.map((row) => JSON.parse(row.snapshot)),
  };
}

async function notifications(auth) {
  const id = userId(auth);
  const [[pending], [unread], [issued]] = await Promise.all([
    pool.execute("SELECT COUNT(*) AS total FROM solicitacoes_colaboracao WHERE escola_id=? AND status='pendente'", [id]),
    pool.execute("SELECT COUNT(*) AS total FROM mensagens_colaboracao WHERE destinatario_id=? AND read_at IS NULL", [id]),
    pool.execute(`SELECT COUNT(*) AS total FROM certificados c JOIN solicitacoes_colaboracao s ON s.id=c.solicitacao_id
                  WHERE s.colaborador_id=?`, [id]),
  ]);
  const items = [];
  if (pending[0].total) items.push({ kind: "request", count: Number(pending[0].total), title: "Solicitações pendentes", detail: "Há novas ofertas para seus projetos." });
  if (unread[0].total) items.push({ kind: "message", count: Number(unread[0].total), title: "Mensagens não lidas", detail: "Abra suas conversas para responder." });
  if (issued[0].total) items.push({ kind: "certificate", count: Number(issued[0].total), title: "Certificados disponíveis", detail: "Consulte seus certificados na progressão." });
  return { count: items.reduce((sum, item) => sum + item.count, 0), items };
}

async function reportProject(projectIdValue, payload, auth) {
  const projectId = parseId(projectIdValue, "Projeto");
  const id = userId(auth);
  const reason = text(payload?.reason, "O motivo", 3, 80);
  const details = text(payload?.details, "Os detalhes", 10, 1000);
  if (!REPORT_REASONS.has(reason)) throw new AppError(400, "Motivo de denúncia inválido.");
  const [projects] = await pool.execute("SELECT id, criador_id FROM projetos WHERE id=? LIMIT 1", [projectId]);
  if (!projects[0]) throw new AppError(404, "Projeto não encontrado.");
  if (Number(projects[0].criador_id) === id) throw new AppError(403, "Você não pode denunciar o próprio projeto.");
  const [active] = await pool.execute(
    "SELECT id FROM denuncias_projetos WHERE projeto_id=? AND denunciante_id=? AND status IN ('pendente','em_analise') LIMIT 1",
    [projectId, id],
  );
  if (active[0]) throw new AppError(409, "Você já possui uma denúncia em análise para este projeto.");
  const [result] = await pool.execute(
    "INSERT INTO denuncias_projetos (projeto_id, denunciante_id, motivo, detalhes) VALUES (?, ?, ?, ?)",
    [projectId, id, reason, details],
  );
  return { id: result.insertId, status: "pendente" };
}

function assertAdmin(auth) {
  if (auth?.tipo !== "admin") throw new AppError(403, "Apenas administradores acessam a moderação.");
}

async function adminDashboard(auth) {
  assertAdmin(auth);
  const [[projects], [pending], [resolved], [collaborations]] = await Promise.all([
    pool.execute("SELECT COUNT(*) AS total FROM projetos"),
    pool.execute("SELECT COUNT(*) AS total FROM denuncias_projetos WHERE status IN ('pendente','em_analise')"),
    pool.execute("SELECT COUNT(*) AS total FROM denuncias_projetos WHERE status='arquivada'"),
    pool.execute("SELECT COUNT(*) AS total FROM solicitacoes_colaboracao"),
  ]);
  return { projects: Number(projects[0].total), pendingReports: Number(pending[0].total), resolvedReports: Number(resolved[0].total), collaborations: Number(collaborations[0].total) };
}

async function listReports(auth) {
  assertAdmin(auth);
  const [rows] = await pool.execute(
    `SELECT d.*, p.titulo AS projeto_titulo, u.nome AS denunciante_nome, m.nome AS moderador_nome
     FROM denuncias_projetos d JOIN projetos p ON p.id=d.projeto_id
     JOIN usuarios u ON u.id=d.denunciante_id LEFT JOIN usuarios m ON m.id=d.moderador_id
     ORDER BY FIELD(d.status,'pendente','em_analise','arquivada'), d.updated_at DESC`,
  );
  return rows.map((row) => ({ id: row.id, projectId: row.projeto_id, projectTitle: row.projeto_titulo, reporter: row.denunciante_nome, reason: row.motivo, details: row.detalhes, status: row.status, moderator: row.moderador_nome || "", note: row.nota_moderacao || "", createdAt: row.created_at, updatedAt: row.updated_at }));
}

async function updateReport(reportIdValue, payload, auth) {
  assertAdmin(auth);
  const reportId = parseId(reportIdValue, "Denúncia");
  const action = String(payload?.action || "");
  if (!new Set(["review", "archive"]).has(action)) throw new AppError(400, "Ação de moderação inválida.");
  const note = text(payload?.note, "A nota", 0, 1000, false);
  const [result] = await pool.execute(
    "UPDATE denuncias_projetos SET status=?, moderador_id=?, nota_moderacao=? WHERE id=?",
    [action === "review" ? "em_analise" : "arquivada", userId(auth), note || null, reportId],
  );
  if (!result.affectedRows) throw new AppError(404, "Denúncia não encontrada.");
}

module.exports = {
  SUPPORT_CATEGORIES,
  serializeRequest,
  listCollaborations,
  createCollaboration,
  updateCollaboration,
  updateClosure,
  listConversations,
  listMessages,
  sendMessage,
  markMessagesRead,
  issueCertificate,
  getCertificate,
  progress,
  notifications,
  reportProject,
  adminDashboard,
  listReports,
  updateReport,
};
