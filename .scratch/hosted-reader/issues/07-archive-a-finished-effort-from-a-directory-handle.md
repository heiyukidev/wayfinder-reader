# Archive a Finished Effort from a directory handle

Type: task
Status: resolved
Blocked by: 06, 10

## Question

Implement whatever [How to Archive when Chromium cannot rename directories](10-how-to-archive-when-chromium-cannot-rename-directories.md) locked. Until that ticket is resolved, do not copy+delete and do not ship a fake rename.

Load never archives. No Archive list, no Restore. Ask `readwrite` only at confirm, not at Load. Create `.archive/` if it is missing (`getDirectoryHandle('.archive', { create: true })`). Collision suffix if the archive name exists (same as `src/archive.js`).

Chromium fact (do not rediscover): `FileSystemDirectoryHandle.move` is not shipped. [How File System Access behaves for a Wayfinder Project](01-how-file-system-access-behaves-for-a-wayfinder-project.md).

Done when a **Finished** Effort in a Loaded **Project** can be Archived from the static **Reader** and disappears from the live **Map list** — or when 10 rules Archive out of this destination and this ticket is closed as out of scope.

## Answer

Out of scope. [How to Archive when Chromium cannot rename directories](10-how-to-archive-when-chromium-cannot-rename-directories.md) dropped Archive from the hosted **Reader**: Chromium cannot rename directories, copy-then-delete can half-archive, and Hono is not a second product. Not implemented.

