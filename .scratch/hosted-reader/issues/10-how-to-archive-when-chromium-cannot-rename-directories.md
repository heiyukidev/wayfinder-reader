# How to Archive when Chromium cannot rename directories

Type: grilling
Status: resolved
Blocked by:

## Question

[How File System Access behaves for a Wayfinder Project](01-how-file-system-access-behaves-for-a-wayfinder-project.md) established that Chrome/Edge cannot `move` a directory handle. The current **Reader** Archives with `fs.renameSync` (ADR 0007). Creating `.scratch/.archive/` with `readwrite` works; renaming `.scratch/<slug>/` into it does not.

The destination still names **Archive**. What should this Effort do?

- **A. Copy then delete** — recursive copy into `.archive/<slug>/`, then `removeEntry` on the live Effort. Not a rename; `removeEntry` can fail non-atomically. Named objection required (this is the failure mode: a half-archived Effort).
- **B. Drop Archive from this destination** — hosted **Reader** is read-only; Archive stays a disk/Hono leftover until directory `move` ships. Close [Archive a Finished Effort from a directory handle](07-archive-a-finished-effort-from-a-directory-handle.md) as out of scope and record why on the map.
- **C. Something else** — name it.

Do not implement. Skills: grilling + domain-modeling. ADR 0007 may need a supersession if A or B lands.

## Answer

**B**, with leftover Hono then gone: the hosted **Reader** does not Archive. Chromium cannot rename a directory; copy-then-delete is rejected (a half-archived Effort). Do not keep Hono as a second Archive product.

Leftover Hono may keep `fs.renameSync` until [Retire launchd Always-on](09-retire-launchd-always-on.md). After cutover, Archive is a disk move into `.scratch/.archive/<slug>/`. [ADR 0007](../../../docs/adr/0007-archive-finished-efforts.md) still describes that convention; [ADR 0013](../../../docs/adr/0013-hosted-reader-does-not-archive.md) drops the control from this origin. [Archive a Finished Effort from a directory handle](07-archive-a-finished-effort-from-a-directory-handle.md) is out of scope, not a step on the route.


## Question

[How File System Access behaves for a Wayfinder Project](01-how-file-system-access-behaves-for-a-wayfinder-project.md) established that Chrome/Edge cannot `move` a directory handle. The current **Reader** Archives with `fs.renameSync` (ADR 0007). Creating `.scratch/.archive/` with `readwrite` works; renaming `.scratch/<slug>/` into it does not.

The destination still names **Archive**. What should this Effort do?

- **A. Copy then delete** — recursive copy into `.archive/<slug>/`, then `removeEntry` on the live Effort. Not a rename; `removeEntry` can fail non-atomically. Named objection required (this is the failure mode: a half-archived Effort).
- **B. Drop Archive from this destination** — hosted **Reader** is read-only; Archive stays a disk/Hono leftover until directory `move` ships. Close [Archive a Finished Effort from a directory handle](07-archive-a-finished-effort-from-a-directory-handle.md) as out of scope and record why on the map.
- **C. Something else** — name it.

Do not implement. Skills: grilling + domain-modeling. ADR 0007 may need a supersession if A or B lands.
