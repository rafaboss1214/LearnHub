const assert = require("node:assert/strict");

const baseUrl = process.env.API_URL || "http://127.0.0.1:3333";
const email = `teste.${Date.now()}@learnhub.local`;
const password = "SenhaSegura123";

async function api(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  return { status: response.status, body: await response.json() };
}

(async () => {
  const register = await api("/cadastro", { method: "POST", body: JSON.stringify({ nome: "Usuário de Teste", email, senha: password, tipo: "colaborador" }) });
  assert.equal(register.status, 201, "cadastro válido deve retornar 201");
  assert.equal(register.body.user.email, email);
  const duplicate = await api("/cadastro", { method: "POST", body: JSON.stringify({ nome: "Duplicado", email, senha: password, tipo: "colaborador" }) });
  assert.equal(duplicate.status, 409, "e-mail duplicado deve retornar 409");
  const wrongPassword = await api("/login", { method: "POST", body: JSON.stringify({ email, senha: "senha-incorreta" }) });
  assert.equal(wrongPassword.status, 401, "senha incorreta deve retornar 401");
  const unknownUser = await api("/login", { method: "POST", body: JSON.stringify({ email: `ausente.${Date.now()}@learnhub.local`, senha: password }) });
  assert.equal(unknownUser.status, 401, "usuário inexistente deve retornar 401");
  const authenticated = await api("/login", { method: "POST", body: JSON.stringify({ email, senha: password }) });
  assert.equal(authenticated.status, 200, "login válido deve retornar 200");
  assert.ok(authenticated.body.token, "login deve retornar token");
  const me = await api("/usuario/me", { headers: { Authorization: `Bearer ${authenticated.body.token}` } });
  assert.equal(me.status, 200, "rota protegida deve reconhecer token");
  assert.equal(me.body.user.email, email);
  console.log("Todos os testes de autenticação passaram.");
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
