# See which Ticket blocks which, and skip-grill from the Reader

Status: ready-for-agent

## Problem Statement

Khaled reads Wayfinder maps in the **Reader**, but the sidebar is a filesystem tree of filenames. He cannot see which **Ticket** is blocked by which, so he cannot tell the **Frontier** (what is takeable to grill) at a glance. When several Tickets are not worth interviewing, he has no way to copy a pasteable instruction for the grilling session. He does not want the Reader to write the **Project**.

## Solution

Add a **Decisions view** beside the existing Files view: a blocking outline of Tickets for each **Map** in the chosen **Project**. He picks what to grill by looking at the Frontier. He checks Tickets he does not want to interview and copies a **Skip prompt** to paste into the grilling chat. That prompt tells the session to skip the interview, pick recommended answers, and mark those Tickets resolved. The Reader only copies; it never claims or writes Ticket files. Files view stays the **Readable tree**. Shape: [ADR 0004](../../docs/adr/0004-decisions-view-and-skip-prompt.md). Glossary: [`CONTEXT.md`](../../CONTEXT.md).

## User Stories

1. As Khaled, I want to see which Ticket is blocked by which, so that I can pick what to grill without opening every file.
2. As Khaled, I want the Frontier marked, so that takeable Tickets stand out from blocked and resolved ones.
3. As Khaled, I want resolved Tickets still visible but dim, so that I can see the whole chain without mistaking them for work to do.
4. As Khaled, I want to toggle Files and Decisions, so that I can still open research notes, specs, and prototypes by path.
5. As Khaled, I want Decisions to default off (Files first), so that the reading desk I already signed off does not surprise me on Load.
6. As Khaled, I want that toggle to last only for this page session, so that Always-on reopen is still Files unless I switch again.
7. As Khaled, I want every Map in the Project listed in Decisions, so that I do not have to guess which Effort has Tickets.
8. As Khaled, I want spec-only and `/to-tickets` folders omitted from Decisions, so that I am not looking at non-Maps as if they had a Frontier.
9. As Khaled, I want each Ticket to appear once, so that a Ticket with two blockers is not drawn twice.
10. As Khaled, I want indent to follow the full blocker chain (including resolved blockers), so that rows do not jump left when a blocker is resolved.
11. As Khaled, I want Tickets titled from the document heading, so that I read names, not filenames.
12. As Khaled, I want to see Type and Status on a Decisions row, so that I can tell grilling from research from a claimed Ticket.
13. As Khaled, I want clicking a Ticket row to preview its markdown, so that I can read the Question before I grill or skip.
14. As Khaled, I want the preview to keep working for Files, so that relative links and GFM are unchanged.
15. As Khaled, I want a checkbox separate from the row click, so that selecting for the Skip prompt does not steal preview.
16. As Khaled, I want only open Tickets checkable, so that I cannot skip something already resolved.
17. As Khaled, I want claimed Tickets still checkable, so that I can skip-grill one that is assigned but I do not want to interview.
18. As Khaled, I want blocked Tickets checkable, so that I can skip a future Ticket I already do not care about.
19. As Khaled, I want checking a Ticket not to check the Tickets it blocks, so that a child I still want to grill is not silently included.
20. As Khaled, I want no select-all, so that I cannot dump the whole Map into a Skip prompt by accident.
21. As Khaled, I want to uncheck a Ticket, so that I can fix a selection before copying.
22. As Khaled, I want selection to survive switching preview files, so that I can read several Tickets then copy once.
23. As Khaled, I want selection to survive toggling Files and back, so that I do not lose checks while I peek at a spec.
24. As Khaled, I want Copy to appear when at least one Ticket is checked, so that I am not copying an empty skip list.
25. As Khaled, I want Copy to put text on the clipboard, so that I can paste it into the grilling chat.
26. As Khaled, I want the copied preamble to be exactly: “Skip grilling these Tickets in this session. Pick your recommended answer for all the questions. Mark them as resolved.” so that the session skips the interview, locks recommendations, and resolves.
27. As Khaled, I want the copied text to include the Project path, so that the pasted session can find the files.
28. As Khaled, I want Tickets grouped under their Map title in the copied text, so that a paste that spans Efforts stays unambiguous.
29. As Khaled, I want Ticket titles in the copied list, not bare numbers, so that I can see what I authorized before I paste.
30. As Khaled, I want checking a Ticket to mean I go ahead with the agent’s recommended answer for that Ticket, so that skip is not “leave it open.”
31. As Khaled, I want the Reader never to write Status or Answer, so that a misclick in the browser cannot close work.
32. As Khaled, I want dependents left off the copied list unless I checked them, so that resolving a blocker does not auto-resolve the branch.
33. As Khaled, I want to Load again after the pasted session writes disk, so that I can see the Frontier move without live-reload.
34. As Khaled, I want a Map with no `issues/` (or an empty one) to show as an empty group, so that I know the Map exists but has no Tickets.
35. As Khaled, I want a Ticket with no `Blocked by` line (or an empty one) treated as unblocked, so that real maps in the wild show up on the Frontier.
36. As Khaled, I want a Ticket whose blockers are all resolved to count as unblocked, so that the Frontier matches the tracker.
37. As Khaled, I want a dangling blocker number to keep that Ticket blocked, so that a typo does not pretend the Ticket is takeable.
38. As Khaled, I want a cycle in `Blocked by` not to hang the Reader, so that a bad map is still readable.
39. As Khaled, I want research notes, `spec.md`, and prototypes to stay in Files only, so that Decisions is Tickets, not the whole Effort tree.
40. As Khaled, I want Load on this repo’s map-reader Effort and on sealbox `go-nogo` to show a real outline, so that I can trust the view on maps I already have.
41. As Khaled, I want Copy not to be a second navy Load in the header, so that the reading-desk Look still has one filled header action.
42. As Khaled, I want Decisions chrome to use the stone sidebar, so that the two views feel like one product.
43. As Khaled, I want to stay on port 5420 with the same Always-on bookmark, so that this is not a second app.
44. As a later grilling session, I want a pasted Skip prompt to name only the listed Tickets, so that I do not resolve Tickets the user did not check.
45. As a later grilling session, I want that paste to be allowed to resolve several Tickets at once, so that I am not blocked by one-ticket-per-session.
46. As Khaled, I want Files view filenames unchanged, so that ticket-aware chrome does not leak into the filesystem tree.

