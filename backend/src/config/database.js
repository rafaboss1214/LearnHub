const mysql = require("mysql2/promise");
const env = require("./env");

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
