# How to keep a localhost JS server Always-on (this Mac)

Facts for [How to keep a localhost JS server always on](../issues/02-how-to-keep-a-localhost-js-server-always-on.md). Does not pick a product shape — that is [Always-on process model for the Reader](../issues/04-always-on-process-model-for-the-reader.md).

**Always-on** here means the process stays reachable at `http://127.0.0.1:5420` without a manual start each time someone wants to read a map. The destination binds **5420** and, if the port is taken, fails clearly (does not hop).

Checked on this machine, 2026-08-18. Nothing was installed, started, or written under `~/Library/LaunchAgents`.

## This machine

| Fact | Observed |
| --- | --- |
| OS | macOS 26.5.2 (Tahoe), Darwin 25.5.0, arm64 |
| UID / GUI domain | `501` / `gui/501` (type `login`, Aqua session, active) |
| `launchctl` | `/bin/launchctl` present. Modern verbs: `bootstrap` / `bootout` / `kickstart`. `load` / `unload` still exist; help marks them as legacy. |
| `pm2` | not on `PATH` |
| Homebrew | 6.0.15 at `/opt/homebrew/bin/brew`. `brew services` works. |
| `brew services list` | only formula `black`, status `none` (plist exists, not registered) |
| Node (interactive shell) | nvm `v22.22.3` at `/Users/khaledromdhane/.nvm/versions/node/v22.22.3/bin/node` (first on `PATH`) |
| Node (Homebrew) | `/opt/homebrew/bin/node` → Cellar `node/26.0.0` (`v26.0.0`) |
| nvm | many installed versions (`v14`–`v24`); nvm is a zsh function, not available to launchd |
| Port 5420 | nothing listening |
| Existing user agents | `~/Library/LaunchAgents` already has Dropbox, Google, watchman, Steam, Valve, brew `borders`, git timers, etc. |
| Open at Login (System Events) | Wispr Flow, Raycast, Dropbox, DisplayLink Manager, Amethyst |
| Background allow-list (sample) | `homebrew.mxcl.borders` enabled, `homebrew.mxcl.sketchybar` enabled, several Login Helper labels enabled/disabled |
| Also present | `tmux` 3.6b, `/usr/bin/nohup`, `disown` (zsh), `sfltool`, `osascript` |

`launchctl print gui/501` showed an Aqua login domain with ~448 services. The domain `environment` only had `SSH_AUTH_SOCK`. There is no inherited nvm `PATH`.

## Shared facts (all options)

### Login vs reboot

User-session jobs start **after this user logs in to the GUI**, not at EFI/boot. FileVault unlock happens first; then `loginwindow` creates `gui/501`. A localhost Reader is not usable before login anyway.

- **Screen lock** keeps the Aqua session: a running listener on 5420 stays up.
- **Log out** tears down the GUI domain: user agents and Login Items stop.
- **Reboot** kills everything; only a registered Login Item, user agent, brew service, pm2 startup hook, or packaged app’s `SMAppService` brings a process back.

A **LaunchDaemon** under `/Library/LaunchDaemons` (needs root to install) can start at boot, before login, in the system domain. That is a different security context than a personal `127.0.0.1` tool. `UserName` in a plist is only honored in the privileged system domain; agents ignore it (`man launchd.plist`).

### Binding 5420 if busy

None of these managers bind `127.0.0.1:5420` for a typical Node HTTP server. The JS process calls `listen`. If another process already holds the TCP port, Node gets `EADDRINUSE` and (if the app exits on listen failure) the process dies.

- **Do not hop ports.** The map already locks 5420 to fail clearly.
- `launchd` `Sockets` can have launchd bind first and pass the fd via `launch_activate_socket(3)`. Ordinary Express/`http.createServer().listen(5420)` does not consume that. Using `Sockets` here would be extra protocol, not a free win.
- `KeepAlive` / pm2 autorestart on a process that **exits** because 5420 is busy produces a **restart loop**, throttled (launchd default: at most once per 10 seconds, overridable with `ThrottleInterval`). The occupant is still there until something frees the port (`lsof -nP -iTCP:5420 -sTCP:LISTEN`).
- Binding **`127.0.0.1`** (loopback only) is an app listen option, not a process-manager feature. Same for all five options.

