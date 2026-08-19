# ADR 0002 — Readable tree is `.scratch/` only

Status: accepted

## Context

The **Reader** is Always-on on `127.0.0.1:5420`. Once a **Project** is selected, the server can `readFile` anything under that path unless the product forbids it. [What on-disk shapes count as a Wayfinder map](../../.scratch/map-reader/issues/01-what-on-disk-shapes-count-as-a-wayfinder-map.md) says Maps live under `.scratch/`, and Khaled’s Projects also keep spec-only and `/to-tickets` folders in the same tree.

## Decision

The **Readable tree** is the chosen Project’s **entire `.scratch/` tracker tree**:

- Effort folders with `map.md` (Maps), including `issues/`, `research/`, `spec.md`, and `prototypes/` (any file type in the tree).
- Sibling folders without `map.md` (spec-only, `/to-tickets`). Show them; do not call them Maps.

Do not walk the rest of the Project (`node_modules`, `.git`, source, other hidden directories). Never follow `..` or a symlink out of the Project. Empty state is “no `.scratch/*/map.md`.”

Rejected: maps-only (hides dnd-heiyuki specs and sealbox `first-slice`); all markdown / the whole Project (Always-on would serve source and secrets).

## Consequences

[Tree plus markdown preview stub](../../.scratch/map-reader/issues/07-tree-plus-markdown-preview-stub.md) listed only paths under `.scratch/`. The UI tree is superseded by the **Map list** ([ADR 0005](0005-map-list-replaces-files-view.md)). Language files are a named hole ([ADR 0006](0006-term-hints-from-language-files.md)). Containment still forbids walking source, `.git`, and `node_modules`.
