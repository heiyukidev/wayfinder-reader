# What the server may read in a chosen Project

Type: grilling
Status: resolved
Blocked by: 01

## Question

Once a **Project** is selected, what may the **Reader** expose over localhost? Only `.scratch/` Effort trees? All markdown in the Project? Tickets, research notes, specs, and prototype files? Hidden directories besides `.scratch/`?

Recommendation to grill against: expose `.scratch/` only — each **Map** is `.scratch/<effort>/map.md` plus that Effort’s `issues/`, `research/`, `spec.md`, and `prototypes/` ([What on-disk shapes count as a Wayfinder map](01-what-on-disk-shapes-count-as-a-wayfinder-map.md)). Also list sibling `.scratch/` folders that are **not** maps (spec-only, `/to-tickets`) so they stay visible. Do not walk the rest of the repo (`node_modules`, `.git`, source). Never follow `..` out of the Project.

## Answer

The **Reader** may expose **only** the chosen **Project**’s `.scratch/` tree over localhost. Khaled locked the whole tracker tree, not maps-only: Effort folders with `map.md`, and sibling folders that are spec-only or `/to-tickets` (dnd-heiyuki specs, sealbox `first-slice`). Those siblings are **not** Maps.

Inside an Effort: `map.md`, `issues/`, `research/`, `spec.md`, and `prototypes/` (any file type listed in the tree). Do not walk the rest of the repo (`node_modules`, `.git`, source, other hidden dirs). Never follow `..` or a symlink out of the Project. Empty state is still “no `.scratch/*/map.md`.” Non-markdown preview stays with [Tree plus markdown preview stub](07-tree-plus-markdown-preview-stub.md).

Glossary: `CONTEXT.md`. ADR: [docs/adr/0002-readable-tree-is-scratch-only.md](../../../docs/adr/0002-readable-tree-is-scratch-only.md).
