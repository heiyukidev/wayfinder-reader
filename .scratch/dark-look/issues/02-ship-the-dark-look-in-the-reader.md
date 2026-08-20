# Ship the dark Look in the Reader

Type: task
Status: resolved
Blocked by: 01

## Question

Nothing left to decide — fold the signed-off dark desk from [What does the dark reading desk look like](01-what-does-the-dark-reading-desk-look-like.md) into `public/` so hosted and **Always-on** both show it, and rewrite glossary **Look** in `CONTEXT.md`.

Replace the light `:root` tokens and the hardcoded light leftovers (`#fff` on inputs/selects, light ink washes). Set `color-scheme: dark`. **Term hints** stay dotted in existing ink; the slip uses the new paper/ink. **Paste preview** composer stays paper-not-card. Stack, layout, fonts, Load/Archive/Take/Skip behaviour, and the hosted vs Always-on split stay.

No ADR. No selector. No light stylesheet left behind.

## Answer

Folded **A (Desk invert)** into `public/styles.css`. `:root` is the night desk; `color-scheme: dark` on `html`; path/Recents use `--color-control`; Load fill stays Chart Navy with `--color-load-ink`; on-dark strokes use `--color-accent-ink`. Glossary **Look** rewritten in `CONTEXT.md`. DESIGN.md register is this dark desk.

## Comments
