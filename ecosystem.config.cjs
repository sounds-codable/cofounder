const base = "/var/www/www.cofounder.icu";
module.exports = {
  apps: ["api", "web"].map((role) => ({
    name: `cofounder-${role}`,
    cwd: base + "/current",
    script: base + "/current/scripts/native-service.mjs",
    args: role,
    interpreter: "/usr/bin/node",
    env: { NODE_ENV: "production" },
    autorestart: true,
    kill_timeout: 15000,
    time: true,
    out_file: `${base}/shared/logs/${role}.out.log`,
    error_file: `${base}/shared/logs/${role}.error.log`,
  })),
};
