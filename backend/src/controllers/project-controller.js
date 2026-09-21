const projectService = require("../services/project-service");

async function list(request, response) {
  const projects = await projectService.list(request.auth);
  return response.status(200).json({ success: true, projects });
}

async function getById(request, response) {
  const project = await projectService.getById(request.params.id, request.auth);
  return response.status(200).json({ success: true, project });
}

async function create(request, response) {
  const project = await projectService.create(request.body, request.auth);
  return response.status(201).json({ success: true, project });
}

async function update(request, response) {
  const project = await projectService.update(request.params.id, request.body, request.auth);
  return response.status(200).json({ success: true, project });
}

async function remove(request, response) {
  await projectService.remove(request.params.id, request.auth);
  return response.status(204).end();
}

async function toggleFavorite(request, response) {
  const result = await projectService.toggleFavorite(request.params.id, request.auth);
  return response.status(200).json({ success: true, ...result });
}

async function toggleSupport(request, response) {
  const result = await projectService.toggleSupport(request.params.id, request.auth);
  return response.status(200).json({ success: true, ...result });
}

async function addComment(request, response) {
  const comment = await projectService.addComment(request.params.id, request.body, request.auth);
  return response.status(201).json({ success: true, comment });
}

async function removeComment(request, response) {
  await projectService.removeComment(request.params.commentId, request.auth);
  return response.status(204).end();
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  toggleFavorite,
  toggleSupport,
  addComment,
  removeComment,
};
