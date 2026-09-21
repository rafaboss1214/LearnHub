process.env.JWT_SECRET = "segredo-automatizado-com-mais-de-32-caracteres";

const test = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const database = require("../src/config/database");
const usersRepository = require("../src/repositories/users-repository");
const projectsRepository = require("../src/repositories/projects-repository");

const usersByEmail = new Map();
let nextId = 1;
const projectsById = new Map();
const favorites = new Set();
const supports = new Set();
const commentsById = new Map();
let nextProjectId = 1;
let nextCommentId = 1;

database.testDatabaseConnection = async () => true;
usersRepository.findByEmail = async (email) => usersByEmail.get(email) || null;
usersRepository.findById = async (id) =>
  [...usersByEmail.values()].find((user) => String(user.id) === String(id)) || null;
usersRepository.create = async ({ nome, email, passwordHash, tipo }) => {
  const user = {
    id: nextId++,
    nome,
    email,
    senha: passwordHash,
    tipo_usuario: tipo,
    created_at: new Date(),
  };
  usersByEmail.set(email, user);
  return user;
};
usersRepository.update = async (id, fields) => {
  const user = [...usersByEmail.values()].find((item) => String(item.id) === String(id));
  if (!user) return null;
  usersByEmail.delete(user.email);
  if (fields.nome) user.nome = fields.nome;
  if (fields.email) user.email = fields.email;
  if (fields.passwordHash) user.senha = fields.passwordHash;
  usersByEmail.set(user.email, user);
  return user;
};
usersRepository.remove = async (id) => {
  const user = [...usersByEmail.values()].find((item) => String(item.id) === String(id));
  if (!user) return false;
  return usersByEmail.delete(user.email);
};

function projectRow(project, userId) {
  const key = `${project.id}:${userId}`;
  const comments = [...commentsById.values()].filter((comment) => comment.projeto_id === project.id);
  return {
    ...project,
    total_favoritos: [...favorites].filter((value) => value.startsWith(`${project.id}:`)).length,
    total_apoios: [...supports].filter((value) => value.startsWith(`${project.id}:`)).length,
    favorito: favorites.has(key),
    apoiado: supports.has(key),
    comments,
  };
}

projectsRepository.list = async (userId) => [...projectsById.values()].map((project) => projectRow(project, userId));
projectsRepository.findById = async (id, userId) => {
  const project = projectsById.get(Number(id));
  return project ? projectRow(project, userId) : null;
};
projectsRepository.create = async ({ titulo, descricao, categoria, imagemUrl, status, creatorId }) => {
  const id = nextProjectId++;
  const creator = [...usersByEmail.values()].find((user) => user.id === creatorId);
  projectsById.set(id, {
    id,
    titulo,
    descricao,
    categoria,
    imagem_url: imagemUrl,
    status,
    criador_id: creatorId,
    criador_nome: creator.nome,
    created_at: new Date(),
    updated_at: new Date(),
  });
  return id;
};
projectsRepository.update = async (id, fields) => {
  const project = projectsById.get(Number(id));
  if (!project) return false;
  const mapping = { imagemUrl: "imagem_url" };
  for (const [key, value] of Object.entries(fields)) project[mapping[key] || key] = value;
  project.updated_at = new Date();
  return true;
};
projectsRepository.remove = async (id) => projectsById.delete(Number(id));
projectsRepository.toggleRelation = async (table, projectId, userId) => {
  const collection = table === "projetos_favoritos" ? favorites : supports;
  const key = `${projectId}:${userId}`;
  if (collection.has(key)) {
    collection.delete(key);
    return false;
  }
  collection.add(key);
  return true;
};
projectsRepository.createComment = async ({ projectId, userId, text }) => {
  const user = [...usersByEmail.values()].find((item) => item.id === userId);
  const comment = {
    id: nextCommentId++,
    projeto_id: projectId,
    usuario_id: userId,
    usuario_nome: user.nome,
    texto: text,
    created_at: new Date(),
  };
  commentsById.set(comment.id, comment);
  return comment;
};
projectsRepository.findCommentById = async (id) => commentsById.get(Number(id)) || null;
projectsRepository.removeComment = async (id) => commentsById.delete(Number(id));

// O app é carregado depois dos adapters acima, mantendo o teste sem dependência de MySQL local.
const app = require("../src/app");

