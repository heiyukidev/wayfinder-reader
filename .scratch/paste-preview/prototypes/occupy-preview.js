// PROTOTYPE PRIMARY SOURCE (throwaway). A won: Caption toggle.
// B Header + stacked live / C Sidebar + split were rejected.
// Fold into public/ on the ship ticket; this file is the variant record.
import get from '/vendor/lodash-es/get.js'
import find from '/vendor/lodash-es/find.js'
import findIndex from '/vendor/lodash-es/findIndex.js'
import forEach from '/vendor/lodash-es/forEach.js'
import map from '/vendor/lodash-es/map.js'
import size from '/vendor/lodash-es/size.js'
import toArray from '/vendor/lodash-es/toArray.js'
import { marked } from '/vendor/marked/lib/marked.esm.js'
import { applyTermHints, hideTermHintCard } from '/term-hints.js'

marked.setOptions({ gfm: true })

const VARIANTS = [
  { key: 'A', name: 'Caption toggle' },
  { key: 'B', name: 'Header + stacked live' },
  { key: 'C', name: 'Sidebar + split' },
]

const SAMPLE_PASTE = `# Grill notes

After Load, paste markdown into the Reader. The Paste preview is not a Map list row.

Hover Term on a Ticket or Map. A Term hint should appear. Do not treat this as a highlight.

Relative links like [the map](../map.md) should not open a file. https://example.com may.

Take prompt and Skip prompt stay on the selected Ticket, even while the pane shows paste.
`

const TERMS = [
  {
    term: 'Reader',
    definition: 'This product: shows Wayfinder maps from a chosen Project.',
    aliases: [],
    contextName: 'Reader',
  },
  {
    term: 'Project',
    definition: 'A folder on the filesystem the user selects.',
    aliases: [],
    contextName: 'Reader',
  },
  {
    term: 'Map',
    definition: 'The index issue for an Effort.',
    aliases: [],
    contextName: 'Reader',
  },
  {
    term: 'Ticket',
    definition: 'A child issue in an Effort. One decision.',
    aliases: [],
    contextName: 'Reader',
  },
  {
    term: 'Term',
    definition: 'A glossary entry from a language document.',
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
    aliases: ['transcript', 'scratch pad'],
    contextName: 'Reader',
  },
  {
    term: 'Map list',
    definition: 'The Reader sidebar.',
    aliases: [],
    contextName: 'Reader',
  },
  {
    term: 'Take prompt',
    definition: 'Clipboard text for one Frontier Ticket or Spec-only Spec.',
    aliases: [],
    contextName: 'Reader',
  },
  {
    term: 'Skip prompt',
    definition: 'Clipboard text from selected Tickets.',
    aliases: [],
    contextName: 'Reader',
  },
]

const FILES = {
  '.scratch/paste-preview/map.md': `# Paste markdown into the preview and see Term hints

## Destination

After a Project is Loaded, Khaled can paste markdown into the preview. It renders with that Project’s Term hints.

## Notes

Carry execution into the map. Destination is the working Paste preview.
`,
  '.scratch/paste-preview/issues/01-how-a-paste-preview-occupies-the-preview-pane.md': `# How a Paste preview occupies the preview pane

Type: prototype
Status: claimed

## Question

How should a Paste preview occupy the existing preview pane so Khaled can paste GFM, see Term hints from the Loaded Project, and return to a Map list file?
`,
  '.scratch/paste-preview/issues/02-ship-paste-preview-in-the-reader.md': `# Ship Paste preview in the Reader

Type: task
Blocked by: 01

## Question

Fold the signed-off Paste preview into the one public/ Reader.
`,
}