### How the human opens the UI

Two distinct surfaces:

1. **Browser tab** at `http://127.0.0.1:5420` — bookmark, typed URL, or `open http://127.0.0.1:5420`. Works for any option that actually has an HTTP listener.
2. **App window** — only Login Items of a GUI `.app`, or an Electron/tray shell. Closing the window is not the same as stopping the listener unless the app quits.

Headless Node (manual, launchd, pm2, brew services, a Login Item that is a unix executable) has **no window**. The person opens a browser.

### Node path on this Mac

Interactive `node` is nvm’s 22.22.3. Homebrew’s 26.0.0 is also installed. launchd, Login Items, and pm2 startup **do not run zsh**, so they do not get nvm. Any Always-on job must use an **absolute** `node` path (or a PATH you set in the plist / pm2 env). That path will rot when nvm switches defaults or Homebrew upgrades Node.

`npm start` is a further PATH dependency (npm shim). A launchd/pm2 job is more reliable as `absolute-node` + `absolute-entry.js`.

launchd jobs **must not** `fork` and have the parent exit (`man launchd.plist`). A normal Node HTTP server that stays in the foreground is compatible. A wrapper that daemonizes is not.

---

## 1. Manual `node` / `npm start` left running

**What it is.** Start the server in Terminal (or iTerm) and leave the session open.

**Setup cost.** None beyond having Node (already true). Optional: a bookmark to `http://127.0.0.1:5420`.

**Survives closing Terminal?** No, if the process is a child of that shell. Closing the window / quitting Terminal closes the pty; the shell gets SIGHUP and forwards it; Terminal then SIGKILLs stragglers after a few seconds.

Practical detach tricks (still not reboot-proof, still no crash restart):

| Trick | On this Mac | Survives Terminal close | Survives reboot | Crash restart |
| --- | --- | --- | --- | --- |
| Foreground `npm start` | already possible | no | no | no |
| `nohup node … &` | `/usr/bin/nohup` | yes (ignores SIGHUP) | no | no |
| `… &` then `disown` | zsh builtin | yes (removed from job table) | no | no |
| `tmux` session | tmux 3.6b installed | yes (tmux server is independent) | no | no (unless you add respawn hooks) |

**Survives reboot?** No.

**Crash restart?** No. Uncaught exception or `EADDRINUSE` exit leaves 5420 dead until a person starts it again.

**Port 5420 busy.** Listen fails once. The terminal shows the error. Nothing retries.

**How the user opens the UI.** Browser to `http://127.0.0.1:5420`. The Terminal window is a log, not the product UI.

**Reliability.** High while the session exists and the process does not crash. Zero after logout, reboot, or a crash. Relies on a human noticing it is down.

---

## 2. `launchd` user agent

**What it is.** A property list named `<Label>.plist` in `~/Library/LaunchAgents`, loaded into `gui/501` (or the user domain). launchd is the OS supervisor; every GUI login already has hundreds of these. This Mac already uses the pattern (brew `borders`, watchman, Dropbox, …).

**Setup cost.** Medium, one-time, no extra runtime:

1. Write a plist: `Label`, `ProgramArguments` (absolute node + script), `WorkingDirectory`, `EnvironmentVariables` `PATH`, `KeepAlive` and/or `RunAtLoad`, `StandardOutPath` / `StandardErrorPath`.
2. Load it: `launchctl bootstrap gui/$UID ~/Library/LaunchAgents/<Label>.plist` (legacy: `launchctl load`).
3. On macOS 13+ the job can appear under **System Settings → General → Login Items & Extensions → App Background Activity** (“Allow in the Background”). The user may get a notification the first time. On **macOS 26**, Apple also prompts if background tasks started by an app **remain active after the app is quit** (deployment guide). A raw plist in `~/Library/LaunchAgents` is the older layout; bundled `SMAppService` agents live inside an `.app`.

