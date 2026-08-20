import get from './vendor/lodash-es/get.js'
import concat from './vendor/lodash-es/concat.js'
import dropRight from './vendor/lodash-es/dropRight.js'
import flatten from './vendor/lodash-es/flatten.js'
import forEach from './vendor/lodash-es/forEach.js'
import filter from './vendor/lodash-es/filter.js'
import find from './vendor/lodash-es/find.js'
import includes from './vendor/lodash-es/includes.js'
import join from './vendor/lodash-es/join.js'
import last from './vendor/lodash-es/last.js'
import map from './vendor/lodash-es/map.js'
import size from './vendor/lodash-es/size.js'
import split from './vendor/lodash-es/split.js'
import toArray from './vendor/lodash-es/toArray.js'
import truncate from './vendor/lodash-es/truncate.js'
import uniq from './vendor/lodash-es/uniq.js'
import { marked } from './vendor/marked/lib/marked.esm.js'
import { applyTermHints, hideTermHintCard } from './term-hints.js'
import {
  isReadablePreviewPath,
  readPreviewFile,
  walkProject,
} from './walk.js'
import {
  listRecents,
  rememberHandle,
  requestReadPermission,
  queryReadPermission,
} from './recents.js'

marked.setOptions({ gfm: true })

const projectPathLabel = document.querySelector('label[for="project-path"]')
const projectInput = document.getElementById('project-path')
const loadBtn = document.getElementById('load-btn')
const projectNameEl = document.getElementById('project-name')
const recentsSelect = document.getElementById('recents')
const errorEl = document.getElementById('error')
const emptyMapsEl = document.getElementById('empty-maps')
const mapActionsEl = document.getElementById('map-actions')
const unresolvedFilterEl = document.getElementById('unresolved-filter')
const mapListEl = document.getElementById('map-list')
const copySkipBtn = document.getElementById('copy-skip-btn')
const copyTakeBtn = document.getElementById('copy-take-btn')
const copyStatusEl = document.getElementById('copy-status')
const previewEl = document.getElementById('preview')
const previewCaption = document.getElementById('preview-caption')

const HOSTED_EMPTY_PREVIEW_HTML = '<p class="preview-placeholder">Load a Project.</p>'
const ALWAYS_ON_EMPTY_PREVIEW_HTML =
  '<p class="preview-placeholder">Paste a Project path and Load.</p>'
const SKIP_PROMPT_PREAMBLE =
  'Skip grilling these Tickets in this session. Pick your recommended answer for all the questions. Mark them as resolved.'
const WAYFINDER_TAKE_PREAMBLE =
  'Take this Ticket in this session. Claim it. Resolve it (Answer, Status: resolved, Decisions pointer on the Map if one exists).'
const IMPLEMENT_TAKE_PREAMBLE =
  'Take this Ticket in this session. Build only this Ticket. Mark it as resolved (Answer, Status: resolved).'
const SPEC_TAKE_PREAMBLE =
  'Take this Spec in this session. Publish Tickets from it. Do not set Spec Status to resolved.'

let currentMaps = []
let currentDecisions = []
let currentAdrs = []
let currentOutOfScope = []
let currentLanguage = []
let currentTerms = []
let currentProjectName = ''
let currentProjectPath = ''
let currentRootHandle = null
let alwaysOn = false
let remainingWorkOnly = true
let mapListTab = 'tickets'
let selectedTicketPaths = []
let selectedRelPath = null
let fileRequestId = 0
let projectRequestId = 0

function showError(message) {
  if (!message) {
    errorEl.hidden = true
    errorEl.textContent = ''
    return
  }
  errorEl.hidden = false
  errorEl.textContent = message
}

function emptyPreviewHtml() {
  return alwaysOn ? ALWAYS_ON_EMPTY_PREVIEW_HTML : HOSTED_EMPTY_PREVIEW_HTML
}

function formatRecentLabel(projectPath) {
  const base = last(filter(split(projectPath, '/'), Boolean)) || projectPath
  const pathPart = truncate(projectPath, { length: 40, omission: '…' })
  return `${base} — ${pathPart}`
}

