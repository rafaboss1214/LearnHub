const path = require("node:path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env.admin.local"), quiet: true });
const bcrypt = require("bcryptjs");
const users = require("../src/repositories/users-repository");
const { ensureDatabaseSchema } = require("../src/config/schema");
const { closeDatabasePool } = require("../src/config/database");
const { normalizeEmail, validateRegistration } = require("../src/services/auth-service");

async function createAdmin() {
  const email = normalizeEmail(process.env.ADMIN_EMAIL);
  const senha = process.env.ADMIN_PASSWORD || "";
  const nome = process.env.ADMIN_NAME || "Administrador LearnHub";
  const error = validateRegistration({ nome, email, senha, tipo: "diretor" });
  if (error) throw new Error(error);
  await ensureDatabaseSchema();
  const existing = await users.findByEmail(email);
  if (existing) {
    if (existing.tipo_usuario !== "admin") throw new Error("Esse e-mail pertence a outra conta. Escolha um e-mail exclusivo para o administrador.");
    console.log("Administrador já existe; a senha não foi alterada.");
    return;
  }
  await users.create({ nome, email, passwordHash: await bcrypt.hash(senha, 12), tipo: "admin" });
  console.log(`Administrador criado: ${email}`);
}
createAdmin().catch(error => { console.error(`Não foi possível provisionar o administrador: ${error.code || error.message}`); process.exitCode = 1; }).finally(closeDatabasePool);
