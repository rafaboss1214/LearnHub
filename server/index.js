const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const cors = require("cors");
const Database = require("better-sqlite3");
const express = require("express");
const jwt = require("jsonwebtoken");

const port = Number(process.env.PORT || 3333);
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error("Defina JWT_SECRET com pelo menos 32 caracteres no arquivo server/.env.");
}

const dataDirectory = path.join(__dirname, "data");
fs.mkdirSync(dataDirectory, { recursive: true });
const db = new Database(path.join(dataDirectory, "learnhub.db"));
db.pragma("journal_mode = WAL");
db.exec(fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8"));

const app = express();
const allowedOrigins = (process.env.CORS_ORIGIN || "*").split(",").map((origin) => origin.trim());
app.use(cors({ origin: allowedOrigins.includes("*") ? true : allowedOrigins }));
app.use(express.json({ limit: "20kb" }));

const publicUser = (user) => ({ id: user.id, nome: user.nome, email: user.email, tipo: user.tipo, createdAt: user.created_at });
const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
};
const verifyPassword = (password, stored) => {
  const [algorithm, salt, hash] = String(stored).split("$");
  if (algorithm !== "scrypt" || !salt || !hash) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(derived, Buffer.from(hash, "hex"));
};
const issueToken = (user) => jwt.sign({ sub: user.id, email: user.email, tipo: user.tipo }, jwtSecret, { expiresIn: "8h" });

function validateRegistration({ nome, email, senha, tipo }) {
  if (!String(nome || "").trim() || !normalizeEmail(email) || !senha) return "Preencha todos os campos obrigatórios.";
  if (!/^\S+@\S+\.\S+$/.test(normalizeEmail(email))) return "Informe um e-mail válido.";
  if (String(senha).length < 8) return "A senha deve ter pelo menos 8 caracteres.";
  if (tipo && !["colaborador", "diretor"].includes(tipo)) return "Tipo de usuário inválido.";
  return null;
}

app.get("/health", (_request, response) => response.json({ status: "ok" }));

app.post("/cadastro", (request, response) => {
  const { nome, email, senha, tipo = "colaborador" } = request.body || {};
  const validationError = validateRegistration({ nome, email, senha, tipo });
  if (validationError) return response.status(400).json({ message: validationError });

  try {
    const result = db.prepare("INSERT INTO users (nome, email, password_hash, tipo) VALUES (?, ?, ?, ?)")
      .run(String(nome).trim(), normalizeEmail(email), hashPassword(String(senha)), tipo);
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);
    return response.status(201).json({ message: "Conta criada com sucesso.", user: publicUser(user) });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") return response.status(409).json({ message: "Este e-mail já está cadastrado." });
    console.error("Erro ao cadastrar usuário:", error);
    return response.status(500).json({ message: "Não foi possível criar a conta agora." });
  }
});

app.post("/login", (request, response) => {
  const email = normalizeEmail(request.body?.email);
  const senha = String(request.body?.senha || "");
  if (!email || !senha) return response.status(400).json({ message: "Informe e-mail e senha." });
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user || !verifyPassword(senha, user.password_hash)) return response.status(401).json({ message: "E-mail ou senha incorretos." });
  return response.json({ token: issueToken(user), user: publicUser(user) });
});

function requireAuth(request, response, next) {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return response.status(401).json({ message: "Autenticação necessária." });
  try {
    request.auth = jwt.verify(token, jwtSecret);
    return next();
  } catch {
    return response.status(401).json({ message: "Sessão inválida ou expirada." });
  }
}

app.get("/usuario/me", requireAuth, (request, response) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(request.auth.sub);
  if (!user) return response.status(404).json({ message: "Usuário não encontrado." });
  return response.json({ user: publicUser(user) });
});

app.listen(port, "0.0.0.0", () => console.log(`API LearnHub disponível em http://localhost:${port}`));
