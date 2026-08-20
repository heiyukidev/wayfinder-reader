// PROTOTYPE PRIMARY SOURCE (throwaway). D won: Context + Tickets.
// A Named holes / B Three tabs / C Split list were rejected.
// Folded into public/app.js Map list; this file is the variant record.
import get from '/vendor/lodash-es/get.js'
import filter from '/vendor/lodash-es/filter.js'
import find from '/vendor/lodash-es/find.js'
import findIndex from '/vendor/lodash-es/findIndex.js'
import forEach from '/vendor/lodash-es/forEach.js'
import map from '/vendor/lodash-es/map.js'
import size from '/vendor/lodash-es/size.js'

const VARIANTS = [
  { key: 'A', name: 'Named holes' },
  { key: 'B', name: 'Three tabs' },
  { key: 'C', name: 'Split list' },
  { key: 'D', name: 'Context + Tickets' },
]

let listTab = 'context'
let onVariantChange = () => {}

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
  forEach(tickets, (ticket) => section.appendChild(host.makeTicketRow(ticket)))
}

function setSidebarMode(mode) {
  const sidebar = document.querySelector('.map-sidebar')
  if (!sidebar) return
  sidebar.classList.toggle('proto-split', mode === 'split')
}

function makeHeading(host, title, path, markText) {
  const row = document.createElement('button')
  row.type = 'button'
  row.className = 'map-row map-heading-row'
  if (path && path === get(host, 'selectedRelPath')) row.classList.add('selected')
  if (path) row.addEventListener('click', () => host.selectFile(path))
  const titleLine = document.createElement('span')
  titleLine.className = 'map-title-line'
  const titleEl = document.createElement('span')
  titleEl.className = 'map-title'
  titleEl.textContent = title
  titleLine.appendChild(titleEl)
  if (markText) {
    const mark = document.createElement('span')
    mark.className = 'spec-mark'
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

function makeNestedSpec(host, spec) {
  const row = host.makeDocRow({
    title: get(spec, 'title', 'Spec'),
    path: get(spec, 'path'),
  })
  row.classList.add('ticket-row')
  return row
}

function appendSection(host, label, docs) {
  if (size(docs) === 0) return
  const section = document.createElement('section')
  section.className = 'map-group'
  const heading = document.createElement('h2')
  heading.className = 'doc-section-title'
  heading.textContent = label
  section.appendChild(heading)
  forEach(docs, (doc) => section.appendChild(host.makeDocRow(doc)))
  host.mapListEl.appendChild(section)
}

function appendEffortOutline(host) {
  forEach(visibleGroups(host), (group) => {
    const section = document.createElement('section')
    section.className = 'map-group'
    const head = document.createElement('div')
    head.className = 'map-group-head'
    if (get(group, 'path')) {
      head.appendChild(
        makeHeading(host, get(group, 'title', get(group, 'folder', '')), get(group, 'path')),
      )
      if (get(group, 'spec')) head.appendChild(makeNestedSpec(host, get(group, 'spec')))
    } else {
      const spec = get(group, 'spec')
      head.appendChild(
        makeHeading(
          host,
          get(spec, 'title') || get(group, 'title', get(group, 'folder', '')),
          get(spec, 'path') || get(group, ['tickets', 0, 'path'], ''),
          spec ? 'Spec' : null,
        ),
      )
    }
    appendArchive(head, group, host.archiveEffort)
    section.appendChild(head)
    appendTickets(section, host, group)
    host.mapListEl.appendChild(section)
  })
}

export function VariantA(host) {
  setSidebarMode('stack')
  appendSection(host, 'Language', get(host, 'language', []))
  appendSection(host, 'ADRs', get(host, 'adrs', []))
  appendSection(host, 'Out of scope', get(host, 'outOfScope', []))
  appendEffortOutline(host)
}

function makeTabButton(id, label) {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'proto-tab'
  if (listTab === id) button.classList.add('is-active')
  button.textContent = label
  button.addEventListener('click', () => {
    listTab = id
    onVariantChange()
  })
  return button
}

function makePlainRow(host, title, path) {
  const row = document.createElement('button')
  row.type = 'button'
  row.className = 'map-row proto-tab-row'
  if (path === get(host, 'selectedRelPath')) row.classList.add('selected')
  row.addEventListener('click', () => host.selectFile(path))
  row.textContent = title
  return row
}

export function VariantB(host) {
  setSidebarMode('stack')
  appendSection(host, 'ADRs', get(host, 'adrs', []))
  appendSection(host, 'Out of scope', get(host, 'outOfScope', []))

  const tabs = document.createElement('div')
  tabs.className = 'proto-tabs'
  tabs.appendChild(makeTabButton('language', 'Language'))
  tabs.appendChild(makeTabButton('work', 'Remaining work'))
  tabs.appendChild(makeTabButton('tickets', 'Tickets'))
  host.mapListEl.appendChild(tabs)

  if (listTab === 'language') {
    const section = document.createElement('section')
    section.className = 'map-group'
    if (size(get(host, 'language', [])) === 0) {
      const empty = document.createElement('p')
      empty.className = 'map-empty'
      empty.textContent = 'No language documents'
      section.appendChild(empty)
    } else {
      forEach(get(host, 'language', []), (doc) => {
        section.appendChild(makePlainRow(host, get(doc, 'title', ''), get(doc, 'path', '')))
      })
    }
    host.mapListEl.appendChild(section)
    return
  }

  if (listTab === 'tickets') {
    const groupsWithTickets = filter(
      visibleGroups(host),
      (group) => size(visibleTickets(host, group)) > 0,
    )
    if (size(groupsWithTickets) === 0) {
      const empty = document.createElement('p')
      empty.className = 'map-empty'
      empty.textContent = 'No tickets'
      host.mapListEl.appendChild(empty)
      return
    }
    forEach(groupsWithTickets, (group) => {
      const section = document.createElement('section')
      section.className = 'map-group'
      const head = document.createElement('div')
      head.className = 'map-group-head'
      head.appendChild(
        makeHeading(
          host,
          get(group, 'title', get(group, 'folder', '')),
          get(group, 'path') || get(group, ['tickets', 0, 'path'], ''),
        ),
      )
      section.appendChild(head)
      forEach(visibleTickets(host, group), (ticket) =>
        section.appendChild(host.makeTicketRow(ticket)),
      )
      host.mapListEl.appendChild(section)
    })
    return
  }

  forEach(visibleGroups(host), (group) => {
    if (!get(group, 'path') && !get(group, 'spec.path')) return
    const section = document.createElement('section')
    section.className = 'map-group'
    const head = document.createElement('div')
    head.className = 'map-group-head'
    if (get(group, 'path')) {
      head.appendChild(makeHeading(host, get(group, 'title', ''), get(group, 'path')))
    }
    if (get(group, 'spec.path')) {
      head.appendChild(
        makeHeading(host, get(group, 'spec.title', 'Spec'), get(group, 'spec.path'), 'Spec'),
      )
    }
    appendArchive(head, group, host.archiveEffort)
    section.appendChild(head)
    host.mapListEl.appendChild(section)
  })
}

function makeRailRow(host, title, path) {
  const row = document.createElement('button')
  row.type = 'button'
  row.className = 'map-row proto-rail-row'
  if (path === get(host, 'selectedRelPath')) row.classList.add('selected')
  row.addEventListener('click', () => host.selectFile(path))
  row.textContent = title
  return row
}

function makePeerRow(host, kind, title, path) {
  const row = document.createElement('button')
  row.type = 'button'
  row.className = 'map-row proto-peer-row'
  if (path === get(host, 'selectedRelPath')) row.classList.add('selected')
  if (path) row.addEventListener('click', () => host.selectFile(path))
  const kindEl = document.createElement('span')
  kindEl.className = 'proto-peer-kind'
  kindEl.textContent = kind
  const titleEl = document.createElement('span')
  titleEl.className = 'map-title'
  titleEl.textContent = title
  row.appendChild(kindEl)
  row.appendChild(titleEl)
  return row
}

export function VariantC(host) {
  setSidebarMode('split')
  const rail = document.createElement('div')
  rail.className = 'proto-rail'
  const railTitle = document.createElement('h2')
  railTitle.className = 'doc-section-title'
  railTitle.textContent = 'Docs'
  rail.appendChild(railTitle)
  forEach(get(host, 'language', []), (doc) => {
    rail.appendChild(makeRailRow(host, get(doc, 'title', ''), get(doc, 'path', '')))
  })
  forEach(get(host, 'adrs', []), (doc) => {
    rail.appendChild(makeRailRow(host, get(doc, 'title', ''), get(doc, 'path', '')))
  })
  forEach(get(host, 'outOfScope', []), (doc) => {
    rail.appendChild(makeRailRow(host, get(doc, 'title', ''), get(doc, 'path', '')))
  })
  host.mapListEl.appendChild(rail)

  const work = document.createElement('div')
  work.className = 'proto-work'
  forEach(visibleGroups(host), (group) => {
    const section = document.createElement('section')
    section.className = 'map-group'
    const folder = document.createElement('p')
    folder.className = 'folder-label'
    folder.textContent = get(group, 'folder', '')
    section.appendChild(folder)
    const head = document.createElement('div')
    head.className = 'map-group-head'
    if (get(group, 'path')) {
      head.appendChild(makePeerRow(host, 'Map', get(group, 'title', ''), get(group, 'path')))
    }
    if (get(group, 'spec.path')) {
      head.appendChild(
        makePeerRow(host, 'Spec', get(group, 'spec.title', 'Spec'), get(group, 'spec.path')),
      )
    }
    appendArchive(head, group, host.archiveEffort)
    section.appendChild(head)
    appendTickets(section, host, group)
    work.appendChild(section)
  })
  host.mapListEl.appendChild(work)
}

export function VariantD(host) {
  setSidebarMode('stack')
  if (listTab !== 'context' && listTab !== 'tickets') listTab = 'context'

  const tabs = document.createElement('div')
  tabs.className = 'proto-tabs'
  tabs.appendChild(makeTabButton('context', 'Context'))
  tabs.appendChild(makeTabButton('tickets', 'Tickets'))
  host.mapListEl.appendChild(tabs)

  if (listTab === 'tickets') {
    appendEffortOutline(host)
    return
  }

  appendSection(host, 'Language', get(host, 'language', []))
  appendSection(host, 'ADRs', get(host, 'adrs', []))
  appendSection(host, 'Out of scope', get(host, 'outOfScope', []))
}

function prototypeState(host, key) {
  return {
    question: 'How should language documents and Specs sit on the Map list?',
    variant: key,
    tab: key === 'B' || key === 'D' ? listTab : null,
    selected: get(host, 'selectedRelPath'),
    language: map(get(host, 'language', []), (row) => ({
      title: get(row, 'title'),
      path: get(row, 'path'),
    })),
    specs: map(
      filter(get(host, 'decisions', []), (group) => get(group, 'spec')),
      (group) => ({
        folder: get(group, 'folder'),
        map: get(group, 'path') || null,
        spec: get(group, 'spec.path'),
        title: get(group, 'spec.title'),
      }),
    ),
  }
}

function renderState(host, key) {
  const dump = document.getElementById('prototype-state-dump')
  if (dump) dump.textContent = JSON.stringify(prototypeState(host, key), null, 2)
}

export function renderPrototypeMapList(host) {
  host.mapListEl.innerHTML = ''
  const key = currentVariant()
  const render = get({ A: VariantA, B: VariantB, C: VariantC, D: VariantD }, key, VariantA)
  render(host)
  host.updateCopyControl()
  syncSwitcher(key)
  renderState(host, key)
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

export function mountPrototypeSwitcher(onChange) {
  if (document.getElementById('prototype-switcher')) return
  onVariantChange = onChange

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
      <div id="prototype-variant-label" class="prototype-switcher-label">A (Named holes)</div>
    </div>
    <button type="button" class="prototype-switcher-arrow" data-delta="1" aria-label="Next variant">→</button>
  `
  document.body.appendChild(bar)

  forEach(bar.querySelectorAll('[data-delta]'), (button) => {
    button.addEventListener('click', () => {
      cycleVariant(Number(button.getAttribute('data-delta')))
      onChange()
    })
  })

  window.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    const target = event.target
    if (target && target.matches('input, textarea, select, [contenteditable="true"]')) return
    cycleVariant(event.key === 'ArrowLeft' ? -1 : 1)
    onChange()
  })
}
