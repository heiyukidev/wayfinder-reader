# 01: Hosted Load is a Directory handle or a Directory snapshot

**What to build:** On the hosted origin, Load a **Project** with a **Directory handle** when File System Access exists (Chrome, Edge, Brave with the flag) and keep recents as handles. Otherwise Load a **Directory snapshot**: one-shot folder pick of the **Project** root, **Map list** and preview the same as handle Load, session only. Warn that a large repo can stall. Recents stay hidden or unused on that path. Safari never gets the folder pick — explicit cannot-pick error, not empty Tickets. Cancel leaves the session. A later pick replaces it. Always-on is untouched.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Hosted routing: Safari → unsupported even if a picker exists; not Safari + `showDirectoryPicker` → **Directory handle**; not Safari without it → **Directory snapshot**. Chrome and Brave are never classified as Safari. Always-on is detected first and never consults this routing
- [x] Snapshot file list (relative paths + contents) walks to the same `sites` / `decisions` / `adrs` / `outOfScope` / `language` / `terms` / `projectName` as a handle walk of the same tree; `.scratch` and `.out-of-scope` are kept; `node_modules`, `.git`, and other hidden dirs are omitted and not read for bytes; preview-read of a Map list path returns that file’s text
- [x] Firefox or stock Brave on Pages: Load picks the **Project** root, Map list and GFM preview work, folder name shows in chrome, no **Project path** field, Skip / Take / **Term hints** / **Paste preview** / **Unresolved filter** still work. Init does not claim the Reader needs only Chrome or Edge
- [x] Snapshot path warns that a large repo can take a while; handle Load does not. Recents stay handle-only (hidden or unused on snapshot / unsupported). Snapshot is not stored. Refresh requires picking again
- [x] Safari: explicit cannot-pick error; folder pick is not used. Cancel / empty selection is a no-op. A second snapshot Load replaces the first. Empty or non-Wayfinder folder is an empty Map list, not the unsupported error
- [x] Tests cover routing and snapshot-equals-handle-walk on the walk module (file lists + flags). They do not drive the browser. HITL: Firefox Pages Load of this repo; Chrome recents still restore; Safari error with no empty Tickets; Always-on path Load unchanged
