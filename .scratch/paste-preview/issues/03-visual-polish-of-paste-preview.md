# Visual polish of Paste preview

Type: prototype
Status: resolved
Blocked by: 02

**What to build:** The **Paste preview** control, composer, and rendered GFM fit the reading desk: warm paper preview, stone **Map list**, navy Load. **Term hints** stay dotted in existing ink. Copy prompts stay outline navy, not a second Load.

- [x] Paste chrome matches shipped preview/header (Source Sans 3), not a second navy Load
- [x] Term hints, Take/Skip, Map list selection, and Load-clears-buffer behaviour from [Ship Paste preview in the Reader](02-ship-paste-preview-in-the-reader.md) stay
- [x] Stack, Look, hosted origin, and **Always-on** stay
- [x] Khaled signs off the look, or says the stub is good enough to stop

## Answer

**A (Matched chrome).**

Paste is the Skip/Take twin: outline navy, Source Sans 3, pressed wash. Compose / Show are caption text, not boxed controls. Composer sits on the warm paper (no white card, no mono costume); Show stays Source Serif 4 with dotted **Term hints**. Load stays the one filled navy action.

Rejected: **B (Draft sheet)** turns Compose into a ruled pad that fights the paper. **C (Mode in the title)** hides Compose / Show behind a caption click.

Folded into `public/styles.css`. Variants as primary source: [prototypes/visual-polish.js](../prototypes/visual-polish.js). Run `npm run prototype:paste-preview` → http://127.0.0.1:5422/polish?variant=A

## Comments

- Prototype (throwaway): `.scratch/paste-preview/prototypes/visual-polish.html`. Occupancy stays caption toggle.
- [A Matched chrome](http://127.0.0.1:5422/polish?variant=A) — quiet caption; paper composer in Source Sans 3
- [B Draft sheet](http://127.0.0.1:5422/polish?variant=B) — segmented Compose/Show; serif ruled draft
- [C Mode in the title](http://127.0.0.1:5422/polish?variant=C) — caption click cycles compose/show; composer matches the GFM column
