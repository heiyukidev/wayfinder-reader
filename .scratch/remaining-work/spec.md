# Remaining work desk: Unresolved filter, Archive, and named holes

Status: ready-for-agent

## Problem Statement

Khaled’s **Reader** still shows every **Effort** that has a **Map**, including ones whose **Tickets** are all `resolved`, and it still discovers only folders with `map.md`. Spec-only and Ticket-only folders, **ADRs**, and **Out-of-scope records** are missing or second-class. He wants the desk to be remaining work, and a confirm that **Archives** a **Finished** Effort instead of leaving it in `.scratch/` forever. He does not want Load to delete anything, and he does not want Always-on to serve the rest of the Project.

## Solution

The **Map list** lists language documents (when present), then **ADRs**, then **Out-of-scope records**, then every **Effort** that has a Map and/or a Spec and/or Tickets. An **Unresolved filter** is on by default for the page session: resolved Tickets and **Finished** Efforts are hidden; claimed and blocked Tickets stay; project-level rows stay. A **Finished** Effort (at least one Ticket, every Ticket `Status: resolved`) offers **Archive**: after confirm, that directory moves to `.scratch/.archive/<slug>/`. Load never archives. The Reader still does not edit, claim, or resolve Tickets. Shape: [ADR 0007](../../docs/adr/0007-archive-finished-efforts.md), [ADR 0008](../../docs/adr/0008-map-list-named-holes-for-adrs-and-out-of-scope.md). Glossary: [`CONTEXT.md`](../../CONTEXT.md).

## User Stories

