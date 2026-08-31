const { pool } = require("../config/database");

const USER_COLUMNS = "id, nome, email, senha, tipo_usuario, created_at";

async function findByEmail(email) {
  const [rows] = await pool.execute(
    `SELECT ${USER_COLUMNS} FROM usuarios WHERE email = ? LIMIT 1`,
    [email],
  );
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT ${USER_COLUMNS} FROM usuarios WHERE id = ? LIMIT 1`,
    [id],
  );
  return rows[0] || null;
}

async function create({ nome, email, passwordHash, tipo }) {
  const [result] = await pool.execute(
    "INSERT INTO usuarios (nome, email, senha, tipo_usuario) VALUES (?, ?, ?, ?)",
    [nome, email, passwordHash, tipo],
  );
  return findById(result.insertId);
}

module.exports = { findByEmail, findById, create };
