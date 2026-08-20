# Marker walk finds Sites

A **Project** is one repo you Load, not a parent of several products. Inside it, a **Site** is any directory with `CONTEXT.md` and/or `.scratch/` (`CONTEXT.md` inside an Effort is not a Site). The Reader hunts those markers (skipping `node_modules`, `.git`, and other hidden dirs). A **Context map** may title and order listed Sites; it does not hide unmapped files. Serving stays the named holes, repeated per Site: that Site’s language file, `docs/adr/*.md`, `.out-of-scope/*.md`, and its `.scratch/` tree. Efforts are identified by path in the Project, not slug alone. This amends [ADR 0002](0002-readable-tree-is-scratch-only.md) and supersedes [ADR 0006](0006-term-hints-from-language-files.md)’s “not a walk” allowlist.

Rejected: loading a workspace of many git repos as one Project; requiring a Context map to see nested language; walking to serve source or secrets.
