// PROTOTYPE PRIMARY SOURCE (throwaway). A won: Matched chrome.
// B Draft sheet / C Mode in the title were rejected.
// Folded into public/styles.css; this file is the variant record.
import get from '/vendor/lodash-es/get.js'
import find from '/vendor/lodash-es/find.js'
import findIndex from '/vendor/lodash-es/findIndex.js'
import forEach from '/vendor/lodash-es/forEach.js'
import size from '/vendor/lodash-es/size.js'
import toArray from '/vendor/lodash-es/toArray.js'
import { marked } from '/vendor/marked/lib/marked.esm.js'
import { applyTermHints, hideTermHintCard } from '/term-hints.js'

marked.setOptions({ gfm: true })

const VARIANTS = [
  { key: 'A', name: 'Matched chrome' },
  { key: 'B', name: 'Draft sheet' },
  { key: 'C', name: 'Mode in the title' },
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

After a Project is Loaded, Khaled can paste markdown into the preview. It renders with that Project’s Term hints.
`,
  '.scratch/paste-preview/issues/03-visual-polish-of-paste-preview.md': `# Visual polish of Paste preview

The Paste preview control, composer, and rendered GFM fit the reading desk.
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
    title: 'Visual polish of Paste preview',
    path: '.scratch/paste-preview/issues/03-visual-polish-of-paste-preview.md',
    frontier: true,
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
.preview-caption {
  align-items: center;
}
.paste-btn {
  min-height: 28px;
  padding: 4px 8px;
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-accent);
  font: inherit;
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: background var(--transition-swap), border-color var(--transition-swap);
}
.paste-btn[aria-pressed="true"] { background: var(--color-accent-wash); }
.paste-btn:hover:not(:disabled) { background: var(--color-accent-wash); }
.paste-btn:active:not(:disabled) {
  border-color: var(--color-accent-hover);
  background: rgba(30, 58, 95, 0.16);
}
.paste-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.paste-btn:focus-visible,
.caption-mode-btn:focus-visible,
.caption-title-btn:focus-visible,
.look-segment:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

body[data-look="A"] .caption-mode-btn {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-ink-muted);
  font: inherit;
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
}
body[data-look="A"] .caption-mode-btn.is-on {
  color: var(--color-ink);
  font-weight: 600;
}
body[data-look="A"] .caption-mode-btn:hover { color: var(--color-ink); }
body[data-look="A"] .paste-composer {
  width: 100%;
  max-width: 72ch;
  flex: 1;
  min-height: 0;
  padding: var(--space-5) 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--color-ink);
  font-family: var(--font-sans);
  font-size: var(--text-lg);
  line-height: 1.65;
  resize: none;
  caret-color: var(--color-accent);
}
body[data-look="A"] .paste-composer::placeholder { color: var(--color-ink-placeholder); }
body[data-look="A"] .paste-composer::selection {
  background: var(--color-accent-wash);
  color: var(--color-ink);
}
body[data-look="A"] .paste-composer:focus-visible {
  outline: none;
}

body[data-look="B"] .look-segment {
  min-height: 28px;
  padding: 2px 8px;
  border: 1px solid var(--color-hairline);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-ink-muted);
  font: inherit;
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
}
body[data-look="B"] .look-segment.is-on {
  border-color: var(--color-accent);
  color: var(--color-accent);
  background: var(--color-accent-wash);
}
body[data-look="B"] .paste-composer {
  width: 100%;
  max-width: 72ch;
  flex: 1;
  min-height: 0;
  padding: var(--space-5) var(--space-5) var(--space-5) var(--space-6);
  border: 0;
  border-radius: 0;
  background-color: transparent;
  background-image:
    linear-gradient(to right, var(--color-hairline) 1px, transparent 1px),
    repeating-linear-gradient(
      to bottom,
      transparent 0,
      transparent calc(1.65em - 1px),
      var(--color-hairline) calc(1.65em - 1px),
      var(--color-hairline) 1.65em
    );
  background-size: 1px 100%, 100% 1.65em;
  background-position: 12px 0, 0 0;
  background-attachment: local;
  color: var(--color-ink);
  font-family: var(--font-serif);
  font-size: var(--text-lg);
  line-height: 1.65;
  resize: none;
  caret-color: var(--color-accent);
}
body[data-look="B"] .paste-composer::placeholder { color: var(--color-ink-placeholder); }

