#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-all}"   # frontend | backend | all
BRANCH="${BRANCH:-main}"

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

DEPLOY_HOST="${DEPLOY_HOST:-}"
DEPLOY_USER="${DEPLOY_USER:-}"
GIT_URL="${GIT_URL:-}"
FRONTEND_NODE_BIN="${FRONTEND_NODE_BIN:-/usr/bin}"
if [[ -z "$DEPLOY_HOST" || -z "$DEPLOY_USER" ]]; then
  echo "ERROR: Missing DEPLOY_HOST / DEPLOY_USER. Put them in project root .env" >&2
  exit 1
fi

SSH_TARGET="${DEPLOY_USER}@${DEPLOY_HOST}"

APP_ROOT="/var/www/www.cofounder.icu"
REPO_DIR="$APP_ROOT/repo"
SHARED_DIR="$APP_ROOT/shared"
CURRENT_DIR="$APP_ROOT/current"
RELEASES_DIR="$APP_ROOT/releases"

RELEASE_ID="$(date +%Y%m%d%H%M%S)"
LOCAL_BACKEND_DIST="$PROJECT_ROOT/server/dist"

log() {
  echo "[$(date '+%F %T')] $*"
}

die() {
  echo "ERROR: $*" >&2
  exit 1
}

get_file_mtime_epoch() {
  local file
  file="$1"

  if stat -f "%m" "$file" >/dev/null 2>&1; then
    stat -f "%m" "$file"
    return
  fi

  if stat -c "%Y" "$file" >/dev/null 2>&1; then
    stat -c "%Y" "$file"
    return
  fi

  echo "0"
}

