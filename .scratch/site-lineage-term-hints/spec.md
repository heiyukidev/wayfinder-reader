# Scope Term hints to the previewed Site’s lineage

Status: ready-for-agent

## Problem Statement

Khaled Loads a Project with more than one **Site** (for example billing and shipping under one repo). Hovering a **Term** on a billing ADR still shows shipping’s language, and the same phrase from two parallel Sites collides on one card. The glossary is Project-wide. He cannot tell which Site supplied a hint he inherited from a parent.

## Solution

**Term hints** on a GFM preview use language from that file’s **Site lineage** only: the owning **Site** and its ancestor Sites, never siblings, cousins, or descendants. The closest Site that defines a phrase wins. A **Paste preview** borrows the current **Map list** selection’s lineage. An inherited hint names the ancestor Site; a local Term stays today’s slip. The **Context tab** still lists every language document. Shape: [ADR 0016](../../docs/adr/0016-term-hints-use-site-lineage.md), [ADR 0006](../../docs/adr/0006-term-hints-from-language-files.md), [ADR 0010](../../docs/adr/0010-marker-walk-finds-sites.md). Glossary: [`CONTEXT.md`](../../CONTEXT.md).

## User Stories

1. As Khaled, I want Term hints on `apps/billing/docs/adr/0001.md` to use billing and root language only, so that `apps/shipping` never hints on a billing ADR.
2. As Khaled, I want previewing `apps/billing/CONTEXT.md` itself to still inherit root and still exclude shipping, so that reading a nested glossary is not a back door to cousins.
3. As Khaled, I want previewing root `CONTEXT.md` or a root ADR to use root language only, so that a parent preview does not inherit child Terms.
4. As Khaled, I want a Site at `apps` and at `apps/billing` to give billing the lineage billing → `apps` → `.`, so that a mid-tree Site is an ancestor, not skipped.
5. As Khaled, I want a billing Site that is `.scratch/` only (no `CONTEXT.md`) to inherit ancestor language, so that a tracker-only Site is not a dead overlay.
6. As Khaled, I want root `CONTEXT.md` and root `CONTEXT-MAP.md` that define the same Term to still list both, labeled by context, so that same-Site collisions stay collisions, not lineage.
7. As Khaled, I want two Sites that share a display title to stay distinct in the overlay, so that identity is the Site’s path, not `contextName`.
8. As Khaled, I want Site `apps/billing` not to own `apps/billing-extra/…`, so that containment is a directory, not a raw string prefix.
9. As Khaled, I want a silent child to fall through to the parent for a phrase the child does not define, so that missing a Term locally does not hide the ancestor.
10. As Khaled, I want a child `_Avoid_` alias for a phrase to shadow a parent Term for that same phrase, so that the closest Site that defines the phrase wins.
11. As Khaled, I want a child shorter Term (**Affiliate**) not to steal a parent longer phrase (**Affiliate program**) that the child does not define, so that longest-phrase matching still runs after the lineage filter.
12. As Khaled, I want Load to still return every `terms` record, each carrying that Site’s `rel`, so that the overlay filters and discovery does not shrink.
13. As Khaled, I want the **Context tab** to still list every language document, so that browse is not scoped to the previewed lineage.
14. As Khaled, I want a **Paste preview** to use the current **Map list** selection’s Site lineage, so that paste is not a Project-wide merge.
15. As Khaled, I want paste-right-after-Load to follow Load’s auto-select (`firstPreviewPath()`), so that the first live row’s Site is the paste overlay, not root by default.
16. As Khaled, I want paste overlay to recompute at Show, so that clicking a Map list row and restoring Paste picks the new selection’s lineage.
17. As Khaled, I want paste with no selection this Load to use the root Site only, so that an empty preview is not a merge.
18. As Khaled, I want paste with no selection in a nested-only Project (root is not a Site) to show no Term hints, so that the existing silent no-op still holds.
19. As Khaled, I want Term hints to stay on for Paste, so that paste is not a glossary-free pane.
20. As Khaled, I want a singleton hint from the owning Site to keep today’s titled slip, so that local Terms do not grow extra chrome.
21. As Khaled, I want a singleton hint inherited from a parent Site to show `Inherited from {title}`, so that I can see which Site supplied the phrase.
22. As Khaled, I want that title rendered at read time from the Site’s title, so that identity stays `rel` and the card never stores a stale label.
23. As Khaled, I want a same-Site collision card to keep both context-labeled definitions, and to get the inherited footer when that Site is not the owner, so that collisions and inheritance can both be true.
24. As Khaled, I want an alias (“Prefer”) card to follow the same inherited-footer rule, so that `_Avoid_` hints are not a second product.
25. As Khaled, I want parallel Sites never to appear on the hint card, so that shipping cannot show up on a billing hover.
26. As Khaled, I want longest-phrase matching unchanged on the filtered set, so that this Effort does not reopen [Prefer the longer Term hint phrase](../term-hint-longest-phrase/spec.md).
27. As Khaled, I want whole-word, case-insensitive matching, skip inside `code` / `pre` / links, empty Terms as a no-op, and the dotted underline in existing ink, so that Look and matching stay as shipped.
28. As Khaled, I want language parse unchanged, so that `**Name**:` / `- **Name** —` are still Terms and free bold is not.
29. As Khaled, I want Map list, Take prompt, Skip prompt, Archive, Load UX, Unresolved filter, and the Tickets outline unchanged, so that only overlay fuel and the inherited footer move.
30. As Khaled, I want Effort-local `CONTEXT.md` still not to be a Site, so that a map’s own glossary file does not join lineage.
31. As Khaled, I want the same overlay on the hosted origin and on Always-on, so that one `public/` tree does not grow two glossary behaviours.
32. As Khaled, I want a preview path that no Site contains to stay a silent no-op, so that missing lineage does not invent a Project-wide merge.
33. As Khaled, I want a parent longer phrase to still claim its span on a child preview unless the child also defines that longer phrase, so that inheritance is per phrase, not “child glossary replaces parent.”
34. As Khaled, I want no Site prompt on paste or preview, so that lineage is computed, not asked.

