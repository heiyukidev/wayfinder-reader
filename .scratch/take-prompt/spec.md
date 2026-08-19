# Copy a Take prompt from the Map list

Status: ready-for-agent

## Problem Statement

Khaled can copy a **Skip prompt** for Tickets he does not want to interview, but he has no paste for the next unit of work. For a **Spec** or a **Ticket**, he wants one clipboard string that names the right skills (`/wayfinder` plus type, `/to-tickets`, or `/implement`) so he can drop it into Cursor and have that session take the unit and, for a Ticket, mark it resolved. He does not want the **Reader** to write the **Project**, and he does not want a claimed Ticket to look takeable.

## Solution

Add a **Copy Take prompt** control next to **Copy Skip prompt**. When the previewed row is a remaining-work **Spec** (that Effort has no Tickets) or a **Frontier** Ticket, the control copies a **Take prompt**: skill command lines, a short preamble, then Project path, Map title if any, unit title, and relative path. Claimed Tickets stay marked claimed and are not takeable. Skip checkboxes and Skip speech stay as they are. The Reader only copies; the pasted session writes. Shape: [ADR 0009](../../docs/adr/0009-take-prompt.md). Glossary: [`CONTEXT.md`](../../CONTEXT.md). Skip lock: [ADR 0004](../../docs/adr/0004-decisions-view-and-skip-prompt.md).

## User Stories

