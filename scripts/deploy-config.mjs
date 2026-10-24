import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";

export function readConfig(root = ".") {
  const config = {};
  for (const file of [".env", ".deploy.env"]) {
    if (existsSync(`${root}/${file}`))
      Object.assign(config, parseEnv(readFileSync(`${root}/${file}`, "utf8")));
  }
  return config;
}

export function selectTargets(config, requested) {
  const target = requested || config.DEPLOY_TARGET;
  if (!["china", "us", "all"].includes(target))
    throw Error("请指定 china、us 或 all");
  const targets = (target === "all" ? ["china", "us"] : [target]).map(
    (name) => {
      const prefix = `DEPLOY_${name.toUpperCase()}_`;
      const get = (key, fallback = "") => config[prefix + key] || fallback;
      const t = {
        name,
        host: get("SSH_HOST"),
        user: get("SSH_USER", "deployer"),
        port: get("SSH_PORT", "22"),
        root: get("ROOT", "/var/www/www.cofounder.icu"),
        domain: get("APP_DOMAIN", "cofounder.icu"),
        email: get("LETSENCRYPT_EMAIL", "revival.wgj@gmail.com"),
        proxy: get("USE_PROXY", config.DEPLOY_USE_PROXY || "false"),
        proxyHost: get("PROXY_HOST", "127.0.0.1"),
        socksPort: get("PROXY_PORT", "1080"),
        httpPort: get("HTTP_PROXY_PORT", "1087"),
      };
      const host = /^[a-zA-Z0-9][a-zA-Z0-9.-]*$/;
      const port = (v) => /^\d+$/.test(v) && +v > 0 && +v < 65536;
      if (
        !host.test(t.host) ||
        !/^[a-z_][a-z0-9_-]*$/.test(t.user) ||
        !port(t.port)
      )
        throw Error(`请检查 ${prefix}SSH_HOST/SSH_USER/SSH_PORT`);
      if (!host.test(t.domain) || !/^[-\w.+]+@[-\w.]+$/.test(t.email))
        throw Error("域名或 TLS 邮箱无效");
      if (t.root !== "/var/www/www.cofounder.icu")
        throw Error("目录必须为 /var/www/www.cofounder.icu");
      if (
        !["true", "false"].includes(t.proxy) ||
        !host.test(t.proxyHost) ||
        !port(t.socksPort) ||
        !port(t.httpPort)
      )
        throw Error("代理配置无效");
      return t;
    },
  );
  if (targets.length === 2 && targets[0].host === targets[1].host)
    throw Error("China 和 US 不能是同一服务器");
  return targets;
}
