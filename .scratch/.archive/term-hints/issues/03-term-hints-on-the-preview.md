# Term hints on the preview

Type: prototype
Status: resolved
Blocked by: 01

**What to build:** After GFM parse, **Term hints** wrap matching words in the preview. Hover shows the definition (or “Prefer **Term**” for aliases). Collisions list each context. Skip `code`, `pre`, and links. Dotted underline, existing ink, no color change. Stub can be unpolished.

- [x] Canonical Terms and `_Avoid_` aliases match whole-word, case-insensitive, on Map / Ticket / Spec / language previews
- [x] Hints are skipped inside `code`, `pre`, and `a`
- [x] Collision records show both definitions labeled by `contextName`
- [x] Empty `terms` leaves preview unchanged
- [x] Load this repo and dnd-heiyuki (dense Language section) to react to density

## Answer

**B (Hover card)** with GFM in the popover.

Every whole-word match (Terms and `_Avoid_` aliases) gets a dotted underline in the existing ink. Hover (or focus) opens a paper card: definitions render as GFM so nested `**Terms**`, `_Avoid_`, code, and links read as formatted text; aliases say Prefer **Term**; collisions list each `contextName`. Skip `code`, `pre`, and links. Empty `terms` is a no-op. Native `title` (A) could not format that markdown. First-mention plus a page index (C) was not needed once the card made density readable.

Folded into `public/term-hints.js`. Variants as primary source: [prototypes/term-hints-variants.js](../prototypes/term-hints-variants.js).
