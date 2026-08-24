const { spawn } = require("node:child_process");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");

const api = spawn(process.execPath, ["server/index.js"], {
  cwd: projectRoot,
  stdio: ["inherit", "pipe", "pipe"],
});

function writeApiOutput(chunk, stream) {
  const output = chunk.toString().replace(/^/gm, "[API] ");
  stream.write(output);
}

api.stdout.on("data", (chunk) => writeApiOutput(chunk, process.stdout));
api.stderr.on("data", (chunk) => writeApiOutput(chunk, process.stderr));
api.on("error", (error) => console.error("[API] Não foi possível iniciar:", error.message));

// O Expo recebe diretamente o TTY do terminal: sua interface interativa e o QR Code são preservados.
// O host padrão do Expo é LAN; --offline evita que uma indisponibilidade externa impeça o QR local.
const expo = spawn(process.execPath, [path.join("node_modules", "expo", "bin", "cli"), "start", "--offline"], {
  cwd: projectRoot,
  stdio: "inherit",
});

function stopApi() {
  if (!api.killed) api.kill();
}

expo.on("exit", (code) => {
  stopApi();
  process.exit(code ?? 0);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    stopApi();
    expo.kill(signal);
  });
}
