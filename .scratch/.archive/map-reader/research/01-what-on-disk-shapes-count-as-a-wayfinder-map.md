# What on-disk shapes count as a Wayfinder map

Captured: 2026-08-18. Sources: Wayfinder skill, local/GitHub/GitLab tracker docs, and every `.scratch/` tree under `~/Desktop/js` (and `~/Desktop` for `map.md`).

## Short answer

A **Map** is an **Effort index**. Locally that is `.scratch/<effort>/map.md`. On GitHub/GitLab it is an issue labelled `wayfinder:map` with child issues as tickets — **nothing on disk**.

Khaled’s existing Wayfinder maps are **local-markdown only**. The Reader’s v1 job is: pick a **Project** folder, find `.scratch/*/map.md`, and show that Effort’s files (map, tickets, research notes, spec, prototypes) as a tree with a markdown preview. GitHub/GitLab can wait.

---

## 1. Vocabulary (from CONTEXT + the skill)

| Term | Meaning |
| --- | --- |
| **Project** | Folder the user selects (a git repo). |
| **Effort** | One wayfinding run. Locally: one directory `.scratch/<effort>/`. |
| **Map** | The index for that Effort. Lists Destination / Notes / Decisions so far / fog / out of scope. Does not restated ticket detail. |
| **Ticket** | A child of the Map. One decision, investigation, prototype, or unblocker task. Types: `research`, `prototype`, `grilling`, `task`. |
| **Frontier** | Open, unblocked, unclaimed tickets. The Reader is read-only and does not claim; the tree is a filesystem tree, not a blocking graph. |

The map is an **index**, not a store. Decisions live on tickets. Assets (research write-ups, prototype stubs) are **linked from the ticket**, not pasted into the map.

---

## 2. Local markdown tracker (what Khaled actually has)

Canonical layout from `issue-tracker-local.md` and the four example Projects:

```
<Project>/
  .scratch/
    <effort>/                 # one Effort
      map.md                  # THE map (presence = this Effort is a Wayfinder map)
      spec.md                 # optional; /to-spec output when the way is clear
      issues/
        NN-<slug>.md          # child tickets, numbered from 01
      research/
        NN-<slug>.md          # optional research write-ups (not the ticket)
      prototypes/
        <stub-name>/…         # optional prototype assets (any files)
```

### 2.1 Map — `.scratch/<effort>/map.md`

**This file is the on-disk identity of a Wayfinder map.** Discover maps with:

```
<Project>/.scratch/*/map.md
```

No nested Efforts exist on disk. No `map.md` exists outside `.scratch/`.

Body sections (skill template; all five maps on disk use them):

- `# <title>` — the Map’s **name** (refer by name, not by slug)
- `## Destination`
- `## Notes`
- `## Decisions so far` — one bullet per **closed** ticket: `[title](issues/NN-slug.md) — gist`
- `## Not yet specified` — fog (may be empty)
- `## Out of scope`

The map does **not** list open tickets. It has no `Type:` / `Status:` / `Blocked by:` header.

Maps found (all local markdown):

| Project | Effort | Has spec | Has research/ | Has prototypes/ |
| --- | --- | --- | --- | --- |
| `sealbox` | `go-nogo` | yes | yes | no |
| `april` | `local-teammate` | yes | yes | yes |
| `dnd-heiyuki` | `soul-and-equipment` | no | no | no |
| `dnd-heiyuki` | `gold-buy-soul-stats` | no | no | no |
| `wayfinder-reader` | `map-reader` | no | this note | no |

### 2.2 Ticket — `.scratch/<effort>/issues/NN-<slug>.md`

Filename: two-digit number, hyphen, slug, `.md`. One file per ticket. Never a combined tickets file.

**Header lines** (near the top; order varies — see §4):

```
Type: research | prototype | grilling | task
Status: claimed | resolved | <empty>
Blocked by: NN, NN
```

Then an H1 title and `## Question`. On resolve: `## Answer` and `Status: resolved`. Optional `## Assets` (prototype links). Optional `## Comments` at the bottom (sealbox grilling tickets).

**Status in the wild**

- Empty `Status:` (or omitted) = open and unclaimed. **No file uses `Status: open`**, even though sealbox’s tracker doc mentions `open`.
- `claimed` — one file (`dnd-heiyuki` gold-buy ticket 06).
- `resolved` — closed.

**Blocked by in the wild**

- Empty line: `Blocked by:`
- Comma-separated **file numbers**, often zero-padded: `Blocked by: 03, 05, 06`
- Line omitted entirely (several `dnd-heiyuki` tickets) — treat as unblocked
- A ticket is unblocked when every listed blocker file is `Status: resolved`

**Type in the wild:** all four values appear (`research`, `prototype`, `grilling`, `task`).

### 2.3 Research note — `.scratch/<effort>/research/NN-<slug>.md`