## Implementation Decisions

- **Product lock:** Overlay fuel is **Site lineage** ([ADR 0016](../../docs/adr/0016-term-hints-use-site-lineage.md)). Discovery stays the marker walk ([ADR 0010](../../docs/adr/0010-marker-walk-finds-sites.md)). Parse, longest-phrase matching, skip-inside-`code`, alias “Prefer **Term**,” same-Site collisions labeled by context, missing language a no-op, and dotted underline stay in [ADR 0006](../../docs/adr/0006-term-hints-from-language-files.md). Glossary **Site lineage**, **Term hint**, and **Paste preview** are already recorded; do not rewrite them. Do not restore Project-wide merge.
- **Containment:** A Site contains a previewed POSIX path when its `rel` is `.`, or the path equals `rel`, or the path starts with `rel` + `/`. Not a raw string prefix. Owning Site = containing Site with the longest `rel` (`.` is shortest). Site lineage = every containing Site, closest owner first, Project root last. Walk up only. Descendants, siblings, and cousins never join.
- **Per-phrase cascade:** For each glossary phrase (Term or `_Avoid_` alias, case-insensitive), keep records from the closest Site in that lineage that defines it. A silent child falls through. A child alias for a phrase shadows a parent Term for that same phrase. Same-Site collisions still list both. Parallel Sites never meet. Then call the existing matching function on that filtered set.
- **Payload:** Load still discovers every Site and still returns every `terms` record. Each term carries that Site’s `rel` (and keep `path` identity on the language row; never key overlay by `contextName`). The client keeps the Site list (`rel`, `title`) already used for titles. If Always-on’s payload lacks that Site list, add `rel` + `title` only — do not change Load UX, Directory handle vs Project path, or the Context tab. Overlay filters; browse does not.
- **Paste:** A Paste preview has no path. Compute lineage from the current Map list selection (`selectedRelPath`), including Load’s auto-select. Live at Show, not snapshotted at Compose. No selection this Load → root Site only (`.`); if the Project root is not a Site, empty lineage → silent no-op. Term hints stay on. No Site prompt.
- **Card:** Singleton local Term = today’s titled slip. When the winning Site is not the owner, a hairline footer: `Inherited from {title}` (title at read time; identity stays `rel`). Alias and same-Site collision cards follow the same rule. Prototype C is the lock; snippet from [prototypes/hint-card-site.js](prototypes/hint-card-site.js):

```
inherited = siteRel && siteRel !== owningRel
footer textContent = `Inherited from ${siteTitle}`
```

