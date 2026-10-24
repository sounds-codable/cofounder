#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
root="$PWD"
build_root=$(mktemp -d "${TMPDIR:-/tmp}/cofounder-build.XXXXXX")
stage_root=$(mktemp -d "${TMPDIR:-/tmp}/cofounder-stage.XXXXXX")
trap 'rm -rf "$build_root" "$stage_root"' EXIT
for part in server client; do
 mkdir -p "$build_root/$part"
 rsync -a --exclude='.env*' --exclude=node_modules --exclude=.next --exclude=dist --exclude=out --exclude='*.tsbuildinfo' --exclude=coverage --exclude='._*' "$root/$part/" "$build_root/$part/"
done
# 词库更新只发生于隔离副本，发布失败不会污染工作区。
(cd "$build_root/server" && corepack pnpm install --frozen-lockfile && NODE_USE_ENV_PROXY=1 corepack pnpm moderation:sync-lexicon && corepack pnpm test --runInBand && corepack pnpm build)
python3 - "$build_root/server/src/config/content-moderation-lexicon/upstream" <<'PYCHECK'
from pathlib import Path
import sys,time
files=list(Path(sys.argv[1]).glob('*.txt'))
if len(files)<5 or any(time.time()-p.stat().st_mtime>30*86400 for p in files):
    raise SystemExit('风控词库缺失或超过30天，拒绝发布')
PYCHECK
(cd "$build_root/client" && corepack pnpm install --frozen-lockfile && API_INTERNAL_URL=http://127.0.0.1:9/api NEXT_PUBLIC_SITE_URL=https://cofounder.icu corepack pnpm build)
mkdir -p "$stage_root/release/"{server,client,scripts}
cp "$build_root/server/package.json" "$build_root/server/pnpm-lock.yaml" "$build_root/server/pnpm-workspace.yaml" "$stage_root/release/server/"
cp -R "$build_root/server/dist" "$stage_root/release/server/"
cp "$build_root/client/package.json" "$build_root/client/pnpm-lock.yaml" "$build_root/client/pnpm-workspace.yaml" "$build_root/client/tsconfig.json" "$stage_root/release/client/"
printf '%s\n' 'export default { images: { unoptimized: true } };' > "$stage_root/release/client/next.config.mjs"
cp -R "$build_root/client/public" "$stage_root/release/client/"
rsync -a --exclude=cache --exclude=dev "$build_root/client/.next/" "$stage_root/release/client/.next/"
for file in server-common.sh server-deploy.sh server-port-audit.py native-service.mjs health-check.mjs; do cp "$root/scripts/$file" "$stage_root/release/scripts/"; done
cp "$root/ecosystem.config.cjs" "$stage_root/release/"
if find "$stage_root/release" \( -name '.env*' -o -name node_modules -o -name .git \) -print -quit | grep -q .; then echo '发布包包含不允许发布的文件'; exit 1; fi
out="${COFOUNDER_RELEASE_OUTPUT:-$root/temp/releases}"
mkdir -p "$out"
archive="$out/cofounder-$(date -u +%Y%m%dT%H%M%SZ)-$(openssl rand -hex 3).tar.gz"
COPYFILE_DISABLE=1 tar -czf "$archive" -C "$stage_root" release
(cd "$out" && shasum -a 256 "$(basename "$archive")" > "$archive.sha256")
printf '%s\n' "$archive" > "$out/latest-release.txt"
echo "发布包：$archive"