function listen() {
  return new Promise((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${address.port}` });
    });
  });
}

async function api(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}

test("fluxo HTTP completo de cadastro e login", async () => {
  const { server, baseUrl } = await listen();
  const email = "pessoa@example.com";
  const senha = "SenhaSegura123";

  try {
    const health = await api(baseUrl, "/api/health");
    assert.equal(health.status, 200);
    assert.deepEqual(health.body, { success: true, api: "online", database: "connected" });

    const registered = await api(baseUrl, "/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ nome: "Pessoa Teste", email, senha, tipo: "diretor" }),
    });
    assert.equal(registered.status, 201);
    assert.equal(registered.body.user.tipo, "diretor");
    assert.equal(Object.hasOwn(registered.body.user, "senha"), false);

    const stored = usersByEmail.get(email);
    assert.notEqual(stored.senha, senha);
    assert.equal(await bcrypt.compare(senha, stored.senha), true);

    const duplicate = await api(baseUrl, "/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ nome: "Duplicado", email, senha, tipo: "colaborador" }),
    });
    assert.equal(duplicate.status, 409);

    const wrongPassword = await api(baseUrl, "/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, senha: "senha-incorreta" }),
    });
    assert.equal(wrongPassword.status, 401);

    const unknownUser = await api(baseUrl, "/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "ausente@example.com", senha }),
    });
    assert.equal(unknownUser.status, 401);

    const authenticated = await api(baseUrl, "/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, senha }),
    });
    assert.equal(authenticated.status, 200);
    assert.ok(authenticated.body.token);

    const me = await api(baseUrl, "/api/auth/me", {
      headers: { Authorization: `Bearer ${authenticated.body.token}` },
    });
    assert.equal(me.status, 200);
    assert.equal(me.body.user.email, email);

    const createdProject = await api(baseUrl, "/api/projects", {
      method: "POST",
      headers: { Authorization: `Bearer ${authenticated.body.token}` },
      body: JSON.stringify({
        titulo: "Laboratório maker",
        descricao: "Um projeto completo para testar o CRUD da comunidade.",
        categoria: "Tecnologia e Ciência",
      }),
    });
    assert.equal(createdProject.status, 201);
    assert.equal(createdProject.body.project.titulo, "Laboratório maker");
    const projectId = createdProject.body.project.id;

    const listedProjects = await api(baseUrl, "/api/projects", {
      headers: { Authorization: `Bearer ${authenticated.body.token}` },
    });
    assert.equal(listedProjects.status, 200);
    assert.equal(listedProjects.body.projects.length, 1);

    const updatedProject = await api(baseUrl, `/api/projects/${projectId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${authenticated.body.token}` },
      body: JSON.stringify({ titulo: "Laboratório maker atualizado", status: "concluido" }),
    });
    assert.equal(updatedProject.status, 200);
    assert.equal(updatedProject.body.project.status, "concluido");

    const favorite = await api(baseUrl, `/api/projects/${projectId}/favorite`, {
      method: "POST",
      headers: { Authorization: `Bearer ${authenticated.body.token}` },
    });
    assert.equal(favorite.status, 200);
    assert.equal(favorite.body.favorito, true);

    const support = await api(baseUrl, `/api/projects/${projectId}/support`, {
      method: "POST",
      headers: { Authorization: `Bearer ${authenticated.body.token}` },
    });
    assert.equal(support.status, 200);
    assert.equal(support.body.apoiado, true);

    const comment = await api(baseUrl, `/api/projects/${projectId}/comments`, {
      method: "POST",
      headers: { Authorization: `Bearer ${authenticated.body.token}` },
      body: JSON.stringify({ texto: "Comentário persistido." }),
    });
    assert.equal(comment.status, 201);

    const detailedProject = await api(baseUrl, `/api/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${authenticated.body.token}` },
    });
    assert.equal(detailedProject.body.project.comentarios.length, 1);
    assert.equal(detailedProject.body.project.totalFavoritos, 1);
    assert.equal(detailedProject.body.project.totalApoios, 1);

    const deletedComment = await api(baseUrl, `/api/projects/comments/${comment.body.comment.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${authenticated.body.token}` },
    });
    assert.equal(deletedComment.status, 204);

    const deletedProject = await api(baseUrl, `/api/projects/${projectId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${authenticated.body.token}` },
    });
    assert.equal(deletedProject.status, 204);

    const missingProject = await api(baseUrl, `/api/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${authenticated.body.token}` },
    });
    assert.equal(missingProject.status, 404);

    const unauthorized = await api(baseUrl, "/api/auth/me");
    assert.equal(unauthorized.status, 401);

    const updatedProfile = await api(baseUrl, "/api/auth/me", {
      method: "PUT",
      headers: { Authorization: `Bearer ${authenticated.body.token}` },
      body: JSON.stringify({ nome: "Pessoa Atualizada", email: "atualizada@example.com" }),
    });
    assert.equal(updatedProfile.status, 200);
    assert.equal(updatedProfile.body.user.nome, "Pessoa Atualizada");

    const deletedProfile = await api(baseUrl, "/api/auth/me", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${authenticated.body.token}` },
    });
    assert.equal(deletedProfile.status, 204);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await database.closeDatabasePool().catch(() => undefined);
  }
});
