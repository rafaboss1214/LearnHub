const { pool } = require("../config/database");

const PROJECT_SELECT = `
  SELECT
    p.id,
    p.titulo,
    p.descricao,
    p.categoria,
    p.imagem_url,
    p.status,
    p.criador_id,
    p.created_at,
    p.updated_at,
    u.nome AS criador_nome,
    (SELECT COUNT(*) FROM projetos_favoritos pf WHERE pf.projeto_id = p.id) AS total_favoritos,
    (SELECT COUNT(*) FROM projetos_apoios pa WHERE pa.projeto_id = p.id) AS total_apoios,
    EXISTS(
      SELECT 1 FROM projetos_favoritos pf
      WHERE pf.projeto_id = p.id AND pf.usuario_id = ?
    ) AS favorito,
    EXISTS(
      SELECT 1 FROM projetos_apoios pa
      WHERE pa.projeto_id = p.id AND pa.usuario_id = ?
    ) AS apoiado
  FROM projetos p
  LEFT JOIN usuarios u ON u.id = p.criador_id
`;

async function list(userId) {
  const [rows] = await pool.execute(
    `${PROJECT_SELECT} ORDER BY favorito DESC, p.created_at DESC`,
    [userId, userId],
  );
  return rows;
}

async function findById(id, userId) {
  const [rows] = await pool.execute(
    `${PROJECT_SELECT} WHERE p.id = ? LIMIT 1`,
    [userId, userId, id],
  );
  if (!rows[0]) return null;

  const [comments] = await pool.execute(
    `SELECT c.id, c.texto, c.usuario_id, c.created_at, u.nome AS usuario_nome
     FROM comentarios c
     LEFT JOIN usuarios u ON u.id = c.usuario_id
     WHERE c.projeto_id = ?
     ORDER BY c.created_at ASC`,
    [id],
  );
  return { ...rows[0], comments };
}

async function create({ titulo, descricao, categoria, imagemUrl, status, creatorId }) {
  const [result] = await pool.execute(
    `INSERT INTO projetos (titulo, descricao, categoria, imagem_url, status, criador_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [titulo, descricao, categoria, imagemUrl || null, status, creatorId],
  );
  return result.insertId;
}

async function update(id, fields) {
  const columns = {
    titulo: "titulo",
    descricao: "descricao",
    categoria: "categoria",
    imagemUrl: "imagem_url",
    status: "status",
  };
  const entries = Object.entries(fields).filter(([key]) => columns[key]);
  if (!entries.length) return false;

  const setClause = entries.map(([key]) => `${columns[key]} = ?`).join(", ");
  const values = entries.map(([, value]) => value === "" ? null : value);
  const [result] = await pool.execute(
    `UPDATE projetos SET ${setClause} WHERE id = ?`,
    [...values, id],
  );
  return result.affectedRows > 0;
}

async function remove(id) {
  const [result] = await pool.execute("DELETE FROM projetos WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

async function toggleRelation(table, projectId, userId) {
  const allowedTables = new Set(["projetos_favoritos", "projetos_apoios"]);
  if (!allowedTables.has(table)) throw new Error("Tabela de relação inválida.");

  const [deleted] = await pool.execute(
    `DELETE FROM ${table} WHERE projeto_id = ? AND usuario_id = ?`,
    [projectId, userId],
  );
  if (deleted.affectedRows > 0) return false;

  await pool.execute(
    `INSERT IGNORE INTO ${table} (projeto_id, usuario_id) VALUES (?, ?)`,
    [projectId, userId],
  );
  return true;
}

async function createComment({ projectId, userId, text }) {
  const [result] = await pool.execute(
    "INSERT INTO comentarios (projeto_id, usuario_id, texto) VALUES (?, ?, ?)",
    [projectId, userId, text],
  );
  const [rows] = await pool.execute(
    `SELECT c.id, c.texto, c.usuario_id, c.created_at, u.nome AS usuario_nome
     FROM comentarios c
     LEFT JOIN usuarios u ON u.id = c.usuario_id
     WHERE c.id = ? LIMIT 1`,
    [result.insertId],
  );
  return rows[0];
}

async function findCommentById(id) {
  const [rows] = await pool.execute(
    "SELECT id, projeto_id, usuario_id FROM comentarios WHERE id = ? LIMIT 1",
    [id],
  );
  return rows[0] || null;
}

async function removeComment(id) {
  const [result] = await pool.execute("DELETE FROM comentarios WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

module.exports = {
  list,
  findById,
  create,
  update,
  remove,
  toggleRelation,
  createComment,
  findCommentById,
  removeComment,
};
