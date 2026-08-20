// PROTOTYPE PRIMARY SOURCE (throwaway). B won: hover card with GFM.
// A Native title / C First mention were rejected.
// Folded into public/term-hints.js; this file is the variant record.
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
import compact from '/vendor/lodash-es/compact.js'
import toArray from '/vendor/lodash-es/toArray.js'
import { marked } from '/vendor/marked/lib/marked.esm.js'

marked.setOptions({ gfm: true })

const VARIANTS = [
  { key: 'A', name: 'Native title' },
  { key: 'B', name: 'Hover card' },
  { key: 'C', name: 'First mention' },
]

const SKIP_SELECTOR = 'code, pre, a, .term-hint, .term-hint-card, .term-page-index, .prototype-switcher, .prototype-state-dump'

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
.prototype-switcher-copy {
  min-width: 180px;
  text-align: center;
}
.prototype-switcher-label {
  font-weight: 600;
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
.term-hint {
  color: inherit;
  text-decoration: underline dotted;
  text-decoration-color: currentColor;
  text-decoration-thickness: 1px;
  text-underline-offset: 0.18em;
  cursor: help;
}
.term-hint-card {
  position: fixed;
  z-index: 9999;
  max-width: 28rem;
  max-height: 40vh;
  overflow: auto;
  padding: 10px 12px;
  background: var(--color-chrome);
  color: var(--color-ink);
  border: 1px solid var(--color-hairline);
  border-radius: 4px;
  box-shadow: 0 10px 28px rgba(28, 25, 23, 0.18);
  font-family: var(--font-sans);
  font-size: 13px;
  line-height: 1.45;
}
.term-hint-card[hidden] { display: none; }
.term-hint-card p { margin: 0; }
.term-hint-card p + p { margin-top: 0.5em; }
.term-hint-card strong { font-weight: 600; }
.term-hint-card em { font-style: italic; }
.term-hint-card code {
  font-family: var(--font-mono);
  font-size: 0.88em;
  background: var(--color-code-bg);
  padding: 0.1em 0.35em;
  border-radius: 3px;
}
.term-hint-card a { color: var(--color-accent); }
.term-hint-card ul,
.term-hint-card ol {
  margin: 0.4em 0 0;
  padding-left: 1.2em;
}
.term-hint-prefer { margin: 0; }
.term-hint-def { margin: 0; }
.term-hint-collision {
  margin: 0;
  padding: 0;
  list-style: none;
}
.term-hint-collision li + li { margin-top: 8px; }
.term-hint-context {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-ink-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.term-page-index {
  margin-top: 32px;
  padding-top: 16px;
  border-top: 1px solid var(--color-hairline);
  font-family: var(--font-sans);
  font-size: 14px;
}
.term-page-index h2 {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-ink-muted);
}
.term-page-index dl { margin: 0; }
.term-page-index dt {
  margin-top: 10px;
  font-weight: 600;
}
.term-page-index dd {
  margin: 2px 0 0;
  color: var(--color-ink-muted);
}
`

let onVariantChange = () => {}
let lastState = {
  question: 'How should Term hints show on the GFM preview?',
  variant: 'A',
  preview: null,
  termCount: 0,
  wrapped: 0,
  phrases: [],
  collisions: [],
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

export function compileMatchers(terms) {
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

function hintTitle(model) {
  if (get(model, 'kind') === 'prefer') {
    const names = get(model, 'terms', [])
    if (size(names) === 1) return `Prefer ${get(names, 0)}.`
    return `Prefer ${join(names, ' or ')}.`
  }
  if (get(model, 'kind') === 'definition') return get(model, 'definition', '')
  return join(
    map(get(model, 'rows', []), (row) => `${get(row, 'contextName')}: ${get(row, 'definition')}`),
    '\n',
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

function fillHintCard(card, model) {
  card.replaceChildren()
  const kind = get(model, 'kind')
  if (kind === 'prefer') {
    const wrap = document.createElement('div')
    wrap.className = 'term-hint-prefer'
    const names = get(model, 'terms', [])
    const source =
      size(names) === 1
        ? `Prefer **${get(names, 0)}**.`
        : `Prefer ${join(map(names, (name) => `**${name}**`), ' or ')}.`
    fillMarkdown(wrap, source)
    card.appendChild(wrap)
    return
  }
  if (kind === 'definition') {
    const wrap = document.createElement('div')
    wrap.className = 'term-hint-def'
    fillMarkdown(wrap, get(model, 'definition', ''))
    card.appendChild(wrap)
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
    def.className = 'term-hint-def'
    fillMarkdown(def, get(row, 'definition', ''))
    item.appendChild(context)
    item.appendChild(def)
    list.appendChild(item)
  })
  card.appendChild(list)
}

let hideCardTimer = 0

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

function hideHintCard() {
  cancelHideCard()
  const card = document.getElementById('term-hint-card')
  if (card) card.hidden = true
}

function cancelHideCard() {
  window.clearTimeout(hideCardTimer)
}

function scheduleHideCard() {
  cancelHideCard()
  hideCardTimer = window.setTimeout(hideHintCard, 160)
}

function placeHintCard(anchor) {
  cancelHideCard()
  const card = ensureHintCard()
  fillHintCard(card, get(anchor, '_termModel'))
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

function attachCardHover(el) {
  el.addEventListener('mouseenter', () => placeHintCard(el))
  el.addEventListener('mouseleave', scheduleHideCard)
  el.addEventListener('focus', () => placeHintCard(el))
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

function makeHintEl(matchedText, matcher, chrome) {
  const el = document.createElement('span')
  el.className = 'term-hint'
  el.textContent = matchedText
  el._termModel = get(matcher, 'model')
  if (chrome === 'title') {
    el.title = hintTitle(get(matcher, 'model'))
  } else {
    el.tabIndex = 0
    attachCardHover(el)
  }
  return el
}

function wrapNode(node, matchers, regex, seen, firstOnly, chrome) {
  const text = node.nodeValue
  regex.lastIndex = 0
  const frag = document.createDocumentFragment()
  let last = 0
  let wrapped = 0
  const used = []
  let match = regex.exec(text)
  while (match) {
    const matchedText = get(match, 0, '')
    const matcher = find(matchers, (item) => phraseKey(get(item, 'phrase')) === phraseKey(matchedText))
    const key = phraseKey(matchedText)
    const skipRepeat = firstOnly && seen.has(key)
    if (matcher && !skipRepeat) {
      if (match.index > last) frag.append(text.slice(last, match.index))
      frag.appendChild(makeHintEl(matchedText, matcher, chrome))
      seen.add(key)
      wrapped += 1
      used.push({
        phrase: matchedText,
        kind: get(matcher, ['model', 'kind']),
        term: get(matcher, ['model', 'term']) || join(get(matcher, ['model', 'terms'], []), ', '),
        model: get(matcher, 'model'),
      })
      last = match.index + size(matchedText)
    }
    if (!size(matchedText)) regex.lastIndex += 1
    match = regex.exec(text)
  }
  if (wrapped === 0) return { wrapped: 0, used: [] }
  if (last < size(text)) frag.append(text.slice(last))
  node.parentNode.replaceChild(frag, node)
  return { wrapped, used }
}

function wrapPreview(root, terms, { firstOnly, chrome }) {
  const matchers = compileMatchers(terms)
  if (size(matchers) === 0) {
    return { wrapped: 0, used: [], matchers: 0 }
  }
  const regex = new RegExp(join(map(matchers, 'pattern'), '|'), 'gi')
  const seen = new Set()
  let wrapped = 0
  const used = []
  forEach(collectTextNodes(root), (node) => {
    if (!node.parentNode) return
    const result = wrapNode(node, matchers, regex, seen, firstOnly, chrome)
    wrapped += get(result, 'wrapped', 0)
    forEach(get(result, 'used', []), (item) => used.push(item))
  })
  return { wrapped, used, matchers: size(matchers) }
}

function collisionTerms(terms) {
  const groups = {}
  forEach(terms, (record) => {
    const key = phraseKey(get(record, 'term'))
    if (!groups[key]) groups[key] = []
    groups[key].push(get(record, 'contextName'))
  })
  return compact(
    map(toPairs(groups), ([term, contexts]) => {
      const names = uniq(contexts)
      return size(names) > 1 ? { term, contexts: names } : null
    }),
  )
}

function appendPageIndex(root, used) {
  const unique = uniqBy(used, (item) => phraseKey(get(item, 'phrase')))
  const index = document.createElement('aside')
  index.className = 'term-page-index'
  const heading = document.createElement('h2')
  heading.textContent = size(unique) === 0 ? 'No Term hints on this page' : 'Terms on this page'
  index.appendChild(heading)
  if (size(unique) === 0) {
    root.appendChild(index)
    return
  }
  const list = document.createElement('dl')
  forEach(unique, (item) => {
    const dt = document.createElement('dt')
    dt.textContent = get(item, 'phrase')
    const dd = document.createElement('dd')
    dd.textContent = hintTitle(get(item, 'model'))
    list.appendChild(dt)
    list.appendChild(dd)
  })
  index.appendChild(list)
  root.appendChild(index)
}

function VariantA(previewEl, terms) {
  return wrapPreview(previewEl, terms, { firstOnly: false, chrome: 'title' })
}

function VariantB(previewEl, terms) {
  return wrapPreview(previewEl, terms, { firstOnly: false, chrome: 'card' })
}

function VariantC(previewEl, terms) {
  const result = wrapPreview(previewEl, terms, { firstOnly: true, chrome: 'card' })
  appendPageIndex(previewEl, get(result, 'used', []))
  return result
}

function prototypeState(relPath, terms, result, key) {
  return {
    question: 'How should Term hints show on the GFM preview?',
    variant: key,
    preview: relPath,
    termCount: size(terms),
    matcherCount: get(result, 'matchers', 0),
    wrapped: get(result, 'wrapped', 0),
    emptyTerms: size(terms) === 0,
    collisions: collisionTerms(terms),
    phrases: map(get(result, 'used', []), (item) => ({
      phrase: get(item, 'phrase'),
      kind: get(item, 'kind'),
      term: get(item, 'term'),
    })),
  }
}

function renderState(state) {
  lastState = state
  const dump = document.getElementById('prototype-state-dump')
  if (dump) dump.textContent = JSON.stringify(state, null, 2)
}

function syncSwitcher(key) {
  const label = document.getElementById('prototype-variant-label')
  const meta = variantMeta(key)
  if (label) label.textContent = `${get(meta, 'key')} (${get(meta, 'name')})`
}

function cycleVariant(delta) {
  const index = findIndex(VARIANTS, (item) => get(item, 'key') === currentVariant())
  const next = get(VARIANTS, (index + delta + size(VARIANTS)) % size(VARIANTS))
  setVariant(get(next, 'key'))
}

export function applyTermHints(previewEl, terms, relPath) {
  hideHintCard()
  const key = currentVariant()
  const render = get({ A: VariantA, B: VariantB, C: VariantC }, key, VariantA)
  const result = size(terms) === 0 ? { wrapped: 0, used: [], matchers: 0 } : render(previewEl, terms)
  const state = prototypeState(relPath, terms, result, key)
  renderState(state)
  syncSwitcher(key)
  return state
}

export function mountPrototypeSwitcher(onChange) {
  if (document.getElementById('prototype-switcher')) return
  onVariantChange = onChange

  if (!document.getElementById('prototype-term-hints-css')) {
    const style = document.createElement('style')
    style.id = 'prototype-term-hints-css'
    style.textContent = PROTOTYPE_CSS
    document.head.appendChild(style)
  }

  const dump = document.createElement('pre')
  dump.id = 'prototype-state-dump'
  dump.className = 'prototype-state-dump'
  dump.textContent = JSON.stringify(lastState, null, 2)
  document.body.appendChild(dump)

  const bar = document.createElement('div')
  bar.id = 'prototype-switcher'
  bar.className = 'prototype-switcher'
  bar.innerHTML = `
    <button type="button" class="prototype-switcher-arrow" data-delta="-1" aria-label="Previous variant">←</button>
    <div class="prototype-switcher-copy">
      <div id="prototype-variant-label" class="prototype-switcher-label">A (Native title)</div>
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
