# 02: Record longest-phrase matching on Term hint

**What to build:** The glossary **Term hint** entry says that overlapping phrases take the longer span, so a later session does not “fix” matching back to first-listed. The existing Term-hint ADR matching sentence is amended with that rule (whole-word is no longer the only lock), including that same-paragraph whitespace between words of a multi-word Term or alias still matches. No new ADR.

**Blocked by:** 01 Longer Term hint phrase claims the span

**Status:** resolved

- [x] Glossary **Term hint** states that when two glossary phrases overlap, the longer one is the hint
- [x] ADR 0006 matching lock includes longest-span (and same-paragraph whitespace) in place; no second Term-hint ADR

## Answer

Longest-phrase matching is recorded on **Term hint** and in the existing matching lock. No new ADR.

- Glossary: **Term hint** in [`CONTEXT.md`](../../../CONTEXT.md) — “When two glossary phrases overlap, the longer one is the hint.”
- Matching lock: [ADR 0006](../../../docs/adr/0006-term-hints-from-language-files.md) — whole-word, case-insensitive, skip `code` / `pre` / URLs, plus longest-span and same-paragraph whitespace between words of a multi-word Term or alias.