`KeepAlive` = true keeps the job running and **implies `RunAtLoad`**. Dictionary form can restart only on `Crashed` (watchman’s plist on this Mac does that). Jobs that exit quickly in a loop are throttled (default 10s).

Unload: `launchctl bootout gui/$UID ~/Library/LaunchAgents/<Label>.plist`. Disable without deleting: `launchctl disable gui/$UID/<Label>`. Force restart: `launchctl kickstart -k gui/$UID/<Label>`.

**Survives closing Terminal?** Yes. The process is not a Terminal child.

**Survives reboot?** Yes, **at next GUI login**, if the plist is still in `~/Library/LaunchAgents` and not disabled. Not before login.

**Crash restart?** Yes, with `KeepAlive` true (any exit) or `KeepAlive.Crashed` true (fatal signals). No extra package.

**Port 5420 busy.** If the process exits on `EADDRINUSE`, launchd restarts it on the throttle interval until bind succeeds or someone boots the job out. Logs go to `StandardErrorPath` if set; otherwise they are easy to miss. The plist itself does not print a user-facing “port taken” dialog.

**How the user opens the UI.** Browser / bookmark. No window, no Dock icon.

**Reliability.** Highest OS-native option for a headless listener. Failure modes are configuration, not the supervisor: wrong/absolute-stale node path (nvm), `npm` not on PATH, a wrapper that daemonizes, Background Activity toggled off, job disabled in `launchctl print-disabled`.

**vs LaunchDaemon.** A system daemon would start at boot as root (or `UserName` in the system domain). Unnecessary for loopback HTTP, and a different trust boundary.

---

## 3. Login Items (“Open at Login”)

**What it is.** Launch Services launches a list of apps/documents/folders once when this user logs in. UI: **System Settings → General → Login Items & Extensions → Open at Login**. This Mac already has five. API for apps (macOS 13+): `SMAppService.mainApp.register()` / Electron `app.setLoginItemSettings({ openAtLogin })`. Older: shared-file-list / `SMLoginItemSetEnabled`.

**Not the same as “Allow in the Background”.** Open at Login = launched at login. Allow in the Background = allowlist for launch agents/helpers that may run when the app is not in the foreground. An app can appear in one, the other, or both.

**Setup cost.**

- **GUI `.app`:** low — plus button in System Settings, or the app offers “Open at Login”.
- **Raw `node` / a `.js` file / a shell script:** poor fit. Login Items are meant to `open` an item. A unix executable may spawn a Terminal window; there is no `KeepAlive`, no stdout log path, no working-directory key.
- **Helper inside an app bundle** (`Contents/Library/LoginItems`): app-developer work (`SMAppService.loginItem`).

**Survives closing Terminal?** Yes, if the Login Item is not Terminal. If you “Open at Login” Terminal itself with a startup command, you are back in option 1.

**Survives reboot?** Yes, at next GUI login, until the user removes it or the item path breaks (Settings shows a missing-item warning).

**Crash restart?** **No.** Launch Services starts it once. If Node or the `.app` exits, it stays down until the next login or a manual open.

**Port 5420 busy.** One failed launch. No retry loop unless the item is *also* a launch agent.

**How the user opens the UI.** If the item is a GUI app: that app’s window (or hidden launch via `openAsHidden` / Electron `wasOpenedAsHidden`). If the item is headless: still a browser. Adding a browser bookmark as a Login Item would open the **browser** at login, not start the server.

**Reliability.** Fine for “start my app when I log in.” Not a process supervisor. Apple’s own docs treat Login Items as user-facing apps and launch agents as the thing with run-on-demand / relaunch / XPC.

---

## 4. `pm2`

**What it is.** A Node process manager (global npm CLI). It forks your app, restarts it on exit, keeps a process list, and optional logs/monitoring. **Not installed here.**