Not defined in the stock local-tracker template. Sealbox’s `docs/agents/issue-tracker.md` adds it; april uses the same shape.

- Filename usually **matches** the research ticket (`research/01-…` ↔ `issues/01-…`).
- Body is a long write-up. **No** `Type:` / `Status:` / `Blocked by:` contract.
- The ticket’s `## Answer` is a gist plus a relative link to this file.
- Wayfinder skill’s GitHub path is a throwaway **git branch** `research/<name>`. Locally that became a **folder** under the Effort.

### 2.4 Spec — `.scratch/<effort>/spec.md`

From `/to-spec` + local tracker “the spec is `spec.md`”. Optional.

- `Status: ready-for-agent` (triage label, **not** a Wayfinder ticket status).
- H1 title; sections Problem Statement / Solution / User Stories / …
- May sit **beside** a map (`go-nogo`, `local-teammate`) or **alone** with no `map.md` (see §3).

`karine.so`’s tracker uses `PRD.md` + `plan.md` instead of `spec.md`, has **no** Wayfinding operations section, and has **no** `.scratch/` — not a Wayfinder layout.

### 2.5 Prototype — `.scratch/<effort>/prototypes/<stub>/…`

Only one instance: `april/.scratch/local-teammate/prototypes/run-agent-api/run-agent.ts`.

- Linked from the prototype ticket under `## Assets`.
- Any file type (here TypeScript). Not markdown. Preview as source, or skip non-md in v1 preview.

---

## 3. Same `.scratch/` tree, **not** a Wayfinder map

A Project can have Effort-shaped folders that are **not** maps. The Reader should not call these Maps.

### 3.1 Spec-only folders (no `map.md`, no `issues/`)

`dnd-heiyuki/.scratch/{greek-god-boons,passive-items,loadout-slot-presentation,item-auto-battler-prototype}/spec.md`

These are `/to-spec` outputs. `Status: ready-for-agent`. No tickets, no map.

### 3.2 Implementation tickets from `/to-tickets` (no `map.md`, no `Type:`)

`sealbox/.scratch/first-slice/` — `spec.md` + `issues/NN-slug.md` with:

```
# NN — Title
**What to build:** …
**Blocked by:** None — can start immediately.   # or "01 — Title"
**Status:** resolved | ready-for-agent
- [ ] acceptance criteria
```

These are tracer-bullet **build** tickets, not Wayfinder decision tickets. Same `issues/` glob, different header dialect.

### 3.3 How to tell them apart

| Signal | Wayfinder ticket | to-tickets issue | spec-only |
| --- | --- | --- | --- |
| Sibling `map.md` | yes | no | no |
| `Type:` line | yes (`research`/`prototype`/`grilling`/`task`) | no | no |
| `## Question` | yes | no (`**What to build:**`) | n/a |
| `Status:` values | empty / claimed / resolved | `ready-for-agent` / resolved | `ready-for-agent` |

**Discovery rule:** an Effort is a Wayfinder **Map** iff `.scratch/<effort>/map.md` exists. Sibling folders without `map.md` are still local-tracker artifacts; show them if the tree is “everything under `.scratch/`”, but do not treat them as Maps.

---

## 4. Header / layout variants the parser must tolerate

Observed on Khaled’s disk — do not require one order.

1. **Title then headers** (sealbox `go-nogo`, april, wayfinder-reader):

   ```
   # Title
   Type: …
   Status: …
   Blocked by: …
   ```

2. **Headers then title** (`dnd-heiyuki` maps’ tickets):

   ```
   Type: …
   Status: …
   Blocked by: …    # sometimes omitted
   # Title
   ```

3. **Empty vs missing**
   - `Status:` with nothing after = unclaimed open
   - `Blocked by:` with nothing after = unblocked
   - `Blocked by` line absent = unblocked

4. **Bold to-tickets dialect** (`**Blocked by:**`, `**Status:**`) — not Wayfinder; ignore for map typing.

5. Specs: `Status: ready-for-agent` as line 1 or after the H1.

Relative links inside Effort files are repo-relative (`issues/01-….md`, `../research/01-….md`, `prototypes/…`, `spec.md`). Preview should resolve those inside the Effort, not as http.

---

## 5. GitHub and GitLab (no on-disk map)

From `issue-tracker-github.md` / `issue-tracker-gitlab.md` and the Wayfinder skill. **There is no file the Reader can glob.**

