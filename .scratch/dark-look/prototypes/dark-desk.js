// PROTOTYPE PRIMARY SOURCE (throwaway). A won: Desk invert.
// B Lifted Load / C Stronger grain were rejected.
// Impeccable polish: Load fill stays #1e3a5f. On-dark strokes/text/caret/focus
// use accent-ink so links, Skip/Take, marks, and tabs meet contrast.
// Fold into public/ on the ship ticket; this file is the variant record.
import get from '/vendor/lodash-es/get.js'
import find from '/vendor/lodash-es/find.js'
import findIndex from '/vendor/lodash-es/findIndex.js'
import forEach from '/vendor/lodash-es/forEach.js'
import size from '/vendor/lodash-es/size.js'
import toArray from '/vendor/lodash-es/toArray.js'
import toPairs from '/vendor/lodash-es/toPairs.js'
import { marked } from '/vendor/marked/lib/marked.esm.js'
import { applyTermHints, hideTermHintCard } from '/term-hints.js'

marked.setOptions({ gfm: true })

const VARIANTS = [
  { key: 'A', name: 'Desk invert' },
  { key: 'B', name: 'Lifted Load' },
  { key: 'C', name: 'Stronger grain' },
]

const SCENES = [
  { key: 'preview', name: 'GFM preview' },
  { key: 'compose', name: 'Paste composer' },
  { key: 'show', name: 'Paste Show' },
  { key: 'hint', name: 'Term hint slip' },
  { key: 'error', name: 'Error banner' },
  { key: 'empty', name: 'Empty Project' },
  { key: 'always-on', name: 'Always-on path' },
]

const SAMPLE_GFM = `# Recast the Reader Look as a dark reading desk

The **Reader** is a reading desk. Chrome is Source Sans 3. The pane is Source Serif 4 GFM with **Term hints**.

## Destination

Same fonts, spacing, and chrome roles. Register changes. **Load** stays the one filled action. No selector.

> Paper is the page the lamp hits. The **Map list** is stone in the periphery. Hairlines separate, they do not decorate.

Hover **Term hint** or **Paste preview**. An inherited **Site** names the ancestor.

\`inline code\` sits in a dipped well.

\`\`\`
Status: claimed
Blocked by: 01
\`\`\`

| Role | Light | Dark |
| --- | --- | --- |
| Paper | #f4efe6 | #1c1917 |
| Ink | #1c1917 | #f4efe6 |
| Load | #1e3a5f | variant |

Relative links like [the map](../map.md) stay in the pane. https://example.com may leave.

---

A **Ticket** on the frontier is takeable. Claimed stays claimed.
`

const SAMPLE_PASTE = `Paste is not a **Map list** row. Compose sits on the paper, not a card.

Show this column in Source Serif 4. Keep **Term hints** dotted in existing ink.
`

const TERMS = [
  {
    term: 'Reader',
    definition: 'This product: shows Wayfinder maps from a chosen Project.',
    aliases: [],
    contextName: 'Reader',
  },
  {
    term: 'Load',
    definition: 'The one filled action that opens a Project.',
    aliases: [],
    contextName: 'Reader',
  },
  {
    term: 'Map list',
    definition: 'The Reader sidebar, with Context and Tickets tabs.',
    aliases: [],
    contextName: 'Reader',
  },
  {
    term: 'Term hint',
    definition: 'Hover definition of a Term on the GFM preview.',
    aliases: ['highlight'],
    contextName: 'Reader',
  },
  {
    term: 'Paste preview',
    definition: 'Ephemeral GFM the visitor pastes. Session memory only.',
    aliases: ['transcript'],
    contextName: 'Reader',
  },
  {
    term: 'Site',
    definition: 'A directory inside the Project that owns CONTEXT.md and/or .scratch/.',
    aliases: [],
    contextName: 'Reader',
    rel: '.',
    siteTitle: 'Reader',
  },
  {
    term: 'Ticket',
    definition: 'A child issue in an Effort. One decision.',
    aliases: [],
    contextName: 'Reader',
  },
  {
    term: 'Look',
    definition: 'Reading desk: warm paper GFM, stone Map list, navy Load.',
    aliases: [],
    contextName: 'Reader',
  },
]

