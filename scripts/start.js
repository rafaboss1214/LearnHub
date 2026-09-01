const { spawn } = require("node:child_process");
const net = require("node:net");
const path = require("node:path");
const dotenv = require("dotenv");
const { getPreferredLocalIPv4 } = require("../backend/src/utils/network");

const projectRoot = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(projectRoot, ".env"), quiet: true });
const connectionMode = process.argv.includes("--tunnel") ? "--tunnel" : "--lan";

async function learnHubApiIsRunning() {
  try {
    const response = await fetch("http://127.0.0.1:3000/api/health", {
      signal: AbortSignal.timeout(1500),
    });
    const body = await response.json();
    return response.ok && body?.success === true && body?.api === "online";
  } catch {
    return false;
  }
}

function portIsOpen(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: "127.0.0.1", port });
    const finish = (isOpen) => {
      socket.destroy();
      resolve(isOpen);
    };
    socket.setTimeout(750);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
  });
}

function startApiTunnel() {
  const executable = path.join(projectRoot, "tools", "cloudflared.exe");
  const child = spawn(executable, ["tunnel", "--url", "http://127.0.0.1:3000", "--no-autoupdate"], {
    cwd: projectRoot,
    stdio: ["ignore", "pipe", "pipe"],
  });

  const ready = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("O túnel da API não respondeu a tempo.")), 30000);
    const inspect = (chunk) => {
      const match = chunk.toString().match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
      if (match) {
        clearTimeout(timeout);
        resolve(match[0]);
      }
    };
    child.stdout.on("data", inspect);
    child.stderr.on("data", inspect);
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code && code !== 0) reject(new Error(`O túnel da API encerrou com código ${code}.`));
    });
  });

  return { child, ready };
}

async function main() {
  const apiAlreadyRunning = await learnHubApiIsRunning();
  const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim() || null;
  if (connectionMode === "--lan" && apiAlreadyRunning && (await portIsOpen(8081))) {
    console.log("LearnHub já está em execução (API na porta 3000 e Expo na porta 8081).");
    console.log("Use o terminal que já está aberto ou pressione R no Expo Go para recarregar.");
    return;
  }

  let api = null;
  if (connectionMode === "--tunnel" && configuredApiUrl) {
    console.log(`[API] Backend hospedado configurado: ${configuredApiUrl}`);
  } else if (apiAlreadyRunning) {
    console.log("[API] LearnHub já está ativa na porta 3000; reutilizando o processo existente.");
  } else {
    api = spawn(process.execPath, ["backend/src/server.js"], {
      cwd: projectRoot,
      stdio: "inherit",
    });
    api.on("error", (error) => console.error("[API] Não foi possível iniciar:", error.message));
  }

  let apiTunnel = null;
  let publicApiUrl = configuredApiUrl;
  if (connectionMode === "--tunnel" && !publicApiUrl) {
    const tunnel = startApiTunnel();
    apiTunnel = tunnel.child;
    publicApiUrl = await tunnel.ready;
    console.log(`[API] Túnel público conectado: ${publicApiUrl}`);
  } else if (connectionMode === "--tunnel" && publicApiUrl) {
    console.log(`[API] Usando API hospedada: ${publicApiUrl}`);
  }

  // O Expo recebe o TTY diretamente para preservar a interface interativa e o QR Code.
  const expoCli = path.join(projectRoot, "node_modules", "expo", "bin", "cli");
  // O modo offline ainda publica o Metro na rede local e evita consultas externas em redes restritas.
  const expoArguments = [expoCli, "start", connectionMode === "--lan" ? "--offline" : "--tunnel"];
  const expo = spawn(process.execPath, expoArguments, {
    cwd: projectRoot,
    stdio: "inherit",
    env: {
      ...process.env,
      ...(connectionMode === "--lan" && getPreferredLocalIPv4()
        ? { REACT_NATIVE_PACKAGER_HOSTNAME: getPreferredLocalIPv4() }
        : {}),
      ...(publicApiUrl ? { EXPO_PUBLIC_API_URL: publicApiUrl } : {}),
    },
  });

  let stopping = false;
  function stopChildren() {
    if (stopping) return;
    stopping = true;
    if (api && !api.killed) api.kill();
    if (apiTunnel && !apiTunnel.killed) apiTunnel.kill();
    if (!expo.killed) expo.kill();
  }

  expo.on("exit", (code) => {
    stopChildren();
    process.exitCode = code ?? 0;
  });

  api?.on("exit", (code) => {
    if (!stopping && code !== 0) {
      console.error("[API] O backend foi encerrado. Corrija a mensagem acima e execute npm run dev novamente.");
      stopChildren();
      process.exitCode = code ?? 1;
    }
  });

  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, stopChildren);
  }
}

main().catch((error) => {
  console.error("Não foi possível iniciar o ambiente:", error.message);
  process.exitCode = 1;
});
