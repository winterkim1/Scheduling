import { networkInterfaces } from "node:os";
import { spawn } from "node:child_process";

const PORT = process.env.PORT ?? "3000";

function getLocalIp() {
  const nets = networkInterfaces();
  for (const iface of Object.values(nets)) {
    for (const net of iface ?? []) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return null;
}

console.log("\n MeetFlow — Shareable Preview\n");
console.log("  Starting production server and public tunnel...\n");

const server = spawn("npx", ["serve", "out", "-l", PORT], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

await new Promise((resolve) => setTimeout(resolve, 3000));

const tunnel = spawn(
  "npx",
  ["cloudflared", "tunnel", "--url", `http://localhost:${PORT}`],
  { stdio: ["inherit", "pipe", "pipe"], shell: true }
);

let publicUrl = "";

const handleOutput = (chunk) => {
  const text = chunk.toString();
  process.stderr.write(text);
  const match = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
  if (match && !publicUrl) {
    publicUrl = match[0];
    const localIp = getLocalIp();
    console.log("\n Share these links:\n");
    console.log(`  Public (any device):  ${publicUrl}`);
    console.log(`  PC + Mobile compare:  ${publicUrl}/preview`);
    console.log(`  Local PC:             http://localhost:${PORT}`);
    if (localIp) {
      console.log(`  Same Wi-Fi mobile:    http://${localIp}:${PORT}`);
    }
    console.log("\n  Press Ctrl+C to stop.\n");
  }
};

tunnel.stdout.on("data", handleOutput);
tunnel.stderr.on("data", handleOutput);

const shutdown = () => {
  tunnel.kill();
  server.kill();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

tunnel.on("exit", (code) => {
  server.kill();
  process.exit(code ?? 0);
});

server.on("exit", (code) => {
  tunnel.kill();
  process.exit(code ?? 0);
});
