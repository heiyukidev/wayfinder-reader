# Always-on keeps Hono Project path Load and Archive

The hosted origin Loads a **Directory handle** and does not **Archive** ([ADR 0012](0012-file-system-access-load.md), [ADR 0013](0013-hosted-reader-does-not-archive.md)). **Always-on** is the version that still runs Hono at `127.0.0.1:5420` ([ADR 0001](0001-launchd-user-agent-for-always-on.md), [ADR 0014](0014-always-on-stays-a-version.md)): **Project path** Load and Archive via Node `fs`. A Directory handle never yields a POSIX path, so File System Access Load cannot drive `/api/archive`.

One `public/` for both versions. Always-on is detected by `/api/state`. Do not ship a second frontend tree. This restores [ADR 0003](0003-hono-static-page-for-the-reader.md) for Always-on; [ADR 0012](0012-file-system-access-load.md) remains the hosted origin.

Rejected: serving only the static File System Access Reader on 5420; a native/server folder pick that is still a path; two copies of the UI.
