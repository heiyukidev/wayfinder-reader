# Record the hosted Reader in CONTEXT and supersede Always-on and Hono ADRs

Type: task
Status: resolved
Blocked by:

## Question

Nothing left to decide — the destination is locked on [Host the Reader as static files that Load a local Project](../map.md). Write it into the glossary and ADRs so later tickets do not keep describing the launchd app.

Update `CONTEXT.md`:

- **Reader** — static HTML/JS at the public origin; Chrome/Edge; Load via File System Access. Not a process on port 5420.
- **Project** — still the folder on disk. Stop storing a POSIX **Project path** as Load. Recents are directory handles.
- **Always-on** — retired for this product (launchd + bookmark on `127.0.0.1:5420`). Do not overload it to mean “GitHub Pages is up.”
- **Stack** / **Look** — static page, GFM in the page, same reading-desk Look. Hono is not the shipped process.

Supersede [ADR 0001](../../../docs/adr/0001-launchd-user-agent-for-always-on.md) and [ADR 0003](../../../docs/adr/0003-hono-static-page-for-the-reader.md) with new ADRs (static public origin + FSA Load; no Node `fs` server). Follow domain-modeling: glossary in CONTEXT, ADRs only for the hard-to-reverse surprises.

Do not implement the app. Do not unload Khaled’s launchd agent (that is [Retire launchd Always-on](09-retire-launchd-always-on.md)). MIT is already locked in the map Notes; add `LICENSE` only if this ticket is the natural place, otherwise leave it to [Create the public heiyukidev/wayfinder-reader repo](05-create-the-public-heiyukidev-wayfinder-reader-repo.md).

## Answer

Wrote the hosted Reader into `CONTEXT.md` and superseded the launchd/Hono ADRs. Did not implement the app, unload launchd, or add `LICENSE`.

- **Reader** is static HTML/JS at a public origin (Chrome/Edge), Load via File System Access. Not a process on port 5420.
- **Directory handle** is the Load/recents identity. **Project path** and **Always-on** are retired (do not reuse Always-on for “GitHub Pages is up”).
- **Stack** is the static page; Hono is not the shipped process. **Look** is unchanged.
- [ADR 0011](../../../docs/adr/0011-static-public-origin-for-the-reader.md) supersedes [ADR 0001](../../../docs/adr/0001-launchd-user-agent-for-always-on.md) (GitHub Pages origin, not launchd Always-on).
- [ADR 0012](../../../docs/adr/0012-file-system-access-load.md) supersedes [ADR 0003](../../../docs/adr/0003-hono-static-page-for-the-reader.md) (directory-handle Load in the page, no Node `fs` server).

