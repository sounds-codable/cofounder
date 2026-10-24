import { execFileSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const role = process.argv[2] || "all";
if (!["all", "client", "server"].includes(role)) throw Error("开发角色无效");
const roles = role === "all" ? ["server", "client"] : [role];
const children = [];
for (const part of roles) {
  const port = part === "client" ? 3000 : 3010;
  let pids = [];
  try {
    pids = execFileSync("lsof", ["-ti", `tcp:${port}`, "-sTCP:LISTEN"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  } catch (e) {
    if (e.status !== 1) throw e;
  }
  for (const pid of pids) {
    process.kill(+pid, "SIGTERM");
    console.log(`已停止端口 ${port} 的进程 ${pid}`);
  }
  // 等待指定端口释放，再启动服务。
  for (let i = 0; i < 50; i++) {
    let occupied = false;
    try {
      occupied = !!execFileSync(
        "lsof",
        ["-ti", `tcp:${port}`, "-sTCP:LISTEN"],
        { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
      ).trim();
    } catch (e) {
      if (e.status !== 1) throw e;
    }
    if (!occupied) break;
    if (i === 49) throw Error(`端口 ${port} 未释放`);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  const binary = join(
    root,
    part,
    "node_modules/.bin",
    part === "client" ? "next" : "nest",
  );
  children.push(
    spawn(
      binary,
      part === "client"
        ? ["dev", "--port", String(port)]
        : ["start", "--watch"],
      {
        cwd: join(root, part),
        stdio: "inherit",
        env: { ...process.env, PORT: String(port) },
      },
    ),
  );
}
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    for (const child of children) child.kill(signal);
  });
for (const child of children)
  child.on("exit", (code) => {
    if (code) {
      for (const other of children) if (other !== child) other.kill("SIGTERM");
      process.exitCode = code;
    }
  });
