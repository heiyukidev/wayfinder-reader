// PROTOTYPE PRIMARY SOURCE (throwaway). B won: kind marks + titled paper slip.
// A Matched chrome / C Quiet gutter were rejected.
// Folded into public/app.js Map list and public/term-hints.js; this file is the variant record.
import get from '/vendor/lodash-es/get.js'
import filter from '/vendor/lodash-es/filter.js'
import find from '/vendor/lodash-es/find.js'
import findIndex from '/vendor/lodash-es/findIndex.js'
import forEach from '/vendor/lodash-es/forEach.js'
import map from '/vendor/lodash-es/map.js'
import size from '/vendor/lodash-es/size.js'
import join from '/vendor/lodash-es/join.js'
import toLower from '/vendor/lodash-es/toLower.js'
import trim from '/vendor/lodash-es/trim.js'
import uniq from '/vendor/lodash-es/uniq.js'
import uniqBy from '/vendor/lodash-es/uniqBy.js'
import toPairs from '/vendor/lodash-es/toPairs.js'
import orderBy from '/vendor/lodash-es/orderBy.js'
import escapeRegExp from '/vendor/lodash-es/escapeRegExp.js'
import toArray from '/vendor/lodash-es/toArray.js'
import { marked } from '/vendor/marked/lib/marked.esm.js'

marked.setOptions({ gfm: true })

const VARIANTS = [
  { key: 'A', name: 'Matched chrome' },
  { key: 'B', name: 'Kind marks' },
  { key: 'C', name: 'Quiet gutter' },
]

const SKIP_SELECTOR =
  'code, pre, a, .term-hint, .term-hint-card, .term-hint-gutter, .prototype-switcher, .prototype-state-dump'

const PROTOTYPE_CSS = `
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
.prototype-kind-mark {
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
.prototype-spec-ticket {
  padding-left: calc(var(--space-3) + var(--space-5));
}
.prototype-nested-spec {
  padding-left: var(--space-5);
}
.prototype-quiet-spec {
  padding-left: var(--space-5);
  box-shadow: inset 2px 0 var(--color-hairline);
}
.prototype-title-only {
  padding: var(--space-2);
  font-weight: 600;
  line-height: 1.35;
}
.term-hint-card.prototype-matched {
  max-width: 22rem;
  max-height: 8.5rem;
  overflow: auto;
  padding: 8px 10px;
  background: var(--color-chrome);
  font-size: 13px;
  box-shadow: 0 8px 20px rgba(28, 25, 23, 0.14);
}
.term-hint-card.prototype-titled {
  max-width: 24rem;
  max-height: 14rem;
  overflow: hidden;
  padding: 10px 12px 16px;
  background: var(--color-paper);
  border-color: var(--color-hairline);
  box-shadow: 0 12px 28px rgba(28, 25, 23, 0.12);
  mask-image: linear-gradient(to bottom, #000 78%, transparent);
}
.term-hint-kicker {
  display: block;
  margin-bottom: 6px;
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-ink-muted);
}
.preview-pane.prototype-gutter {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 16rem;
  grid-template-rows: auto 1fr;
  column-gap: var(--space-4);
}
.preview-pane.prototype-gutter .preview-caption { grid-column: 1 / -1; }
.preview-pane.prototype-gutter .preview { grid-column: 1; }
.term-hint-gutter {
  grid-column: 2;
  grid-row: 2;
  position: sticky;
  top: 12px;
  align-self: start;
  max-height: calc(100dvh - 8rem);
  overflow: auto;
  padding: 10px 12px;
  background: var(--color-chrome);
  border: 1px solid var(--color-hairline);
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: 13px;
  line-height: 1.45;
  color: var(--color-ink);
}
.term-hint-gutter[hidden],
.term-hint-gutter.is-empty {
  visibility: hidden;
}
.term-hint-gutter p { margin: 0; }
.term-hint-gutter p + p { margin-top: 0.5em; }
.term-hint-gutter strong { font-weight: 600; }
.term-hint-gutter code {
  font-family: var(--font-mono);
  font-size: 0.88em;
  background: var(--color-code-bg);
  padding: 0.1em 0.35em;
  border-radius: var(--radius-sm);
}
.term-hint-gutter a { color: var(--color-accent); }
`

