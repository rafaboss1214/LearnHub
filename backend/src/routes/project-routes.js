const express = require("express");
const projectController = require("../controllers/project-controller");
const requireAuth = require("../middleware/auth-middleware");

const router = express.Router();

router.use(requireAuth);
router.get("/", projectController.list);
router.post("/", projectController.create);
router.delete("/comments/:commentId", projectController.removeComment);
router.get("/:id", projectController.getById);
router.put("/:id", projectController.update);
router.delete("/:id", projectController.remove);
router.post("/:id/favorite", projectController.toggleFavorite);
router.post("/:id/support", projectController.toggleSupport);
router.post("/:id/comments", projectController.addComment);

module.exports = router;
