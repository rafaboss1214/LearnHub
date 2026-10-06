const jwt = require("jsonwebtoken");
const env = require("../config/env");
const AppError = require("../utils/app-error");
const usersRepository = require("../repositories/users-repository");

async function requireAuth(request, _response, next) {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return next(new AppError(401, "Autenticação necessária."));

  try {
    request.auth = jwt.verify(token, env.JWT_SECRET);
    const user = await usersRepository.findById(request.auth.sub);
    if (!user) return next(new AppError(401, "Sessão inválida ou expirada."));
    request.auth.tipo = user.tipo_usuario;
    return next();
  } catch (error) {
    if (["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(error.name)) {
      return next(new AppError(401, "Sessão inválida ou expirada."));
    }
    return next(error);
  }
}

module.exports = requireAuth;
