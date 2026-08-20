# 02: Copy a Skip prompt

**What to build:** On **Decisions view**, Khaled checks open **Tickets** he does not want to interview and copies a **Skip prompt** to paste into a grilling session. The Reader still does not write the **Project**. Selection does not cascade.

**Blocked by:** 01 See the blocking outline

**Status:** resolved

- [x] Open Tickets (including claimed and blocked) have a checkbox separate from row-click preview; resolved Tickets are not checkable
- [x] Checking a Ticket does not check Tickets it blocks; there is no select-all
- [x] Copy is available only when at least one Ticket is checked; it puts text on the clipboard and does not write Ticket files
- [x] Copied text starts with: “Skip grilling these Tickets in this session. Pick your recommended answer for all the questions. Mark them as resolved.”
- [x] Copied text then has `Project:` (absolute path), then `Map:` groups with hyphen lists of selected Ticket titles (no bare numbers)
- [x] Selection survives changing the preview; toggling Files and back is N/A under ADR 0005 because the Map list has no Files toggle

## Answer

Added exact Ticket selection on the Map list and an outlined sidebar Copy control that writes the ordered Skip prompt to the clipboard. Selection remains browser-only and survives preview changes without writing the Project.