const LOOKS = {
  A: {
    ink: '#f4efe6',
    muted: '#b5ada0',
    placeholder: '#8a8175',
    paper: '#1c1917',
    sidebar: '#161310',
    chrome: '#12100e',
    hairline: '#3a3530',
    hairlineHover: '#4a453e',
    accent: '#1e3a5f',
    accentHover: '#254a75',
    accentInk: '#7a9cc4',
    accentInkHover: '#8eacd0',
    accentWash: 'rgba(90, 126, 170, 0.22)',
    accentPressed: 'rgba(90, 126, 170, 0.32)',
    inkWash: 'rgba(244, 239, 230, 0.06)',
    loadInk: '#f4efe6',
    control: '#241f1b',
    errorBg: '#2c1a18',
    errorText: '#f0c4be',
    errorBorder: '#6a403c',
    emptyBg: '#221c16',
    emptyText: '#c4b9a8',
    emptyBorder: '#3a3530',
    codeBg: '#141210',
    hintShadow: '0 12px 28px rgba(0, 0, 0, 0.45)',
  },
  B: {
    ink: '#f4efe6',
    muted: '#b5ada0',
    placeholder: '#8a8175',
    paper: '#1c1917',
    sidebar: '#161310',
    chrome: '#12100e',
    hairline: '#3a3530',
    hairlineHover: '#4a453e',
    accent: '#4a6fa0',
    accentHover: '#3d618c',
    accentInk: '#7a9cc4',
    accentInkHover: '#8eacd0',
    accentWash: 'rgba(74, 111, 160, 0.24)',
    accentPressed: 'rgba(74, 111, 160, 0.34)',
    inkWash: 'rgba(244, 239, 230, 0.06)',
    loadInk: '#f4efe6',
    control: '#241f1b',
    errorBg: '#2c1a18',
    errorText: '#f0c4be',
    errorBorder: '#6a403c',
    emptyBg: '#221c16',
    emptyText: '#c4b9a8',
    emptyBorder: '#3a3530',
    codeBg: '#141210',
    hintShadow: '0 12px 28px rgba(0, 0, 0, 0.45)',
  },
  C: {
    ink: '#f4efe6',
    muted: '#c4b9a8',
    placeholder: '#a89f93',
    paper: '#1c1917',
    sidebar: '#161310',
    chrome: '#12100e',
    hairline: '#5a534a',
    hairlineHover: '#6a6358',
    accent: '#1e3a5f',
    accentHover: '#254a75',
    accentInk: '#7a9cc4',
    accentInkHover: '#8eacd0',
    accentWash: 'rgba(90, 126, 170, 0.22)',
    accentPressed: 'rgba(90, 126, 170, 0.32)',
    inkWash: 'rgba(244, 239, 230, 0.08)',
    loadInk: '#f4efe6',
    control: '#241f1b',
    errorBg: '#2c1a18',
    errorText: '#f0c4be',
    errorBorder: '#7a4c46',
    emptyBg: '#221c16',
    emptyText: '#d4cfc4',
    emptyBorder: '#5a534a',
    codeBg: '#141210',
    hintShadow: '0 12px 28px rgba(0, 0, 0, 0.45)',
  },
}

