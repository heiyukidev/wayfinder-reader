# Tree plus markdown preview stub

Type: prototype
Status: resolved
Blocked by: 03, 05, 06

## Question

What does a cheap, runnable stub of the **Reader** look like so we can react to layout before polishing? Stack is [UI stack and shell](06-ui-stack-and-shell.md): one Node process, Hono, static HTML/JS, GFM preview. **Project** picker is a path field (type/paste an absolute **Project path**, recents from the server) — not a browser directory picker ([How a local web app selects a folder on disk](03-how-a-local-web-app-selects-a-folder-on-disk.md)). Plus a tree of the **Readable tree** ([What the server may read in a chosen Project](05-what-the-server-may-read-in-a-chosen-project.md)): `.scratch/` only, Maps and non-map siblings. Plus a markdown preview of the selection, relative links that navigate the tree, empty state when the Project has no Maps. Link the stub as an asset. Done when Khaled can click through a real Effort (e.g. sealbox `go-nogo`) and say what is wrong with the shape.

## Assets

- App entry: [`src/server.js`](../../../src/server.js) (Hono on `127.0.0.1:5420`)
- UI: [`public/`](../../../public/)
- Dev: `npm start` → http://127.0.0.1:5420

## Answer

Cheap Hono stub: type/paste a **Project path**, recents + last path in `~/.wayfinder-reader/state.json`, filesystem tree of `.scratch/` only (Maps and non-map siblings), GFM preview, relative links stay in the tree. Khaled clicked through sealbox `go-nogo` and locked the **shape as good enough**; visual polish waits (`/impeccable` after Always-on). Clicking a Map folder shows “No preview” (expand with ▸) — accepted, not a lock to change. Always-on entry for [Ship the launchd user agent that keeps the Reader Always-on](08-ship-the-launchd-user-agent.md) is `src/server.js`.
