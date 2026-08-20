# What the Always-on version serves

Type: grilling
Status: resolved
Blocked by:

## Question

[Retire launchd Always-on](09-retire-launchd-always-on.md) is out of scope: **Always-on** stays a version of the **Reader** ([ADR 0014](../../../docs/adr/0014-always-on-stays-a-version.md)). The hosted origin is static HTML/JS with File System Access Load ([ADR 0011](../../../docs/adr/0011-static-public-origin-for-the-reader.md), [ADR 0012](../../../docs/adr/0012-file-system-access-load.md)). Always-on today is launchd + Hono + Node `fs` at `127.0.0.1:5420` ([ADR 0001](../../../docs/adr/0001-launchd-user-agent-for-always-on.md), [ADR 0003](../../../docs/adr/0003-hono-static-page-for-the-reader.md)).

What should Always-on serve now that both versions exist?

- **A. Keep Hono** — launchd still runs `src/server.js`. **Project path** Load and **Archive** stay on this version. The hosted origin stays FSA and read-only.
- **B. Serve the static Reader locally** — Always-on keeps `127.0.0.1:5420` but serves the same static tree as Pages. Load is FSA on localhost too.
- **C. Something else** — name it.

Do not unload the agent. Do not implement. Skills: grilling + domain-modeling. [ADR 0003](../../../docs/adr/0003-hono-static-page-for-the-reader.md) / [ADR 0012](../../../docs/adr/0012-file-system-access-load.md) may need a follow-on if A or B lands.

## Answer

**A.** Always-on keeps Hono: launchd still runs `src/server.js` at `127.0.0.1:5420`. **Project path** Load (typed + recents in `~/.wayfinder-reader/state.json`) and **Archive** stay on this version. The hosted origin stays **Directory handle** Load and read-only.

A Directory handle has no POSIX path, including on localhost, so File System Access Load cannot drive `/api/archive`. Serving only the static picker on 5420 would drop the only write. A server-side macOS folder pick is still a path with extra mechanism.

One `public/` for both versions. Always-on is a successful `/api/state`; hosted never shows a path field or Archive. [ADR 0003](../../../docs/adr/0003-hono-static-page-for-the-reader.md) is accepted again for Always-on; [ADR 0012](../../../docs/adr/0012-file-system-access-load.md) stays the hosted origin. The split is [ADR 0015](../../../docs/adr/0015-always-on-hono-path-load-and-archive.md). Restore of Always-on chrome is [Restore Always-on Project path Load and Archive](12-restore-always-on-project-path-load-and-archive.md).
