import { execFileSync } from "node:child_process";
import {
  readFileSync,
  writeFileSync,
  mkdtempSync,
  rmSync,
  openSync,
  closeSync,
} from "node:fs";
import { parseEnv } from "node:util";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes, createHash } from "node:crypto";
import { readConfig, selectTargets } from "./deploy-config.mjs";
import { ssh, quote, options } from "./remote.mjs";

const mode = process.argv[2];
if (!["prepare-env", "china-to-us"].includes(mode)) {
  console.error("用法：pnpm server:migrate prepare-env|china-to-us");
  process.exit(1);
}
const [china, us] = selectTargets(readConfig(), "all");
const base = us.root;
const work = mkdtempSync(join(tmpdir(), "cofounder-migration-"));
const id =
  new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, "")
    .slice(0, 14) +
  "_" +
  randomBytes(3).toString("hex");
const backup = `${base}/shared/backups/${id}`;
const app = `runuser -u cofounder -- env HOME=/var/lib/cofounder PATH=/var/lib/cofounder/bin:/usr/bin:/bin`;
const scp = (t, local, remote) =>
  execFileSync(
    "scp",
    [...options, "-P", t.port, local, `${t.user}@${t.host}:${remote}`],
    { stdio: "inherit" },
  );
const readEnv = (t) =>
  parseEnv(
    ssh(t, `cat '${base}/shared/${t === china ? "server/" : ""}.env'`, true),
  );
const serialize = (v) =>
  Object.entries(v)
    .map(([k, value]) => `${k}=${JSON.stringify(value)}`)
    .join("\n") + "\n";
const remoteWrite = (t, path, content) => {
  const local = join(work, "private.env");
  writeFileSync(local, content, { mode: 0o600 });
  const remote = "/tmp/cofounder-env-" + id;
  scp(t, local, remote);
  ssh(
    t,
    `install -o cofounder -g cofounder -m 0600 '${remote}' '${path}'; rm -f '${remote}'`,
  );
};
let migrationLocked = false;
let sourceStopped = false,
  targetStopped = false,
  sourceConfigChanged = false,
  switched = false,
  completed = false;
