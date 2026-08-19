# UI stack and shell

Type: grilling
Status: resolved
Blocked by: 04

## Question

Given the process model from [Always-on process model for the Reader](04-always-on-process-model-for-the-reader.md), what JS stack ships the **Reader**? Server library, how the UI is served (static page vs bundled SPA), markdown preview library, and whether there is a native shell.

Recommendation to grill against: one Node process, small HTTP framework (Hono or similar), a single-page UI, GFM markdown preview. No Electron — [Always-on process model for the Reader](04-always-on-process-model-for-the-reader.md) locked a `launchd` user agent + browser bookmark.

## Answer

**One Node process:** Hono serves a static HTML/JS page and JSON for the **Readable tree**; GFM preview (`marked` or similar). Khaled locked that shape. No Electron, no Vite/Next at runtime — launchd will not run `npm`, so Always-on is `absolute-node` plus an entry file that can serve `public/` as source.

JavaScript, not a TypeScript monorepo. Visual polish is `/impeccable` after [Tree plus markdown preview stub](07-tree-plus-markdown-preview-stub.md), not a CSS-framework lock.

Glossary: `CONTEXT.md`. ADR: [docs/adr/0003-hono-static-page-for-the-reader.md](../../../docs/adr/0003-hono-static-page-for-the-reader.md).
