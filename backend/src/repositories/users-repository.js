const { pool } = require("../config/database");

const USER_SELECT = `
  SELECT u.id, u.nome, u.email, u.senha, u.tipo_usuario, u.token_version, u.created_at,
         p.tipo_comunidade, p.descricao, p.cep, p.rua, p.bairro, p.cidade, p.estado,
         p.numero, p.complemento, p.habilidades, p.evidencia_institucional,
         p.status_institucional, p.motivo_institucional, p.avatar_updated_at,
         (p.avatar_data IS NOT NULL) AS has_avatar
  FROM usuarios u
  LEFT JOIN perfis_usuarios p ON p.usuario_id = u.id
`;

async function findByEmail(email) {
  const [rows] = await pool.execute(`${USER_SELECT} WHERE u.email = ? LIMIT 1`, [email]);
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.execute(`${USER_SELECT} WHERE u.id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

async function create({ nome, email, passwordHash, tipo, profile = {} }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      "INSERT INTO usuarios (nome, email, senha, tipo_usuario) VALUES (?, ?, ?, ?)",
      [nome, email, passwordHash, tipo],
    );
    await connection.execute(
      `INSERT INTO perfis_usuarios
        (usuario_id, tipo_comunidade, cep, rua, bairro, cidade, estado, numero, complemento,
         evidencia_institucional, status_institucional)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        result.insertId,
        profile.communityType || null,
        profile.cep || null,
        profile.rua || null,
        profile.bairro || null,
        profile.cidade || null,
        profile.estado || null,
        profile.numero || null,
        profile.complemento || null,
        profile.institutionEvidence || null,
        tipo === "diretor" ? "nao_verificada" : null,
      ],
    );
    await connection.commit();
    return findById(result.insertId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function update(id, fields) {
  const accountColumns = { nome: "nome", email: "email", passwordHash: "senha" };
  const profileColumns = {
    communityType: "tipo_comunidade",
    descricao: "descricao",
    cep: "cep",
    rua: "rua",
    bairro: "bairro",
    cidade: "cidade",
    estado: "estado",
    numero: "numero",
    complemento: "complemento",
    habilidades: "habilidades",
    institutionEvidence: "evidencia_institucional",
    institutionStatus: "status_institucional",
    institutionReason: "motivo_institucional",
  };
  const accountEntries = Object.entries(fields).filter(([key]) => accountColumns[key]);
  const profileEntries = Object.entries(fields).filter(([key]) => profileColumns[key]);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    if (accountEntries.length) {
      const set = accountEntries.map(([key]) => `${accountColumns[key]} = ?`);
      if (Object.hasOwn(fields, "passwordHash")) set.push("token_version = token_version + 1");
      await connection.execute(
        `UPDATE usuarios SET ${set.join(", ")} WHERE id = ?`,
        [...accountEntries.map(([, value]) => value), id],
      );
    }
    if (profileEntries.length) {
      await connection.execute("INSERT IGNORE INTO perfis_usuarios (usuario_id) VALUES (?)", [id]);
      await connection.execute(
        `UPDATE perfis_usuarios SET ${profileEntries.map(([key]) => `${profileColumns[key]} = ?`).join(", ")} WHERE usuario_id = ?`,
        [...profileEntries.map(([, value]) => value || null), id],
      );
    }
    if (fields.avatar) {
      await connection.execute(
        `UPDATE perfis_usuarios SET avatar_mime=?, avatar_data=?, avatar_updated_at=CURRENT_TIMESTAMP WHERE usuario_id=?`,
        [fields.avatar.mime, fields.avatar.data, id],
      );
    } else if (fields.removeAvatar) {
      await connection.execute(
        `UPDATE perfis_usuarios SET avatar_mime=NULL, avatar_data=NULL, avatar_updated_at=CURRENT_TIMESTAMP WHERE usuario_id=?`,
        [id],
      );
    }
    await connection.commit();
    return findById(id);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function getAvatar(id) {
  const [rows] = await pool.execute(
    "SELECT avatar_mime AS mime, avatar_data AS data, avatar_updated_at AS updatedAt FROM perfis_usuarios WHERE usuario_id=? LIMIT 1",
    [id],
  );
  return rows[0]?.data ? rows[0] : null;
}

async function createResetToken(userId, tokenHash, expiresAt) {
  await pool.execute(
    "UPDATE tokens_recuperacao_senha SET used_at=CURRENT_TIMESTAMP WHERE usuario_id=? AND used_at IS NULL",
    [userId],
  );
  await pool.execute(
    "INSERT INTO tokens_recuperacao_senha (usuario_id, token_hash, expires_at) VALUES (?, ?, ?)",
    [userId, tokenHash, expiresAt],
  );
}

async function findValidResetToken(userId, tokenHash) {
  const [rows] = await pool.execute(
    `SELECT id FROM tokens_recuperacao_senha
     WHERE usuario_id=? AND token_hash=? AND used_at IS NULL AND expires_at>CURRENT_TIMESTAMP
     ORDER BY id DESC LIMIT 1`,
    [userId, tokenHash],
  );
  return rows[0] || null;
}

async function markResetTokenUsed(id) {
  await pool.execute("UPDATE tokens_recuperacao_senha SET used_at=CURRENT_TIMESTAMP WHERE id=?", [id]);
}

async function remove(id) {
  const [result] = await pool.execute("DELETE FROM usuarios WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

module.exports = {
  findByEmail,
  findById,
  create,
  update,
  getAvatar,
  createResetToken,
  findValidResetToken,
  markResetTokenUsed,
  remove,
};
