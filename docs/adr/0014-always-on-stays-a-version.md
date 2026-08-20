# Always-on stays a version of the Reader

**Always-on** (a `launchd` user agent plus a bookmark at `http://127.0.0.1:5420`) is a version of the **Reader**, not a leftover to unload once the public origin exists. [Retire launchd Always-on](../../.scratch/hosted-reader/issues/09-retire-launchd-always-on.md) is out of scope for hosting the static Reader: this Effort does not boot out `so.karine.wayfinder-reader`, stop documenting the user agent, or delete the plist / `src/server.js`.

This amends [ADR 0011](0011-static-public-origin-for-the-reader.md): the public origin is how a visitor gets a session; it does not retire Always-on. [ADR 0001](0001-launchd-user-agent-for-always-on.md) stays accepted for that version. What Always-on serves is [ADR 0015](0015-always-on-hono-path-load-and-archive.md): **Project path** Load and **Archive**, not a local copy of Pages. Do not call GitHub Pages **Always-on**.

Rejected: unloading launchd when Pages is live; treating Always-on as dead docs.
