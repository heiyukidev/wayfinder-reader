# 01: List Spec-only and Ticket-only Efforts, ADRs, and Out-of-scope records

**What to build:** After Load, the **Map list** includes every **Effort** that has a **Map** and/or a **Spec** and/or **Tickets** as one group. Title is the Map heading, else the Spec heading, else the folder name. Spec-only with zero Tickets is remaining work. **Finished** is at least one Ticket and every Ticket `Status: resolved` — not checkboxes, Spec status, fog, research, or prototypes. `.scratch/.archive/` and folders with none of those artifacts stay out. **ADRs** and **Out-of-scope records** are rows; click previews GFM; missing directories are a silent no-op. File fetch serves those listed paths and still refuses `package.json`, `.env`, and Archive paths. **Skip prompt** is unchanged.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] Map-only, Spec-only, Ticket-only, and Spec-plus-Tickets-without-Map each appear as one Effort group; a folder with none of those does not
- [x] Spec-only with zero Tickets is not Finished; a group with at least one Ticket and every Ticket `Status: resolved` is Finished; `ready-for-agent`, empty Status, claimed, and checked boxes are not resolved
- [x] `.scratch/.archive/` is absent from the outline; live Efforts still list
- [x] Load lists `docs/adr/` files and `.out-of-scope/` files when present, including a CONTEXT-MAP context’s `docs/adr/` still inside the Project; missing dirs are empty lists; escaping paths are skipped
- [x] File fetch allows those listed ADR and Out-of-scope paths and still 403s `package.json`, `.env`, and `.scratch/.archive/…`
- [x] Skip prompt checkboxes and copy are unchanged; language-row behaviour stays with the term-hints Effort

## Answer

Listing already shipped (`buildReadableTree` / `projectPayload`): Effort groups without a required Map, `finished` from Ticket `Status: resolved` only, Archive omitted, `adrs` / `outOfScope` named holes, and file fetch of those listed paths. `/api/project` and `/api/tree` share that outline. Map list rows (Context: language, ADRs, Out-of-scope; Tickets: Effort groups) and Skip prompt speech were already in `public/app.js`. Term-hints `language` / `terms` left alone.

HTTP seam gaps locked in `src/server.test.js`: empty Status is not `finished`; missing `docs/adr/` and `.out-of-scope/` are `[]` on both load routes; `.env` 403 alongside ADR/Out-of-scope serve; symlink-out ADR files and CONTEXT-MAP `..` hrefs are skipped and not fetchable.

`npm test`: 44 passed.

HITL: Map list groups for Map-only / Spec-only / Ticket-only / Spec+Tickets; ADR and Out-of-scope rows preview GFM; missing dirs omit the section; Skip prompt checkboxes and copy unchanged.