function setRecents(recents) {
  recentsSelect.innerHTML = '<option value="">Choose…</option>'
  forEach(recents, (row, index) => {
    const opt = document.createElement('option')
    if (alwaysOn) {
      opt.value = row
      opt.textContent = formatRecentLabel(row)
    } else {
      opt.value = String(index)
      opt.textContent = get(row, 'name', 'Project')
    }
    recentsSelect.appendChild(opt)
  })
  recentsSelect.dataset.count = String(size(recents))
}

async function api(url, options) {
  const res = await fetch(url, options)
  const data = await res.json()
  if (!res.ok) {
    throw new Error(get(data, 'error') || `Request failed (${res.status})`)
  }
  return data
}

async function detectAlwaysOn() {
  try {
    const res = await fetch('/api/state', { headers: { Accept: 'application/json' } })
    if (!res.ok) return null
    const contentType = res.headers.get('content-type') || ''
    if (!includes(contentType, 'json')) return null
    return await res.json()
  } catch {
    return null
  }
}

function showAlwaysOnChrome() {
  alwaysOn = true
  document.body.classList.add('always-on')
  projectPathLabel.hidden = false
  projectInput.hidden = false
  projectNameEl.hidden = true
}

function showEmptyPreview() {
  selectedRelPath = null
  hideTermHintCard()
  previewCaption.textContent = ''
  previewEl.classList.remove('is-loading', 'is-swapping')
  previewEl.classList.add('preview-empty')
  previewEl.innerHTML = emptyPreviewHtml()
  updateCopyControl()
}

function showLoadingPreview(relPath) {
  hideTermHintCard()
  previewCaption.textContent = relPath
  previewEl.classList.remove('preview-empty', 'is-swapping')
  previewEl.classList.add('is-loading')
  previewEl.innerHTML = '<p class="preview-loading-text">Loading…</p>'
}

function effortPreviewPath(group) {
  return (
    get(group, 'path') ||
    get(group, 'spec.path') ||
    get(group, ['tickets', 0, 'path']) ||
    ''
  )
}

function makeDocRow(doc, markText) {
  const docPath = get(doc, 'path', '')
  const row = document.createElement('button')
  row.type = 'button'
  row.className = 'map-row map-heading-row'
  if (docPath === selectedRelPath) row.classList.add('selected')
  row.addEventListener('click', () => selectFile(docPath))

  const titleLine = document.createElement('span')
  titleLine.className = 'map-title-line'
  const title = document.createElement('span')
  title.className = 'map-title'
  title.textContent = get(doc, 'title', docPath)
  titleLine.appendChild(title)
  if (markText) {
    const mark = document.createElement('span')
    mark.className = markText === 'Spec' ? 'spec-mark' : 'kind-mark'
    mark.textContent = markText
    titleLine.appendChild(mark)
  }
  const pathEl = document.createElement('span')
  pathEl.className = 'map-path'
  pathEl.textContent = docPath
  row.appendChild(titleLine)
  row.appendChild(pathEl)
  return row
}

function makeMapRow(group) {
  const previewPath = effortPreviewPath(group)
  const header = document.createElement('div')
  header.className = 'map-group-head'

  const row = document.createElement('button')
  row.type = 'button'
  row.className = 'map-row map-heading-row'
  if (previewPath && previewPath === selectedRelPath) row.classList.add('selected')
  if (previewPath) {
    row.addEventListener('click', () => selectFile(previewPath))
  }

  const titleLine = document.createElement('span')
  titleLine.className = 'map-title-line'
  const title = document.createElement('span')
  title.className = 'map-title'
  title.textContent = get(group, 'title', get(group, 'folder', ''))
  titleLine.appendChild(title)
  if (get(group, 'spec.path') && !get(group, 'path')) {
    const mark = document.createElement('span')
    mark.className = 'spec-mark'
    mark.textContent = 'Spec'
    titleLine.appendChild(mark)
  }
  const mapPathEl = document.createElement('span')
  mapPathEl.className = 'map-path'
  mapPathEl.textContent = previewPath || get(group, 'folder', '')
  row.appendChild(titleLine)
  row.appendChild(mapPathEl)

  const headingWrap = document.createElement('div')
  headingWrap.className = 'map-heading-wrap'
  headingWrap.appendChild(row)
  if (alwaysOn && get(group, 'finished')) {
    const archiveBtn = document.createElement('button')
    archiveBtn.type = 'button'
    archiveBtn.className = 'archive-btn'
    archiveBtn.textContent = 'Archive'
    archiveBtn.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
      archiveEffort(get(group, 'folder', ''))
    })
    headingWrap.appendChild(archiveBtn)
  }
  header.appendChild(headingWrap)

  if (get(group, 'spec.path') && get(group, 'path')) {
    const specRow = makeDocRow(
      {
        title: get(group, 'spec.title', 'Spec'),
        path: get(group, 'spec.path'),
      },
      'Spec',
    )
    specRow.classList.add('nested-spec')
    header.appendChild(specRow)
  }
  return header
}

