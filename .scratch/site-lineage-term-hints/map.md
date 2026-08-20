# Scope Term hints to the previewed Site’s lineage

## Destination

A spec (glossary + ADR lock) for **Term hints**: the overlay uses language from the previewed file’s **Site lineage** only — that **Site** and its ancestor Sites, never siblings, cousins, or descendants. Closest Site that defines a phrase wins. **Context tab** still lists every language document. Implementation is remaining work after this map (`/to-spec`, then `/implement`), not this Effort.

## Notes

- Domain: the **Reader**. Glossary: `CONTEXT.md`. Overlay fuel is [ADR 0016](../../docs/adr/0016-term-hints-use-site-lineage.md) (amends [ADR 0006](../../docs/adr/0006-term-hints-from-language-files.md)’s merge). Site discovery stays [ADR 0010](../../docs/adr/0010-marker-walk-finds-sites.md).
- Skills: `/wayfinder` for this map; grilling + domain-modeling on HITL tickets; `/prototype` on the hint-card ticket. Lodash for arrays/objects.
- Tracker: local markdown under `.scratch/site-lineage-term-hints/` (see Wayfinding operations in `docs/agents/issue-tracker.md`).
- Standing: **plan, don’t do.** The destination is the spec, not a running overlay. Do not ship into `public/` on this map.
- Sibling Efforts: [Prefer the longer Term hint phrase](../term-hint-longest-phrase/spec.md) still assumes cross-Site collision cards; this map supersedes that for parallel Sites (longest-phrase still runs on the filtered set). [Paste markdown into the preview and see Term hints](../paste-preview/map.md) assumed one merged glossary; Paste’s overlay rule is [What language a Paste preview uses](issues/02-what-language-a-paste-preview-uses.md).
- Autopilot locks (object with a named failure mode):
  - Tree is filesystem ancestry of **Sites**, not CONTEXT-MAP Relationships. Folders without a Site marker are skipped on the walk up.
  - Walk **up only**. A parent preview does not inherit child language.
  - Owning Site = deepest Site that **contains** the previewed path (`rel` is `.`, or path equals `rel`, or starts with `rel` + `/`). **Site lineage** = every containing Site, closest to root. Not a raw string prefix.
  - Per-phrase cascade: a silent child falls through to the parent; the closest Site that defines that phrase (Term or alias) wins. Not “child CONTEXT.md replaces the whole parent glossary.”
  - Identity is Site `rel` / language `path`, not `contextName` (titles can collide).
  - Load still discovers every Site. Overlay filters. **Context tab** still lists every language document.
  - Effort-local `CONTEXT.md` is still not a Site.
  - Same-Site collisions (root `CONTEXT.md` plus `CONTEXT-MAP.md`) may still list both, labeled by context. Parallel Sites never meet in the overlay.
  - Longest-phrase matching unchanged; it runs after lineage filter.
  - Same rule on hosted origin and **Always-on**.

## Decisions so far

- [How a previewed file’s Site lineage is computed](issues/01-how-a-previewed-files-site-lineage-is-computed.md): directory containment; closest Site per phrase; Load keeps all `terms` with Site `rel`.
- [What language a Paste preview uses](issues/02-what-language-a-paste-preview-uses.md): current **Map list** selection’s **Site lineage**; none this Load → root Site only; never Project-wide merge.
- [How the hint card shows which Site supplied the Term](issues/03-how-the-hint-card-shows-which-site-supplied-the-term.md): inherited footer only; title at read time; local Terms stay today’s slip.
- [Record lineage Term hints in CONTEXT and the ADR](issues/04-record-lineage-term-hints-in-context-and-the-adr.md): new [ADR 0016](../../docs/adr/0016-term-hints-use-site-lineage.md) amends 0006’s merge; glossary **Site lineage**, **Term hint**, and **Paste preview**.

## Not yet specified

## Out of scope

- Changing how agents or the domain-modeling skill load nested `CONTEXT.md` files. That is not this **Reader**.
- Restyling the **Context tab** as a filesystem tree. Browse stays a flat language / ADR / out-of-scope list.
- Walking down to descendant Sites, or using CONTEXT-MAP Relationships as the tree.
- **Take prompt**, **Skip prompt**, **Archive**, Load, **Unresolved filter**, and the **Tickets** outline.
- Changing longest-phrase matching itself.
- Shipping the overlay in this Effort.
- Pixel polish of the inherited footer (weight, uppercase, fade). The chrome lock is [How the hint card shows which Site supplied the Term](issues/03-how-the-hint-card-shows-which-site-supplied-the-term.md); Look at `/implement`.
