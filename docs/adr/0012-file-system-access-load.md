# File System Access Load, no Node fs server

Status: accepted. Amended by [ADR 0018](0018-hosted-directory-snapshot-fallback.md).

Load a **Project** with File System Access (`showDirectoryPicker`) when the browser can grant a **Directory handle**, and keep recents as those handles, not a POSIX **Project path**. The walk, GFM preview, and **Term hints** run in the page. The hosted origin has no Node `fs` server. This supersedes [ADR 0003](0003-hono-static-page-for-the-reader.md) for that origin. Hono is not the hosted process; **Always-on** uses it for **Project path** Load and **Archive** ([ADR 0015](0015-always-on-hono-path-load-and-archive.md)). No Vite/Next at runtime, no Electron.

Read on Load. Same **Site** markers as [ADR 0010](0010-marker-walk-finds-sites.md). The hosted **Reader** never asks `readwrite`; [ADR 0013](0013-hosted-reader-does-not-archive.md) drops **Archive** from this origin. [ADR 0002](0002-readable-tree-is-scratch-only.md)’s named holes still hold: do not read source, `.git`, `node_modules`, or secrets to show them. Safari is out (`webkitdirectory` can omit `.scratch`). Firefox and stock Brave Load via a **Directory snapshot** ([ADR 0018](0018-hosted-directory-snapshot-fallback.md)).

Rejected: typed **Project path** on the hosted origin; public-binding the current Hono process; a thinner preview-only Reader. `webkitdirectory` as the Chrome/Edge path, and `webkitdirectory` on Safari, stay rejected.
