# What does the dark reading desk look like

Type: prototype
Status: resolved
Blocked by:

## Question

What should the **Reader** look like as a dark translation of the signed-off reading desk?

Locks are on [Recast the Reader Look as a dark reading desk](../map.md): always dark, same fonts/spacing/chrome roles, one filled Load, no selector. Invoke `/prototype` and `/impeccable`. Cover the whole desk: header, **Map list**, GFM preview, **Paste preview** composer, **Term hint** slip, errors, empty, code, focus rings, native inputs/selects (today hardcoded `#fff`). `color-scheme: dark` on the page.

One dark translation to react to. Tight variants only if navy Load, hairlines, or muted ink fail contrast on dark paper — not a second world. Link the prototype as an asset. Do not ship into `public/` here.

Done when Khaled signs off the look, or says the take is good enough to stop.

## Answer

**A (Desk invert).**

Night desk: paper `#1c1917`, stone sidebar `#161310`, chrome `#12100e`, ink `#f4efe6`, muted `#b5ada0`, hairline `#3a3530`. Navy Load stays `#1e3a5f` — the signed-off fill, even though it recedes on dark paper. Native inputs/selects use a control token (`#241f1b`), not `#fff`. `color-scheme: dark` on the page. Term hints stay dotted in existing ink; the slip is paper. Paste composer stays paper-not-card.

Rejected: **B (Lifted Load)** brightens navy to `#4a6fa0` so the filled action holds; Khaled kept the original navy. **C (Stronger grain)** pushes hairlines and muted ink; A’s grain is enough.

**Impeccable polish (A):** Load fill still `#1e3a5f`. On-dark strokes, links, Skip/Take, Spec/Frontier marks, active tabs, caret, and the focus ring use `accent-ink` `#7a9cc4` (hover `#8eacd0`) so they meet contrast without lifting the filled action. Fold into `public/` on [Ship the dark Look in the Reader](02-ship-the-dark-look-in-the-reader.md).

Variants as primary source: [prototypes/dark-desk.js](../prototypes/dark-desk.js). Run `npm run prototype:dark-look` → http://127.0.0.1:5424/?variant=A&scene=preview

## Comments

- Prototype (throwaway): `.scratch/dark-look/prototypes/dark-desk.html`. Not shipped into `public/`.
- [A Desk invert](http://127.0.0.1:5424/?variant=A&scene=preview) — paper/ink swapped; navy Load fill stays; on-dark strokes use accent-ink `#7a9cc4`
- [B Lifted Load](http://127.0.0.1:5424/?variant=B&scene=preview) — navy `#4a6fa0`
- [C Stronger grain](http://127.0.0.1:5424/?variant=C&scene=preview) — A’s navy; heavier hairlines