function makeTicketRow(ticket) {
  const ticketPath = get(ticket, 'path', '')
  const resolved = get(ticket, 'resolved', false)
  const row = document.createElement('div')
  row.className = 'map-row ticket-row'
  row.style.setProperty('--ticket-indent', `${get(ticket, 'depth', 0) * 16}px`)
  if (ticketPath === selectedRelPath) row.classList.add('selected')
  if (resolved) row.classList.add('resolved')
  if (get(ticket, 'frontier', false)) row.classList.add('frontier')
  if (get(ticket, 'claimed', false)) row.classList.add('claimed')
  if (get(ticket, 'cycle', false)) row.classList.add('cycle')

  if (!resolved) {
    const selection = document.createElement('input')
    selection.type = 'checkbox'
    selection.className = 'ticket-selection'
    selection.checked = includes(selectedTicketPaths, ticketPath)
    selection.setAttribute(
      'aria-label',
      `Select ${get(ticket, 'title', ticketPath)} for Skip prompt`,
    )
    selection.addEventListener('change', () => {
      selectedTicketPaths = selection.checked
        ? concat(selectedTicketPaths, ticketPath)
        : filter(selectedTicketPaths, (path) => path !== ticketPath)
      copyStatusEl.textContent = ''
      updateCopyControl()
    })
    row.appendChild(selection)
  }

  const previewButton = document.createElement('button')
  previewButton.type = 'button'
  previewButton.className = 'ticket-preview'
  previewButton.addEventListener('click', () => selectFile(ticketPath))

  const title = document.createElement('span')
  title.className = 'ticket-title'
  title.textContent = get(ticket, 'title', ticketPath)
  const meta = document.createElement('span')
  meta.className = 'ticket-meta'
  const type = get(ticket, 'type', '')
  const status = get(ticket, 'status', '') || 'open'
  meta.textContent = type ? `${type} · ${status}` : status

  previewButton.appendChild(title)
  if (get(ticket, 'claimed', false)) {
    const claimed = document.createElement('span')
    claimed.className = 'claimed-mark'
    claimed.textContent = 'Claimed'
    previewButton.appendChild(claimed)
  }
  if (get(ticket, 'frontier', false)) {
    const frontier = document.createElement('span')
    frontier.className = 'frontier-mark'
    frontier.textContent = 'Frontier'
    previewButton.appendChild(frontier)
  }
  if (get(ticket, 'cycle', false)) {
    const cycle = document.createElement('span')
    cycle.className = 'cycle-mark'
    cycle.textContent = 'Cycle'
    previewButton.appendChild(cycle)
  }
  previewButton.appendChild(meta)
  row.appendChild(previewButton)
  return row
}

function findPreviewedTicket() {
  return find(
    map(currentDecisions, (group) => ({
      group,
      ticket: find(get(group, 'tickets', []), (ticket) => get(ticket, 'path') === selectedRelPath),
    })),
    (entry) => get(entry, 'ticket'),
  )
}

function findPreviewedSpec() {
  return find(
    map(currentDecisions, (group) => ({
      group,
      spec: get(group, 'spec.path') === selectedRelPath ? get(group, 'spec') : null,
    })),
    (entry) => get(entry, 'spec'),
  )
}

function updateCopyControl() {
  const hasTake = Boolean(
    get(findPreviewedTicket(), 'ticket.take') || get(findPreviewedSpec(), 'spec.take'),
  )
  const hasSkip = size(selectedTicketPaths) > 0
  mapActionsEl.hidden = !hasSkip && !hasTake
  copySkipBtn.hidden = !hasSkip
  copyTakeBtn.hidden = !hasTake
}