1. As Khaled, I want a Copy Take prompt control, so that I can paste one unit of work into an agent session.
2. As Khaled, I want that control beside Copy Skip prompt, so that Skip and Take are two jobs on the same desk.
3. As Khaled, I want Copy Take prompt outlined like Skip, so that it is not a second filled navy Load.
4. As Khaled, I want Copy Take prompt to appear when the previewed row is takeable, so that I copy the thing I am reading.
5. As Khaled, I want Copy Take prompt hidden when the preview is not takeable, so that I cannot copy an empty or wrong Take.
6. As Khaled, I want Copy Skip prompt still to appear from checked Tickets even when Take is hidden, so that Skip does not depend on the preview.
7. As Khaled, I want both Copy controls available when a Frontier Ticket is previewed and other Tickets are checked, so that Skip multi-select and Take one-at-a-time do not fight.
8. As Khaled, I want clicking Copy Take prompt to put text on the clipboard, so that I can paste it into Cursor or another agent.
9. As Khaled, I want a Copied status after a successful Take copy, so that I know the clipboard changed.
10. As Khaled, I want Take copy never to write Ticket or Spec files, so that a misclick in the browser cannot close work.
11. As Khaled, I want a Frontier Ticket to be takeable, so that blockers-first work is what I paste.
12. As Khaled, I want a claimed Ticket not to be takeable, so that I do not start a second session on work already held.
13. As Khaled, I want a claimed Ticket still to show as claimed on the Map list, so that I can see why it is not takeable.
14. As Khaled, I want a blocked Ticket not to be takeable, so that I do not resolve out of order.
15. As Khaled, I want a resolved Ticket not to be takeable, so that I do not re-open finished work.
16. As Khaled, I want Skip checkboxes on claimed and blocked Tickets unchanged, so that I can still skip-grill work I will not interview.
17. As Khaled, I want a Spec in an Effort with zero Tickets to be takeable, so that remaining-work plans can be sliced.
18. As Khaled, I want a Spec in an Effort that already has Tickets not to be takeable, so that I do not re-run `/to-tickets` on a sliced plan.
19. As Khaled, I want clicking a Spec-only Effort heading (which previews that Spec) to count as previewing the Spec, so that Take appears without a second nested row.
20. As Khaled, I want clicking a Map heading not to make Take appear, so that I do not copy a Take for `map.md`.
21. As Khaled, I want language documents, ADRs, and Out-of-scope records never to be takeable, so that Take is only Specs and Tickets.
22. As Khaled, I want the first lines of a research Ticket Take to be `/wayfinder` then `/research`, so that the session maps and then investigates.
23. As Khaled, I want the first lines of a prototype Ticket Take to be `/wayfinder` then `/prototype`, so that the session maps and then raises fidelity.
24. As Khaled, I want the first lines of a grilling Ticket Take to be `/wayfinder` then `/grill-with-docs`, so that the session maps and interviews in this working directory.
25. As Khaled, I want the first line of a task Ticket Take to be `/wayfinder` only, so that I do not invent a `/task` skill.
26. As Khaled, I want a Spec Take’s first line to be `/to-tickets` only, so that I do not send a buildable plan back into mapping.
27. As Khaled, I want a Frontier Ticket with no wayfinder Type (or an unknown Type) to start with `/implement` only, so that `/to-tickets` slices and triage-ready files build instead of remap.
28. As Khaled, I want Type matching to be case-insensitive on the four wayfinder types, so that `Research` and `research` take the same flow.
29. As Khaled, I want `/grill-me`, `/tdd`, `/handoff`, `/impeccable`, `/wizard`, and `/clear` absent from the clipboard, so that the paste is the flow entry, not every nested skill.
30. As Khaled, I want Map Notes extras left to the pasted `/wayfinder` session, so that the Reader does not bake per-Effort skills into Take.
31. As Khaled, I want each skill command on its own line at the top, so that Cursor attaches them as slash commands.
32. As Khaled, I want a blank line after the command lines, then the preamble, so that commands stay separable from speech.
33. As Khaled, I want a wayfinder Ticket preamble to be exactly: “Take this Ticket in this session. Claim it. Resolve it (Answer, Status: resolved, Decisions pointer on the Map if one exists).” so that one-ticket resolve is explicit.
34. As Khaled, I want an implement Ticket preamble to be exactly: “Take this Ticket in this session. Build only this Ticket. Mark it as resolved (Answer, Status: resolved).” so that `/implement` still closes the tracker file.
35. As Khaled, I want a Spec preamble to be exactly: “Take this Spec in this session. Publish Tickets from it. Do not set Spec Status to resolved.” so that slicing does not fake Finished.
36. As Khaled, I want the copied text to include `Project:` and the absolute Project path, so that the pasted session can find the files.
37. As Khaled, I want `Map:` and the Map title included when the Effort has a Map, so that wayfinder sessions can load the index by name.
38. As Khaled, I want the Map line omitted when the Effort has no Map, so that Spec-only and Ticket-only folders are not given a fake Map.
39. As Khaled, I want `Ticket:` or `Spec:` with the document title, so that I see the name before I paste.
40. As Khaled, I want `Path:` with the Project-relative path, so that the session can fetch the file without a body dump.
41. As Khaled, I want the file body not copied, so that the clipboard stays a pointer plus commands.
42. As Khaled, I want Take to name exactly one unit, so that I cannot batch-resolve through Take the way Skip batch-resolves grilling.
43. As Khaled, I want Take selection to be the previewed row, not a checkbox, so that Take cannot share Skip’s multi-select.
44. As Khaled, I want no Take checkbox, so that checking a Ticket still means Skip.
45. As Khaled, I want Unresolved-filter remaining work still to show Frontier Tickets and Spec-only Efforts, so that Take targets are on the desk by default.
46. As Khaled, I want a Finished Effort’s resolved Tickets still not takeable with the filter off, so that showing the full list does not offer stale Takes.
47. As Khaled, I want Archive, Load, Term hints, and file preview unchanged, so that Take is clipboard chrome, not a new write.
48. As Khaled, I want Skip prompt preamble, grouping, and exact-selection rules unchanged, so that this Effort does not reopen ADR 0004.
49. As Khaled, I want to Load again after the pasted session writes disk, so that I can see the Frontier move without live-reload.
50. As Khaled, I want a later agent session that receives a Take prompt to work only the named unit, so that dependents stay open unless listed.
51. As Khaled, I want that session to claim a wayfinder Ticket before work, so that a second paste cannot honestly treat it as Frontier.
52. As Khaled, I want that session, for a Ticket, to write Answer and `Status: resolved`, so that Finished and Archive can eventually fire.
53. As Khaled, I want that session, when a Map exists, to append a Decisions pointer, so that the index stays the index.
54. As Khaled, I want Copy Take prompt to fit the stone sidebar, so that the reading-desk Look still has one filled header action.
55. As Khaled, I want to stay on port 5420 with the same Always-on bookmark, so that this is not a second app.

## Implementation Decisions