let onVariantChange = () => {}
let hideCardTimer = 0
const hintModels = new WeakMap()
let lastHintState = {
  wrapped: 0,
  preview: null,
  emptyTerms: true,
}

export function isPrototypeMode() {
  return Boolean(new URLSearchParams(window.location.search).get('variant'))
}

export function currentVariant() {
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

function phraseKey(value) {
  return toLower(trim(value))
}

function hintModel(hits) {
  const termHits = filter(hits, (hit) => get(hit, 'type') === 'term')
  if (size(termHits) > 0) {
    const records = uniqBy(
      map(termHits, (hit) => get(hit, 'record')),
      (record) => `${phraseKey(get(record, 'contextName'))}|${phraseKey(get(record, 'term'))}`,
    )
    if (size(records) === 1) {
      return {
        kind: 'definition',
        term: get(records, [0, 'term']),
        definition: get(records, [0, 'definition'], ''),
        contextName: get(records, [0, 'contextName'], ''),
      }
    }
    return {
      kind: 'collision',
      term: get(records, [0, 'term']),
      rows: map(records, (record) => ({
        contextName: get(record, 'contextName', ''),
        definition: get(record, 'definition', ''),
      })),
    }
  }
  const aliasHits = filter(hits, (hit) => get(hit, 'type') === 'alias')
  return {
    kind: 'prefer',
    terms: uniq(map(aliasHits, (hit) => get(hit, 'record.term'))),
  }
}

function compileMatchers(terms) {
  const byPhrase = {}
  forEach(terms, (record) => {
    const termPhrase = phraseKey(get(record, 'term'))
    if (!termPhrase) return
    if (!byPhrase[termPhrase]) byPhrase[termPhrase] = []
    byPhrase[termPhrase].push({ type: 'term', record })
    forEach(get(record, 'aliases', []), (alias) => {
      const aliasPhrase = phraseKey(alias)
      if (!aliasPhrase) return
      if (!byPhrase[aliasPhrase]) byPhrase[aliasPhrase] = []
      byPhrase[aliasPhrase].push({ type: 'alias', record })
    })
  })
  return orderBy(
    map(toPairs(byPhrase), ([phrase, hits]) => ({
      phrase,
      pattern: `(?<![A-Za-z0-9_])${escapeRegExp(phrase)}(?![A-Za-z0-9_])`,
      model: hintModel(hits),
    })),
    [(item) => size(get(item, 'phrase'))],
    ['desc'],
  )
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

function fillHintBody(root, model) {
  const kind = get(model, 'kind')
  if (kind === 'prefer') {
    const wrap = document.createElement('div')
    const names = get(model, 'terms', [])
    const source =
      size(names) === 1
        ? `Prefer **${get(names, 0)}**.`
        : `Prefer ${join(map(names, (name) => `**${name}**`), ' or ')}.`
    fillMarkdown(wrap, source)
    root.appendChild(wrap)
    return
  }
  if (kind === 'definition') {
    const wrap = document.createElement('div')
    fillMarkdown(wrap, get(model, 'definition', ''))
    root.appendChild(wrap)
    return
  }
  const list = document.createElement('ul')
  list.className = 'term-hint-collision'
  forEach(get(model, 'rows', []), (row) => {
    const item = document.createElement('li')
    const context = document.createElement('span')
    context.className = 'term-hint-context'
    context.textContent = get(row, 'contextName', '')
    const def = document.createElement('div')
    fillMarkdown(def, get(row, 'definition', ''))
    item.appendChild(context)
    item.appendChild(def)
    list.appendChild(item)
  })
  root.appendChild(list)
}

function hintKicker(model) {
  if (get(model, 'kind') === 'prefer') return 'Prefer'
  return get(model, 'term', 'Term')
}

function hideOverlay() {
  cancelHideCard()
  const card = document.getElementById('term-hint-card')
  if (card) card.hidden = true
  const rail = document.querySelector('.term-hint-gutter')
  if (rail) {
    rail.classList.add('is-empty')
    rail.hidden = true
  }
}

function cancelHideCard() {
  window.clearTimeout(hideCardTimer)
}

function scheduleHideCard() {
  cancelHideCard()
  hideCardTimer = window.setTimeout(hideOverlay, 160)
}

function teardownLayout(key) {
  hideOverlay()
  const pane = document.querySelector('.preview-pane')
  if (!pane) return
  if (key !== 'C') {
    pane.classList.remove('prototype-gutter')
    const rail = pane.querySelector('.term-hint-gutter')
    if (rail) rail.remove()
  }
}

function ensureOverlay(variantClass) {
  let card = document.getElementById('term-hint-card')
  if (!card) {
    card = document.createElement('div')
    card.id = 'term-hint-card'
    card.addEventListener('mouseenter', cancelHideCard)
    card.addEventListener('mouseleave', scheduleHideCard)
    document.body.appendChild(card)
  }
  card.className = `term-hint-card ${variantClass}`
  return card
}

function placeOverlay(anchor, variantClass, titled) {
  cancelHideCard()
  const card = ensureOverlay(variantClass)
  card.replaceChildren()
  const model = hintModels.get(anchor)
  if (titled) {
    const kicker = document.createElement('span')
    kicker.className = 'term-hint-kicker'
    kicker.textContent = hintKicker(model)
    card.appendChild(kicker)
  }
  fillHintBody(card, model)
  card.hidden = false
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
}

function ensureGutter() {
  const pane = document.querySelector('.preview-pane')
  pane.classList.add('prototype-gutter')
  let rail = pane.querySelector('.term-hint-gutter')
  if (!rail) {
    rail = document.createElement('aside')
    rail.className = 'term-hint-gutter is-empty'
    rail.hidden = true
    rail.addEventListener('mouseenter', cancelHideCard)
    rail.addEventListener('mouseleave', scheduleHideCard)
    pane.appendChild(rail)
  }
  return rail
}

function placeGutter(anchor) {
  cancelHideCard()
  const rail = ensureGutter()
  rail.replaceChildren()
  const model = hintModels.get(anchor)
  const kicker = document.createElement('span')
  kicker.className = 'term-hint-kicker'
  kicker.textContent = hintKicker(model)
  rail.appendChild(kicker)
  fillHintBody(rail, model)
  rail.hidden = false
  rail.classList.remove('is-empty')
}

function attachHint(el, key) {
  const show = () => {
    if (key === 'A') placeOverlay(el, 'prototype-matched', false)
    else if (key === 'B') placeOverlay(el, 'prototype-titled', true)
    else placeGutter(el)
  }
  el.addEventListener('mouseenter', show)
  el.addEventListener('mouseleave', scheduleHideCard)
  el.addEventListener('focus', show)
  el.addEventListener('blur', scheduleHideCard)
}

function skippedAncestor(node) {
  const el = node.parentElement
  return Boolean(el && el.closest(SKIP_SELECTOR))
}

function collectTextNodes(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!trim(node.nodeValue)) return NodeFilter.FILTER_REJECT
      if (skippedAncestor(node)) return NodeFilter.FILTER_REJECT
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

function makeHintEl(matchedText, matcher, key) {
  const el = document.createElement('span')
  el.className = 'term-hint'
  el.textContent = matchedText
  el.tabIndex = 0
  hintModels.set(el, get(matcher, 'model'))
  attachHint(el, key)
  return el
}

function wrapNode(node, matchers, regex, key) {
  const text = node.nodeValue
  regex.lastIndex = 0
  const frag = document.createDocumentFragment()
  let last = 0
  let wrapped = 0
  let match = regex.exec(text)
  while (match) {
    const matchedText = get(match, 0, '')
    const matcher = find(matchers, (item) => phraseKey(get(item, 'phrase')) === phraseKey(matchedText))
    if (matcher) {
      if (match.index > last) frag.append(text.slice(last, match.index))
      frag.appendChild(makeHintEl(matchedText, matcher, key))
      wrapped += 1
      last = match.index + size(matchedText)
    }
    if (!size(matchedText)) regex.lastIndex += 1
    match = regex.exec(text)
  }
  if (wrapped === 0) return 0
  if (last < size(text)) frag.append(text.slice(last))
  node.parentNode.replaceChild(frag, node)
  return wrapped
}

function visibleGroups(host) {
  return get(host, 'remainingWorkOnly')
    ? filter(get(host, 'decisions', []), (group) => !get(group, 'finished', false))
    : get(host, 'decisions', [])
}

function visibleTickets(host, group) {
  return get(host, 'remainingWorkOnly')
    ? filter(get(group, 'tickets', []), (ticket) => !get(ticket, 'resolved', false))
    : get(group, 'tickets', [])
}

function makeTab(host, id, label) {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'map-list-tab'
  if (get(host, 'mapListTab') === id) button.classList.add('is-active')
  button.textContent = label
  button.addEventListener('click', () => get(host, 'setMapListTab')(id))
  return button
}

function selected(host, path) {
  return Boolean(path) && path === get(host, 'selectedRelPath')
}

function appendArchive(parent, group, archiveEffort) {
  if (!get(group, 'finished')) return
  const archiveBtn = document.createElement('button')
  archiveBtn.type = 'button'
  archiveBtn.className = 'archive-btn'
  archiveBtn.textContent = 'Archive'
  archiveBtn.addEventListener('click', (event) => {
    event.preventDefault()
    event.stopPropagation()
    archiveEffort(get(group, 'folder', ''))
  })
  parent.appendChild(archiveBtn)
}

function makeHeadingRow(host, title, path, markText) {
  const row = document.createElement('button')
  row.type = 'button'
  row.className = 'map-row map-heading-row'
  if (selected(host, path)) row.classList.add('selected')
  if (path) row.addEventListener('click', () => get(host, 'selectFile')(path))
  const titleLine = document.createElement('span')
  titleLine.className = 'map-title-line'
  const titleEl = document.createElement('span')
  titleEl.className = 'map-title'
  titleEl.textContent = title
  titleLine.appendChild(titleEl)
  if (markText) {
    const mark = document.createElement('span')
    mark.className = markText === 'Spec' ? 'spec-mark' : 'prototype-kind-mark'
    mark.textContent = markText
    titleLine.appendChild(mark)
  }
  row.appendChild(titleLine)
  if (path) {
    const pathEl = document.createElement('span')
    pathEl.className = 'map-path'
    pathEl.textContent = path
    row.appendChild(pathEl)
  }
  return row
}

function makeLanguageRowA(host, doc) {
  return makeHeadingRow(host, get(doc, 'title', get(doc, 'path')), get(doc, 'path'))
}

function makeLanguageRowB(host, doc, kind) {
  return makeHeadingRow(host, get(doc, 'title', get(doc, 'path')), get(doc, 'path'), kind)
}

function makeLanguageRowC(host, doc) {
  const path = get(doc, 'path', '')
  const row = document.createElement('button')
  row.type = 'button'
  row.className = 'map-row prototype-title-only'
  if (selected(host, path)) row.classList.add('selected')
  row.addEventListener('click', () => get(host, 'selectFile')(path))
  row.textContent = get(doc, 'title', path)
  return row
}

function makeSpecTicket(host, spec) {
  const path = get(spec, 'path', '')
  const row = document.createElement('div')
  row.className = 'map-row ticket-row prototype-spec-ticket'
  if (selected(host, path)) row.classList.add('selected')
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'ticket-preview'
  button.addEventListener('click', () => get(host, 'selectFile')(path))
  const title = document.createElement('span')
  title.className = 'ticket-title'
  title.textContent = get(spec, 'title', 'Spec')
  const meta = document.createElement('span')
  meta.className = 'ticket-meta'
  meta.textContent = 'spec'
  button.appendChild(title)
  button.appendChild(meta)
  row.appendChild(button)
  return row
}

function makeQuietSpec(host, spec) {
  const path = get(spec, 'path', '')
  const row = document.createElement('button')
  row.type = 'button'
  row.className = 'map-row prototype-title-only prototype-quiet-spec'
  if (selected(host, path)) row.classList.add('selected')
  row.addEventListener('click', () => get(host, 'selectFile')(path))
  row.textContent = get(spec, 'title', 'Spec')
  return row
}

function appendSection(host, label, docs, key) {
  if (size(docs) === 0) return
  const section = document.createElement('section')
  section.className = 'map-group'
  if (key !== 'B') {
    const heading = document.createElement('h2')
    heading.className = 'doc-section-title'
    heading.textContent = label
    section.appendChild(heading)
  }
  const kind = label === 'Language' ? 'Language' : label === 'ADRs' ? 'ADR' : 'Out of scope'
  forEach(docs, (doc) => {
    if (key === 'A') section.appendChild(makeLanguageRowA(host, doc))
    else if (key === 'B') section.appendChild(makeLanguageRowB(host, doc, kind))
    else section.appendChild(makeLanguageRowC(host, doc))
  })
  get(host, 'mapListEl').appendChild(section)
}

function appendTickets(section, host, group) {
  const tickets = visibleTickets(host, group)
  if (size(tickets) === 0) {
    if (get(group, 'path') || size(get(group, 'tickets', [])) > 0) {
      const empty = document.createElement('p')
      empty.className = 'map-empty'
      empty.textContent = 'No tickets'
      section.appendChild(empty)
    }
    return
  }
  forEach(tickets, (ticket) => section.appendChild(get(host, 'makeTicketRow')(ticket)))
}

function appendNestedSpec(head, host, group, key) {
  const spec = get(group, 'spec')
  if (!get(spec, 'path') || !get(group, 'path')) return
  if (key === 'A') head.appendChild(makeSpecTicket(host, spec))
  else if (key === 'B') {
    const row = makeHeadingRow(host, get(spec, 'title', 'Spec'), get(spec, 'path'), 'Spec')
    row.classList.add('prototype-nested-spec')
    head.appendChild(row)
  } else {
    head.appendChild(makeQuietSpec(host, spec))
  }
}

function appendEffortOutline(host, key) {
  forEach(visibleGroups(host), (group) => {
    const section = document.createElement('section')
    section.className = 'map-group'
    const head = document.createElement('div')
    head.className = 'map-group-head'
    if (get(group, 'path')) {
      head.appendChild(
        makeHeadingRow(host, get(group, 'title', get(group, 'folder', '')), get(group, 'path')),
      )
      appendNestedSpec(head, host, group, key)
    } else {
      const spec = get(group, 'spec')
      const title = get(spec, 'title') || get(group, 'title', get(group, 'folder', ''))
      const path = get(spec, 'path') || get(group, ['tickets', 0, 'path'], '')
      if (key === 'C') {
        const row = document.createElement('button')
        row.type = 'button'
        row.className = 'map-row prototype-title-only prototype-quiet-spec'
        if (selected(host, path)) row.classList.add('selected')
        if (path) row.addEventListener('click', () => get(host, 'selectFile')(path))
        row.textContent = title
        head.appendChild(row)
      } else {
        head.appendChild(makeHeadingRow(host, title, path, spec ? 'Spec' : null))
      }
    }
    appendArchive(head, group, get(host, 'archiveEffort'))
    section.appendChild(head)
    appendTickets(section, host, group)
    get(host, 'mapListEl').appendChild(section)
  })
}

function listChrome(key) {
  if (key === 'A') {
    return {
      language: 'title + path, Language section heading',
      spec: 'nested Spec as ticket-row (title + meta spec)',
    }
  }
  if (key === 'B') {
    return {
      language: 'flat Context list, kind mark on each row',
      spec: 'nested heading + Spec mark',
    }
  }
  return {
    language: 'title only, section heading is the kind',
    spec: 'quiet indent + hairline, no path',
  }
}

function hintChrome(key) {
  if (key === 'A') return 'compact chrome card, inner scroll'
  if (key === 'B') return 'titled paper slip, fade truncation'
  return 'sticky preview gutter, never overlays the column'
}

function prototypeState(host, key) {
  return {
    question: 'How should Language rows, Spec rows, and Term-hint hover sit on the reading desk?',
    variant: key,
    name: get(variantMeta(key), 'name'),
    tab: get(host, 'mapListTab'),
    selected: get(host, 'selectedRelPath'),
    languageChrome: get(listChrome(key), 'language'),
    specChrome: get(listChrome(key), 'spec'),
    hintChrome: hintChrome(key),
    language: map(get(host, 'language', []), (row) => get(row, 'title')),
    specs: map(
      filter(get(host, 'decisions', []), (group) => get(group, 'spec')),
      (group) => ({
        folder: get(group, 'folder'),
        nested: Boolean(get(group, 'path')),
        title: get(group, 'spec.title'),
      }),
    ),
    preview: get(lastHintState, 'preview'),
    wrapped: get(lastHintState, 'wrapped'),
    emptyTerms: get(lastHintState, 'emptyTerms'),
  }
}

function renderState(host, key) {
  const dump = document.getElementById('prototype-state-dump')
  if (dump) dump.textContent = JSON.stringify(prototypeState(host, key), null, 2)
}

function syncSwitcher(key) {
  const label = document.getElementById('prototype-variant-label')
  const meta = variantMeta(key)
  if (label) label.textContent = `${get(meta, 'key')} (${get(meta, 'name')})`
  document.body.dataset.prototypeVariant = key
}

function cycleVariant(delta) {
  const index = findIndex(VARIANTS, (item) => get(item, 'key') === currentVariant())
  const next = get(VARIANTS, (index + delta + size(VARIANTS)) % size(VARIANTS))
  setVariant(get(next, 'key'))
}

export function renderMapList(host) {
  const key = currentVariant()
  teardownLayout(key)
  if (key === 'C') ensureGutter()
  get(host, 'mapListEl').innerHTML = ''
  const tabs = document.createElement('div')
  tabs.className = 'map-list-tabs'
  tabs.appendChild(makeTab(host, 'context', 'Context'))
  tabs.appendChild(makeTab(host, 'tickets', 'Tickets'))
  get(host, 'mapListEl').appendChild(tabs)
  if (get(host, 'mapListTab') === 'context') {
    appendSection(host, 'Language', get(host, 'language', []), key)
    appendSection(host, 'ADRs', get(host, 'adrs', []), key)
    appendSection(host, 'Out of scope', get(host, 'outOfScope', []), key)
  } else {
    appendEffortOutline(host, key)
  }
  get(host, 'updateCopyControl')()
  syncSwitcher(key)
  renderState(host, key)
}

export function hidePrototypeHints() {
  hideOverlay()
}

export function applyTermHints(previewEl, terms, relPath, host) {
  const key = currentVariant()
  teardownLayout(key)
  hideOverlay()
  const production = document.getElementById('term-hint-card')
  if (production && !production.className.includes('prototype-')) production.hidden = true
  if (key === 'C') ensureGutter()
  let wrapped = 0
  if (size(terms) > 0) {
    const matchers = compileMatchers(terms)
    if (size(matchers) > 0) {
      const regex = new RegExp(join(map(matchers, 'pattern'), '|'), 'gi')
      forEach(collectTextNodes(previewEl), (node) => {
        if (!node.parentNode) return
        wrapped += wrapNode(node, matchers, regex, key)
      })
    }
  }
  lastHintState = {
    wrapped,
    preview: relPath,
    emptyTerms: size(terms) === 0,
  }
  syncSwitcher(key)
  if (host) renderState(host, key)
}

export function mountPrototypeSwitcher(onChange) {
  if (document.getElementById('prototype-switcher')) return
  onVariantChange = onChange

  if (!document.getElementById('prototype-visual-polish-css')) {
    const style = document.createElement('style')
    style.id = 'prototype-visual-polish-css'
    style.textContent = PROTOTYPE_CSS
    document.head.appendChild(style)
  }

  const dump = document.createElement('pre')
  dump.id = 'prototype-state-dump'
  dump.className = 'prototype-state-dump'
  dump.textContent = JSON.stringify(
    {
      question: 'How should Language rows, Spec rows, and Term-hint hover sit on the reading desk?',
      variant: currentVariant(),
    },
    null,
    2,
  )
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
  `
  document.body.appendChild(bar)

  forEach(bar.querySelectorAll('[data-delta]'), (button) => {
    button.addEventListener('click', () => {
      cycleVariant(Number(button.getAttribute('data-delta')))
      onVariantChange()
    })
  })

  window.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    const target = event.target
    if (target && target.matches('input, textarea, select, [contenteditable="true"]')) return
    cycleVariant(event.key === 'ArrowLeft' ? -1 : 1)
    onVariantChange()
  })

  syncSwitcher(currentVariant())
}
