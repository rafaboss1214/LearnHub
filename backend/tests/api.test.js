process.env.JWT_SECRET = "segredo-automatizado-com-mais-de-32-caracteres";

const test = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const database = require("../src/config/database");
const usersRepository = require("../src/repositories/users-repository");

const usersByEmail = new Map();
let nextId = 1;

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
  return { status: response.status, body: await response.json() };
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

    const unauthorized = await api(baseUrl, "/api/auth/me");
    assert.equal(unauthorized.status, 401);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await database.closeDatabasePool().catch(() => undefined);
  }
});
