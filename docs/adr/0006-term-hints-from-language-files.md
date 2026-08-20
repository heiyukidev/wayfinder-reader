# ADR 0006 — Term hints from language files

Status: accepted

The GFM preview shows **Term hints**: hover a **Term** from the chosen **Project**’s language and see its definition. The Always-on server may read only these files outside `.scratch/`: Project-root `CONTEXT.md`, Project-root `CONTEXT-MAP.md`, and paths listed in that map whose basename is `CONTEXT.md`, that stay inside the Project, and that are not reached via `..` or a symlink out. They appear on the **Map list**. They are not a walk of the repo.

Parse `## Language` and `## Glossary` (stop at the next `##`). A Term is a `**Name**:` block or a `- **Name** —` list item, not free bold. Match whole words, case-insensitive, skip `code` / `pre` / URLs. When two glossary phrases overlap, the longer one claims the span; whitespace between words of a multi-word Term or alias in the same paragraph still matches. `_Avoid_` aliases hint “Prefer **Term**.” Several CONTEXT files merge; a collision shows both definitions, labeled by context. Missing language is a silent no-op. Dotted underline in existing ink; hover only; no color change.

This is the named hole in ADR 0002. Rejected: serving any path under the Project; hiding language so it exists only as silent overlay fuel.
