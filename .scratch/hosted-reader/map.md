# Host the Reader as static files that Load a local Project

## Destination

A running **Reader** at a public HTTPS origin: static HTML/JS, opened in Chrome or Edge, that Loads a **Project** via File System Access (a directory handle, not a **Project path**) and browses its Wayfinder maps with the current **Map list**, preview, **Term hints**, take/skip, and unresolved filter. Read-only: no **Archive**.

## Notes

- Domain: the **Reader**, now a static page that reads the visitor’s disk. Glossary: `CONTEXT.md`.
- Skills: `/wayfinder` for this map; grilling + domain-modeling on HITL tickets; `/research` on research tickets; `/impeccable` only if Load chrome needs shaping; Lodash for arrays/objects.
- Tracker: local markdown under `.scratch/hosted-reader/` (see Wayfinding operations in `docs/agents/issue-tracker.md`).
- Standing: **carry execution into the map.** The destination is a live public origin, not a spec-only handoff.
- License: **MIT**.
- Autopilot locks (object with a named failure mode):
  - One **Reader**, two versions (hosted origin and **Always-on**). Do not public-bind the current Hono process (it would read the host’s disk).
  - Public repo `github.com/heiyukidev/wayfinder-reader`. Origin is **GitHub Pages**. Custom domain later, not this destination.
  - Feature parity with the current **Reader** except **Archive**, new Load — not a thinner preview-only ship.
  - `showDirectoryPicker` only on the hosted origin. No typed **Project path**, no `webkitdirectory` there.
  - **Always-on** keeps Hono **Project path** Load and **Archive** on the same `public/`; feature-detect `/api/state`. Not a second tree ([ADR 0015](../../docs/adr/0015-always-on-hono-path-load-and-archive.md)).
  - Recents: persist directory handles (IndexedDB). Re-prompt is expected. Not a PWA unless a later ticket proves a tab cannot work.
  - Walk in the page with the same **Site** markers ([ADR 0010](../../docs/adr/0010-marker-walk-finds-sites.md)): `CONTEXT.md` and/or `.scratch/`. Skip `node_modules` and `.git`; skip other hidden dirs except `.scratch`.
  - Read on Load. Never `readwrite`. Hosted **Reader** does not **Archive** ([ADR 0013](../../docs/adr/0013-hosted-reader-does-not-archive.md)).
  - **Term hints** stay the client parse ([ADR 0006](../../docs/adr/0006-term-hints-from-language-files.md)). GFM in the page. No Vite/Next, no Electron. Hono is not the hosted process.
  - **Always-on** (launchd at 5420) stays a version of the app ([ADR 0014](../../docs/adr/0014-always-on-stays-a-version.md)). This Effort does not unload it. What it serves is [ADR 0015](../../docs/adr/0015-always-on-hono-path-load-and-archive.md).
  - Audience: Chromium desktop, anyone with a Wayfinder **Project** on disk (not Mac-only). Safari and Firefox are out.
  - Switch `gh` to `heiyukidev` before `gh repo create`. Do not push this dirty tree until a publish ticket.
  - GitHub-install / Homebrew is a postponed other Effort, not a ticket here.

## Decisions so far