function formatSkipPrompt() {
  const mapBlocks = filter(
    map(currentDecisions, (group) => {
      const tickets = filter(get(group, 'tickets', []), (ticket) =>
        includes(selectedTicketPaths, get(ticket, 'path', '')),
      )
      if (size(tickets) === 0) return null

      const ticketLines = map(tickets, (ticket) => `- ${get(ticket, 'title', '')}`)
      return join(concat(`Map: ${get(group, 'title', '')}`, ticketLines), '\n')
    }),
    Boolean,
  )

  return join(
    concat(
      [SKIP_PROMPT_PREAMBLE, `Project: ${alwaysOn ? currentProjectPath : currentProjectName}`],
      mapBlocks,
    ),
    '\n\n',
  )
}

function formatTakePrompt(group, ticket) {
  const commands = get(ticket, 'take.commands', [])
  const preamble = includes(commands, '/wayfinder')
    ? WAYFINDER_TAKE_PREAMBLE
    : IMPLEMENT_TAKE_PREAMBLE
  const identityLines = filter(
    [
      `Project: ${alwaysOn ? currentProjectPath : currentProjectName}`,
      get(group, 'path') ? `Map: ${get(group, 'title', '')}` : null,
      `Ticket: ${get(ticket, 'title', '')}`,
      `Path: ${get(ticket, 'path', '')}`,
    ],
    Boolean,
  )
  return join(concat(commands, ['', preamble, ''], identityLines), '\n')
}

function formatSpecTakePrompt(group, spec) {
  const commands = get(spec, 'take.commands', [])
  const identityLines = filter(
    [
      `Project: ${alwaysOn ? currentProjectPath : currentProjectName}`,
      get(group, 'path') ? `Map: ${get(group, 'title', '')}` : null,
      `Spec: ${get(spec, 'title', '')}`,
      `Path: ${get(spec, 'path', '')}`,
    ],
    Boolean,
  )
  return join(concat(commands, ['', SPEC_TAKE_PREAMBLE, ''], identityLines), '\n')
}

function makeMapListTab(id, label) {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'map-list-tab'
  if (mapListTab === id) button.classList.add('is-active')
  button.textContent = label
  button.addEventListener('click', () => {
    mapListTab = id
    renderMapList()
  })
  return button
}

function appendDocSection(docs, kind) {
  if (size(docs) === 0) return
  const section = document.createElement('section')
  section.className = 'map-group'
  forEach(docs, (doc) => section.appendChild(makeDocRow(doc, kind)))
  mapListEl.appendChild(section)
}

function resetUnresolvedFilter() {
  remainingWorkOnly = true
  unresolvedFilterEl.checked = true
}

function liveEffortGroups() {
  return remainingWorkOnly
    ? filter(currentDecisions, (group) => !get(group, 'finished', false))
    : currentDecisions
}

function visibleTickets(group) {
  return remainingWorkOnly
    ? filter(get(group, 'tickets', []), (ticket) => !get(ticket, 'resolved', false))
    : get(group, 'tickets', [])
}

function showSiteLabels() {
  return size(uniq(map(liveEffortGroups(), 'siteRel'))) > 1
}

function renderMapList() {
  mapListEl.innerHTML = ''
  const tabs = document.createElement('div')
  tabs.className = 'map-list-tabs'
  tabs.appendChild(makeMapListTab('context', 'Context'))
  tabs.appendChild(makeMapListTab('tickets', 'Tickets'))
  mapListEl.appendChild(tabs)

  if (mapListTab === 'context') {
    appendDocSection(currentLanguage, 'Language')
    appendDocSection(currentAdrs, 'ADR')
    appendDocSection(currentOutOfScope, 'Out of scope')
    updateCopyControl()
    return
  }

  const siteLabels = showSiteLabels()
  let lastSite = null
  forEach(liveEffortGroups(), (group) => {
    if (siteLabels && get(group, 'siteRel') !== lastSite) {
      lastSite = get(group, 'siteRel')
      const label = document.createElement('div')
      label.className = 'site-label'
      label.textContent = get(group, 'siteTitle') || get(group, 'siteRel') || currentProjectName
      mapListEl.appendChild(label)
    }
    const section = document.createElement('section')
    section.className = 'map-group'
    if (get(group, 'finished')) section.classList.add('finished')
    section.appendChild(makeMapRow(group))

    const tickets = visibleTickets(group)
    if (size(tickets) === 0) {
      if (get(group, 'path') || size(get(group, 'tickets', [])) > 0) {
        const empty = document.createElement('p')
        empty.className = 'map-empty'
        empty.textContent = 'No tickets'
        section.appendChild(empty)
      }
    } else {
      forEach(tickets, (ticket) => section.appendChild(makeTicketRow(ticket)))
    }
    mapListEl.appendChild(section)
  })
  updateCopyControl()
}

