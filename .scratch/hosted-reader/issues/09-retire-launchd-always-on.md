# Retire launchd Always-on

Type: task
Status: resolved
Blocked by: 08

## Question

Nothing to decide — once the Pages **Reader** is the product, stop shipping **Always-on** as launchd + `127.0.0.1:5420`.

Unload `so.karine.wayfinder-reader` on Khaled’s Mac (existing uninstall script if it still applies). Stop documenting the user agent as how you get a session. Hono / `src/server.js` / the plist are either removed or clearly marked dead — not a second **Reader**.

Do not do this before [Put the Reader on GitHub Pages](08-put-the-reader-on-github-pages.md) is resolved. Do not invent a Homebrew install as a replacement.

## Answer

Out of scope. This will not happen: there will be an **Always-on** version of the app. Do not unload `so.karine.wayfinder-reader`, stop documenting the user agent, or delete Hono / `src/server.js` / the plist as cutover from Pages.

[ADR 0014](../../../docs/adr/0014-always-on-stays-a-version.md) records the lock. What that version serves (Hono vs the static tree) is [What the Always-on version serves](11-what-the-always-on-version-serves.md), not this ticket.