Pixel weight / uppercase / fade of that footer can match the prototype hairline; do not reopen Look beyond shipping that footer.
- **Seam:** Export one overlay-fuel function from the Term hint module: given Site records (`rel`, `title`), Term records (each with `rel`), and a preview path (empty string = no selection), return the filtered Term records and the owning Site `rel` (empty when lineage is empty). File preview and Paste Show both call it, then the existing matcher, then wrap as today. Lodash for arrays and objects.
- **Unchanged:** language parse, Map list chrome, Skip, Take, Archive, Unresolved filter, Stack, port 5420, hosted vs Always-on split, longest-phrase matching itself.

## Testing Decisions

A good test is external behaviour of **which Term records survive for a preview path**: given Sites, Term records with `rel`, and a path, the overlay-fuel function returns only lineage records after per-phrase closest-Site cascade, plus the owning `rel`. Tests do not inspect walk order, regex, GFM, or DOM. They do not drive the browser or hover.

That is the **one seam** — the overlay-fuel function on the Term hint module. Node already imports client ESM (Term hint matching tests). Add tests against that function. Do not add a browser harness. Do not make matching tests prove lineage. Extend existing Load/term-shape assertions only so each term carries `rel` (payload contract, not a second product seam).

What that seam must show:

- Path `apps/billing/docs/adr/0001.md` with Sites at `.`, `apps/billing`, `apps/shipping`: billing + root records; no shipping.
- Path `apps/billing/CONTEXT.md`: same lineage; still not shipping.
- Root `CONTEXT.md` or a root ADR: root records only; no child Site.
- Sites at `apps` and `apps/billing`: owning `apps/billing`; records from billing, `apps`, and `.`.
- Site `apps/billing` does not contain `apps/billing-extra/…`.
- Billing Site has no local terms: ancestor records remain; owning rel is still billing.
- Two root records for the same Term (different `contextName`, same `rel`): both survive.
- Two Sites titled “Billing” with different `rel`: overlay never merges them by title.
- Child silent on a phrase: parent record for that phrase survives.
- Child alias for a phrase the parent defines as a Term: child alias survives; parent Term for that phrase does not.
- Child **Affiliate** and parent **Affiliate program**: both records survive (different phrases).
- Empty path (Paste, no selection): root Site only; if `.` is not a Site, empty fuel.
- Empty Sites / empty terms: empty fuel (silent no-op).

Inherited footer, skip-inside-`code`, and “do not stitch across `<strong>`” are HITL against a loaded preview (billing ADR with an inherited **Site**, a local **Invoice**, a shipping phrase that must not underline, Paste after clicking shipping). No browser test harness in this spec.

Prior art: Term hint matching tests that import client ESM under `node:test`. Prefer that shape.

## Out of Scope

- Changing how agents or the domain-modeling skill load nested `CONTEXT.md` files.
- Restyling the **Context tab** as a filesystem tree.
- Walking down to descendant Sites, or using CONTEXT-MAP Relationships as the tree.
- Changing Take prompt, Skip prompt, Archive, Load UX, Unresolved filter, or the Tickets outline.
- Changing longest-phrase matching itself.
- A second Term hint module, a Site picker, or disabling hints on Paste.
- Safari / Firefox support; GitHub-hosted maps.

## Further Notes

- Map: [Scope Term hints to the previewed Site’s lineage](map.md). Decisions: [How a previewed file’s Site lineage is computed](issues/01-how-a-previewed-files-site-lineage-is-computed.md), [What language a Paste preview uses](issues/02-what-language-a-paste-preview-uses.md), [How the hint card shows which Site supplied the Term](issues/03-how-the-hint-card-shows-which-site-supplied-the-term.md), [Record lineage Term hints in CONTEXT and the ADR](issues/04-record-lineage-term-hints-in-context-and-the-adr.md).
- Prototype (throwaway): [prototypes/hint-card-site.js](prototypes/hint-card-site.js). Winning card is **C**. The prototype’s grouping by Term name is not the lock — cascade is per phrase.
- Sibling: longest-phrase still runs on the filtered set; this spec supersedes its cross-Site collision cards.
- HITL: Load this repo (or a stub with `.`, `apps/billing`, `apps/shipping`). Preview a billing ADR; hover a local Term, an inherited Term, and a shipping phrase. Paste, then click shipping and restore Paste.
- Phillip implements app code. Lodash for arrays and objects.
