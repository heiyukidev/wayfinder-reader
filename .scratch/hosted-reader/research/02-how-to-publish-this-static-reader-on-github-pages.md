# How to publish this static Reader on GitHub Pages

Facts for [How to publish this static Reader on GitHub Pages](../issues/02-how-to-publish-this-static-reader-on-github-pages.md). Does not pick a product shape — that is [Create the public heiyukidev/wayfinder-reader repo](../issues/05-create-the-public-heiyukidev-wayfinder-reader-repo.md) and [Put the Reader on GitHub Pages](../issues/08-put-the-reader-on-github-pages.md).

Captured: 2026-08-20. Nothing was created on GitHub (no repo, no Pages site, no `gh repo create`).

**GitHub Pages** is a **static** site hosting service: it takes HTML, CSS, and JavaScript from a GitHub repository, optionally runs them through a build, and publishes a website. It does **not** run a Node process. Official note: Pages does not support server-side languages such as PHP, Ruby, or Python.

## `heiyukidev` as of capture

| Fact | Observed |
| --- | --- |
| Account | [`heiyukidev`](https://github.com/heiyukidev) — GitHub REST `type: User` (personal account, not an organization). Login is already lowercase. |
| User/org site repo | `https://github.com/heiyukidev/heiyukidev.github.io` → **404** (does not exist) |
| Intended project repo | `https://github.com/heiyukidev/wayfinder-reader` → **404** (does not exist) |

## Two site types (and two default HTTPS URLs)

There are two kinds of Pages site. One user/organization site per **account**. One project site per **repository**.

| | User / organization site | Project site |
| --- | --- | --- |
| Source repo **must** be named | `<owner>.github.io` (lowercase the owner if it has uppercase letters) | Any other repo (here: `wayfinder-reader`) |
| Default URL | `https://<owner>.github.io` | `https://<owner>.github.io/<repositoryname>` |
| For this owner | `https://heiyukidev.github.io` from repo `heiyukidev/heiyukidev.github.io` | `https://heiyukidev.github.io/wayfinder-reader` from repo `heiyukidev/wayfinder-reader` |
| How many | One per account | One per repo |

A repo named `heiyukidev/wayfinder-reader` is a **project site**. Its Pages origin is **not** `/`. It is `/wayfinder-reader` on host `heiyukidev.github.io`.

A user site at `/` would require a **different** repository named `heiyukidev.github.io`. That is a separate Pages slot, not a rename of the project site.

You can also point Pages at a **custom domain** you own (`www.example.com`, `blog.example.com`, or apex `example.com`). Custom domain is fog for this destination; facts only, below.

---

## Trap 1 — project-site base path

Today the Reader’s HTML and JS use **path-absolute** URLs (a leading `/`, not `./`):

| File | What it requests |
| --- | --- |
| `public/index.html` | `/styles.css`, `/app.js` |
| `public/app.js` | `/vendor/lodash-es/…`, `/vendor/marked/…`, `/term-hints.js` |
| `public/term-hints.js` | `/vendor/lodash-es/…`, `/vendor/marked/…` |

Those strings are [path-absolute-URL strings](https://url.spec.whatwg.org/#path-absolute-url-string): U+002F (`/`) plus path segments. They are **not** [path-relative-URL strings](https://url.spec.whatwg.org/#path-relative-url-string) (those must not start with `/`).

The URL parser keeps the **origin** (scheme + host) of the document (or of `<base href>`) and **replaces the path from the root**. So:

| Document origin | `href="/styles.css"` resolves to |
| --- | --- |
| Local Hono today: `http://127.0.0.1:5420/` | `http://127.0.0.1:5420/styles.css` (works — site is at `/`) |
| User site: `https://heiyukidev.github.io/` | `https://heiyukidev.github.io/styles.css` (works — site is at `/`) |
| Project site: `https://heiyukidev.github.io/wayfinder-reader/` | `https://heiyukidev.github.io/styles.css` (**misses** `/wayfinder-reader/`; 404 unless some other site owns `/`) |

`<base href>` (HTML) sets the document base URL used for **relative** URLs. It does **not** turn `/styles.css` into `/wayfinder-reader/styles.css`. Path-absolute URLs still resolve at the host root. A `<base href="/wayfinder-reader/">` or `<base href="https://heiyukidev.github.io/wayfinder-reader/">` still leaves `/styles.css` at `https://heiyukidev.github.io/styles.css`.

Path-relative URLs (`styles.css`, `./app.js`, `vendor/lodash-es/get.js`) resolve against the document URL (or `<base href>`):

- Document `https://heiyukidev.github.io/wayfinder-reader/` or `…/wayfinder-reader/index.html` → `…/wayfinder-reader/styles.css`.
- Document `https://heiyukidev.github.io/wayfinder-reader` (**no** trailing slash, last path segment treated as a file) → `https://heiyukidev.github.io/styles.css` again. Same class of miss.

Jekyll’s own Pages docs call this out for sites “hosted in a subdirectory”: `_config.yml` `baseurl: /REPOSITORY-NAME/`. That knob is Jekyll. A hand-written `index.html` has no `baseurl`; it has path strings and optionally `<base href>`.

A custom domain whose Pages site is the **apex** of that host (`https://example.com/`, not `https://example.com/wayfinder-reader/`) would again be at `/`, so today’s `/styles.css` would match. That is a custom-domain fact, not this destination.

---

## Trap 2 — `public/` is not a Pages source folder

### What this repo serves today

`src/server.js` starts a Node HTTP listener on `127.0.0.1:5420` via `@hono/node-server`. `src/app.js` then:

1. Remaps `/vendor/lodash-es/*` → `node_modules/lodash-es/`
2. Remaps `/vendor/marked/*` → `node_modules/marked/`
3. Serves everything else from `public/` (`serveStatic({ root: …/public })`)

The browser origin is `/`. Files the browser actually loads:

- `public/index.html`, `public/app.js`, `public/styles.css`, `public/term-hints.js`, plus `public/fonts/`
- **Not** in `public/`: lodash-es and marked. Those live in `node_modules` and exist on the wire only because Hono rewrites `/vendor/…`.

There is **no** `index.html` at the repository root. This repo’s `docs/` is ADRs (`docs/adr/*.md`), not a Pages tree. There is no `docs/index.html`.

Pages **cannot** run that Node/Hono process. It publishes static files from a publishing source.

### What Pages will actually serve

Publishing source is **Settings → Pages → Build and deployment → Source**. Two families:

**A. Deploy from a branch.** Any branch. Folder is **only**:

| Folder | Meaning |
| --- | --- |
| `/` (root) | The top of that branch **is** the site. Pages looks for `index.html` / `index.md` / `README.md` **at the top of that folder**. |
| `/docs` | Only the `docs/` directory on that branch is the site. Entry file must be `docs/index.html` (or `index.md` / `README.md`). |

There is **no** “publish from `public/`” option in the branch UI. `gh-pages` is a conventional **branch name**, not a third folder. Docs still use it as an example (“if the publishing source is the `gh-pages` branch, a file `/about/contact-us.md` on that branch is at `https://<owner>.github.io/<repo>/about/contact-us.html`”). The branch can be named anything that exists; the folder on it is still only `/` or `/docs`.

If this tree were published **as-is** from `main` `/`:

- Entry search looks at repo-root `index.html` — **absent**.
- A `README.md` at repo root can become the site entry (Pages accepts `README.md` as an entry file). That is not the Reader UI.
- `public/index.html` would be a **subpath** (`…/public/index.html`), not the site root — and `/styles.css` would still request the **host** root, not `…/public/styles.css`.

If published from `main` `/docs`:

- Looks for `docs/index.html`. This repo’s `docs/` is ADR markdown. **Missing docs folder** (or missing entry) is a documented Pages 404 / Jekyll build error.

A dedicated branch whose **root** (or `/docs`) **contains** the static files (the contents of today’s `public/`, not the folder sitting one level down) would match the branch-source rules. That is a layout fact, not a pick.

**B. GitHub Actions.** Source = **GitHub Actions**. A workflow checks out the repo, optionally builds, then:

1. `actions/upload-pages-artifact` with input `path` = a directory of **static assets** (required; default in the action is `_site/`). The artifact’s **top level** must contain the entry file (`index.html`).
2. `actions/deploy-pages` deploys that artifact.

`path` **may** be `public` (or any other directory). Pages then serves **the contents of that directory as the site root**. It does not keep the `public/` prefix in the URL. That is the Actions-shaped way to map today’s `public/` onto a site root without renaming the folder in git.

The artifact still has to **include** every file the HTML/JS will fetch. Uploading `public/` alone does **not** include `node_modules/lodash-es` or `node_modules/marked`. Those `/vendor/…` URLs would 404 on Pages unless they are copied into the artifact (or the static app stops importing them from `/vendor/…`).

GitHub Pages always deploys via an Actions workflow run, even when the setting is “Deploy from a branch.” External CI that commits built files to `gh-pages` typically adds `.nojekyll`; the managed workflow then skips Jekyll and only deploys.

### Jekyll (branch source only)

If you publish **from a branch**, Pages runs **Jekyll by default**. Jekyll does not build files/folders that:

- sit in `/node_modules` or `/vendor`
- start with `_`, `.`, or `#`
- end with `~`

`.nojekyll` (empty file at the **root of the publishing source**) disables that Jekyll pass. GitHub recommends a custom Actions workflow if you are not using Jekyll.

Actions-published artifacts are already static files; you are not asking Jekyll to compile `public/index.html`.

### What the visitor gets

GitHub Pages publishes **any static files** in the publishing source. Each file is available in the **same directory structure** as that source. MIME types come from [mime-db](https://github.com/jshttp/mime-db); you cannot set custom MIME types per file.

Limits that apply: published site ≤ 1 GB; deploy timeout 10 minutes; soft 100 GB bandwidth / month; soft 10 builds / hour (the hourly build cap **does not** apply to a custom Actions workflow). Actions minutes are free for **public** repositories.

It can take up to **10 minutes** after a push for the site to appear.

---

## HTTPS and File System Access

`showDirectoryPicker()` is specified on `Window` with **`[SecureContext]`** (File System Access). MDN: available only in secure contexts (HTTPS). Also requires **transient user activation** (a user gesture).

A top-level `https://…` document is a secure context (W3C Secure Contexts: scheme `https` → potentially trustworthy). `http://127.0.0.1` and `http://localhost` are also potentially trustworthy (why the local Reader on 5420 can call the picker). A public `http://` origin is **not**.

GitHub Pages:

- Sites created after **15 June 2016** on `github.io` domains are served over **HTTPS automatically**.
- All Pages sites, including a correctly configured custom domain, support HTTPS and **Enforce HTTPS** (Settings → Pages), which redirects HTTP → HTTPS.
- TLS for custom domains is a Let’s Encrypt certificate GitHub requests after DNS checks out. Apex CNAME/A-record mistakes can block certificate issuance. RFC3280: the whole domain name must be **< 64 characters** for the certificate CN.
- Mixed content: HTML that still points at `http://` assets after HTTPS is on will fail to load those assets. Today’s Reader uses scheme-less path-absolute URLs (`/styles.css`), not `http://…`.

Custom domain (facts only; **not** this destination):

- Supported: `www` subdomain, other subdomain, apex.
- Recommended: verify the domain on the GitHub account **before** attaching it (takeover risk if Pages is disabled while DNS still points here).
- If a **user/org site** has a custom domain, project sites on that account default to `https://that.domain/<repo>` unless the project repo overrides it.
- A `CNAME` file in the repo does **not** add/remove a custom domain when using Actions; set it in repo Settings or the Pages REST API.
- DNS: `CNAME` for subdomains → `<owner>.github.io` (no repo name in the CNAME target). Apex: `A`/`AAAA` to GitHub Pages IPs, or `ALIAS`/`ANAME` → `<owner>.github.io`.

The destination origin for `heiyukidev/wayfinder-reader` as a **public project site** is `https://heiyukidev.github.io/wayfinder-reader` — HTTPS, therefore a secure context for `showDirectoryPicker`, with no custom domain required.

---

## 404 / SPA fallback

Pages looks for **`index.html`** (case-sensitive; `Index.html` / `index.HTML` do not count) as the **entry file**, at the **top of the publishing source** (or the top of the Actions artifact).

A custom `404.html` (or `404.md` with `permalink: /404.html`) is a **custom error page** for **nonexistent** paths. GitHub does **not** rewrite unknown paths to `index.html` with HTTP 200. That is not an SPA history-fallback.

This app is specified as a **single page, no client routes**. Visitors need `/` of the site (project site: `/wayfinder-reader/` or `/wayfinder-reader/index.html`). Extra paths (`/wayfinder-reader/foo`) are 404s and do **not** need a 404→app fallback unless client-side routes are added later. A `404.html` that clones `index.html` is a community SPA trick, not a Pages feature, and is unnecessary for a single page.

---

## Public vs private repo

Destination: **public** repo, MIT.

| Plan / shape | Pages from a **public** repo | Pages from a **private** repo | Site itself private (auth) |
| --- | --- | --- | --- |
| GitHub **Free** (personal or org) | Yes | **No** — repo must be public | No |
| GitHub **Pro** (personal) | Yes | Yes (Pages listed under private-repo features) | **No**. Note: privately published Pages need an **organization** on **GitHub Enterprise Cloud**. |
| GitHub **Team** | Yes | Yes | Same: private **publication** is GHEC org only |
| GitHub **Enterprise Cloud** org | Yes | Yes | **Access control** for **project** sites from private/internal org repos. Not for an **organization site**. Privately published URL is a unique `*.pages.github.io` subdomain (TLS + HSTS), not `github.io/<repo>`. |

Even when Pages **builds from a private repository** (Pro / Team / Enterprise, if the plan allows it), GitHub’s default warning is: **the published site is publicly available on the internet**. Private **repository** ≠ private **website**.

Switching a repo public ↔ private **changes the Pages URL** until rebuild. Private-repo Pages also needs an active Pro/Team/Enterprise subscription; lapsed plan → unpublished unless the repo is made public (then Pages is free again).

GitHub Actions for Pages is **free for public repositories**. Private/internal repos consume Actions minutes beyond the plan quota.

`heiyukidev` is a **User**, not an org. Access-controlled private Pages is not available on a personal account.

---

## Mapping (facts, not a pick)

| Job | Branch source (`/` or `/docs`) | Actions artifact | User site repo `heiyukidev.github.io` | Project site repo `wayfinder-reader` |
| --- | --- | --- | --- | --- |
| Run Hono / Node | No | No | No | No |
| Serve `public/` **as site root** without moving files in git | **No** (`public/` is not a source folder) | **Yes** (`upload-pages-artifact` `path` can be `public`) | Same source rules | Same source rules |
| Default URL | (depends on repo name) | (depends on repo name) | `https://heiyukidev.github.io/` | `https://heiyukidev.github.io/wayfinder-reader/` |
| Today’s `/styles.css` (and `/app.js`, `/vendor/…`) | Works only if the **site** is at `/` | Same | Matches | **Does not match** (host-root, not `/wayfinder-reader/`) |
| `<base href>` fixes `/styles.css` | No | No | N/A (already `/`) | **No** |
| Path-relative `styles.css` | Works if document URL is a directory or `…/index.html` | Same | Works | Works under `/wayfinder-reader/` |
| Include lodash-es / marked | Must be **inside** the published tree (Pages has no Hono rewrite) | Same | Same | Same |
| Jekyll by default | Yes (unless `.nojekyll`) | No (you upload static files) | Same | Same |
| SPA `404.html` rewrite | Not provided | Not provided | Not needed for one page | Not needed for one page |
| HTTPS / `showDirectoryPicker` | `github.io` HTTPS automatic | Same | Secure context | Secure context |

---

## Sources

- GitHub Docs — [What is GitHub Pages?](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages): static hosting; user/org vs project; default URLs `https://<owner>.github.io` vs `https://<owner>.github.io/<repositoryname>`; one user/org site per account, one project site per repo.
- GitHub Docs — [Creating a GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site): Free ⇒ public repo; entry file `index.html` / `index.md` / `README.md` at top of source folder or Actions artifact; Jekyll by default on branch publish; `.nojekyll`; no server-side languages (PHP, Ruby, Python); MIME types from mime-db; example `gh-pages` branch layout; up to 10 minutes to publish; Actions free for public repos.
- GitHub Docs — [Configuring a publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site): branch **or** Actions; branch folder is `/` **or** `/docs` only; missing `/docs` is a build error; Actions flow = checkout → optional build → `actions/upload-pages-artifact` → `actions/deploy-pages`; `CNAME` file does not configure custom domain under Actions; even branch deploys run an Actions workflow; `GITHUB_TOKEN` pushes do not trigger a branch Pages build.
- GitHub Docs — [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits): 1 GB published site; 10 minute deploy timeout; soft 100 GB/month bandwidth; soft 10 builds/hour except custom Actions workflows.
- GitHub Docs — [Troubleshooting 404 errors](https://docs.github.com/en/pages/getting-started-with-github-pages/troubleshooting-404-errors-for-github-pages-sites): `index.html` case-sensitive; entry at top of source; visibility change changes URL; private Pages needs Pro/Team/Enterprise still active, else make public.
- GitHub Docs — [Creating a custom 404 page](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-custom-404-page-for-your-github-pages-site): `404.html` / `404.md` is an error page for nonexistent paths.
- GitHub Docs — [Securing your GitHub Pages site with HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https): HTTPS + Enforce HTTPS; `github.io` after 2016-06-15 automatic HTTPS; Let’s Encrypt for custom domains; mixed content; CN length 64; Pages sites public even from private repos (if the plan allows Pages).
- GitHub Docs — [About custom domains and GitHub Pages](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages): www / custom subdomain / apex; user-site custom domain applies to project sites as `/<repo>` unless overridden; verification / takeover; Pro→Free unpublishes private-repo sites.
- GitHub Docs — [About GitHub Pages and Jekyll](https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll/about-github-pages-and-jekyll): default skip of `node_modules`, `vendor`, `_` / `.` / `#` prefixes.
- GitHub Docs — [Creating a GitHub Pages site with Jekyll](https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll/creating-a-github-pages-site-with-jekyll): `baseurl: /REPOSITORY-NAME/` when hosted in a subdirectory; `gh-pages` as an orphan-branch example.
- GitHub Docs — [GitHub’s plans](https://docs.github.com/en/get-started/learning-about-github/githubs-plans): Free = Pages in **public** repositories; Pro/Team add Pages for **private** repositories; privately published Pages requires an org on GitHub Enterprise Cloud.
- GitHub Docs (Enterprise Cloud) — [Changing the visibility of your GitHub Pages site](https://docs.github.com/en/enterprise-cloud@latest/pages/getting-started-with-github-pages/changing-the-visibility-of-your-github-pages-site): access control for project sites; unique `*.pages.github.io` subdomain; not for organization sites.
- [`actions/upload-pages-artifact` README](https://github.com/actions/upload-pages-artifact): `path` is the directory of static assets (default `_site/`); artifact top-level is the site.
- WHATWG URL — [path-absolute-URL string](https://url.spec.whatwg.org/#path-absolute-url-string) vs [path-relative-URL string](https://url.spec.whatwg.org/#path-relative-url-string).
- HTML — [`base` element](https://html.spec.whatwg.org/multipage/semantics.html#the-base-element); MDN [`<base>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/base): base URL for relative URLs.
- W3C [Secure Contexts](https://www.w3.org/TR/secure-contexts/): `https` origins are potentially trustworthy; top-level `https://` is a secure context. MDN [Secure contexts](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts): non-local resources must be `https://`; `http://127.0.0.1` / `localhost` are potentially trustworthy.
- WICG [File System Access](https://wicg.github.io/file-system-access/#api-showdirectorypicker): `showDirectoryPicker` on `Window` is `[SecureContext]`. MDN [`showDirectoryPicker()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker): secure context + transient user activation.
- This repo: `src/server.js`, `src/app.js` (`serveStatic` `public/` + `/vendor` rewrites), `public/index.html`, `public/app.js`, `public/term-hints.js`.
- GitHub REST `GET https://api.github.com/users/heiyukidev` (`type: User`); HTTP 404 for `heiyukidev/wayfinder-reader` and `heiyukidev/heiyukidev.github.io` (2026-08-20).