const PROTOTYPE_CSS = `
html { color-scheme: dark; }
* { scrollbar-color: var(--color-hairline) var(--color-chrome); }
.proto-banner {
  margin: 0;
  padding: 8px 16px;
  background: #f4efe6;
  color: #1c1917;
  font-family: var(--font-sans);
  font-size: 12px;
  line-height: 1.4;
}
.proto-banner strong { font-weight: 600; }
::selection {
  background: var(--color-accent-wash);
  color: var(--color-ink);
}
#project-path,
#recents {
  background: var(--color-control);
  color: var(--color-ink);
  color-scheme: dark;
}
#project-path:hover,
#recents:hover {
  border-color: var(--color-hairline-hover);
}
#load-btn {
  color: var(--color-load-ink);
}
.preview a,
.term-hint-card a,
#copy-skip-btn,
#copy-take-btn,
.paste-btn,
.frontier-mark,
.spec-mark,
.map-list-tab.is-active {
  color: var(--color-accent-ink);
}
#copy-skip-btn,
#copy-take-btn,
.paste-btn,
.frontier-mark,
.spec-mark,
.map-list-tab.is-active {
  border-color: var(--color-accent-ink);
}
.preview a:hover {
  color: var(--color-accent-ink-hover);
}
#copy-skip-btn:active,
#copy-take-btn:active,
.paste-btn:active:not(:disabled) {
  border-color: var(--color-accent-ink-hover);
  background: var(--color-accent-pressed);
}
.map-row:hover,
.archive-btn:hover {
  background: var(--color-ink-wash);
}
.preview th {
  background: var(--color-ink-wash);
}
.term-hint-card {
  box-shadow: var(--color-hint-shadow);
}
.ticket-row.frontier {
  box-shadow: inset 1px 0 var(--color-accent-ink);
}
.ticket-selection {
  accent-color: var(--color-accent-ink);
}
.paste-composer {
  caret-color: var(--color-accent-ink);
}
.prototype-switcher {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: #f4efe6;
  color: #1c1917;
  border-radius: 999px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  font-family: var(--font-sans);
  font-size: 12px;
}
.prototype-switcher-arrow,
.prototype-switcher-scene {
  border: 0;
  border-radius: 999px;
  background: #ece8df;
  color: inherit;
  font: inherit;
  cursor: pointer;
}
.prototype-switcher-arrow {
  width: 32px;
  height: 32px;
}
.prototype-switcher-scene {
  padding: 6px 10px;
  font-size: 12px;
  white-space: nowrap;
}
.prototype-switcher-copy { min-width: 168px; text-align: center; }
.prototype-switcher-label { font-weight: 600; }
.prototype-state-dump {
  position: fixed;
  right: 12px;
  bottom: 64px;
  z-index: 9998;
  max-width: 340px;
  max-height: 42vh;
  overflow: auto;
  margin: 0;
  padding: 10px 12px;
  background: #f4efe6;
  color: #1c1917;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.45;
  white-space: pre-wrap;
}
`

const pathInput = document.getElementById('project-path')
const pathLabel = document.querySelector('label[for="project-path"]')
const projectName = document.getElementById('project-name')
const errorEl = document.getElementById('error')
const emptyEl = document.getElementById('empty-maps')
const mapActions = document.getElementById('map-actions')
const mapListEl = document.getElementById('map-list')
const copySkipBtn = document.getElementById('copy-skip-btn')
const copyTakeBtn = document.getElementById('copy-take-btn')
const copyStatusEl = document.getElementById('copy-status')
const captionText = document.getElementById('caption-text')
const captionActions = document.getElementById('caption-actions')
const previewBody = document.getElementById('preview-body')
const remainingFilter = document.getElementById('unresolved-filter')

const state = {
  mapListTab: 'tickets',
  selectedPath: '.scratch/dark-look/map.md',
  showingPaste: false,
  compose: true,
  buffer: SAMPLE_PASTE,
  copyStatus: '',
  remainingWorkOnly: true,
}

function params() {
  return new URLSearchParams(window.location.search)
}

function currentVariant() {
  const key = params().get('variant')
  return get(find(VARIANTS, (item) => get(item, 'key') === key), 'key', 'A')
}

function currentScene() {
  const key = params().get('scene')
  return get(find(SCENES, (item) => get(item, 'key') === key), 'key', 'preview')
}

function variantMeta(key) {
  return find(VARIANTS, (item) => get(item, 'key') === key) || get(VARIANTS, 0)
}

function sceneMeta(key) {
  return find(SCENES, (item) => get(item, 'key') === key) || get(SCENES, 0)
}

function setSearch(next) {
  const url = new URL(window.location.href)
  forEach(toPairs(next), ([key, value]) => {
    url.searchParams.set(key, value)
  })
  window.history.replaceState({}, '', url)
}