try {
  ssh(
    us,
    `test -f '${base}/shared/installed'; test "$(cat '${base}/shared/region')" = us; test ! -f '${base}/shared/migration-complete'`,
  );
  if (mode === "prepare-env") {
    ssh(
      us,
      `test ! -e '${base}/current'; install -d -m 0700 '${backup}'; cp -p '${base}/shared/.env' '${backup}/env.before'`,
    );
    const source = readEnv(china),
      target = readEnv(us);
    const preserved = new Set([
      "NODE_ENV",
      "SERVER_ROLE",
      "APP_DOMAIN",
      "WEB_PORT",
      "PORT",
      "HOST",
      "API_INTERNAL_URL",
      "TYPEORM_SYNCHRONIZE",
      "TYPEORM_MIGRATIONS_RUN",
      "SEED_DEMO_DATA_ENABLED",
    ]);
    for (const [key, value] of Object.entries(source))
      if (
        !preserved.has(key) &&
        !key.startsWith("DB_") &&
        !key.startsWith("DEPLOY_") &&
        !key.startsWith("GIT_")
      )
        target[key] = value;
    remoteWrite(
      us,
      base + "/shared/.env",
      serialize({ ...target, HOST: "127.0.0.1" }),
    );
    console.log(
      "已安全复制 China 应用配置，保留 US 独立数据库凭据与端口；未复制业务数据。",
    );
  } else {
    ssh(us, `mkdir '${base}/shared/migration-running'`);
    migrationLocked = true;
    const target = readEnv(us),
      source = readEnv(china);
    if (
      !/^[a-z_][a-z0-9_]*$/.test(source.DB_DATABASE) ||
      target.DB_DATABASE !== "cofounder"
    )
      throw Error("数据库名称与初次迁移预期不符");
    ssh(
      us,
      `test -f '${base}/shared/maintenance'; test -L '${base}/current'; test -f '${base}/current/.healthy'; install -d -m 0700 '${backup}'; cp -p '${base}/shared/.env' '${backup}/env.before'; test "$(runuser -u postgres -- psql -XAt -d cofounder -c 'SELECT count(*) FROM users')" = 0`,
    );
    for (const t of [china, us]) {
      scp(
        t,
        "scripts/database-snapshot.py",
        `/tmp/cofounder-snapshot-${id}.py`,
      );
      ssh(
        t,
        `install -d -m 0700 '${backup}'; install -m 0700 '/tmp/cofounder-snapshot-${id}.py' '${backup}/snapshot.py'; rm -f '/tmp/cofounder-snapshot-${id}.py'`,
      );
    }
    // 在源端暂时添加维护响应，再停两端服务，消除写入窗口。
    ssh(
      china,
      `cp -p /etc/nginx/sites-available/cofounder.icu.conf '${backup}/nginx.before'; cp -p '${base}/shared/server/.env' '${backup}/env.before'`,
    );
    sourceConfigChanged = true;
    ssh(
      china,
      `python3 - <<'PY'
from pathlib import Path
p=Path('/etc/nginx/sites-available/cofounder.icu.conf');s=p.read_text();s=s.replace('server {','server {\\n    if (-f ${base}/shared/maintenance) { return 503; }');p.write_text(s)
PY
nginx -t; systemctl reload nginx; touch '${base}/shared/maintenance'`,
    );
    sourceStopped = true;
    ssh(china, "supervisorctl stop cofounder-backend cofounder-frontend");
    targetStopped = true;
    ssh(us, `${app} pm2 stop cofounder-api cofounder-web`);
    ssh(
      china,
      `runuser -u postgres -- pg_dump -Fc --no-owner --no-acl '${source.DB_DATABASE}' > '${backup}/china.dump'; chmod 0600 '${backup}/china.dump'; python3 '${backup}/snapshot.py' '${source.DB_DATABASE}' > '${backup}/source.json'`,
    );
    const expected = JSON.parse(
      ssh(china, `cat '${backup}/source.json'`, true),
    );
    const dump = join(work, "china.dump");
    const fd = openSync(dump, "w", 0o600);
    try {
      execFileSync(
        "ssh",
        [
          "-T",
          ...options,
          "-p",
          china.port,
          `${china.user}@${china.host}`,
          `sudo -n cat '${backup}/china.dump'`,
        ],
        { stdio: ["ignore", fd, "inherit"] },
      );
    } finally {
      closeSync(fd);
    }
    const digest = createHash("sha256")
      .update(readFileSync(dump))
      .digest("hex");
    scp(us, dump, `/tmp/cofounder-china-${id}.dump`);
    const database = "cofounder_migrated_" + id;
    ssh(
      us,
      `set -euo pipefail
mv '/tmp/cofounder-china-${id}.dump' '${backup}/china.dump'; chmod 0600 '${backup}/china.dump'
printf '%s  %s\\n' '${digest}' '${backup}/china.dump' | sha256sum -c -
runuser -u postgres -- pg_dump -Fc --no-owner --no-acl cofounder > '${backup}/us-before.dump'
runuser -u postgres -- createdb -O cofounder_app '${database}'
runuser -u postgres -- pg_restore --exit-on-error --single-transaction --no-owner --no-acl --role=cofounder_app -d '${database}' < '${backup}/china.dump'
python3 '${backup}/snapshot.py' '${database}' > '${backup}/restored.json'`,
    );
    const actual = JSON.parse(ssh(us, `cat '${backup}/restored.json'`, true));
    if (JSON.stringify(expected) !== JSON.stringify(actual))
      throw Error("数据行数、内容摘要或序列不一致，拒绝切换");
    writeFileSync(
      join(work, "verification.json"),
      JSON.stringify({ id, sha256: digest, tables: actual }, null, 2) + "\n",
    );
    scp(
      us,
      join(work, "verification.json"),
      `/tmp/cofounder-verified-${id}.json`,
    );
    ssh(
      us,
      `mv '/tmp/cofounder-verified-${id}.json' '${backup}/verification.json'`,
    );
    remoteWrite(
      us,
      base + "/shared/.env",
      serialize({ ...target, DB_DATABASE: database }),
    );
    switched = true;
    ssh(
      us,
      `cd '${base}/current/server'; ${app} node node_modules/typeorm/cli.js migration:run -d dist/database/data-source.js`,
    );
    const after = JSON.parse(
      ssh(us, `python3 '${backup}/snapshot.py' '${database}'`, true),
    );
    if (JSON.stringify(expected) !== JSON.stringify(after))
      throw Error("迁移执行后数据发生非预期变化，拒绝开放");
    ssh(
      us,
      `${app} pm2 restart cofounder-api cofounder-web --update-env; ${app} node '${base}/current/scripts/health-check.mjs'; ${app} pm2 save`,
    );
    // 源服务器代理到 US，兼容 DNS 缓存与客户端旧连接，禁止两端各自写库。
    ssh(
      china,
      `python3 - <<'PY'
from pathlib import Path
p=Path('/etc/nginx/sites-available/cofounder.icu.conf');s=Path('${backup}/nginx.before').read_text();s=s.replace('proxy_pass http://127.0.0.1:3000;','proxy_pass https://${us.host};\\n        proxy_ssl_server_name on;\\n        proxy_ssl_name ${us.domain};\\n        proxy_ssl_verify on;\\n        proxy_ssl_verify_depth 3;\\n        proxy_ssl_trusted_certificate /etc/ssl/certs/ca-certificates.crt;');s=s.replace('proxy_pass http://127.0.0.1:3010/api/;','proxy_pass https://${us.host}/api/;\\n        proxy_ssl_server_name on;\\n        proxy_ssl_name ${us.domain};\\n        proxy_ssl_verify on;\\n        proxy_ssl_verify_depth 3;\\n        proxy_ssl_trusted_certificate /etc/ssl/certs/ca-certificates.crt;');p.write_text(s)
PY
nginx -t; systemctl reload nginx`,
    );
    completed = true;
    ssh(
      us,
      `rm -f '${base}/shared/maintenance'; curl --connect-timeout 10 --max-time 30 -fsS 'https://${us.domain}/api/health'`,
    );
    // 开放后保留 US 为唯一写入端，不能自动回滚到旧库。
    ssh(
      china,
      `rm -f '${base}/shared/maintenance'; install -d -m 0700 '${backup}/supervisor'; cp -p /etc/supervisor/conf.d/cofounder-backend.conf /etc/supervisor/conf.d/supervisor.cofounder-frontend.conf '${backup}/supervisor/'; sed -i 's/^autostart=true/autostart=false/' /etc/supervisor/conf.d/cofounder-backend.conf /etc/supervisor/conf.d/supervisor.cofounder-frontend.conf; supervisorctl reread; supervisorctl update cofounder-backend cofounder-frontend`,
    );
    // 重载后等待新 worker 接管连接，验证 China 的 TLS 转发实际可用。
    ssh(
      china,
      `curl --noproxy '*' --connect-timeout 10 --max-time 30 --retry 3 --retry-delay 1 --retry-all-errors -fsS --resolve '${us.domain}:443:127.0.0.1' 'https://${us.domain}/api/health'`,
    );
    ssh(us, `printf '%s\\n' '${backup}' > '${base}/shared/migration-complete'`);
    console.log(
      `迁移完成：${Object.keys(actual).length - 1} 张表内容、行数及所有序列一致。备份与校验：${backup}。China 已转发 US，旧服务停止并禁用自启。`,
    );
  }
} catch (error) {
  console.error(`迁移失败：${error.message}`);
  if (!completed) {
    try {
      if (switched)
        ssh(us, `cp -p '${backup}/env.before' '${base}/shared/.env'`);
      if (targetStopped)
        ssh(us, `${app} pm2 restart cofounder-api cofounder-web --update-env`);
      if (sourceConfigChanged)
        ssh(
          china,
          `cp -p '${backup}/nginx.before' /etc/nginx/sites-available/cofounder.icu.conf; nginx -t; systemctl reload nginx`,
        );
      if (sourceStopped)
        ssh(china, "supervisorctl start cofounder-backend cofounder-frontend");
      if (sourceConfigChanged) ssh(china, `rm -f '${base}/shared/maintenance'`);
    } catch (recovery) {
      console.error(
        `自动恢复未完成：${recovery.message}；请保留维护状态并检查备份 ${backup}`,
      );
    }
  } else
    console.error("US 已开放写入，保持 US 为唯一数据源，请检查源端停用状态。");
  process.exitCode = 1;
} finally {
  if (migrationLocked) {
    try {
      ssh(us, `rmdir '${base}/shared/migration-running'`);
    } catch {
      console.error("请检查并清理 shared/migration-running 标记");
    }
  }
  rmSync(work, { recursive: true, force: true });
}
