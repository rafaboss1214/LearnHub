const { spawn, spawnSync } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const net = require("node:net");
const path = require("node:path");
const dotenv = require("dotenv");
const { getPreferredLocalIPv4 } = require("../backend/src/utils/network");

const projectRoot = path.resolve(__dirname, "..");
const appConfig = require(path.join(projectRoot, "app.json"));
dotenv.config({ path: path.join(projectRoot, ".env"), quiet: true });
dotenv.config({ path: path.join(projectRoot, ".env.local"), quiet: true });

const wantsTunnel = process.argv.includes("--tunnel");
const wantsLocalApi = process.argv.includes("--local-api") || process.env.LEARNHUB_LOCAL_API === "true";
const CLOUDFLARED_VERSION = "2026.8.3";
const CLOUDFLARED_SHA256 = Object.freeze({
  "cloudflared-windows-amd64.exe": "83e726ed18ea78c5ad5213c4c3a3a27051393950d2bc8ed4de69bec12d14eaae",
  "cloudflared-linux-amd64": "f29324fe934d1e100617484c78deef803c4dc2cd351d645bbde42e96b4fccc5e",
  "cloudflared-linux-arm64": "4bcfd35521a7cbc545ebfd5d57334a71ee180e2a64874981f374c81472118391",
});

function cleanUrl(value) {
  return typeof value === "string" && value.trim() ? value.trim().replace(/\/+$/, "") : null;
}

function getHostedApiUrl() {
  return cleanUrl(process.env.EXPO_PUBLIC_API_URL) || cleanUrl(appConfig.expo?.extra?.apiUrl);
}

function assertNodeVersion() {
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (major > 22 || (major === 22 && minor >= 13)) return;
  throw new Error(
    `Node.js ${process.versions.node} não é compatível. Instale o Node.js 22.13 ou mais recente e execute npm install novamente.`,
  );
}

function getExpoCli() {
  const expoCli = path.join(projectRoot, "node_modules", "expo", "bin", "cli");
  if (!fs.existsSync(expoCli)) {
    throw new Error(
      "As dependências ainda não estão instaladas. Execute npm install nesta pasta e tente novamente.",
    );
  }
  return expoCli;
}

async function findFreePort(startPort = 8081) {
  for (let port = startPort; port < startPort + 20; port += 1) {
    const free = await new Promise((resolve) => {
      const server = net.createServer();
      server.unref();
      server.once("error", () => resolve(false));
      server.listen({ host: "0.0.0.0", port, exclusive: true }, () => {
        server.close(() => resolve(true));
      });
    });
    if (free) return port;
  }
  throw new Error("Não encontrei uma porta livre entre 8081 e 8100.");
}

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

async function checkHostedApi(apiUrl) {
  if (!apiUrl) return;
  console.log(`[API] Verificando ${apiUrl}...`);
  try {
    const response = await fetch(`${apiUrl}/api/health`, {
      signal: AbortSignal.timeout(60000),
    });
    const body = await response.json().catch(() => ({}));
    if (response.ok && body?.database === "connected") {
      console.log("[API] Backend hospedado e banco de dados conectados.");
      return;
    }
    console.warn(`[API] Aviso: health retornou HTTP ${response.status}. O Expo ainda será iniciado.`);
  } catch {
    console.warn(
      "[API] Aviso: a API hospedada não respondeu. Verifique a internet; o Expo ainda será iniciado.",
    );
  }
}

function cloudflaredAssetName() {
  if (process.platform === "win32" && process.arch === "x64") {
    return "cloudflared-windows-amd64.exe";
  }
  if (process.platform === "linux" && process.arch === "x64") return "cloudflared-linux-amd64";
  if (process.platform === "linux" && process.arch === "arm64") return "cloudflared-linux-arm64";
  return null;
}

async function downloadCloudflared(destination) {
  const asset = cloudflaredAssetName();
  if (!asset) {
    throw new Error(`sistema não suportado para download automático (${process.platform}/${process.arch})`);
  }

  const url = `https://github.com/cloudflare/cloudflared/releases/download/${CLOUDFLARED_VERSION}/${asset}`;
  const temporary = `${destination}.download`;
  console.log("[Túnel] cloudflared não encontrado; baixando o executável oficial da Cloudflare...");
  const response = await fetch(url, { signal: AbortSignal.timeout(120000) });
  if (!response.ok) throw new Error(`download retornou HTTP ${response.status}`);
  const contents = Buffer.from(await response.arrayBuffer());
  if (contents.length < 1_000_000) throw new Error("arquivo baixado parece incompleto");
  const checksum = crypto.createHash("sha256").update(contents).digest("hex");
  if (checksum !== CLOUDFLARED_SHA256[asset]) {
    throw new Error("o executável baixado não passou na verificação de integridade");
  }

  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(temporary, contents);
  fs.renameSync(temporary, destination);
  if (process.platform !== "win32") fs.chmodSync(destination, 0o755);
  console.log("[Túnel] cloudflared instalado somente nesta pasta do projeto.");
}

