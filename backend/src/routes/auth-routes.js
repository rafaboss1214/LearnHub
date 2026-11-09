const express = require("express");
const authController = require("../controllers/auth-controller");
const requireAuth = require("../middleware/auth-middleware");

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/request-reset", authController.requestPasswordReset);
router.post("/reset", authController.resetPassword);
router.get("/me", requireAuth, authController.me);
router.put("/me", requireAuth, authController.updateMe);
router.delete("/me", requireAuth, authController.deleteMe);
router.post("/institution", requireAuth, authController.requestInstitutionReview);

module.exports = router;
