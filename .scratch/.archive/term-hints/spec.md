# Show language, Specs, and Term hints

Status: ready-for-agent

## Problem Statement

The **Reader** already shows a **Map list** of **Maps** and **Tickets**, with a **Skip prompt**. Khaled cannot open `CONTEXT.md` from that list, cannot see **Specs**, and gets no **Term hints** on the preview. Files view is gone, so those documents have no home.

## Solution

Extend project load and file preview so language documents and **Specs** are **Map list** rows, and the GFM preview overlays **Term hints**. Shape: [ADR 0005](../../docs/adr/0005-map-list-replaces-files-view.md), [ADR 0006](../../docs/adr/0006-term-hints-from-language-files.md). Glossary: [`CONTEXT.md`](../../CONTEXT.md). Skip prompt, ticket outline, Stack, Look, port 5420, and read-only stay as shipped.

## User Stories

1. As Khaled, I want language documents on the **Map list**, so that I can open `CONTEXT.md` without a file tree.
2. As Khaled, I want a Project with only root `CONTEXT.md` to list that file, so that single-context repos work.
3. As Khaled, I want a Project with `CONTEXT-MAP.md` to list the map and each mapped `CONTEXT.md` still inside the Project, so that karine.so is readable.
4. As Khaled, I want a mapped path that is missing, not named `CONTEXT.md`, leaves the Project, or is a symlink out, skipped, so that the allowlist cannot wander.
5. As Khaled, I want a Project with no language files to look as it does today, so that missing CONTEXT is a silent no-op.
6. As Khaled, I want clicking a language row to preview that file as GFM, so that I can read the glossary.
7. As Khaled, I want each Effort’s `spec.md` as a row under that Effort, so that a Map’s spec is next to its Tickets.
8. As Khaled, I want spec-only `.scratch/` siblings (no `map.md`) listed as Specs, so that dnd-heiyuki specs and sealbox `first-slice` are not invisible.
9. As Khaled, I want **Term hints** on preview text, so that a Term in a Map or Ticket shows its definition on hover.
10. As Khaled, I want `_Avoid_` aliases to hint “Prefer **Term**,” so that maps written in the wrong word still teach the glossary.
11. As Khaled, I want collisions (same Term, two CONTEXT files) to show both definitions labeled by context, so that I am not silently given the wrong language.
12. As Khaled, I want no hints inside `code`, `pre`, or links, so that paths and fences stay readable.
13. As Khaled, I want hints as a dotted underline in the existing ink, hover only, no color change, so that the reading desk does not speckle.
14. As Khaled, I want `/api/file` to serve language files on the allowlist and still 403 `package.json` and `.env`, so that Always-on does not serve the repo.
15. As Khaled, I want Skip prompt checkboxes and Copy unchanged, so that grilling paste still works.

## Implementation Decisions

