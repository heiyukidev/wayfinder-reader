# Ship the launchd user agent that keeps the Reader Always-on

Type: task
Status: resolved
Blocked by: 07

## Question

Nothing to decide — install Always-on now that the shape is locked in [Always-on process model for the Reader](04-always-on-process-model-for-the-reader.md).

Put a canonical plist in this repo and load it into `~/Library/LaunchAgents` so the **Reader** listens on `127.0.0.1:5420` at GUI login, survives Terminal close, and `KeepAlive`-restarts on crash. `ProgramArguments` are absolute Homebrew Node (`/opt/homebrew/bin/node`) plus the app entry from [Tree plus markdown preview stub](07-tree-plus-markdown-preview-stub.md) / [UI stack and shell](06-ui-stack-and-shell.md). WorkingDirectory is this repo. Logs go somewhere inspectable. If 5420 is busy, fail clearly without a restart loop. Document `bootout` / how to stop it. `npm start` stays a **dev** path only.

Done when Khaled can reboot (or log out and in), open the bookmark, and the Reader is there — or when a precise HITL leftover is recorded (e.g. “Allow in the Background”).

## Assets

- Canonical plist: [`launchd/so.karine.wayfinder-reader.plist`](../../../launchd/so.karine.wayfinder-reader.plist)
- Install: [`scripts/install-launch-agent.sh`](../../../scripts/install-launch-agent.sh)
- Uninstall: [`scripts/uninstall-launch-agent.sh`](../../../scripts/uninstall-launch-agent.sh)
- Ops: [`docs/always-on.md`](../../../docs/always-on.md)

## Answer

Always-on is installed as user agent `so.karine.wayfinder-reader`. Canonical plist lives in the repo; install substitutes `__REPO_ROOT__` and copies it to `~/Library/LaunchAgents`. `ProgramArguments` are `/opt/homebrew/bin/node` plus this clone’s `src/server.js`. `KeepAlive` is crash-only (`Crashed` true, `SuccessfulExit` false) so `EADDRINUSE` exit 0 does not restart-loop. Logs: `~/Library/Logs/wayfinder-reader/`. Stop with `launchctl bootout` or `./scripts/uninstall-launch-agent.sh`. `npm start` stays **dev** only.

Verified loaded: `gui/501/so.karine.wayfinder-reader` running, `http://127.0.0.1:5420/` returns 200, process is Homebrew Node. Reboot/login survival was not exercised this session. If it is missing after a reboot, enable **so.karine.wayfinder-reader** under System Settings → General → Login Items & Extensions → Allow in the Background.
