#!/usr/bin/env bash
set -euo pipefail
release="${1:?缺少安装目录}"
source "$release/scripts/server-common.sh"
[[ "$EUID" == 0 ]] || { echo '需要 sudo'; exit 1; }
if [[ -f "$base/shared/installed" ]]; then verify_target; echo '已经安装'; exit 0; fi
[[ ! -e "$base/current" ]] || { echo '已有旧安装，拒绝覆盖'; exit 1; }
for command in node npm corepack nginx psql certbot python3 ss; do command -v "$command" >/dev/null || { echo "缺少依赖 $command，请先安装"; exit 1; }; done
node -e 'if(+process.versions.node.split(".")[0]<22)process.exit(1)'
mkdir -p "$base/shared"
exec 9>"$base/shared/deploy.lock"; flock -n 9 || exit 1
id "$app_user" >/dev/null 2>&1 || useradd --system --create-home --home-dir "$runtime_home" --shell /usr/sbin/nologin "$app_user"
install -d -o "$app_user" -g "$app_user" "$base/releases" "$base/shared/logs" "$base/shared/server" "$runtime_home/bin"
if [[ ! -x "$runtime_home/bin/pnpm" ]]; then
 npm install --prefix "$runtime_home/tooling" pnpm@11.17.0 pm2@6.0.14
 ln -s "$runtime_home/tooling/node_modules/.bin/pnpm" "$runtime_home/bin/pnpm"
 ln -s "$runtime_home/tooling/node_modules/.bin/pm2" "$runtime_home/bin/pm2"
 chown -R "$app_user:$app_user" "$runtime_home"
fi
if [[ ! -f "$base/shared/.env" ]]; then
 suggestion=$(python3 "$release/scripts/server-port-audit.py" --choose)
 read -r web api < <(python3 -c 'import json,sys; v=json.loads(sys.argv[1]);print(v["web_port"],v["api_port"])' "$suggestion")
 echo "端口审计建议并使用：Web=$web，API=$api"
 python3 "$release/scripts/server-port-audit.py" --check "$web" "$api"
 export SETUP_WEB="$web" SETUP_API="$api" SETUP_DOMAIN="${DEPLOY_DOMAIN:?}"
 python3 - "$base/shared/.env" <<'PY'
from pathlib import Path
import os,secrets,subprocess,sys
psql=['runuser','-u','postgres','--','psql','-v','ON_ERROR_STOP=1']
exists=subprocess.check_output(psql+['-Atc',"SELECT 1 FROM pg_roles WHERE rolname='cofounder_app' UNION ALL SELECT 1 FROM pg_database WHERE datname='cofounder'"]).decode().strip()
if exists: raise SystemExit('检测到已有 cofounder 数据库/角色但无本站配置，拒绝覆盖')
password=secrets.token_hex(24)
subprocess.run(psql,input=f"CREATE ROLE cofounder_app LOGIN PASSWORD '{password}';\nCREATE DATABASE cofounder OWNER cofounder_app;\n",text=True,check=True,stdout=subprocess.DEVNULL)
v={'NODE_ENV':'production','SERVER_ROLE':os.environ['DEPLOY_REGION'],'APP_DOMAIN':os.environ['SETUP_DOMAIN'],'WEB_PORT':os.environ['SETUP_WEB'],'PORT':os.environ['SETUP_API'],'API_INTERNAL_URL':'http://127.0.0.1:'+os.environ['SETUP_API']+'/api','DB_HOST':'127.0.0.1','DB_PORT':'5432','DB_USERNAME':'cofounder_app','DB_PASSWORD':password,'DB_DATABASE':'cofounder','TYPEORM_SYNCHRONIZE':'false','TYPEORM_MIGRATIONS_RUN':'false','JWT_SECRET':secrets.token_hex(32),'SEED_DEMO_DATA_ENABLED':'false'}
p=Path(sys.argv[1]);p.write_text('\n'.join(f'{k}={v}' for k,v in v.items())+'\n');p.chmod(0o600)
PY
 chown "$app_user:$app_user" "$base/shared/.env"
 printf '%s\n' "$DEPLOY_REGION" > "$base/shared/region"
 touch "$base/shared/maintenance"
fi
verify_target
config=/etc/nginx/sites-available/cofounder
if [[ -e "$config" ]] && ! grep -q '^# 由 Cofounder 安装器管理' "$config"; then echo '同名 Nginx 配置不属于本项目'; exit 1; fi
# 拒绝覆盖由其它文件声明的相同域名。
if nginx -T 2>/dev/null | grep -E '^[[:space:]]*server_name[[:space:]]' | grep -Eq '(^|[[:space:]])cofounder\.icu([[:space:];]|$)' && [[ ! -e "$config" ]]; then echo '域名已存在于其它 Nginx 配置'; exit 1; fi
python3 - "$base/shared/.env" "$release/docs/deployment/nginx.conf.template" "$config" <<'PY'
from pathlib import Path
import sys
v=dict(l.split('=',1) for l in Path(sys.argv[1]).read_text().splitlines() if '=' in l and not l.startswith('#'))
s=Path(sys.argv[2]).read_text().replace('__DOMAIN__',v['APP_DOMAIN']).replace('__WEB_PORT__',v['WEB_PORT']).replace('__API_PORT__',v['PORT']);Path(sys.argv[3]).write_text(s)
PY
ln -sfn "$config" /etc/nginx/sites-enabled/cofounder
nginx -t; systemctl reload nginx
certbot --nginx --non-interactive --agree-tos --redirect -d "$DEPLOY_DOMAIN" -m "$DEPLOY_EMAIL"
as_app pm2 save --force
PATH="$runtime_home/bin:$PATH" "$runtime_home/bin/pm2" startup systemd -u "$app_user" --hp "$runtime_home"
as_app pm2 kill
systemctl enable --now pm2-cofounder
systemctl is-active --quiet pm2-cofounder
systemctl is-enabled --quiet pm2-cofounder
touch "$base/shared/installed"
echo "首次安装完成：$base/shared/.env。填写应用配置后执行 pnpm server:deploy $DEPLOY_REGION；迁移完成前保持维护状态。"
