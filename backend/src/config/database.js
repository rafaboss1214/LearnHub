const mysql = require("mysql2/promise");
const env = require("./env");

function sslOptions() {
  if (!env.DB_SSL) return undefined;
  return {
    rejectUnauthorized: true,
    ...(env.DB_SSL_CA_BASE64
      ? { ca: Buffer.from(env.DB_SSL_CA_BASE64, "base64").toString("utf8") }
      : {}),
  };
}

const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  charset: "utf8mb4",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: env.DB_CONNECT_TIMEOUT,
  ssl: sslOptions(),
});

async function testDatabaseConnection() {
  const connection = await pool.getConnection();
  try {
    await connection.query("SELECT 1 AS connection_test");
    return true;
  } finally {
    connection.release();
  }
}

async function closeDatabasePool() {
  await pool.end();
}

module.exports = { pool, testDatabaseConnection, closeDatabasePool };
