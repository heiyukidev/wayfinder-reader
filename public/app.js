import get from '/vendor/lodash-es/get.js'
import concat from '/vendor/lodash-es/concat.js'
import dropRight from '/vendor/lodash-es/dropRight.js'
import forEach from '/vendor/lodash-es/forEach.js'
import filter from '/vendor/lodash-es/filter.js'
import includes from '/vendor/lodash-es/includes.js'
import join from '/vendor/lodash-es/join.js'
import map from '/vendor/lodash-es/map.js'
import size from '/vendor/lodash-es/size.js'
import split from '/vendor/lodash-es/split.js'
import last from '/vendor/lodash-es/last.js'
import truncate from '/vendor/lodash-es/truncate.js'
import toArray from '/vendor/lodash-es/toArray.js'
import { marked } from '/vendor/marked/lib/marked.esm.js'

marked.setOptions({ gfm: true })

const projectInput = document.getElementById('project-path')
const loadBtn = document.getElementById('load-btn')
const recentsSelect = document.getElementById('recents')
const errorEl = document.getElementById('error')
const emptyMapsEl = document.getElementById('empty-maps')
const mapActionsEl = document.getElementById('map-actions')
const mapListEl = document.getElementById('map-list')
const copySkipBtn = document.getElementById('copy-skip-btn')
const copyStatusEl = document.getElementById('copy-status')
const previewEl = document.getElementById('preview')
const previewCaption = document.getElementById('preview-caption')

const EMPTY_PREVIEW_HTML = '<p class="preview-placeholder">Paste a Project path and Load.</p>'
const SKIP_PROMPT_PREAMBLE =
  'Skip grilling these Tickets in this session. Pick your recommended answer for all the questions. Mark them as resolved.'

let currentMaps = []
let currentDecisions = []
let currentProjectPath = ''
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

function formatRecentLabel(p) {
  const base = last(filter(split(p, '/'), Boolean)) || p
  const pathPart = truncate(p, { length: 40, omission: '…' })
  return `${base} — ${pathPart}`
}

function setRecents(recents) {
  recentsSelect.innerHTML = '<option value="">Choose…</option>'
  forEach(recents, (p) => {
    const opt = document.createElement('option')
    opt.value = p
    opt.textContent = formatRecentLabel(p)
    recentsSelect.appendChild(opt)
  })
}

function showEmptyPreview() {
  selectedRelPath = null
  previewCaption.textContent = ''
  previewEl.classList.remove('is-loading', 'is-swapping')
  previewEl.classList.add('preview-empty')
  previewEl.innerHTML = EMPTY_PREVIEW_HTML
}

function showLoadingPreview(relPath) {
  previewCaption.textContent = relPath
  previewEl.classList.remove('preview-empty', 'is-swapping')
  previewEl.classList.add('is-loading')
  previewEl.innerHTML = '<p class="preview-loading-text">Loading…</p>'
}

async function api(path, options) {
  const res = await fetch(path, options)
  const data = await res.json()
  if (!res.ok) {
    throw new Error(get(data, 'error') || `Request failed (${res.status})`)
  }
  return data
}

function makeMapRow(group) {
  const mapPath = get(group, 'path', '')
  const row = document.createElement('button')
  row.type = 'button'
  row.className = 'map-row map-heading-row'
  if (mapPath === selectedRelPath) row.classList.add('selected')
  row.addEventListener('click', () => selectFile(mapPath))

  const title = document.createElement('span')
  title.className = 'map-title'
  title.textContent = get(group, 'title', mapPath)
  const mapPathEl = document.createElement('span')
  mapPathEl.className = 'map-path'
  mapPathEl.textContent = mapPath

  row.appendChild(title)
  row.appendChild(mapPathEl)
  return row
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

function updateCopyControl() {
  mapActionsEl.hidden = size(selectedTicketPaths) === 0
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
      [SKIP_PROMPT_PREAMBLE, `Project: ${currentProjectPath}`],
      mapBlocks,
    ),
    '\n\n',
  )
}

function renderMapList() {
  mapListEl.innerHTML = ''
  forEach(currentDecisions, (group) => {
    const section = document.createElement('section')
    section.className = 'map-group'
    section.appendChild(makeMapRow(group))

    const tickets = get(group, 'tickets', [])
    if (size(tickets) === 0) {
      const empty = document.createElement('p')
      empty.className = 'map-empty'
      empty.textContent = 'No tickets'
      section.appendChild(empty)
    } else {
      forEach(tickets, (ticket) => section.appendChild(makeTicketRow(ticket)))
    }
    mapListEl.appendChild(section)
  })
}

function resolveRelativeLink(href, baseRelPath) {
  if (!href || href.startsWith('#') || /^[a-z]+:/i.test(href)) return null
  const baseDir = baseRelPath.replace(/\/[^/]+$/, '') || '.scratch'
  let parts = filter(split(baseDir, '/'), Boolean)
  const hrefParts = split(href, '/')
  forEach(hrefParts, (part) => {
    if (part === '.' || part === '') return
    if (part === '..') parts = dropRight(parts)
    else parts = concat(parts, part)
  })
  const resolved = join(parts, '/')
  if (!resolved.startsWith('.scratch')) return null
  return resolved
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
  showLoadingPreview(relPath)

  try {
    const data = await api(`/api/file?path=${encodeURIComponent(relPath)}`)
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

async function loadProject(path) {
  const requestId = ++projectRequestId
  ++fileRequestId
  loadBtn.disabled = true
  selectedTicketPaths = []
  copyStatusEl.textContent = ''
  updateCopyControl()
  showError('')
  try {
    const data = await api('/api/project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    })
    if (requestId !== projectRequestId) return
    currentMaps = get(data, 'maps', [])
    currentDecisions = get(data, 'decisions', [])
    currentProjectPath = get(data, 'projectPath', '')
    projectInput.value = currentProjectPath
    emptyMapsEl.hidden = size(currentMaps) > 0
    renderMapList()

    if (size(currentMaps) > 0) {
      await selectFile(get(currentMaps, 0))
      if (requestId !== projectRequestId) return
    } else {
      showEmptyPreview()
    }

    const state = await api('/api/state')
    if (requestId !== projectRequestId) return
    setRecents(state.recents)
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

loadBtn.addEventListener('click', () => {
  const path = projectInput.value.trim()
  if (path) loadProject(path)
})

projectInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') loadProject(projectInput.value.trim())
})

recentsSelect.addEventListener('change', () => {
  const path = recentsSelect.value
  if (path) {
    projectInput.value = path
    loadProject(path)
    recentsSelect.value = ''
  }
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

async function init() {
  try {
    const state = await api('/api/state')
    setRecents(state.recents)
    if (state.lastProjectPath) {
      projectInput.value = state.lastProjectPath
      await loadProject(state.lastProjectPath)
    } else {
      showEmptyPreview()
    }
  } catch (err) {
    showError(err.message)
    showEmptyPreview()
  }
}

init()
