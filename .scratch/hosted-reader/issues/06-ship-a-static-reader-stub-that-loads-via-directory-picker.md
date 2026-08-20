# Ship a static Reader stub that Loads via directory picker

Type: task
Status: resolved
Blocked by: 04

## Question

Nothing to decide once [Pick a folder and show a Map list from handles](04-pick-a-folder-and-show-a-map-list-from-handles.md) has a shape Khaled signed. Make that the shipped **Reader** path: static HTML/JS, Load via `showDirectoryPicker`, marker walk + **Map list** + GFM preview + **Term hints** + take/skip + unresolved filter in the page.

Read on Load. Recents are persisted directory handles, not a **Project path** string; after reload, `requestPermission` on a gesture (Chrome 122+ “Allow on every visit” is how a tab persists). Skip `node_modules`, `.git`, and other hidden dirs except `.scratch` **by name** before recurse ([How File System Access behaves for a Wayfinder Project](01-how-file-system-access-behaves-for-a-wayfinder-project.md)). `.out-of-scope` is a named hole, not a skip-walk child. Do not public-bind Hono. **Always-on** (launchd at 5420) stays a version of the app ([Retire launchd Always-on](09-retire-launchd-always-on.md) is out of scope); this ticket ships the hosted static path.

Assets must be path-relative (`styles.css`, not `/styles.css`) so a later project-site origin at `/wayfinder-reader/` still loads them ([How to publish this static Reader on GitHub Pages](02-how-to-publish-this-static-reader-on-github-pages.md)). Vendor lodash-es and marked must live in the static tree; Hono’s `/vendor` remap will not exist on Pages.

**Archive** is out of this destination ([How to Archive when Chromium cannot rename directories](10-how-to-archive-when-chromium-cannot-rename-directories.md)); do not ship an Archive control. Pages go-live is [Put the Reader on GitHub Pages](08-put-the-reader-on-github-pages.md).

Done when Khaled can open the static app (local file or a local static server is fine before Pages) and Load this repo as a **Project**.

## Answer

`public/` is the shipped **Reader**: static HTML/JS, Load via `showDirectoryPicker({ mode: "read" })`, walk in the page, **Map list** + GFM preview + **Term hints** + take/skip + unresolved filter. No **Project path**. No **Archive**.

Recents are **Directory handles** in IndexedDB (`wayfinder-reader`). Restore is a Recents gesture (`requestPermission`); if Chrome already granted “Allow on every visit”, the last handle walks on reload. Cancel is `AbortError` and is ignored.

The walk is [public/walk.js](../../../public/walk.js) (the signed shape from [Pick a folder and show a Map list from handles](04-pick-a-folder-and-show-a-map-list-from-handles.md), not the prototype page): **Site** markers, skip `node_modules` / `.git` / other hidden dirs except `.scratch` **by name** before recurse, `.out-of-scope` and `docs/adr` as named holes. Assets are path-relative (`./styles.css`, `./vendor/…`). lodash-es and marked live under `public/vendor/`.

Open in Chrome or Edge at a localhost static origin (Hono on 5420 still serves `public/` for Khaled; any static server of `public/` also works). Pick this repo’s root, not `.scratch`. Pages go-live stays [Put the Reader on GitHub Pages](08-put-the-reader-on-github-pages.md).
