---
name: Reader
description: A Wayfinder map viewer — dark paper for reading, stone for remaining work, one navy Load.
colors:
  ink: "#e4ddd2"
  ink-muted: "#b5ada0"
  ink-placeholder: "#8a8175"
  paper: "#1c1917"
  sidebar: "#161310"
  chrome: "#12100e"
  hairline: "#3a3530"
  hairline-hover: "#4a453e"
  accent: "#1e3a5f"
  accent-hover: "#254a75"
  accent-ink: "#7a9cc4"
  accent-ink-hover: "#8eacd0"
  accent-wash: "rgba(90, 126, 170, 0.22)"
  accent-pressed: "rgba(90, 126, 170, 0.32)"
  ink-wash: "rgba(244, 239, 230, 0.06)"
  load-ink: "#f4efe6"
  control: "#241f1b"
  error-bg: "#2c1a18"
  error-text: "#f0c4be"
  error-border: "#6a403c"
  empty-bg: "#221c16"
  empty-text: "#c4b9a8"
  empty-border: "#3a3530"
  code-bg: "#141210"
typography:
  display:
    fontFamily: "Literata, ui-serif, Georgia, serif"
    fontSize: "1.75em"
    fontWeight: 600
    lineHeight: 1.25
  headline:
    fontFamily: "Literata, ui-serif, Georgia, serif"
    fontSize: "1.4em"
    fontWeight: 600
    lineHeight: 1.25
  title:
    fontFamily: "Literata, ui-serif, Georgia, serif"
    fontSize: "1.15em"
    fontWeight: 600
    lineHeight: 1.25
  body:
    fontFamily: "Literata, ui-serif, Georgia, serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.7
  chrome:
    fontFamily: "Source Sans 3, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Source Sans 3, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: "0.04em"
  mark:
    fontFamily: "Source Sans 3, ui-sans-serif, system-ui, sans-serif"
    fontSize: "10px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.03em"
rounded:
  sm: "3px"
  md: "4px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "24px"
  6: "32px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.load-ink}"
    typography: "{typography.chrome}"
    rounded: "{rounded.md}"
    padding: "6px 14px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
    textColor: "{colors.load-ink}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.accent-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "4px 8px"
    height: "28px"
  button-outline-hover:
    backgroundColor: "{colors.accent-wash}"
    textColor: "{colors.accent-ink-hover}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    typography: "{typography.mark}"
    rounded: "{rounded.sm}"
    padding: "1px 6px"
  input:
    backgroundColor: "{colors.control}"
    textColor: "{colors.ink}"
    typography: "{typography.chrome}"
    rounded: "{rounded.md}"
    padding: "6px 10px"
  map-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.chrome}"
    rounded: "{rounded.sm}"
    padding: "8px"
  map-row-selected:
    backgroundColor: "{colors.accent-wash}"
    textColor: "{colors.ink}"
  tab:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "4px 8px"
  tab-active:
    backgroundColor: "{colors.accent-wash}"
    textColor: "{colors.accent-ink}"
  chip-kind:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    typography: "{typography.mark}"
    rounded: "{rounded.sm}"
    padding: "1px 4px"
  chip-accent:
    backgroundColor: "transparent"
    textColor: "{colors.accent-ink}"
    typography: "{typography.mark}"
    rounded: "{rounded.sm}"
    padding: "1px 4px"
  banner-error:
    backgroundColor: "{colors.error-bg}"
    textColor: "{colors.error-text}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  banner-empty:
    backgroundColor: "{colors.empty-bg}"
    textColor: "{colors.empty-text}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  preview:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    padding: "24px 0"
    width: "72ch"
  term-hint-card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.chrome}"
    rounded: "{rounded.md}"
    padding: "10px 12px 16px"
    width: "24rem"
---

# Design System: Reader

## Overview

**Creative North Star: "The Reading Desk"**

Warm, quiet, workmanlike. Chrome recedes so the operator can stay in remaining work, a Map, or a Term. Personality lives in paper, ink, and navy, and in the serif/sans split — not in decoration.

