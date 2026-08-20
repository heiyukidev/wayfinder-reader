# Show language and Specs on the Map list

Type: prototype
Status: resolved
Blocked by: 01

**What to build:** The **Map list** shows language documents first, then each Effort’s **Map**, **Spec** if present, and **Tickets**, then spec-only Specs. Click previews GFM. Skip prompt checkboxes stay on Tickets only.

Do not also iterate `specOnly` as a second list: remaining-work already lists spec-only folders as Effort groups with `decisions[].spec`. Render `language` rows, then existing Effort groups (Map / Spec / Tickets). Spec-only Efforts already appear as Specs with no Map.

- [x] Language section lists `language` rows by title; click previews that path
- [x] Each Map group shows a Spec row when `decisions[].spec` is present
- [x] Spec-only Effort groups (no Map) still appear as Specs with no Skip checkboxes — same folders as `specOnly`, not a second list
- [x] Skip prompt selection and Copy are unchanged
- [x] This repo, sealbox, dnd-heiyuki, and karine.so (if Loadable) show real language/spec rows where those files exist

## Answer

The **Map list** is two tabs, prototype **D (Context + Tickets)**.

- **Context**: language documents, then **ADRs**, then **Out-of-scope records**. Named holes, never remaining work.
- **Tickets**: the shipped Effort outline — **Map**, nested **Spec** when both exist, Spec-only groups as a Spec-marked heading, Skip checkboxes on Tickets only. Load opens this tab.
- Rejected: one-scroll named holes (A), three tabs with Remaining work (B), split list (C). ADRs do not sit under Remaining work.

Variants (A–D) as primary source: [prototypes/map-list-variants.js](../prototypes/map-list-variants.js).