const ROWS = [
  {
    kind: 'map',
    title: 'Paste markdown into the preview and see Term hints',
    path: '.scratch/paste-preview/map.md',
  },
  {
    kind: 'ticket',
    title: 'How a Paste preview occupies the preview pane',
    path: '.scratch/paste-preview/issues/01-how-a-paste-preview-occupies-the-preview-pane.md',
    claimed: true,
    frontier: false,
  },
  {
    kind: 'ticket',
    title: 'Ship Paste preview in the Reader',
    path: '.scratch/paste-preview/issues/02-ship-paste-preview-in-the-reader.md',
    blocked: true,
    frontier: false,
  },
]

const PROTOTYPE_CSS = `
.proto-banner {
  margin: 0;
  padding: 8px 16px;
  background: #1c1917;
  color: #f4efe6;
  font-size: 12px;
  line-height: 1.4;
}
.proto-banner strong { font-weight: 600; }
.header-extra, .caption-actions, .sidebar-extra {
  display: flex;
  align-items: center;
  gap: 8px;
}
.preview-pane {
  display: flex;
  flex-direction: column;
}
.preview-caption {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  flex-shrink: 0;
}
#caption-text { min-width: 0; }
.preview-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.preview-body .preview { flex: 1; }
.paste-btn {
  padding: 4px 10px;
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-accent);
  font: inherit;
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
}
.paste-btn[aria-pressed="true"] {
  background: var(--color-accent-wash);
}
.paste-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.paste-btn:focus-visible,
.caption-mode-btn:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}
.caption-mode-btn {
  padding: 2px 8px;
  border: 1px solid var(--color-hairline);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-ink-muted);
  font: inherit;
  font-size: var(--text-sm);
  cursor: pointer;
}
.caption-mode-btn.is-on {
  border-color: var(--color-accent);
  color: var(--color-accent);
}
.caption-chip {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--color-accent);
  white-space: nowrap;
}
.paste-composer {
  width: 100%;
  min-height: 12rem;
  padding: 10px 12px;
  border: 1px solid var(--color-hairline);
  border-radius: var(--radius-md);
  background: #fff;
  color: var(--color-ink);
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.5;
  resize: vertical;
}
.paste-composer:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}
.paste-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  flex: 1;
}
.paste-stack .paste-composer { flex: 0 0 auto; min-height: 9rem; }
.paste-stack .preview { padding-top: 0; }
.paste-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  min-height: 0;
  flex: 1;
}
.paste-split .paste-composer {
  min-height: 0;
  height: 100%;
  resize: none;
}
.paste-split .preview {
  max-width: none;
  padding-top: 0;
  overflow: auto;
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
  background: #1c1917;
  color: #f4efe6;
  border-radius: 999px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
  font-family: var(--font-sans);
  font-size: 13px;
}
.prototype-switcher-arrow {
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 999px;
  background: #292524;
  color: inherit;
  font: inherit;
  cursor: pointer;
}
.prototype-switcher-copy { min-width: 220px; text-align: center; }
.prototype-switcher-label { font-weight: 600; }
.prototype-switcher-fill {
  border: 0;
  border-radius: 999px;
  background: #44403c;
  color: inherit;
  font: inherit;
  font-size: 12px;
  padding: 6px 10px;
  cursor: pointer;
}
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
  background: #1c1917;
  color: #f4efe6;
  border-radius: 6px;
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 1.45;
  white-space: pre-wrap;
}
`

const loadBtn = document.getElementById('load-btn')
const projectNameEl = document.getElementById('project-name')
const mapActionsEl = document.getElementById('map-actions')
const mapListEl = document.getElementById('map-list')
const copySkipBtn = document.getElementById('copy-skip-btn')
const copyTakeBtn = document.getElementById('copy-take-btn')
const copyStatusEl = document.getElementById('copy-status')
const captionText = document.getElementById('caption-text')
const captionActions = document.getElementById('caption-actions')
const headerExtra = document.getElementById('header-extra')
const sidebarExtra = document.getElementById('sidebar-extra')
const previewBody = document.getElementById('preview-body')

const state = {
  loaded: false,
  selectedPath: null,
  showingPaste: false,
  compose: true,
  buffer: '',
  copyStatus: '',
}