**Setup cost.** Medium–high relative to a single plist:

1. `npm i -g pm2` (lands in the *current* nvm prefix).
2. `pm2 start` the Reader; `pm2 save` writes `~/.pm2/dump.pm2`.
3. Reboot survival: `pm2 startup` / `pm2 startup darwin` prints a **sudo** command that installs a **launchd** unit whose job is `pm2 resurrect`. Official docs: on Darwin, startup is a launchd plist. Official NVM warning: **the pm2 path changes when you update Node; re-run `startup` after every nvm upgrade.**
4. Historical Darwin bugs: generated plists with `UserName` fail to load in non-system domains (`UserName is not supported for non-System services`); people had to edit the plist. PATH values with spaces also broke the generated sudo command.

You then have **two** layers: launchd keeps pm2’s resurrect hook, pm2 keeps the Node app. Crash restart of the app does **not** require the startup hook; the startup hook is only for reboot.

**Survives closing Terminal?** Yes, after `pm2 start` (the app is not a Terminal child). Until `pm2 startup` + `pm2 save`, a reboot still loses it — same as a detached `node`.

**Survives reboot?** Only after the Darwin startup hook is installed and `pm2 save` has a dump. Without that, pm2 is “Always-on until reboot.”

**Crash restart?** Yes (default `autorestart`). Tunables: `min_uptime`, `max_restarts`, `restart_delay`. Same `EADDRINUSE` restart-loop caveat as launchd.

**Port 5420 busy.** pm2 restarts the dying process; it does not bind 5420 itself and does not hop.

**How the user opens the UI.** Browser / bookmark. `pm2 list` / `pm2 logs` are operator tools, not the Reader UI.

**Reliability.** Strong as a Node supervisor **while pm2 is running**. On this Mac the weak points are: not installed yet; nvm path churn (docs call this out); extra moving parts vs a direct user agent; sudo for the official startup path; known launchd-plist mismatches on Darwin. Functionally, reboot survival **is** launchd underneath.

---

## 5. Electron / tray shell

**What it is.** A packaged macOS `.app` whose main process can (a) host or spawn the HTTP server on 5420, (b) show a `BrowserWindow` instead of or in addition to Safari/Chrome, (c) keep a menu-bar `Tray`. Typical Mac agent flags: `LSUIElement` so there is no Dock icon; on close, `preventDefault` + `hide()` so the process does not quit; empty `window-all-closed` handler. Electron on Darwin already **does not quit** when the last window closes unless the app calls `app.quit()` — Cmd+Q still quits.

**Start at login.** `app.setLoginItemSettings({ openAtLogin: true, openAsHidden: true })` or `SMAppService`. That is Login Items (section 3), not KeepAlive.

**Crash restart of the main process.** **Not built in.** A crashed Electron main process is a dead app unless you **also** wrap it with a launchd agent (`KeepAlive`) or a helper. Renderer crashes can be recovered inside Electron; that is not the same as the HTTP listener dying with the main process.

**Setup cost.** Highest of the five: new app, packaging (`electron-builder` / similar), tray UX, hide-vs-quit, optional `LSUIElement`, signing/notarization if you distribute as a downloaded `.app` (personal unsigned `.app` still runs, with Gatekeeper friction). Hosting HTTP inside Electron means the listener lives only while the app process lives.

**Survives closing Terminal?** Yes (not started from Terminal, or detached).

**Survives reboot?** Only if registered as a Login Item / `SMAppService` / launchd agent. A Dock app the user launched by hand does not come back after reboot.

**Port 5420 busy.** Same `EADDRINUSE` in the main process. No automatic hop. A tray menu can surface “port in use” more visibly than a headless agent — that is UI, not a different bind model.

**How the user opens the UI.**

- Tray / Dock / Cmd-tab → app window (can load `http://127.0.0.1:5420` or a custom protocol).
- Browser bookmark still works **if** the HTTP server is listening on 5420.
- If Electron only uses `file://` / `loadFile` and never listens, it is **not** the destination “JavaScript Reader on port 5420.”

