# done is a read alias of resolved

Status: accepted

The **Reader** treats Ticket `Status: done` as the same resolved fact as `Status: resolved`: **Unresolved filter**, **Finished**, **Archive**, **Frontier**, and dimming. Canonical write (Take, Skip, issue-tracker) stays `Status: resolved`. Those two strings only; no per-operator list and no other close-out spellings.

This reverses the earlier glossary lock that Finished was `resolved` (that string only). One coworker’s tracker writes `done` for the same close-out; remaining work, Archive eligibility, and blocker unblocking must not split.

Rejected: keep `resolved` only and make the coworker write that; hide `done` in the Unresolved filter without counting Finished (ghost Efforts); a configurable synonym list.
