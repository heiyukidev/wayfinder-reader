# 01: Copy a Take prompt for a Frontier Ticket

**What to build:** Khaled previews a **Frontier** Ticket on the **Map list** and copies a **Take prompt** for that Ticket only: skill commands from its Type, the Ticket preamble, Project path, Map title if the Effort has a Map, Ticket title, and relative path. Claimed, blocked, and resolved Tickets are not takeable. **Skip prompt** checkboxes and speech stay as they are. The Reader still does not write the **Project**.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] Project load puts `take` on each Ticket: ordered skill commands when Frontier, null when claimed, blocked, or resolved
- [x] Frontier `research` / `prototype` / `grilling` / `task` map to `/wayfinder` plus `/research`, `/prototype`, `/grill-with-docs`, or `/wayfinder` alone; any other Frontier Type is `/implement` only; matching is case-insensitive
- [x] Copy Take prompt appears only while the previewed row is a takeable Ticket; it copies that one Ticket and never writes Status or Answers
- [x] Copied text is command lines, then “Take this Ticket in this session. Claim it. Resolve it (Answer, Status: resolved, Decisions pointer on the Map if one exists).” for wayfinder Types, or “Take this Ticket in this session. Build only this Ticket. Mark it as resolved (Answer, Status: resolved).” for `/implement`; then `Project:`, optional `Map:`, `Ticket:`, `Path:`
- [x] Skip prompt selection, preamble, and claimed/blocked checkboxes are unchanged; Copy Skip prompt still shows from checks even when Take is hidden

## Answer

Project load (`buildReadableTree` / `projectPayload`) now puts `take` on every Ticket: `{ commands: string[] }` when Frontier, `null` when claimed, blocked, resolved, or in a cycle. Specs are unchanged (ticket 02).

Command mapping (Type already lowercased in parse; lookup is also case-insensitive):

- `research` → `['/wayfinder', '/research']`
- `prototype` → `['/wayfinder', '/prototype']`
- `grilling` → `['/wayfinder', '/grill-with-docs']`
- `task` → `['/wayfinder']`
- any other takeable Ticket → `['/implement']`

Copy Take prompt sits next to Copy Skip prompt. `#map-actions` shows when Skip has a selection **or** the previewed row’s `ticket.take` is non-null. Each button hides independently. Clipboard is client-only from `take.commands`; no write endpoint.

`npm test`: 36 passed.

HITL: Copy Take visibility on Frontier vs claimed/blocked/resolved/map/spec rows; both buttons when a Frontier Ticket is previewed and other Tickets are checked; full clipboard string (commands, preamble, Project, optional Map, Ticket, Path); Copied status.
