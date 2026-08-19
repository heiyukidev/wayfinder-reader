# ADR 0003 — Hono static page for the Reader

Status: accepted

## Context

Always-on is a `launchd` user agent: absolute Homebrew Node plus an entry file. launchd does not run `npm` or a bundler. The UI is a browser bookmark, not Electron ([Always-on process model for the Reader](../../.scratch/map-reader/issues/04-always-on-process-model-for-the-reader.md)). The repo is JavaScript.

## Decision

The **Reader** is **one Node process**:

- **Hono** HTTP on `127.0.0.1:5420`
- Static HTML/JS the same process serves (no Vite/Next at runtime)
- **GFM** markdown preview (`marked` or similar)

Rejected: Electron (already locked), a Vite/React SPA whose Always-on path needs a prebuilt `dist/`, Next.js (`next start` is PATH-fragile under launchd).

Visual polish is `/impeccable` after the stub, not a CSS-framework lock here.

## Consequences

[Tree plus markdown preview stub](../../.scratch/map-reader/issues/07-tree-plus-markdown-preview-stub.md) is that Hono app. [Ship the launchd user agent that keeps the Reader Always-on](../../.scratch/map-reader/issues/08-ship-the-launchd-user-agent.md) points `ProgramArguments` at this process’s entry file.
