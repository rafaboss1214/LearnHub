const fs = require("node:fs");
const net = require("node:net");
const path = require("node:path");
const env = require("../backend/src/config/env");
const { testDatabaseConnection, closeDatabasePool } = require("../backend/src/config/database");
const { getLocalIPv4Addresses, getPreferredLocalIPv4 } = require("../backend/src/utils/network");

function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.once("error", (error) => {
      if (error.code === "EADDRINUSE") resolve({ free: false, detail: "em uso" });
      else resolve({ free: false, detail: `erro ${error.code || error.message}` });
    });
    server.listen({ host: "0.0.0.0", port, exclusive: true }, () => {
      server.close(() => resolve({ free: true, detail: "livre" }));
    });
  });
}

async function checkHealth(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    const body = await response.json().catch(() => ({}));
    return { reachable: true, status: response.status, body };
  } catch {
    return { reachable: false };
  } finally {
    clearTimeout(timeout);
  }
}

async function diagnose() {
  const envExists = fs.existsSync(path.resolve(__dirname, "../backend/.env"));
  const addresses = getLocalIPv4Addresses();
  const preferredAddress = getPreferredLocalIPv4();
  const port = await checkPort(env.PORT);

  console.log("====================================");
  console.log("DIAGNÓSTICO LEARNHUB");
  console.log("====================================");
  console.log(`Node.js: ${process.version}`);
  console.log(`backend/.env: ${envExists ? "encontrado" : "NÃO encontrado"}`);
  console.log(`IP local preferencial: ${preferredAddress || "não encontrado"}`);
  console.log(`Interfaces válidas: ${addresses.map((item) => `${item.name}=${item.address}`).join(", ") || "nenhuma"}`);
  console.log(`Porta da API (${env.PORT}): ${port.detail}`);
  console.log(`DB_HOST: ${env.DB_HOST}`);
  console.log(`DB_PORT: ${env.DB_PORT}`);
  console.log(`DB_USER: ${env.DB_USER}`);
  console.log(`DB_NAME: ${env.DB_NAME}`);
  console.log(`JWT_SECRET: ${env.JWT_SECRET.length >= 32 ? "configurado" : "NÃO configurado corretamente"}`);
  console.log("DB_PASSWORD: não exibida");

  let databaseConnected = false;
  try {
    await testDatabaseConnection();
    databaseConnected = true;
    console.log("MySQL: respondeu com sucesso");
  } catch (error) {
    console.log(`MySQL: falhou (${error?.code || "erro desconhecido"})`);
  }

  const healthUrl = `http://127.0.0.1:${env.PORT}/api/health`;
  const health = await checkHealth(healthUrl);
  if (health.reachable) {
    console.log(`/api/health: HTTP ${health.status} ${JSON.stringify(health.body)}`);
  } else {
    console.log(`/api/health: não respondeu em ${healthUrl}`);
  }
  console.log("====================================");

  await closeDatabasePool().catch(() => undefined);
  if (!envExists || !databaseConnected || !health.reachable || health.status !== 200) process.exitCode = 1;
}

diagnose().catch((error) => {
  console.error("O diagnóstico falhou:", error.message);
  process.exitCode = 1;
});
