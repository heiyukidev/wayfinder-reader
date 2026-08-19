# Always-on

**Always-on** means the **Reader** stays reachable at `http://127.0.0.1:5420` without a manual start each time you want to read a **Map**. Open that URL from a browser bookmark — there is no Dock or tray app.

Always-on is a `launchd` user agent (`so.karine.wayfinder-reader`) plus the bookmark.

## Install

From the repo root:

```bash
./scripts/install-launch-agent.sh
```

This substitutes the repo path into the canonical plist from `launchd/` and writes it to `~/Library/LaunchAgents/`, creates the log directory, and loads the job. After moving the repo, re-run install so `WorkingDirectory` and the script path update.

## Stop

Unload the agent without removing the plist:

```bash
launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/so.karine.wayfinder-reader.plist
```

Or remove it entirely:

```bash
./scripts/uninstall-launch-agent.sh
```

## Dev vs Always-on

`npm start` is **dev only**. It runs the same entry (`src/server.js`) but is not managed by `launchd`. Do not use it for Always-on — it dies when the Terminal session ends, and it will collide with the user agent on port 5420.

## Port 5420 busy

If something else already owns `127.0.0.1:5420`, the **Reader** logs a clear error and exits without hopping to another port. Because `KeepAlive` only restarts crashes (not successful exits), there is no restart loop.

Check:

```bash
tail ~/Library/Logs/wayfinder-reader/stderr.log
```

## Login Items (possible HITL)

macOS may prompt you to allow background activity. If the **Reader** does not come up after install or reboot, open **System Settings → General → Login Items & Extensions → Allow in the Background** and enable **so.karine.wayfinder-reader** (or the Wayfinder Reader label shown there).

## Logs

- `~/Library/Logs/wayfinder-reader/stdout.log`
- `~/Library/Logs/wayfinder-reader/stderr.log`