body[data-look="C"] .caption-title-btn {
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
body[data-look="C"] .mode-mark {
  padding: 1px 4px;
  border: 1px solid var(--color-hairline);
  border-radius: var(--radius-sm);
  color: var(--color-ink-muted);
  font-size: 10px;
  font-weight: 600;
  line-height: 1.4;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
body[data-look="C"] .paste-composer {
  width: 100%;
  max-width: 72ch;
  flex: 1;
  min-height: 0;
  padding: var(--space-5) 0;
  border: 0;
  background: transparent;
  color: var(--color-ink);
  font-family: var(--font-serif);
  font-size: var(--text-lg);
  line-height: 1.65;
  resize: none;
  caret-color: var(--color-ink);
}
body[data-look="C"] .paste-composer::placeholder { color: var(--color-ink-placeholder); }

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
.prototype-switcher-copy { min-width: 240px; text-align: center; }
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

const mapListEl = document.getElementById('map-list')
const copySkipBtn = document.getElementById('copy-skip-btn')
const copyTakeBtn = document.getElementById('copy-take-btn')
const copyStatusEl = document.getElementById('copy-status')
const captionText = document.getElementById('caption-text')
const captionActions = document.getElementById('caption-actions')
const previewBody = document.getElementById('preview-body')

const state = {
  selectedPath: get(ROWS, [0, 'path']),
  showingPaste: true,
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
    dumpState()
  })
  return textarea
}

function renderFile() {
  previewBody.replaceChildren()
  const preview = document.createElement('div')
  preview.className = 'preview'
  previewBody.appendChild(preview)
  renderMarkdown(preview, get(FILES, [state.selectedPath], ''))
}

function renderPaste() {
  previewBody.replaceChildren()
  if (state.compose) {
    previewBody.appendChild(makeComposer())
    return
  }
  const preview = document.createElement('div')
  preview.className = 'preview'
  previewBody.appendChild(preview)
  renderMarkdown(preview, state.buffer)
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
  button.className = currentVariant() === 'B' ? 'look-segment' : 'caption-mode-btn'
  if (state.compose === composeValue) button.classList.add('is-on')
  button.setAttribute('aria-pressed', state.compose === composeValue ? 'true' : 'false')
  button.textContent = label
  button.addEventListener('click', () => {
    state.compose = composeValue
    render()
  })
  return button
}

function paintCaption() {
  captionActions.replaceChildren()
  captionText.replaceChildren()
  if (!state.showingPaste) {
    captionText.textContent = state.selectedPath || ''
    captionActions.appendChild(makePasteButton())
    return
  }
  const key = currentVariant()
  if (key === 'C') {
    const titleBtn = document.createElement('button')
    titleBtn.type = 'button'
    titleBtn.className = 'caption-title-btn'
    titleBtn.textContent = 'Paste preview'
    titleBtn.addEventListener('click', () => {
      state.compose = !state.compose
      render()
    })
    captionText.appendChild(titleBtn)
    const mark = document.createElement('span')
    mark.className = 'mode-mark'
    mark.textContent = state.compose ? 'compose' : 'show'
    captionActions.appendChild(mark)
    captionActions.appendChild(makePasteButton())
    return
  }
  captionText.textContent = 'Paste preview'
  captionActions.appendChild(makeModeButton('Compose', true))
  captionActions.appendChild(makeModeButton('Show', false))
  captionActions.appendChild(makePasteButton())
}

function renderMapList() {
  mapListEl.replaceChildren()
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
      if (state.selectedPath === get(row, 'path') && !state.showingPaste) {
        button.classList.add('selected')
      }
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
    wrap.className = 'ticket-row frontier'
    const check = document.createElement('input')
    check.type = 'checkbox'
    check.className = 'ticket-selection'
    check.setAttribute('aria-label', `Select ${get(row, 'title')}`)
    const previewButton = document.createElement('button')
    previewButton.type = 'button'
    previewButton.className = 'ticket-preview'
    const title = document.createElement('span')
    title.className = 'ticket-title'
    title.textContent = get(row, 'title')
    const mark = document.createElement('span')
    mark.className = 'frontier-mark'
    mark.textContent = 'frontier'
    previewButton.appendChild(title)
    previewButton.appendChild(mark)
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
  render()
}

function dumpState() {
  const dump = document.getElementById('prototype-state-dump')
  if (!dump) return
  dump.textContent = JSON.stringify(
    {
      question: 'How should Paste chrome sit on the reading desk?',
      variant: `${currentVariant()} (${get(variantMeta(currentVariant()), 'name')})`,
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
  document.body.dataset.look = currentVariant()
  paintCaption()
  renderMapList()
  copyStatusEl.textContent = state.copyStatus
  if (state.showingPaste) renderPaste()
  else renderFile()
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
  if (!document.getElementById('prototype-polish-css')) {
    const style = document.createElement('style')
    style.id = 'prototype-polish-css'
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
      <div id="prototype-variant-label" class="prototype-switcher-label">A (Matched chrome)</div>
    </div>
    <button type="button" class="prototype-switcher-arrow" data-delta="1" aria-label="Next variant">→</button>
    <button type="button" class="prototype-switcher-fill" id="fill-sample">Fill sample</button>
  `
  document.body.appendChild(bar)
  forEach(bar.querySelectorAll('[data-delta]'), (button) => {
    button.addEventListener('click', () => cycleVariant(Number(button.getAttribute('data-delta'))))
  })
  document.getElementById('fill-sample').addEventListener('click', () => {
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
