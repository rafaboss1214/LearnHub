const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeEmail, publicUser, validateRegistration } = require("../src/services/auth-service");

test("normaliza e-mail antes de consultar o banco", () => {
  assert.equal(normalizeEmail("  Pessoa@Example.COM "), "pessoa@example.com");
});

test("aceita os campos reais da tela de cadastro", () => {
  assert.equal(
    validateRegistration({
      nome: "Pessoa Teste",
      email: "pessoa@example.com",
      senha: "SenhaSegura123",
      tipo: "colaborador",
    }),
    null,
  );
  assert.equal(
    validateRegistration({
      nome: "Diretora Teste",
      email: "diretora@example.com",
      senha: "SenhaSegura123",
      tipo: "diretor",
    }),
    null,
  );
});

test("rejeita cadastro inválido", () => {
  assert.equal(validateRegistration({}), "Preencha todos os campos obrigatórios.");
  assert.equal(
    validateRegistration({ nome: "Teste", email: "invalido", senha: "SenhaSegura123", tipo: "colaborador" }),
    "Informe um e-mail válido.",
  );
  assert.equal(
    validateRegistration({ nome: "Teste", email: "a@b.com", senha: "curta", tipo: "colaborador" }),
    "A senha deve ter pelo menos 8 caracteres.",
  );
  assert.equal(
    validateRegistration({ nome: "Teste", email: "a@b.com", senha: "SenhaSegura123", tipo: "escola" }),
    "Tipo de usuário inválido.",
  );
});

test("resposta pública nunca inclui o hash da senha", () => {
  const result = publicUser({
    id: 1,
    nome: "Pessoa",
    email: "pessoa@example.com",
    senha: "$2b$10$hash",
    tipo_usuario: "colaborador",
    created_at: new Date("2026-01-01T00:00:00.000Z"),
  });
  assert.equal(result.tipo, "colaborador");
  assert.equal(Object.hasOwn(result, "senha"), false);
});