- [How File System Access behaves for a Wayfinder Project](issues/01-how-file-system-access-behaves-for-a-wayfinder-project.md): pick the repo root, walk sees `.scratch`/`CONTEXT.md`, skip by name. Recents are IndexedDB handles + a gesture. Chromium cannot rename directories.
- [How to Archive when Chromium cannot rename directories](issues/10-how-to-archive-when-chromium-cannot-rename-directories.md): hosted **Reader** is read-only; no copy-then-delete. **Always-on** Hono may still Archive. [ADR 0013](../../docs/adr/0013-hosted-reader-does-not-archive.md).
- [How to publish this static Reader on GitHub Pages](issues/02-how-to-publish-this-static-reader-on-github-pages.md): project site `https://heiyukidev.github.io/wayfinder-reader/` (HTTPS). Pages cannot run Hono; do not publish `public/` as a branch folder — upload it as the site root. Path-absolute `/styles.css` and Hono `/vendor` remaps miss the subpath.
- [Create the public heiyukidev/wayfinder-reader repo](issues/05-create-the-public-heiyukidev-wayfinder-reader-repo.md): public empty origin at [github.com/heiyukidev/wayfinder-reader](https://github.com/heiyukidev/wayfinder-reader) (MIT + README; Pages off; this tree not pushed)
- [Record the hosted Reader in CONTEXT and supersede Always-on and Hono ADRs](issues/03-record-the-hosted-reader-in-context.md): glossary is the hosted static Reader (Directory handle Load); **Project path** retired as Load; [ADR 0011](../../docs/adr/0011-static-public-origin-for-the-reader.md) locks the public origin. **Always-on** stays a version ([ADR 0014](../../docs/adr/0014-always-on-stays-a-version.md)).
- [Pick a folder and show a Map list from handles](issues/04-pick-a-folder-and-show-a-map-list-from-handles.md): handle walk is Load. Site markers + skip-by-name + named-hole `.out-of-scope` produce a Map list by title. Chrome has no POSIX path; re-prompt and `AbortError` are expected. Prototype: [prototypes/map-list-from-handles.html](prototypes/map-list-from-handles.html).
- [Ship a static Reader stub that Loads via directory picker](issues/06-ship-a-static-reader-stub-that-loads-via-directory-picker.md): `public/` is the Reader — picker Load, handle recents, Map list + preview + Term hints + take/skip + remaining-work filter, no Archive, path-relative vendored assets.
- [Put the Reader on GitHub Pages](issues/08-put-the-reader-on-github-pages.md): live at [https://heiyukidev.github.io/wayfinder-reader/](https://heiyukidev.github.io/wayfinder-reader/) (HTTPS). Stub only on `heiyukidev/wayfinder-reader`; branch `/` + `.nojekyll` because the token cannot write Actions workflows.
- [What the Always-on version serves](issues/11-what-the-always-on-version-serves.md): Always-on is Hono **Project path** Load and **Archive**; hosted stays **Directory handle** Load and read-only. Same `public/`, feature-detect `/api/state`. [ADR 0015](../../docs/adr/0015-always-on-hono-path-load-and-archive.md).
- [Restore Always-on Project path Load and Archive](issues/12-restore-always-on-project-path-load-and-archive.md): `/api/state` turns the same `public/` into path Load + Archive; Pages stays picker and read-only.

## Not yet specified

- Whether a PWA is required for folder-permission persistence if a normal tab cannot keep recents usable.
- A custom domain in front of Pages.
- Offline use after the origin has been loaded once.
- Visual polish of Load-without-path (Load + Recents, folder name, no path field) — hosted header only; **Always-on** keeps the path field. The stub is in `public/`; shape only if the hosted header feels wrong.

## Out of scope

- Binding Hono (or any Node `fs` server) on a public interface.
- Safari and Firefox as supported browsers (`webkitdirectory` can omit `.scratch`).
- GitHub / GitLab hosted maps (Contents API or tracker issues). Maps stay on the visitor’s disk.
- Distributing a Mac install / Homebrew formula / launchd plist as the way to *get* the hosted Reader.
- [Retire launchd Always-on](issues/09-retire-launchd-always-on.md): unloading the user agent, stopping Always-on docs, or deleting Hono / the plist. This Effort keeps **Always-on** as a version of the app ([ADR 0014](../../docs/adr/0014-always-on-stays-a-version.md)).
- Electron; Vite/Next at runtime.
- Multi-user auth.
- The Reader claiming or resolving Tickets.
- [Archive a Finished Effort from a directory handle](issues/07-archive-a-finished-effort-from-a-directory-handle.md): Chromium cannot rename directories; copy-then-delete can half-archive. Hosted **Reader** stays read-only ([How to Archive when Chromium cannot rename directories](issues/10-how-to-archive-when-chromium-cannot-rename-directories.md)).
- iOS / Android Chromium directory pickers as a product promise.
