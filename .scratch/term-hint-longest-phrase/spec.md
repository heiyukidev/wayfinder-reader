# Prefer the longer Term hint phrase

Status: ready-for-agent

## Problem Statement

Khaled reads a Project whose language has both a short Term (for example **Affiliate**) and a longer Term or `_Avoid_` alias that contains it (for example **Affiliate program**). On the GFM preview, the short phrase sometimes takes the Term hint, so the longer phrase never underlines and its card never appears. That happens even though both phrases are already in the glossary. Line breaks or extra spaces between the words in the same paragraph make it worse: the long phrase misses, and the short one claims the first word.

## Solution

When applying **Term hints**, a longer glossary phrase claims its span whenever it matches. A shorter Term still hints where it stands alone. In the same paragraph, extra spaces or a line break between words still count as that phrase. The overlay does not invent combinations that are not a Term or alias, and it does not stitch a phrase across inline markup. Record the rule on **Term hint** in the glossary and in the existing Term-hint matching lock.

## User Stories

1. As Khaled, I want a longer glossary phrase to take the Term hint when a shorter glossary phrase sits inside it, so that **Affiliate program** is not stolen by **Affiliate**.
2. As Khaled, I want that rule to apply to canonical Terms, so that two named Terms compete by span length, not by which was listed first in the language file.
3. As Khaled, I want that rule to apply when the longer phrase is an `_Avoid_` alias, so that “Prefer **Term**” still wins over a shorter canonical word inside the alias.
4. As Khaled, I want that rule to apply when the shorter phrase is an alias and the longer one is a Term, so that the Term’s definition is what I hover.
5. As Khaled, I want a shorter Term to still hint when it appears on its own, so that a sentence with only **Affiliate** still shows that definition.
6. As Khaled, I want a shorter Term after a longer match to still hint if it is outside the claimed span, so that “join the affiliate program as an affiliate” underlines both phrases correctly.
7. As Khaled, I want matching to stay whole-word, so that **Affiliate** does not hint inside **Affiliates** or **affiliation**.
8. As Khaled, I want matching to stay case-insensitive, so that **Affiliate Program** in the preview matches **affiliate program** in the language.
9. As Khaled, I want extra spaces between words in the same paragraph to still match the longer phrase, so that “affiliate  program” is not reduced to **Affiliate**.
10. As Khaled, I want a line break between words in the same paragraph to still match the longer phrase, so that wrapped source markdown does not drop **Affiliate program**.
11. As Khaled, I want tabs or other whitespace between those words in the same paragraph to still match, so that the phrase is a sequence of words, not an exact space character.
12. As Khaled, I want a longer phrase not to match across separate paragraphs, so that the last word of one paragraph and the first word of the next are not glued into a Term.
13. As Khaled, I want a longer phrase not to match when the words are split across inline markup, so that `**affiliate** program` stays two text nodes and this Effort does not reparent the DOM.
14. As Khaled, I want adjacent short Terms that are not themselves a glossary phrase to stay separate hints, so that the Reader does not invent **Affiliate program** from **Affiliate** plus **Program**.
15. As Khaled, I want punctuation after a longer phrase to leave the hint intact, so that “affiliate program.” still takes the long span.
16. As Khaled, I want a hyphenated form that is not the glossary spelling to miss the long phrase, so that **affiliate-program** is not silently treated as **affiliate program**.
17. As Khaled, I want leftmost-longest when two phrases overlap without one containing the other, so that **New York** wins in “New York City” when **York City** is also a phrase.
18. As Khaled, I want no Term hint nested inside another, so that hovering the long span shows one card, not a stack of underlines.
19. As Khaled, I want collisions for the same winning phrase to keep showing both context-labeled definitions, so that longest-match does not pick a silent winner across Sites.
20. As Khaled, I want skip inside `code`, `pre`, and links unchanged, so that fences and URLs do not grow Term hints.
21. As Khaled, I want an empty Terms list to leave the preview unchanged, so that Projects without language stay a silent no-op.
22. As Khaled, I want Term hints to keep the dotted underline in existing ink, hover card, and no color change, so that this Effort does not reopen Look.
23. As Khaled, I want parse of language documents unchanged, so that `**Affiliate program**:` is still one Term and free bold is still not a Term.
24. As Khaled, I want Map list, Load, Archive, Skip prompt, Take prompt, and the Unresolved filter unchanged, so that only the overlay rule moves.
25. As Khaled, I want the same overlay on the hosted origin and on Always-on, so that I do not get two matching behaviours from one `public/` tree.
26. As Khaled, I want the glossary **Term hint** entry to say that overlapping phrases take the longer span, so that a later session does not “fix” it back to first-listed.
27. As Khaled, I want the existing Term-hint ADR matching sentence amended with that rule, so that whole-word is no longer the only lock.
28. As Khaled, I want no new ADR, so that this stays an amendment of matching, not a second overlay product.

