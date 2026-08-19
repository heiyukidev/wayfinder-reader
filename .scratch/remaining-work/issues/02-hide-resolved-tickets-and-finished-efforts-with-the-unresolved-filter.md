# 02: Hide resolved Tickets and Finished Efforts with the Unresolved filter

**What to build:** The **Unresolved filter** is on when Khaled Loads, lasts only for this page session, and hides resolved **Tickets** and **Finished** Efforts. Claimed and blocked Tickets stay. Language documents, **ADRs**, and **Out-of-scope records** stay. A control shows the full live list and can switch back to remaining work. **Archived** Efforts stay out even with the filter off.

**Blocked by:** 01 List Spec-only and Ticket-only Efforts, ADRs, and Out-of-scope records

**Status:** resolved

- [x] Load starts with the Unresolved filter on; Always-on reopen is remaining work again, not a remembered “show all”
- [x] While the filter is on, resolved Tickets and Finished Efforts are hidden; claimed and blocked Tickets stay; language, ADRs, and Out-of-scope records stay
- [x] A control shows the full live list (dim resolved Tickets and Finished Efforts still in `.scratch/`) and can switch back to remaining work without reloading
- [x] Archived Efforts stay absent even with the filter off
- [x] The filter is client-only and is not stored with the Project path

## Answer

The Unresolved filter was already in `public/app.js` (`remainingWorkOnly`, `#unresolved-filter`, hide `finished` groups and `resolved` Tickets on the Tickets tab). Load already posted only `{ path }`; `src/state.js` still stores only `lastProjectPath` and recents. Archive stays a server omission from `decisions`, not a client list.

Gaps closed in this ticket:

- Load and Always-on reopen (`init`, `loadProject`, and `pageshow` including bfcache restore) force the checkbox on and `remainingWorkOnly = true`, so a previous “show all” is not remembered. `autocomplete="off"` on the control.
- Toggle still re-renders from the in-memory outline (no reload). Filter off shows live Finished groups (`.finished`) and dim resolved Tickets (existing `.resolved`). Context tab (language, ADRs, Out-of-scope) is unfiltered.

`npm test`: 44 passed.

HITL: checkbox checked after Load and after a full Always-on reopen; uncheck shows dim resolved Tickets and live Finished Efforts without reload; check hides them again; claimed/blocked Tickets and Context rows stay while the filter is on; Archive remains absent with the filter off. Look of the control is ticket 04.