| Concept | GitHub | GitLab |
| --- | --- | --- |
| **Map** | One issue labelled `wayfinder:map`. Body = Destination / Notes / Decisions so far / fog. | Same label. On Premium, an epic *may* hold the map; a labelled issue works everywhere. |
| **Ticket** | Child of the map: GitHub **sub-issue**, or fallback a task-list item in the map body plus `Part of #<map>` at the top of the child. Label `wayfinder:<type>`. | `Part of #<map>` at top of description. Label `wayfinder:<type>`. |
| **Type** | Label `wayfinder:research` / `wayfinder:prototype` / `wayfinder:grilling` / `wayfinder:task` | Same |
| **Claim** | Assignee (`gh issue edit --add-assignee @me`) | Assignee (`glab issue update --assignee @me`) |
| **Blocking** | Native issue dependencies (`blocked_by` via API, database id not `#number`). Fallback: `Blocked by: #<n>, #<n>` in the child body. | Native `/blocked_by #<n>` quick action (Premium). Fallback: same `Blocked by:` line. |
| **Frontier** | Open children, no open blocker, no assignee | Same |
| **Resolve** | Comment with the answer, close the issue, gist+link on the map’s Decisions so far | Note, then close (close cannot carry a comment) |
| **Research asset** | Throwaway git branch `research/<name>` + pointer on the ticket — **not** a `.scratch/research/` file | Same idea (skill is tracker-agnostic; no GitLab-specific asset folder) |
| **Spec** | Published as a GitHub/GitLab issue (`/to-spec`), not `spec.md` | Same |

A filesystem Reader **cannot** reconstruct that graph from the Project folder. It would need `gh` / `glab` (and network, auth). None of Khaled’s current maps live there.

---

## 6. Are Khaled’s Projects local-markdown-only?

**Yes, for Wayfinder.**

Evidence:

- Every `map.md` under `~/Desktop` is `.scratch/<effort>/map.md` (five files, four Projects).
- `docs/agents/issue-tracker.md` in `wayfinder-reader`, `sealbox`, and `dnd-heiyuki` is the local-markdown template with Wayfinding operations. `april` has no `docs/agents/` but uses the same `.scratch/` layout.
- `karine.so` is local markdown too (`PRD.md` / `plan.md`) but has **no** `.scratch/` and **no** Wayfinding section — not a map source today.
- No GitHub `wayfinder:map` workflow is configured in these repos’ agent docs.

v1 of the Reader can ignore GitHub/GitLab and still show every map Khaled can generate with the Wayfinder skill **as he uses it now**.

---

## 7. What the Reader must scan / parse / show

### v1 — must

**Scan** (inside the chosen Project only; never `..` out):

```
.scratch/*/map.md
.scratch/*/spec.md
.scratch/*/issues/*.md
.scratch/*/research/*.md
.scratch/*/prototypes/**   # files of any type
```

Do not walk `node_modules`, `.git`, or the rest of the repo. Hidden dirs other than `.scratch` are out of v1.

**Discover Maps:** every directory that contains `map.md`. That directory is the Effort. Show its name as the Effort slug; show the map H1 as the Map name when parsed.

**Tree (filesystem, not a DAG):** group by Effort, then:

```
<effort>/
  map.md
  spec.md                 # if present
  issues/NN-slug.md
  research/NN-slug.md
  prototypes/…            # if present
```

Also list sibling `.scratch/<folder>/` that have `spec.md` and/or `issues/` but **no** `map.md` (spec-only and `first-slice`). Mark them as non-map tracker folders so dnd-heiyuki and sealbox first-slice are not invisible. Empty state: Project has no `.scratch/*/map.md` (and optionally mention spec-only folders if any).

**Parse (lenient, for optional chrome / later tickets):**

- Ticket: first `Type:`, `Status:`, `Blocked by:` lines anywhere in the first ~20 lines. Empty Status → open. Missing/empty Blocked by → unblocked. Numbers on `Blocked by` refer to sibling `NN-*.md`.
- Map: H1 as display name; do not require section parsing for v1 preview.
- Spec: treat `spec.md` as markdown; `Status: ready-for-agent` is triage, not ticket state.

**Show:** markdown preview of the selected file (raw is enough for v1). Resolve relative links that stay inside the Effort. Prototype `.ts` can wait for a source preview; listing the file in the tree is enough.

**Do not (v1):** claim, resolve, write, follow git remotes, call `gh`/`glab`, render a blocking graph, require `Status: open`, require header order.

### Can wait

- GitHub/GitLab maps (`wayfinder:map`, sub-issues, native blockers, assignees).
- Ticket-aware badges (Type / Status / Blocked-by) vs raw markdown — map fog; not required to *find* files.
- Blocking-edge graph.
- Live-reload on disk change.
- Search across Efforts.
- Multiple Projects at once.
- `karine.so` `PRD.md` / `plan.md` dialect.
- Treating `/to-tickets` issues as Wayfinder tickets.
- Research git branches on GitHub maps.

### Grill later (ticket 05)

Whether the tree is **maps-only** (only Efforts with `map.md`) or **all `.scratch/` tracker folders**. Recommendation from this note: **all tracker folders**, with Map vs spec-only vs to-tickets distinguished, because Khaled’s real Projects mix them in one `.scratch/`.
