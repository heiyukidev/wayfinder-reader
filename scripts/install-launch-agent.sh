#!/usr/bin/env bash
set -euo pipefail

NODE="/opt/homebrew/bin/node"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLIST_LABEL="so.karine.wayfinder-reader"
PLIST_SRC="${REPO_ROOT}/launchd/${PLIST_LABEL}.plist"
PLIST_DEST="${HOME}/Library/LaunchAgents/${PLIST_LABEL}.plist"
LOG_DIR="${HOME}/Library/Logs/wayfinder-reader"
DOMAIN="gui/$(id -u)"

if [[ ! -x "$NODE" ]]; then
  echo "error: Homebrew Node not found at $NODE" >&2
  exit 1
fi

mkdir -p "$LOG_DIR"
sed "s|__REPO_ROOT__|${REPO_ROOT}|g" "$PLIST_SRC" > "$PLIST_DEST"

if launchctl print "${DOMAIN}/${PLIST_LABEL}" >/dev/null 2>&1; then
  launchctl bootout "$DOMAIN" "$PLIST_DEST" 2>/dev/null || true
fi

launchctl bootstrap "$DOMAIN" "$PLIST_DEST"
echo "Installed and loaded ${PLIST_LABEL}"
