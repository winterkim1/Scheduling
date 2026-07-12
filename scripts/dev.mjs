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

const localIp = getLocalIp();

console.log("\n MeetFlow — Prototype Preview\n");
console.log(`  PC (browser):     http://localhost:${PORT}`);
if (localIp) {
  console.log(`  Mobile (same Wi-Fi): http://${localIp}:${PORT}`);
}
console.log(`  PC + Mobile side-by-side: http://localhost:${PORT}/preview`);
console.log("\n  Tip: Resize the browser window or use /preview to compare layouts.\n");

const child = spawn(
  "npx",
  ["next", "dev", "--hostname", "0.0.0.0", "--port", PORT],
  { stdio: "inherit", shell: true }
);

child.on("exit", (code) => process.exit(code ?? 0));