## Implementation Decisions

- **Product lock:** Decisions view and Skip prompt as in ADR 0004. Files view remains the Readable tree (ADR 0002). Same Stack (ADR 0003), Look, Always-on, port 5420, `.scratch/` only.
- **Project-load payload:** the existing load that already returns the Readable tree and the list of Maps also returns a `decisions` outline. Both project-select and tree-refresh endpoints return the same shape. No new write endpoint. The browser does not parse Ticket headers.
- **`decisions` shape:** an ordered list of Map groups (same order as discovered Maps). Each group has the Map title (heading of `map.md`), the Map path under `.scratch/`, and an ordered list of Ticket rows. Each row has: title (heading of the Ticket file), path under `.scratch/`, Type, Status, blocker numbers, depth, whether it is Frontier, resolved, claimed, and whether a cycle involved this Ticket. Depth is the longest path through blockers, counting resolved blockers. Tickets are ordered by file number. Lodash for lists and object access.
- **Parse:** only `issues/NN-*.md` under a Map. First ~20 lines for `Type:`, `Status:`, `Blocked by:` as in the on-disk map research. Empty or missing Status = open unclaimed. `claimed` / `resolved` as today. `Blocked by` numbers are sibling file numbers, zero-padded or not. Missing or empty `Blocked by` = unblocked. Unknown blocker numbers count as unresolved. Cycles: emit each Ticket once; do not recurse forever. Folders without `map.md` contribute nothing to `decisions`.
- **Frontier:** open, unblocked, unclaimed. Unblocked means every listed blocker file is `resolved` (and exists). The Reader does not claim.
- **Chrome:** Files / Decisions toggle in the sidebar, default Files, not persisted. Decisions renders `decisions` with indent from depth. Frontier marked; resolved dim and not checkable; open (including claimed and blocked) checkable. Row click selects the file for GFM preview (existing file fetch). Checkbox does not preview. No graph library.
- **Skip prompt:** clipboard only. Preamble is the locked three sentences. Then `Project:` with the absolute Project path. Then, for each Map that has at least one selected Ticket, `Map:` with that Map’s title and a hyphen list of selected Ticket titles (no cascade, no bare ids). Copy is disabled or hidden when the selection is empty. Copy is not a second filled navy header button.
- **Read-only:** no handler writes Ticket files, Status, or the Map. Paste is an instruction to a grilling session, including an intentional batch-resolve exception to one-ticket-per-session.
- **Look / polish:** first stub can be unpolished; polish fits the reading desk and does not change Stack, Readable tree, or Skip prompt speech.

