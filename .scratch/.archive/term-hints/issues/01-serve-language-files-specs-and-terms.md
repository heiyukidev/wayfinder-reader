# Serve language files, Specs, and Terms

Type: task
Status: resolved
Blocked by:

**What to build:** Project load returns sandboxed `language`, `terms`, Spec pointers on `decisions`, and `specOnly`. `/api/file` serves allowlisted language paths and still refuses the rest of the Project. The browser does not parse CONTEXT files. Tests on that seam. Do not render the new Map list rows or Term hints (tickets 02 and 03).

- [x] Root `CONTEXT.md` / `CONTEXT-MAP.md` + mapped `CONTEXT.md` (basename only, inside Project, no `..` or symlink out) appear on `language`; missing and illegal paths are omitted
- [x] `terms` parse `## Language` and `## Glossary` only (`**Name**:` and `- **Name** —`); `_Avoid_` fills aliases; collisions are separate records
- [x] Effort `spec.md` is `decisions[].spec`; spec-only siblings are `specOnly`; today’s ticket outline is unchanged
- [x] `GET /api/file` allows `language[].path` and existing `.scratch/` sandbox; `package.json` / `.env` / traversal stay 403
- [x] No language and no specs → empty arrays; existing project-load tests stay green

## Answer

Project load (`buildReadableTree` / `projectPayload`) now returns `language`, `terms`, and `specOnly` alongside the existing outline. The browser still does not parse CONTEXT files. Map list rows and Term hints are left to tickets 02 and 03.

- `language` is root `CONTEXT-MAP.md` (when present), then mapped `CONTEXT.md` files in map order (markdown links and table/backtick paths), then root `CONTEXT.md` if it exists and is not already listed. Missing files, basename ≠ `CONTEXT.md`, `..`, and symlinks out of the Project are omitted.
- `terms` parse only `## Language` and `## Glossary`. A Term is a `**Name**:` block or a `- **Name** —` list item. `_Avoid_` fills `avoid` / `aliases`. The same term from two files is two records, labeled by `contextName`.
- `decisions[].spec` is unchanged. `specOnly` is `{ title, path, folder }` for Effort groups that have a Spec and no Map. Remaining-work already lists those folders as Effort groups; [Show language and Specs on the Map list](02-show-language-and-specs-on-the-map-list.md) must not draw `specOnly` as a second copy of the same folders.
- `GET /api/file` serves `language[].path` the same way it serves ADRs and Out-of-scope records. `package.json`, `.env`, and `.scratch/../` stay 403.

`npm test`: 43 passed.

