# Always-on process model for the Reader

Type: grilling
Status: resolved
Blocked by: 02

## Question

How does the **Reader** stay **Always-on** on port 5420? Pick the product shape, not a library list: a Node (or similar) HTTP server the user starts and leaves running, opened in a normal browser; a `launchd` user agent / Login Item that starts at login with no window; or a tray/menubar app (Electron or similar) that hides instead of quitting.

Recommendation to grill against: **`launchd` user agent + browser bookmark**. Destination is **Always-on**; [How to keep a localhost JS server always on](02-how-to-keep-a-localhost-js-server-always-on.md) shows a foreground `node` in Terminal is not that (dies on close). `launchd` is already on this Mac: user agent in `~/Library/LaunchAgents`, absolute `node` path (nvm is not on launchd’s PATH), `KeepAlive` for crashes, fail clearly if 5420 is busy (do not hop; `KeepAlive` on `EADDRINUSE` restart-loops). Login Items start once and do not restart crashes. Skip pm2 (not installed; reboot hook is still launchd; nvm-fragile). Skip Electron: it does not buy Always-on (still needs launchd/Login Items) and folder picking does not need it ([How a local web app selects a folder on disk](03-how-a-local-web-app-selects-a-folder-on-disk.md)). A documented `npm start` stays a **dev** convenience, not the Always-on path.

## Answer

**Always-on is a `launchd` user agent plus a browser bookmark** to `http://127.0.0.1:5420`. Khaled locked that shape. There is no Dock/tray app in v1.

A foreground Terminal `node` / `npm start` is not Always-on ([How to keep a localhost JS server always on](02-how-to-keep-a-localhost-js-server-always-on.md)). Login Items start once and do not restart crashes. pm2 is not installed; its reboot hook is still launchd and is nvm-fragile. Electron does not buy Always-on (still needs launchd or Login Items) and folder picking does not need it ([How a local web app selects a folder on disk](03-how-a-local-web-app-selects-a-folder-on-disk.md)).

The agent lives in `~/Library/LaunchAgents`, uses an **absolute** Homebrew Node (`/opt/homebrew/bin/node` — nvm is not on launchd’s PATH), `KeepAlive` for crashes, and binds `127.0.0.1:5420`. If the port is busy, fail clearly: do not hop, and do not exit in a way that `KeepAlive` restart-loops on `EADDRINUSE`. `npm start` remains a **dev** convenience, not the Always-on path.

Install work is [Ship the launchd user agent that keeps the Reader Always-on](08-ship-the-launchd-user-agent.md). Glossary: `CONTEXT.md`. ADR: [docs/adr/0001-launchd-user-agent-for-always-on.md](../../../docs/adr/0001-launchd-user-agent-for-always-on.md).
