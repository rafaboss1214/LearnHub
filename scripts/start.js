const { spawn } = require("node:child_process");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const connectionMode = process.argv.includes("--tunnel") ? "--tunnel" : "--lan";

const api = spawn(process.execPath, ["backend/src/server.js"], {
  cwd: projectRoot,
  stdio: "inherit",
});

api.on("error", (error) => console.error("[API] Não foi possível iniciar:", error.message));

// O Expo recebe o TTY diretamente para preservar a interface interativa e o QR Code.
const expoCli = path.join(projectRoot, "node_modules", "expo", "bin", "cli");
const expoArguments = [expoCli, "start", connectionMode === "--lan" ? "--offline" : "--tunnel"];
const expo = spawn(process.execPath, expoArguments, {
  cwd: projectRoot,
  stdio: "inherit",
});

let stopping = false;

function stopChildren() {
  if (stopping) return;
  stopping = true;
  if (!api.killed) api.kill();
  if (!expo.killed) expo.kill();
}

expo.on("exit", (code) => {
  stopChildren();
  process.exitCode = code ?? 0;
});

api.on("exit", (code) => {
  if (!stopping && code !== 0) {
    console.error("[API] O backend foi encerrado. Corrija a mensagem acima e execute npm run dev novamente.");
    stopChildren();
    process.exitCode = code ?? 1;
  }
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    stopChildren();
  });
}
