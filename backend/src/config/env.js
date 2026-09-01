const path = require("node:path");
const dotenv = require("dotenv");

const envPath = path.resolve(__dirname, "../../.env");
dotenv.config({ path: envPath, quiet: true });

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function boolean(value, fallback = false) {
  if (value == null || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
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
  DB_SSL: boolean(process.env.DB_SSL),
  DB_SSL_CA_BASE64: process.env.DB_SSL_CA_BASE64 || "",
  JWT_SECRET: process.env.JWT_SECRET || "",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
});
