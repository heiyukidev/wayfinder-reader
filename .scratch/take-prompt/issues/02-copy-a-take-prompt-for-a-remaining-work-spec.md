# 02: Copy a Take prompt for a remaining-work Spec

**What to build:** Khaled previews a remaining-work **Spec** (that Effort has no Tickets) and copies a **Take prompt** that starts with `/to-tickets` and tells the session to publish Tickets without resolving the Spec. A Spec that already has Tickets is not takeable. Map headings, language documents, **ADRs**, and **Out-of-scope records** are not takeable.

**Blocked by:** 01 Copy a Take prompt for a Frontier Ticket

**Status:** resolved

- [x] A Spec with zero sibling Tickets has `take` commands `/to-tickets`; a Spec with sibling Tickets has `take` null
- [x] Previewing that Spec — including a Spec-only Effort heading that opens the Spec — shows Copy Take prompt; previewing a Map heading does not
- [x] Copied text starts with `/to-tickets`, then “Take this Spec in this session. Publish Tickets from it. Do not set Spec Status to resolved.”, then `Project:`, optional `Map:` only when the Effort has a Map, `Spec:`, `Path:`
- [x] Language documents, ADRs, and Out-of-scope records never offer Take; Ticket Take from 01 still works

## Answer

Project load (`buildReadableTree` / `projectPayload`) now puts `take` on each Spec pointer: `{ commands: ['/to-tickets'] }` when that Effort has zero Tickets; `null` when sibling Tickets exist (including claimed-only). Maps, language documents, ADRs, and Out-of-scope records never get a takeable `take`. Ticket `take` from 01 is unchanged. The browser does not re-derive commands.

Copy Take prompt uses the previewed path: Spec-only Effort headings already select `spec.path`, so Take appears without a nested spec row. Map headings select `group.path` (`map.md`) and stay hidden. Nested spec rows (Map + Spec) show Take only when `spec.take` is non-null. Spec clipboard uses a dedicated formatter (`/to-tickets` + Spec preamble, never the Ticket `/wayfinder`/`/implement` preambles). Skip is unchanged; no write endpoint; Spec Status is never set resolved.

`npm test`: 38 passed.

HITL: Spec-only heading vs Map heading vs nested spec row visibility; exact Spec clipboard (`/to-tickets`, Spec preamble, Project, optional Map, Spec, Path); ADRs / Out-of-scope / language docs never show Take; Ticket Take from 01 still copies wayfinder vs implement speech; Skip independent with shared Copied status.
