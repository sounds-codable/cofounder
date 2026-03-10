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
LOCAL_FRONTEND_DIST="$PROJECT_ROOT/client/dist"
LOCAL_BACKEND_DIST="$PROJECT_ROOT/server/dist"

log() {
  echo "[$(date '+%F %T')] $*"
}

die() {
  echo "ERROR: $*" >&2
  exit 1
}

if [[ "$MODE" != "frontend" && "$MODE" != "backend" && "$MODE" != "all" ]]; then
  die "Usage: $0 [frontend|backend|all]"
fi

log "Deploy target: $SSH_TARGET"

if [[ "$MODE" == "backend" || "$MODE" == "all" ]]; then
  log "Building backend locally"
  (cd "$PROJECT_ROOT/server" && npm ci)
  (cd "$PROJECT_ROOT/server" && npm run build)

  if [[ ! -d "$LOCAL_BACKEND_DIST" ]]; then
    die "Local backend dist not found at $LOCAL_BACKEND_DIST"
  fi
fi

if [[ "$MODE" == "frontend" || "$MODE" == "all" ]]; then
  log "Building frontend locally"
  (cd "$PROJECT_ROOT/client" && npm ci --legacy-peer-deps)
  (cd "$PROJECT_ROOT/client" && npm run build:h5)

  if [[ ! -d "$LOCAL_FRONTEND_DIST" ]]; then
    die "Local frontend dist not found at $LOCAL_FRONTEND_DIST"
  fi
fi

upload_frontend() {
  local remote_dist
  remote_dist="$APP_ROOT/releases/$RELEASE_ID/client/dist"

  log "Uploading frontend dist to $SSH_TARGET:$remote_dist"
  ssh -T "$SSH_TARGET" "mkdir -p '$remote_dist'"

  # 使用 rsync 增量上传，避免每次全量 copy
  # -a: 保留权限/时间戳等
  # --delete: 远端删除本地已删除的文件（确保 dist 同步）
  rsync -az --delete -e ssh "$LOCAL_FRONTEND_DIST/" "$SSH_TARGET:$remote_dist/"
}

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

if [[ "$MODE" == "frontend" || "$MODE" == "all" ]]; then
  upload_frontend
fi

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
  log "Deploying frontend (remote receives static files from local)"

  log "Preparing frontend release dir"
  mkdir -p "$RELEASE_DIR/client"
  mkdir -p "$RELEASE_DIR/client/dist"
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

if [[ "$MODE" == "frontend" || "$MODE" == "all" ]]; then
  log "Updating current symlink -> $RELEASE_DIR"
  if [[ -L "$CURRENT_DIR" ]]; then
    rm -f "$CURRENT_DIR"
  elif [[ -e "$CURRENT_DIR" ]]; then
    rm -rf "$CURRENT_DIR"
  fi
  ln -s "$RELEASE_DIR" "$CURRENT_DIR"
fi

log "Keeping last 5 releases"
ls -1dt "$RELEASES_DIR"/* 2>/dev/null | tail -n +6 | xargs -r rm -rf

log "Done"
EOSSH

log "Done"
