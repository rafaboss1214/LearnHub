const { testDatabaseConnection } = require("../config/database");
const { areDemoAccountsReady, isPresentationResetReady } = require("../config/presentation-reset");

async function health(_request, response) {
  try {
    await testDatabaseConnection();
    return response.status(200).json({
      success: true,
      api: "online",
      database: "connected",
      ...(isPresentationResetReady() ? { presentationReset: "applied" } : {}),
      ...(isPresentationResetReady()
        ? { presentationAccounts: areDemoAccountsReady() ? "ready" : "missing" }
        : {}),
    });
  } catch (error) {
    return response.status(503).json({
      success: false,
      api: "online",
      database: "disconnected",
      databaseError: error?.code || "UNKNOWN_DATABASE_ERROR",
      message: "A API está online, mas não conseguiu acessar o banco de dados.",
    });
  }
}

module.exports = { health };
