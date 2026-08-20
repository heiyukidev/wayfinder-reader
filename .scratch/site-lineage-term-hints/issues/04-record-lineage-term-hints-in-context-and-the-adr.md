# Record lineage Term hints in CONTEXT and the ADR

Type: grilling
Status: resolved
Blocked by: 01, 02, 03

## Question

How should the lock be written so a later `/to-spec` session does not restore Project-wide merge?

Today [ADR 0006](../../../docs/adr/0006-term-hints-from-language-files.md) says several CONTEXT files merge and a collision shows both. [Prefer the longer Term hint phrase](../../term-hint-longest-phrase/spec.md) amends matching in place and keeps cross-Site collision cards. This Effort reverses the merge for parallel Sites.

Grill: **new ADR** (recommended — scoping model, not a matching tweak) that amends 0006’s merge sentence, versus amend 0006 in place like longest-phrase. Record **Site lineage** (or the name [How a previewed file’s Site lineage is computed](01-how-a-previewed-files-site-lineage-is-computed.md) chose) and the **Term hint** overlay rule in `CONTEXT.md`. Include the Paste rule from [What language a Paste preview uses](02-what-language-a-paste-preview-uses.md) and whichever card rule [How the hint card shows which Site supplied the Term](03-how-the-hint-card-shows-which-site-supplied-the-term.md) locked.

Do not write `spec.md` here (that is `/to-spec` once this map’s frontier is empty). Do not implement the overlay.

## Answer

**New ADR**, not an in-place matching amend. Overlay scoping is a reversal of [ADR 0006](../../../docs/adr/0006-term-hints-from-language-files.md)’s merge sentence, not a longest-phrase tweak; a later `/to-spec` that only reads 0006 must not restore Project-wide merge.

- Glossary: **Site lineage**, **Term hint**, and **Paste preview** in [`CONTEXT.md`](../../../CONTEXT.md).
- Overlay lock: [ADR 0016](../../../docs/adr/0016-term-hints-use-site-lineage.md) — Site lineage only; closest phrase wins; Paste borrows the current **Map list** selection; inherited footer; same-Site collisions still list both. Discovery stays [ADR 0010](../../../docs/adr/0010-marker-walk-finds-sites.md).
- Matching/chrome stay in ADR 0006; its merge sentence now points at 0016.

Did not write `spec.md`. Did not implement the overlay.
