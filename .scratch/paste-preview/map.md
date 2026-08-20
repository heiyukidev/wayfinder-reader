# Paste markdown into the preview and see Term hints

## Destination

After a **Project** is Loaded, Khaled can paste markdown (a copied agent chat or any GFM) into the preview. It renders with that Project’s **Term hints**. The paste is session-only. The **Reader** still never writes the **Project**. Same page on hosted and **Always-on**.

## Notes

- Domain: the **Reader**. Glossary: `CONTEXT.md`. Term hints stay [ADR 0006](../../docs/adr/0006-term-hints-from-language-files.md). Hosted still does not write ([ADR 0013](../../docs/adr/0013-hosted-reader-does-not-archive.md)).
- Skills: `/wayfinder` for this map; grilling + domain-modeling on HITL tickets; `/prototype` on prototype tickets; `/impeccable` on polish; Lodash for arrays/objects.
- Tracker: local markdown under `.scratch/paste-preview/` (see Wayfinding operations in `docs/agents/issue-tracker.md`).
- Standing: **carry execution into the map.** Destination is the working **Paste preview**, not a spec-only handoff.
- Autopilot locks (object with a named failure mode):
  - **Paste preview** is the name. Not a **Map list** row, not a third tab, not an **Effort**.
  - Explicit Paste control. Do not hijack global paste. Disabled until a **Project** is Loaded.
  - Markdown source in a textarea; render through the same GFM + `applyTermHints` path as file preview. No Cursor/Slack/ChatGPT parser.
  - One buffer in memory. Lost on refresh. Cleared on Load (including switching Projects).
  - Clicking a **Map list** row shows that file. The buffer stays; the control restores it. **Take prompt** and **Skip prompt** stay tied to **Map list** selection (`selectedRelPath`), not to the pane contents.
  - Relative links in pasted GFM do not resolve against the Readable tree (no file base path). `http(s)` opens in a new tab. Heading hashes may scroll the paste.
  - **Term hints** unchanged: dotted underline, hover, no color change. Same merged language as file preview.
  - One **Reader**, both versions, same `public/`. No write, no **Archive**, no IndexedDB for the buffer.

## Decisions so far

- [How a Paste preview occupies the preview pane](issues/01-how-a-paste-preview-occupies-the-preview-pane.md): **A** — Paste in the caption; exclusive file-or-paste pane; Compose / Show; caption `Paste preview`. Prototype: [prototypes/occupy-preview.js](prototypes/occupy-preview.js).
- [Ship Paste preview in the Reader](issues/02-ship-paste-preview-in-the-reader.md): Caption toggle in `public/`; same GFM + Term hints; memory buffer; Load clears; Map list click leaves and Paste restores.
- [Visual polish of Paste preview](issues/03-visual-polish-of-paste-preview.md): **A** — Paste matches Skip/Take; Compose/Show are caption text; composer is paper, not a white mono card. Prototype: [prototypes/visual-polish.js](prototypes/visual-polish.js).

## Not yet specified


## Out of scope

- Writing the paste into the **Project** or `.scratch/`.
- Parsing Cursor, Slack, or ChatGPT exports as first-class formats.
- Changing **Term hint** look or matching rules.
- A history of pastes; persist across refresh.
- Hijacking `Cmd+V` / `navigator.clipboard.readText` as the only entry.
- Safari and Firefox as supported browsers.
- The **Reader** claiming or resolving **Tickets**.
