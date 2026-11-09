const assert = require("node:assert/strict");

const baseUrl = process.argv[2] || process.env.LEARNHUB_API_URL || require("../../app.json").expo.extra.apiUrl;
if (!baseUrl?.startsWith("http")) {
  console.error("Uso: node backend/tests/hosted-community.integration.js https://api.example.com");
  process.exit(1);
}

const suffix = Date.now();
const password = "SenhaSegura123";
const directorEmail = `fluxo.diretor.${suffix}@learnhub.local`;
const collaboratorEmail = `fluxo.colaborador.${suffix}@learnhub.local`;
let directorToken = "";
let collaboratorToken = "";
let projectId = null;

async function api(path, { token = "", ...options } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const raw = await response.text();
  const body = raw ? JSON.parse(raw) : null;
  console.log(`${options.method || "GET"} ${path}: HTTP ${response.status}`);
  return { status: response.status, body };
}

async function registerAndLogin(nome, email, tipo) {
  const payload = { nome, email, senha: password, tipo, ...(tipo === "colaborador" ? { communityType: "comunidade" } : {}) };
  assert.equal((await api("/api/auth/register", { method: "POST", body: JSON.stringify(payload) })).status, 201);
  const login = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email, senha: password }) });
  assert.equal(login.status, 200);
  return login.body.token;
}

async function run() {
  try {
    const health = await api("/api/health");
    assert.equal(health.status, 200);
    assert.equal(health.body.database, "connected");

    directorToken = await registerAndLogin("Diretora Fluxo", directorEmail, "diretor");
    collaboratorToken = await registerAndLogin("Colaborador Fluxo", collaboratorEmail, "colaborador");

    const created = await api("/api/projects", {
      token: directorToken,
      method: "POST",
      body: JSON.stringify({
        titulo: "Projeto temporário de colaboração",
        descricao: "Projeto temporário usado para validar todo o fluxo de colaboração hospedado.",
        categoria: "Inclusão e Cidadania",
        supportCategories: ["Conhecimento", "Serviços"],
      }),
    });
    assert.equal(created.status, 201);
    projectId = created.body.project.id;
    assert.deepEqual(created.body.project.supportCategories.sort(), ["Conhecimento", "Serviços"]);

    const requested = await api(`/api/projects/${projectId}/requests`, {
      token: collaboratorToken,
      method: "POST",
      body: JSON.stringify({ category: "Conhecimento", description: "Posso oferecer oficinas aos estudantes.", availability: "Sábados" }),
    });
    assert.equal(requested.status, 201);
    const requestId = requested.body.collaboration.id;

    const accepted = await api(`/api/collaborations/${requestId}`, {
      token: directorToken,
      method: "PUT",
      body: JSON.stringify({ status: "aceita" }),
    });
    assert.equal(accepted.status, 200);

    assert.equal((await api(`/api/collaborations/${requestId}/messages`, {
      token: collaboratorToken,
      method: "POST",
      body: JSON.stringify({ text: "Olá! Quando podemos começar?" }),
    })).status, 201);
    const messages = await api(`/api/collaborations/${requestId}/messages`, { token: directorToken });
    assert.equal(messages.status, 200);
    assert.equal(messages.body.messages.length, 1);
    assert.equal((await api(`/api/collaborations/${requestId}/messages/read`, { token: directorToken, method: "PUT" })).status, 204);

    assert.equal((await api(`/api/collaborations/${requestId}/closure`, {
      token: collaboratorToken,
      method: "POST",
      body: JSON.stringify({ action: "request" }),
    })).status, 200);
    const completed = await api(`/api/collaborations/${requestId}/closure`, {
      token: directorToken,
      method: "POST",
      body: JSON.stringify({ action: "confirm" }),
    });
    assert.equal(completed.body.collaboration.status, "concluida");

    const progress = await api("/api/progress", { token: collaboratorToken });
    assert.equal(progress.body.progress.xp, 20);
    assert.equal(progress.body.progress.completed, 1);

    const certificate = await api(`/api/collaborations/${requestId}/certificate`, { token: directorToken, method: "POST" });
    assert.equal(certificate.status, 200);
    assert.match(certificate.body.certificate.code, /^[a-f0-9]{40}$/);
    const certificateView = await api(`/api/certificates/${certificate.body.certificate.code}`, { token: collaboratorToken });
    assert.equal(certificateView.status, 200);

    const protectedDelete = await api(`/api/projects/${projectId}`, { token: directorToken, method: "DELETE" });
    assert.equal(protectedDelete.status, 409);
    console.log("Fluxo hospedado de colaboração validado integralmente.");
  } finally {
    if (collaboratorToken) await api("/api/auth/me", { token: collaboratorToken, method: "DELETE" }).catch(() => undefined);
    if (directorToken && projectId) await api(`/api/projects/${projectId}`, { token: directorToken, method: "DELETE" }).catch(() => undefined);
    if (directorToken) await api("/api/auth/me", { token: directorToken, method: "DELETE" }).catch(() => undefined);
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
