# Show language, Specs, and Term hints

## Destination

The **Reader** on port **5420** lists language documents and **Specs** on the **Map list**, and shows **Term hints** on the GFM preview. Ticket outline and **Skip prompt** stay as shipped. The Reader still never writes the **Project**.

## Notes

- Domain: local read-only map viewer. Glossary: `CONTEXT.md`. Locks: [ADR 0005](../../docs/adr/0005-map-list-replaces-files-view.md), [ADR 0006](../../docs/adr/0006-term-hints-from-language-files.md). Spec: [spec.md](spec.md).
- Skills: `/wayfinder` for this map; `/grill-with-docs` on HITL tickets; `/impeccable` on polish; Phillip implements builds (user rule: do not write app code in the wayfinding agent). Lodash for arrays/objects.
- Tracker: local markdown under `.scratch/term-hints/` (see Wayfinding operations in `docs/agents/issue-tracker.md`).
- Standing: **carry execution into the map.** Destination is running software on 5420.
- Parent [See which Ticket blocks which, and skip-grill from the Reader](../decisions-view/map.md) shipped the **Map list** outline and **Skip prompt**. This Effort does not restore Files view.
- Autopilot locks (object with a named failure mode):
  - Same **Stack**, **Look**, port **5420**, read-only Reader, **Skip prompt** speech and behavior unchanged.
  - Language files are the named hole in ADR 0002: root `CONTEXT.md`, root `CONTEXT-MAP.md`, mapped `CONTEXT.md` paths that stay inside the Project. Never `src/`, `.env`, `node_modules`. Missing language is a silent no-op.
  - Parse `## Language` and `## Glossary` only. A **Term** is `**Name**:` or `- **Name** —`, not free bold. Whole-word, case-insensitive; skip `code` / `pre` / URLs. `_Avoid_` aliases hint “Prefer **Term**.” Collisions show both definitions, labeled by context. Dotted underline in existing ink; hover only; no color change.
  - **Map list** chrome: two tabs. **Context** is language documents, then **ADRs**, then **Out-of-scope records**. **Tickets** is the shipped Effort outline (**Map**, **Spec** if present, **Tickets**). Spec-only siblings are Spec rows with no Map. Default tab on Load is Tickets.
  - Example Projects: this repo; `Desktop/js/sealbox`; `Desktop/js/dnd-heiyuki`; `Desktop/js/karine.so` (CONTEXT-MAP).

## Decisions so far

- [Serve language files, Specs, and Terms](issues/01-serve-language-files-specs-and-terms.md) — Project load returns sandboxed `language`, `terms`, and `specOnly`; `/api/file` serves those language paths and still 403s the rest of the Project.
- [Show language and Specs on the Map list](issues/02-show-language-and-specs-on-the-map-list.md) — Map list is **Context** (language, ADRs, Out-of-scope records) and **Tickets** (usual Effort outline). Prototype variants: [prototypes/map-list-variants.js](prototypes/map-list-variants.js).
- [Term hints on the preview](issues/03-term-hints-on-the-preview.md) — After GFM parse, whole-word Term hints (and `_Avoid_` aliases) get a dotted underline; hover is a paper card that renders the definition as GFM. Prototype **B**. Variants: [prototypes/term-hints-variants.js](prototypes/term-hints-variants.js).
- [Visual polish of Term hints](issues/04-visual-polish-of-term-hints.md) — Context rows carry a kind mark (no section headings); nested Spec is a heading with a Spec mark; Term-hint hover is a titled paper slip that fades long definitions. Prototype **B**. Variants: [prototypes/visual-polish-variants.js](prototypes/visual-polish-variants.js).

## Not yet specified

## Out of scope

- Restoring Files view or a Files / Decisions toggle.
- A blocking-edge graph canvas.
- The Reader writing, claiming, or resolving Tickets.
- Live-reload; search; more than one Project at once.
- GitHub / GitLab hosted maps.
- Serving any Project path that is not a **Map list** row, an in-`.scratch/` preview-link target, or an ADR 0006 language file.
- Changing Always-on, Project picker, or port 5420.
