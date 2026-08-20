# Hosted Reader does not Archive

The hosted **Reader** is read-only. Chromium cannot rename a directory handle, and copy-then-delete can leave a half-archived **Effort**, so this origin does not **Archive**. [ADR 0007](0007-archive-finished-efforts.md) still describes the on-disk move (`.scratch/<slug>/` → `.scratch/.archive/<slug>/`). **Always-on** keeps that control ([ADR 0015](0015-always-on-hono-path-load-and-archive.md)). This amends [ADR 0012](0012-file-system-access-load.md): Load stays `"read"`; the page never asks `readwrite`.

Rejected: copy-then-`removeEntry` as Archive on the hosted origin.
