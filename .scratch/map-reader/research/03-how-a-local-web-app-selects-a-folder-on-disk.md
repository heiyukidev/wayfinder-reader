# How a local web app selects a folder on disk

**Ticket:** [03-how-a-local-web-app-selects-a-folder-on-disk](../issues/03-how-a-local-web-app-selects-a-folder-on-disk.md)
**Captured:** 2026-08-18
**Context:** Reader UI at `http://127.0.0.1:5420` must let Khaled pick a **Project** folder so a local JS **server** can `readFile` / `readdir` inside it, and remember that path across restarts.

## Verdict

A browser page talking to `127.0.0.1:5420` **cannot** turn a folder picker into a POSIX path the Node server can use. `showDirectoryPicker` / File System Access API and `<input webkitdirectory>` give the *browser* handles or `File` blobs. They never expose the absolute path, by design.

The server gets a real filesystem path if and only if one of these happens:

1. The user **types or pastes** an absolute path, and the page POSTs that **string** to the server.
2. A **native** process shows an OS folder dialog and returns `filePaths` / a POSIX path — Electron `dialog.showOpenDialog({ properties: ['openDirectory'] })`, or a Node-spawned `osascript` `choose folder` (macOS) without Electron.
3. Electron-only bridge: `webUtils.getPathForFile(file)` on a `File` from an `<input>` or drop. This is not available in Chrome or Safari.

For this Reader (Node on 5420, UI in Chrome or Safari, remember last Project, read `.scratch/` which is a hidden directory), **path-as-string** is the mechanism that matches the destination. A native dialog is optional UX on top of that string, not a substitute for storing a path.

---

## Sources

