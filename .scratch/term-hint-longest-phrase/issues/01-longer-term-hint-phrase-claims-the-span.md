# 01: Longer Term hint phrase claims the span

**What to build:** On the GFM preview, a longer glossary phrase takes the **Term hint** whenever it matches. A shorter **Term** or alias still hints where it stands alone, including after a longer match. Extra spaces, tabs, or a line break between the words in the same paragraph still count as that phrase. The overlay does not invent combinations that are not a Term or alias, does not stitch a phrase across inline markup or across paragraphs, and does not nest a hint inside another. Hover follows the winning phrase (definition, Prefer **Term**, or a collision labeled by context). Whole-word, case-insensitive, skip `code` / `pre` / links, empty Terms as a no-op, and the dotted underline in existing ink stay as they are. Same overlay on the hosted origin and on **Always-on**. Language parse, **Map list**, Load, **Archive**, **Skip prompt**, **Take prompt**, and the **Unresolved filter** do not move.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] A string with a longer glossary phrase that has a shorter glossary phrase as a prefix or inner word yields one match: the longer phrase, whether that longer phrase is a Term or an `_Avoid_` alias
- [ ] The shorter phrase still matches where it stands alone, and still matches after a longer match when it sits outside the claimed span
- [ ] Extra spaces, a tab, or a newline between the words of a longer phrase still yield the longer match, not the shorter prefix; a hyphenated form that is not the glossary spelling misses; punctuation after a longer phrase leaves the match intact
- [ ] Two adjacent short Terms that are not themselves a glossary phrase yield two short matches, not a synthetic long one
- [ ] Whole-word still holds; matching stays case-insensitive; leftmost longest wins when two phrases overlap without one containing the other; empty Terms yield no matches
- [ ] Tests cover that matching function on the Term hint module (ordered non-overlapping matches: matched text, index, winning phrase / model). They do not inspect regex source, drive the browser, or re-parse language documents
- [ ] HITL: Load a Project whose language has both a short Term and a longer phrase that contains it; a wrapped paragraph takes the long span; a sentence with only the short Term still hints; hover shows one card for the long span; collisions still list both context-labeled definitions; skip inside `code`, `pre`, and links is unchanged; `**affiliate** program` stays two text nodes