function languagePaths() {
  return map(currentLanguage, 'path')
}

function resolveRelativeLink(href, baseRelPath) {
  if (!href || href.startsWith('#') || /^[a-z]+:/i.test(href)) return null
  const baseParts = filter(split(baseRelPath, '/'), Boolean)
  let parts = size(baseParts) > 0 ? dropRight(baseParts) : []
  const hrefParts = split(href, '/')
  forEach(hrefParts, (part) => {
    if (part === '.' || part === '') return
    if (part === '..') parts = dropRight(parts)
    else parts = concat(parts, part)
  })
  const resolved = join(parts, '/')
  if (isReadablePreviewPath(resolved, languagePaths())) return resolved
  return null
}

function attachPreviewLinkHandlers(baseRelPath) {
  forEach(toArray(previewEl.querySelectorAll('a')), (a) => {
    const href = a.getAttribute('href')
    if (!href) return
    if (/^https?:/i.test(href)) {
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      return
    }
    if (href.startsWith('#')) return
    const resolved = resolveRelativeLink(href, baseRelPath)
    a.addEventListener('click', (e) => {
      e.preventDefault()
      if (resolved) {
        selectFile(resolved)
      } else {
        showError('Link target is outside the Readable tree')
      }
    })
  })
}

function renderPreviewContent(data, relPath) {
  if (data.noPreview) {
    previewEl.innerHTML = '<p class="no-preview">No preview</p>'
    return
  }
  if (data.contentType === 'text/markdown' || relPath.endsWith('.md')) {
    previewEl.innerHTML = marked.parse(data.content || '')
    attachPreviewLinkHandlers(relPath)
    applyTermHints(previewEl, currentTerms)
  } else if (data.content) {
    previewEl.innerHTML = `<pre><code>${escapeHtml(data.content)}</code></pre>`
  } else {
    previewEl.innerHTML = '<p class="no-preview">No preview</p>'
  }
}

