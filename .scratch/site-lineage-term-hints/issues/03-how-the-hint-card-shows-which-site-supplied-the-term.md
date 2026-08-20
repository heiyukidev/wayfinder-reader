# How the hint card shows which Site supplied the Term

Type: prototype
Status: resolved
Blocked by: 01

## Question

Now that parallel Sites no longer collide, a winning **Term hint** is a single definition. The current definition card does not name a Site (`contextName` appears only on collision lists). Should the card show which **Site** supplied the phrase — especially when the Term was inherited from a parent — and what does that look like?

Throwaway UI variants. Include “show nothing extra” (today’s definition card) as one variant. Cheap, several looks, react to them. Link the prototype as an asset. Do not ship into `public/`. Do not restyle the **Context tab**.

## Answer

**C (Inherited footer).**

A singleton **Term hint** keeps today’s titled slip when the owning **Site** supplied the phrase. When the winner is a parent Site, a hairline footer names it: `Inherited from {title}`. Title is rendered at read time; identity stays Site `rel`. Same-Site collisions still list both, labeled by `contextName`, and get the footer when that Site is not the owner. Alias (“Prefer”) cards follow the same rule. Parallel Sites never appear on the card.

Rejected: **A** (nothing extra) hides inheritance on a child preview. **B** (always-on Site chip) repeats the owning Site on local Terms.

Variants as primary source: [prototypes/hint-card-site.js](../prototypes/hint-card-site.js). Run `npm run prototype:hint-card-site` → http://127.0.0.1:5423/?variant=C

## Comments

- Prototype (throwaway, not `public/`): [prototypes/hint-card-site.js](../prototypes/hint-card-site.js). Run `npm run prototype:hint-card-site` → http://127.0.0.1:5423/?variant=A
  - **A** Nothing extra — today’s titled slip
  - **B** Always-on Site chip — title at read time
  - **C** Inherited footer — names the Site only when the winner is not the owning Site
