import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { spawn } from "node:child_process";
const base = "/var/www/www.cofounder.icu";
const env = {
  ...process.env,
  ...parseEnv(readFileSync(base + "/shared/.env", "utf8")),
};
const role = process.argv[2];
if (!["web", "api"].includes(role)) throw Error("服务角色无效");
const child = spawn(
  process.execPath,
  role === "web"
    ? [
        "node_modules/next/dist/bin/next",
        "start",
        "--hostname",
        "127.0.0.1",
        "--port",
        env.WEB_PORT,
      ]
    : ["dist/main.js"],
  {
    cwd: `${base}/current/${role === "web" ? "client" : "server"}`,
    env,
    stdio: "inherit",
  },
);
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () => child.kill(signal));
child.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on("exit", (code) => process.exit(code ?? 1));
