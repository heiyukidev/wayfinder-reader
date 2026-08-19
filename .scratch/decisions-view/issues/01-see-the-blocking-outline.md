# 01: See the blocking outline

**What to build:** After Load, Khaled can toggle **Decisions** and see each **Map**’s **Tickets** as a blocking outline: each Ticket once, indented by full blocker-chain depth, **Frontier** marked, resolved dim. Clicking a row previews GFM. Spec-only folders stay out of Decisions. Files view is unchanged. Project load returns this outline; tests on that seam cover depth, Frontier, dangling blockers, cycles, and empty `issues/`.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [ ] ~~Loading a Project shows a Files / Decisions toggle; default is Files; the toggle is session-only~~ — superseded by ADR 0005; the Map list replaces the Files view
- [x] The Map list shows every Map’s Tickets (heading titles, not filenames), each Ticket once, indented by full blocker-chain depth including resolved blockers
- [x] Frontier Tickets are marked; resolved Tickets are dim; spec-only and `/to-tickets` folders do not appear
- [x] Clicking a Map or Ticket row previews its GFM; research, specs, and prototypes remain available through in-`.scratch/` preview links
- [x] Project-load tests cover depth, Frontier, claimed vs resolved, omitted/empty `Blocked by`, dangling blocker numbers, cycles (no hang, each Ticket once), and empty `issues/`
- [x] This repo and sealbox `go-nogo` show a real outline on Load

## Answer

Project load now returns a sandboxed `decisions` outline alongside `tree` and `maps`, and the Reader renders that outline as its Map list with GFM preview. Ticket selection/copy and visual polish remain for Tickets 02 and 03.
