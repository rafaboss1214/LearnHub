const bcrypt = require("bcryptjs");
const crypto = require("node:crypto");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const usersRepository = require("../repositories/users-repository");
const mailService = require("./mail-service");
const { sanitizeImage } = require("./media-service");
const AppError = require("../utils/app-error");

const VALID_USER_TYPES = new Set(["colaborador", "diretor"]);
const COMMUNITY_TYPES = new Set(["aluno", "responsavel", "comunidade"]);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BCRYPT_ROUNDS = 10;

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function optionalText(value, max) {
  const normalized = String(value || "").trim();
  if (normalized.length > max) throw new AppError(400, `Um dos campos excede o limite de ${max} caracteres.`);
  return normalized;
}

function normalizeAddress(payload = {}) {
  const cep = String(payload.cep || "").replace(/\D/g, "");
  const estado = String(payload.estado || "").trim().toUpperCase();
  if (cep && !/^\d{8}$/.test(cep)) throw new AppError(400, "Informe um CEP válido com 8 dígitos.");
  if (estado && !/^[A-Z]{2}$/.test(estado)) throw new AppError(400, "Informe a UF com duas letras.");
  return {
    cep,
    rua: optionalText(payload.rua, 100),
    bairro: optionalText(payload.bairro, 100),
    cidade: optionalText(payload.cidade, 100),
    estado,
    numero: optionalText(payload.numero, 20),
    complemento: optionalText(payload.complemento, 120),
  };
}

function validateRegistration(payload = {}) {
  const normalizedName = String(payload.nome || "").trim();
  const normalizedEmail = normalizeEmail(payload.email);
  if (!normalizedName || !normalizedEmail || !payload.senha || !payload.tipo) return "Preencha todos os campos obrigatórios.";
  if (normalizedName.length > 150) return "O nome deve ter no máximo 150 caracteres.";
  if (normalizedEmail.length > 255 || !EMAIL_PATTERN.test(normalizedEmail)) return "Informe um e-mail válido.";
  if (String(payload.senha).length < 10) return "A senha deve ter pelo menos 10 caracteres.";
  if (String(payload.senha).length > 72) return "A senha deve ter no máximo 72 caracteres.";
  if (!VALID_USER_TYPES.has(payload.tipo)) return "Tipo de usuário inválido.";
  if (payload.tipo === "colaborador" && !COMMUNITY_TYPES.has(payload.communityType)) return "Selecione como você participa da comunidade.";
  return null;
}

function publicUser(user) {
  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    tipo: user.tipo_usuario,
    communityType: user.tipo_comunidade || null,
    descricao: user.descricao || "",
    endereco: {
      cep: user.cep || "", rua: user.rua || "", bairro: user.bairro || "",
      cidade: user.cidade || "", estado: user.estado || "", numero: user.numero || "",
      complemento: user.complemento || "",
    },
    habilidades: user.habilidades || "",
    institutionEvidence: user.evidencia_institucional || "",
    institutionStatus: user.status_institucional || null,
    institutionReason: user.motivo_institucional || "",
    avatarPath: user.has_avatar ? `/api/media/users/${user.id}/avatar?v=${new Date(user.avatar_updated_at || 0).getTime()}` : "",
    createdAt: user.created_at,
  };
}

function issueToken(user) {
  return jwt.sign(
    { sub: String(user.id), email: user.email, tipo: user.tipo_usuario, ver: Number(user.token_version || 0) },
    env.JWT_SECRET,
    { expiresIn: "8h" },
  );
}