function currentVariant() {
  const key = new URLSearchParams(window.location.search).get('variant')
  return get(find(VARIANTS, (item) => get(item, 'key') === key), 'key', 'A')
}

function variantMeta(key) {
  return find(VARIANTS, (item) => get(item, 'key') === key) || get(VARIANTS, 0)
}

function setVariant(key) {
  const url = new URL(window.location.href)
  url.searchParams.set('variant', key)
  window.history.replaceState({}, '', url)
}

function selectedRow() {
  return find(ROWS, (row) => get(row, 'path') === state.selectedPath)
}

function bindPreviewLinks(root) {
  forEach(toArray(root.querySelectorAll('a')), (a) => {
    const href = a.getAttribute('href') || ''
    if (/^https?:/i.test(href)) {
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      return
    }
    if (href.startsWith('#')) return
    a.addEventListener('click', (event) => event.preventDefault())
  })
}

function renderMarkdown(target, source) {
  hideTermHintCard()
  target.classList.remove('preview-empty')
  if (!source) {
    target.innerHTML = '<p class="preview-placeholder">Paste markdown.</p>'
    return
  }
  target.innerHTML = marked.parse(source)
  bindPreviewLinks(target)
  applyTermHints(target, TERMS)
}

function makeComposer() {
  const textarea = document.createElement('textarea')
  textarea.className = 'paste-composer'
  textarea.setAttribute('aria-label', 'Paste markdown')
  textarea.placeholder = 'Paste GFM here.'
  textarea.value = state.buffer
  textarea.addEventListener('input', () => {
    state.buffer = textarea.value
    if (currentVariant() === 'A' && !state.compose) return
    const live = document.getElementById('paste-live')
    if (live) renderMarkdown(live, state.buffer)
    dumpState()
  })
  return textarea
}

function renderFile() {
  previewBody.className = 'preview-body'
  previewBody.replaceChildren()
  const preview = document.createElement('div')
  preview.id = 'preview'
  preview.className = 'preview'
  previewBody.appendChild(preview)
  const content = get(FILES, [state.selectedPath], '')
  renderMarkdown(preview, content)
}

function renderVariantA() {
  previewBody.className = 'preview-body'
  previewBody.replaceChildren()
  if (state.compose) {
    previewBody.appendChild(makeComposer())
    return
  }
  const preview = document.createElement('div')
  preview.id = 'preview'
  preview.className = 'preview'
  previewBody.appendChild(preview)
  renderMarkdown(preview, state.buffer)
}

function renderVariantB() {
  previewBody.className = 'preview-body paste-stack'
  previewBody.replaceChildren()
  previewBody.appendChild(makeComposer())
  const preview = document.createElement('div')
  preview.id = 'paste-live'
  preview.className = 'preview'
  previewBody.appendChild(preview)
  renderMarkdown(preview, state.buffer)
}

function renderVariantC() {
  previewBody.className = 'preview-body paste-split'
  previewBody.replaceChildren()
  previewBody.appendChild(makeComposer())
  const preview = document.createElement('div')
  preview.id = 'paste-live'
  preview.className = 'preview'
  previewBody.appendChild(preview)
  renderMarkdown(preview, state.buffer)
}

function emptyPreview() {
  previewBody.className = 'preview-body'
  previewBody.replaceChildren()
  const preview = document.createElement('div')
  preview.id = 'preview'
  preview.className = 'preview preview-empty'
  preview.innerHTML = '<p class="preview-placeholder">Load a Project.</p>'
  previewBody.appendChild(preview)
}

