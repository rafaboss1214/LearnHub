const test = require("node:test");
const assert = require("node:assert/strict");
const sharp = require("sharp");
const { databaseEndpoint } = require("../src/config/env");
const { normalizeAddress, normalizeEmail, publicUser, validateRegistration } = require("../src/services/auth-service");
const { sanitizeImage } = require("../src/services/media-service");
const { publicProject } = require("../src/services/project-service");

test("normaliza host MySQL copiado como URL ou host com porta", () => {
  assert.deepEqual(databaseEndpoint(" mysql://db.example.com:24876/defaultdb ", 3306), {
    host: "db.example.com",
    port: 24876,
  });
  assert.deepEqual(databaseEndpoint("db.example.com:24876", 3306), {
    host: "db.example.com",
    port: 24876,
  });
});

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
      communityType: "aluno",
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
    validateRegistration({ nome: "Teste", email: "a@b.com", senha: "curta", tipo: "colaborador", communityType: "aluno" }),
    "A senha deve ter pelo menos 10 caracteres.",
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

test("normaliza endereço privado e valida CEP/UF", () => {
  assert.deepEqual(normalizeAddress({ cep: "01001-000", cidade: "São Paulo", estado: "sp" }), {
    cep: "01001000", rua: "", bairro: "", cidade: "São Paulo", estado: "SP", latitudeAprox: null, longitudeAprox: null, numero: "", complemento: "",
  });
  assert.throws(() => normalizeAddress({ cep: "123" }), /CEP válido/);
  const located = normalizeAddress({ cep: "11712-400", cidade: "Praia Grande", estado: "SP", latitudeAprox: -24.0357, longitudeAprox: -46.5253 });
  assert.equal(located.latitudeAprox, -24.0357);
  assert.equal(located.longitudeAprox, -46.5253);
  assert.throws(() => normalizeAddress({ latitudeAprox: 100 }), /Latitude aproximada inválida/);
});

test("projeto público não expõe endereço ou localização", () => {
  const project = publicProject({
    id: 9, titulo: "Horta comunitária", descricao: "Projeto de demonstração para o bairro.", categoria: "Meio ambiente",
    imagem_url: null, has_cover: 0, status: "publicado", criador_id: 2, criador_nome: "Escola Samambaia",
    local_rua: "Avenida do Corretor de Imóveis", local_bairro: "Samambaia", local_cidade: "Praia Grande",
    local_estado: "SP", local_latitude: "-24.03570", local_longitude: "-46.52530", cep: "11712400", numero: "123",
    total_favoritos: 0, total_apoios: 0, favorito: 0, apoiado: 0, created_at: new Date(), updated_at: new Date(),
  });
  assert.equal(Object.hasOwn(project, "location"), false);
  assert.equal(Object.hasOwn(project, "cep"), false);
  assert.equal(Object.hasOwn(project, "numero"), false);
});

test("processa upload e remove metadados em JPEG", async () => {
  const source = await sharp({ create: { width: 800, height: 600, channels: 3, background: "#7620c8" } }).png().toBuffer();
  const image = await sanitizeImage(source.toString("base64"), "image/png", "avatar");
  const metadata = await sharp(image.data).metadata();
  assert.equal(image.mime, "image/jpeg");
  assert.equal(metadata.width, 512);
  assert.equal(metadata.height, 512);
});
