const test = require("node:test");
const assert = require("node:assert/strict");
const { SUPPORT_CATEGORIES, serializeRequest } = require("../src/services/community-service");

test("mantém as categorias de colaboração definidas pelo site", () => {
  assert.deepEqual(SUPPORT_CATEGORIES, [
    "Mão de obra",
    "Recursos materiais",
    "Conhecimento",
    "Serviços",
    "Outros",
  ]);
});

test("serializa solicitação sem expor campos internos do banco", () => {
  const result = serializeRequest({
    id: 7,
    projeto_id: 2,
    projeto_titulo: "Horta escolar",
    projeto_status: "publicado",
    escola_id: 3,
    escola_nome: "Escola Horizonte",
    colaborador_id: 4,
    colaborador_nome: "Marina",
    categoria: "Conhecimento",
    descricao: "Apoio com oficinas para os estudantes.",
    disponibilidade: "Sábados",
    status: "aceita",
    motivo_recusa: null,
    created_at: new Date("2026-01-01T00:00:00Z"),
    updated_at: new Date("2026-01-02T00:00:00Z"),
    accepted_at: new Date("2026-01-02T00:00:00Z"),
    completed_at: null,
    solicitado_por: 4,
    escola_confirmou: 0,
    colaborador_confirmou: 1,
    certificado_codigo: null,
  });
  assert.equal(result.project.title, "Horta escolar");
  assert.equal(result.supporter.name, "Marina");
  assert.deepEqual(result.closure, { requestedBy: 4, schoolConfirmed: false, supporterConfirmed: true });
  assert.equal(Object.hasOwn(result, "escola_id"), false);
});
