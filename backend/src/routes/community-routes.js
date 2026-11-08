const express = require("express");
const controller = require("../controllers/community-controller");
const requireAuth = require("../middleware/auth-middleware");

const router = express.Router();
router.use(requireAuth);
router.get("/collaborations", controller.listCollaborations);
router.post("/projects/:projectId/requests", controller.createCollaboration);
router.post("/projects/:projectId/reports", controller.reportProject);
router.put("/collaborations/:id", controller.updateCollaboration);
router.post("/collaborations/:id/closure", controller.updateClosure);
router.post("/collaborations/:id/certificate", controller.issueCertificate);
router.get("/collaborations/:id/messages", controller.listMessages);
router.post("/collaborations/:id/messages", controller.sendMessage);
router.put("/collaborations/:id/messages/read", controller.markMessagesRead);
router.get("/conversations", controller.listConversations);
router.get("/certificates/:code", controller.getCertificate);
router.get("/progress", controller.progress);
router.get("/notifications", controller.notifications);
router.get("/admin/moderation/dashboard", controller.adminDashboard);
router.get("/admin/moderation/reports", controller.listReports);
router.put("/admin/moderation/reports/:id", controller.updateReport);

module.exports = router;