function applyLook(key) {
  const look = get(LOOKS, key, LOOKS.A)
  const root = document.documentElement
  forEach(
    [
      ['--color-ink', look.ink],
      ['--color-ink-muted', look.muted],
      ['--color-ink-placeholder', look.placeholder],
      ['--color-paper', look.paper],
      ['--color-sidebar', look.sidebar],
      ['--color-chrome', look.chrome],
      ['--color-hairline', look.hairline],
      ['--color-hairline-hover', look.hairlineHover],
      ['--color-accent', look.accent],
      ['--color-accent-hover', look.accentHover],
      ['--color-accent-ink', look.accentInk],
      ['--color-accent-ink-hover', look.accentInkHover],
      ['--color-accent-wash', look.accentWash],
      ['--color-accent-pressed', look.accentPressed],
      ['--color-ink-wash', look.inkWash],
      ['--color-load-ink', look.loadInk],
      ['--color-control', look.control],
      ['--color-error-bg', look.errorBg],
      ['--color-error-text', look.errorText],
      ['--color-error-border', look.errorBorder],
      ['--color-empty-bg', look.emptyBg],
      ['--color-empty-text', look.emptyText],
      ['--color-empty-border', look.emptyBorder],
      ['--color-code-bg', look.codeBg],
      ['--color-hint-shadow', look.hintShadow],
      ['--focus-ring', '0 0 0 2px var(--color-chrome), 0 0 0 4px var(--color-accent-ink)'],
    ],
    ([token, value]) => {
      root.style.setProperty(token, value)
    },
  )
}

function bindPreviewLinks(root) {
  forEach(toArray(root.querySelectorAll('a')), (anchor) => {
    const href = anchor.getAttribute('href') || ''
    if (/^https?:/i.test(href)) {
      anchor.target = '_blank'
      anchor.rel = 'noopener noreferrer'
      return
    }
    if (href.startsWith('#')) return
    anchor.addEventListener('click', (event) => event.preventDefault())
  })
}

function renderMarkdown(target, source) {
  hideTermHintCard()
  target.classList.remove('preview-empty')
  if (!source) {
    target.classList.add('preview-empty')
    target.innerHTML = '<p class="preview-placeholder">Paste markdown.</p>'
    return
  }
  target.innerHTML = marked.parse(source)
  bindPreviewLinks(target)
  applyTermHints(target, TERMS, 'apps/billing')
}

function makeComposer() {
  const textarea = document.createElement('textarea')
  textarea.className = 'paste-composer'
  textarea.setAttribute('aria-label', 'Paste markdown')
  textarea.placeholder = 'Paste GFM here.'
  textarea.value = state.buffer
  textarea.addEventListener('input', () => {
    state.buffer = textarea.value
    dumpState()
  })
  return textarea
}

function makePasteButton() {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'paste-btn'
  button.textContent = 'Paste'
  button.setAttribute('aria-pressed', state.showingPaste ? 'true' : 'false')
  button.addEventListener('click', () => {
    state.showingPaste = !state.showingPaste
    if (state.showingPaste) state.compose = size(state.buffer) === 0
    render()
  })
  return button
}

function makeModeButton(label, composeValue) {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'caption-mode-btn'
  if (state.compose === composeValue) button.classList.add('is-on')
  button.setAttribute('aria-pressed', state.compose === composeValue ? 'true' : 'false')
  button.textContent = label
  button.addEventListener('click', () => {
    state.compose = composeValue
    render()
  })
  return button
}

function paintCaption(scene) {
  captionActions.replaceChildren()
  captionText.replaceChildren()
  if (scene === 'empty') {
    captionText.textContent = ''
    return
  }
  if (scene === 'compose' || scene === 'show' || state.showingPaste) {
    captionText.textContent = 'Paste preview'
    captionActions.appendChild(makeModeButton('Compose', true))
    captionActions.appendChild(makeModeButton('Show', false))
    captionActions.appendChild(makePasteButton())
    return
  }
  captionText.textContent = state.selectedPath
  captionActions.appendChild(makePasteButton())
}

