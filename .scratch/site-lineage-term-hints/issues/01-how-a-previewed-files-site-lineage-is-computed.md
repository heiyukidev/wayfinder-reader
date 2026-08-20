# How a previewed file’s Site lineage is computed

Type: grilling
Status: resolved
Blocked by:

## Question

Given a previewed **Map list** path, which language documents feed **Term hints**?

Destination lock: the owning **Site** plus ancestor Sites (up only); closest phrase wins; siblings and cousins never contribute. This ticket writes that as a precise rule with examples, including identity (`rel` / path, not `contextName`) and fall-through when a child Site is silent on a Term.

Grill at least:

- File `apps/billing/docs/adr/0001.md` while Sites exist at `.` and `apps/billing` — billing + root, not `apps/shipping`.
- Previewing `apps/billing/CONTEXT.md` itself — billing is the owner, still inherits root, still not shipping.
- Previewing root `CONTEXT.md` or a root ADR — root language only, no children.
- Site at `apps` and at `apps/billing` — deepest prefix owns; both `apps` and `.` are ancestors of billing.
- A Site with `.scratch/` and no `CONTEXT.md` — owner has no local language; inherit ancestors only.
- Root `CONTEXT-MAP.md` plus root `CONTEXT.md` — same Site; same-Site collision rule, not lineage.
- Two Sites that share a display title — overlay must not merge them by `contextName`.

Do not restyle the **Context tab**. Do not implement. Recommended: deepest POSIX prefix Site, then every ancestor Site; per-phrase closest wins; Load still returns all `terms`, each carrying a Site `rel`.

## Answer

**Site lineage** of a previewed **Map list** path is the chain of **Sites** that **contain** that path, closest owner first, Project root last. **Term hints** use language documents from that chain only.

A Site contains a previewed POSIX path when its `rel` is `.`, or the path equals `rel`, or the path starts with `rel` + `/`. That is directory containment, not a raw string prefix: Site `apps/billing` does not contain `apps/billing-extra/…`.

- **Owning Site** = the containing Site with the longest `rel` (`.` is shortest). No containing Site → empty lineage → Term hints stay the existing silent no-op.
- **Site lineage** = every containing Site, closest to farthest. Same as walking parent directories and keeping only Sites. Descendants, siblings, and cousins never join.
- Overlay fuel = language documents Load already attached to those Sites (`CONTEXT.md`, and `CONTEXT-MAP.md` when that Site has one). Effort-local `CONTEXT.md` is not a Site.
- Identity = Site `rel` and language `path`, never `contextName`. Two Sites that share a display title stay distinct.
- Per-phrase cascade: for each glossary phrase (Term or `_Avoid_` alias, case-insensitive), keep records from the closest Site that defines it. A silent child falls through. A child alias for a phrase shadows a parent Term for that same phrase. Same-Site collisions (root `CONTEXT.md` plus `CONTEXT-MAP.md`) still list both, labeled by context. Parallel Sites never meet.
- Longest-phrase matching then runs on that filtered set, unchanged. A parent longer phrase (for example **Affiliate program**) still claims its span on a child preview unless the child Site also defines that longer phrase; a child shorter Term (**Affiliate**) does not steal the longer span.
- Load still discovers every Site and still returns every `terms` record; each carries that Site’s `rel`. The overlay filters. **Context tab** still lists every language document. Same rule on hosted origin and **Always-on**.

Examples:

- `apps/billing/docs/adr/0001.md` with Sites at `.` and `apps/billing` (and `apps/shipping`): billing + root; not shipping.
- `apps/billing/CONTEXT.md`: billing owns, still inherits root, still not shipping.
- Root `CONTEXT.md` or a root ADR: root language only; no children.
- Sites at `apps` and `apps/billing`: billing owns; lineage billing → `apps` → `.`.
- Billing Site is `.scratch/` only, no `CONTEXT.md`: inherit ancestors; billing adds no local language.
- Root `CONTEXT-MAP.md` plus root `CONTEXT.md`: same Site; collision rule, not lineage.
- Two Sites titled “Billing”: overlay never merges them by title.

Paste overlay is [What language a Paste preview uses](02-what-language-a-paste-preview-uses.md). Card chrome is [How the hint card shows which Site supplied the Term](03-how-the-hint-card-shows-which-site-supplied-the-term.md). Glossary and ADR write-up is [Record lineage Term hints in CONTEXT and the ADR](04-record-lineage-term-hints-in-context-and-the-adr.md).