The desk is a split surface: a stone **Map list** on the left, laid paper on the right. Literata is what you read; Source Sans 3 is furniture (header, list, captions, controls). Chart Navy appears once as a filled Load. Copy, Paste, and Archive stay outline or ghost so they never compete with Load. Density is high in the list and generous on paper (72ch, 1.7 leading).

The shipped register is this dark desk. Do not introduce a second world (cool OLED, different type, different chrome roles) or a light revert. Term hints stay in existing ink. The Map list is Sites and Efforts, not a file tree.

**Key Characteristics:**

- Dark paper / stone / chrome, one cool navy Load
- Serif reads; sans operates
- Flat at rest; hairlines and tone do the depth
- One filled Load; every other action is quieter
- Barely-there radii (3px / 4px)
- Term hints are dotted ink, never a second color

## Colors

A night stone desk with a single cool accent. Neutrals do the room; Chart Navy does the one filled action; Accent Ink does on-dark strokes.

### Primary

- **Chart Navy** (`accent`): The only filled action (Load). Rarity is the point. Fill stays `#1e3a5f` even though it recedes on dark paper.
- **Chart Navy Hover** (`accent-hover`): Load hover only.
- **Accent Ink** (`accent-ink`): On-dark strokes, links, Skip/Take/Paste, Spec/Frontier marks, active tabs, caret, and the focus ring. Not a second fill.
- **Accent Ink Hover** (`accent-ink-hover`): Link hover and pressed outline stroke.
- **Chart Navy Wash** (`accent-wash`): Selected map row, pressed outline, active tab fill, composer selection. A veil — never a second solid fill.
- **Accent Pressed** (`accent-pressed`): Stronger veil on outline press.

### Neutral

- **Warm Ink** (`ink`): Body text on paper and in the list (`#e4ddd2`). Softened on the dark desk so the serif does not glare.
- **Muted Ink** (`ink-muted`): Captions, paths, site labels, idle chrome title, ghost control text.
- **Placeholder Ink** (`ink-placeholder`): Empty prompts and idle placeholders.
- **Laid Paper** (`paper`): The reading pane and the Term hint slip (`#1c1917`).
- **Stone Sidebar** (`sidebar`): The Map list recess, one step darker than paper.
- **Pale Chrome** (`chrome`): Page and header. Darker than paper so the pane reads as the blotter.
- **Warm Hairline** (`hairline`): Every rest divider and stroke. Depth without shadow.
- **Hairline Hover** (`hairline-hover`): Path and Recents hover stroke.
- **Code Wash** (`code-bg`): Inline code and pre blocks; a hair darker than paper.
- **Control** (`control`): Native path field and Recents. A dipped well (`#241f1b`), not a white card.
- **Ink Wash** (`ink-wash`): Row and Archive hover. A 6% paper veil.
- **Load Ink** (`load-ink`): Text on the filled Load.

Error and empty banners use their own warm rose and straw trio (`error-*`, `empty-*`). They are status paper, not a second accent.

**The One Load Rule.** Chart Navy as a solid fill is Load, and only Load. Skip, Take, Paste, tabs, and chips use Accent Ink as stroke or text. They never fill.

**The Warm Desk Rule.** Surfaces stay in the warm stone family. Do not cool the paper, chrome, or hairlines, and do not add a second accent hue.

## Typography

**Display Font:** Literata (Georgia fallback) — self-hosted, 400 / 400 italic / 600  
**Body Font:** Literata on paper; Source Sans 3 in chrome  
**Label/Mono Font:** Source Sans 3 for UI; ui-monospace / SF Mono / Menlo / Consolas for code and paths-in-code

**Character:** A reading pairing, not a display cut. Literata carries the Map; sans keeps the desk out of the way. No third family.

### Hierarchy

