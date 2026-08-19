# CONTEXT

Local read-only viewer for Wayfinder maps on disk.

## Glossary

- **Reader** — This product: a local JavaScript web app, kept available on port 5420, that shows Wayfinder maps from a chosen **Project**. The sidebar is the **Map list**; the pane is GFM preview with **Term hints**. The Reader does not edit, claim, or resolve tickets.
- **Project** — A folder on the filesystem the user selects. It may contain one or more Wayfinder **Efforts**.
- **Project path** — The absolute POSIX path of that folder. The **Reader** stores this string on the server (type/paste + recents). Browser folder pickers do not produce it.
- **Effort** — One wayfinding run: a map plus its child tickets (locally, a directory under `.scratch/<effort>/`).
- **Map** — The index issue for an Effort (`map.md` locally): Destination, Notes, Decisions so far, fog, out of scope. It lists decisions; it does not restated their detail.
- **Ticket** — A child of a Map. One decision, investigation, prototype, or unblocker task.
- **Spec** — `spec.md` for an Effort, or a `.scratch/` sibling folder that has a spec and is not a Map.
- **Frontier** — Open, unblocked, unclaimed **Tickets**. The Reader does not claim; it only marks the frontier on the **Map list**.
- **Map list** — The Reader sidebar: language documents, then each **Effort** (folder name) with its **Map** (title), **Spec** if present, and **Tickets** by title indented by `Blocked by:` depth. Frontier marked; resolved dim. Not a filesystem tree. No Files / Decisions toggle. Locked in [docs/adr/0005-map-list-replaces-files-view.md](docs/adr/0005-map-list-replaces-files-view.md).
- **Decisions view** — Retired name for a Files / Decisions toggle. The ticket outline is the **Map list**.
- **Files view** — Retired. Was the filesystem tree of `.scratch/` filenames.
- **Skip prompt** — Clipboard text from selected **Tickets**. Tells a grilling session to skip the interview on those Tickets, pick the agent’s recommended answer for each, and mark them resolved. Checking a Ticket is the go for that recommendation. Selection is exact: dependents are not included. The Reader only copies; the pasted session writes the **Project**. Locked in [docs/adr/0004-decisions-view-and-skip-prompt.md](docs/adr/0004-decisions-view-and-skip-prompt.md).
- **Term** — A glossary entry from a language document’s `## Language` or `## Glossary` section (`**Name**:` or `- **Name** —`), not free bold.
- **Term hint** — Hover definition of a **Term** (and `_Avoid_` aliases pointing at the canonical Term) on the GFM preview. Locked in [docs/adr/0006-term-hints-from-language-files.md](docs/adr/0006-term-hints-from-language-files.md).
- **Always-on** — The Reader process stays reachable at `http://127.0.0.1:5420` without a manual start each time the user wants to read a map. Product shape: a `launchd` user agent in `~/Library/LaunchAgents` plus a browser bookmark. A foreground Terminal `node` is not Always-on. Install and ops: [docs/always-on.md](docs/always-on.md). Locked in [Always-on process model for the Reader](.scratch/map-reader/issues/04-always-on-process-model-for-the-reader.md).
- **Readable tree** — Retired as UI (that was Files view). The server still does not walk the rest of the **Project**. It may serve **Map list** rows, in-`.scratch/` preview-link targets (research, prototypes), and the language files in ADR 0006. Locked in [What the server may read in a chosen Project](.scratch/map-reader/issues/05-what-the-server-may-read-in-a-chosen-project.md), amended by [ADR 0005](docs/adr/0005-map-list-replaces-files-view.md) and [ADR 0006](docs/adr/0006-term-hints-from-language-files.md).
- **Stack** — One Node process: Hono serves a static HTML/JS page and GFM preview. No Electron, no Vite/Next at runtime. Locked in [UI stack and shell](.scratch/map-reader/issues/06-ui-stack-and-shell.md).
- **Look** — Reading desk: warm paper GFM in Source Serif 4, stone **Map list**, navy Load. Chrome is Source Sans 3. Fonts self-hosted. Locked in [Visual polish of the Reader](.scratch/map-reader/issues/09-visual-polish-of-the-reader.md).