check_moderation_lexicon_freshness() {
  local lexicon_dir
  lexicon_dir="$PROJECT_ROOT/server/src/config/content-moderation-lexicon/upstream"

  if [[ ! -d "$lexicon_dir" ]]; then
    die "Missing lexicon dir: $lexicon_dir\n请先执行：\n  cd server\n  corepack pnpm moderation:sync-lexicon"
  fi

  local latest_mtime=0
  local latest_file=""
  local file

  for file in "$lexicon_dir"/*.txt; do
    [[ -f "$file" ]] || continue
    local mtime
    mtime="$(get_file_mtime_epoch "$file")"
    if (( mtime > latest_mtime )); then
      latest_mtime="$mtime"
      latest_file="$file"
    fi
  done

  if (( latest_mtime == 0 )); then
    die "No lexicon txt found in $lexicon_dir\n请先执行：\n  cd server\n  corepack pnpm moderation:sync-lexicon"
  fi

  local now
  now="$(date +%s)"
  local max_age_seconds=$((30 * 24 * 60 * 60))
  local age_seconds=$((now - latest_mtime))

  if (( age_seconds > max_age_seconds )); then
    local age_days=$((age_seconds / 86400))
    die "内容风控词库已超过30天未更新（最新文件：${latest_file}，约 ${age_days} 天前）。\n请先执行以下命令后再部署：\n  cd server\n  corepack pnpm moderation:sync-lexicon"
  fi
}

if [[ "$MODE" != "frontend" && "$MODE" != "backend" && "$MODE" != "all" ]]; then
  die "Usage: $0 [frontend|backend|all]"
fi

check_moderation_lexicon_freshness

log "Deploy target: $SSH_TARGET"

if [[ "$MODE" == "backend" || "$MODE" == "all" ]]; then
  log "Building backend locally"
  (cd "$PROJECT_ROOT/server" && corepack pnpm install --frozen-lockfile)
  (cd "$PROJECT_ROOT/server" && corepack pnpm build)

  if [[ ! -d "$LOCAL_BACKEND_DIST" ]]; then
    die "Local backend dist not found at $LOCAL_BACKEND_DIST"
  fi
fi

upload_backend() {
  local remote_server_dir
  remote_server_dir="$APP_ROOT/releases/$RELEASE_ID/server"

  log "Uploading backend build to $SSH_TARGET:$remote_server_dir"
  ssh -T "$SSH_TARGET" "mkdir -p '$remote_server_dir' '$APP_ROOT/releases/$RELEASE_ID/client'"

  # dist
  rsync -az --delete -e ssh "$PROJECT_ROOT/server/dist/" "$SSH_TARGET:$remote_server_dir/dist/"

  # package files (dependencies will be installed on server)
  rsync -az -e ssh "$PROJECT_ROOT/server/package.json" "$SSH_TARGET:$remote_server_dir/package.json"
  [[ -f "$PROJECT_ROOT/server/pnpm-lock.yaml" ]] || die "Missing $PROJECT_ROOT/server/pnpm-lock.yaml"
  [[ -f "$PROJECT_ROOT/server/pnpm-workspace.yaml" ]] || die "Missing $PROJECT_ROOT/server/pnpm-workspace.yaml"
  rsync -az -e ssh "$PROJECT_ROOT/server/pnpm-lock.yaml" "$SSH_TARGET:$remote_server_dir/pnpm-lock.yaml"
  rsync -az -e ssh "$PROJECT_ROOT/server/pnpm-workspace.yaml" "$SSH_TARGET:$remote_server_dir/pnpm-workspace.yaml"

  # .env symlink will be created on remote
}

if [[ "$MODE" == "backend" || "$MODE" == "all" ]]; then
  upload_backend
fi

upload_frontend() {
  local remote_client_dir
  remote_client_dir="$APP_ROOT/releases/$RELEASE_ID/client"

  log "Uploading frontend source to $SSH_TARGET:$remote_client_dir"
  ssh -T "$SSH_TARGET" "mkdir -p '$remote_client_dir'"
  rsync -az --delete -e ssh \
    --exclude node_modules \
    --exclude .next \
    "$PROJECT_ROOT/client/" "$SSH_TARGET:$remote_client_dir/"
}

if [[ "$MODE" == "frontend" || "$MODE" == "all" ]]; then
  upload_frontend
fi

ssh -T -o ServerAliveInterval=15 -o ServerAliveCountMax=4 "$SSH_TARGET" \
  env APP_ROOT="$APP_ROOT" BRANCH="$BRANCH" MODE="$MODE" GIT_URL="$GIT_URL" RELEASE_ID="$RELEASE_ID" FRONTEND_NODE_BIN="$FRONTEND_NODE_BIN" bash -s <<'EOSSH'
set -euo pipefail

MODE="${MODE:-all}"
BRANCH="${BRANCH:-main}"
APP_ROOT="${APP_ROOT:-/var/www/www.cofounder.icu}"
REPO_DIR="$APP_ROOT/repo"
SHARED_DIR="$APP_ROOT/shared"
CURRENT_DIR="$APP_ROOT/current"
RELEASES_DIR="$APP_ROOT/releases"
RELEASE_ID="${RELEASE_ID:-$(date +%Y%m%d%H%M%S)}"
RELEASE_DIR="$RELEASES_DIR/$RELEASE_ID"
FRONTEND_NODE_BIN="${FRONTEND_NODE_BIN:-/usr/bin}"

GIT_URL="${GIT_URL:-}"
if [[ -z "$GIT_URL" && -f "$SHARED_DIR/server/.env" ]]; then
  # 从 shared/server/.env 里取 GIT_URL（允许放在同一个 env 文件里）
  GIT_URL="$(grep -E '^GIT_URL=' "$SHARED_DIR/server/.env" | tail -n 1 | cut -d= -f2- | tr -d '"\r')"
fi

log() {
  echo "[REMOTE $(date '+%F %T')] $*"
}

die() {
  echo "[REMOTE ERROR] $*" >&2
  exit 1
}

pnpm_install_shared() {
  local project_dir=$1
  shift
  sudo env PNPM_SHARED_STORE_DIR="${PNPM_SHARED_STORE_DIR:-/root/.local/share/pnpm/store}" \
    flock -x /run/lock/xixisys-pnpm-store.lock bash -c '
      set -Eeuo pipefail
      project_dir=$1
      shift
      shared_store=$PNPM_SHARED_STORE_DIR
      [[ $shared_store == /* ]] || { echo "PNPM_SHARED_STORE_DIR 必须是绝对路径。" >&2; exit 1; }
      install -d -o root -g root -m 0755 "$shared_store"
      cd "$project_dir"
      echo "使用全服务器共享 pnpm store：$shared_store"
      if ! corepack pnpm install "$@" --frozen-lockfile --offline \
        --store-dir "$shared_store" --package-import-method=hardlink; then
        echo "共享 store 尚缺少部分依赖，联网补齐后继续；已存在的包不会重复下载。"
        corepack pnpm install "$@" --frozen-lockfile \
          --store-dir "$shared_store" --package-import-method=hardlink
      fi
    ' _ "$project_dir" "$@"
}

if [[ "$MODE" != "frontend" && "$MODE" != "backend" && "$MODE" != "all" ]]; then
  die "Usage: deploy.sh [frontend|backend|all]"
fi

mkdir -p "$SHARED_DIR/server" "$SHARED_DIR/logs" "$RELEASES_DIR"

deploy_backend() {
  log "Deploying backend (remote receives build artifacts from local)"

  if [[ ! -f "$SHARED_DIR/server/.env" ]]; then
    die "Missing $SHARED_DIR/server/.env (put production env there first)"
  fi

  if [[ ! -d "$RELEASE_DIR/server/dist" ]]; then
    die "Missing $RELEASE_DIR/server/dist on server. Upload step may have failed."
  fi

  if [[ ! -f "$RELEASE_DIR/server/package.json" ]]; then
    die "Missing $RELEASE_DIR/server/package.json on server. Upload step may have failed."
  fi
  if [[ ! -f "$RELEASE_DIR/server/pnpm-workspace.yaml" ]]; then
    die "Missing $RELEASE_DIR/server/pnpm-workspace.yaml on server. Upload step may have failed."
  fi

  log "Installing backend dependencies from the server-wide pnpm store"
  pnpm_install_shared "$RELEASE_DIR/server" --prod

  # env symlink
  rm -f "$RELEASE_DIR/server/.env"
  ln -s "$SHARED_DIR/server/.env" "$RELEASE_DIR/server/.env"

  log "Updating current/server -> $RELEASE_DIR/server (do not touch current/client)"
  mkdir -p "$CURRENT_DIR"
  rm -f "$CURRENT_DIR/server"
  ln -s "$RELEASE_DIR/server" "$CURRENT_DIR/server"

  log "Verifying current/server exists"
  ls -la "$CURRENT_DIR" || true
  ls -la "$CURRENT_DIR/server" || true

  log "Restarting supervisor program cofounder-backend"
  sudo supervisorctl reread
  sudo supervisorctl update
  sudo supervisorctl restart cofounder-backend
}

deploy_frontend() {
  log "Deploying frontend (build on server for Next runtime)"

  [[ -f "$RELEASE_DIR/client/package.json" ]] || die "Missing uploaded $RELEASE_DIR/client/package.json"
  [[ -f "$RELEASE_DIR/client/pnpm-lock.yaml" ]] || die "Missing $RELEASE_DIR/client/pnpm-lock.yaml"

  if [[ ! -x "$FRONTEND_NODE_BIN/node" || ! -x "$FRONTEND_NODE_BIN/npm" ]]; then
    die "Missing Node/NPM in FRONTEND_NODE_BIN=$FRONTEND_NODE_BIN，请先安装 Node >= 20.9 并在部署环境变量里配置 FRONTEND_NODE_BIN"
  fi

  log "Using frontend runtime: $FRONTEND_NODE_BIN/node"
  "$FRONTEND_NODE_BIN/node" -v

  log "Installing frontend dependencies from the server-wide pnpm store"
  pnpm_install_shared "$RELEASE_DIR/client"

  local libc_flavor
  libc_flavor="$($FRONTEND_NODE_BIN/node -e "
    try {
      const { familySync, MUSL } = require('detect-libc');
      const family = familySync();
      process.stdout.write(family === MUSL ? 'musl' : 'gnu');
    } catch (_) {
      process.stdout.write('unknown');
    }
  ")"

  if [[ "$libc_flavor" != "gnu" && "$libc_flavor" != "musl" ]]; then
    if ldd --version 2>&1 | grep -qi musl; then
      libc_flavor="musl"
    else
      libc_flavor="gnu"
    fi
  fi

  log "Detected libc flavor: $libc_flavor"
  log "Verifying native bindings (lightningcss + oxide)"
  (
    cd "$RELEASE_DIR/client" && \
    PATH="$FRONTEND_NODE_BIN:$PATH" "$FRONTEND_NODE_BIN/node" -e "require('lightningcss'); require('@tailwindcss/oxide'); console.log('native bindings ok')"
  )

  log "Building frontend (Next production build)"
  (cd "$RELEASE_DIR/client" && PATH="$FRONTEND_NODE_BIN:$PATH" corepack pnpm build)

  log "Updating current/client -> $RELEASE_DIR/client (do not touch current/server)"
  mkdir -p "$CURRENT_DIR"
  rm -f "$CURRENT_DIR/client"
  ln -s "$RELEASE_DIR/client" "$CURRENT_DIR/client"

  log "Restarting supervisor program cofounder-frontend"
  sudo supervisorctl reread
  sudo supervisorctl update
  sudo supervisorctl restart cofounder-frontend
}

log "Creating release dir: $RELEASE_DIR"
mkdir -p "$RELEASE_DIR/server" "$RELEASE_DIR/client"

case "$MODE" in
  backend)
    deploy_backend
    ;;
  frontend)
    deploy_frontend
    ;;
  all)
    deploy_frontend
    deploy_backend
    ;;
esac

log "Current layout: $CURRENT_DIR/{server,client} are symlinks to release content"

log "Keeping at most 2 releases in total (current component releases plus rollback)"
current_client_target="$(readlink -f "$CURRENT_DIR/client" 2>/dev/null || true)"
current_server_target="$(readlink -f "$CURRENT_DIR/server" 2>/dev/null || true)"
current_client_release="${current_client_target:+$(dirname "$current_client_target")}"
current_server_release="${current_server_target:+$(dirname "$current_server_target")}"
current_releases_kept=0
if [[ -n $current_client_release ]]; then
  ((current_releases_kept += 1))
fi
if [[ -n $current_server_release && $current_server_release != "$current_client_release" ]]; then
  ((current_releases_kept += 1))
fi
rollback_releases_limit=$((2 - current_releases_kept))
if (( rollback_releases_limit < 0 )); then
  rollback_releases_limit=0
fi
rollback_releases_kept=0
mapfile -t release_dirs < <(
  find "$RELEASES_DIR" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' |
    sort -rn |
    cut -d' ' -f2-
)
for old_release in "${release_dirs[@]}"; do
  [[ $old_release == "$RELEASES_DIR/"* ]] || die "Invalid release cleanup target: $old_release"
  if [[ $old_release == "$current_client_release" || $old_release == "$current_server_release" ]]; then
    continue
  fi
  if (( rollback_releases_kept < rollback_releases_limit )); then
    ((rollback_releases_kept += 1))
    continue
  fi
  sudo rm -rf -- "$old_release"
done

log "Done"
EOSSH

log "Done"
