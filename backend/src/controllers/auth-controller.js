const authService = require("../services/auth-service");

async function register(request, response) {
  const user = await authService.register(request.body);
  return response.status(201).json({
    success: true,
    message: "Conta criada com sucesso.",
    user,
  });
}

async function login(request, response) {
  const result = await authService.login(request.body);
  return response.status(200).json({ success: true, ...result });
}

async function me(request, response) {
  const user = await authService.getUserById(request.auth.sub);
  return response.status(200).json({ success: true, user });
}

async function updateMe(request, response) {
  const user = await authService.updateUser(request.auth.sub, request.body);
  return response.status(200).json({ success: true, user });
}

async function deleteMe(request, response) {
  await authService.deleteUser(request.auth.sub);
  return response.status(204).end();
}

async function requestPasswordReset(request, response) {
  const result = await authService.requestPasswordReset(request.body);
  return response.status(200).json({ success: true, ...result });
}

async function resetPassword(request, response) {
  const result = await authService.resetPassword(request.body);
  return response.status(200).json({ success: true, ...result });
}

async function requestInstitutionReview(request, response) {
  const user = await authService.requestInstitutionReview(request.auth.sub, request.body);
  return response.status(200).json({ success: true, user });
}

module.exports = {
  register,
  login,
  me,
  updateMe,
  deleteMe,
  requestPasswordReset,
  resetPassword,
  requestInstitutionReview,
};
