# Load a Directory snapshot on the hosted origin

Status: ready-for-agent

## Problem Statement

Coworkers open the hosted **Reader** in Firefox or stock Brave and cannot Load a **Project**. Load asks for a **Directory handle**. Those browsers do not grant one (Firefox never; Brave hides File System Access behind a flag). The page says it needs Chrome or Edge and cannot pick a folder. Safari is not required. Always-on can wait.

## Solution

On the hosted origin, Load is still in the page with no Node `fs` server. When File System Access exists, Load stays a **Directory handle** and recents stay handles. When it does not, Load is a **Directory snapshot**: a one-shot folder pick, session only, no recents, with a warning that a large **Project** can stall. Safari stays on an explicit unsupported error (its folder pick can omit `.scratch`). The **Map list**, preview, **Term hints**, Skip, Take, **Unresolved filter**, and **Paste preview** are the same after either hosted Load. Shape: [ADR 0018](../../docs/adr/0018-hosted-directory-snapshot-fallback.md), amending [ADR 0011](../../docs/adr/0011-static-public-origin-for-the-reader.md) and [ADR 0012](../../docs/adr/0012-file-system-access-load.md). Glossary: [`CONTEXT.md`](../../CONTEXT.md).

## User Stories

1. As a coworker in Firefox, I want Load on the Pages **Reader** to pick a **Project** folder, so that I can see the **Map list** without switching browsers.
2. As a coworker in stock Brave, I want that same folder pick, so that File System Access staying off does not block me.
3. As Khaled in Chrome, I want Load to stay a **Directory handle**, so that recents and re-read still work the way they do today.
4. As Khaled in Edge, I want Load to stay a **Directory handle**, so that Chrome and Edge do not get worse to match Firefox.
5. As a coworker who enabled Brave’s File System Access flag, I want Load to use a **Directory handle**, so that I get recents instead of a snapshot.
6. As a visitor in Safari, I want an explicit “this browser cannot pick a folder” error, so that I do not get a successful-looking Load with no Tickets.
7. As a coworker in Firefox, I must not see a message that the Reader needs only Chrome or Edge, so that the error I hit today is not the product.
8. As Khaled, I want Safari’s folder pick never used, so that omitted `.scratch` cannot look like an empty **Project**.
9. As Khaled, I want Chrome and Brave never classified as Safari, so that an engine check does not steal handle Load from Chromium.
10. As a coworker, I want Load to still mean picking the **Project** root (the folder that contains `CONTEXT.md` and/or `.scratch/`), so that I do not have to pick `.scratch` itself.
11. As a coworker, I want `.scratch` maps and Tickets to appear after a snapshot Load, so that hidden folders in Firefox/Brave are not dropped.
12. As a coworker, I want `.out-of-scope` rows to appear after a snapshot Load, so that named-hole records survive the fallback.
13. As a coworker, I want `node_modules` and `.git` not to appear on the **Map list**, so that skip-by-name still holds after an eager pick.
14. As a coworker, I want other hidden directories besides `.scratch` and `.out-of-scope` omitted from the walk, so that secrets and tool folders stay out.
15. As a coworker, I want the **Map list** after a snapshot to match a handle Load of the same **Project** (Sites, Efforts, **ADRs**, language, Out-of-scope records), so that Firefox is not a thinner Reader.
16. As a coworker, I want GFM preview of a Map list row to work after a snapshot Load, so that picking a folder is enough to read.
17. As a coworker, I want in-`.scratch/` preview targets (research, prototypes) to still open when they are readable, so that snapshot Load is not Maps-only.
18. As a coworker, I want **Term hints** on that preview from the preview’s **Site lineage**, so that glossary overlay does not depend on a handle.
19. As a coworker, I want **Paste preview** after a snapshot Load, so that paste is not locked to Chrome.
20. As a coworker, I want Skip prompt and Take prompt to copy as they do today, so that clipboard flows do not care how Load happened.
21. As a coworker, I want the **Unresolved filter** to work on a snapshot **Map list**, so that remaining work is the same control.
22. As a coworker, I want no hosted **Project path** field, so that Pages still does not pretend it can see a POSIX path.
23. As a coworker, I want the folder’s name in the chrome after snapshot Load, so that I can see which **Project** is open.
24. As a coworker, I want recents hidden or empty on the snapshot path, so that I am not offered a restore that cannot come back.
25. As Khaled in Chrome, I want handle recents unchanged, so that Firefox’s snapshot does not delete IndexedDB recents behaviour.
26. As a coworker, I want a refresh or new tab to require picking again, so that I understand a **Directory snapshot** is session-only.
27. As a coworker, I want edits on disk after the pick invisible until I Load again, so that I do not think the snapshot is live.
28. As a coworker, I want a warning that a large repo can take a while, so that an eager `node_modules` walk is not a silent freeze.
29. As a coworker, I want that warning on the snapshot path only, so that Chrome handle Load does not nag.
30. As a coworker, I want skipped trees not read for bytes even if the browser listed them, so that the page does not parse every `node_modules` file.
31. As a coworker, I want Cancel or dismissing the folder pick to leave the current session alone, so that abort is not an error and not a wipe.
32. As a coworker, I want a second snapshot Load to replace the first, so that I can switch **Projects** in Firefox.
33. As a coworker, I want an empty or non-Wayfinder folder to show the empty **Map list**, so that “no Sites” is not the unsupported-browser error.
34. As a coworker, I want picking `.scratch` itself to behave like handle Load of the wrong folder, so that we do not invent a second rule.
35. As Khaled, I want Always-on (`/api/state` present) to keep **Project path** Load and **Archive**, so that this Effort does not touch 5420.
36. As Khaled, I want Firefox on Always-on to still paste a path, so that snapshot is hosted-only.
37. As Khaled, I want one `public/` page, so that hosted snapshot and handle Load are not two apps.
38. As Khaled, I want hosted still read-only (no **Archive**), so that a snapshot cannot write the **Project**.
39. As a coworker, I want relative preview links inside the Readable tree to resolve after snapshot Load, so that Map links still navigate.
40. As a coworker, I want a multi-Site **Project** to list every Site after snapshot Load, so that marker walk is not Chrome-only.
41. As a coworker, I want CONTEXT-MAP ordering still applied after snapshot Load, so that Site titles match handle Load.
42. As Khaled, I want File System Access Cancel to stay silent `AbortError` handling, so that Chrome Cancel does not grow a toast.
43. As a coworker opening Pages in Firefox with no **Project** yet, I want Load enabled, so that init does not disable the only action I have.
44. As a visitor on iOS Safari or mobile Chromium, I want no new promise that directory pickers work, so that mobile stays out.
45. As Khaled, I want glossary **Directory snapshot** and ADR 0018 left as the lock, so that implement does not reopen the grill.

