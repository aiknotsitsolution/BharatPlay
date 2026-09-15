const { spawn } = require("child_process");
const http = require("http");
const net = require("net");
const path = require("path");

const root = path.resolve(__dirname, "..");
const npmCli = process.env.npm_execpath?.endsWith(".js")
  ? process.env.npm_execpath
  : path.join(
      path.dirname(process.execPath),
      "node_modules",
      "npm",
      "bin",
      "npm-cli.js",
    );
const services = [
  ["gateway", "gateway", 4000],
  ["auth-service", "services/auth-service", 4001],
  ["admin-service", "services/admin-service", 4002],
  ["video-service", "services/video-service", 4003],
  ["category-service", "services/category-service", 4004],
  ["leaderboard-service", "services/leaderboard-service", 4005],
  ["notification-service", "services/notification-service", 4006],
  ["player-ad-service", "services/player-ad-service", 4007],
  ["copyright-service", "services/copyright-service", 4008],
  ["security-service", "services/security-service", 4009],
];

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: "127.0.0.1", port });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
  });
}

function checkHealth(port) {
  return new Promise((resolve) => {
    const request = http.get(
      { host: "127.0.0.1", port, path: "/health", timeout: 1500 },
      (response) => {
        response.resume();
        resolve(response.statusCode === 200);
      },
    );
    request.on("error", () => resolve(false));
    request.on("timeout", () => {
      request.destroy();
      resolve(false);
    });
  });
}

async function printStatus(statuses) {
  console.log("\nService status and ports:");
  services.forEach(([name, directory, port], index) => {
    const healthy = statuses[index];
    const status = healthy ? "RUNNING" : "UNHEALTHY";
    console.log(`[${name}] PORT=${port} ${status} http://localhost:${port}`);
  });
  console.log("");
}

async function waitForServices() {
  let statuses = [];
  for (let attempt = 0; attempt < 20; attempt += 1) {
    statuses = await Promise.all(
      services.map(([, , port]) => checkHealth(port)),
    );
    if (statuses.every(Boolean) || attempt === 19) {
      await printStatus(statuses);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

let children = [];
let shuttingDown = false;

async function startServices() {
  for (const [name, directory, port] of services) {
    if (await isPortOpen(port)) {
      console.log(`[${name}] already running on port ${port}`);
      continue;
    }

    const child = spawn(process.execPath, [npmCli, "run", "dev"], {
      cwd: path.join(root, directory),
      env: { ...process.env, PORT: String(port) },
      stdio: ["inherit", "pipe", "pipe"],
      windowsHide: true,
    });

    const prefix = `[${name}]`;
    child.stdout.on("data", (data) =>
      process.stdout.write(`${prefix} ${data}`),
    );
    child.stderr.on("data", (data) =>
      process.stderr.write(`${prefix} ${data}`),
    );
    child.on("exit", (code) => {
      if (code && !shuttingDown) {
        console.error(`${prefix} exited with code ${code}`);
      }
    });
    children.push(child);
  }

  waitForServices().catch((error) =>
    console.error("Status check failed:", error),
  );
}

function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  children.forEach((child) => {
    if (process.platform === "win32" && child.pid) {
      spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"]);
    } else {
      child.kill();
    }
  });
  setTimeout(() => process.exit(0), 500);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
console.log(
  "Starting all Bitzo services. Press Ctrl+C to stop services started by this command.",
);
startServices().catch((error) => {
  console.error(error);
  shutdown();
});
