const { testDatabaseConnection } = require("../config/database");

async function health(_request, response) {
  try {
    await testDatabaseConnection();
    return response.status(200).json({
      success: true,
      api: "online",
      database: "connected",
    });
  } catch {
    return response.status(503).json({
      success: false,
      api: "online",
      database: "disconnected",
      message: "A API está online, mas não conseguiu acessar o banco de dados.",
    });
  }
}

module.exports = { health };
