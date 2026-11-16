const test = require("node:test");
const assert = require("node:assert/strict");
const { SUPPORT_CATEGORIES, serializeRequest, buildProgress, calculateStreak } = require("../src/services/community-service");

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
  });
  assert.equal(result.project.title, "Horta escolar");
  assert.equal(result.supporter.name, "Marina");
  assert.deepEqual(result.closure, { requestedBy: 4, schoolConfirmed: false, supporterConfirmed: true });
  assert.equal(Object.hasOwn(result, "escola_id"), false);
});

test("monta a jornada própria do colaborador a partir da atividade real", () => {
  const result = buildProgress({ xp: 80, completed: 4, collaborations: 6, active: 2, messages: 28, projects: 0, streak: 3, userType: "colaborador" });
  assert.equal(result.progressType, "colaborador");
  assert.equal(result.level, 3);
  assert.equal(result.levelTitle, "Parceiro");
  assert.equal(result.nextLevelXp, 120);
  assert.equal(result.xpForNextLevel, 40);
  assert.equal(result.achievements.find((item) => item.id === "supporter_teamwork").unlocked, true);
  assert.equal(result.achievements.find((item) => item.id === "supporter_community_hero").unlocked, false);
  assert.equal(result.missions.length, 4);
  assert.equal(result.missions.every((item) => item.id.startsWith("supporter_")), true);
});

test("mantém missões, níveis e selos da escola separados dos colaboradores", () => {
  const school = buildProgress({ xp: 80, completed: 2, collaborations: 4, active: 2, messages: 12, projects: 3, streak: 4, userType: "diretor" });
  const supporter = buildProgress({ xp: 80, completed: 2, collaborations: 4, active: 2, messages: 12, projects: 0, streak: 4, userType: "colaborador" });
  assert.equal(school.progressType, "escola");
  assert.equal(school.levelTitle, "Escola parceira");
  assert.equal(school.achievements.every((item) => item.id.startsWith("school_")), true);
  assert.equal(school.missions.every((item) => item.id.startsWith("school_")), true);
  assert.equal(supporter.achievements.every((item) => item.id.startsWith("supporter_")), true);
  assert.equal(school.achievements.some((item) => supporter.achievements.some((other) => other.id === item.id)), false);
});

test("calcula a sequência de dias de atividade", () => {
  const today = new Date();
  const yesterday = new Date(today); yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  assert.equal(calculateStreak([today.toISOString().slice(0, 10), yesterday.toISOString().slice(0, 10)]), 2);
});
