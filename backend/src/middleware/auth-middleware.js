const jwt = require("jsonwebtoken");
const env = require("../config/env");
const AppError = require("../utils/app-error");

function requireAuth(request, _response, next) {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return next(new AppError(401, "Autenticação necessária."));

  try {
    request.auth = jwt.verify(token, env.JWT_SECRET);
    return next();
  } catch {
    return next(new AppError(401, "Sessão inválida ou expirada."));
  }
}

module.exports = requireAuth;
