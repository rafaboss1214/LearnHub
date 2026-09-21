const app = require("./app");
const env = require("./config/env");
const { testDatabaseConnection, closeDatabasePool } = require("./config/database");
const { ensureDatabaseSchema } = require("./config/schema");
const { getPreferredLocalIPv4 } = require("./utils/network");

const DATABASE_HINTS = {
  ECONNREFUSED: "O serviço MySQL/MariaDB pode estar parado ou a porta pode estar incorreta.",
  ETIMEDOUT: "O host do banco não respondeu dentro do tempo limite.",
  ENOTFOUND: "O host do banco não foi encontrado.",
  ER_ACCESS_DENIED_ERROR: "Usuário ou senha do banco estão incorretos, ou o usuário não tem permissão.",
  ER_BAD_DB_ERROR: "O banco ainda não existe. Importe database/database.sql.",
  ER_NO_SUCH_TABLE: "A tabela ainda não existe. Importe database/database.sql.",
};

function validateConfiguration() {
  if (env.JWT_SECRET.length < 32) {
    throw new Error(
      "JWT_SECRET ausente ou curto. Copie backend/.env.example para backend/.env e use pelo menos 32 caracteres.",
    );
  }
}

function printDatabaseFailure(error) {
  console.error("Banco de dados NÃO conectado.");
  console.error(`Host: ${env.DB_HOST}`);
  console.error(`Porta: ${env.DB_PORT}`);
  console.error(`Banco: ${env.DB_NAME}`);
  console.error(`Código: ${error?.code || "desconhecido"}`);
  console.error(
    `Possível problema: ${DATABASE_HINTS[error?.code] || "Revise o serviço MySQL e as configurações do arquivo backend/.env."}`,
  );
  console.error("A senha do banco não foi exibida.");
}

function printStartupSummary(databaseConnected) {
  const networkAddress = getPreferredLocalIPv4();
  const networkUrl = networkAddress ? `http://${networkAddress}:${env.PORT}` : null;

  console.log("====================================");
  console.log(databaseConnected ? "API INICIADA COM SUCESSO" : "API INICIADA COM BANCO DESCONECTADO");
  console.log("====================================");
  console.log(`Porta: ${env.PORT}`);
  console.log(`Local: http://localhost:${env.PORT}`);
  console.log(`Rede: ${networkUrl || "IPv4 privado não encontrado"}`);
  console.log(`Health: ${networkUrl || `http://localhost:${env.PORT}`}/api/health`);
  console.log(`Banco de dados: ${databaseConnected ? "CONECTADO" : "DESCONECTADO"}`);
  console.log("====================================");
}

async function startServer() {
  validateConfiguration();

  let databaseConnected = false;
  try {
    await ensureDatabaseSchema();
    await testDatabaseConnection();
    databaseConnected = true;
    console.log("Banco de dados conectado com sucesso.");
  } catch (error) {
    printDatabaseFailure(error);
  }

  const server = app.listen(env.PORT, "0.0.0.0", () => printStartupSummary(databaseConnected));

  server.on("error", async (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(`A porta ${env.PORT} já está em uso. Encerre o outro processo ou altere PORT em backend/.env.`);
    } else {
      console.error("Não foi possível iniciar a API:", error.message);
    }
    await closeDatabasePool().catch(() => undefined);
    process.exit(1);
  });

  let shuttingDown = false;
  async function shutdown() {
    if (shuttingDown) return;
    shuttingDown = true;
    const forceExit = setTimeout(() => process.exit(), 3000);
    forceExit.unref();
    server.close(async () => {
      await closeDatabasePool().catch(() => undefined);
      clearTimeout(forceExit);
      process.exit();
    });
    server.closeIdleConnections?.();
    server.closeAllConnections?.();
  }

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  return server;
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { startServer, validateConfiguration };
