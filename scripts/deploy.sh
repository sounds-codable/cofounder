#!/usr/bin/env bash
# 兼容原脚本路径，统一使用区域参数，发布完整前后端。
set -euo pipefail
exec bash "$(dirname "$0")/deploy-remote.sh" "$@"
