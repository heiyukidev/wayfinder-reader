# ADR 0009 — Take prompt

The **Reader** copies a **Take prompt** for one previewed remaining-work **Spec** (no Tickets yet) or one **Frontier** Ticket. First lines are the skill commands for that row’s flow. The pasted session takes only that unit and, for a Ticket, marks it resolved. The Reader still never claims or writes Ticket or Spec files.

`/wayfinder` prefixes only wayfinder-typed Tickets (`research` / `prototype` / `grilling` / `task`). A Spec with no Tickets is `/to-tickets`. Any other Frontier Ticket is `/implement`. Claimed Tickets stay visible as claimed and are not takeable. Skip prompt speech and multi-select stay as in [ADR 0004](0004-decisions-view-and-skip-prompt.md).

Rejected: prefacing every paste with `/wayfinder`; Take on claimed, blocked, or resolved Tickets; the Reader resolving after copy; dumping file bodies onto the clipboard; a second multi-select for Take.