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

ssh -tt "$SSH_TARGET" env APP_ROOT="$APP_ROOT" BRANCH="$BRANCH" MODE="$MODE" GIT_URL="$GIT_URL" bash -s <<'EOSSH'
set -euo pipefail

MODE="${MODE:-all}"
BRANCH="${BRANCH:-main}"
APP_ROOT="${APP_ROOT:-/var/www/www.cofounder.icu}"
REPO_DIR="$APP_ROOT/repo"
SHARED_DIR="$APP_ROOT/shared"
CURRENT_DIR="$APP_ROOT/current"
RELEASES_DIR="$APP_ROOT/releases"
RELEASE_ID="$(date +%Y%m%d%H%M%S)"
RELEASE_DIR="$RELEASES_DIR/$RELEASE_ID"

GIT_URL="${GIT_URL:-}"

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
    git clone "$GIT_URL" "$REPO_DIR".
  else
    die "Repo not found at $REPO_DIR. Set GIT_URL env on server (or initialize repo manually)."
  fi
fi

log "Updating repo ($BRANCH)"
git -C "$REPO_DIR" fetch --all --prune
git -C "$REPO_DIR" checkout "$BRANCH"
git -C "$REPO_DIR" reset --hard "origin/$BRANCH"

deploy_backend() {
  log "Deploying backend"

  if [[ ! -f "$SHARED_DIR/server/.env" ]]; then
    die "Missing $SHARED_DIR/server/.env (put production env there first)"
  fi

  rm -f "$REPO_DIR/server/.env"
  ln -s "$SHARED_DIR/server/.env" "$REPO_DIR/server/.env"

  log "Installing backend dependencies (repo)"
  (cd "$REPO_DIR/server" && npm ci)

  log "Building backend (repo)"
  (cd "$REPO_DIR/server" && npm run build)

  log "Preparing backend release dir"
  mkdir -p "$RELEASE_DIR/server"

  # dist
  rm -rf "$RELEASE_DIR/server/dist"
  cp -R "$REPO_DIR/server/dist" "$RELEASE_DIR/server/dist"

  # runtime deps
  cp "$REPO_DIR/server/package.json" "$RELEASE_DIR/server/package.json"
  if [[ -f "$REPO_DIR/server/package-lock.json" ]]; then
    cp "$REPO_DIR/server/package-lock.json" "$RELEASE_DIR/server/package-lock.json"
  fi
  rm -rf "$RELEASE_DIR/server/node_modules"
  cp -R "$REPO_DIR/server/node_modules" "$RELEASE_DIR/server/node_modules"

  # env symlink
  rm -f "$RELEASE_DIR/server/.env"
  ln -s "$SHARED_DIR/server/.env" "$RELEASE_DIR/server/.env"

  log "Restarting supervisor program cofounder-backend"
  sudo supervisorctl reread
  sudo supervisorctl update
  sudo supervisorctl restart cofounder-backend
}

deploy_frontend() {
  log "Deploying frontend"

  log "Installing frontend dependencies (repo)"
  (cd "$REPO_DIR/client" && npm ci --legacy-peer-deps)

  log "Building frontend (repo)"
  (cd "$REPO_DIR/client" && npm run build:h5)

  log "Preparing frontend release dir"
  mkdir -p "$RELEASE_DIR/client"
  rm -rf "$RELEASE_DIR/client/dist"
  cp -R "$REPO_DIR/client/dist" "$RELEASE_DIR/client/dist"
}

log "Creating release dir: $RELEASE_DIR"
mkdir -p "$RELEASE_DIR"

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

log "Updating current symlink -> $RELEASE_DIR"
rm -f "$CURRENT_DIR"
ln -s "$RELEASE_DIR" "$CURRENT_DIR"

log "Keeping last 5 releases"
ls -1dt "$RELEASES_DIR"/* 2>/dev/null | tail -n +6 | xargs -r rm -rf

log "Done"
EOSSH

log "Done"