## Implementation Decisions

- **Product lock:** Term hints stay the client overlay after GFM parse ([ADR 0006](../../docs/adr/0006-term-hints-from-language-files.md)). Whole-word, case-insensitive, skip `code` / `pre` / links, alias “Prefer **Term**,” collisions labeled by context, missing language a no-op, dotted underline in existing ink. This Effort amends that matching lock: when two glossary phrases overlap, the longer one claims the span. Same-paragraph whitespace (spaces, tabs, line breaks) between words of a multi-word Term or alias still matches. Do not invent phrases. Do not stitch across inline markup. Leftmost longest when overlap is not nested. No nested hints. Amend ADR 0006 in place; add one sentence to **Term hint** in the glossary. No new ADR.
- **Phrases:** only `term` and `aliases` already parsed from language documents. Length is the glossary phrase as written (character span), not a word-count contest. Matcher order stays longest-first so a prefix Term cannot consume the first word of a longer phrase.
- **Whitespace:** inside one text node, any whitespace run between the words of a glossary phrase matches the single spaces in that phrase. Separate block elements do not join. Hyphen versus space is not equivalent.
- **Overlay:** wrap claimed spans the way Term hints already wrap; skip already-hinted ancestors. Hover models (definition, prefer, collision) follow the winning phrase, not a shorter phrase inside it.
- **Seam:** export one matching function from the Term hint module: given Term records and a plain string, return the non-overlapping matches in document order (matched text, index, winning phrase / model identity). The overlay calls that function per text node. Lodash for arrays and objects.
- **Unchanged:** language parse, project load payload, Map list, Skip, Take, Archive, Stack, Look chrome, port 5420, hosted vs Always-on split.

## Testing Decisions

A good test is external behaviour of **which spans match**: given Term records and a plain string, the ordered non-overlapping matches are the longer glossary phrases where they occur, and the shorter phrases only where they stand alone. Tests do not inspect regex source, matcher sort keys, or how GFM splits the DOM. They do not drive the browser or hover.

That is the **one seam** — the matching function on the Term hint module. Node can already import client ESM (public walk tests). Add tests against that function; do not add a browser harness or a second parse of CONTEXT files.

What that seam must show:

- A string containing a longer phrase that has a shorter glossary phrase as a prefix or inner word yields one match: the longer phrase (Term or alias).
- The same shorter phrase standing alone still matches.
- Extra spaces or a newline between the words of a longer phrase still yield the longer match, not the shorter prefix.
- Two adjacent short Terms that are not themselves a glossary phrase yield two short matches, not a synthetic long one.
- Whole-word still holds (`affiliates` does not match `affiliate`).
- Case-insensitive still holds.
- Leftmost longest: overlapping non-nested phrases claim the leftmost longer span.
- Empty Terms yield no matches.

Skip-inside-`code`, hover cards, collisions in the card, and “do not stitch across `<strong>`” are HITL against a loaded preview. No browser test harness in this spec.

Prior art: public walk tests that import client ESM under `node:test`. Prefer that shape. Do not extend project-load tree tests; language parse is not the bug.

## Out of Scope

- Inventing Term hints from adjacent short Terms that are not a glossary phrase.
- Matching a phrase across inline markup or across paragraphs.
- Treating hyphen, camelCase, or stemming as the same phrase.
- Nested Term hints inside a longer span.
- Changing language parse, Map list, Load, Archive, Skip, Take, Unresolved filter, Stack, or Look.
- A new ADR, a second Term hint module, or a browser test harness.
- Safari / Firefox support; GitHub-hosted maps.

## Further Notes

- Glossary: [`CONTEXT.md`](../../CONTEXT.md). Lock: [ADR 0006](../../docs/adr/0006-term-hints-from-language-files.md), amended by this Effort.
- This Effort is Spec-only on purpose: one overlay rule, not a wayfinder map.
- HITL: Load a Project whose language has both **Affiliate** and **Affiliate program** (or the real pair that showed the bug). Preview a paragraph where the long phrase wraps across a line, and one where the short Term stands alone.
- Phillip implements app code. Lodash for arrays and objects.
