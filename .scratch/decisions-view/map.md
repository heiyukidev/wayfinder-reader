# See which Ticket blocks which, and skip-grill from the Reader

## Destination

The **Reader** on port **5420** shows a **Decisions view**: a blocking outline of **Tickets** so Khaled can pick what to grill, and copies a **Skip prompt** for Tickets he does not want to interview. Files view stays the filesystem **Readable tree**. The Reader still never writes the **Project**.

## Notes

- Domain: local read-only map viewer. Glossary: `CONTEXT.md`. Product lock: [docs/adr/0004-decisions-view-and-skip-prompt.md](../../docs/adr/0004-decisions-view-and-skip-prompt.md). Spec: [spec.md](spec.md).
- Skills: `/wayfinder` for this map; `/grill-with-docs` on HITL tickets; `/impeccable` on polish; Phillip implements builds (user rule: do not write app code in the wayfinding agent). Lodash for arrays/objects.
- Tracker: local markdown under `.scratch/decisions-view/` (see Wayfinding operations in `docs/agents/issue-tracker.md`).
- Standing: **carry execution into the map.** Destination is running software on 5420.
- Parent destination [Read Wayfinder maps locally](../map-reader/map.md) stays closed. This Effort redraws the “no blocking graph / no ticket-aware chrome” lines — Files view is unchanged; Decisions view is new.
- Autopilot locks (object with a named failure mode):
  - Same **Stack**, **Look**, port **5420**, `.scratch/` only, read-only Reader (copy, never claim/resolve).
  - Files / Decisions toggle; default Files; session-only (not `state.json`).
  - Outline: each Ticket once, indented by full blocker-chain depth (resolved blockers still count so rows don’t jump). Frontier marked; resolved dim and not checkable. Spec-only folders omitted.
  - Row click previews GFM; checkbox is separate. No cascade. No select-all. No graph library.
  - **Skip prompt** preamble is fixed:

    > Skip grilling these Tickets in this session. Pick your recommended answer for all the questions. Mark them as resolved.

    Then `Project:`, `Map:`, Ticket titles. Batch-resolve is an intentional exception to one-ticket-per-session. Checking a Ticket is the go.
  - Header parse as in [What on-disk shapes count as a Wayfinder map](../map-reader/issues/01-what-on-disk-shapes-count-as-a-wayfinder-map.md): first ~20 lines, `Type:` / `Status:` / `Blocked by:`; empty Status = open unclaimed; numbers are sibling `NN-*.md`; omitted Blocked by = unblocked. Cycles: each ticket once, no infinite indent.
  - Example Efforts: `Desktop/js/sealbox/.scratch/go-nogo/`, this repo’s `.scratch/map-reader/`.

## Decisions so far

## Not yet specified

## Out of scope

- Replacing Files view, or a blocking-edge **graph canvas**.
- The Reader writing, claiming, or resolving Tickets.
- Live-reload after the pasted session writes disk (destination is click-to-preview / Load again).
- Cascade select, select-all, remembering Decisions mode across restarts.
- GitHub / GitLab hosted maps.
- Changing Always-on, Project picker, or serving outside `.scratch/`.
