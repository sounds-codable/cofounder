#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

ENV_FILE=""
if [[ -f "$PROJECT_ROOT/.env" ]]; then
  ENV_FILE="$PROJECT_ROOT/.env"
fi

if [[ -n "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

DEPLOY_HOST="${DEPLOY_HOST:-${SERVER_HOST:-49.235.209.193}}"
DEPLOY_USER="${DEPLOY_USER:-${SERVER_USER:-deployer}}"
SERVER="${DEPLOY_USER}@${DEPLOY_HOST}"

APP_ROOT="${APP_ROOT:-/var/www/www.cofounder.icu}"
NGINX_SITE_NAME="${NGINX_SITE_NAME:-cofounder.icu}"
SUPERVISOR_PROGRAM_NAME="${SUPERVISOR_PROGRAM_NAME:-cofounder-backend}"

LOCAL_NGINX_CONF="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/docs/deployment/nginx.cofounder.icu.conf"
LOCAL_SUPERVISOR_CONF="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/docs/deployment/supervisor.cofounder-backend.conf"

log() {
  echo "[$(date '+%F %T')] $*"
}

die() {
  echo "ERROR: $*" >&2
  exit 1
}

[[ -f "$LOCAL_NGINX_CONF" ]] || die "Missing $LOCAL_NGINX_CONF"
[[ -f "$LOCAL_SUPERVISOR_CONF" ]] || die "Missing $LOCAL_SUPERVISOR_CONF"

log "Uploading nginx config to server: $SERVER"
scp "$LOCAL_NGINX_CONF" "$SERVER:/tmp/${NGINX_SITE_NAME}.nginx.conf"

log "Uploading supervisor config to server: $SERVER"
scp "$LOCAL_SUPERVISOR_CONF" "$SERVER:/tmp/${SUPERVISOR_PROGRAM_NAME}.supervisor.conf"

log "Applying configs and restarting services on server"
ssh "$SERVER" APP_ROOT="$APP_ROOT" NGINX_SITE_NAME="$NGINX_SITE_NAME" SUPERVISOR_PROGRAM_NAME="$SUPERVISOR_PROGRAM_NAME" bash -s <<'EOSSH'
set -euo pipefail

APP_ROOT="${APP_ROOT:?}"
NGINX_SITE_NAME="${NGINX_SITE_NAME:?}"
SUPERVISOR_PROGRAM_NAME="${SUPERVISOR_PROGRAM_NAME:?}"

TMP_NGINX_CONF="/tmp/${NGINX_SITE_NAME}.nginx.conf"
TMP_SUP_CONF="/tmp/${SUPERVISOR_PROGRAM_NAME}.supervisor.conf"

# Ensure directories
sudo mkdir -p "$APP_ROOT/shared/logs"

# --- Nginx ---
if command -v nginx >/dev/null 2>&1; then
  sudo mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled

  if [[ -f "/etc/nginx/sites-available/${NGINX_SITE_NAME}" ]]; then
    sudo cp "/etc/nginx/sites-available/${NGINX_SITE_NAME}" "/etc/nginx/sites-available/${NGINX_SITE_NAME}.bak.$(date +%s)"
  fi

  sudo cp "$TMP_NGINX_CONF" "/etc/nginx/sites-available/${NGINX_SITE_NAME}"
  sudo ln -sf "/etc/nginx/sites-available/${NGINX_SITE_NAME}" "/etc/nginx/sites-enabled/${NGINX_SITE_NAME}"

  sudo nginx -t
  sudo systemctl reload nginx
else
  echo "WARN: nginx not installed; skipped nginx reload" >&2
fi

# --- Supervisor ---
if command -v supervisorctl >/dev/null 2>&1; then
  sudo mkdir -p /etc/supervisor/conf.d

  if [[ -f "/etc/supervisor/conf.d/${SUPERVISOR_PROGRAM_NAME}.conf" ]]; then
    sudo cp "/etc/supervisor/conf.d/${SUPERVISOR_PROGRAM_NAME}.conf" "/etc/supervisor/conf.d/${SUPERVISOR_PROGRAM_NAME}.conf.bak.$(date +%s)"
  fi

  sudo cp "$TMP_SUP_CONF" "/etc/supervisor/conf.d/${SUPERVISOR_PROGRAM_NAME}.conf"

  sudo supervisorctl reread
  sudo supervisorctl update
  sudo supervisorctl restart "$SUPERVISOR_PROGRAM_NAME" || true
else
  echo "WARN: supervisor not installed; skipped supervisor reload" >&2
fi

echo "OK"
EOSSH

log "Done"