- **Product lock:** Take prompt as in ADR 0009. Skip prompt speech, exact Ticket selection, and Reader-does-not-resolve as in ADR 0004. Map list, Unresolved filter, Archive, named holes, Term hints, Stack, Look, Always-on, port 5420 unchanged. Containment still forbids walking source, `.git`, `node_modules`, and secrets.
- **Project-load outline:** each Ticket row and each Spec pointer gains a `take` value. `take` is null when the row is not takeable. When takeable, `take` holds the ordered skill command strings for that row. The browser does not re-derive Type → command. Both project-select and tree-refresh payloads keep the same outline shape plus `take`. No new write endpoint.
- **Takeable:** a Ticket is takeable iff it is Frontier (open, unblocked, unclaimed). A Spec is takeable iff that Effort has a Spec and zero Tickets. Claimed, blocked, resolved, language, ADRs, Out-of-scope records, Maps, and Specs that already have sibling Tickets are not takeable.
- **Commands:** Type is the existing lowercased header. `research` → `/wayfinder`, `/research`. `prototype` → `/wayfinder`, `/prototype`. `grilling` → `/wayfinder`, `/grill-with-docs`. `task` → `/wayfinder`. Takeable Spec → `/to-tickets`. Any other takeable Ticket → `/implement`.
- **Clipboard:** client-only. Command lines, blank line, locked preamble for that flow, blank line, `Project:` absolute path, optional `Map:` title, `Ticket:` or `Spec:` title, `Path:` relative path. Copy Take prompt is shown when the previewed path is a takeable Spec or Ticket. Copy Skip prompt still shows when at least one open Ticket is checked. Shared Copied status is fine. Copy is not a second filled navy header button.
- **Read-only:** no handler writes Status, Answers, Spec status, or the Map. Paste is an instruction to an external session, one unit per paste (not Skip’s batch-resolve exception).
- **Chrome:** no new checkboxes. Claimed rows keep their claimed mark. First stub may be unpolished; polish fits Look.
- **Lodash** for arrays and objects.

## Testing Decisions

A good test is external behaviour of **project load**: given a temporary Project on disk, the load result’s outline `take` on Specs and Tickets matches Type, Frontier, and whether the Effort has Tickets. Tests do not inspect how markdown headers are split internally. They do not drive the browser or clipboard.

That is the **one seam** — the same project-load outline already tested for Effort groups, Frontier, claimed, resolved, and Spec pointers. Extend those tests; do not add a second public surface for prompt formatting.

What that seam must show:

- Frontier `research` / `prototype` / `grilling` / `task` Tickets have `take.commands` as in ADR 0009; claimed, blocked, and resolved Tickets have `take` null.
- A Spec-only Effort’s Spec has `/to-tickets`; a Spec with sibling Tickets has `take` null.
- A Frontier Ticket with empty Type, `decision`, `implementation`, or `ready-for-agent`-only headers has `/implement`.
- Type is matched case-insensitively for the four wayfinder types.
- Load still never follows `..` or a symlink out; Archive and named-hole tests stay green.

Copy Take prompt visibility, shared Copied status, and the full clipboard string (preamble + Project/Map/title/path) are HITL against the stub. No browser test harness in this spec.

Prior art: project-load tests that build a temp `.scratch/` and assert the outline (tree tests and HTTP app tests). Prefer those; HTTP only needs to keep exposing the same payload plus `take`.

## Out of Scope

- The Reader writing, claiming, or resolving Tickets or Specs.
- Live-reload after the pasted session writes disk.
- Take checkboxes, Take multi-select, or sharing Skip’s selection for Take.
- Changing Skip prompt speech, cascade rules, or claimed/blocked Skip checkboxes.
- Prefacing Spec or `/implement` pastes with `/wayfinder`.
- Baking Map Notes skills, `/tdd`, `/handoff`, `/impeccable`, `/wizard`, or `/clear` into the clipboard.
- Copying file bodies.
- Take on language documents, ADRs, Out-of-scope records, Maps, research notes, or prototype assets.
- GitHub / GitLab hosted maps.
- Changing Always-on, Project picker, port 5420, Archive, Unresolved filter, Term hints, Stack, or Look beyond an outlined Copy Take prompt.
- Implementing the agent session that consumes the Take prompt (that is Cursor, not this app).

## Further Notes

- Glossary: [`CONTEXT.md`](../../CONTEXT.md). Locks: [ADR 0009](../../docs/adr/0009-take-prompt.md), [ADR 0004](../../docs/adr/0004-decisions-view-and-skip-prompt.md).
- This Effort is Spec-only on purpose: a well-scoped feature, not a wayfinder map.
- Example Projects to load: this repo (typed Tickets on open Efforts; Spec-only remaining-work); a Spec with Tickets; a claimed Ticket that must stay non-takeable.
- Phillip implements app code. Lodash for arrays and objects.