async function resolveCloudflared() {
  const configured = process.env.CLOUDFLARED_PATH?.trim();
  if (configured) {
    if (!fs.existsSync(configured)) throw new Error(`CLOUDFLARED_PATH não existe: ${configured}`);
    return configured;
  }

  const localExecutable = path.join(
    projectRoot,
    "tools",
    process.platform === "win32" ? "cloudflared.exe" : "cloudflared",
  );
  if (fs.existsSync(localExecutable)) return localExecutable;

  const installed = spawnSync("cloudflared", ["--version"], { stdio: "ignore" });
  if (!installed.error && installed.status === 0) return "cloudflared";

  await downloadCloudflared(localExecutable);
  return localExecutable;
}

function startCloudflareTunnel(executable, targetUrl, label) {
  const child = spawn(
    executable,
    ["tunnel", "--url", targetUrl, "--protocol", "http2", "--no-autoupdate"],
    { cwd: projectRoot, stdio: ["ignore", "pipe", "pipe"] },
  );

  const ready = new Promise((resolve, reject) => {
    let settled = false;
    let lastMessage = "";
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      callback(value);
    };
    const timeout = setTimeout(
      () => finish(reject, new Error(`o túnel ${label} não respondeu a tempo`)),
      45000,
    );
    const inspect = (chunk) => {
      const text = chunk.toString();
      lastMessage = text.trim().split(/\r?\n/).at(-1) || lastMessage;
      const match = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
      if (match) finish(resolve, match[0]);
    };
    child.stdout.on("data", inspect);
    child.stderr.on("data", inspect);
    child.once("error", (error) => finish(reject, error));
    child.once("exit", (code) => {
      if (code && code !== 0) {
        finish(
          reject,
          new Error(`o túnel ${label} encerrou com código ${code}${lastMessage ? `: ${lastMessage}` : ""}`),
        );
      }
    });
  });

  return { child, ready };
}

async function waitForExpoManifest(baseUrl, timeoutMs = 120000, requireTunnel = false) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl, {
        headers: {
          accept: "application/expo+json,application/json",
          "expo-platform": "android",
          "expo-protocol-version": "1",
        },
        signal: AbortSignal.timeout(5000),
      });
      const contentType = response.headers.get("content-type") || "";
      const manifest = await response.json().catch(() => null);
      if (
        response.ok &&
        contentType.includes("application/expo+json") &&
        manifest?.launchAsset?.url &&
        (!requireTunnel || new URL(manifest.launchAsset.url).hostname.endsWith(".exp.direct"))
      ) {
        return manifest;
      }
      lastError = new Error(`HTTP ${response.status} (${contentType || "sem content-type"})`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  throw lastError || new Error("o manifesto do Expo não ficou disponível a tempo");
}

