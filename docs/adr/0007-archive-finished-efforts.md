# Archive finished Efforts

The on-disk move is `.scratch/<slug>/` → `.scratch/.archive/<slug>/` after confirm. Load never archives. Hard delete is out. There is no Archive list and no Restore; recovery is moving the directory back on disk. The **Unresolved filter** only hides live Finished Efforts; Archive is the write. The hosted **Reader** does not offer this control ([ADR 0013](0013-hosted-reader-does-not-archive.md)). **Always-on** does ([ADR 0015](0015-always-on-hono-path-load-and-archive.md)).

Rejected: auto-archive on Load; `rm` of the Effort; a Skip-prompt that leaves the Reader read-only for this job; an in-app Archive view.
