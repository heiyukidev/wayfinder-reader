# How a local web app selects a folder on disk

Type: research
Status: resolved
Blocked by:

## Question

The user must select a **Project** folder on the filesystem so a local JS server can read files inside it. What actually works in a browser page talking to `127.0.0.1:5420` vs an Electron shell? Cover `showDirectoryPicker` / File System Access API, `<input webkitdirectory>`, typing an absolute path, server-side directory listing, and native open-dialog. For each: does the server get a real filesystem path it can `readFile`? What are the permission and UX traps on macOS?

## Answer

A Chrome/Safari tab at `127.0.0.1:5420` cannot give Node a POSIX path via a folder picker. `showDirectoryPicker` (Chrome only; Safari no) and `<input webkitdirectory>` (both; Safari may omit hidden `.scratch`) yield browser handles/blobs, not a path the server can `readFile`. What does give Node a path: a typed/pasted absolute string (then server-side listing), Electron `dialog.showOpenDialog({ properties: ['openDirectory'] })` (requires Electron), or Node-spawned `osascript` `choose folder` (native dialog, no Electron). macOS traps: TCC on Desktop/Documents/Downloads follows the process that launched Node (Terminal vs Electron vs launchd), and Finder/NSOpenPanel hide `.scratch` until ⌘⇧.

Full note: [research/03-how-a-local-web-app-selects-a-folder-on-disk.md](../research/03-how-a-local-web-app-selects-a-folder-on-disk.md)