function paintPreview(scene) {
  previewBody.replaceChildren()
  if (scene === 'empty') {
    const preview = document.createElement('div')
    preview.className = 'preview preview-empty'
    preview.innerHTML = '<p class="preview-placeholder">Load a Project.</p>'
    previewBody.appendChild(preview)
    return
  }
  if (scene === 'compose' || (state.showingPaste && state.compose && scene !== 'show')) {
    previewBody.appendChild(makeComposer())
    return
  }
  const preview = document.createElement('div')
  preview.className = 'preview'
  previewBody.appendChild(preview)
  const source =
    scene === 'show' || (state.showingPaste && !state.compose) ? state.buffer : SAMPLE_GFM
  renderMarkdown(preview, source)
}

function makeTab(id, label) {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'map-list-tab'
  if (state.mapListTab === id) button.classList.add('is-active')
  button.textContent = label
  button.addEventListener('click', () => {
    state.mapListTab = id
    render()
  })
  return button
}

function makeDocRow(title, kind, path) {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'map-row map-heading-row'
  if (state.selectedPath === path && !state.showingPaste) button.classList.add('selected')
  const titleLine = document.createElement('span')
  titleLine.className = 'map-title-line'
  const name = document.createElement('span')
  name.className = 'map-title'
  name.textContent = title
  const mark = document.createElement('span')
  mark.className = 'kind-mark'
  mark.textContent = kind
  titleLine.appendChild(name)
  titleLine.appendChild(mark)
  const pathEl = document.createElement('span')
  pathEl.className = 'map-path'
  pathEl.textContent = path
  button.appendChild(titleLine)
  button.appendChild(pathEl)
  button.addEventListener('click', () => {
    state.selectedPath = path
    state.showingPaste = false
    render()
  })
  return button
}

function makeTicketRow(title, flags) {
  const wrap = document.createElement('div')
  wrap.className = 'ticket-row'
  if (get(flags, 'frontier')) wrap.classList.add('frontier')
  if (get(flags, 'resolved')) wrap.classList.add('resolved')
  wrap.style.setProperty('--ticket-indent', `${get(flags, 'indent', 0)}px`)
  if (!get(flags, 'resolved')) {
    const check = document.createElement('input')
    check.type = 'checkbox'
    check.className = 'ticket-selection'
    check.setAttribute('aria-label', `Select ${title}`)
    wrap.appendChild(check)
  }
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'ticket-preview'
  const name = document.createElement('span')
  name.className = 'ticket-title'
  name.textContent = title
  button.appendChild(name)
  if (get(flags, 'frontier')) {
    const mark = document.createElement('span')
    mark.className = 'frontier-mark'
    mark.textContent = 'frontier'
    button.appendChild(mark)
  }
  if (get(flags, 'claimed')) {
    const mark = document.createElement('span')
    mark.className = 'claimed-mark'
    mark.textContent = 'claimed'
    button.appendChild(mark)
  }
  wrap.appendChild(button)
  return wrap
}

function renderContextTab() {
  const language = document.createElement('section')
  language.className = 'map-group'
  language.appendChild(makeDocRow('CONTEXT', 'Language', 'CONTEXT.md'))
  mapListEl.appendChild(language)
  const adrs = document.createElement('section')
  adrs.className = 'map-group'
  adrs.appendChild(makeDocRow('Term hints from language files', 'ADR', 'docs/adr/0006-term-hints-from-language-files.md'))
  mapListEl.appendChild(adrs)
  const out = document.createElement('section')
  out.className = 'map-group'
  out.appendChild(makeDocRow('Cool OLED second Look', 'Out of scope', '.out-of-scope/oled-look.md'))
  mapListEl.appendChild(out)
}

