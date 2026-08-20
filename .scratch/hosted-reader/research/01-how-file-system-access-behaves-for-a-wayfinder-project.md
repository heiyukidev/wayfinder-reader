# How File System Access behaves for a Wayfinder Project

Facts for [How File System Access behaves for a Wayfinder Project](../issues/01-how-file-system-access-behaves-for-a-wayfinder-project.md). Does not pick a product shape — that is [Pick a folder and show a Map list from handles](../issues/04-pick-a-folder-and-show-a-map-list-from-handles.md) and [Ship a static Reader stub that Loads via directory picker](../issues/06-ship-a-static-reader-stub-that-loads-via-directory-picker.md). **Archive** write mechanics that would follow from these facts are [Archive a Finished Effort from a directory handle](../issues/07-archive-a-finished-effort-from-a-directory-handle.md).

This note is the **in-page walk**: a **Reader** at a public HTTPS origin calls `showDirectoryPicker`, holds a `FileSystemDirectoryHandle` for a **Project**, and enumerates **Sites** / Efforts in the page. It is not “can Node get a POSIX **Project path**.” That split is prior art in [How a local web app selects a folder on disk](../../.archive/map-reader/research/03-how-a-local-web-app-selects-a-folder-on-disk.md): the handle has no absolute path.

**Captured:** 2026-08-20. Specs and Chromium IDL/source as of this date. Nothing was shipped, installed, or written under this origin.

## Shared facts

