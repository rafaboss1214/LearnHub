const assert = require("node:assert/strict");
const sharp = require("sharp");

const baseUrl = process.argv[2] || process.env.LEARNHUB_API_URL || require("../../app.json").expo.extra.apiUrl;
if (!baseUrl?.startsWith("http")) {
  console.error("Uso: node backend/tests/hosted-crud.integration.js https://api.example.com");
  process.exit(1);
}

const suffix = Date.now();
const email = `crud.${suffix}@learnhub.local`;
const updatedEmail = `crud.atualizado.${suffix}@learnhub.local`;
const password = "SenhaSegura123";
let token = "";
let projectId = null;

async function api(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  console.log(`${options.method || "GET"} ${path}: HTTP ${response.status}`);
  return { status: response.status, body };
}

async function assertPublicJpeg(path) {
  const response = await fetch(`${baseUrl}${String(path).split("?")[0]}`);
  console.log(`GET ${String(path).split("?")[0]}: HTTP ${response.status}`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "image/jpeg");
  assert.ok((await response.arrayBuffer()).byteLength > 0);
}

async function run() {
  try {
    const imageBase64 = (await sharp({
      create: { width: 24, height: 24, channels: 3, background: "#2f6fed" },
    }).png().toBuffer()).toString("base64");

    const health = await api("/api/health");
    assert.equal(health.status, 200);
    assert.equal(health.body.database, "connected");

    const registered = await api("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ nome: "Teste CRUD Hospedado", email, senha: password, tipo: "diretor" }),
    });
    assert.equal(registered.status, 201);

    const loggedIn = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, senha: password }),
    });
    assert.equal(loggedIn.status, 200);
    token = loggedIn.body.token;

    const enrichedProfile = await api("/api/auth/me", {
      method: "PUT",
      body: JSON.stringify({
        descricao: "Escola usada para validar o perfil hospedado.",
        habilidades: "Tecnologia, ciência e educação",
        endereco: {
          cep: "01001000",
          rua: "Praça da Sé",
          bairro: "Sé",
          cidade: "São Paulo",
          estado: "SP",
          numero: "100",
          complemento: "Teste automatizado",
        },
        avatarBase64: imageBase64,
        avatarMime: "image/png",
      }),
    });
    assert.equal(enrichedProfile.status, 200);
    assert.equal(enrichedProfile.body.user.endereco.cep, "01001000");
    assert.equal(enrichedProfile.body.user.habilidades, "Tecnologia, ciência e educação");
    assert.ok(enrichedProfile.body.user.avatarPath);
    await assertPublicJpeg(enrichedProfile.body.user.avatarPath);

    const institution = await api("/api/auth/institution", {
      method: "POST",
      body: JSON.stringify({ institutionEvidence: "INEP 12345678 - validação automatizada" }),
    });
    assert.equal(institution.status, 200);
    assert.equal(institution.body.user.institutionStatus, "pendente");

    const created = await api("/api/projects", {
      method: "POST",
      body: JSON.stringify({
        titulo: "Projeto temporário de validação",
        descricao: "Projeto criado automaticamente para validar o CRUD hospedado.",
        categoria: "Tecnologia e Ciência",
        imageBase64,
        imageMime: "image/png",
      }),
    });
    assert.equal(created.status, 201);
    projectId = created.body.project.id;
    assert.ok(created.body.project.imagePath);
    await assertPublicJpeg(created.body.project.imagePath);

    const listed = await api("/api/projects");
    assert.equal(listed.status, 200);
    assert.ok(listed.body.projects.some((project) => project.id === projectId));

    const detailed = await api(`/api/projects/${projectId}`);
    assert.equal(detailed.status, 200);

    const updated = await api(`/api/projects/${projectId}`, {
      method: "PUT",
      body: JSON.stringify({ titulo: "Projeto temporário atualizado", status: "concluido" }),
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.project.status, "concluido");

    assert.equal((await api(`/api/projects/${projectId}/favorite`, { method: "POST" })).status, 200);
    assert.equal((await api(`/api/projects/${projectId}/support`, { method: "POST" })).status, 200);
    assert.equal((await api(`/api/projects/${projectId}/comments`, {
      method: "POST",
      body: JSON.stringify({ texto: "Comentário temporário de validação." }),
    })).status, 201);

    const profile = await api("/api/auth/me", {
      method: "PUT",
      body: JSON.stringify({ nome: "Teste CRUD Atualizado", email: updatedEmail }),
    });
    assert.equal(profile.status, 200);
    assert.equal(profile.body.user.email, updatedEmail);

    assert.equal((await api(`/api/projects/${projectId}`, { method: "DELETE" })).status, 204);
    projectId = null;
    assert.equal((await api("/api/auth/me", { method: "DELETE" })).status, 204);
    token = "";

    console.log("CRUD hospedado validado e dados temporários removidos.");
  } finally {
    if (token) {
      if (projectId) await api(`/api/projects/${projectId}`, { method: "DELETE" }).catch(() => undefined);
      await api("/api/auth/me", { method: "DELETE" }).catch(() => undefined);
    }
  }
}

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
