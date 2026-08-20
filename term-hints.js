import get from './vendor/lodash-es/get.js'
import filter from './vendor/lodash-es/filter.js'
import find from './vendor/lodash-es/find.js'
import forEach from './vendor/lodash-es/forEach.js'
import map from './vendor/lodash-es/map.js'
import size from './vendor/lodash-es/size.js'
import join from './vendor/lodash-es/join.js'
import toLower from './vendor/lodash-es/toLower.js'
import trim from './vendor/lodash-es/trim.js'
import uniq from './vendor/lodash-es/uniq.js'
import uniqBy from './vendor/lodash-es/uniqBy.js'
import toPairs from './vendor/lodash-es/toPairs.js'
import orderBy from './vendor/lodash-es/orderBy.js'
import escapeRegExp from './vendor/lodash-es/escapeRegExp.js'
import toArray from './vendor/lodash-es/toArray.js'
import { marked } from './vendor/marked/lib/marked.esm.js'

marked.setOptions({ gfm: true })

const SKIP_SELECTOR = 'code, pre, a, .term-hint, .term-hint-card'
const hintModels = new WeakMap()
let hideCardTimer = 0

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

function hintKicker(model) {
  if (get(model, 'kind') === 'prefer') return 'Prefer'
  return get(model, 'term', 'Term')
}

function fillHintCard(card, model) {
  card.replaceChildren()
  const kicker = document.createElement('span')
  kicker.className = 'term-hint-kicker'
  kicker.textContent = hintKicker(model)
  card.appendChild(kicker)
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

export function hideTermHintCard() {
  cancelHideCard()
  const card = document.getElementById('term-hint-card')
  if (card) card.hidden = true
}

function cancelHideCard() {
  window.clearTimeout(hideCardTimer)
}

function scheduleHideCard() {
  cancelHideCard()
  hideCardTimer = window.setTimeout(hideTermHintCard, 160)
}

function placeHintCard(anchor) {
  cancelHideCard()
  const card = ensureHintCard()
  fillHintCard(card, hintModels.get(anchor))
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

function makeHintEl(matchedText, matcher) {
  const el = document.createElement('span')
  el.className = 'term-hint'
  el.textContent = matchedText
  el.tabIndex = 0
  hintModels.set(el, get(matcher, 'model'))
  el.addEventListener('mouseenter', () => placeHintCard(el))
  el.addEventListener('mouseleave', scheduleHideCard)
  el.addEventListener('focus', () => placeHintCard(el))
  el.addEventListener('blur', scheduleHideCard)
  return el
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

function wrapNode(node, matchers, regex) {
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
      frag.appendChild(makeHintEl(matchedText, matcher))
      wrapped += 1
      last = match.index + size(matchedText)
    }
    if (!size(matchedText)) regex.lastIndex += 1
    match = regex.exec(text)
  }
  if (wrapped === 0) return
  if (last < size(text)) frag.append(text.slice(last))
  node.parentNode.replaceChild(frag, node)
}

export function applyTermHints(root, terms) {
  hideTermHintCard()
  if (size(terms) === 0) return
  const matchers = compileMatchers(terms)
  if (size(matchers) === 0) return
  const regex = new RegExp(join(map(matchers, 'pattern'), '|'), 'gi')
  forEach(collectTextNodes(root), (node) => {
    if (!node.parentNode) return
    wrapNode(node, matchers, regex)
  })
}