- MDN: [showDirectoryPicker](https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker), [File System API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API), [webkitdirectory](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/webkitdirectory), [webkitRelativePath](https://developer.mozilla.org/en-US/docs/Web/API/File/webkitRelativePath), [Secure contexts](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts)
- Chrome: [File System Access API](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access), [Persistent permissions](https://developer.chrome.com/blog/persistent-permissions-for-the-file-system-access-api)
- Can I use: [File System Access API](https://caniuse.com/native-filesystem-api) (Chrome 105+ yes; Safari and Firefox **no** pickers)
- WebKit: [OPFS only](https://webkit.org/blog/12257/the-file-system-access-api-with-origin-private-file-system/) — Safari ships Origin Private File System, not local-disk pickers. WebKit [directory upload](https://trac.webkit.org/changeset/221177/webkit) **skips hidden files and symlinks**.
- Specs: [File System Access](https://wicg.github.io/file-system-access/), [Entries API](https://wicg.github.io/entries-api/)
- Electron: [dialog](https://www.electronjs.org/docs/latest/api/dialog), [webUtils.getPathForFile](https://www.electronjs.org/docs/latest/api/web-utils) (replaces removed `File.path` in Electron 32+)
- Privacy (WICG / Stack Overflow): the absolute path is **not** on `FileSystemDirectoryHandle` and will not be added; relative names only.

---

## The split that matters

| Who has the bytes | What they can store | Can Node `fs.readFile` later? |
| --- | --- | --- |
| Browser handle / `File` blob | IndexedDB handle, or uploaded blobs | **No** — no POSIX path crosses the process boundary |
| Node process | Absolute path string | **Yes** — if the OS lets that process read the tree |

The destination (“remember last Project path”, “never serve a path outside the chosen Project”) is a **server-side path** contract. Browser-only APIs cannot fulfill it unless you also copy the whole tree onto a disk the server owns (a one-shot upload, not a live Project).

`http://127.0.0.1:5420` **is** a [potentially trustworthy origin](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts) (loopback). Chrome will treat it as a secure context, so File System Access pickers work **without HTTPS**. Safari still does not ship those pickers. Being localhost does not punch a hole in the “no absolute path” rule.

---

## 1. `showDirectoryPicker` / File System Access API

**What you get:** `FileSystemDirectoryHandle`. You walk `dirHandle.values()`, `getFileHandle(name)`, `getFile()`, then read blobs in the page.

**Does the server get a POSIX path?** **No.** `handle.name` is the last path segment (e.g. `wayfinder-reader`). `directoryHandle.resolve(fileHandle)` returns a **relative** name array inside the chosen root. Spec authors have refused to expose the full path (privacy: `/Users/khaledromdhane/...` leaks home-directory layout).

**Who can use it:** Chromium desktop (Chrome 86+ / 105+ stable, Edge, Opera). **Safari: not supported** (any current macOS/iOS version; WebKit position: oppose, security). **Firefox: not supported** (Mozilla position: harmful). Brave: behind a flag.

**Electron:** Chromium pickers exist in the renderer, but they still do not yield a path. Use `dialog.showOpenDialog` instead (section 5). Electron also has extra friction: Chromium blocklists (Desktop / Documents / Downloads / Library) can `AbortError` the picker; recent Electron can override via `session` `file-system-access-restricted`.

**Permissions / UX (Chrome):**

- Requires a **user gesture** (`SecurityError` if called from a timer).
- `mode: "read"` is enough for this Reader; do not ask `readwrite`.
- Handles are serializable: store in IndexedDB, restore on reload. Permissions are **not** always still granted. After restore, `queryPermission()` is often `"prompt"`; you must `requestPermission()` on a gesture. Chrome 122+ can offer a three-way “allow this time / allow on every visit” prompt if the origin previously had a grant; **installed PWAs** persist more readily. A random `http://127.0.0.1:5420` tab is not an installed app.
- Chrome may refuse “sensitive” directories (macOS Library, Windows system dirs) with `AbortError` — same exception as Cancel.
- Hidden folders (`.scratch`, `.git`) are usually **invisible in the NSOpenPanel-style picker** until the user toggles them with **⌘⇧.** (Command-Shift-Period). Once a parent is granted, walking `values()` can still see dotfiles; the trap is **selecting** `.scratch` itself in the dialog.

**Bridge to Node?** None in a normal browser. The page could `fetch` file **contents** to `:5420`, but that is an upload of blobs, not a Project path. The server cannot re-open the folder tomorrow from a handle it never received.

---

## 2. `<input type="file" webkitdirectory>`

**What you get:** a flat `FileList`. Each `File` has `name` (basename) and `webkitRelativePath` (relative, `/`-separated, includes the selected folder name as the first segment). `input.value` is the fake `C:\fakepath\...` string, not a disk path.

**Does the server get a POSIX path?** **No.** Posting the `File`s as `FormData` gives the **server copies of file bytes**, plus relative names. There is no `/Users/.../project`.

**Who can use it:** Chrome, Edge, Firefox, **Safari 11.1+ on macOS**. This is the only folder picker that works in Safari.

**UX traps:**

- The picker is a directory chooser, then the browser **eagerly lists the entire tree** into memory. A JS Project with `node_modules` can freeze the tab or produce a multi-GB upload. Client-side filtering helps only after the browser has already enumerated.
- **Safari historically skips hidden files and symbolic links** when resolving a directory upload (WebKit changeset 221177). Wayfinder maps live under **`.scratch/`**. If the user picks the **Project root** in Safari, `.scratch/**` may simply not appear in `input.files`. Chrome includes hidden files. This is a Safari vs Chrome split that would silently empty the Reader.
- macOS picker still hides dot-directories until ⌘⇧.
- One-shot: refresh the page and the `FileList` is gone. There is no handle to persist.
- Drag-and-drop of a folder onto the page is the same family of API (Entries API / `webkitGetAsEntry`). Still no absolute path.

**When it would be the right model:** a hosted web app that must ingest a snapshot. It is the wrong model for “leave a Node process watching a Project on disk.”

---

## 3. Typing / pasting an absolute path

**What you get:** a string, e.g. `/Users/khaledromdhane/Desktop/js/wayfinder-reader`. The page sends it to the server. The server `stat`s it, persists it, and `readFile`s under that root.

**Does the server get a POSIX path?** **Yes.** This is the important contrast with (1) and (2).

**Who can use it:** every browser. No picker API, no secure-context restriction.

**UX:**

- Finder: select the folder, **⌥⌘C** (Copy as Pathname) on recent macOS, or hold **Option** while right-clicking → Copy as Pathname. Dragging the folder onto a Terminal window also pastes the path.
- Users will paste a trailing slash, a `~` that Node will **not** expand unless you do it, a path with spaces, or a file instead of a directory. Normalize (`realpath`, reject if not a directory).
- A text field cannot browse; pair it with (4) listing after submit, and optionally (5)/(5b) for a real dialog.

**macOS permissions:** the **Node process** is the reader, not Chrome. See [TCC](#macos-tcc). If Terminal already has Files and Folders access, a `node` child of Terminal typically can read `~/Desktop`. A `launchd` job running `/usr/local/bin/node` may get empty listings / `EPERM` with no prompt.

**Security (localhost still matters):** anyone who can hit `127.0.0.1:5420` can submit `/etc/passwd` or another user’s files the Node uid can read. Bind loopback only; require a same-origin UI; resolve and confine all reads to the chosen Project (`path.resolve` + prefix check; never follow `..` out). That is the map’s “Never serve a path outside the chosen Project” lock.

---

## 4. Server-side directory listing from that path

This is not a picker. It is what you do **after** you have a path.

**Does the server get a POSIX path?** It already has one. `fs.readdir` / `fs.readFile` / `fs.watch` work on it. Hidden directories including `.scratch` are visible to Node unless you filter them.

**UX:** after POST, return a tree for the sidebar. Errors: `ENOENT` (typo), `ENOTDIR`, `EACCES` / empty dir because of TCC (often looks like “folder is empty”).

**Live vs snapshot:** because the server holds the path, it can re-read on each click (and later live-reload if ticket 07 wants it). Browser handles can also re-read **in the page**, but not through Node.

---

## 5. Native open-dialog — Electron

```js
const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
  properties: ['openDirectory'],
});
// filePaths[0] === '/Users/khaledromdhane/Desktop/js/wayfinder-reader'
```

**Does the server get a POSIX path?** **Yes.** `filePaths` is an array of absolute paths. Cancel → `canceled: true`, `filePaths: []`.

**Does this require Electron?** **This API does.** It runs in the **main** process (`dialog` is not available in a Chrome tab). The UI cannot be “just Safari/Chrome against 5420” unless that Electron app *is* the shell.

On macOS this is NSOpenPanel (`canChooseDirectories`). Hidden folders: same ⌘⇧. toggle. `showHiddenFiles` is a documented Electron property (macOS/Windows).

**Packaging traps:**

- Unpackaged `electron` from `node_modules` is a different TCC identity than a signed `.app`.
- Mac App Store / sandbox: you need **security-scoped bookmarks** (`securityScopedBookmarks: true` on `showOpenDialog`) to reopen the folder after quit. A non-sandboxed local app usually does not.
- `Info.plist` usage strings (`NSDesktopFolderUsageDescription`, Documents, Downloads) so TCC can prompt instead of silently denying.
- Electron 32+ removed renderer `File.path`. If you use `<input>` inside Electron, get the path with **`webUtils.getPathForFile(file)` in preload** (renderer module; expose via `contextBridge`). Chrome/Safari have no equivalent.

Linux note (not this Mac, but if the shell is reused): Electron 37+ had `openDirectory` showing a **file** picker on older Ubuntu portals; macOS is fine.

**Product cost:** you take on an Electron lifecycle (tray vs quit, codesign, auto-update) to buy a dialog that `osascript` can also provide. Ticket 04 already flags Electron as heavier than a markdown viewer unless this research says a native dialog is **mandatory**. It is not mandatory: a typed path works; a Node-spawned dialog (below) works without an Electron window.

---

## 5b. Native open-dialog — without Electron

A Node HTTP server on this Mac can spawn:

```text
osascript -e 'POSIX path of (choose folder with prompt "Select a Project folder")'
```

Stdout is a POSIX path (`/Users/.../wayfinder-reader/`). Cancel → non-zero exit. The browser’s “Browse…” button POSTs to `:5420`, the server runs `osascript`, then stores the path like (3).

**Does the server get a POSIX path?** **Yes.**

**Does this require Electron?** **No.** It requires macOS + Automation permission for the responsible app (Terminal / the `.app` that launched Node). Focus: the dialog may appear **behind** the browser; some tools activate Finder first.

This is the native-dialog option that still fits “UI in Chrome or Safari against 5420.”

---

## Browser vs Electron matrix

| Mechanism | Chrome @ 5420 | Safari @ 5420 | Electron shell | Node gets POSIX path? |
| --- | --- | --- | --- | --- |
| `showDirectoryPicker` | Yes (secure context) | **No** | Yes, still no path | **No** |
| `<input webkitdirectory>` | Yes (includes hidden files) | Yes (**may omit hidden**, i.e. `.scratch`) | Yes; path only via `webUtils` | **No** (unless Electron `webUtils`) |
| Typed/pasted absolute path | Yes | Yes | Yes | **Yes** |
| Server `readdir` from that string | Yes | Yes | Yes | already has it |
| `dialog.showOpenDialog({ openDirectory })` | No | No | **Yes** | **Yes** |
| Node `osascript` `choose folder` | via server | via server | possible, redundant | **Yes** |

---

## macOS TCC and other permission traps

Transparency, Consent, and Control is **not** UNIX mode bits. `~/Desktop`, `~/Documents`, `~/Downloads` (and often iCloud Desktop & Documents) are protected. The **responsible process** is who gets the prompt:

| How Node is started | Who TCC attributes | Typical result for Desktop Projects |
| --- | --- | --- |
| `node` in Terminal.app / iTerm | the terminal app | Works if that terminal already has Files and Folders |
| Electron `.app` | the Electron bundle | Needs usage-description keys; first open of Desktop/Documents/Downloads prompts |
| `launchd` user agent / brew services | the **binary** (`node`, `bash`), not Terminal | Often **silent `EPERM` / empty tree** until Full Disk Access or Files and Folders is granted to that binary |

Chrome’s FSA grant is to **Chrome + origin**, not to Node. Selecting a folder in a Chrome picker does not authorize the Reader server.

Other traps:

- **`.scratch` is hidden.** Any NSOpenPanel / Finder-based picker hides it until ⌘⇧. Typed path and Node `readdir` do not care.
- **Safari directory upload vs `.scratch`:** picking the repo root can yield **no map files** in Safari. Prefer not to rely on webkitdirectory for this product.
- **Full Disk Access** is the blunt hammer people apply to Node; it is not required if the user stays out of TCC-protected folders *or* the responsible app already has Files and Folders. Example Projects live on `Desktop/js/...`, which **is** TCC-protected.
- iCloud-synced Desktop: the path exists; hydration can make `readFile` stall or fail until the file is local.
- Drag-and-drop onto a **web page** does not grant TCC to Node. Drag-and-drop onto an **Electron window** can grant that app access to those items (Apple’s user-intent rule).

---

## What this implies for the Reader

The destination needs a **path the server owns**:

1. **v1 that stays a browser tab:** text field for an absolute path (paste from Finder), server validates and lists, persist the string for restart. Optional: **Browse** that hits `:5420` and runs `osascript` `choose folder`.
2. **Do not** use FSA or webkitdirectory as the way Node learns the Project. Chrome-only, no path, and Safari would drop `.scratch` on upload.
3. **Electron is not required** for a real folder dialog on this Mac. Use it only if ticket 04 picks a tray shell for always-on — then `showOpenDialog` is the right picker **inside that shell**.

Confine every later `readFile` to the resolved Project root. The picker research does not change that lock; it only explains how the root string arrives.