- **Display** (600, 1.75em of the 16px preview, 1.25): Preview `h1` only.
- **Headline** (600, 1.4em, 1.25): Preview `h2`.
- **Title** (600, 1.15em, 1.25): Preview `h3`. Map-list titles stay in chrome sans at 600, line-height 1.35 — they are list rows, not display type.
- **Body** (400, 16px, 1.7): GFM preview and Paste composer, max width 72ch. Paste uses sans at the same size and leading so unrendered markdown still sits on the blotter.
- **Chrome** (400, 14px, 1.5): Header, Map list, controls. The product title is chrome at 16px / 500 with −0.01em tracking, in Muted Ink.
- **Label** (500, 12px): Captions, field labels, map paths, ticket meta. Site labels add 0.04em tracking and uppercase.
- **Mark** (600, 10px, 0.03em, uppercase): Frontier, Spec, kind, cycle, claimed, Archive.

### Named Rules

**The Split Voice Rule.** Literata is what you read. Source Sans 3 is what you operate. Do not set chrome in serif or running preview in sans, except the Paste composer (unrendered markdown) and preview placeholders.

## Layout

A two-pane desk, not a card grid. Header is a single chrome row (12px / 16px padding, 16px gap). Below it, the Map list is a 320px stone column (min 200px) with a 1px hairline on the right; the preview pane takes the rest, padded 24px / 32px, paper throughout.

Reading measure is 72ch. List rhythm is the 4–8–12–16–24–32px scale; ticket rows indent from that scale. Map-list tabs and the Remaining-work filter sit in the sidebar, not in the header. Copy Skip / Copy Take live in a 48px-min action strip above the list.

Below 800px the desk stacks: header controls wrap, the Map list becomes a 40vh band with a bottom hairline, and the pane padding drops to 16px.

**The Occupied Pane Rule.** Paste preview occupies the preview pane; it does not open a card, modal, or second column.

## Elevation & Depth

Flat at rest. Depth is tonal: Pale Chrome around the desk, Stone Sidebar recessed from Laid Paper, Warm Hairline as the only rest edge. No drop shadow on header, sidebar, buttons, rows, or the preview pane.

The Term hint slip is the sole lift. Frontier is not a shadow: it is an inset 1px Chart Navy rule on the ticket row. Selected rows and active tabs use Chart Navy Wash, not elevation. A pending Load occupies the desk: ghost Map-list rows on stone, “Opening this Project.” on paper. File switch dims the current preview (180ms ease-out); it does not dim with a veil, spin, or replace the pane with “Loading…”.

### Shadow Vocabulary

- **Hint slip** (`box-shadow: 0 12px 28px rgba(0, 0, 0, 0.45)`): Term hint card only, while hovering a hint.
- **Focus ring** (`0 0 0 2px {chrome}, 0 0 0 4px {accent-ink}`): Keyboard focus on controls. State, not rest.
- **Frontier rule** (`box-shadow: inset 1px 0 {accent-ink}`): The current remaining-work mark in the Tickets list.

**The Flat-By-Default Rule.** Surfaces are flat at rest. The Term hint slip is the only drop shadow. Do not lift chrome, paper, or controls to “help” hierarchy.

## Shapes

Barely-there corners. Controls, tabs, chips, banners, code, and the hint slip use 3px (sm) or 4px (md). The Paste composer is square (`border-radius: 0`) and borderless — it is the blotter, not a field. Native inputs keep a 1px Warm Hairline; they do not grow a thick stroke at rest.

No pills, no large radii, no clipped hero shapes. Blockquotes are a 1px left hairline, not a filled bar.

## Components

Quiet chrome, one filled Load. Outline navy for copy and paste; ghost for Archive and caption modes.

### Buttons

- **Shape:** 4px radius on Load and outline; 3px on Archive.
- **Primary (Load):** Chart Navy fill, Load Ink text, 6px 14px, chrome 14px / 500. Hover darkens to Chart Navy Hover. Disabled at 0.6 opacity. The only solid fill on the desk.
- **Outline (Copy Skip, Copy Take, Paste):** Transparent, Accent Ink stroke and text, 12px / 500, min-height 28px, 4px 8px. Hover = Chart Navy Wash. Pressed = Accent Pressed veil and Accent Ink Hover stroke. Paste pressed (`aria-pressed`) keeps the wash. Disabled Paste at 0.45 opacity.
- **Ghost (Archive, caption mode):** No fill, no chrome stroke on caption mode; Archive is a 10px uppercase mark with a Warm Hairline. Hover darkens text toward Warm Ink; Archive hover adds Ink Wash. Caption mode “on” is 600, still not navy.
- **Focus:** Shared focus ring. Never a thick rest outline.

