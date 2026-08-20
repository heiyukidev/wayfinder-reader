# Restore Always-on Project path Load and Archive

Type: task
Status: resolved
Blocked by: 11

## Question

Nothing to decide — [What the Always-on version serves](11-what-the-always-on-version-serves.md) locked **A**: Always-on is Hono **Project path** Load and **Archive**; the hosted origin stays **Directory handle** Load and read-only; one `public/`, feature-detect `/api/state`. [ADR 0015](../../../docs/adr/0015-always-on-hono-path-load-and-archive.md).

[Ship a static Reader stub that Loads via directory picker](06-ship-a-static-reader-stub-that-loads-via-directory-picker.md) replaced the path field. launchd still runs `src/server.js`, but the page never calls `/api/*`, so the bookmark at `127.0.0.1:5420` is the hosted Reader.

Put Always-on chrome back in that same `public/`:

- If `/api/state` succeeds: typed **Project path**, recents from the server, Map list and preview via `/api/project` `/api/tree` `/api/file`, **Archive** on Finished Efforts via `/api/archive`.
- If it fails (Pages, any static origin): picker Load, handle recents, in-page walk, no Archive.

Do not public-bind Hono. Do not restore a path field on the hosted origin. Do not add a second frontend tree. Do not unload launchd.

Done when Khaled can open `http://127.0.0.1:5420`, type this repo’s path, read maps, and Archive a Finished Effort; and the Pages origin still Loads only via the picker with no Archive.

## Answer

One `public/`. Always-on is a successful `/api/state` (JSON): typed **Project path** (hidden until then), server recents, last path restored via `/api/tree`, Load via `/api/project`, preview via `/api/file`, **Archive** on Finished groups via `/api/archive` after confirm. Hosted / Pages: `/api/state` fails, so picker Load, IndexedDB recents, in-page walk, no path field, no Archive.

Verified at `http://127.0.0.1:5420` against this repo (maps + Term hints). A throwaway Finished Effort **Archive probe** was Archived to `.scratch/.archive/archive-probe/`. [https://heiyukidev.github.io/wayfinder-reader/](https://heiyukidev.github.io/wayfinder-reader/) still Loads via the picker with no path field and no Archive.

`npm test`: 56 passed. Launchd still serves 5420. Hono is not public-bound.
