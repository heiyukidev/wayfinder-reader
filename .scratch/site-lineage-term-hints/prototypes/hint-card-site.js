// PROTOTYPE PRIMARY SOURCE (throwaway). C won: Inherited footer.
// A Nothing extra / B Always-on Site chip were rejected.
// Three variants of the Term hint card's Site provenance, switchable via
// ?variant=, on the existing Reader preview of a billing ADR (and root CONTEXT.md).
import assign from '/vendor/lodash-es/assign.js'
import get from '/vendor/lodash-es/get.js'
import filter from '/vendor/lodash-es/filter.js'
import find from '/vendor/lodash-es/find.js'
import findIndex from '/vendor/lodash-es/findIndex.js'
import flatten from '/vendor/lodash-es/flatten.js'
import forEach from '/vendor/lodash-es/forEach.js'
import includes from '/vendor/lodash-es/includes.js'
import join from '/vendor/lodash-es/join.js'
import map from '/vendor/lodash-es/map.js'
import size from '/vendor/lodash-es/size.js'
import some from '/vendor/lodash-es/some.js'
import toArray from '/vendor/lodash-es/toArray.js'
import toLower from '/vendor/lodash-es/toLower.js'
import trim from '/vendor/lodash-es/trim.js'
import uniq from '/vendor/lodash-es/uniq.js'
import { marked } from '/vendor/marked/lib/marked.esm.js'
import { hideTermHintCard, matchTermHints } from '/term-hints.js'

marked.setOptions({ gfm: true })

const VARIANTS = [
  { key: 'A', name: 'Nothing extra' },
  { key: 'B', name: 'Always-on Site chip' },
  { key: 'C', name: 'Inherited footer' },
]

const CASES = [
  { key: 'invoice', label: 'Invoice (local)', needle: 'Invoice' },
  { key: 'site', label: 'Site (inherited on billing)', needle: 'Site' },
  { key: 'map', label: 'Map (same-Site collision)', needle: 'Map' },
  { key: 'alias', label: 'highlight (alias)', needle: 'highlight' },
]

const SITES = [
  { rel: 'apps/billing', title: 'Billing' },
  { rel: '.', title: 'Reader' },
  { rel: 'apps/shipping', title: 'Shipping' },
]

const ALL_TERMS = [
  {
    term: 'Invoice',
    definition: 'A bill issued by the Billing Site for one customer period.',
    aliases: [],
    contextName: 'Billing',
    siteRel: 'apps/billing',
  },
  {
    term: 'Site',
    definition: 'A directory inside the Project that owns CONTEXT.md and/or .scratch/.',
    aliases: [],
    contextName: 'Reader',
    siteRel: '.',
  },
  {
    term: 'Term hint',
    definition: 'Hover definition of a Term on the GFM preview.',
    aliases: ['highlight'],
    contextName: 'Reader',
    siteRel: '.',
  },
  {
    term: 'Map',
    definition: 'The index issue for an Effort.',
    aliases: [],
    contextName: 'Reader',
    siteRel: '.',
  },
  {
    term: 'Map',
    definition: 'The CONTEXT-MAP listing of Sites in this Project.',
    aliases: [],
    contextName: 'Context map',
    siteRel: '.',
  },
  {
    term: 'Shipping rate',
    definition: 'Price to ship a parcel. Sibling Site language; must not hint on billing.',
    aliases: [],
    contextName: 'Shipping',
    siteRel: 'apps/shipping',
  },
]

const FILES = {
  'apps/billing/docs/adr/0001.md': {
    title: 'Invoice is issued per Site',
    mark: 'ADR',
    owningRel: 'apps/billing',
    lineageRels: ['apps/billing', '.'],
    source: `# Invoice is issued per Site

An Invoice is issued per Site. Do not treat highlight as a Term hint.

The Map lists Efforts. Shipping rate is a sibling phrase and must not hint here.
`,
  },
  'CONTEXT.md': {
    title: 'Reader',
    mark: 'Language',
    owningRel: '.',
    lineageRels: ['.'],
    source: `# Reader

A Site owns language. An Invoice lives on billing and must not hint here.

The Map is listed twice on purpose.
`,
  },
  'apps/shipping/CONTEXT.md': {
    title: 'Shipping',
    mark: 'Language',
    owningRel: 'apps/shipping',
    lineageRels: ['apps/shipping', '.'],
    source: `# Shipping

A Shipping rate is local here. Invoice is a cousin and must not hint.

A Site still inherits from Reader. The Map collision is root language.
`,
  },
}

