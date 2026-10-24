import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join, basename } from "node:path";
import { tmpdir } from "node:os";
import { createHash, randomBytes } from "node:crypto";
import { readConfig, selectTargets } from "./deploy-config.mjs";

export const quote = (s) => "'" + String(s).replaceAll("'", "'\\''") + "'";
export const options = [
  "-o",
  "BatchMode=yes",
  "-o",
  "ConnectTimeout=15",
  "-o",
  "ServerAliveInterval=20",
];
export const ssh = (t, script, capture = false) =>
  execFileSync(
    "ssh",
    [
      "-T",
      ...options,
      "-p",
      t.port,
      `${t.user}@${t.host}`,
      `sudo -n bash -c ${quote("set -euo pipefail\n" + script)}`,
    ],
    {
      encoding: "utf8",
      stdio: capture ? ["ignore", "pipe", "inherit"] : "inherit",
    },
  );

async function main() {
  const [mode, ...args] = process.argv.slice(2);
  if (args.includes("--help")) {
    console.log(
      "用法：pnpm server:install|server:deploy china|us|all [--check]。首次安装只准备环境；发布完整前后端。",
    );
    return;
  }
  if (
    !["install", "deploy"].includes(mode) ||
    args.filter((v) => v !== "--check").length > 1
  )
    throw Error("参数无效");
  const targets = selectTargets(
    readConfig(),
    args.find((v) => v !== "--check"),
  );
  if (args.includes("--check")) {
    for (const t of targets)
      console.log(
        `[${t.name}] ${t.user}@${t.host}:${t.port} → https://${t.domain}，${t.root}`,
      );
    return;
  }
  const pending = [];
  for (const t of targets) {
    const state = ssh(
      t,
      `if test -f '${t.root}/shared/installed'; then cat '${t.root}/shared/region'; elif test -e '${t.root}/current' || test -e '${t.root}/shared/server/.env'; then echo legacy; else echo pending; fi`,
      true,
    ).trim();
    if (state === "legacy")
      throw Error(
        `[${t.name}] 检测到旧 Supervisor 安装，请先完成迁移。禁止直接覆盖。`,
      );
    if (state !== "pending" && state !== t.name)
      throw Error("服务器区域与目标不符");
    if (mode === "install" && state === t.name) {
      console.log(`[${t.name}] 已安装，跳过`);
      continue;
    }
    if (mode === "deploy" && state === "pending")
      throw Error(`请先执行 pnpm server:install ${t.name}`);
    pending.push(t);
  }
  if (!pending.length) return;
  const work = mkdtempSync(join(tmpdir(), "cofounder-publish-"));
  try {
    let archive;
    if (mode === "deploy") {
      execFileSync("bash", ["scripts/build-release.sh"], {
        stdio: "inherit",
        env: { ...process.env, COFOUNDER_RELEASE_OUTPUT: work },
      });
      archive = readFileSync(join(work, "latest-release.txt"), "utf8").trim();
    } else {
      archive = join(
        work,
        `cofounder-bootstrap-${randomBytes(6).toString("hex")}.tar.gz`,
      );
      execFileSync(
        "tar",
        [
          "-czf",
          archive,
          "scripts/server-install.sh",
          "scripts/server-common.sh",
          "scripts/server-port-audit.py",
          "docs/deployment/nginx.conf.template",
        ],
        { env: { ...process.env, COPYFILE_DISABLE: "1" } },
      );
    }
    const name = basename(archive);
    const digest = createHash("sha256")
      .update(readFileSync(archive))
      .digest("hex");
    for (const t of pending) {
      console.log(
        `[${t.name}] 上传、校验并${mode === "install" ? "安装" : "发布"}：${name}`,
      );
      execFileSync(
        "scp",
        [...options, "-P", t.port, archive, `${t.user}@${t.host}:/tmp/${name}`],
        { stdio: "inherit" },
      );
      ssh(
        t,
        `set -euo pipefail
cd /tmp
printf '%s  %s\\n' '${digest}' '${name}' | sha256sum -c -
stage=$(mktemp -d /tmp/cofounder-upload.XXXXXX)
trap 'rm -rf "$stage"; rm -f /tmp/${name}' EXIT
tar --no-same-owner --no-same-permissions -xzf '${name}' -C "$stage"
release="$stage${mode === "deploy" ? "/release" : ""}"
env DEPLOY_REGION='${t.name}' DEPLOY_DOMAIN='${t.domain}' DEPLOY_EMAIL='${t.email}' DEPLOY_USE_PROXY='${t.proxy}' DEPLOY_PROXY_HOST='${t.proxyHost}' DEPLOY_PROXY_PORT='${t.socksPort}' DEPLOY_HTTP_PROXY_PORT='${t.httpPort}' bash "$release/scripts/server-${mode}.sh" "$release"`,
      );
    }
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}
if (
  process.argv[1] &&
  import.meta.url === new URL(process.argv[1], "file:").href
) {
  main().catch((error) => {
    console.error(
      `执行失败：${error.status ? `子命令退出码 ${error.status}，请查看上方日志` : error.message}`,
    );
    process.exitCode = 1;
  });
}