function renderTicketsTab() {
  const site = document.createElement('div')
  site.className = 'site-label'
  site.textContent = 'wayfinder-reader'
  mapListEl.appendChild(site)

  const group = document.createElement('div')
  group.className = 'map-group'
  const headingWrap = document.createElement('div')
  headingWrap.className = 'map-heading-wrap'
  const mapRow = document.createElement('button')
  mapRow.type = 'button'
  mapRow.className = 'map-row map-heading-row'
  if (state.selectedPath === '.scratch/dark-look/map.md' && !state.showingPaste) {
    mapRow.classList.add('selected')
  }
  const titleLine = document.createElement('span')
  titleLine.className = 'map-title-line'
  const title = document.createElement('span')
  title.className = 'map-title'
  title.textContent = 'Recast the Reader Look as a dark reading desk'
  titleLine.appendChild(title)
  const pathEl = document.createElement('span')
  pathEl.className = 'map-path'
  pathEl.textContent = '.scratch/dark-look/map.md'
  mapRow.appendChild(titleLine)
  mapRow.appendChild(pathEl)
  mapRow.addEventListener('click', () => {
    state.selectedPath = '.scratch/dark-look/map.md'
    state.showingPaste = false
    render()
  })
  headingWrap.appendChild(mapRow)
  const archive = document.createElement('button')
  archive.type = 'button'
  archive.className = 'archive-btn'
  archive.textContent = 'Archive'
  headingWrap.appendChild(archive)
  group.appendChild(headingWrap)

  const spec = document.createElement('button')
  spec.type = 'button'
  spec.className = 'map-row map-heading-row nested-spec'
  const specLine = document.createElement('span')
  specLine.className = 'map-title-line'
  const specTitle = document.createElement('span')
  specTitle.className = 'map-title'
  specTitle.textContent = 'Dark Look'
  const specMark = document.createElement('span')
  specMark.className = 'spec-mark'
  specMark.textContent = 'spec'
  specLine.appendChild(specTitle)
  specLine.appendChild(specMark)
  spec.appendChild(specLine)
  group.appendChild(spec)

  group.appendChild(
    makeTicketRow('What does the dark reading desk look like', { frontier: true, claimed: true }),
  )
  group.appendChild(makeTicketRow('Ship the dark Look in the Reader', { indent: 16 }))
  if (!state.remainingWorkOnly) {
    group.appendChild(makeTicketRow('A closed look ticket from another Effort', { resolved: true }))
  }
  mapListEl.appendChild(group)
}

function renderMapList(scene) {
  mapListEl.replaceChildren()
  if (scene === 'empty') {
    const empty = document.createElement('p')
    empty.className = 'map-empty'
    empty.textContent = 'No rows this Load.'
    mapListEl.appendChild(empty)
    return
  }
  const tabs = document.createElement('div')
  tabs.className = 'map-list-tabs'
  tabs.appendChild(makeTab('context', 'Context'))
  tabs.appendChild(makeTab('tickets', 'Tickets'))
  mapListEl.appendChild(tabs)
  if (state.mapListTab === 'context') renderContextTab()
  else renderTicketsTab()
}

function applyScene(scene) {
  const alwaysOn = scene === 'always-on'
  pathInput.hidden = !alwaysOn
  pathLabel.hidden = !alwaysOn
  projectName.hidden = alwaysOn
  errorEl.hidden = scene !== 'error'
  emptyEl.hidden = scene !== 'empty'
  mapActions.hidden = scene === 'empty'
  remainingFilter.closest('label').hidden = scene === 'empty'
  if (scene === 'compose' || scene === 'show') {
    state.showingPaste = true
    state.compose = scene === 'compose'
  } else {
    state.showingPaste = false
  }
}

function pinHintIfNeeded(scene) {
  if (scene !== 'hint') return
  const hints = toArray(document.querySelectorAll('.preview .term-hint'))
  const hint =
    find(hints, (el) => el.textContent === 'Site') || get(hints, 0)
  if (!hint) return
  hint.dispatchEvent(new Event('mouseenter'))
  hint.focus()
}

function dumpState() {
  const dump = document.getElementById('prototype-state-dump')
  if (!dump) return
  const look = get(LOOKS, currentVariant())
  dump.textContent = JSON.stringify(
    {
      question: 'What should the Reader look like as a dark translation of the signed-off reading desk?',
      variant: `${currentVariant()} (${get(variantMeta(currentVariant()), 'name')})`,
      scene: `${currentScene()} (${get(sceneMeta(currentScene()), 'name')})`,
      tokens: {
        paper: get(look, 'paper'),
        ink: get(look, 'ink'),
        muted: get(look, 'muted'),
        hairline: get(look, 'hairline'),
        accent: get(look, 'accent'),
        accentInk: get(look, 'accentInk'),
        control: get(look, 'control'),
      },
      colorScheme: 'dark',
      mapListTab: state.mapListTab,
      showingPaste: state.showingPaste,
      compose: state.compose,
    },
    null,
    2,
  )
}

