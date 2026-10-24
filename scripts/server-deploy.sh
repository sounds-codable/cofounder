#!/usr/bin/env bash
set -euo pipefail
source_dir="${1:?缺少发布目录}"
source "$source_dir/scripts/server-common.sh"
verify_target
[[ ! -d "$base/shared/migration-running" ]] || { echo "迁移进行中，拒绝发布"; exit 1; }
exec 9>"$base/shared/deploy.lock"; flock -n 9 || { echo '已有发布正在执行'; exit 1; }
new="$base/releases/$(date -u +%Y%m%dT%H%M%SZ)-$(openssl rand -hex 3)"
old=$(readlink -f "$base/current" 2>/dev/null || true)
mkdir -p "$new"; cp -a "$source_dir/." "$new/"
ln -s "$base/shared/.env" "$new/server/.env"
find "$new" -exec chown -h cofounder:cofounder {} +
for part in server client; do
 if [[ -n "$old" && -d "$old/$part/node_modules" ]] && cmp -s "$old/$part/pnpm-lock.yaml" "$new/$part/pnpm-lock.yaml"; then
  echo "复用 $part 的 Linux 生产依赖"; cp -al "$old/$part/node_modules" "$new/$part/node_modules"
 else
  (cd "$new/$part" && as_app pnpm install --prod --frozen-lockfile)
 fi
done
# 迁移在发布目录执行；不依赖即将被切换的 current。
(cd "$new/server" && as_app node node_modules/typeorm/cli.js migration:run -d dist/database/data-source.js)
read -r web api < <(node -e "const fs=require('fs'),{parseEnv}=require('util');const v=parseEnv(fs.readFileSync('$base/shared/.env','utf8'));console.log(v.WEB_PORT,v.PORT)")
if [[ -z "$old" ]]; then python3 "$new/scripts/server-port-audit.py" --check "$web" "$api" --project-nginx /etc/nginx/sites-available/cofounder; fi
rollback() {
 trap - ERR
 as_app pm2 delete cofounder-api cofounder-web >/dev/null 2>&1 || true
 if [[ -n "$old" && -d "$old" ]]; then
  ln -s "$old" "$base/current.rollback"; mv -Tf "$base/current.rollback" "$base/current"
  as_app pm2 start "$base/current/ecosystem.config.cjs" --update-env
  as_app node "$base/current/scripts/health-check.mjs"
  as_app pm2 save
  echo "发布失败，代码已恢复：$old；数据库迁移不会自动回退" >&2
 else rm -f "$base/current"; as_app pm2 save --force; fi
 exit 1
}
trap rollback ERR
ln -s "$new" "$base/current.next"; mv -Tf "$base/current.next" "$base/current"
as_app pm2 delete cofounder-api cofounder-web >/dev/null 2>&1 || true
as_app pm2 start "$base/current/ecosystem.config.cjs" --update-env
as_app node "$new/scripts/health-check.mjs"
as_app pm2 save
systemctl is-active --quiet pm2-cofounder; systemctl is-enabled --quiet pm2-cofounder
# 维护期间仍检查 TLS；正式开放后检查公网健康接口。
if [[ ! -f "$base/shared/maintenance" ]]; then curl --connect-timeout 10 --max-time 30 -fsS "https://$DEPLOY_DOMAIN/api/health"; fi
touch "$new/.healthy"
trap - ERR
for candidate in "$base"/releases/*; do
 [[ -d "$candidate" ]] || continue
 [[ "$candidate" == "$new" ]] && continue
 [[ "$candidate" == "$old" && -f "$candidate/.healthy" ]] && continue
 rm -rf -- "$candidate"
done
echo "[$DEPLOY_REGION] 完整发布成功：$new"