## Implementation Decisions

- **Product lock:** Hosted Load is a **Directory handle** when File System Access exists, else a **Directory snapshot**. Recents are handle-only. Safari is unsupported via engine check, not via a folder pick. Always-on is unchanged. Do not type a **Project path** on Pages. Do not persist a snapshot. Do not drop handle Load to make Chrome match Firefox. [ADR 0018](../../docs/adr/0018-hosted-directory-snapshot-fallback.md).
- **Routing:** Export one small decision from the walk module: given whether the browser is Safari and whether `showDirectoryPicker` exists, return `handle`, `snapshot`, or `unsupported`. Safari is Apple WebKit that is not Chromium (Chrome and Brave never match). Feature-detect the picker; do not UA-sniff Brave. Hosted init and Load follow that result. Always-on is detected first and never consults it.
- **Snapshot pick:** Hosted snapshot Load is a user-gesture folder pick that yields a flat list of files with relative paths (the folder name is the first path segment). Strip that prefix so walk `rel` matches handle Load. `projectName` is that folder name. Cancel / empty selection is a no-op. Replace the session on a later successful pick.
- **Adapt, then walk:** Turn the snapshot file list into a directory-handle-shaped tree the existing project walk and preview-read already consume, so Map list payload and preview bytes are not a second walker. Filter by path segment before reading file bytes: skip `node_modules`, `.git`, and other hidden directories except `.scratch` and `.out-of-scope` (named hole). Do not `getFile()` / read skipped trees. Then call the existing walk. Keep the adapted tree for preview for this session only. Never store it as recents.
- **Chrome path:** Unchanged `showDirectoryPicker({ mode: "read" })`, walk, remember handle, re-prompt. `startIn` only when the current Load is a real Directory handle.
- **Chrome vs snapshot UX:** Snapshot shows a stall warning on that path. Recents stay hidden or unused when routing is `snapshot` or `unsupported`. Unsupported shows the explicit cannot-pick error (not “Chrome or Edge only”). Handle Load does not show the stall warning.
- **Unchanged:** Site markers, skip-by-name, named-hole `.out-of-scope`, Term hints, Paste preview, Skip, Take, Unresolved filter, Look, Stack, Archive, port 5420, one `public/`. Lodash for arrays and objects.