async function selectFile(relPath) {
  const requestId = ++fileRequestId
  selectedRelPath = relPath
  renderMapList()
  updateCopyControl()
  showLoadingPreview(relPath)

  try {
    if (!alwaysOn && !currentRootHandle) throw new Error('No Project loaded')
    const data = alwaysOn
      ? await api(`/api/file?path=${encodeURIComponent(relPath)}`)
      : await readPreviewFile(currentRootHandle, relPath, languagePaths())
    if (requestId !== fileRequestId) return

    previewEl.classList.remove('is-loading')
    previewEl.classList.add('is-swapping')
    previewEl.classList.remove('preview-empty')

    requestAnimationFrame(() => {
      if (requestId !== fileRequestId) return
      renderPreviewContent(data, relPath)
      previewEl.classList.remove('is-swapping')
    })
  } catch (err) {
    if (requestId !== fileRequestId) return
    previewEl.classList.remove('is-loading', 'is-swapping', 'preview-empty')
    previewEl.innerHTML = `<p class="no-preview">${escapeHtml(err.message)}</p>`
  }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function applyProjectData(data, handle) {
  currentMaps = get(data, 'maps', [])
  currentDecisions = get(data, 'decisions', [])
  currentAdrs = get(data, 'adrs', [])
  currentOutOfScope = get(data, 'outOfScope', [])
  currentLanguage = get(data, 'language', [])
  currentTerms = get(data, 'terms', [])
  if (alwaysOn) {
    currentProjectPath = get(data, 'projectPath', '')
    currentProjectName =
      last(filter(split(currentProjectPath, '/'), Boolean)) || currentProjectPath
    currentRootHandle = null
    projectInput.value = currentProjectPath
    projectNameEl.hidden = true
  } else {
    currentProjectPath = ''
    currentProjectName = get(data, 'projectName', handle.name)
    currentRootHandle = handle
    projectNameEl.hidden = false
    projectNameEl.textContent = currentProjectName
  }
  emptyMapsEl.hidden =
    size(currentDecisions) > 0 ||
    size(currentAdrs) > 0 ||
    size(currentOutOfScope) > 0 ||
    size(currentLanguage) > 0
  renderMapList()
  updateCopyControl()
}

function firstPreviewPath() {
  const group = get(liveEffortGroups(), 0)
  const effortPath = group ? effortPreviewPath(group) : ''
  if (effortPath) return effortPath
  if (size(currentLanguage) > 0) return get(currentLanguage, [0, 'path'])
  if (size(currentAdrs) > 0) return get(currentAdrs, [0, 'path'])
  if (size(currentOutOfScope) > 0) return get(currentOutOfScope, [0, 'path'])
  return ''
}

async function archiveEffort(slug) {
  if (!alwaysOn) return
  const confirmed = window.confirm(
    `Move ${slug} to Archive? This moves the Effort, it does not delete it.`,
  )
  if (!confirmed) return
  try {
    showError('')
    const data = await api('/api/archive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    })
    applyProjectData(data)
    const liveTicketPaths = flatten(
      map(currentDecisions, (group) => map(get(group, 'tickets', []), 'path')),
    )
    selectedTicketPaths = filter(selectedTicketPaths, (ticketPath) =>
      includes(liveTicketPaths, ticketPath),
    )
    updateCopyControl()
    const prefix = `.scratch/${slug}/`
    if (
      selectedRelPath &&
      (selectedRelPath === `.scratch/${slug}` || selectedRelPath.startsWith(prefix))
    ) {
      showEmptyPreview()
      renderMapList()
    }
  } catch (err) {
    showError(err.message)
  }
}

async function applyLoadedProject(data) {
  resetUnresolvedFilter()
  applyProjectData(data)
  const previewPath = firstPreviewPath()
  if (previewPath) {
    await selectFile(previewPath)
  } else {
    showEmptyPreview()
  }
}

async function loadProject(projectPath) {
  const requestId = ++projectRequestId
  ++fileRequestId
  loadBtn.disabled = true
  selectedTicketPaths = []
  copyStatusEl.textContent = ''
  mapListTab = 'tickets'
  resetUnresolvedFilter()
  updateCopyControl()
  showError('')
  try {
    const data = await api('/api/project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: projectPath }),
    })
    if (requestId !== projectRequestId) return
    await applyLoadedProject(data)
    if (requestId !== projectRequestId) return
    const state = await api('/api/state')
    if (requestId !== projectRequestId) return
    setRecents(get(state, 'recents', []))
  } catch (err) {
    if (requestId !== projectRequestId) return
    showError(err.message)
    showEmptyPreview()
  } finally {
    if (requestId === projectRequestId) {
      loadBtn.disabled = false
    }
  }
}

async function restoreTree() {
  const requestId = ++projectRequestId
  ++fileRequestId
  loadBtn.disabled = true
  selectedTicketPaths = []
  copyStatusEl.textContent = ''
  mapListTab = 'tickets'
  resetUnresolvedFilter()
  updateCopyControl()
  showError('')
  try {
    const data = await api('/api/tree')
    if (requestId !== projectRequestId) return
    await applyLoadedProject(data)
    if (requestId !== projectRequestId) return
  } catch (err) {
    if (requestId !== projectRequestId) return
    showError(err.message)
    showEmptyPreview()
  } finally {
    if (requestId === projectRequestId) {
      loadBtn.disabled = false
    }
  }
}

async function loadFromHandle(handle) {
  const requestId = ++projectRequestId
  ++fileRequestId
  loadBtn.disabled = true
  selectedTicketPaths = []
  copyStatusEl.textContent = ''
  mapListTab = 'tickets'
  resetUnresolvedFilter()
  updateCopyControl()
  showError('')
  try {
    const data = await walkProject(handle)
    if (requestId !== projectRequestId) return
    resetUnresolvedFilter()
    applyProjectData(data, handle)

    const previewPath = firstPreviewPath()
    if (previewPath) {
      await selectFile(previewPath)
      if (requestId !== projectRequestId) return
    } else {
      showEmptyPreview()
    }

    const recents = await rememberHandle(handle)
    if (requestId !== projectRequestId) return
    setRecents(recents)
  } catch (err) {
    if (requestId !== projectRequestId) return
    showError(err.message)
    showEmptyPreview()
  } finally {
    if (requestId === projectRequestId) {
      loadBtn.disabled = false
    }
  }
}

async function pickProject() {
  if (!window.showDirectoryPicker) {
    showError('This Reader needs Chrome or Edge. This browser cannot pick a folder.')
    return
  }
  try {
    const options = { mode: 'read' }
    if (currentRootHandle) options.startIn = currentRootHandle
    const handle = await window.showDirectoryPicker(options)
    await loadFromHandle(handle)
  } catch (err) {
    if (get(err, 'name') === 'AbortError') return
    showError(get(err, 'message', String(err)))
  }
}

async function restoreRecent(row) {
  const handle = get(row, 'handle')
  if (!handle) {
    showError('That Recent has no stored folder. Load the Project again.')
    return
  }
  const permission = await requestReadPermission(handle)
  if (permission !== 'granted') {
    showError('Chrome needs permission to read that folder. Load it again if the prompt was dismissed.')
    return
  }
  await loadFromHandle(handle)
}

unresolvedFilterEl.addEventListener('change', () => {
  remainingWorkOnly = unresolvedFilterEl.checked
  renderMapList()
})

window.addEventListener('pageshow', () => {
  resetUnresolvedFilter()
  if (
    size(currentDecisions) > 0 ||
    size(currentAdrs) > 0 ||
    size(currentOutOfScope) > 0 ||
    size(currentLanguage) > 0
  ) {
    renderMapList()
  }
})

loadBtn.addEventListener('click', () => {
  if (alwaysOn) {
    const projectPath = projectInput.value.trim()
    if (projectPath) loadProject(projectPath)
    return
  }
  pickProject()
})

projectInput.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' || !alwaysOn) return
  const projectPath = projectInput.value.trim()
  if (projectPath) loadProject(projectPath)
})

