const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const usersRepository = require("../repositories/users-repository");
const AppError = require("../utils/app-error");

const VALID_USER_TYPES = new Set(["colaborador", "diretor"]);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BCRYPT_ROUNDS = 10;

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function validateRegistration({ nome, email, senha, tipo }) {
  const normalizedName = String(nome || "").trim();
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedName || !normalizedEmail || !senha || !tipo) {
    return "Preencha todos os campos obrigatórios.";
  }
  if (normalizedName.length > 150) return "O nome deve ter no máximo 150 caracteres.";
  if (normalizedEmail.length > 255 || !EMAIL_PATTERN.test(normalizedEmail)) {
    return "Informe um e-mail válido.";
  }
  if (String(senha).length < 8) return "A senha deve ter pelo menos 8 caracteres.";
  if (String(senha).length > 72) return "A senha deve ter no máximo 72 caracteres.";
  if (!VALID_USER_TYPES.has(tipo)) return "Tipo de usuário inválido.";
  return null;
}

function publicUser(user) {
  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    tipo: user.tipo_usuario,
    createdAt: user.created_at,
  };
}

function issueToken(user) {
  return jwt.sign(
    { sub: String(user.id), email: user.email, tipo: user.tipo_usuario },
    env.JWT_SECRET,
    { expiresIn: "8h" },
  );
}

async function register(payload) {
  const validationError = validateRegistration(payload || {});
  if (validationError) throw new AppError(400, validationError);

  const nome = String(payload.nome).trim();
  const email = normalizeEmail(payload.email);
  const senha = String(payload.senha);
  const tipo = payload.tipo;

  if (await usersRepository.findByEmail(email)) {
    throw new AppError(409, "Este e-mail já está cadastrado.");
  }

  const passwordHash = await bcrypt.hash(senha, BCRYPT_ROUNDS);
  const user = await usersRepository.create({ nome, email, passwordHash, tipo });
  return publicUser(user);
}

async function login(payload) {
  const email = normalizeEmail(payload?.email);
  const senha = String(payload?.senha || "");

  if (!email || !senha) throw new AppError(400, "Informe e-mail e senha.");
  if (!EMAIL_PATTERN.test(email)) throw new AppError(400, "Informe um e-mail válido.");

  const user = await usersRepository.findByEmail(email);
  const passwordMatches = user ? await bcrypt.compare(senha, user.senha) : false;
  if (!user || !passwordMatches) throw new AppError(401, "E-mail ou senha incorretos.");

  return { token: issueToken(user), user: publicUser(user) };
}

async function getUserById(id) {
  const user = await usersRepository.findById(id);
  if (!user) throw new AppError(404, "Usuário não encontrado.");
  return publicUser(user);
}

module.exports = {
  normalizeEmail,
  validateRegistration,
  publicUser,
  register,
  login,
  getUserById,
};
