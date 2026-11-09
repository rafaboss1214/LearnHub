const usersRepository = require("../repositories/users-repository");
const { pool } = require("../config/database");

function sendImage(response, media) {
  if (!media) return response.status(404).json({ success: false, message: "Imagem não encontrada." });
  response.set({
    "Content-Type": media.mime,
    "Cache-Control": "public, max-age=86400, immutable",
    "Content-Length": media.data.length,
  });
  return response.status(200).send(media.data);
}

async function avatar(request, response) {
  return sendImage(response, await usersRepository.getAvatar(request.params.id));
}

async function projectCover(request, response) {
  const [rows] = await pool.execute(
    "SELECT capa_mime AS mime, capa_data AS data FROM projeto_midias WHERE projeto_id=? LIMIT 1",
    [request.params.id],
  );
  return sendImage(response, rows[0] || null);
}

module.exports = { avatar, projectCover };
