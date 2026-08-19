# ADR 0001 — launchd user agent for Always-on

Status: accepted

## Context

The **Reader** must stay reachable at `http://127.0.0.1:5420` without a manual start each time Khaled wants to read a map. [How to keep a localhost JS server always on](../../.scratch/map-reader/issues/02-how-to-keep-a-localhost-js-server-always-on.md) compared Terminal `node`, launchd user agents, Login Items, pm2, and an Electron/tray shell on this Mac.

## Decision

Always-on is a **`launchd` user agent** plus a **browser bookmark**. There is no Dock/tray app in v1.

- Absolute Homebrew Node (`/opt/homebrew/bin/node`); nvm is not on launchd’s PATH.
- `KeepAlive` for crashes; start at GUI login.
- Bind `127.0.0.1:5420`. If the port is busy, fail clearly — do not hop, do not `KeepAlive`-loop on `EADDRINUSE`.
- `npm start` is a **dev** convenience, not the Always-on path.

Rejected for this role: Terminal `npm start` (dies with the window), Login Items (no crash restart), pm2 (not installed; reboot hook is still launchd), Electron/tray (does not buy Always-on; folder picking does not need it).

## Consequences

[UI stack and shell](../../.scratch/map-reader/issues/06-ui-stack-and-shell.md) assumes a headless Node HTTP process. Install work is [Ship the launchd user agent that keeps the Reader Always-on](../../.scratch/map-reader/issues/08-ship-the-launchd-user-agent.md).
