# Static public origin for the Reader

Status: accepted. Amended by [ADR 0014](0014-always-on-stays-a-version.md).

The **Reader** is static HTML/JS at a public HTTPS origin, opened in Chrome or Edge. Origin is GitHub Pages on `github.com/heiyukidev/wayfinder-reader`. A custom domain is later, not this lock. This is how a visitor gets a session. It does not retire **Always-on**: a `launchd` user agent plus bookmark at `127.0.0.1:5420` remains a version of the app ([ADR 0001](0001-launchd-user-agent-for-always-on.md), [ADR 0014](0014-always-on-stays-a-version.md)). `npm start` is not either version. Do not treat “GitHub Pages is up” as **Always-on**.

Rejected: binding Hono (or any Node `fs` server) on a public interface; launchd / Homebrew / a Mac install as the way to get the *hosted* Reader; Electron.