1. As Khaled, I want the Unresolved filter on when I Load, so that the desk is remaining work without an extra click.
2. As Khaled, I want that filter to last only for this page session, so that Always-on reopen is remaining work again, not a remembered “show all.”
3. As Khaled, I want a control that shows the full live list, so that I can see dim resolved Tickets and Finished Efforts still in `.scratch/`.
4. As Khaled, I want turning that control back to remaining work, so that I can hide Finished clutter again without reloading.
5. As Khaled, I want resolved Tickets hidden while the filter is on, so that I am not scrolling past work already decided.
6. As Khaled, I want claimed Tickets still visible while the filter is on, so that I do not lose a Ticket someone is holding.
7. As Khaled, I want blocked Tickets still visible while the filter is on, so that I can see what is waiting, not only the Frontier.
8. As Khaled, I want Finished Efforts hidden while the filter is on, so that a completed Map does not look like live work.
9. As Khaled, I want language documents still listed while the filter is on, so that the glossary does not vanish because Tickets are done.
10. As Khaled, I want ADRs still listed while the filter is on, so that decisions stay on the desk.
11. As Khaled, I want Out-of-scope records still listed while the filter is on, so that rejected requests stay readable.
12. As Khaled, I want Archived Efforts absent even with the filter off, so that Archive is not just another hide.
13. As Khaled, I want an Effort with a Map, Spec, and Tickets listed as one group, so that I read one run, not three folders.
14. As Khaled, I want an Effort with only a Spec listed, so that dnd-heiyuki-style spec folders are not invisible.
15. As Khaled, I want an Effort with only Tickets listed, so that `/to-tickets` folders without a Map are not invisible.
16. As Khaled, I want an Effort with a Spec and Tickets and no Map listed, so that a buildable plan plus slices is one group.
17. As Khaled, I want a folder with neither Map nor Spec nor numbered Tickets omitted, so that stray notes are not fake Efforts.
18. As Khaled, I want `.scratch/.archive/` omitted from the Map list, so that archived runs do not reappear as Efforts.
19. As Khaled, I want a Spec-only Effort with zero Tickets treated as remaining work, so that a buildable plan is not Archived as if it were done.
20. As Khaled, I want Finished to mean at least one Ticket and every Ticket `Status: resolved`, so that empty Status, claimed, and ready-for-agent never count as done.
21. As Khaled, I want checkboxes and `[x]` ignored for Finished, so that a `/to-tickets` file is not silently treated as resolved.
22. As Khaled, I want Spec status ignored for Finished, so that leftover `ready-for-agent` on spec.md does not trap a completed run.
23. As Khaled, I want fog, research, and prototypes ignored for Finished, so that notes do not block Archive.
24. As Khaled, I want an Archive control only on Finished Efforts, so that I cannot archive remaining work in one misclick.
25. As Khaled, I want project-level rows (language, ADRs, Out-of-scope records) to have no Archive control, so that I cannot archive the glossary or the decision log as if they were an Effort.
26. As Khaled, I want Archive to ask me to confirm, so that a stray click does not move a whole Effort.
27. As Khaled, I want that confirm to name the Effort slug and say it will move, not delete, so that I know I am not running `rm`.
28. As Khaled, I want cancelling confirm to leave the Effort in place, so that I can back out.
29. As Khaled, I want confirming Archive to move `.scratch/<slug>/` to `.scratch/.archive/<slug>/`, so that the files remain on disk.
30. As Khaled, I want the Map list to drop that Effort after Archive, so that remaining work is what is left.
31. As Khaled, I want research and prototypes to move with the Effort, so that I am not left with an orphan notes folder.
32. As Khaled, I want Archive never to run as a side effect of Load, so that opening a Project cannot empty `.scratch/`.
33. As Khaled, I want Archive of a not-Finished Effort rejected, so that a crafted request cannot hide live Tickets.
34. As Khaled, I want Archive of a path outside that Effort rejected, so that Always-on cannot move source or `.env`.
35. As Khaled, I want Archive of `.archive` itself rejected, so that the recovery directory is not nested into itself.
36. As Khaled, I want a colliding Archive slug suffixed, so that a second Archive of the same name does not overwrite the first.
37. As Khaled, I want no Restore in the Reader, so that this feature does not grow an Archive browser.
38. As Khaled, I want no hard delete in the Reader, so that recovery is moving the directory back on disk.
39. As Khaled, I want preview of an archived path to fail, so that a selected file does not keep showing after its Effort moved.
40. As Khaled, I want ADRs under `docs/adr/` as Map list rows, so that grill-with-docs decisions are readable here.
41. As Khaled, I want clicking an ADR to preview it as GFM, so that I can read the lock without leaving the desk.
42. As Khaled, I want a Project with no `docs/adr/` to omit that section, so that missing ADRs are a silent no-op.
43. As Khaled, I want CONTEXT-MAP contexts’ `docs/adr/` files still inside the Project listed too, so that multi-context repos are not missing half their decisions.
44. As Khaled, I want an ADR path that leaves the Project or is a symlink out skipped, so that the allowlist cannot wander.
45. As Khaled, I want Out-of-scope records under `.out-of-scope/` as Map list rows, so that triage rejections are readable here.
46. As Khaled, I want clicking an Out-of-scope record to preview it as GFM, so that I can see why a request was rejected.
47. As Khaled, I want a Project with no `.out-of-scope/` to omit that section, so that missing rejections are a silent no-op.
48. As Khaled, I want `/api/file` to serve those ADR and Out-of-scope paths and still 403 `package.json` and `.env`, so that named holes are not a walk of the repo.
49. As Khaled, I want `/api/file` to refuse `.scratch/.archive/…`, so that Archive is not a second live tree.
50. As Khaled, I want Skip prompt checkboxes and copy unchanged, so that grilling paste still works on remaining open Tickets.
51. As Khaled, I want the Reader still not to edit Ticket Status or Answers, so that Archive is the only new write.
52. As Khaled, I want Term hints and language-row behaviour left to the term-hints Effort, so that this desk does not re-open glossary parsing.
53. As Khaled, I want spec-only listing here to be the same Effort group as a Map’s Spec row, so that term-hints and this desk do not draw the same folder twice.
54. As Khaled, I want Stack, Look, port 5420, and Always-on unchanged, so that the reading desk still feels like the desk I signed off.
55. As Khaled, I want the Archive control and filter control to fit the stone sidebar, so that they do not become a second navy Load.
56. As a later session, I want to restore an Effort by moving the directory back on disk, so that the Reader does not have to grow recovery UI.

## Implementation Decisions