function paintCaption() {
  captionActions.replaceChildren()
  const key = currentVariant()
  if (!state.loaded) {
    captionText.textContent = ''
    if (key === 'A') captionActions.appendChild(makePasteButton())
    return
  }
  if (state.showingPaste) {
    if (key === 'A') {
      captionText.textContent = 'Paste preview'
      captionActions.appendChild(makeModeButton('Compose', true))
      captionActions.appendChild(makeModeButton('Show', false))
      captionActions.appendChild(makePasteButton())
      return
    }
    if (key === 'B') {
      captionText.textContent = 'Paste preview · session'
      return
    }
    const row = selectedRow()
    captionText.textContent = get(row, 'path', '')
    const chip = document.createElement('span')
    chip.className = 'caption-chip'
    chip.textContent = 'showing paste · Take/Skip still this file'
    captionActions.appendChild(chip)
    return
  }
  captionText.textContent = state.selectedPath || ''
  if (key === 'A') captionActions.appendChild(makePasteButton())
}

function makeModeButton(label, composeValue) {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'caption-mode-btn'
  if (state.compose === composeValue) button.classList.add('is-on')
  button.textContent = label
  button.addEventListener('click', () => {
    state.compose = composeValue
    render()
  })
  return button
}

function makePasteButton() {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'paste-btn'
  button.textContent = 'Paste'
  button.disabled = !state.loaded
  button.setAttribute('aria-pressed', state.showingPaste ? 'true' : 'false')
  if (!state.loaded) button.title = 'Load a Project first'
  button.addEventListener('click', () => {
    if (!state.loaded) return
    state.showingPaste = !state.showingPaste
    if (state.showingPaste && currentVariant() === 'A') state.compose = size(state.buffer) === 0
    render()
  })
  return button
}

function placePasteControl() {
  headerExtra.replaceChildren()
  sidebarExtra.replaceChildren()
  const key = currentVariant()
  if (key === 'B') headerExtra.appendChild(makePasteButton())
  if (key === 'C') sidebarExtra.appendChild(makePasteButton())
}

function renderMapList() {
  mapListEl.replaceChildren()
  if (!state.loaded) return
  const site = document.createElement('div')
  site.className = 'site-label'
  site.textContent = 'wayfinder-reader'
  mapListEl.appendChild(site)
  const group = document.createElement('div')
  group.className = 'map-group'
  forEach(ROWS, (row) => {
    if (get(row, 'kind') === 'map') {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'map-row map-heading-row'
      if (state.selectedPath === get(row, 'path')) button.classList.add('selected')
      const title = document.createElement('span')
      title.className = 'map-title'
      title.textContent = get(row, 'title')
      const pathEl = document.createElement('span')
      pathEl.className = 'map-path'
      pathEl.textContent = get(row, 'path')
      button.appendChild(title)
      button.appendChild(pathEl)
      button.addEventListener('click', () => selectFile(get(row, 'path')))
      group.appendChild(button)
      return
    }
    const wrap = document.createElement('div')
    wrap.className = 'ticket-row'
    const check = document.createElement('input')
    check.type = 'checkbox'
    check.className = 'ticket-selection'
    check.setAttribute('aria-label', `Select ${get(row, 'title')}`)
    const previewButton = document.createElement('button')
    previewButton.type = 'button'
    previewButton.className = 'ticket-preview'
    if (state.selectedPath === get(row, 'path')) wrap.classList.add('selected')
    const title = document.createElement('span')
    title.textContent = get(row, 'title')
    previewButton.appendChild(title)
    if (get(row, 'claimed')) {
      const mark = document.createElement('span')
      mark.className = 'ticket-mark'
      mark.textContent = 'claimed'
      previewButton.appendChild(mark)
    }
    if (get(row, 'blocked')) {
      const mark = document.createElement('span')
      mark.className = 'ticket-mark'
      mark.textContent = 'blocked'
      previewButton.appendChild(mark)
    }
    previewButton.addEventListener('click', () => selectFile(get(row, 'path')))
    wrap.appendChild(check)
    wrap.appendChild(previewButton)
    group.appendChild(wrap)
  })
  mapListEl.appendChild(group)
}