## Testing Decisions

A good test is external behaviour of **routing** and of **snapshot → same project payload as a handle walk**. Tests pass file lists (relative paths + contents) and flags (`isSafari`, `hasDirectoryPicker`). They do not open a browser, click `<input>`, or inspect IndexedDB. They do not re-prove Site-marker walk, Term hints, or GFM.

That is the **one seam** — the walk module. Two exports, same tests file as today’s handle fakes:

1. Routing: Safari → `unsupported` even if a picker exists; not Safari + picker → `handle`; not Safari without picker → `snapshot`.
2. Snapshot walk: a flat file list (including skipped trees, `.scratch`, `.out-of-scope`, `CONTEXT.md`) yields the same `sites` / `decisions` / `adrs` / `outOfScope` / `language` / `terms` / `projectName` as `walkProject` on an equivalent handle tree; skipped paths are not read for bytes; preview-read of a Map list path returns that file’s text.

What that seam must show:

- Routing table: the three results above; Chromium-like (not Safari) with picker is never `snapshot`.
- Snapshot of a root `CONTEXT.md` + `.scratch/effort/map.md` finds a Site and the Effort Map; `projectName` is the picked folder name.
- Files under `node_modules/` and `.git/` do not appear and their contents are not read.
- `.out-of-scope/rejected.md` is a Map list row; `.env` under a hidden dir that is not `.scratch` / `.out-of-scope` is omitted.
- Same fixture walked as a handle and as a snapshot: equal payload (aside from handle identity).
- Preview-read of `CONTEXT.md` after snapshot adapt returns that markdown.

Stall warning, Safari banner, Cancel, recents hidden, and Firefox HITL against Pages are not a second automated seam. No browser harness in this spec.

Prior art: walk tests that import client ESM under `node:test` and already fake directory handles. Prefer that shape. Do not add a Playwright/Cypress suite.

## Out of Scope

- Always-on, **Project path** Load, **Archive**, launchd, and port 5420.
- Safari as a supported hosted browser; `webkitdirectory` on Safari.
- Typed **Project path** on Pages; public-binding Hono; Electron; zip-the-tree Load.
- Persisting a **Directory snapshot** as recents or in IndexedDB.
- Dropping File System Access so every browser uses a snapshot.
- Mobile directory pickers as a product promise.
- Changing Map list chrome, Term hints, Paste preview, Skip, Take, Unresolved filter, Look, or Stack beyond Load routing and the stall warning.
- A custom domain, PWA, or GitHub-hosted maps.

## Further Notes

- Locks already recorded: **Directory snapshot** in [`CONTEXT.md`](../../CONTEXT.md); [ADR 0018](../../docs/adr/0018-hosted-directory-snapshot-fallback.md). This spec does not reopen them.
- HITL: Pages (or static `public/`) in Firefox — Load this repo, see Maps, refresh and pick again. Chrome — handle recents still restore. Safari — explicit error, no empty Tickets. Stock Brave — snapshot Load.
- Phillip implements app code. Lodash for arrays and objects.
