# Visual polish of Term hints

Type: prototype
Status: resolved
Blocked by: 02, 03

**What to build:** Language rows, Spec rows, and **Term hints** keep the same behaviour and look like the reading desk: stone **Map list**, paper GFM, dotted underline in existing ink, hover chrome in Source Sans 3. Copy is still not a second navy Load.

- [x] Language and Spec rows match shipped Map/Ticket chrome (stone sidebar, Source Sans 3)
- [x] Term hints stay dotted, same ink, hover-only; long definitions do not blow the preview layout
- [x] Stack, Skip prompt, and allowlist are unchanged
- [x] Khaled signs off the look, or says the stub is good enough to stop

## Answer

**B (Kind marks)** with a titled paper slip.

Context is a flat list: each language, ADR, and Out-of-scope row keeps title + path and carries a kind mark; section headings are gone. Nested Spec is a heading with a Spec mark, not a ticket-row. Term hints stay a dotted underline in the existing ink; hover (or focus) opens a paper slip titled with the Term (or Prefer) that fades long definitions instead of covering the GFM column. Copy stays outline navy. Rejected: A (Matched chrome) still mixed Spec into ticket-row chrome; C (Quiet gutter) reserved a blank column.

Folded into `public/app.js`, `public/term-hints.js`, and `public/styles.css`. Variants as primary source: [prototypes/visual-polish-variants.js](../prototypes/visual-polish-variants.js).

## Comments

Prototype is on the live Reader (`?variant=`). Always-on last Project is this repo. Hover **Reader**, **Map list**, **Skip prompt**, or an `_Avoid_` alias like **folder**. Open Context for Language rows; Tickets for a nested Spec (term-hints has one).

- [A Matched chrome](http://127.0.0.1:5420/?variant=A) — Language/ADR as Map headings (title + path); nested Spec as a ticket-row (title + `spec` meta); compact chrome card with inner scroll
- [B Kind marks](http://127.0.0.1:5420/?variant=B) — Context is a flat list with a kind mark on every row; nested Spec is a heading with a Spec mark; titled paper slip that fades long definitions
- [C Quiet gutter](http://127.0.0.1:5420/?variant=C) — title-only rows (section heading is the kind); nested Spec is a quiet indent; hint lives in a sticky gutter so long defs never cover the column

Arrow keys and the bottom bar cycle. Copy stays outline navy. Stack / Skip prompt / allowlist unchanged.
