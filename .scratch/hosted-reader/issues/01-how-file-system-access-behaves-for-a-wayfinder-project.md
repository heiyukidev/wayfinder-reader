# How File System Access behaves for a Wayfinder Project

Type: research
Status: resolved
Blocked by:

## Question

In a page at a **public HTTPS origin** (not `127.0.0.1`), how does the File System Access API actually behave when the **Reader** must Load a Wayfinder **Project** from the visitor’s disk and walk it in the page?

Facts only. Do not pick the product shape — that is [Pick a folder and show a Map list from handles](04-pick-a-folder-and-show-a-map-list-from-handles.md) and [Ship a static Reader stub that Loads via directory picker](06-ship-a-static-reader-stub-that-loads-via-directory-picker.md).

Cover:

- `showDirectoryPicker` in `mode: "read"` vs `"readwrite"`: permission prompts, what each allows.
- Walking a chosen **Project** root: does `values()` / `getDirectoryHandle` see `.scratch/` and `CONTEXT.md` (dotfiles / hidden)? Does the macOS picker hide `.scratch` until ⌘⇧, and does that matter if the user picks the repo root rather than `.scratch` itself?
- Pruning while walking: skip `node_modules` and `.git`; skip other `.*` dirs except `.scratch` (same rule as `src/tree.js`). What happens if you do not skip — tab cost.
- Persisting a `FileSystemDirectoryHandle` in IndexedDB, restore on reload, `queryPermission` / `requestPermission`, Chrome 122+ “allow on every visit”, tab vs installed PWA. Can recents work without a POSIX **Project path**?
- `AbortError` on sensitive directories (Library, system dirs) vs Cancel — same exception or distinguishable?
- **Archive**: can the page `rename` / move a directory handle (`.scratch/<slug>/` → `.scratch/.archive/<slug>/`) with `readwrite`? What API (`move`, `remove`, write a copy)? Cross-directory move into `.archive/` if that folder does not exist yet?
- Secure context: GitHub Pages HTTPS vs `http://127.0.0.1` (already known from [How a local web app selects a folder on disk](../../.archive/map-reader/issues/03-how-a-local-web-app-selects-a-folder-on-disk.md) — do not restate that note; this ticket is the in-page walk, not “can Node get a path”).

Write the note at `.scratch/hosted-reader/research/01-how-file-system-access-behaves-for-a-wayfinder-project.md`.

## Answer

File System Access can Load a **Project** in the page without a POSIX **Project path**. Pick the **repo root** with `showDirectoryPicker({ mode: "read" })`, then walk `values()`. `.scratch/` and `CONTEXT.md` are visible to the walk even when the macOS picker hides dotfolders (⌘⇧. only matters if the user must select `.scratch` itself). Skip `node_modules` / `.git` / other `.*` dirs except `.scratch` **by name** before recurse; do not `getFile()` on skipped trees. Recents: IndexedDB handle + `handle.name`; after reload `queryPermission` is typically `"prompt"` and `requestPermission` needs a gesture. Chrome 122+ “Allow on every visit” (or a PWA) persists; a Pages tab is not a PWA. `AbortError` is Cancel and sensitive-directory abort — same exception. **Archive cannot be a directory rename on Chromium:** `FileSystemDirectoryHandle.move` is not shipped. Creating `.archive/` works under `readwrite`; moving `.scratch/<slug>/` into it does not. Copy+delete is possible but not atomic; that is [How to Archive when Chromium cannot rename directories](10-how-to-archive-when-chromium-cannot-rename-directories.md).

Full note: [research/01-how-file-system-access-behaves-for-a-wayfinder-project.md](../research/01-how-file-system-access-behaves-for-a-wayfinder-project.md).
