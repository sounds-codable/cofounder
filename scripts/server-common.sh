#!/usr/bin/env bash
set -euo pipefail
base=/var/www/www.cofounder.icu
runtime_home=/var/lib/cofounder
app_user=cofounder
as_app() { runuser -u "$app_user" -- env HOME="$runtime_home" PATH="$runtime_home/bin:/usr/bin:/bin" "$@"; }
verify_target() {
 [[ "$(cat "$base/shared/region")" == "${DEPLOY_REGION:?缺少区域}" ]] || { echo '服务器区域不匹配'; exit 1; }
}
# 代理仅对当前安装/发布进程生效。
unset all_proxy ALL_PROXY http_proxy HTTP_PROXY https_proxy HTTPS_PROXY no_proxy NO_PROXY
if [[ "${DEPLOY_USE_PROXY:-false}" == true ]]; then
 export all_proxy="socks5://${DEPLOY_PROXY_HOST:-127.0.0.1}:${DEPLOY_PROXY_PORT:-1080}" ALL_PROXY="socks5://${DEPLOY_PROXY_HOST:-127.0.0.1}:${DEPLOY_PROXY_PORT:-1080}"
 export http_proxy="http://${DEPLOY_PROXY_HOST:-127.0.0.1}:${DEPLOY_HTTP_PROXY_PORT:-1087}" https_proxy="http://${DEPLOY_PROXY_HOST:-127.0.0.1}:${DEPLOY_HTTP_PROXY_PORT:-1087}"
 export HTTP_PROXY="$http_proxy" HTTPS_PROXY="$https_proxy" no_proxy=127.0.0.1,localhost NO_PROXY=127.0.0.1,localhost
fi
