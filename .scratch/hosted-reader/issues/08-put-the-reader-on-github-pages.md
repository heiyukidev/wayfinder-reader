# Put the Reader on GitHub Pages

Type: task
Status: resolved
Blocked by: 02, 05, 06

## Question

Nothing to decide — the destination origin is GitHub Pages on `heiyukidev/wayfinder-reader`. Enable Pages using the facts in [How to publish this static Reader on GitHub Pages](02-how-to-publish-this-static-reader-on-github-pages.md), publish the static stub from [Ship a static Reader stub that Loads via directory picker](06-ship-a-static-reader-stub-that-loads-via-directory-picker.md), and leave a public HTTPS URL that is a secure context for File System Access.

From that research: project site URL is `https://heiyukidev.github.io/wayfinder-reader/`. Do not point branch publish at `public/` (only `/` or `/docs` are valid); upload `public` as the site root (Actions). Assets must be path-relative (`styles.css`, not `/styles.css`). Copy lodash-es and marked into the published tree — Hono’s `/vendor` remap will not exist. No SPA `404.html` rewrite.

Push only what that stub needs. Still do not dump an unrelated dirty tree. Custom domain is fog.

Done when Khaled can open the Pages URL in Chrome or Edge, pick a **Project** folder, and read maps.

## Answer

Live at [https://heiyukidev.github.io/wayfinder-reader/](https://heiyukidev.github.io/wayfinder-reader/) (HTTPS, HSTS, `showDirectoryPicker` secure context). Open in Chrome or Edge, click Load, pick a **Project** folder.

Pushed only the stub onto [github.com/heiyukidev/wayfinder-reader](https://github.com/heiyukidev/wayfinder-reader) (`main`): `index.html` / `app.js` / walk / recents / term-hints / styles / fonts, plus vendored lodash-es and marked. Not this dirty tree (no Hono, no `.scratch`, no tests). Path-relative assets. No SPA `404.html`.

Actions was the research path (`upload-pages-artifact` `path: public`), but the `heiyukidev` `gh` token has no `workflow` scope, so GitHub rejected a workflow file. Branch publish from `main` `/` instead: contents of `public/` at the repo root (not a `public/` folder — that is not a valid Pages source) plus `.nojekyll` so Jekyll does not strip `vendor/` or lodash `_*.js`. Custom domain stays fog.