The File System Access pickers live in [WICG File System Access](https://wicg.github.io/file-system-access/). Walking, reading, creating, and deleting entries live in [WHATWG File System](https://fs.spec.whatwg.org/) (`[FS]`). Chromium implements both in `third_party/blink/renderer/modules/file_system_access/` (renderer) and `content/browser/file_system_access/` (browser).

`showDirectoryPicker`, `FileSystemHandle.queryPermission` / `requestPermission`, and directory iteration are **`[SecureContext]`**. GitHub Pages `github.io` sites created after 2016-06-15 are served over HTTPS automatically ([GitHub: Securing your GitHub Pages site with HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https)). `https:` origins are potentially trustworthy; so is `http://127.0.0.1` (loopback `127.0.0.0/8`) ([W3C Secure Contexts §3.1](https://w3c.github.io/webappsec-secure-contexts/#is-origin-potentially-trustworthy)). Both origins can show the picker. This ticket does not rest on localhost.

`FileSystemHandle.name` is the **last path component** of the locator, not a POSIX **Project path**. `FileSystemDirectoryHandle.resolve(child)` returns a list of relative names inside the chosen root, or `null` if the child is not under that root ([WHATWG FS](https://fs.spec.whatwg.org/#ref-for-dom-filesystemhandle-name), [Chrome FSA guide — Resolving the path](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access)).

This **Project** on disk has `CONTEXT.md`, `.scratch/`, `.git/`, and `node_modules/` (2 305 files in 227 directories, counted 2026-08-20). Those names are the walk targets below.

---

## 1. `showDirectoryPicker` — `mode: "read"` vs `"readwrite"`

`DirectoryPickerOptions.mode` defaults to `"read"` ([WICG §3](https://wicg.github.io/file-system-access/#directory-picker-options), [MDN `showDirectoryPicker`](https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker)).

The call requires **transient user activation**. Without a gesture the spec throws `SecurityError` ([WICG §3.1 verify that an environment is allowed to show a file picker](https://wicg.github.io/file-system-access/#local-fs-permissions)).

| `mode` | What the picker grants if the user selects and confirms | What the page may then do without another write prompt |
| --- | --- | --- |
| `"read"` (default) | At resolve time, permission state for that handle in `"read"` is `"granted"` ([WICG §3.1](https://wicg.github.io/file-system-access/#local-fs-permissions)). | `values()` / `keys()` / `entries()`, `getFileHandle(name)` / `getDirectoryHandle(name)` with `create: false`, `getFile()` then `file.text()` / `arrayBuffer()`. |
| `"readwrite"` | The user agent **may combine** read and write into one subsequent prompt ([WICG §3.5](https://wicg.github.io/file-system-access/#api-showdirectorypicker)). Chrome’s guide: pass `{ mode: 'readwrite' }` when you need write ([Chrome FSA — Opening a directory](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access)). | Everything in `"read"`, plus `getDirectoryHandle(name, { create: true })`, `getFileHandle(name, { create: true })`, `createWritable()`, `removeEntry()`, Chromium `FileSystemHandle.remove()`, and `FileSystemFileHandle.move()`. |

Write operations **request** `"readwrite"` if it is not already granted. Creating a child with `create: true` “requires write permission, even if the file/directory being returned already exists” and “could result in a prompt” ([WHATWG FS `getFileHandle` / `getDirectoryHandle`](https://fs.spec.whatwg.org/#api-filesystemdirectoryhandle-getdirectoryhandle)). `removeEntry` always requests `"readwrite"` ([WHATWG FS `removeEntry`](https://fs.spec.whatwg.org/#api-filesystemdirectoryhandle-removeentry)).

If the user dismisses the picker, or the permission state after the post-picker prompt is not `"granted"`, the promise rejects with **`AbortError`** ([WICG §3.5](https://wicg.github.io/file-system-access/#api-showdirectorypicker), [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker)). Same exception name as a sensitive-directory abort (section 5).

Chrome’s address-bar icon lists granted files/folders; the user can revoke ([Chrome FSA — Transparency](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access)). Asking `"read"` at Load and `"readwrite"` only later (via `requestPermission({ mode: "readwrite" })` on a gesture) is what the API allows; this note does not pick when the Reader asks.

---

## 2. Walking a chosen **Project** root: `.scratch/` and `CONTEXT.md`

### Enumeration includes dotfiles

`values()` / `entries()` / `keys()` iterate **all** children of that directory entry. The spec does not exclude names that start with `.` ([WHATWG FS §2.4.1](https://fs.spec.whatwg.org/#api-filesystemdirectoryhandle-async-iterable)). Chromium `GetEntries` calls `FileSystemOperationRunner::ReadDirectory` and skips only names that fail `IsSafePathComponent` (path separators, `.` / `..`, Windows reserved names, `.lnk` / `.url`, …) — **not** a leading dot ([`file_system_access_directory_handle_impl.cc` `DidReadDirectory`](https://raw.githubusercontent.com/chromium/chromium/main/content/browser/file_system_access/file_system_access_directory_handle_impl.cc)).

Chromium’s path-component check **explicitly allows** names starting with `.`, “for names like `.git`” ([`FileSystemAccessManagerImpl::IsSafePathComponent`](https://raw.githubusercontent.com/chromium/chromium/main/content/browser/file_system_access/file_system_access_manager_impl.cc)). `.scratch` and `CONTEXT.md` are valid file names under [WHATWG FS](https://fs.spec.whatwg.org/#valid-file-name) (not `""`, `"."`, or `".."`; no `/`).

So after the user grants a **Project** root:

- `for await (const entry of root.values())` can yield a directory named `.scratch` and a file named `CONTEXT.md`.
- `root.getDirectoryHandle('.scratch')` and `root.getFileHandle('CONTEXT.md')` with `create: false` need only `"read"`.

### The macOS picker hides `.scratch` until ⌘⇧.

Chrome’s directory picker on macOS is an `NSOpenPanel` ([Chromium `select_file_dialog_bridge.mm`](https://chromium.googlesource.com/chromium/src/+/master/components/remote_cocoa/app_shim/select_file_dialog_bridge.mm)). AppKit:

> If `showsHiddenFiles` is set to `YES`, files that are normally hidden from the user are displayed. … The user may invoke the keyboard shortcut (cmd-shift-.) to show or hide hidden files. … The default value is `NO`.

(`NSSavePanel.h` on this Mac, MacOSX.sdk AppKit; property shared by `NSOpenPanel`.)

`.scratch` is a dot-directory. In the picker it is **hidden until the user toggles hidden files** (⌘⇧.). `CONTEXT.md` is not hidden; it shows as a normal file. The picker selects a **directory**, so the user cannot pick `CONTEXT.md` itself as the **Project**.

### Picking the repo root vs picking `.scratch`

If the user selects the **Project** root (the folder that contains both `CONTEXT.md` and `.scratch/`), the picker never needed to display `.scratch`. The walk still sees it. That is the Load the map describes (ADR 0010 markers on the chosen root).

If the user instead selects `.scratch` itself, they must make it visible (⌘⇧.) or type its name. The returned `handle.name` is then `.scratch`, not the repo folder name. Descendant handles still have no POSIX **Project path**.

Safari `webkitdirectory` omitting hidden files is a different API; this ticket is FSA `values()` / `getDirectoryHandle`. (Safari does not ship these pickers.)

---

## 3. Pruning while walking (`src/tree.js` rule)

This repo’s walk skip (`src/tree.js`): `SKIP_DIRS` is `node_modules` and `.git`. `isHiddenDir` is any name starting with `.` except `.scratch`. `shouldSkipDir` is the union.

Applied at every directory: skip `node_modules` and `.git`; skip other `.*` directories **except** `.scratch`. That also skips `.scratch/.archive` and a Site’s `.out-of-scope` **during enumeration**. The Hono Reader still lists `.out-of-scope` via a **named** path in `listProjectDocs`, not via this skip walk. A handle walk that only copies `shouldSkipDir` would not see `.archive/` or `.out-of-scope/` unless it `getDirectoryHandle`s those names.

### Skip by name without reading bytes

Yes. `values()` yields `FileSystemHandle`s with `kind` and `name` only. Creating those handles does not snapshot file bytes ([WHATWG FS §2.4.1](https://fs.spec.whatwg.org/#api-filesystemdirectoryhandle-async-iterable) — child handle from child’s name). `getFile()` is the step that copies the file’s binary data into a `File` ([WHATWG FS `getFile`](https://fs.spec.whatwg.org/#api-filesystemfilehandle-getfile)). Chrome: only call `getFile()` when you need size/contents; sequential `await getFile()` is the slow path ([Chrome FSA — Opening a directory](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access)).

To prune: if `entry.kind === 'directory' && (entry.name === 'node_modules' || entry.name === '.git' || (entry.name.startsWith('.') && entry.name !== '.scratch'))`, do not recurse; do not `getFile()`. `getDirectoryHandle('.scratch')` by name also avoids listing siblings you will skip.

FSA does **not** enumerate the whole tree at pick time. That cost is the page’s walk. (`webkitdirectory` *does* eagerly list; that is the other API.)

### Tab cost if you do not skip `node_modules`

Each child is a browser-process directory read plus a renderer handle. Recursing into `node_modules` visits every nested package file. On **this** Project that is 2 305 files / 227 dirs (2026-08-20). A larger JS **Project** is typically one or two orders of magnitude more. Chrome’s own guide treats per-file `getFile()` as something to parallelize because it is expensive. Unpruned recursion plus `getFile()` on every file is the tab-jank case. Skipping the directory by `name` before recurse avoids that IPC and those bytes.

`.git` is the same shape (many small files) and is already in `SKIP_DIRS`. Chromium additionally **blocks write** to `*/.git/hooks` on Windows (`kBlockWrite` in the FSA blocklist); read of `.git` is still possible if you do not skip it.

---

## 4. Persisting a handle, recents, permissions (no **Project path**)

`FileSystemHandle` is a **serializable object**. Serialization stores origin + locator, not a POSIX path ([WHATWG FS](https://fs.spec.whatwg.org/#filesystemhandle)). IndexedDB structured-clone can store it. Chrome documents storing file and directory handles in IndexedDB and restoring them ([Chrome FSA — Storing file handles or directory handles in IndexedDB](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access)).

A restored handle’s `"read"` permission is **likely `"prompt"`**, not `"granted"`. The spec: “a handle retrieved from IndexedDB is also likely to return `"prompt"`” ([WICG `queryPermission`](https://wicg.github.io/file-system-access/#api-filesystemhandle-querypermission)). Chrome’s `verifyPermission` pattern: `queryPermission`, then `requestPermission` on a user gesture ([Chrome FSA — Stored file or directory handles and permissions](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access)). `requestPermission` without transient activation throws `SecurityError` ([WICG §2.2](https://wicg.github.io/file-system-access/#permissions)).

**Chrome 122+ “allow on every visit”** ([Chrome Developers: Persistent permissions for the File System Access API](https://developer.chrome.com/blog/persistent-permissions-for-the-file-system-access-api)):

| Surface | Behavior |
| --- | --- |
| Ordinary tab, first grant | Session access (“Allow this time”). Access lasts until the last tab of the origin is closed ([Chrome FSA — Permission persistence](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access)). |
| Tab, later visit, handle restored from IndexedDB, then `requestPermission()` | Three-way prompt: **Allow this time** / **Allow on every visit** / **Don't allow**. Preconditions: a previous grant, stored handles, **all tabs of the origin closed** before this visit (immediate reload does not trigger it). The prompt lists **all** previously granted handles, not only the one you asked about. |
| Installed PWA | Persistent access after the first grant. The three-way prompt is **not** shown; persistence is the default. |
| Denied / dismissed three times | Falls back to the regular (non-three-way) permission prompt. |

Recents **can** work without a POSIX **Project path**: persist the `FileSystemDirectoryHandle`, show `handle.name` (last segment) as the label, and on click `queryPermission` / `requestPermission` then walk. There is no path string to store. Two **Projects** whose folder basenames collide (`wayfinder-reader` vs another `wayfinder-reader`) are distinguishable with `isSameEntry`, not with `name`. Clearing site data drops IndexedDB handles; there is then nothing to re-prompt for ([WICG §5.2](https://wicg.github.io/file-system-access/#privacy-tracking)).

A GitHub Pages tab is not an installed PWA. Without “Allow on every visit”, recents can list names but each Load still needs a gesture and a prompt. That is expected, not a missing path.

---

## 5. `AbortError`: Cancel vs sensitive directories

The spec uses **the same exception** in three picker failures ([WICG §3.5](https://wicg.github.io/file-system-access/#api-showdirectorypicker), [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker)):

1. User dismissed the prompt without a selection.
2. Entry deemed too sensitive or dangerous (UA may instead send the user back to the picker).
3. Post-picker permission state is not `"granted"`.

They are not distinguishable by `DOMException.name`. Both are `"AbortError"`. The spec does not define a separate `code` or `message` contract.

Chromium blocklist (macOS excerpt): entire home / Desktop / Documents / Downloads as **roots** (`kDontBlockChildren` — children inside them are allowed); `~/Library` is `kBlockAllChildren`; exceptions under Library for `CloudStorage`, `Containers`, `Mobile Documents`; also `~/.ssh`, `~/.gnupg`, Applications, Chrome’s own bundle ([`chrome_file_system_access_permission_context.cc` `kBlockPaths`](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/chrome/browser/file_system_access/chrome_file_system_access_permission_context.cc)). Chrome’s guide names “macOS Library folders” as restricted and says the browser **shows a prompt and asks the user to choose a different folder** ([Chrome FSA — Restricted folders](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access)).

That prompt is `ShowFileSystemAccessRestrictedDirectoryDialog`: **OK → `kTryAgain`** (pick again, page sees no rejection yet), **Cancel / close → `kAbort`** (“Abandon entirely, as if picking was cancelled”) ([`file_system_access_restricted_directory_dialog.cc`](https://raw.githubusercontent.com/chromium/chromium/main/chrome/browser/ui/file_system_access/file_system_access_restricted_directory_dialog.cc); enum in [`file_system_access_permission_context.h`](https://chromium.googlesource.com/chromium/src/+/673a5aee77ad12e118c8edac73359acdeb7f491c/content/public/browser/file_system_access_permission_context.h)). From JavaScript, Cancel on the original picker and Cancel on the “this folder is restricted” dialog are the same `AbortError`. A **Project** under `~/Desktop/js/...` is a child of Desktop, so it is not blocked by the Desktop-root rule.

---

## 6. **Archive**: rename/move `.scratch/<slug>/` → `.scratch/.archive/<slug>/`

This is the blocking API fact for [Archive a Finished Effort from a directory handle](../issues/07-archive-a-finished-effort-from-a-directory-handle.md). The Hono Reader does `fs.mkdirSync(archiveRoot)` then `fs.renameSync(live, dest)` ([`src/archive.js`](../../../src/archive.js)). ADR 0007 is that same directory move after confirm.

### What is specified vs what Chromium ships

| API | WHATWG FS (living standard, last updated 2026-03-15) | Chromium Blink IDL (main, this capture) | Chrome FSA guide (2024-08-19) |
| --- | --- | --- | --- |
| `FileSystemFileHandle.move(...)` | **Not in the spec IDL.** [whatwg/fs#10](https://github.com/whatwg/fs/pull/10) added a method; directory-move semantics remain entangled with [whatwg/fs#59](https://github.com/whatwg/fs/issues/59) (path-based vs reference-based handles). | **Shipped** on `FileSystemFileHandle` (three overloads: rename, reparent, both). | Documents `move()` on `FileSystemHandle` for “files and folders”. |
| `FileSystemDirectoryHandle.move(...)` | Same: not in the living standard. | **Not on the directory IDL.** `FileSystemHandle.move` exists only behind `FileSystemAccessAPIExperimental`, with `TODO(crbug.com/1250534): Measure these methods once directory moves are supported.` | Same paragraph as files — **ahead of the IDL**. |
| `removeEntry(name, { recursive })` | Specified. Needs `"readwrite"`. Recursive delete of a non-empty directory. Can fail **non-atomically**. | Shipped. | Documented. |
| `FileSystemHandle.remove({ recursive })` | **Not specified.** MDN: non-standard, [whatwg/fs#9](https://github.com/whatwg/fs/issues/9). | Shipped on `FileSystemHandle`. | Documented. |
| `getDirectoryHandle(name, { create: true })` | Specified. Needs `"readwrite"` even if the directory already exists. | Shipped. | Documented. |

Chromium **removed** directory `move`/`rename` from the web API (“Move and rename will only be supported for `FileSystemFileHandle`s. See crbug.com/1250534”). Intent to Ship for **local file** `FileSystemFileHandle.move()` (M111) stated: “Directory moves are being punted for now while we resolve inter-op issues” ([blink-dev I2S](https://groups.google.com/a/chromium.org/g/blink-dev/c/ogS8CeyZ3n8)). [WICG/file-system-access#413](https://github.com/WICG/file-system-access/issues/413) is still the open feature request; Chromium engineer (2023-06-20): “directory moves are still not supported on Chromium browsers.” The browser-process C++ handle still has `Move`/`Rename` methods; they are not exposed on `FileSystemDirectoryHandle` in JavaScript.

**In Chrome/Edge, `effortDir.move(archiveDir)` / `effortDir.move('.archive-name')` is not a shipped API.** `'move' in FileSystemDirectoryHandle.prototype` is false (MDN BCD discussion of the IDL split).

### Cross-directory move into `.archive/` if that folder does not exist

Creating the destination **is** specified: from the `.scratch` directory handle, `getDirectoryHandle('.archive', { create: true })` after `"readwrite"` is granted. `.archive` is a legal name (leading-dot allowed; see §2). Then you still cannot `move` the Effort directory into it on Chromium.

What the APIs **can** do instead (facts, not a product pick):

1. **Copy then delete:** create dest with `create: true`; for each file, `getFile()` + `getFileHandle(..., { create: true })` + `createWritable()`; then `removeEntry(slug, { recursive: true })` on `.scratch`. Not a rename. `removeEntry` recursive “can fail non-atomically. Some files or directories might have been removed while other files or directories still exist” ([WHATWG FS](https://fs.spec.whatwg.org/#api-filesystemdirectoryhandle-removeentry)). Ticket 07: do not silently copy+delete without a named objection.
2. **File-only `move`:** `FileSystemFileHandle.move(destDir, name)` can reparent **files** into an existing `.archive/<slug>/` after you created that tree. Directories still have no `move`.
3. **`remove` / `removeEntry`:** delete, not Archive. ADR 0007 rejects `rm`.

Collision suffix (`slug-2`, …) as in `src/archive.js` is application logic on names, not an FSA primitive.

---

## 7. Secure context: GitHub Pages HTTPS vs `http://127.0.0.1`

| Origin | Potentially trustworthy? | `showDirectoryPicker` |
| --- | --- | --- |
| `https://<owner>.github.io/...` | Yes (`https:` scheme). Pages after 2016-06-15 on `github.io` are HTTPS automatically; “Enforce HTTPS” redirects HTTP → HTTPS. | Yes, in Chromium desktop, with a user gesture. |
| `http://127.0.0.1:5420` | Yes (loopback `127.0.0.0/8`). | Yes, same API. Being localhost does not add a POSIX path to the handle. |
| `http://example.com` | No. | No (`SecureContext`). |

Safari and Firefox do not ship local-disk `showDirectoryPicker`. That is a browser matrix fact, not a Pages fact.

---

## What would block Archive or recents

- **Archive (blocks a handle-native rename):** Chromium does not expose directory `move`. WHATWG FS has no `move` in the living standard. Chrome’s capabilities article still describes folder `move()`; the IDL and I2S do not. Creating `.archive/` with `create: true` works under `"readwrite"`. Moving `.scratch/<slug>/` into it as a directory does not, unless a later Chrome ships directory `move` or the product accepts copy+delete (ticket 07 currently forbids silent copy+delete).
- **Recents (does not need a Project path; does need a gesture):** IndexedDB can store the handle and `handle.name` is enough to label a row. After reload, `queryPermission` is typically `"prompt"`. A Pages **tab** must `requestPermission` on a click. “Allow on every visit” (Chrome 122+) persists grants only after the three-way prompt’s preconditions (or an installed PWA). Immediate reload does not show that prompt. Basename collisions need `isSameEntry`, not a path. Cleared site data wipes recents.

---

## Sources

- [WICG File System Access](https://wicg.github.io/file-system-access/) (Draft, 10 October 2025): `mode`, permission algorithms, picker steps, `AbortError`, sensitive directories, IndexedDB/`queryPermission` note, serializable handles, third-party/postMessage limits.
- [WHATWG File System](https://fs.spec.whatwg.org/) (Living Standard, 15 March 2026): `name` / `kind`, serializable locators (no POSIX path), directory iteration, `getDirectoryHandle` / `getFileHandle` / `create` + write permission, `getFile` copies bytes, `removeEntry`, `resolve`, valid file names. **No `move`.**
- [MDN `showDirectoryPicker`](https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker), [`FileSystemHandle.name`](https://developer.mozilla.org/en-US/docs/Web/API/FileSystemHandle/name), [`removeEntry`](https://developer.mozilla.org/en-US/docs/Web/API/FileSystemDirectoryHandle/removeEntry), [`FileSystemHandle.remove`](https://developer.mozilla.org/en-US/docs/Web/API/FileSystemHandle/remove) (non-standard), [Secure contexts](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts).
- [Chrome: The File System Access API](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access) (updated 2024-08-19): IndexedDB examples, `verifyPermission`, directory `values()`, `create: true`, `removeEntry` / `remove` / `move` (docs include folders; see IDL gap in §6), restricted folders, permission persistence until last tab closes.
- [Chrome: Persistent permissions for the File System Access API](https://developer.chrome.com/blog/persistent-permissions-for-the-file-system-access-api) (Chrome 122): three-way prompt, “Allow on every visit”, PWA auto-persist, IndexedDB + `requestPermission` preconditions, close-all-tabs.
- Chromium IDL: [`file_system_directory_handle.idl`](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/third_party/blink/renderer/modules/file_system_access/file_system_directory_handle.idl) (no `move`), [`file_system_file_handle.idl`](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/third_party/blink/renderer/modules/file_system_access/file_system_file_handle.idl) (`move` shipped), [`file_system_handle.idl`](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/third_party/blink/renderer/modules/file_system_access/file_system_handle.idl) (`move` experimental; crbug 1250534).
- Chromium source: [`IsSafePathComponent` leading-`.` allowed for `.git`](https://raw.githubusercontent.com/chromium/chromium/main/content/browser/file_system_access/file_system_access_manager_impl.cc); [`GetEntries` / `DidReadDirectory`](https://raw.githubusercontent.com/chromium/chromium/main/content/browser/file_system_access/file_system_access_directory_handle_impl.cc); [`kBlockPaths` including macOS `Library`](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/chrome/browser/file_system_access/chrome_file_system_access_permission_context.cc); [restricted-directory dialog `kTryAgain` / `kAbort`](https://raw.githubusercontent.com/chromium/chromium/main/chrome/browser/ui/file_system_access/file_system_access_restricted_directory_dialog.cc).
- [blink-dev Intent to Ship: `FileSystemFileHandle.move()` for local files](https://groups.google.com/a/chromium.org/g/blink-dev/c/ogS8CeyZ3n8) (directory moves punted). [WICG issue 413](https://github.com/WICG/file-system-access/issues/413) (directory `move` still unsupported on Chromium). [whatwg/fs#59](https://github.com/whatwg/fs/issues/59).
- [W3C Secure Contexts §3.1](https://w3c.github.io/webappsec-secure-contexts/#is-origin-potentially-trustworthy): `https:` and `127.0.0.0/8`.
- [GitHub Pages HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https).
- Apple AppKit `NSSavePanel.showsHiddenFiles` (this Mac, MacOSX.sdk): default `NO`; user shortcut cmd-shift-. . Chromium picker uses `NSOpenPanel`.
- This repo: `src/tree.js` skip rule; `src/archive.js` `mkdir` + `rename`; this disk’s `CONTEXT.md`, `.scratch/`, `node_modules/` counts.
- Prior art (once): [How a local web app selects a folder on disk](../../.archive/map-reader/research/03-how-a-local-web-app-selects-a-folder-on-disk.md) — no POSIX path on the handle.
