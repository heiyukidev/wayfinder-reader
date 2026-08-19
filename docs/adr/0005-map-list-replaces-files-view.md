# ADR 0005 — Map list replaces Files view

Status: accepted

The **Reader** sidebar is a **Map list**, not a filesystem tree. Khaled reads **Maps**, **Tickets**, **Specs**, and language documents the way Matt Pocock’s Wayfinder tracker shows issues — by name, with the **Frontier** visible — not by path. **Files view** and the Files / Decisions toggle are gone.

This supersedes ADR 0004’s “Files view remains” and its rejection of replacing the tree. The blocking outline, **Skip prompt**, read-only Reader, and “no graph canvas” still stand; they live on the **Map list**. ADR 0002’s containment still holds: the server does not walk source, `.git`, or `node_modules`. Research and prototypes are not outline rows; they open only via in-`.scratch/` preview links.

Rejected: a second Files mode; reopening [Read Wayfinder maps locally](../../.scratch/map-reader/map.md) as the place to ship this (that destination is the shipped tree stub); redrawing [See which Ticket blocks which, and skip-grill from the Reader](../../.scratch/decisions-view/map.md) in place. Shipping vehicle is a **third Effort**. That leaves decisions-view’s destination (Files stays, toggle, replacing the tree is out of scope) in conflict until that map is scoped.