## Testing Decisions

A good test is external behavior of **project load**: given a temporary Project on disk, the load result’s `decisions` outline matches the Ticket headers (depth, Frontier, resolved, claimed, dangling blockers, cycles, spec-only omission, empty `issues/`). Tests do not inspect how markdown is split internally. They do not drive the browser, clipboard, or toggle.

That is the **one seam** — the same project-load result already tested for the Readable tree and Map discovery (temp directory, `map.md`, sibling folders). Extend those tests; do not add a second public surface for parsing.

What that seam must show:

- A Map’s `issues/NN-*.md` become rows with heading titles and `.scratch/` paths; research / spec / prototypes are absent from `decisions`.
- Spec-only siblings are in the tree, not in `decisions`.
- Depth uses the full blocker chain, including resolved blockers.
- Frontier is open + unblocked + unclaimed; resolved is flagged; claimed is flagged and not Frontier.
- Empty or omitted `Blocked by` is unblocked; a missing blocker number keeps the Ticket blocked.
- A cycle still returns each Ticket once and does not hang.
- Empty or missing `issues/` yields a Map group with no rows.
- Load still never follows `..` or a symlink out of `.scratch/` (existing sandbox tests stay green).

Skip prompt wording, checkboxes, and the Files / Decisions toggle are HITL against the stub (this Effort’s prototype tickets). No browser test harness in this spec.

Prior art: project-load tests that build a temp `.scratch/` and assert tree / maps; HTTP tests that load the app and assert sandbox errors. Prefer the project-load tests as the seam; HTTP only needs to keep exposing the same payload it already returns today, plus `decisions`.

## Out of Scope

- Replacing Files view; a blocking-edge graph canvas; any graph library.
- The Reader writing, claiming, or resolving Tickets.
- Live-reload after the pasted session writes disk.
- Cascade select, select-all, persisting Decisions mode or checkbox state across restarts.
- GitHub / GitLab hosted maps; parsing `gh` / `glab`.
- Changing Always-on, Project picker, port 5420, or serving outside `.scratch/`.
- Ticket-aware badges on Files view.
- A second filled navy Load-style button for Copy.
- Implementing the grilling session that consumes the Skip prompt (that is Cursor, not this app).

## Further Notes

- Map: [See which Ticket blocks which, and skip-grill from the Reader](map.md). Frontier ticket: [See the blocking outline](issues/01-see-the-blocking-outline.md), then [Copy a Skip prompt](issues/02-copy-a-skip-prompt.md), then [Visual polish of Decisions view](issues/03-visual-polish-of-decisions-view.md).
- On-disk header dialect: [What on-disk shapes count as a Wayfinder map](../map-reader/issues/01-what-on-disk-shapes-count-as-a-wayfinder-map.md).
- Example Projects to load: this repo; `Desktop/js/sealbox` (`go-nogo`).
- Phillip implements app code. Lodash for arrays and objects.
