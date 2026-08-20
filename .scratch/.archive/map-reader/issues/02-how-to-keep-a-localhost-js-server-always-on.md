# How to keep a localhost JS server always on

Type: research
Status: resolved
Blocked by:

## Question

On this Mac, what are the practical ways to keep a JavaScript process listening on `127.0.0.1:5420` **Always-on** (survives terminal close, optional start at login, restart on crash)? Compare a manual `node`/`npm start` left running, `launchd` user agents, Login Items, `pm2`, and an Electron/tray shell. Facts only: setup cost, reliability, port binding, how the user opens the UI. Do not pick the product shape — that is [Always-on process model for the Reader](04-always-on-process-model-for-the-reader.md).

## Answer

On this Mac, a foreground `node`/`npm start` dies when Terminal closes (nohup/tmux survive that, not reboot or crash). A `launchd` user agent in `~/Library/LaunchAgents` is the native supervisor: lives past Terminal, starts at GUI login, `KeepAlive` restarts crashes; `launchctl` is already here. Login Items start an app once at login and do not restart crashes. `pm2` is not installed; crash restart works after `pm2 start`, reboot survival is a Darwin launchd hook plus `pm2 save`, and nvm makes that path fragile. An Electron/tray shell can hide instead of quit and open a window, but login and crash survival still come from Login Items and/or launchd. None of these bind 5420 themselves — if the port is busy the process fails (or restart-loops); the human opens a browser bookmark unless there is an app window. Full comparison: [research/02-how-to-keep-a-localhost-js-server-always-on.md](../research/02-how-to-keep-a-localhost-js-server-always-on.md).