- **Product lock:** ADR 0005 / ADR 0006. Do not restore Files view. Do not change Skip prompt speech.
- **Project-load payload:** keep `tree`, `maps`, `decisions`. Add `language` (ordered docs), `terms` (parsed Term records), and Spec pointers. Both `/api/project` and `/api/tree` return the same shape. No write endpoint. The browser does not parse CONTEXT files.
- **`language` shape:** `{ title, path, contextName }[]`. Paths are Project-relative POSIX (`CONTEXT.md`, `CONTEXT-MAP.md`, `apps/mobile/CONTEXT.md`). Title is the CONTEXT-MAP context name when known, else the file H1, else the basename. Order: root `CONTEXT-MAP.md` if present, then mapped CONTEXT files in map order, else the single root `CONTEXT.md`.
- **CONTEXT-MAP discovery:** from the root map file, collect markdown link hrefs and table/backtick paths whose basename is `CONTEXT.md`. Resolve relative to the Project root. Skip missing files, basename ≠ `CONTEXT.md`, `..`, symlink out of the Project. Always include the map file itself when it exists.
- **`terms` shape:** `{ term, definition, avoid, aliases, contextName }[]`. Parse only `## Language` and `## Glossary` (stop at the next `##`). A Term is a `**Name**:` block or a `- **Name** —` list item. Definition is the text until `_Avoid_` or the next Term; first paragraph is enough for the hint. `avoid` / `aliases` come from the `_Avoid_` line. `contextName` is that file’s language-row context name. Same `term` from two files → two records (collision). Lodash for lists and object access.
- **Specs:** on each `decisions` group, `spec: { title, path } | null` for that Effort’s `spec.md` when the file exists under `.scratch/`. Add `specOnly: { title, path, folder }[]` for `.scratch/<folder>/spec.md` whose folder is not a Map. Title from H1 else `spec.md`.
- **`/api/file`:** existing `.scratch/` sandbox unchanged. Also serve a path that exactly matches a `language[].path` for this Project (realpath inside Project, no `..`, no symlink out). Everything else stays 403.
- **Map list chrome:** a Language section first (no Skip checkboxes on those rows). Then existing Map groups, each showing Map row, Spec row if present, Tickets as today. Then spec-only groups (Spec row, no Tickets, not checkable). Row click previews GFM via `/api/file`.
- **Term hints:** after `marked.parse`, wrap whole-word case-insensitive matches of `term` and `aliases` in preview text nodes. Skip `code`, `pre`, `a`. Alias hint copy: `Prefer **Term**.` Canonical hint: definition; if several records share the term, show each `contextName: definition`. Dotted underline, existing ink, native or CSS hover — not a color change. Apply on Map, Ticket, Spec, and language previews.
- **Look / polish:** first stub can be unpolished; polish fits the reading desk and does not change Stack or Skip prompt.

## Testing Decisions

A good test is external behavior of **project load** and **file fetch**: given a temporary Project on disk, the payload’s `language`, `terms`, `decisions[].spec`, and `specOnly` match the files, and `/api/file` allows only those language paths plus `.scratch/`. Tests do not inspect how markdown is split internally. They do not drive the browser or hover.

That is the **one seam** — extend the existing project-load tests (temp directory). Do not add a second public parse surface.

What that seam must show:

- Root `CONTEXT.md` only → one language row and its Terms; no map file required for language.
- Root `CONTEXT-MAP.md` plus mapped CONTEXT files → map row + each mapped file; missing / non-`CONTEXT.md` / escaping paths omitted.
- `## Language` `**Term**:` blocks and `## Glossary` `- **Term** —` items both parse; Product locks headings do not; free bold is not a Term.
- `_Avoid_` fills `avoid` / `aliases`. Two files defining the same term yield two `terms` records with different `contextName`.
- Effort `spec.md` appears on that decisions group; a spec-only sibling appears in `specOnly` and not as a Map.
- No language / no specs → empty arrays; today’s `decisions` outline still matches.
- `GET /api/file?path=CONTEXT.md` succeeds when that file is on `language`; `package.json` and `.env` still 403; `.scratch/` traversal tests stay green.

Hint wrapping, hover chrome, and Map list order are HITL against the stub. No browser test harness in this spec.

## Out of Scope

- Restoring Files view; a graph canvas; any graph library.
- The Reader writing Tickets or CONTEXT files.
- Live-reload; search; GitHub / GitLab maps.
- Changing Always-on, Project picker, or port 5420.
- Serving the rest of the Project.
- Implementing a grilling session that consumes the Skip prompt.

## Further Notes

- Map: [Show language, Specs, and Term hints](map.md). Frontier: [Serve language files, Specs, and Terms](issues/01-serve-language-files-specs-and-terms.md), then [Show language and Specs on the Map list](issues/02-show-language-and-specs-on-the-map-list.md) and [Term hints on the preview](issues/03-term-hints-on-the-preview.md) in parallel, then [Visual polish of Term hints](issues/04-visual-polish-of-term-hints.md).
- Example Projects: this repo; `Desktop/js/sealbox`; `Desktop/js/dnd-heiyuki`; `Desktop/js/karine.so`.
- Phillip implements app code. Lodash for arrays and objects.