async function register(payload) {
  const validationError = validateRegistration(payload || {});
  if (validationError) throw new AppError(400, validationError);
  const nome = String(payload.nome).trim();
  const email = normalizeEmail(payload.email);
  if (await usersRepository.findByEmail(email)) throw new AppError(409, "Este e-mail já está cadastrado.");
  const profile = {
    ...normalizeAddress(payload),
    communityType: payload.tipo === "colaborador" ? payload.communityType : "",
    institutionEvidence: payload.tipo === "diretor" ? optionalText(payload.institutionEvidence, 1000) : "",
  };
  const passwordHash = await bcrypt.hash(String(payload.senha), BCRYPT_ROUNDS);
  return publicUser(await usersRepository.create({ nome, email, passwordHash, tipo: payload.tipo, profile }));
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

async function updateUser(id, payload) {
  const current = await usersRepository.findById(id);
  if (!current) throw new AppError(404, "Usuário não encontrado.");
  const fields = {};
  if (Object.hasOwn(payload || {}, "nome")) {
    const nome = String(payload.nome || "").trim();
    if (!nome || nome.length > 150) throw new AppError(400, "Informe um nome válido.");
    fields.nome = nome;
    if (current.tipo_usuario === "diretor" && nome !== current.nome && current.status_institucional === "aprovada") {
      fields.institutionStatus = "pendente";
      fields.institutionReason = "Nome institucional alterado. É necessária uma nova análise.";
    }
  }
  if (Object.hasOwn(payload || {}, "email")) {
    const email = normalizeEmail(payload.email);
    if (email.length > 255 || !EMAIL_PATTERN.test(email)) throw new AppError(400, "Informe um e-mail válido.");
    const existing = await usersRepository.findByEmail(email);
    if (existing && String(existing.id) !== String(id)) throw new AppError(409, "Este e-mail já está cadastrado.");
    fields.email = email;
  }
  if (Object.hasOwn(payload || {}, "senha") && payload.senha) {
    const senha = String(payload.senha);
    if (senha.length < 10 || senha.length > 72) throw new AppError(400, "A senha deve ter entre 10 e 72 caracteres.");
    fields.passwordHash = await bcrypt.hash(senha, BCRYPT_ROUNDS);
  }
  for (const [key, max] of [["descricao", 280], ["habilidades", 200]]) {
    if (Object.hasOwn(payload || {}, key)) fields[key] = optionalText(payload[key], max);
  }
  if (payload?.endereco && typeof payload.endereco === "object") Object.assign(fields, normalizeAddress(payload.endereco));
  if (Object.hasOwn(payload || {}, "avatarBase64") && payload.avatarBase64) {
    fields.avatar = await sanitizeImage(payload.avatarBase64, payload.avatarMime, "avatar");
  } else if (payload?.removeAvatar) {
    fields.removeAvatar = true;
  }
  if (!Object.keys(fields).length) throw new AppError(400, "Informe ao menos um campo para atualizar.");
  return publicUser(await usersRepository.update(id, fields));
}

async function requestPasswordReset(payload) {
  const email = normalizeEmail(payload?.email);
  if (!EMAIL_PATTERN.test(email)) throw new AppError(400, "Informe um e-mail válido.");
  if (!mailService.isConfigured()) throw new AppError(503, "Recuperação por e-mail ainda não configurada. Contate o responsável pelo LearnHub.");
  const user = await usersRepository.findByEmail(email);
  if (user) {
    const code = String(crypto.randomInt(100000, 1000000));
    const hash = crypto.createHash("sha256").update(`${email}:${code}:${env.JWT_SECRET}`).digest("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await usersRepository.createResetToken(user.id, hash, expiresAt);
    try {
      await mailService.sendPasswordResetCode({ to: user.email, name: user.nome, code });
    } catch {
      throw new AppError(503, "Não foi possível enviar o e-mail agora. Tente novamente mais tarde.");
    }
  }
  return { message: "Se a conta existir, enviaremos um código válido por 30 minutos." };
}

async function resetPassword(payload) {
  const email = normalizeEmail(payload?.email);
  const code = String(payload?.code || "").trim();
  const senha = String(payload?.senha || "");
  if (!EMAIL_PATTERN.test(email) || !/^\d{6}$/.test(code)) throw new AppError(400, "Informe o e-mail e o código de 6 dígitos.");
  if (senha.length < 10 || senha.length > 72) throw new AppError(400, "A senha deve ter entre 10 e 72 caracteres.");
  const user = await usersRepository.findByEmail(email);
  const hash = crypto.createHash("sha256").update(`${email}:${code}:${env.JWT_SECRET}`).digest("hex");
  const token = user ? await usersRepository.findValidResetToken(user.id, hash) : null;
  if (!user || !token) throw new AppError(400, "Código inválido ou expirado. Solicite outro.");
  await usersRepository.update(user.id, { passwordHash: await bcrypt.hash(senha, BCRYPT_ROUNDS) });
  await usersRepository.markResetTokenUsed(token.id);
  return { message: "Senha atualizada. Entre novamente com a nova senha." };
}

async function requestInstitutionReview(id, payload) {
  const user = await usersRepository.findById(id);
  if (!user) throw new AppError(404, "Usuário não encontrado.");
  if (user.tipo_usuario !== "diretor") throw new AppError(403, "Somente escolas podem solicitar o selo institucional.");
  const institutionEvidence = optionalText(payload?.institutionEvidence, 1000);
  if (institutionEvidence.length < 10) throw new AppError(400, "Informe os dados institucionais para análise.");
  return publicUser(await usersRepository.update(id, {
    institutionEvidence,
    institutionStatus: "pendente",
    institutionReason: "",
  }));
}

async function deleteUser(id) {
  if (!await usersRepository.remove(id)) throw new AppError(404, "Usuário não encontrado.");
}

module.exports = {
  normalizeEmail,
  normalizeAddress,
  validateRegistration,
  publicUser,
  register,
  login,
  getUserById,
  updateUser,
  requestPasswordReset,
  resetPassword,
  requestInstitutionReview,
  deleteUser,
};