const FILE_ORDER = ['apps/billing/docs/adr/0001.md', 'CONTEXT.md', 'apps/shipping/CONTEXT.md']

const hintModels = new WeakMap()
let hideCardTimer = 0
const state = {
  selectedPath: 'apps/billing/docs/adr/0001.md',
  pinnedCase: 'site',
  hovered: null,
}

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
.proto-banner code {
  font-family: var(--font-mono);
  font-size: 11px;
}
.prototype-dock {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.prototype-switcher {
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
.prototype-case-bar {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
  max-width: min(92vw, 52rem);
}
.prototype-case-btn {
  border: 0;
  border-radius: 999px;
  background: #1c1917;
  color: #f4efe6;
  font: inherit;
  font-size: 12px;
  padding: 6px 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
  cursor: pointer;
}
.prototype-case-btn.is-on { background: #1e3a5f; }
.prototype-state-dump {
  position: fixed;
  right: 12px;
  bottom: 16px;
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
.proto-card-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 6px;
}
.proto-card-head .term-hint-kicker { margin-bottom: 0; }
.proto-site-chip {
  flex: 0 0 auto;
  padding: 1px 6px;
  border: 1px solid var(--color-hairline);
  border-radius: 999px;
  color: var(--color-ink-muted);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}
.proto-inherited-foot {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--color-hairline);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--color-ink-muted);
}
.term-hint-card.is-pinned { outline: 2px solid var(--color-accent); }
`

function phraseKey(value) {
  return toLower(trim(value))
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

function selectedFile() {
  return get(FILES, state.selectedPath)
}

function siteByRel(rel) {
  return find(SITES, (site) => get(site, 'rel') === rel)
}

function siteTitle(rel) {
  return get(siteByRel(rel), 'title', rel === '.' ? 'Project root' : rel)
}

function overlayTerms() {
  const lineageRels = get(selectedFile(), 'lineageRels', [])
  const inLineage = filter(ALL_TERMS, (row) => includes(lineageRels, get(row, 'siteRel')))
  const termKeys = uniq(map(inLineage, (row) => phraseKey(get(row, 'term'))))
  return flatten(
    map(termKeys, (termKey) => {
      const defining = filter(inLineage, (row) => phraseKey(get(row, 'term')) === termKey)
      const closestRel = find(lineageRels, (rel) => some(defining, (row) => get(row, 'siteRel') === rel))
      return filter(defining, (row) => get(row, 'siteRel') === closestRel)
    }),
  )
}

function recordsForTerm(term) {
  const key = phraseKey(term)
  return filter(overlayTerms(), (row) => phraseKey(get(row, 'term')) === key)
}

function enrichModel(model) {
  const kind = get(model, 'kind')
  const owningRel = get(selectedFile(), 'owningRel')
  const lineageRels = get(selectedFile(), 'lineageRels', [])
  if (kind === 'prefer') {
    const firstTerm = get(model, ['terms', 0], '')
    const record = get(recordsForTerm(firstTerm), 0)
    const siteRel = get(record, 'siteRel', '')
    return assign({}, model, {
      siteRel,
      siteTitle: siteTitle(siteRel),
      inherited: Boolean(siteRel) && siteRel !== owningRel,
      lineageRels,
    })
  }
  if (kind === 'definition') {
    const matches = filter(
      recordsForTerm(get(model, 'term')),
      (row) => phraseKey(get(row, 'contextName')) === phraseKey(get(model, 'contextName')),
    )
    const record = get(matches, 0) || get(recordsForTerm(get(model, 'term')), 0)
    const siteRel = get(record, 'siteRel', '')
    return assign({}, model, {
      siteRel,
      siteTitle: siteTitle(siteRel),
      inherited: Boolean(siteRel) && siteRel !== owningRel,
      lineageRels,
    })
  }
  const rows = map(get(model, 'rows', []), (row) => {
    const matches = filter(
      recordsForTerm(get(model, 'term')),
      (record) => phraseKey(get(record, 'contextName')) === phraseKey(get(row, 'contextName')),
    )
    const record = get(matches, 0)
    const siteRel = get(record, 'siteRel', '')
    return assign({}, row, {
      siteRel,
      siteTitle: siteTitle(siteRel),
    })
  })
  const siteRel = get(rows, [0, 'siteRel'], '')
  return assign({}, model, {
    rows,
    siteRel,
    siteTitle: siteTitle(siteRel),
    inherited: Boolean(siteRel) && siteRel !== owningRel,
    lineageRels,
  })
}

function bindCardLinks(root) {
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

function fillMarkdown(el, source) {
  el.innerHTML = marked.parse(source || '')
  bindCardLinks(el)
}

function hintKicker(model) {
  if (get(model, 'kind') === 'prefer') return 'Prefer'
  return get(model, 'term', 'Term')
}

function appendDefinition(card, source) {
  const wrap = document.createElement('div')
  wrap.className = 'term-hint-def'
  fillMarkdown(wrap, source)
  card.appendChild(wrap)
}

function appendCollisionList(card, model) {
  const list = document.createElement('ul')
  list.className = 'term-hint-collision'
  forEach(get(model, 'rows', []), (row) => {
    const item = document.createElement('li')
    const context = document.createElement('span')
    context.className = 'term-hint-context'
    context.textContent = get(row, 'contextName', '')
    const def = document.createElement('div')
    def.className = 'term-hint-def'
    fillMarkdown(def, get(row, 'definition', ''))
    item.appendChild(context)
    item.appendChild(def)
    list.appendChild(item)
  })
  card.appendChild(list)
}

function appendPrefer(card, model) {
  const wrap = document.createElement('div')
  wrap.className = 'term-hint-prefer'
  const names = get(model, 'terms', [])
  const source =
    size(names) === 1
      ? `Prefer **${get(names, 0)}**.`
      : `Prefer ${join(
          map(names, (name) => `**${name}**`),
          ' or ',
        )}.`
  fillMarkdown(wrap, source)
  card.appendChild(wrap)
}

function appendBody(card, model) {
  const kind = get(model, 'kind')
  if (kind === 'prefer') {
    appendPrefer(card, model)
    return
  }
  if (kind === 'definition') {
    appendDefinition(card, get(model, 'definition', ''))
    return
  }
  appendCollisionList(card, model)
}

function fillVariantA(card, model) {
  const kicker = document.createElement('span')
  kicker.className = 'term-hint-kicker'
  kicker.textContent = hintKicker(model)
  card.appendChild(kicker)
  appendBody(card, model)
}

function fillVariantB(card, model) {
  const head = document.createElement('div')
  head.className = 'proto-card-head'
  const kicker = document.createElement('span')
  kicker.className = 'term-hint-kicker'
  kicker.textContent = hintKicker(model)
  head.appendChild(kicker)
  if (get(model, 'siteTitle')) {
    const chip = document.createElement('span')
    chip.className = 'proto-site-chip'
    chip.textContent = get(model, 'siteTitle')
    head.appendChild(chip)
  }
  card.appendChild(head)
  appendBody(card, model)
}

function fillVariantC(card, model) {
  fillVariantA(card, model)
  if (!get(model, 'inherited')) return
  const foot = document.createElement('div')
  foot.className = 'proto-inherited-foot'
  foot.textContent = `Inherited from ${get(model, 'siteTitle')}`
  card.appendChild(foot)
}

function fillHintCard(card, model) {
  card.replaceChildren()
  const key = currentVariant()
  if (key === 'B') fillVariantB(card, model)
  else if (key === 'C') fillVariantC(card, model)
  else fillVariantA(card, model)
}

function ensureHintCard() {
  let card = document.getElementById('term-hint-card')
  if (card) return card
  card = document.createElement('div')
  card.id = 'term-hint-card'
  card.className = 'term-hint-card'
  card.hidden = true
  card.addEventListener('mouseenter', cancelHideCard)
  card.addEventListener('mouseleave', scheduleHideCard)
  document.body.appendChild(card)
  return card
}

function cancelHideCard() {
  window.clearTimeout(hideCardTimer)
}

function hideCard() {
  cancelHideCard()
  const card = document.getElementById('term-hint-card')
  if (card) {
    card.hidden = true
    card.classList.remove('is-pinned')
  }
  if (!state.pinnedCase) state.hovered = null
  dumpState()
}

function scheduleHideCard() {
  if (state.pinnedCase) return
  cancelHideCard()
  hideCardTimer = window.setTimeout(hideCard, 160)
}

function placeHintCard(anchor, pinned) {
  cancelHideCard()
  const card = ensureHintCard()
  const model = hintModels.get(anchor)
  fillHintCard(card, model)
  card.hidden = false
  card.classList.toggle('is-pinned', Boolean(pinned))
  const rect = anchor.getBoundingClientRect()
  const cardRect = card.getBoundingClientRect()
  let left = rect.left
  let top = rect.bottom + 8
  if (left + cardRect.width > window.innerWidth - 8) left = window.innerWidth - cardRect.width - 8
  if (left < 8) left = 8
  if (top + cardRect.height > window.innerHeight - 8) top = rect.top - cardRect.height - 8
  if (top < 8) top = 8
  card.style.left = `${left}px`
  card.style.top = `${top}px`
  state.hovered = {
    text: anchor.textContent,
    kind: get(model, 'kind'),
    term: get(model, 'term') || join(get(model, 'terms', []), ', '),
    siteRel: get(model, 'siteRel'),
    siteTitle: get(model, 'siteTitle'),
    inherited: get(model, 'inherited'),
  }
  dumpState()
}

function makeHintEl(hit) {
  const el = document.createElement('span')
  el.className = 'term-hint'
  el.textContent = get(hit, 'text')
  el.tabIndex = 0
  hintModels.set(el, enrichModel(get(hit, 'model')))
  el.addEventListener('mouseenter', () => {
    if (state.pinnedCase) return
    placeHintCard(el, false)
  })
  el.addEventListener('mouseleave', scheduleHideCard)
  el.addEventListener('focus', () => {
    if (state.pinnedCase) return
    placeHintCard(el, false)
  })
  el.addEventListener('blur', scheduleHideCard)
  return el
}

function wrapNode(node, terms) {
  const text = node.nodeValue
  const matches = matchTermHints(text, terms)
  if (size(matches) === 0) return
  const frag = document.createDocumentFragment()
  let last = 0
  forEach(matches, (hit) => {
    const index = get(hit, 'index')
    if (index > last) frag.append(text.slice(last, index))
    frag.appendChild(makeHintEl(hit))
    last = index + size(get(hit, 'text'))
  })
  if (last < size(text)) frag.append(text.slice(last))
  node.parentNode.replaceChild(frag, node)
}

function collectTextNodes(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!trim(node.nodeValue)) return NodeFilter.FILTER_REJECT
      if (node.parentElement && node.parentElement.closest('code, pre, a, .term-hint, .term-hint-card')) {
        return NodeFilter.FILTER_REJECT
      }
      return NodeFilter.FILTER_ACCEPT
    },
  })
  const nodes = []
  let current = walker.nextNode()
  while (current) {
    nodes.push(current)
    current = walker.nextNode()
  }
  return nodes
}

function applyHints(root) {
  hideCard()
  const terms = overlayTerms()
  forEach(collectTextNodes(root), (node) => {
    if (!node.parentNode) return
    wrapNode(node, terms)
  })
}

function dumpState() {
  const dump = document.getElementById('prototype-state-dump')
  if (!dump) return
  const file = selectedFile()
  dump.textContent = JSON.stringify(
    {
      question: 'How should the hint card show which Site supplied the Term?',
      variant: `${currentVariant()} (${get(variantMeta(currentVariant()), 'name')})`,
      previewedPath: state.selectedPath,
      owningSite: get(file, 'owningRel'),
      siteLineage: get(file, 'lineageRels'),
      overlaySiteRels: uniq(map(overlayTerms(), (row) => get(row, 'siteRel'))),
      pinnedCase: state.pinnedCase,
      hovered: state.hovered,
      identity: 'Site rel; card shows title at read time',
    },
    null,
    2,
  )
}

function pinCase(caseKey) {
  const spec = find(CASES, (item) => get(item, 'key') === caseKey)
  state.pinnedCase = caseKey
  const preview = document.getElementById('preview')
  const needle = phraseKey(get(spec, 'needle'))
  const match = find(
    toArray(preview.querySelectorAll('.term-hint')),
    (el) => phraseKey(el.textContent) === needle,
  )
  forEach(document.querySelectorAll('.prototype-case-btn'), (button) => {
    button.classList.toggle('is-on', button.getAttribute('data-case') === caseKey)
  })
  if (!match) {
    hideCard()
    state.hovered = { missing: get(spec, 'needle'), reason: 'not in this file’s overlay' }
    dumpState()
    return
  }
  match.scrollIntoView({ block: 'center' })
  placeHintCard(match, true)
}

function renderPreview() {
  const file = selectedFile()
  const caption = document.getElementById('caption-text')
  const preview = document.getElementById('preview')
  caption.textContent = state.selectedPath
  hideTermHintCard()
  preview.classList.remove('preview-empty')
  preview.innerHTML = marked.parse(get(file, 'source', ''))
  applyHints(preview)
  if (state.pinnedCase) pinCase(state.pinnedCase)
  dumpState()
}

function renderMapList() {
  const nav = document.getElementById('map-list')
  nav.replaceChildren()
  const rootLabel = document.createElement('div')
  rootLabel.className = 'site-label'
  rootLabel.textContent = 'Reader'
  nav.appendChild(rootLabel)

  const contextGroup = document.createElement('div')
  contextGroup.className = 'map-group'
  forEach(['CONTEXT.md', 'apps/shipping/CONTEXT.md'], (relPath) => {
    const meta = get(FILES, relPath)
    const row = document.createElement('button')
    row.type = 'button'
    row.className = 'map-row map-heading-row'
    if (state.selectedPath === relPath) row.classList.add('selected')
    const titleLine = document.createElement('span')
    titleLine.className = 'map-title-line'
    const title = document.createElement('span')
    title.className = 'map-title'
    title.textContent = get(meta, 'title')
    const mark = document.createElement('span')
    mark.className = 'kind-mark'
    mark.textContent = get(meta, 'mark')
    titleLine.appendChild(title)
    titleLine.appendChild(mark)
    const pathEl = document.createElement('span')
    pathEl.className = 'map-path'
    pathEl.textContent = relPath
    row.appendChild(titleLine)
    row.appendChild(pathEl)
    row.addEventListener('click', () => {
      state.selectedPath = relPath
      render()
    })
    contextGroup.appendChild(row)
  })
  nav.appendChild(contextGroup)

  const billingLabel = document.createElement('div')
  billingLabel.className = 'site-label'
  billingLabel.textContent = 'Billing'
  nav.appendChild(billingLabel)
  const billingGroup = document.createElement('div')
  billingGroup.className = 'map-group'
  const adrPath = 'apps/billing/docs/adr/0001.md'
  const adrMeta = get(FILES, adrPath)
  const adrRow = document.createElement('button')
  adrRow.type = 'button'
  adrRow.className = 'map-row map-heading-row'
  if (state.selectedPath === adrPath) adrRow.classList.add('selected')
  const adrTitleLine = document.createElement('span')
  adrTitleLine.className = 'map-title-line'
  const adrTitle = document.createElement('span')
  adrTitle.className = 'map-title'
  adrTitle.textContent = get(adrMeta, 'title')
  const adrMark = document.createElement('span')
  adrMark.className = 'kind-mark'
  adrMark.textContent = 'ADR'
  adrTitleLine.appendChild(adrTitle)
  adrTitleLine.appendChild(adrMark)
  const adrPathEl = document.createElement('span')
  adrPathEl.className = 'map-path'
  adrPathEl.textContent = adrPath
  adrRow.appendChild(adrTitleLine)
  adrRow.appendChild(adrPathEl)
  adrRow.addEventListener('click', () => {
    state.selectedPath = adrPath
    render()
  })
  billingGroup.appendChild(adrRow)
  nav.appendChild(billingGroup)
}

function syncSwitcher() {
  const label = document.getElementById('prototype-variant-label')
  const meta = variantMeta(currentVariant())
  if (label) label.textContent = `${get(meta, 'key')} (${get(meta, 'name')})`
  forEach(document.querySelectorAll('.prototype-case-btn'), (button) => {
    button.classList.toggle('is-on', button.getAttribute('data-case') === state.pinnedCase)
  })
}

function render() {
  renderMapList()
  renderPreview()
  syncSwitcher()
}

function cycleVariant(delta) {
  const index = findIndex(VARIANTS, (item) => get(item, 'key') === currentVariant())
  const next = get(VARIANTS, (index + delta + size(VARIANTS)) % size(VARIANTS))
  setVariant(get(next, 'key'))
  render()
}

function mountChrome() {
  if (!document.getElementById('prototype-hint-card-css')) {
    const style = document.createElement('style')
    style.id = 'prototype-hint-card-css'
    style.textContent = PROTOTYPE_CSS
    document.head.appendChild(style)
  }

  const dump = document.createElement('pre')
  dump.id = 'prototype-state-dump'
  dump.className = 'prototype-state-dump'
  document.body.appendChild(dump)

  const dock = document.createElement('div')
  dock.className = 'prototype-dock'

  const cases = document.createElement('div')
  cases.className = 'prototype-case-bar'
  cases.setAttribute('role', 'group')
  cases.setAttribute('aria-label', 'Pin a Term hint case')
  forEach(CASES, (item) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'prototype-case-btn'
    button.setAttribute('data-case', get(item, 'key'))
    button.textContent = get(item, 'label')
    if (state.pinnedCase === get(item, 'key')) button.classList.add('is-on')
    button.addEventListener('click', () => {
      state.pinnedCase = state.pinnedCase === get(item, 'key') ? '' : get(item, 'key')
      render()
    })
    cases.appendChild(button)
  })
  dock.appendChild(cases)

  const bar = document.createElement('div')
  bar.id = 'prototype-switcher'
  bar.className = 'prototype-switcher'
  bar.innerHTML = `
    <button type="button" class="prototype-switcher-arrow" data-delta="-1" aria-label="Previous variant">←</button>
    <div class="prototype-switcher-copy">
      <div id="prototype-variant-label" class="prototype-switcher-label">A (Nothing extra)</div>
    </div>
    <button type="button" class="prototype-switcher-arrow" data-delta="1" aria-label="Next variant">→</button>
  `
  dock.appendChild(bar)
  document.body.appendChild(dock)
  forEach(bar.querySelectorAll('[data-delta]'), (button) => {
    button.addEventListener('click', () => cycleVariant(Number(button.getAttribute('data-delta'))))
  })
  window.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    const target = event.target
    if (target && target.matches('input, textarea, select, [contenteditable="true"]')) return
    cycleVariant(event.key === 'ArrowLeft' ? -1 : 1)
  })
}

document.getElementById('load-btn').addEventListener('click', () => {
  state.selectedPath = get(FILE_ORDER, 0)
  render()
})

if (!new URLSearchParams(window.location.search).get('variant')) setVariant('A')
mountChrome()
render()
