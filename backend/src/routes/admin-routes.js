const express = require("express");
const requireAuth = require("../middleware/auth-middleware");
const users = require("../repositories/users-repository");
const { pool } = require("../config/database");
const AppError = require("../utils/app-error");

const router = express.Router();
router.use(requireAuth);
router.use(async (request, _response, next) => {
  try {
    const user = await users.findById(request.auth.sub);
    if (user?.tipo_usuario !== "admin") throw new AppError(403, "Acesso exclusivo de administrador.");
    next();
  } catch (error) { next(error); }
});
router.get("/dashboard", async (_request, response, next) => {
  try {
    const [rows] = await pool.query(`SELECT
      (SELECT COUNT(*) FROM usuarios) AS usuarios,
      (SELECT COUNT(*) FROM usuarios WHERE tipo_usuario = 'diretor') AS diretores,
      (SELECT COUNT(*) FROM projetos) AS projetos,
      (SELECT COUNT(*) FROM projetos WHERE status = 'concluido') AS concluidos,
      (SELECT COUNT(*) FROM projetos_apoios) AS apoios,
      (SELECT COUNT(*) FROM projetos_favoritos) AS favoritos,
      (SELECT COUNT(*) FROM comentarios) AS comentarios`);
    const [categories] = await pool.query("SELECT categoria, COUNT(*) AS total FROM projetos GROUP BY categoria ORDER BY total DESC");
    response.json({ dashboard: { ...Object.fromEntries(Object.entries(rows[0]).map(([key, value]) => [key, Number(value)])), categorias: categories.map(item => ({ ...item, total: Number(item.total) })) } });
  } catch (error) { next(error); }
});
module.exports = router;
