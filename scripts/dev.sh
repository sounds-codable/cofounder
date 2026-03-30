#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

FRONTEND_PORT=3000
BACKEND_PORT=3010
MODE="${1:-auto}" # auto | split | single

log() {
  echo "[$(date '+%F %T')] $*"
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

  cd "$PROJECT_ROOT"

  npm run dev --prefix client 2>&1 | sed -u 's/^/[frontend] /' &
  local frontend_pid=$!

  npm run start:dev --prefix server 2>&1 | sed -u 's/^/[backend] /' &
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
  if ! command -v osascript >/dev/null 2>&1; then
    return 1
  fi

  log "双终端模式：分别启动前端和后端"

  local frontend_cmd
  local backend_cmd

  frontend_cmd="cd \"$PROJECT_ROOT\" && npm run dev --prefix client"
  backend_cmd="cd \"$PROJECT_ROOT\" && npm run start:dev --prefix server"

  osascript <<EOF
  tell application "Terminal"
    activate
    do script "$frontend_cmd"
    do script "$backend_cmd"
  end tell
EOF
}

main() {
  kill_port "$FRONTEND_PORT"
  kill_port "$BACKEND_PORT"

  case "$MODE" in
    split)
      start_split_terminal || start_single_terminal
      ;;
    single)
      start_single_terminal
      ;;
    auto)
      if ! start_split_terminal; then
        log "无法打开双终端，自动降级为单终端模式"
        start_single_terminal
      fi
      ;;
    *)
      echo "Usage: $0 [auto|split|single]" >&2
      exit 1
      ;;
  esac
}

main "$@"