- **Product locks:** [ADR 0007](../../docs/adr/0007-archive-finished-efforts.md), [ADR 0008](../../docs/adr/0008-map-list-named-holes-for-adrs-and-out-of-scope.md). Containment in ADR 0002 still forbids walking source, `.git`, `node_modules`, `scripts/`, `.env`, questionnaires, `workflows/`, `PRODUCT.md`, and teach files. Language files remain ADR 0006. Skip prompt speech and behaviour unchanged.
- **Effort groups:** Project load’s outline is one list of Efforts, not Maps-only. A group is a `.scratch/<slug>/` directory that has `map.md` and/or `spec.md` and/or `issues/NN-*.md`. Title is Map heading, else Spec heading, else folder name. Map path is present or null. Spec pointer is present or null. Tickets parse as today (`Type:`, `Status:`, `Blocked by:` in the first lines; `resolved` is that status string only). `finished` is true iff there is at least one Ticket and every Ticket is resolved. `.scratch/.archive/` is never an Effort.
- **Project-level rows:** `adrs` is an ordered list of `{ title, path }` for `docs/adr/*.md` plus, when CONTEXT-MAP exists, each mapped context’s `docs/adr/*.md` still inside the Project (same containment as language: basename and directory rules, no `..`, no symlink out). Title is H1 else filename. `outOfScope` is `{ title, path }` for `.out-of-scope/*.md`. Missing directories yield empty lists. Language listing stays with term-hints; if that array is present, Map list order is language, ADRs, Out-of-scope records, Efforts.
- **File fetch:** existing `.scratch/` sandbox except Archive paths, which are refused. Also serve a path that exactly matches an `adrs[]` or `outOfScope[]` path for this Project (realpath inside Project). Language allowlist unchanged if term-hints has shipped it. Everything else stays 403.
- **Archive write:** one new mutating endpoint on the selected Project. Body identifies the Effort slug. Server checks Finished, containment (that directory is a live Effort under `.scratch/`, not Archive, not a traversal). Move the directory to `.scratch/.archive/<slug>/`. If that destination exists, suffix the slug so the first copy is not overwritten. Response is the same shape as project load (or the client reloads). Never create Archive as a side effect of Load or file fetch.
- **Unresolved filter:** client-only. Default on. Not stored in server state. Uses `finished` and per-Ticket `resolved` from load. Does not hide project-level rows. Does not show Archive.
- **Chrome:** Archive control only on Finished Effort groups; confirm names the slug and says move, not delete; cancel is a no-op. Filter control in the sidebar, not a second Load. First stub may be unpolished; polish fits Look.
- **Lodash** for arrays and objects. Both project-load routes return the same outline shape.

## Testing Decisions

A good test is external behaviour of the **HTTP app** against a temporary Project: project load, file fetch, and Archive. Tests assert payload and on-disk location. They do not inspect how markdown headers are split internally. They do not drive the browser, the filter toggle, or the confirm dialog.

That is the **one seam** — extend the existing temp-Project HTTP tests (load and file) and add Archive on the same app. Do not add a second public parse surface. Do not unit-test the confirm copy.

What that seam must show:

- Map-only, Spec-only, Ticket-only, and Spec+Tickets-without-Map each appear as one Effort group; a folder with none of those does not.
- Spec-only with zero Tickets is not `finished`; a group with ≥1 Ticket all `Status: resolved` is `finished`; `ready-for-agent`, empty Status, claimed, and checked boxes are not resolved.
- `.scratch/.archive/<slug>/` is absent from the outline; live `.scratch/<slug>/` after a successful Archive is gone from the outline and present under Archive on disk.
- Archive of a not-Finished Effort fails and leaves files in place; traversal and paths outside the live Effort fail; colliding Archive slugs do not overwrite.
- Load lists `docs/adr/` files and `.out-of-scope/` files when present; missing dirs are empty lists; file fetch allows those listed paths and still 403s `package.json`, `.env`, and `.scratch/.archive/…`.
- Today’s traversal and `.scratch/` sandbox tests stay green except the intentional Archive refusal.

Filter default, confirm wording, and Look are HITL against the stub.

## Out of Scope

- An Archive list, Restore, or hard delete in the Reader.
- Auto-archive on Load.
- Inferring resolved from checkboxes or any Status other than `resolved`.
- Term hints, language-file discovery, and CONTEXT parsing (term-hints Effort).
- Serving `workflows/`, questionnaires, `PRODUCT.md`, `DESIGN.md`, teach workspaces, prototype git branches, `scripts/`, `.env`, source, or OS temp handoffs.
- Changing Skip prompt speech; claiming or resolving Tickets; writing CONTEXT or ADR files.
- Live-reload, search, GitHub / GitLab hosted maps, graph canvas, Files view.
- Changing Always-on, Project picker, Stack, or port 5420.

## Further Notes

- Locks: [ADR 0007](../../docs/adr/0007-archive-finished-efforts.md), [ADR 0008](../../docs/adr/0008-map-list-named-holes-for-adrs-and-out-of-scope.md). Glossary: [`CONTEXT.md`](../../CONTEXT.md).
- Overlap: [Show language, Specs, and Term hints](../term-hints/spec.md) owns language rows and Term hints. This Effort owns Effort groups without a required Map, `finished`, the Unresolved filter, Archive, ADR rows, and Out-of-scope records. A Spec-only folder is one Effort group, not a second specOnly list beside a Map list.
- Example Projects: this repo (Finished map-reader / decisions-view vs open term-hints); `Desktop/js/sealbox`; `Desktop/js/dnd-heiyuki`.
- Phillip implements app code. Lodash for arrays and objects.
