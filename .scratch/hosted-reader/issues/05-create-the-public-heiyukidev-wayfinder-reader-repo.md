# Create the public heiyukidev/wayfinder-reader repo

Type: task
Status: resolved
Blocked by:

## Question

Nothing to decide — create the public GitHub repo the origin will live on.

Switch `gh` to **`heiyukidev`** first (`khaled-arownd-me` is the active account and must not own this). `gh repo create heiyukidev/wayfinder-reader --public`. MIT `LICENSE`. A short README is enough. Do **not** push the current dirty working tree (term-hints / marker-walk / unrelated files). Empty remote, or README + LICENSE only, is success.

GitHub Pages is **not** this ticket ([Put the Reader on GitHub Pages](08-put-the-reader-on-github-pages.md)). Do not enable Pages until the static stub exists and [How to publish this static Reader on GitHub Pages](02-how-to-publish-this-static-reader-on-github-pages.md) is resolved.

## Answer

Public repo exists at [github.com/heiyukidev/wayfinder-reader](https://github.com/heiyukidev/wayfinder-reader). Owner is the `heiyukidev` user (not `khaled-arownd-me`). Contents on `main` are MIT `LICENSE` (Copyright 2026 Khaled Romdhane) and a short README only. GitHub Pages is not enabled. This local working tree has no `origin` and was not pushed. `gh` was switched to `heiyukidev` for create, then back to `khaled-arownd-me`.
