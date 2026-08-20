# ADR 0006 — Term hints from language files

Status: accepted. Overlay fuel amended by [ADR 0016](0016-term-hints-use-site-lineage.md).

The GFM preview shows **Term hints**: hover a **Term** from the previewed file’s **Site lineage** and see its definition. Language files appear on the **Map list**. Discovery of those files is the Site marker walk in [ADR 0010](0010-marker-walk-finds-sites.md) (this ADR no longer uses a Context map as the allowlist). Paths must stay inside the Project, and must not be reached via `..` or a symlink out.

Parse `## Language` and `## Glossary` (stop at the next `##`). A Term is a `**Name**:` block or a `- **Name** —` list item, not free bold. Match whole words, case-insensitive, skip `code` / `pre` / URLs. When two glossary phrases overlap, the longer one claims the span; whitespace between words of a multi-word Term or alias in the same paragraph still matches. `_Avoid_` aliases hint “Prefer **Term**.” Overlay fuel is **Site lineage** ([ADR 0016](0016-term-hints-use-site-lineage.md)); same-Site collisions still list both, labeled by context. Missing language is a silent no-op. Dotted underline in existing ink; hover only; no color change.

This is the named hole in ADR 0002. Rejected: serving any path under the Project; hiding language so it exists only as silent overlay fuel.
