# Hosted Load is a Directory handle or a Directory snapshot

Status: accepted. Amends [ADR 0011](0011-static-public-origin-for-the-reader.md) and [ADR 0012](0012-file-system-access-load.md).

The hosted origin still has no Node `fs` server. When File System Access exists, Load identity is a **Directory handle**; recents stay handles. When it does not, Load identity is a **Directory snapshot**: a one-shot folder pick, session only, no recents. That pick enumerates the whole tree before skip-by-name, so a large **Project** can stall; warn on that path. Safari stays out: its folder pick can omit `.scratch`, so an engine check keeps the explicit unsupported error instead of a silent empty Tickets list. Firefox and stock Brave use the snapshot. **Always-on** is unchanged (**Project path**).

Rejected: dropping File System Access so Chrome matches Firefox; persisting a snapshot as recents; `webkitdirectory` on Safari; typed **Project path** on Pages; public-binding Hono.
