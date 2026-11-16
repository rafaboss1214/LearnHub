const { pool } = require("./database");

const RESET_ID = "2026-11-16-presentation-clean-start";
const DEMO_EMAILS = [
  "diretor.apresentacao.13112026@learnhub.app",
  "colaborador.apresentacao.13112026@learnhub.app",
];
let presentationResetReady = false;
let demoAccountsReady = false;

const CONTENT_TABLES = [
  "denuncias_projetos",
  "recompensas_participacao",
  "encerramentos_colaboracao",
  "mensagens_colaboracao",
  "solicitacoes_colaboracao",
  "comentarios",
  "projetos_favoritos",
  "projetos_apoios",
  "projeto_categorias_apoio",
  "projeto_midias",
  "projetos",
];

async function hasDemoAccounts(connection) {
  const [rows] = await connection.execute(
    `SELECT COUNT(*) AS total FROM usuarios
     WHERE (email = ? AND tipo_usuario = 'diretor')
        OR (email = ? AND tipo_usuario = 'colaborador')`,
    DEMO_EMAILS,
  );
  return Number(rows[0]?.total || 0) === DEMO_EMAILS.length;
}

async function resetPresentationDataOnce(database = pool) {
  const connection = await database.getConnection();
  try {
    await connection.query(`CREATE TABLE IF NOT EXISTS manutencoes_aplicadas (
      id VARCHAR(190) NOT NULL,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);

    await connection.beginTransaction();
    const [marker] = await connection.execute(
      "INSERT IGNORE INTO manutencoes_aplicadas (id) VALUES (?)",
      [RESET_ID],
    );

    if (!marker.affectedRows) {
      const accountsReady = await hasDemoAccounts(connection);
      await connection.commit();
      presentationResetReady = true;
      demoAccountsReady = accountsReady;
      return { applied: false };
    }

    for (const table of CONTENT_TABLES) {
      await connection.query(`DELETE FROM ${table}`);
    }

    const emailPlaceholders = DEMO_EMAILS.map(() => "?").join(", ");
    await connection.execute(
      `DELETE recuperacao FROM tokens_recuperacao_senha recuperacao
       JOIN usuarios usuario ON usuario.id = recuperacao.usuario_id
       WHERE usuario.email IN (${emailPlaceholders})`,
      DEMO_EMAILS,
    );
    await connection.execute(
      `UPDATE perfis_usuarios perfil
       JOIN usuarios usuario ON usuario.id = perfil.usuario_id
       SET perfil.tipo_comunidade = IF(usuario.tipo_usuario = 'colaborador', 'comunidade', NULL),
           perfil.descricao = NULL,
           perfil.cep = NULL,
           perfil.rua = NULL,
           perfil.bairro = NULL,
           perfil.cidade = NULL,
           perfil.estado = NULL,
           perfil.latitude_aprox = NULL,
           perfil.longitude_aprox = NULL,
           perfil.numero = NULL,
           perfil.complemento = NULL,
           perfil.habilidades = NULL,
           perfil.evidencia_institucional = NULL,
           perfil.status_institucional = IF(usuario.tipo_usuario = 'diretor', 'nao_verificada', NULL),
           perfil.motivo_institucional = NULL,
           perfil.avatar_mime = NULL,
           perfil.avatar_data = NULL,
           perfil.avatar_updated_at = NULL
       WHERE usuario.email IN (${emailPlaceholders})`,
      DEMO_EMAILS,
    );
    await connection.execute(
      `UPDATE usuarios
       SET token_version = token_version + 1
       WHERE email IN (${emailPlaceholders})`,
      DEMO_EMAILS,
    );

    const accountsReady = await hasDemoAccounts(connection);
    await connection.commit();
    presentationResetReady = true;
    demoAccountsReady = accountsReady;
    console.log("Limpeza única da apresentação aplicada com sucesso.");
    return { applied: true };
  } catch (error) {
    await connection.rollback().catch(() => undefined);
    throw error;
  } finally {
    connection.release();
  }
}

function isPresentationResetReady() {
  return presentationResetReady;
}

function areDemoAccountsReady() {
  return demoAccountsReady;
}

module.exports = {
  CONTENT_TABLES,
  DEMO_EMAILS,
  RESET_ID,
  areDemoAccountsReady,
  isPresentationResetReady,
  resetPresentationDataOnce,
};
