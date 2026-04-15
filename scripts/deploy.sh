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
    die "Missing lexicon dir: $lexicon_dir\n请先执行：\n  cd server\n  npm run moderation:sync-lexicon"
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
    die "No lexicon txt found in $lexicon_dir\n请先执行：\n  cd server\n  npm run moderation:sync-lexicon"
  fi

  local now
  now="$(date +%s)"
  local max_age_seconds=$((30 * 24 * 60 * 60))
  local age_seconds=$((now - latest_mtime))

  if (( age_seconds > max_age_seconds )); then
    local age_days=$((age_seconds / 86400))
    die "内容风控词库已超过30天未更新（最新文件：$latest_file，约 ${age_days} 天前）。\n请先执行以下命令后再部署：\n  cd server\n  npm run moderation:sync-lexicon"
  fi
}

if [[ "$MODE" != "frontend" && "$MODE" != "backend" && "$MODE" != "all" ]]; then
  die "Usage: $0 [frontend|backend|all]"
fi

check_moderation_lexicon_freshness

log "Deploy target: $SSH_TARGET"

if [[ "$MODE" == "backend" || "$MODE" == "all" ]]; then
  log "Building backend locally"
  (cd "$PROJECT_ROOT/server" && npm ci)
  (cd "$PROJECT_ROOT/server" && npm run build)

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
  if [[ -f "$PROJECT_ROOT/server/package-lock.json" ]]; then
    rsync -az -e ssh "$PROJECT_ROOT/server/package-lock.json" "$SSH_TARGET:$remote_server_dir/package-lock.json"
  fi

  # .env symlink will be created on remote
}

if [[ "$MODE" == "backend" || "$MODE" == "all" ]]; then
  upload_backend
fi

ssh -T "$SSH_TARGET" env APP_ROOT="$APP_ROOT" BRANCH="$BRANCH" MODE="$MODE" GIT_URL="$GIT_URL" RELEASE_ID="$RELEASE_ID" bash -s <<'EOSSH'
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

if [[ "$MODE" != "frontend" && "$MODE" != "backend" && "$MODE" != "all" ]]; then
  die "Usage: deploy.sh [frontend|backend|all]"
fi

mkdir -p "$SHARED_DIR/server" "$SHARED_DIR/logs" "$RELEASES_DIR"

if [[ ! -d "$REPO_DIR/.git" ]]; then
  if [[ -n "$GIT_URL" ]]; then
    log "Repo not initialized. Cloning $GIT_URL into $REPO_DIR"
    if [[ -n "$(ls -A "$REPO_DIR" 2>/dev/null || true)" ]]; then
      die "$REPO_DIR is not empty but not a git repo. Please clean it up manually."
    fi
    mkdir -p "$REPO_DIR"
    git clone "$GIT_URL" "$REPO_DIR"
  else
    die "Repo not found at $REPO_DIR. Set GIT_URL env on server (or initialize repo manually)."
  fi
fi

log "Updating repo ($BRANCH)"
git -C "$REPO_DIR" fetch --all --prune
git -C "$REPO_DIR" checkout "$BRANCH"
git -C "$REPO_DIR" reset --hard "origin/$BRANCH"

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

  log "Installing backend dependencies (release)"
  (cd "$RELEASE_DIR/server" && npm ci)

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

  if [[ ! -f "$REPO_DIR/client/package.json" ]]; then
    die "Missing $REPO_DIR/client/package.json"
  fi

  log "Syncing frontend source from repo to release"
  mkdir -p "$RELEASE_DIR/client"
  rsync -a --delete \
    --exclude node_modules \
    --exclude .next \
    "$REPO_DIR/client/" "$RELEASE_DIR/client/"

  log "Installing frontend dependencies (release)"
  (cd "$RELEASE_DIR/client" && npm ci)

  log "Building frontend (Next production build)"
  (cd "$RELEASE_DIR/client" && npm run build)

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

log "Keeping last 5 releases"
ls -1dt "$RELEASES_DIR"/* 2>/dev/null | tail -n +6 | xargs -r rm -rf

log "Done"
EOSSH

log "Done"
