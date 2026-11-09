const sharp = require("sharp");
const AppError = require("../utils/app-error");

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_INPUT_BYTES = 3 * 1024 * 1024;
const MAX_PIXELS = 16_000_000;

function decodeImage(base64, mime) {
  const content = String(base64 || "").replace(/^data:[^;]+;base64,/, "");
  if (!content || !ALLOWED_MIME_TYPES.has(String(mime || "").toLowerCase())) {
    throw new AppError(400, "Escolha uma imagem JPG, PNG ou WebP.");
  }
  const buffer = Buffer.from(content, "base64");
  if (!buffer.length || buffer.length > MAX_INPUT_BYTES) {
    throw new AppError(400, "A imagem deve ter no máximo 3 MB.");
  }
  return buffer;
}

async function sanitizeImage(base64, mime, kind) {
  const buffer = decodeImage(base64, mime);
  try {
    const source = sharp(buffer, { animated: false, limitInputPixels: MAX_PIXELS });
    const metadata = await source.metadata();
    if (!new Set(["jpeg", "png", "webp"]).has(metadata.format) || (metadata.pages || 1) > 1) {
      throw new Error("Formato não permitido");
    }
    const size = kind === "avatar"
      ? { width: 512, height: 512, fit: "cover" }
      : { width: 1600, height: 900, fit: "cover" };
    const data = await source
      .rotate()
      .resize({ ...size, withoutEnlargement: true, position: "centre" })
      .jpeg({ quality: 84, mozjpeg: true })
      .toBuffer();
    return { mime: "image/jpeg", data };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(400, "A imagem não pôde ser processada. Escolha outro arquivo.");
  }
}

module.exports = { sanitizeImage };