### Chips

- **Kind / cycle / claimed:** Transparent, Warm Hairline, Muted Ink, Mark type.
- **Frontier / Spec:** Same cut, Accent Ink stroke and text. These are status, not buttons.
- **Do not** fill chips with navy wash. The selected state belongs to the row, not the mark.

### Cards / Containers

- **Preview pane:** Laid Paper, no card edge, no shadow, 72ch measure. Headings, lists, tables, and code sit in the flow.
- **Term hint slip:** Laid Paper, Warm Hairline, 4px radius, the one drop shadow, max 24rem × 14rem. Kicker is 11px uppercase Muted Ink. Inherited-from is a hairline-separated uppercase footer.
- **Banners:** 4px, 8px 12px, 12px type, under the header. Error is warm rose; empty-maps is straw. Inline `code` in empty copy is 11px mono.

### Inputs / Fields

- **Path and Recents:** Control fill, Warm Hairline, 4px, 6px 10px, chrome type. Placeholder is Placeholder Ink. Recents hover uses Hairline Hover. Native controls use `color-scheme: dark`.
- **Focus:** The shared Accent Ink ring; no glow.
- **Checkboxes:** Remaining-work uses Warm Ink accent-color; ticket selection uses Accent Ink. 16px box.
- **Paste composer:** Borderless, transparent, caret in Accent Ink, 16px / 1.7, 72ch. Selection uses Chart Navy Wash. Focus has no outline — the pane is already the field.

### Navigation

- **Map list tabs:** Equal flex, 3px radius, Warm Hairline, 12px / 600 Muted Ink. Active is Accent Ink stroke + wash, not a filled tab.
- **Map rows:** Full-width, transparent, 3px radius. Hover is a 4% Warm Ink wash. Selected is Chart Navy Wash. Finished groups dim to 0.62; resolved tickets to 0.55.
- **Site labels:** 12px / 500 / 0.04em / uppercase Muted Ink.

### Term hints

Dotted underline in the existing ink (1px, 0.18em offset), `cursor: help`. No color change on the word. The slip is hover chrome in Source Sans 3. Collision lists and Prefer/Avoid stay on the slip; they do not restyle the preview.

**The Dotted Ink Rule.** Term hints decorate the current sentence. They do not speckle the page with Chart Navy.

## Do's and Don'ts

### Do:

- **Do** keep Load as the only Chart Navy fill on any given screen.
- **Do** set GFM preview in Literata at 16px / 1.7 on Laid Paper, 72ch.
- **Do** set chrome, the Map list, and controls in Source Sans 3.
- **Do** separate panes with Warm Hairline and tone (Pale Chrome / Stone Sidebar / Laid Paper).
- **Do** mark Frontier with the inset 1px Accent Ink rule and the Frontier chip, not a glow.
- **Do** honor `prefers-reduced-motion`: preview swap is 180ms opacity, or none; pending Map-list bars stay still.
- **Do** keep `color-scheme: dark` on the page. Always dark; no selector.
- **Do** occupy a pending Load with ghost Map-list rows and “Opening this Project.” on paper. File switch dims the current preview; it does not replace it with copy.

### Don't:

- **Don't** add a second filled navy control (Copy, Paste, tabs, chips, Archive).
- **Don't** turn the Map list into a filesystem tree.
- **Don't** color Term hints or give them a second underline style.
- **Don't** introduce a cool-OLED world, a light revert, or new chrome roles.
- **Don't** drop-shadow header, sidebar, paper, or buttons. The hint slip is the exception.
- **Don't** card the preview or the Paste composer.
- **Don't** use radii above 4px, pills, or display type.
- **Don't** veil the desk, spin, or flash italic “Loading…”.
