const express = require("express");
const controller = require("../controllers/media-controller");

const router = express.Router();
router.get("/media/users/:id/avatar", controller.avatar);
router.get("/media/projects/:id/cover", controller.projectCover);

module.exports = router;
