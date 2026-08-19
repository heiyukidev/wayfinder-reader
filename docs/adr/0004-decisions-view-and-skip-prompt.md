# ADR 0004 — Decisions view and skip prompt

Status: accepted (Files view remains: superseded by [ADR 0005](0005-map-list-replaces-files-view.md))

## Context

The **Reader**’s first destination was a filesystem **Readable tree** plus GFM preview. [Read Wayfinder maps locally](../../.scratch/map-reader/map.md) locked the sidebar as that tree, not a blocking graph, and put ticket-aware chrome out of scope.

Khaled wants a second job: see which **Ticket** is blocked by which, so he can pick what to grill, and copy a pasteable prompt for Tickets he does not want to interview.

The Reader stays read-only toward the **Project**. The pasted grilling session is what writes Answers.

## Decision

- **Files view** remains the filesystem **Readable tree** (ADR 0002). Filenames, research, specs, prototypes.
- **Decisions view** is a second sidebar mode: **Tickets** (`issues/*.md`) of each **Map**, each ticket once, indented by blocker depth. Frontier marked; resolved dim. Click still previews GFM.
- Parse `Type:`, `Status:`, `Blocked by:` only to drive this view. Do not walk outside `.scratch/`.
- Multi-select copies a **Skip prompt**. Speech:

  > Skip grilling these Tickets in this session. Pick your recommended answer for all the questions. Mark them as resolved.

  Checking a Ticket is the go for that recommendation. Selection is exact — no cascade onto Tickets it blocks. The Reader never writes ticket files. This paste is an intentional batch-resolve exception to one-ticket-per-session.
- No graph library. Same **Stack** and **Look**.

Rejected: replacing the filesystem tree; a blocking-edge graph canvas; the Reader claiming or resolving Tickets; skip-the-interview-and-leave-open (reversed).

## Consequences

Resolving selected Tickets **moves the Frontier**. Dependents stay open and may become takeable; they are not resolved unless listed. Shipping the toggle, outline, and copy control is [See which Ticket blocks which, and skip-grill from the Reader](../../.scratch/decisions-view/map.md).
