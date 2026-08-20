# How to publish this static Reader on GitHub Pages

Type: research
Status: resolved
Blocked by:

## Question

How do we publish a **static** HTML/JS **Reader** (no Node process) on GitHub Pages from a repo `heiyukidev/wayfinder-reader`, so the destination origin is a public HTTPS URL?

Facts only. Do not pick the product shape or create the repo — that is [Create the public heiyukidev/wayfinder-reader repo](05-create-the-public-heiyukidev-wayfinder-reader-repo.md) and [Put the Reader on GitHub Pages](08-put-the-reader-on-github-pages.md).

Cover:

- Project site (`heiyukidev.github.io/wayfinder-reader/`) vs user/org site (`heiyukidev.github.io/`). Base URL / `<base href>` / relative asset paths if the app is not at `/`.
- What GitHub Pages will serve: repo root, `/docs`, `gh-pages` branch, GitHub Actions. How that maps to this repo’s current `public/` (Hono serves those files today from `src/server.js`).
- HTTPS and secure context for File System Access. Custom domain (facts only; custom domain is fog, not this destination).
- Whether a single `index.html` + JS/CSS needs a 404 fallback (it should not, unless we add client routes).
- MIT LICENSE and a public repo: Pages visibility, what “private repo Pages” would require (we are going public).
- `gh` account: the intended owner is `heiyukidev` (do not create the repo in this ticket).

Write the note at `.scratch/hosted-reader/research/02-how-to-publish-this-static-reader-on-github-pages.md`.

## Answer

GitHub Pages is static hosting. It will not run this repo’s Hono process. A public `heiyukidev/wayfinder-reader` is a **project site** at `https://heiyukidev.github.io/wayfinder-reader/` (HTTPS; secure context for `showDirectoryPicker`). A user site at `/` would be a different repo named `heiyukidev.github.io`. Neither repo existed at capture.

Two traps: branch publish only serves `/` or `/docs`, not `public/` (Actions can upload `public` as the site root); today’s path-absolute `/styles.css` (and `/vendor/…` Hono remaps from `node_modules`) miss a project-site subpath — use path-relative URLs and put vendor files in the published tree. No SPA 404 fallback. GitHub Free Pages needs a public repo; private Pages still publishes a public site for a User account.

Full note: [research/02-how-to-publish-this-static-reader-on-github-pages.md](../research/02-how-to-publish-this-static-reader-on-github-pages.md).
