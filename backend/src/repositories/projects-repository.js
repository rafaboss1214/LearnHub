const { pool } = require("../config/database");

const PROJECT_SELECT = `
  SELECT
    p.id,
    p.titulo,
    p.descricao,
    p.categoria,
    p.imagem_url,
    p.status,
    p.criador_id,
    p.created_at,
    p.updated_at,
    pm.updated_at AS cover_updated_at,
    (pm.capa_data IS NOT NULL) AS has_cover,
    u.nome AS criador_nome,
    (SELECT GROUP_CONCAT(pc.categoria ORDER BY pc.categoria SEPARATOR '||')
       FROM projeto_categorias_apoio pc WHERE pc.projeto_id = p.id) AS apoio_categorias,
    (SELECT COUNT(*) FROM projetos_favoritos pf WHERE pf.projeto_id = p.id) AS total_favoritos,
    (SELECT COUNT(*) FROM projetos_apoios pa WHERE pa.projeto_id = p.id) AS total_apoios,
    EXISTS(
      SELECT 1 FROM projetos_favoritos pf
      WHERE pf.projeto_id = p.id AND pf.usuario_id = ?
    ) AS favorito,
    EXISTS(
      SELECT 1 FROM projetos_apoios pa
      WHERE pa.projeto_id = p.id AND pa.usuario_id = ?
    ) AS apoiado
  FROM projetos p
  LEFT JOIN usuarios u ON u.id = p.criador_id
  LEFT JOIN projeto_midias pm ON pm.projeto_id = p.id
`;

async function list(userId) {
  const [rows] = await pool.execute(
    `${PROJECT_SELECT} ORDER BY favorito DESC, p.created_at DESC`,
    [userId, userId],
  );
  return rows;
}

async function findById(id, userId) {
  const [rows] = await pool.execute(
    `${PROJECT_SELECT} WHERE p.id = ? LIMIT 1`,
    [userId, userId, id],
  );
  if (!rows[0]) return null;

  const [comments] = await pool.execute(
    `SELECT c.id, c.texto, c.usuario_id, c.created_at, u.nome AS usuario_nome
     FROM comentarios c
     LEFT JOIN usuarios u ON u.id = c.usuario_id
     WHERE c.projeto_id = ?
     ORDER BY c.created_at ASC`,
    [id],
  );
  return { ...rows[0], comments };
}

async function replaceSupportCategories(projectId, categories, database = pool) {
  await database.execute("DELETE FROM projeto_categorias_apoio WHERE projeto_id = ?", [projectId]);
  for (const category of categories) {
    await database.execute(
      "INSERT INTO projeto_categorias_apoio (projeto_id, categoria) VALUES (?, ?)",
      [projectId, category],
    );
  }
}

async function create({ titulo, descricao, categoria, imagemUrl, status, creatorId, supportCategories }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      `INSERT INTO projetos (titulo, descricao, categoria, imagem_url, status, criador_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [titulo, descricao, categoria, imagemUrl || null, status, creatorId],
    );
    await replaceSupportCategories(result.insertId, supportCategories, connection);
    await connection.commit();
    return result.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function update(id, fields) {
  const columns = {
    titulo: "titulo",
    descricao: "descricao",
    categoria: "categoria",
    imagemUrl: "imagem_url",
    status: "status",
  };
  const entries = Object.entries(fields).filter(([key]) => columns[key]);
  if (Object.hasOwn(fields, "supportCategories")) {
    await replaceSupportCategories(id, fields.supportCategories);
  }
  if (!entries.length) return Object.hasOwn(fields, "supportCategories");

  const setClause = entries.map(([key]) => `${columns[key]} = ?`).join(", ");
  const values = entries.map(([, value]) => value === "" ? null : value);
  const [result] = await pool.execute(
    `UPDATE projetos SET ${setClause} WHERE id = ?`,
    [...values, id],
  );
  return result.affectedRows > 0;
}

async function remove(id) {
  const [result] = await pool.execute("DELETE FROM projetos WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

async function saveCover(id, image) {
  await pool.execute(
    `INSERT INTO projeto_midias (projeto_id, capa_mime, capa_data) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE capa_mime=VALUES(capa_mime), capa_data=VALUES(capa_data), updated_at=CURRENT_TIMESTAMP`,
    [id, image.mime, image.data],
  );
}

async function removeCover(id) {
  await pool.execute("DELETE FROM projeto_midias WHERE projeto_id=?", [id]);
}

async function hasCollaborationHistory(id) {
  const [rows] = await pool.execute(
    "SELECT id FROM solicitacoes_colaboracao WHERE projeto_id = ? LIMIT 1",
    [id],
  );
  return Boolean(rows[0]);
}

async function toggleRelation(table, projectId, userId) {
  const allowedTables = new Set(["projetos_favoritos", "projetos_apoios"]);
  if (!allowedTables.has(table)) throw new Error("Tabela de relação inválida.");

  const [deleted] = await pool.execute(
    `DELETE FROM ${table} WHERE projeto_id = ? AND usuario_id = ?`,
    [projectId, userId],
  );
  if (deleted.affectedRows > 0) return false;

  await pool.execute(
    `INSERT IGNORE INTO ${table} (projeto_id, usuario_id) VALUES (?, ?)`,
    [projectId, userId],
  );
  return true;
}

async function createComment({ projectId, userId, text }) {
  const [result] = await pool.execute(
    "INSERT INTO comentarios (projeto_id, usuario_id, texto) VALUES (?, ?, ?)",
    [projectId, userId, text],
  );
  const [rows] = await pool.execute(
    `SELECT c.id, c.texto, c.usuario_id, c.created_at, u.nome AS usuario_nome
     FROM comentarios c
     LEFT JOIN usuarios u ON u.id = c.usuario_id
     WHERE c.id = ? LIMIT 1`,
    [result.insertId],
  );
  return rows[0];
}

async function findCommentById(id) {
  const [rows] = await pool.execute(
    "SELECT id, projeto_id, usuario_id FROM comentarios WHERE id = ? LIMIT 1",
    [id],
  );
  return rows[0] || null;
}

async function removeComment(id) {
  const [result] = await pool.execute("DELETE FROM comentarios WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

module.exports = {
  list,
  findById,
  create,
  update,
  remove,
  saveCover,
  removeCover,
  hasCollaborationHistory,
  toggleRelation,
  createComment,
  findCommentById,
  removeComment,
};