**Reliability.** Good UX for “is it running?” and hide-instead-of-quit. Heavier (Chromium + Node). Always-on across reboot/crash still depends on Login Items and/or launchd, not on Electron itself.

On macOS 26, if this app starts background work that **keeps running after quit**, the system may prompt to allow that (deployment guide). Hide-instead-of-quit avoids quit; Cmd+Q is quit.

---

## Adjacent (not in the ticket’s five, on this Mac)

**`brew services`.** Wrapper around launchd. User-level: copies/symlinks a formula plist into `~/Library/LaunchAgents` and `bootstrap`s it (login). `sudo brew services` uses `/Library/LaunchDaemons` (boot). `brew services start --file=` can register an arbitrary plist. Existing brew user agent on this Mac (`homebrew.mxcl.borders`): `KeepAlive` true, `RunAtLoad` true, absolute `ProgramArguments`, explicit `PATH` including `/opt/homebrew/bin`. There is **no** Homebrew formula for this Reader today, so brew services does not remove the need to write a plist; it only changes how you load one.

**tmux / nohup.** Covered under manual start. Useful for “leave it running this afternoon.” Not Always-on across reboot.

---

## Comparison

| | Terminal close | Reboot / next login | Crash restart | Setup cost | Port 5420 if busy | How the human opens the UI |
| --- | --- | --- | --- | --- | --- | --- |
| Manual `node`/`npm start` | Dies (unless nohup/disown/tmux) | Dead | No | None | Fail once, error in the terminal | Browser bookmark |
| launchd user agent | Lives | Lives at GUI login | Yes (`KeepAlive`) | Plist + `bootstrap`; nvm path | Restart loop until free (if the app exits) | Browser bookmark; no window |
| Login Items | Lives (if it’s an app, not Terminal) | Lives at GUI login | **No** | Low for a `.app`; awkward for raw Node | Fail once | App window and/or browser |
| pm2 | Lives after `pm2 start` | Only with `pm2 startup` (launchd) + `pm2 save` | Yes | Global CLI; nvm; often sudo startup | Restart loop until free | Browser bookmark |
| Electron / tray | Lives if hide≠quit | Only with Login Item / agent | Main process: no, unless also launchd | App packaging | Fail in-process; tray can show it | App window / tray; browser if 5420 is served |

All five can listen on `127.0.0.1:5420`. None hop the port unless **application code** does. User-session options start **at login**, not at boot. On this Mac, `launchctl` and `brew services` already exist; `pm2` does not; nvm vs Homebrew Node is the main Always-on PATH trap.

## Sources

- This machine: `sw_vers`, `which`, `launchctl print gui/501` (read-only), `brew services list`, `osascript` login items, `lsof` on 5420, existing `~/Library/LaunchAgents/*.plist`.
- `man launchd.plist` on this OS: `KeepAlive`, `RunAtLoad`, `ThrottleInterval` (default 10s), `UserName` system-domain-only, no-daemonize rule, `Sockets` / `launch_activate_socket`.
- `launchctl help`: domains `gui/<uid>` vs `user/<uid>` vs `system`; `bootstrap` / `bootout` preferred over `load` / `unload`.
- Apple TN2083 (daemons vs agents vs login items); `SMAppService` (macOS 13+).
- Apple Support: Login Items & Extensions (Tahoe 26); Apple Platform Deployment — background tasks, including the macOS 26 “still running after quit” prompt.
- PM2 startup-hook docs (Darwin = launchd; NVM re-run startup). GitHub pm2#4318 (`UserName` on Darwin user agents).
- Homebrew `brew services --help` (LaunchAgents at login vs LaunchDaemons at boot).
- Electron: Darwin `window-all-closed` convention, `LSUIElement`, `app.setLoginItemSettings`, tray hide-on-close (not a crash supervisor).
