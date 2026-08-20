# Pick a folder and show a Map list from handles

Type: prototype
Status: resolved
Blocked by:

**What to build:** A cheap, rough page that calls `showDirectoryPicker`, walks the directory handle with **Site** markers, and renders something a human can react to as a **Map list** (not a filesystem dump). Unpolished. Link the prototype as an asset. Do not host on Pages. Do not delete Hono.

- [x] User gesture opens `showDirectoryPicker` (`mode: "read"`); pick the **Project** root (the folder that contains `CONTEXT.md` / `.scratch`), not `.scratch` itself
- [x] Walk skips `node_modules`, `.git`, and hidden dirs except `.scratch` **by name** before recurse; do not `getFile()` on skipped trees
- [x] **Sites** appear from `CONTEXT.md` and/or `.scratch/` (ADR 0010). `.out-of-scope` is a named hole, not something the skip-walk will list
- [x] Effort outline is visible enough to judge (Maps / Specs / Tickets by title, not filenames)
- [x] Load this repo as the **Project** and at least one other real Project (e.g. `Desktop/js/dnd-heiyuki`)
- [x] Record what broke: picker vs walk for `.scratch`, permission re-prompt after reload, walk cost, `AbortError` (Cancel and restricted folders are the same exception), missing POSIX path in chrome

## Assets

- Prototype (throwaway): [prototypes/map-list-from-handles.html](../prototypes/map-list-from-handles.html)
- Run: `npm run prototype:handles` → http://127.0.0.1:5421/ (Chrome or Edge). Not Pages. Hono on 5420 is untouched.

## Answer

The handle walk is the Load. Khaled: logic seems solid.

Pick the **Project** root (`showDirectoryPicker`, `mode: "read"`). Walk **Site** markers (`CONTEXT.md` and/or `.scratch/`). Skip `node_modules`, `.git`, and other hidden dirs except `.scratch` **by name** before recurse; do not `getFile()` on skipped trees. `.out-of-scope` is a named hole. The outline is a **Map list** (titles, not filenames). Recents are the handle; chrome has no POSIX **Project path**.

Awkward cases behaved as the research said — they are not model bugs: picking `.scratch` itself is the wrong folder (`handle.name` is `.scratch`; Effort `CONTEXT.md` is not a Site); Cancel and a restricted folder are the same `AbortError`; restore after reload re-prompts; walk cost stays in bounds when skip-by-name holds.

Ship that walk into the static **Reader** in [Ship a static Reader stub that Loads via directory picker](06-ship-a-static-reader-stub-that-loads-via-directory-picker.md). Keep the HTML shell as the primary source; do not promote the prototype page.
