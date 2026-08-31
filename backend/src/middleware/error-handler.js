const AppError = require("../utils/app-error");

const DATABASE_ERROR_CODES = new Set([
  "ECONNREFUSED",
  "ECONNRESET",
  "ETIMEDOUT",
  "ENOTFOUND",
  "PROTOCOL_CONNECTION_LOST",
  "ER_ACCESS_DENIED_ERROR",
  "ER_BAD_DB_ERROR",
  "ER_NO_SUCH_TABLE",
]);

function isDatabaseError(error) {
  return DATABASE_ERROR_CODES.has(error?.code);
}

function notFound(request, _response, next) {
  next(new AppError(404, `Rota não encontrada: ${request.method} ${request.originalUrl}`));
}

function errorHandler(error, _request, response, _next) {
  if (error instanceof AppError) {
    return response.status(error.status).json({ success: false, message: error.message });
  }

  if (error?.code === "ER_DUP_ENTRY") {
    return response.status(409).json({ success: false, message: "Este e-mail já está cadastrado." });
  }

  if (isDatabaseError(error)) {
    console.error(`Erro de banco de dados (${error.code}).`);
    return response.status(503).json({
      success: false,
      message: "Banco de dados indisponível. Verifique se o MySQL está iniciado e configurado.",
    });
  }

  console.error("Erro inesperado na API:", error);
  return response.status(500).json({
    success: false,
    message: "Não foi possível concluir a solicitação agora.",
  });
}

module.exports = { notFound, errorHandler, isDatabaseError };
