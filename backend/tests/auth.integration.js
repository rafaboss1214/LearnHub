const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const env = require("../src/config/env");
const { pool, closeDatabasePool } = require("../src/config/database");

const baseUrl = process.env.API_URL || `http://127.0.0.1:${env.PORT}`;
const email = `teste.${Date.now()}@learnhub.local`;
const password = "SenhaSegura123";

async function api(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const body = await response.json().catch(() => ({}));
  console.log(`${options.method || "GET"} ${path}: HTTP ${response.status}`);
  return { status: response.status, body };
}

async function run() {
  let createdUser = false;
  try {
    const health = await api("/api/health");
    assert.equal(health.status, 200, "health deve retornar 200 com o MySQL conectado");
    assert.deepEqual(health.body, { success: true, api: "online", database: "connected" });

    const registered = await api("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ nome: "Usuário de Teste", email, senha: password, tipo: "colaborador" }),
    });
    assert.equal(registered.status, 201, "cadastro válido deve retornar 201");
    assert.equal(registered.body.user.email, email);
    assert.equal(Object.hasOwn(registered.body.user, "senha"), false);
    createdUser = true;

    const [rows] = await pool.execute("SELECT senha FROM usuarios WHERE email = ? LIMIT 1", [email]);
    assert.equal(rows.length, 1, "usuário cadastrado deve existir no MySQL");
    assert.notEqual(rows[0].senha, password, "senha não pode ser armazenada em texto puro");
    assert.equal(await bcrypt.compare(password, rows[0].senha), true, "hash salvo deve ser bcrypt válido");

    const duplicate = await api("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ nome: "Duplicado", email, senha: password, tipo: "colaborador" }),
    });
    assert.equal(duplicate.status, 409, "e-mail repetido deve retornar 409");

    const wrongPassword = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, senha: "senha-incorreta" }),
    });
    assert.equal(wrongPassword.status, 401, "senha incorreta deve retornar 401");

    const unknownUser = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: `ausente.${Date.now()}@learnhub.local`, senha: password }),
    });
    assert.equal(unknownUser.status, 401, "usuário inexistente deve retornar 401");

    const authenticated = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, senha: password }),
    });
    assert.equal(authenticated.status, 200, "login válido deve retornar 200");
    assert.ok(authenticated.body.token, "login válido deve retornar token");

    const me = await api("/api/auth/me", {
      headers: { Authorization: `Bearer ${authenticated.body.token}` },
    });
    assert.equal(me.status, 200, "token deve permitir consultar o usuário autenticado");
    assert.equal(me.body.user.email, email);

    console.log("Todos os testes reais de API + MySQL passaram.");
  } finally {
    if (createdUser && process.env.TEST_KEEP_USER !== "1") {
      await pool.execute("DELETE FROM usuarios WHERE email = ?", [email]).catch(() => undefined);
    }
    await closeDatabasePool().catch(() => undefined);
  }
}

run().catch((error) => {
  if (error?.cause?.code === "ECONNREFUSED") {
    console.error(`A API não respondeu em ${baseUrl}. Inicie-a com: npm run backend`);
  } else {
    console.error(error.message);
  }
  process.exitCode = 1;
});
