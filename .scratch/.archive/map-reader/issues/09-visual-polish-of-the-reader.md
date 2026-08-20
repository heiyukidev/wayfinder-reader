# Visual polish of the Reader

Type: prototype
Status: resolved
Blocked by: 08

## Question

What should the **Reader** look like after a polish pass? Shape is locked in [Tree plus markdown preview stub](07-tree-plus-markdown-preview-stub.md): path field + recents, `.scratch/` tree, GFM preview, relative links. Always-on is in place ([Ship the launchd user agent that keeps the Reader Always-on](08-ship-the-launchd-user-agent.md)). Invoke `/impeccable`. Do not change the stack ([UI stack and shell](06-ui-stack-and-shell.md)) or the Readable tree ([What the server may read in a chosen Project](05-what-the-server-may-read-in-a-chosen-project.md)). Done when Khaled signs off the look, or says the stub is good enough to stop.

## Assets

- Live: http://127.0.0.1:5420
- UI: [`public/`](../../../public/) (Source Sans 3 + Source Serif 4 self-hosted in [`public/fonts/`](../../../public/fonts/))

## Answer

Khaled signed off a **reading-desk** look: Operate chrome + Read preview. Warm paper (`#f4efe6`) and Source Serif 4 for GFM; stone sidebar tree; navy Load (`#1e3a5f`) as the one filled action; Source Sans 3 in chrome, self-hosted woff2. Shape unchanged (Project path + recents, `.scratch/` tree, GFM, relative links). Folder click still expands only — does not auto-open `map.md`. Live at http://127.0.0.1:5420.