function selectFile(relPath) {
  state.selectedPath = relPath
  state.showingPaste = false
  const row = find(ROWS, (item) => get(item, 'path') === relPath)
  copyTakeBtn.hidden = !get(row, 'frontier', false)
  render()
}

function loadProject() {
  state.loaded = true
  state.buffer = ''
  state.showingPaste = false
  state.compose = true
  state.copyStatus = ''
  projectNameEl.hidden = false
  projectNameEl.textContent = 'wayfinder-reader'
  mapActionsEl.hidden = false
  selectFile(get(ROWS, [0, 'path']))
}

function dumpState() {
  const dump = document.getElementById('prototype-state-dump')
  if (!dump) return
  dump.textContent = JSON.stringify(
    {
      question: 'How should Paste preview occupy the preview pane?',
      variant: `${currentVariant()} (${get(variantMeta(currentVariant()), 'name')})`,
      loaded: state.loaded,
      showingPaste: state.showingPaste,
      compose: state.compose,
      bufferChars: size(state.buffer),
      selectedPath: state.selectedPath,
      takeSkipOn: 'Map list selection, not pane contents',
    },
    null,
    2,
  )
}

function syncSwitcher() {
  const label = document.getElementById('prototype-variant-label')
  const meta = variantMeta(currentVariant())
  if (label) label.textContent = `${get(meta, 'key')} (${get(meta, 'name')})`
}

function render() {
  placePasteControl()
  paintCaption()
  renderMapList()
  copyStatusEl.textContent = state.copyStatus
  if (!state.loaded) emptyPreview()
  else if (!state.showingPaste) renderFile()
  else if (currentVariant() === 'B') renderVariantB()
  else if (currentVariant() === 'C') renderVariantC()
  else renderVariantA()
  dumpState()
  syncSwitcher()
}

function cycleVariant(delta) {
  const index = findIndex(VARIANTS, (item) => get(item, 'key') === currentVariant())
  const next = get(VARIANTS, (index + delta + size(VARIANTS)) % size(VARIANTS))
  setVariant(get(next, 'key'))
  render()
}

function mountSwitcher() {
  if (!document.getElementById('prototype-occupy-css')) {
    const style = document.createElement('style')
    style.id = 'prototype-occupy-css'
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
    <button type="button" class="prototype-switcher-arrow" data-delta="-1" aria-label="Previous variant">←</button>
    <div class="prototype-switcher-copy">
      <div id="prototype-variant-label" class="prototype-switcher-label">A (Caption toggle)</div>
    </div>
    <button type="button" class="prototype-switcher-arrow" data-delta="1" aria-label="Next variant">→</button>
    <button type="button" class="prototype-switcher-fill" id="fill-sample">Fill sample</button>
  `
  document.body.appendChild(bar)
  forEach(bar.querySelectorAll('[data-delta]'), (button) => {
    button.addEventListener('click', () => cycleVariant(Number(button.getAttribute('data-delta'))))
  })
  document.getElementById('fill-sample').addEventListener('click', () => {
    if (!state.loaded) loadProject()
    state.buffer = SAMPLE_PASTE
    state.showingPaste = true
    state.compose = false
    render()
  })
  window.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    const target = event.target
    if (target && target.matches('input, textarea, select, [contenteditable="true"]')) return
    cycleVariant(event.key === 'ArrowLeft' ? -1 : 1)
  })
}

loadBtn.addEventListener('click', loadProject)
copySkipBtn.addEventListener('click', () => {
  const row = selectedRow()
  state.copyStatus = `Skip for ${get(row, 'title', 'selection')} (not the paste)`
  render()
})
copyTakeBtn.addEventListener('click', () => {
  const row = selectedRow()
  state.copyStatus = `Take for ${get(row, 'title', 'selection')} (not the paste)`
  render()
})

if (!new URLSearchParams(window.location.search).get('variant')) setVariant('A')
mountSwitcher()
render()