async function main() {
  assertNodeVersion();
  const expoCli = getExpoCli();
  const metroPort = await findFreePort();
  let publicApiUrl = wantsLocalApi ? null : getHostedApiUrl();
  let api = null;

  if (publicApiUrl) {
    console.log(`[API] Usando backend hospedado: ${publicApiUrl}`);
    await checkHostedApi(publicApiUrl);
  } else if (await learnHubApiIsRunning()) {
    console.log("[API] Backend local já está ativo na porta 3000.");
  } else {
    console.log("[API] Iniciando backend local...");
    api = spawn(process.execPath, ["backend/src/server.js"], {
      cwd: projectRoot,
      stdio: "inherit",
    });
  }

  let effectiveTunnel = wantsTunnel;
  let apiTunnel = null;

  if (effectiveTunnel && !publicApiUrl) {
    try {
      const cloudflared = await resolveCloudflared();
      if (!publicApiUrl) {
        const tunnel = startCloudflareTunnel(cloudflared, "http://127.0.0.1:3000", "da API");
        apiTunnel = tunnel.child;
        publicApiUrl = await tunnel.ready;
        console.log(`[API] Túnel público conectado: ${publicApiUrl}`);
      }

    } catch (error) {
      apiTunnel?.kill();
      apiTunnel = null;
      effectiveTunnel = false;
      console.warn(`[Túnel] ${error.message}.`);
      console.warn("[Túnel] Continuando automaticamente em LAN. Use o mesmo Wi-Fi ou hotspot no celular.");
    }
  }

  const preferredAddress = getPreferredLocalIPv4();
  if (!publicApiUrl) {
    publicApiUrl = preferredAddress ? `http://${preferredAddress}:3000` : "http://127.0.0.1:3000";
  }

  const expoArguments = [
    expoCli,
    "start",
    effectiveTunnel ? "--tunnel" : "--offline",
    "--go",
    "--port",
    String(metroPort),
  ];
  console.log(
    `[Expo] Iniciando na porta ${metroPort} (${effectiveTunnel ? "túnel público" : "rede local"}).`,
  );
  const expoEnvironment = { ...process.env };
  // Um proxy antigo substituiria o endereço gerado pelo túnel oficial.
  delete expoEnvironment.EXPO_PACKAGER_PROXY_URL;
  if (effectiveTunnel) delete expoEnvironment.REACT_NATIVE_PACKAGER_HOSTNAME;
  const expo = spawn(process.execPath, expoArguments, {
    cwd: projectRoot,
    stdio: "inherit",
    env: {
      ...expoEnvironment,
      ...(!effectiveTunnel && preferredAddress
        ? { REACT_NATIVE_PACKAGER_HOSTNAME: preferredAddress }
        : {}),
      ...(publicApiUrl ? { EXPO_PUBLIC_API_URL: publicApiUrl } : {}),
    },
  });

  let stopping = false;
  let desiredExitCode = null;
  function stopChildren(exitCode = 0) {
    if (stopping) return;
    stopping = true;
    desiredExitCode = exitCode;
    if (api && !api.killed) api.kill();
    if (apiTunnel && !apiTunnel.killed) apiTunnel.kill();
    if (!expo.killed) expo.kill();
  }

  const verificationUrl = `http://127.0.0.1:${metroPort}`;
  void waitForExpoManifest(verificationUrl, 120000, effectiveTunnel)
    .then(async (manifest) => {
      if (!effectiveTunnel) return manifest;
      const publicUrl = new URL(manifest.launchAsset.url).origin;
      if (!publicUrl.endsWith(".exp.direct")) {
        throw new Error("o manifesto não aponta para o túnel oficial do Expo");
      }
      const publicManifest = await waitForExpoManifest(publicUrl, 30000);
      console.log(`[Expo] Manifesto público validado: ${publicUrl}`);
      return publicManifest;
    })
    .then((manifest) => {
      if (stopping) return;
      console.log("====================================");
      console.log("LEARNHUB PRONTO");
      console.log(`Expo SDK: ${manifest.runtimeVersion || "57"}`);
      console.log(`Conexão: ${effectiveTunnel ? "túnel público" : "rede local"}`);
      console.log("Abra o Expo Go e leia o QR Code exibido acima.");
      console.log("Para encerrar, pressione Ctrl+C uma vez.");
      console.log("====================================");
    })
    .catch((error) => {
      if (stopping) return;
      console.warn(`[Expo] O Metro iniciou, mas o manifesto não pôde ser validado: ${error.message}`);
      if (effectiveTunnel) {
        console.warn("[Expo] Se o celular não conectar, execute npm run dev usando o mesmo Wi-Fi ou hotspot.");
      }
    });

  expo.on("error", (error) => {
    console.error("[Expo] Não foi possível iniciar:", error.message);
    stopChildren(1);
    process.exitCode = 1;
  });
  expo.on("exit", (code) => {
    if (!stopping) stopChildren(code ?? 0);
    process.exitCode = desiredExitCode ?? code ?? 0;
  });
  api?.on("exit", (code) => {
    if (!stopping && code !== 0) {
      console.error("[API] O backend local foi encerrado. Rode npm run diagnose para ver o motivo.");
      stopChildren(code ?? 1);
      process.exitCode = code ?? 1;
    }
  });
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.once(signal, () => {
      console.log("\nEncerrando o LearnHub...");
      stopChildren(0);
      process.exitCode = 0;
      setTimeout(() => process.exit(0), 100);
    });
  }
}

main().catch((error) => {
  console.error("Não foi possível iniciar o LearnHub:", error.message);
  process.exitCode = 1;
});
