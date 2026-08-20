import get from './vendor/lodash-es/get.js'
import filter from './vendor/lodash-es/filter.js'
import forEach from './vendor/lodash-es/forEach.js'
import map from './vendor/lodash-es/map.js'
import size from './vendor/lodash-es/size.js'
import join from './vendor/lodash-es/join.js'
import split from './vendor/lodash-es/split.js'
import some from './vendor/lodash-es/some.js'
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
      pattern: phrasePattern(phrase),
      model: hintModel(hits),
    })),
    [(item) => size(get(item, 'phrase'))],
    ['desc'],
  )
}

function phrasePattern(phrase) {
  const words = filter(split(trim(phrase), /\s+/), Boolean)
  if (size(words) === 0) return ''
  return `(?<![A-Za-z0-9_])${join(map(words, escapeRegExp), '\\s+')}(?![A-Za-z0-9_])`
}

export function matchTermHints(text, terms) {
  if (!size(terms) || !text) return []
  const matchers = filter(compileMatchers(terms), (matcher) => get(matcher, 'pattern'))
  if (size(matchers) === 0) return []

  const candidates = []
  forEach(matchers, (matcher) => {
    const regex = new RegExp(get(matcher, 'pattern'), 'gi')
    let match = regex.exec(text)
    while (match) {
      const matchedText = get(match, 0, '')
      if (size(matchedText)) {
        candidates.push({
          text: matchedText,
          index: match.index,
          end: match.index + size(matchedText),
          phrase: get(matcher, 'phrase'),
          model: get(matcher, 'model'),
        })
      } else {
        regex.lastIndex += 1
      }
      match = regex.exec(text)
    }
  })

  const ordered = orderBy(candidates, ['index', (row) => -size(get(row, 'text'))])
  const claimed = []
  forEach(ordered, (candidate) => {
    if (some(claimed, (taken) => get(candidate, 'index') < get(taken, 'end') && get(candidate, 'end') > get(taken, 'index'))) {
      return
    }
    claimed.push(candidate)
  })
  return map(claimed, (row) => ({
    text: get(row, 'text'),
    index: get(row, 'index'),
    phrase: get(row, 'phrase'),
    model: get(row, 'model'),
  }))
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

function makeHintEl(hit) {
  const el = document.createElement('span')
  el.className = 'term-hint'
  el.textContent = get(hit, 'text')
  el.tabIndex = 0
  hintModels.set(el, get(hit, 'model'))
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

export function applyTermHints(root, terms) {
  hideTermHintCard()
  if (size(terms) === 0) return
  forEach(collectTextNodes(root), (node) => {
    if (!node.parentNode) return
    wrapNode(node, terms)
  })
}
