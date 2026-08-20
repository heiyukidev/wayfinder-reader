# Recast the Reader Look as a dark reading desk

## Destination

The live **Reader** is a dark reading desk: same fonts, spacing, and chrome roles, recast in a dark register. Always dark. Hosted and **Always-on** share `public/`. Glossary **Look** rewritten. No selector.

## Notes

- Domain: the **Reader**. Glossary: `CONTEXT.md`. **Look** is the word; do not add Dark mode or Theme.
- Skills: `/wayfinder` for this map; grilling + domain-modeling on HITL tickets; `/prototype` and `/impeccable` on the look ticket; Lodash for arrays/objects.
- Tracker: local markdown under `.scratch/dark-look/` (see Wayfinding operations in `docs/agents/issue-tracker.md`).
- Standing: **carry execution into the map.** Destination is the working dark **Look**, not a spec-only handoff.
- Autopilot locks (object with a named failure mode):
  - One **Look**, always dark. No selector, no `prefers-color-scheme` branch, no unused light tokens.
  - Dark translation of the signed-off desk, not a new world: Source Serif 4 GFM, Source Sans 3 chrome, self-hosted fonts, one filled Load, stone **Map list**, paper preview. Register changes; roles do not.
  - Native controls get `color-scheme: dark`. Hardcoded light leftovers (`#fff` inputs/selects, light ink washes) become tokens.
  - **Term hints** stay a dotted underline in existing ink; the slip recasts in the same register. Matching rules unchanged.
  - **Paste preview** composer stays paper-not-card, same GFM column when shown.
  - Throwaway prototype, then ship. Do not iterate the locked light desk in `public/` until sign-off.
  - Rewrite glossary **Look** on ship. No ADR: a palette revert is cheap once CONTEXT is the lock.
  - One `public/`, both versions. Stack, layout, Load, Archive, Take/Skip, Map list behaviour, hosted vs Always-on split stay.

## Decisions so far

- [What does the dark reading desk look like](issues/01-what-does-the-dark-reading-desk-look-like.md): **A (Desk invert)** — paper `#1c1917`, ink `#f4efe6`, navy Load stays `#1e3a5f`. Impeccable polish: on-dark strokes use `accent-ink` `#7a9cc4`; Load fill unchanged.
- [Ship the dark Look in the Reader](issues/02-ship-the-dark-look-in-the-reader.md): `public/styles.css` is always dark; **Look** rewritten in `CONTEXT.md`.

## Not yet specified

## Out of scope

- A theme selector, OS-following second **Look**, or keeping light tokens “for revert.”
- Adding Dark mode or Theme to the glossary.
- A new visual world (cool OLED, different type, different chrome roles).
- Restyling other Efforts’ throwaway prototypes.
- Changing **Term hint** matching or behaviour; **Take prompt**, **Skip prompt**, Archive, Load, **Unresolved filter**, Stack.
- Safari and Firefox as supported browsers.
- A GitHub Pages deploy ticket (Pages follows whenever `public/` is pushed).
