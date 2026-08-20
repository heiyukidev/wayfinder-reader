# Term hints use Site lineage

Status: accepted

**Term hints** on a GFM preview use language from that file’s **Site lineage** only: the owning **Site** and its ancestor Sites (directory containment, walk up). The closest Site that defines a phrase (**Term** or `_Avoid_` alias) wins. Siblings, cousins, and descendants never contribute. Parallel Sites never meet in the overlay.

Load still discovers every Site and still returns every `terms` record (each carrying that Site’s `rel`). The overlay filters. The **Context tab** still lists every language document. Identity is Site `rel` / language `path`, not `contextName`. Effort-local `CONTEXT.md` is not a Site.

A **Paste preview** has no path; it borrows Site lineage from the current **Map list** selection. None this Load → root Site only (or the existing silent no-op if the Project root is not a Site). Never a Project-wide merge.

A singleton hint keeps today’s titled slip when the owning Site supplied the phrase. When the winner is a parent Site, a footer names it (`Inherited from {title}` at read time; identity stays `rel`). Same-Site collisions (one Site’s `CONTEXT.md` plus `CONTEXT-MAP.md`) still list both, labeled by context. Alias (“Prefer”) cards follow the same rule.

Longest-phrase matching runs on the filtered set, unchanged. Same rule on hosted origin and **Always-on**.

This amends [ADR 0006](0006-term-hints-from-language-files.md): it replaces “Several CONTEXT files merge; a collision shows both.” Discovery stays the marker walk in [ADR 0010](0010-marker-walk-finds-sites.md).

Rejected: Project-wide merge; owning-Site-only with no ancestor fall-through; walking down to descendants; using CONTEXT-MAP Relationships as the tree; merging overlay identity by `contextName`.
