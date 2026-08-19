# Read Wayfinder maps locally

## Destination

A running local JavaScript **Reader** on port **5420**, always reachable in the background, that lets Khaled pick a **Project** folder on disk and browse its Wayfinder **Maps**: a tree of the map files, and a markdown preview of the selected file.

## Notes

- Domain: local read-only map viewer. Glossary: `CONTEXT.md`.
- Skills: `/wayfinder` for this map; `/grill-with-docs` (grilling + domain-modeling) on HITL tickets; `/impeccable` when shaping UI; Phillip implements when a ticket is a build (user rule: do not write app code in the wayfinding agent).
- Tracker: local markdown under `.scratch/map-reader/` (see Wayfinding operations in `docs/agents/issue-tracker.md`).
- Standing: **carry execution into the map.** The destination is running software on 5420, not a spec-only handoff.
- Autopilot locks (object with a named failure mode):
  - Port **5420** (if taken, fail clearly — do not silently hop).
  - **Read-only.** The Reader does not edit, claim, or resolve tickets.
  - **JavaScript** (this repo).
  - Sidebar is a **filesystem tree** of discovered map files, not a blocking graph. Discover **Maps** by globbing `.scratch/*/map.md`.
  - Remember the last **Project** path across restarts.
  - Never serve a path outside the chosen **Project**.
  - **Project** selection is an absolute path **string** the server stores (type/paste + recents). Do not use browser folder pickers (`showDirectoryPicker`, `webkitdirectory`) — they never give Node a POSIX path, and Safari may omit hidden `.scratch`. A native `osascript` “choose folder” button is optional UX, not v1.
  - **Always-on** supervisor is a **`launchd` user agent**; the UI is a **browser bookmark**. Not Electron, not Terminal `npm start`.
  - Expose **`.scratch/` only** (Maps plus spec-only and `/to-tickets` siblings). Never the rest of the **Project**.
  - **Stack:** one Node process, **Hono**, static HTML/JS, GFM preview. No Vite/Next at runtime.
  - **Look:** reading desk — paper GFM (Source Serif 4), stone tree, navy Load; Source Sans 3 in chrome; fonts self-hosted. Locked in [Visual polish of the Reader](issues/09-visual-polish-of-the-reader.md).
- Example Efforts to read against while building: `Desktop/js/sealbox/.scratch/go-nogo/`, `Desktop/js/april/.scratch/local-teammate/`, `Desktop/js/dnd-heiyuki/.scratch/`.

## Decisions so far

- [What on-disk shapes count as a Wayfinder map](issues/01-what-on-disk-shapes-count-as-a-wayfinder-map.md) — A Map is `.scratch/<effort>/map.md` plus that Effort’s files. Khaled’s maps are local-markdown-only; v1 does not talk to `gh`/`glab`.
- [How a local web app selects a folder on disk](issues/03-how-a-local-web-app-selects-a-folder-on-disk.md) — Browser pickers cannot give Node a POSIX path. Store a typed/pasted absolute **Project path** and list from the server; Electron dialog or `osascript` choose-folder are optional native UX.
- [How to keep a localhost JS server always on](issues/02-how-to-keep-a-localhost-js-server-always-on.md) — Foreground Node dies with Terminal. A `launchd` user agent is the native supervisor (login start, `KeepAlive` crash restart). Login Items do not restart crashes; pm2 is not installed and still needs launchd for reboot; Electron tray still needs Login Items/`launchd` for Always-on. UI is a browser bookmark unless there is an app window.
- [Always-on process model for the Reader](issues/04-always-on-process-model-for-the-reader.md) — Product shape is a `launchd` user agent + browser bookmark. Not Terminal `npm start`, not pm2, not Electron/tray. Absolute Homebrew Node; fail clearly on a busy 5420.
- [What the server may read in a chosen Project](issues/05-what-the-server-may-read-in-a-chosen-project.md) — Localhost may expose only `.scratch/`: Maps plus spec-only and `/to-tickets` siblings (not Maps). Never the rest of the Project; never `..` out.
- [UI stack and shell](issues/06-ui-stack-and-shell.md) — One Node process: Hono + static HTML/JS page + GFM preview. No Electron, no Vite/Next at runtime.
- [Tree plus markdown preview stub](issues/07-tree-plus-markdown-preview-stub.md) — Runnable Hono stub: path field + recents, `.scratch/` tree, GFM preview, relative links. Shape locked good enough; polish later. Entry is `src/server.js`.
- [Ship the launchd user agent that keeps the Reader Always-on](issues/08-ship-the-launchd-user-agent.md) — User agent `so.karine.wayfinder-reader` loaded: Homebrew Node + `src/server.js`, crash-only KeepAlive, bootout documented. Bookmark `http://127.0.0.1:5420`. `npm start` is dev only.
- [Visual polish of the Reader](issues/09-visual-polish-of-the-reader.md) — Signed-off reading-desk look: paper GFM (Source Serif 4), stone tree, navy Load; fonts self-hosted. Shape unchanged.

## Not yet specified

## Out of scope

- Hosting the Reader on the public internet.
- Multi-user auth.
- Writing, claiming, or resolving tickets from the Reader (destination is read-only).
- Replacing GitHub / Linear as a general issue UI.
- GitHub / GitLab hosted maps — issues labelled `wayfinder:map` live in the tracker, not on disk; this destination is a filesystem Reader ([What on-disk shapes count as a Wayfinder map](issues/01-what-on-disk-shapes-count-as-a-wayfinder-map.md)).
- Live-reload of the preview when files change on disk — destination is click-to-preview.
- Ticket-aware chrome in **Files view** — Files stays filenames. Decisions view is a later Effort: [See which Ticket blocks which, and skip-grill from the Reader](../decisions-view/map.md).
- A blocking-edge **graph canvas** — still out of this destination. The blocking **outline** is [See which Ticket blocks which, and skip-grill from the Reader](../decisions-view/map.md).
- Search across Efforts, and more than one Project open at once — destination is one Project path and a tree.
