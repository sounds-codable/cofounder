#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

FRONTEND_PORT=3000
BACKEND_PORT=3010
MODE="${1:-single}" # single | split | auto

log() {
  echo "[$(date '+%F %T')] $*"
}

sanitize_next_router_dirs() {
  local client_dir="$PROJECT_ROOT/client"
  local app_dir="$client_dir/app"
  local legacy_pages_dir="$client_dir/src/pages"

  if [[ ! -d "$app_dir" || ! -d "$legacy_pages_dir" ]]; then
    return
  fi

  # Next.js app router 项目中，残留的 src/pages 会导致:
  # `pages` and `app` directories should be under the same folder
  # 仅在目录为空（或仅 .DS_Store）时自动清理；否则给出明确提示并退出。
  local entries
  entries="$(ls -A "$legacy_pages_dir" 2>/dev/null || true)"

  if [[ -z "$entries" || "$entries" == ".DS_Store" ]]; then
    rm -f "$legacy_pages_dir/.DS_Store" 2>/dev/null || true
    rmdir "$legacy_pages_dir" 2>/dev/null || true
    log "已清理残留目录: client/src/pages"
    return
  fi

  log "检测到 client/src/pages 与 client/app 同时存在，Next.js 会启动失败。"
  log "请迁移或删除 client/src/pages 后重试。当前目录内容: $entries"
  exit 1
}

kill_port() {
  local port="$1"
  local pids

  pids="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -z "$pids" ]]; then
    log "端口 $port 未被占用"
    return
  fi

  log "先停止端口 $port 上的进程: $pids"
  kill $pids 2>/dev/null || true
  sleep 1

  pids="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -n "$pids" ]]; then
    log "端口 $port 仍占用，强制停止: $pids"
    kill -9 $pids 2>/dev/null || true
  fi
}

start_single_terminal() {
  log "单终端模式：同时输出前后端实时日志"

  (
    cd "$PROJECT_ROOT/client"
    npm run dev
  ) 2>&1 | sed -u 's/^/[frontend] /' &
  local frontend_pid=$!

  (
    cd "$PROJECT_ROOT/server"
    npm run start:dev
  ) 2>&1 | sed -u 's/^/[backend] /' &
  local backend_pid=$!

  cleanup() {
    kill "$frontend_pid" "$backend_pid" 2>/dev/null || true
  }

  trap cleanup INT TERM EXIT

  local exit_code=0
  while true; do
    if ! kill -0 "$frontend_pid" 2>/dev/null; then
      wait "$frontend_pid" || exit_code=$?
      break
    fi

    if ! kill -0 "$backend_pid" 2>/dev/null; then
      wait "$backend_pid" || exit_code=$?
      break
    fi

    sleep 1
  done

  log "有一个进程已退出，正在停止另一个进程"
  cleanup
  wait "$frontend_pid" "$backend_pid" 2>/dev/null || true
  exit "$exit_code"
}

start_split_terminal() {
  log "当前脚本不再拉起 mac Terminal，已切换为同终端分流日志模式"
  start_single_terminal
}

main() {
  sanitize_next_router_dirs
  kill_port "$FRONTEND_PORT"
  kill_port "$BACKEND_PORT"

  case "$MODE" in
    split)
      start_split_terminal
      ;;
    single)
      start_single_terminal
      ;;
    auto)
      start_single_terminal
      ;;
    *)
      echo "Usage: $0 [auto|split|single]" >&2
      exit 1
      ;;
  esac
}

main "$@"
