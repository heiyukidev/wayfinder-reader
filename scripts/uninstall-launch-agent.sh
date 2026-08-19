#!/usr/bin/env bash
set -euo pipefail

PLIST_LABEL="so.karine.wayfinder-reader"
PLIST_DEST="${HOME}/Library/LaunchAgents/${PLIST_LABEL}.plist"
DOMAIN="gui/$(id -u)"

if launchctl print "${DOMAIN}/${PLIST_LABEL}" >/dev/null 2>&1; then
  launchctl bootout "$DOMAIN" "$PLIST_DEST" 2>/dev/null || true
fi

if [[ -f "$PLIST_DEST" ]]; then
  rm "$PLIST_DEST"
fi

echo "Uninstalled ${PLIST_LABEL}"