function syncSwitcher() {
  const variantLabel = document.getElementById('prototype-variant-label')
  const sceneLabel = document.getElementById('prototype-scene-label')
  const variant = variantMeta(currentVariant())
  const scene = sceneMeta(currentScene())
  if (variantLabel) variantLabel.textContent = `${get(variant, 'key')} (${get(variant, 'name')})`
  if (sceneLabel) sceneLabel.textContent = get(scene, 'name')
}

function render() {
  const variant = currentVariant()
  const scene = currentScene()
  document.body.dataset.look = variant
  document.body.dataset.scene = scene
  applyLook(variant)
  applyScene(scene)
  paintCaption(scene)
  renderMapList(scene)
  paintPreview(scene)
  copyStatusEl.textContent = state.copyStatus
  dumpState()
  syncSwitcher()
  pinHintIfNeeded(scene)
}

function cycle(list, currentKey, delta) {
  const index = findIndex(list, (item) => get(item, 'key') === currentKey)
  return get(list, (index + delta + size(list)) % size(list))
}

function cycleVariant(delta) {
  setSearch({ variant: get(cycle(VARIANTS, currentVariant(), delta), 'key') })
  render()
}

function cycleScene(delta) {
  setSearch({ scene: get(cycle(SCENES, currentScene(), delta), 'key') })
  render()
}

function mountSwitcher() {
  if (!document.getElementById('prototype-dark-css')) {
    const style = document.createElement('style')
    style.id = 'prototype-dark-css'
    style.textContent = PROTOTYPE_CSS
    document.head.appendChild(style)
  }
  const dump = document.createElement('pre')
  dump.id = 'prototype-state-dump'
  dump.className = 'prototype-state-dump'
  document.body.appendChild(dump)

  const bar = document.createElement('div')
  bar.id = 'prototype-switcher'
  bar.className = 'prototype-switcher'
  bar.innerHTML = `
    <button type="button" class="prototype-switcher-arrow" data-variant="-1" aria-label="Previous variant">←</button>
    <div class="prototype-switcher-copy">
      <div id="prototype-variant-label" class="prototype-switcher-label">A (Desk invert)</div>
    </div>
    <button type="button" class="prototype-switcher-arrow" data-variant="1" aria-label="Next variant">→</button>
    <button type="button" class="prototype-switcher-scene" data-scene="-1" aria-label="Previous scene">◀</button>
    <button type="button" class="prototype-switcher-scene" id="prototype-scene-label">GFM preview</button>
    <button type="button" class="prototype-switcher-scene" data-scene="1" aria-label="Next scene">▶</button>
  `
  document.body.appendChild(bar)
  forEach(bar.querySelectorAll('[data-variant]'), (button) => {
    button.addEventListener('click', () => cycleVariant(Number(button.getAttribute('data-variant'))))
  })
  forEach(bar.querySelectorAll('[data-scene]'), (button) => {
    button.addEventListener('click', () => cycleScene(Number(button.getAttribute('data-scene'))))
  })
  document.getElementById('prototype-scene-label').addEventListener('click', () => cycleScene(1))
  window.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    const target = event.target
    if (target && target.matches('input, textarea, select, [contenteditable="true"]')) return
    cycleVariant(event.key === 'ArrowLeft' ? -1 : 1)
  })
}

remainingFilter.addEventListener('change', () => {
  state.remainingWorkOnly = remainingFilter.checked
  render()
})

copySkipBtn.addEventListener('click', () => {
  state.copyStatus = 'Skip copied (Map list selection)'
  render()
})
copyTakeBtn.addEventListener('click', () => {
  state.copyStatus = 'Take copied (claimed Ticket stays)'
  render()
})

if (!params().get('variant')) setSearch({ variant: 'A' })
if (!params().get('scene')) setSearch({ scene: 'preview' })
mountSwitcher()
render()
