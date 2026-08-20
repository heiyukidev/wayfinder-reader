# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary user is a Wayfinder operator: someone running Wayfinder on a local **Project** (a folder on disk). They open the **Reader** mid-work to see remaining work, read **Maps**, and understand **Terms** in that Project. Skip/Take prompt copy exists for handing a unit to an agent session; it is not the session’s success criterion.

## Product Purpose

The **Reader** shows Wayfinder maps that live on the visitor’s disk. Success is understanding remaining work, a **Map**, or a **Term** without leaving the Reader.

Two versions share one page: the hosted origin (static HTML/JS at a public HTTPS URL; Chrome or Edge; Load via a **Directory handle**) and **Always-on** (Hono at `127.0.0.1:5420`; Load via a **Project path**; **Archive**). The hosted Reader does not edit, claim, resolve, or Archive. It never writes the Project.

## Positioning

This is a Wayfinder map viewer, not a generic markdown or filesystem browser. It finds **Sites** by marker, presents a **Map list** (not a file tree), and overlays **Term hints** from the previewed path’s **Site lineage**. Neighboring products can preview markdown; they cannot truthfully claim this shape.

## Operating Context

Wayfinder work happens in agent sessions against a Project on disk (`/grill`, `/implement`, `/to-spec`, `/to-tickets`). The operator keeps the Reader beside that work. Hosted Load uses the File System Access API (Chrome or Edge). Always-on is a `launchd` user agent plus a bookmark at `http://127.0.0.1:5420` on macOS. `npm start` is development only and is neither version.

## Capabilities and Constraints

Confirmed:

- One page for hosted and Always-on.
- Sidebar is the **Map list** (Context tab and Tickets tab); pane is GFM preview with **Term hints**, or a **Paste preview**.
- Hosted Load identity is a **Directory handle**; Always-on Load identity is a **Project path**.
- Hosted never writes the Project. Always-on may **Archive** a **Finished** Effort (`fs.rename` into `.scratch/.archive/`). No Archive list and no Restore.
- Skip prompt and Take prompt are clipboard copies only; the pasted session writes the Project.
- **Unresolved filter** is session-only. **Paste preview** is session memory, never written, cleared on Load.
- Readable content is Wayfinder-shaped: Sites, language documents, ADRs, Out-of-scope records, Effort maps/specs/tickets, in-`.scratch/` preview targets. Not source, `.git`, `node_modules`, or secrets.
- Stack is locked: hosted is static HTML/JS; Always-on is Hono serving the same `public/` plus project APIs. No Electron; no Vite/Next at runtime.
- Domain vocabulary in `CONTEXT.md` and the ADRs under `docs/adr/` are product locks.

Undecided: none recorded this init. No extra audience, brand, or accessibility constraint beyond those locks.

## Brand Commitments

Product name is **Reader** (`wayfinder-reader`). On-screen title is `Reader`. Glossary terms in `CONTEXT.md` are binding vocabulary for UI copy and future work.

## Evidence on Hand

- Running product: `public/` (page, styles, client) and `src/` (Always-on Hono).
- Product locks: `CONTEXT.md`; accepted ADRs in `docs/adr/` (0001–0016 as of this writing).
- Always-on install/ops: `docs/always-on.md`.
- In-repo scratch maps, issues, and prototypes under `.scratch/` (including paste-preview and dark-look in progress). Do not treat archived `.scratch/.archive/` issues as current UI contracts unless `CONTEXT.md` still cites them.
- Hosted origin lock: GitHub Pages on `github.com/heiyukidev/wayfinder-reader`.
- Absent: testimonials, customer quotes, benchmarks, pricing, and licensing claims. Future work must not fabricate them.

## Product Principles

1. **Understand in place.** The Reader succeeds when the operator understands remaining work, a Map, or a Term without leaving.
2. **Disk is the map.** The Project on disk is the source of truth. Hosted is read-only; Always-on Archive is the one write, and it is not a hard delete.
3. **Wayfinder-shaped, not a tree.** Sites, Efforts, Frontier, and Term hints are the product. A filesystem explorer is a regression.
4. **One page, two Loads.** Hosted and Always-on share the desk. Version differences are Load identity and Archive, not a second UI.
5. **Copy, don’t claim.** Skip and Take prompts leave on the clipboard. The Reader does not claim, resolve, or edit tickets.
