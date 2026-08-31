const path = require("node:path");
const dotenv = require("dotenv");

const envPath = path.resolve(__dirname, "../../.env");
dotenv.config({ path: envPath, quiet: true });

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

module.exports = Object.freeze({
  envPath,
  PORT: positiveInteger(process.env.PORT, 3000),
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_PORT: positiveInteger(process.env.DB_PORT, 3306),
  DB_USER: process.env.DB_USER || "root",
  DB_PASSWORD: process.env.DB_PASSWORD || "",
  DB_NAME: process.env.DB_NAME || "learnhub",
  DB_CONNECT_TIMEOUT: positiveInteger(process.env.DB_CONNECT_TIMEOUT, 5000),
  JWT_SECRET: process.env.JWT_SECRET || "",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
});
