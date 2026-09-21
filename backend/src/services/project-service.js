const projectsRepository = require("../repositories/projects-repository");
const AppError = require("../utils/app-error");

const VALID_STATUSES = new Set(["publicado", "concluido"]);

function parseId(value, label = "Projeto") {
  const id = Number.parseInt(value, 10);
  if (!Number.isInteger(id) || id <= 0) throw new AppError(400, `${label} inválido.`);
  return id;
}

function validateProject(payload, partial = false) {
  const result = {};
  const has = (key) => Object.hasOwn(payload || {}, key);

  if (!partial || has("titulo")) {
    const title = String(payload?.titulo || "").trim();
    if (title.length < 3 || title.length > 180) {
      throw new AppError(400, "O título deve ter entre 3 e 180 caracteres.");
    }
    result.titulo = title;
  }

  if (!partial || has("descricao")) {
    const description = String(payload?.descricao || "").trim();
    if (description.length < 10 || description.length > 5000) {
      throw new AppError(400, "A descrição deve ter entre 10 e 5000 caracteres.");
    }
    result.descricao = description;
  }

  if (!partial || has("categoria")) {
    const category = String(payload?.categoria || "").trim();
    if (category.length < 2 || category.length > 100) {
      throw new AppError(400, "Informe uma categoria válida.");
    }
    result.categoria = category;
  }

  if (!partial || has("imagemUrl")) {
    const imageUrl = String(payload?.imagemUrl || "").trim();
    if (imageUrl.length > 2048) throw new AppError(400, "A URL da imagem é muito longa.");
    if (imageUrl && !/^https?:\/\//i.test(imageUrl)) {
      throw new AppError(400, "A imagem deve usar uma URL http ou https.");
    }
    result.imagemUrl = imageUrl;
  }

  if (!partial || has("status")) {
    const status = String(payload?.status || "publicado").trim().toLowerCase();
    if (!VALID_STATUSES.has(status)) throw new AppError(400, "Status do projeto inválido.");
    result.status = status;
  }

  if (partial && !Object.keys(result).length) {
    throw new AppError(400, "Informe ao menos um campo para atualizar.");
  }
  return result;
}

function assertDirector(auth) {
  if (auth?.tipo !== "diretor") {
    throw new AppError(403, "Apenas diretores podem gerenciar projetos.");
  }
}

function publicComment(row) {
  return {
    id: row.id,
    texto: row.texto,
    usuario: row.usuario_id ? { id: row.usuario_id, nome: row.usuario_nome } : null,
    createdAt: row.created_at,
  };
}

function publicProject(row) {
  return {
    id: row.id,
    titulo: row.titulo,
    descricao: row.descricao,
    categoria: row.categoria,
    imagemUrl: row.imagem_url || "",
    status: row.status,
    criador: row.criador_id ? { id: row.criador_id, nome: row.criador_nome } : null,
    totalFavoritos: Number(row.total_favoritos || 0),
    totalApoios: Number(row.total_apoios || 0),
    favorito: Boolean(row.favorito),
    apoiado: Boolean(row.apoiado),
    comentarios: row.comments?.map(publicComment),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function list(auth) {
  const rows = await projectsRepository.list(parseId(auth.sub, "Usuário"));
  return rows.map(publicProject);
}

async function getById(idValue, auth) {
  const id = parseId(idValue);
  const row = await projectsRepository.findById(id, parseId(auth.sub, "Usuário"));
  if (!row) throw new AppError(404, "Projeto não encontrado.");
  return publicProject(row);
}

async function create(payload, auth) {
  assertDirector(auth);
  const values = validateProject(payload || {});
  const userId = parseId(auth.sub, "Usuário");
  const id = await projectsRepository.create({ ...values, creatorId: userId });
  return getById(id, auth);
}

async function update(idValue, payload, auth) {
  assertDirector(auth);
  const id = parseId(idValue);
  await getById(id, auth);
  const values = validateProject(payload || {}, true);
  await projectsRepository.update(id, values);
  return getById(id, auth);
}

async function remove(idValue, auth) {
  assertDirector(auth);
  const id = parseId(idValue);
  await getById(id, auth);
  await projectsRepository.remove(id);
}

async function toggleFavorite(idValue, auth) {
  const id = parseId(idValue);
  await getById(id, auth);
  const active = await projectsRepository.toggleRelation(
    "projetos_favoritos",
    id,
    parseId(auth.sub, "Usuário"),
  );
  return { favorito: active };
}

async function toggleSupport(idValue, auth) {
  const id = parseId(idValue);
  await getById(id, auth);
  const active = await projectsRepository.toggleRelation(
    "projetos_apoios",
    id,
    parseId(auth.sub, "Usuário"),
  );
  return { apoiado: active };
}

async function addComment(idValue, payload, auth) {
  const id = parseId(idValue);
  await getById(id, auth);
  const text = String(payload?.texto || "").trim();
  if (!text || text.length > 1000) {
    throw new AppError(400, "O comentário deve ter entre 1 e 1000 caracteres.");
  }
  const row = await projectsRepository.createComment({
    projectId: id,
    userId: parseId(auth.sub, "Usuário"),
    text,
  });
  return publicComment(row);
}

async function removeComment(commentIdValue, auth) {
  const id = parseId(commentIdValue, "Comentário");
  const comment = await projectsRepository.findCommentById(id);
  if (!comment) throw new AppError(404, "Comentário não encontrado.");
  const userId = parseId(auth.sub, "Usuário");
  if (Number(comment.usuario_id) !== userId && auth.tipo !== "diretor") {
    throw new AppError(403, "Você não pode excluir este comentário.");
  }
  await projectsRepository.removeComment(id);
}

module.exports = {
  parseId,
  validateProject,
  publicProject,
  list,
  getById,
  create,
  update,
  remove,
  toggleFavorite,
  toggleSupport,
  addComment,
  removeComment,
};
