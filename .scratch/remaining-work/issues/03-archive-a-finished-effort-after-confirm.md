# 03: Archive a Finished Effort after confirm

**What to build:** Only a **Finished** Effort offers **Archive**. Confirm names the Effort slug and says it will move, not delete; cancel leaves the Effort in place. Confirm moves `.scratch/<slug>/` (research and prototypes included) to `.scratch/.archive/<slug>/`, suffixes the slug on collision, and drops that group from the **Map list**. Load never archives. Not-Finished, traversal, and `.archive` itself are rejected. Preview of an archived path fails. No Restore and no hard delete in the Reader.

**Blocked by:** 01 List Spec-only and Ticket-only Efforts, ADRs, and Out-of-scope records

**Status:** resolved

- [x] Archive appears only on Finished Effort groups; language, ADRs, and Out-of-scope records have no Archive control
- [x] Confirm names the slug and says move, not delete; cancel is a no-op
- [x] Confirming moves the Effort directory to Archive, including research and prototypes; a colliding Archive slug is suffixed so the first copy is not overwritten
- [x] After Archive, the Map list drops that Effort; live `.scratch/<slug>/` is gone and the files are under Archive on disk
- [x] Archive of a not-Finished Effort, a path outside that Effort, or `.archive` itself fails and leaves files in place
- [x] Load and file fetch never archive; preview of an archived path fails; the Reader still does not edit Ticket Status or Answers

## Answer

`POST /api/archive` was already on the HTTP app from fd86aef: Finished-only, slug pattern, `.archive` rejected, collision suffix (`<slug>-2`), research/prototypes move with the directory, response is `projectPayload` (same outline as Load). The Map list already puts Archive only on `finished` Effort groups; Context rows (language, ADRs, Out-of-scope) use `makeDocRow` and have no control. No Restore and no hard delete.

Gaps closed in this ticket:

- Containment lives in `src/paths.js`: `isEffortSlug`, `archiveRoot`, `resolveLiveEffortDir` (project roots, live `.scratch/<slug>/` only, not Archive, not traversal, realpath stays inside `.scratch`). Archive of an escaping `.scratch` is 403 and leaves files in place.
- HTTP seam: Load and file fetch never create Archive; after a successful Archive, preview of `.scratch/.archive/…` is 403; nested slug / project `src` / traversal fail without moving; outline keys match `/api/tree`.

HITL confirm (`window.confirm`): `Move ${slug} to Archive? This moves the Effort, it does not delete it.` Cancel returns without POST. Look of the control is ticket 04.

`npm test`: 46 passed.