recentsSelect.addEventListener('change', async () => {
  const value = recentsSelect.value
  recentsSelect.value = ''
  if (value === '') return
  if (alwaysOn) {
    projectInput.value = value
    await loadProject(value)
    return
  }
  const recents = await listRecents()
  const row = get(recents, Number(value))
  if (row) await restoreRecent(row)
})

copySkipBtn.addEventListener('click', async () => {
  if (size(selectedTicketPaths) === 0) return

  try {
    await navigator.clipboard.writeText(formatSkipPrompt())
    showError('')
    copyStatusEl.textContent = 'Copied'
  } catch {
    copyStatusEl.textContent = ''
    showError('Could not copy the Skip prompt. Check clipboard access and try again.')
  }
})

copyTakeBtn.addEventListener('click', async () => {
  const previewedTicket = findPreviewedTicket()
  const ticket = get(previewedTicket, 'ticket')
  let prompt
  if (get(ticket, 'take')) {
    prompt = formatTakePrompt(get(previewedTicket, 'group'), ticket)
  } else {
    const previewedSpec = findPreviewedSpec()
    const spec = get(previewedSpec, 'spec')
    if (!get(spec, 'take')) return
    prompt = formatSpecTakePrompt(get(previewedSpec, 'group'), spec)
  }

  try {
    await navigator.clipboard.writeText(prompt)
    showError('')
    copyStatusEl.textContent = 'Copied'
  } catch {
    copyStatusEl.textContent = ''
    showError('Could not copy the Take prompt. Check clipboard access and try again.')
  }
})

async function init() {
  resetUnresolvedFilter()
  const state = await detectAlwaysOn()
  if (state) {
    showAlwaysOnChrome()
    showEmptyPreview()
    setRecents(get(state, 'recents', []))
    if (get(state, 'lastProjectPath')) {
      projectInput.value = state.lastProjectPath
      await restoreTree()
    }
    return
  }

  showEmptyPreview()
  if (!window.showDirectoryPicker) {
    showError('This Reader needs Chrome or Edge. This browser cannot pick a folder.')
  }
  try {
    const recents = await listRecents()
    setRecents(recents)
    const last = get(recents, 0)
    const handle = get(last, 'handle')
    if (!handle) return
    const permission = await queryReadPermission(handle)
    if (permission === 'granted') {
      await loadFromHandle(handle)
    }
  } catch (err) {
    showError(err.message)
  }
}

init()
