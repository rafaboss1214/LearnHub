const communityService = require("../services/community-service");

async function listCollaborations(request, response) {
  return response.json({ success: true, collaborations: await communityService.listCollaborations(request.auth) });
}
async function createCollaboration(request, response) {
  const collaboration = await communityService.createCollaboration(request.params.projectId, request.body, request.auth);
  return response.status(201).json({ success: true, collaboration });
}
async function updateCollaboration(request, response) {
  return response.json({ success: true, collaboration: await communityService.updateCollaboration(request.params.id, request.body, request.auth) });
}
async function updateClosure(request, response) {
  return response.json({ success: true, collaboration: await communityService.updateClosure(request.params.id, request.body?.action, request.auth) });
}
async function listConversations(request, response) {
  return response.json({ success: true, conversations: await communityService.listConversations(request.auth) });
}
async function listMessages(request, response) {
  return response.json({ success: true, messages: await communityService.listMessages(request.params.id, request.auth) });
}
async function sendMessage(request, response) {
  return response.status(201).json({ success: true, message: await communityService.sendMessage(request.params.id, request.body, request.auth) });
}
async function markMessagesRead(request, response) {
  await communityService.markMessagesRead(request.params.id, request.auth);
  return response.status(204).end();
}
async function issueCertificate(request, response) {
  return response.json({ success: true, certificate: await communityService.issueCertificate(request.params.id, request.auth) });
}
async function getCertificate(request, response) {
  return response.json({ success: true, certificate: await communityService.getCertificate(request.params.code, request.auth) });
}
async function progress(request, response) {
  return response.json({ success: true, progress: await communityService.progress(request.auth) });
}
async function notifications(request, response) {
  return response.json({ success: true, notifications: await communityService.notifications(request.auth) });
}
async function reportProject(request, response) {
  return response.status(201).json({ success: true, report: await communityService.reportProject(request.params.projectId, request.body, request.auth) });
}
async function adminDashboard(request, response) {
  return response.json({ success: true, dashboard: await communityService.adminDashboard(request.auth) });
}
async function listReports(request, response) {
  return response.json({ success: true, reports: await communityService.listReports(request.auth) });
}
async function updateReport(request, response) {
  await communityService.updateReport(request.params.id, request.body, request.auth);
  return response.status(204).end();
}

module.exports = { listCollaborations, createCollaboration, updateCollaboration, updateClosure, listConversations, listMessages, sendMessage, markMessagesRead, issueCertificate, getCertificate, progress, notifications, reportProject, adminDashboard, listReports, updateReport };
