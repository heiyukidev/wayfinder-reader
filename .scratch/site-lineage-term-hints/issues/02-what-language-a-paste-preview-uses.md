# What language a Paste preview uses

Type: grilling
Status: resolved
Blocked by: 01

## Question

A **Paste preview** has no file path. Which **Site lineage** feeds its **Term hints**?

[Paste markdown into the preview and see Term hints](../../paste-preview/map.md) currently locks “same merged language as file preview.” After [How a previewed file’s Site lineage is computed](01-how-a-previewed-files-site-lineage-is-computed.md), that merge is gone. Pick a rule so paste is not a back door to sibling glossaries, and so it does not surprise once a **Map list** file was already previewed.

Choices to grill (recommended first): last previewed file’s lineage; if none this Load, root Site only — never the old Project-wide merge. Alternatives: always root; always all Sites (reject: reopens parallel collisions); disable Term hints on paste; prompt for a Site.

Do not ship Paste. Do not reopen Paste chrome. This ticket only names the overlay set.

## Answer

A **Paste preview** has no path. Its **Term hints** borrow **Site lineage** from the current **Map list** selection (`selectedRelPath`) — the same identity **Take prompt** and **Skip prompt** already follow. Compute [How a previewed file’s Site lineage is computed](01-how-a-previewed-files-site-lineage-is-computed.md) on that path when paste Show renders. Never the old Project-wide merge.

- Selection includes Load’s auto-select (`firstPreviewPath()`). Paste-right-after-Load follows that first row, not root by default.
- Live at render, not snapshotted at Compose. Click a **Map list** row, then restore Paste: the new selection’s lineage.
- No selection this Load (empty preview): root **Site** only (`.`). If the Project root is not a Site, empty lineage → existing silent no-op.
- Term hints stay on. No Site prompt. Chrome unchanged.

Examples:

- Load a Project whose first live Effort is under `apps/billing`, paste immediately: billing + ancestors; not `apps/shipping`.
- Preview `apps/billing/docs/adr/0001.md`, then Paste: billing + root.
- Then click `apps/shipping/CONTEXT.md`, restore Paste: shipping + root; billing is out.
- Load with no **Map list** rows: root Site only.
- Nested-only Project (Sites at `apps/billing` and `apps/shipping`, root is not a Site), paste with no selection: no hints.

Rejected: always root (surprises once a nested file is already selected); all Sites (reopens parallel collisions); disable hints on paste; prompt for a Site.

Do not ship Paste in this Effort. Card chrome is [How the hint card shows which Site supplied the Term](03-how-the-hint-card-shows-which-site-supplied-the-term.md). Glossary and ADR write-up is [Record lineage Term hints in CONTEXT and the ADR](04-record-lineage-term-hints-in-context-and-the-adr.md).
