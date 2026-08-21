import assign from './vendor/lodash-es/assign.js'
import concat from './vendor/lodash-es/concat.js'
import dropRight from './vendor/lodash-es/dropRight.js'
import every from './vendor/lodash-es/every.js'
import filter from './vendor/lodash-es/filter.js'
import find from './vendor/lodash-es/find.js'
import flatten from './vendor/lodash-es/flatten.js'
import forEach from './vendor/lodash-es/forEach.js'
import get from './vendor/lodash-es/get.js'
import includes from './vendor/lodash-es/includes.js'
import indexOf from './vendor/lodash-es/indexOf.js'
import join from './vendor/lodash-es/join.js'
import keyBy from './vendor/lodash-es/keyBy.js'
import keys from './vendor/lodash-es/keys.js'
import last from './vendor/lodash-es/last.js'
import map from './vendor/lodash-es/map.js'
import max from './vendor/lodash-es/max.js'
import omit from './vendor/lodash-es/omit.js'
import replace from './vendor/lodash-es/replace.js'
import set from './vendor/lodash-es/set.js'
import size from './vendor/lodash-es/size.js'
import slice from './vendor/lodash-es/slice.js'
import some from './vendor/lodash-es/some.js'
import sortBy from './vendor/lodash-es/sortBy.js'
import split from './vendor/lodash-es/split.js'
import take from './vendor/lodash-es/take.js'
import toArray from './vendor/lodash-es/toArray.js'
import toLower from './vendor/lodash-es/toLower.js'
import trim from './vendor/lodash-es/trim.js'
import uniqBy from './vendor/lodash-es/uniqBy.js'

const SKIP_DIRS = new Set(['node_modules', '.git'])
const MARKDOWN_EXTS = new Set(['md', 'markdown', 'mdown', 'mkd'])

export function hostedLoadMode(flags) {
  if (get(flags, 'isSafari')) return 'unsupported'
  if (get(flags, 'hasDirectoryPicker')) return 'handle'
  return 'snapshot'
}

export function isHiddenDir(name) {
  return name.startsWith('.') && name !== '.scratch'
}

export function shouldSkipDir(name) {
  return SKIP_DIRS.has(name) || isHiddenDir(name)
}

export function joinRel(parent, name) {
  if (!parent || parent === '.') return name
  return `${parent}/${name}`
}

function posixRel(relPath) {
  return replace(trim(relPath || ''), /\\/g, '/')
}

function relParts(relPath) {
  return filter(split(posixRel(relPath), '/'), (part) => part && part !== '.')
}

function shouldSkipPreviewSegment(name) {
  if (name === '.scratch' || name === '.out-of-scope') return false
  return shouldSkipDir(name)
}

export function isReadablePreviewPath(relPath, languagePaths = []) {
  const posix = posixRel(relPath)
  if (!posix || includes(posix, '..') || posix.startsWith('/')) return false
  if (includes(languagePaths, posix)) return true
  const parts = relParts(posix)
  if (size(parts) === 0 || includes(parts, '..')) return false
  if (some(parts, (part) => shouldSkipPreviewSegment(part))) return false
  if (posix === '.scratch' || posix.startsWith('.scratch/')) return true
  if (posix === 'docs/adr' || posix.startsWith('docs/adr/')) return true
  if (posix === '.out-of-scope' || posix.startsWith('.out-of-scope/')) return true
  if (includes(posix, '/.scratch/')) return true
  if (includes(posix, '/docs/adr/')) return true
  if (includes(posix, '/.out-of-scope/')) return true
  return false
}

function snapshotFileHandle(name, entry) {
  return {
    kind: 'file',
    name,
    async getFile() {
      const file = get(entry, 'file')
      if (file) return file
      const content = get(entry, 'content', '')
      return {
        async text() {
          return content
        },
        async arrayBuffer() {
          return new TextEncoder().encode(content).buffer
        },
      }
    },
  }
}

function snapshotDirHandle(name, children) {
  const byName = keyBy(children, 'name')
  return {
    kind: 'directory',
    name,
    async *values() {
      for (const child of children) yield child
    },
    async getDirectoryHandle(childName) {
      const child = get(byName, [childName])
      if (!child || child.kind !== 'directory') {
        const err = new Error('NotFoundError')
        err.name = 'NotFoundError'
        throw err
      }
      return child
    },
    async getFileHandle(childName) {
      const child = get(byName, [childName])
      if (!child || child.kind !== 'file') {
        const err = new Error('NotFoundError')
        err.name = 'NotFoundError'
        throw err
      }
      return child
    },
  }
}

function snapshotNodeToHandle(name, node) {
  const childDirs = map(keys(get(node, 'dirs')), (dirName) =>
    snapshotNodeToHandle(dirName, get(node, ['dirs', dirName])),
  )
  const childFiles = map(keys(get(node, 'files')), (fileName) =>
    snapshotFileHandle(fileName, get(node, ['files', fileName])),
  )
  return snapshotDirHandle(name, concat(childDirs, childFiles))
}

export function directoryHandleFromSnapshot(files) {
  const projectName = get(relParts(get(files, [0, 'rel'], '')), 0, 'Project')
  const tree = { dirs: {}, files: {} }

  forEach(files, (entry) => {
    const parts = relParts(get(entry, 'rel', ''))
    if (size(parts) < 2) return
    const stripped = slice(parts, 1)
    const dirParts = slice(stripped, 0, size(stripped) - 1)
    if (some(dirParts, (part) => shouldSkipPreviewSegment(part))) return
    let node = tree
    forEach(dirParts, (part) => {
      if (!get(node, ['dirs', part])) {
        set(node, ['dirs', part], { dirs: {}, files: {} })
      }
      node = get(node, ['dirs', part])
    })
    set(node, ['files', last(stripped)], entry)
  })

  return snapshotNodeToHandle(projectName, tree)
}

function looksLikeEffort(names) {
  return includes(names, 'map.md') || includes(names, 'spec.md') || includes(names, 'issues')
}

export function isSiteFromNames(names) {
  if (includes(names, '.scratch')) return true
  return includes(names, 'CONTEXT.md') && !looksLikeEffort(names)
}

export function markersFromNames(names) {
  return filter(
    [
      includes(names, 'CONTEXT.md') ? 'CONTEXT.md' : '',
      includes(names, '.scratch') ? '.scratch/' : '',
    ],
    Boolean,
  )
}

function readHeading(content) {
  const heading = find(split(content, '\n'), (line) => /^#{1,6}\s+/.test(line))
  const match = heading?.match(/^#{1,6}\s+(.+?)\s*#*\s*$/)
  return trim(get(match, 1, ''))
}

function readHeader(lines, name) {
  const pattern = new RegExp(`^\\s*(?:\\*\\*)?${name}:(?:\\*\\*)?\\s*(.*?)\\s*$`, 'i')
  const line = find(lines, (candidate) => pattern.test(candidate))
  return trim(get(line?.match(pattern), 1, ''))
}

function cleanHref(raw) {
  return replace(trim(get(split(trim(raw), /\s+/), 0, '')), /['"]/g, '')
}

function isContextMdHref(href) {
  return Boolean(href) && !includes(href, '..') && last(relParts(href)) === 'CONTEXT.md'
}

function tableCellName(content, index) {
  const lineStart = content.lastIndexOf('\n', index - 1) + 1
  const lineEnd = content.indexOf('\n', index)
  const line = content.slice(lineStart, lineEnd === -1 ? content.length : lineEnd)
  if (!includes(line, '|')) return ''
  const cells = filter(map(split(line, '|'), trim), Boolean)
  if (every(cells, (cell) => /^:?-+:?$/.test(cell))) return ''
  return get(cells, 0, '')
}

function mappedContextCandidates(mapContent) {
  const matches = concat(
    map(toArray(mapContent.matchAll(/\[([^\]]*)\]\(([^)]+)\)/g)), (match) => ({
      index: match.index,
      name: trim(get(match, 1, '')),
      href: cleanHref(get(match, 2, '')),
    })),
    map(toArray(mapContent.matchAll(/`([^`]+)`/g)), (match) => ({
      index: match.index,
      name: tableCellName(mapContent, match.index),
      href: trim(get(match, 1, '')),
    })),
  )
  return filter(sortBy(matches, 'index'), (candidate) => isContextMdHref(get(candidate, 'href')))
}

function siteRelFromHref(href) {
  if (!isContextMdHref(href)) return null
  const parent = join(dropRight(relParts(href)), '/')
  return parent || '.'
}

function firstParagraph(text) {
  const paragraph = trim(get(split(trim(text), /\n\s*\n/), 0, ''))
  return trim(replace(paragraph, /\s*\n\s*/g, ' '))
}

function parseSectionTerms(lines, contextName) {
  const records = []
  let current = null

  const flush = () => {
    if (!current) return
    records.push({
      term: get(current, 'term'),
      definition: firstParagraph(get(current, 'raw', '')),
      avoid: get(current, 'avoid', ''),
      aliases: get(current, 'aliases', []),
      contextName,
    })
    current = null
  }

  forEach(lines, (line) => {
    const block = line.match(/^\*\*([^*]+)\*\*:\s*(.*)$/)
    const list = line.match(/^-\s+\*\*([^*]+)\*\*\s+—\s*(.*)$/)
    const avoid = line.match(/^\s*_Avoid_:\s*(.*)$/i)
    if (block || list) {
      flush()
      const match = block || list
      current = {
        term: trim(get(match, 1, '')),
        raw: trim(get(match, 2, '')),
        avoid: '',
        aliases: [],
      }
      return
    }
    if (current && avoid) {
      const avoidText = trim(get(avoid, 1, ''))
      current.avoid = avoidText
      current.aliases = filter(map(split(avoidText, ','), trim), Boolean)
      current.closed = true
      return
    }
    if (current && !get(current, 'closed')) {
      current.raw = get(current, 'raw') ? `${get(current, 'raw')}\n${line}` : line
    }
  })
  flush()
  return records
}

export function parseTerms(content, contextName) {
  const lines = split(content, '\n')
  const sections = []
  let collecting = false
  let current = []

  forEach(lines, (line) => {
    if (/^##\s+(Language|Glossary)\s*$/i.test(line)) {
      if (collecting) sections.push(current)
      collecting = true
      current = []
      return
    }
    if (collecting && /^##\s+/.test(line)) {
      sections.push(current)
      collecting = false
      current = []
      return
    }
    if (collecting) current.push(line)
  })
  if (collecting) sections.push(current)

  return flatten(map(sections, (section) => parseSectionTerms(section, contextName)))
}

function parseTicket(effortRel, filename, content) {
  const headerLines = take(split(content, '\n'), 20)
  const type = readHeader(headerLines, 'Type').toLowerCase()
  const status = readHeader(headerLines, 'Status').toLowerCase()
  const blockerValue = readHeader(headerLines, 'Blocked by')
  const blockers = map(blockerValue.match(/\d+/g) ?? [], Number)
  const resolved = includes(['resolved', 'done'], status)
  const claimed = status === 'claimed'
  return {
    number: Number(get(filename.match(/^(\d+)-/), 1, 0)),
    title: readHeading(content) || filename,
    path: `${effortRel}/issues/${filename}`,
    type,
    status,
    blockers,
    depth: 0,
    frontier: !resolved && !claimed && size(blockers) === 0,
    resolved,
    claimed,
    cycle: false,
  }
}

function findCycleNumbers(tickets, ticketsByNumber) {
  const cycleNumbers = new Set()
  const finished = new Set()
  const visit = (number, stack) => {
    const cycleStart = indexOf(stack, number)
    if (cycleStart >= 0) {
      forEach(slice(stack, cycleStart), (cycleNumber) => cycleNumbers.add(cycleNumber))
      return
    }
    if (finished.has(number)) return
    const ticket = get(ticketsByNumber, number)
    if (!ticket) return
    const nextStack = concat(stack, number)
    forEach(get(ticket, 'blockers', []), (blockerNumber) => visit(blockerNumber, nextStack))
    finished.add(number)
  }
  forEach(tickets, (ticket) => visit(get(ticket, 'number'), []))
  return cycleNumbers
}

function ticketDepth(ticket, ticketsByNumber, cycleNumbers, visiting) {
  const ticketNumber = get(ticket, 'number')
  const blockers = filter(
    get(ticket, 'blockers', []),
    (blockerNumber) => !(cycleNumbers.has(ticketNumber) && cycleNumbers.has(blockerNumber)),
  )
  if (size(blockers) === 0) return 0
  const blockerDepths = map(blockers, (blockerNumber) => {
    const blocker = get(ticketsByNumber, blockerNumber)
    if (!blocker || includes(visiting, blockerNumber)) return 0
    return ticketDepth(
      blocker,
      ticketsByNumber,
      cycleNumbers,
      concat(visiting, get(blocker, 'number')),
    )
  })
  return 1 + (max(blockerDepths) ?? 0)
}

function ticketTake(ticket, frontier, cycle) {
  if (!frontier || cycle) return null
  const commandsByType = {
    research: ['/wayfinder', '/research'],
    prototype: ['/wayfinder', '/prototype'],
    grilling: ['/wayfinder', '/grill-with-docs'],
    task: ['/wayfinder'],
  }
  return {
    commands: get(commandsByType, toLower(get(ticket, 'type', '')), ['/implement']),
  }
}

function finalizeTickets(tickets) {
  const ticketsByNumber = keyBy(tickets, 'number')
  const cycleNumbers = findCycleNumbers(tickets, ticketsByNumber)
  return map(tickets, (ticket) => {
    const resolved = get(ticket, 'resolved', false)
    const claimed = get(ticket, 'claimed', false)
    const blockers = get(ticket, 'blockers', [])
    const unblocked = every(
      blockers,
      (blockerNumber) => get(ticketsByNumber, [blockerNumber, 'resolved'], false) === true,
    )
    const frontier = !resolved && !claimed && unblocked
    const cycle = cycleNumbers.has(get(ticket, 'number'))
    return omit(
      assign({}, ticket, {
        depth: ticketDepth(ticket, ticketsByNumber, cycleNumbers, [get(ticket, 'number')]),
        frontier,
        cycle,
        take: ticketTake(ticket, frontier, cycle),
      }),
      'number',
    )
  })
}

function specTake(ticketCount) {
  if (ticketCount > 0) return null
  return { commands: ['/to-tickets'] }
}

async function collectChildren(dirHandle) {
  const children = []
  for await (const handle of dirHandle.values()) {
    children.push(handle)
  }
  return sortBy(children, (handle) => handle.name)
}

async function readFileText(fileHandle) {
  const file = await fileHandle.getFile()
  return file.text()
}

async function getDir(parent, name) {
  try {
    return await parent.getDirectoryHandle(name)
  } catch {
    return null
  }
}

async function listMd(dirHandle, rel) {
  if (!dirHandle) return []
  const children = await collectChildren(dirHandle)
  const files = filter(children, (entry) => entry.kind === 'file' && /\.md$/i.test(entry.name))
  const rows = []
  for (const file of files) {
    const content = await readFileText(file)
    rows.push({
      title: readHeading(content) || file.name,
      path: joinRel(rel, file.name),
    })
  }
  return rows
}

async function readEfforts(scratchHandle, siteRel) {
  const children = await collectChildren(scratchHandle)
  const efforts = []
  for (const entry of children) {
    if (entry.kind !== 'directory') continue
    if (shouldSkipDir(entry.name)) continue
    const effortRel = joinRel(joinRel(siteRel === '.' ? '' : siteRel, '.scratch'), entry.name)
    const effortChildren = await collectChildren(entry)
    const mapHandle = find(effortChildren, (child) => child.kind === 'file' && child.name === 'map.md')
    const specHandle = find(effortChildren, (child) => child.kind === 'file' && child.name === 'spec.md')
    const issuesHandle = find(effortChildren, (child) => child.kind === 'directory' && child.name === 'issues')
    if (!mapHandle && !specHandle && !issuesHandle) continue

    let mapTitle = ''
    let mapPath = null
    if (mapHandle) {
      mapTitle = readHeading(await readFileText(mapHandle))
      mapPath = `${effortRel}/map.md`
    }

    let spec = null
    if (specHandle) {
      const specTitle = readHeading(await readFileText(specHandle))
      spec = {
        title: specTitle || 'spec.md',
        path: `${effortRel}/spec.md`,
        take: null,
      }
    }

    let tickets = []
    if (issuesHandle) {
      const issueEntries = await collectChildren(issuesHandle)
      const issueFiles = sortBy(
        filter(issueEntries, (child) => child.kind === 'file' && /^\d+-.*\.md$/i.test(child.name)),
        (child) => Number(get(child.name.match(/^(\d+)-/), 1, 0)),
      )
      const parsed = []
      for (const file of issueFiles) {
        parsed.push(parseTicket(effortRel, file.name, await readFileText(file)))
      }
      tickets = finalizeTickets(parsed)
    }

    if (spec) spec.take = specTake(size(tickets))

    efforts.push({
      title: mapTitle || get(spec, 'title', '') || entry.name,
      path: mapPath,
      folder: entry.name,
      spec,
      tickets,
      finished: size(tickets) > 0 && every(tickets, (ticket) => get(ticket, 'resolved', false)),
    })
  }
  return sortBy(efforts, 'folder')
}

async function huntSites(rootHandle) {
  const sites = []
  async function visit(dirHandle, rel) {
    const children = await collectChildren(dirHandle)
    const names = map(children, 'name')
    if (isSiteFromNames(names)) {
      sites.push({ rel: rel || '.', handle: dirHandle, children, markers: markersFromNames(names) })
    }
    for (const child of children) {
      if (child.kind !== 'directory') continue
      if (child.name === '.scratch') continue
      if (shouldSkipDir(child.name)) continue
      await visit(child, joinRel(rel, child.name))
    }
  }
  await visit(rootHandle, '')
  return sites
}

function orderSites(sites, mapContent) {
  if (!mapContent) return sites
  const byRel = keyBy(sites, 'rel')
  const seen = new Set()
  const first = []
  forEach(mappedContextCandidates(mapContent), (candidate) => {
    const rel = siteRelFromHref(get(candidate, 'href'))
    const site = rel ? get(byRel, [rel]) : null
    if (!site || seen.has(get(site, 'rel'))) return
    seen.add(get(site, 'rel'))
    first.push(assign({}, site, { mapTitle: get(candidate, 'name', '') }))
  })
  const rest = filter(sites, (site) => !seen.has(get(site, 'rel')))
  return concat(first, rest)
}

function languageRow(title, path, content, knownName) {
  const heading = title || path
  const contextName = knownName || heading
  return {
    title: knownName || heading,
    path,
    contextName,
    content,
  }
}

async function readSite(site) {
  const { handle, rel, children, markers, mapTitle } = site
  const language = []
  if (rel !== '.') {
    const contextMap = find(children, (child) => child.kind === 'file' && child.name === 'CONTEXT-MAP.md')
    if (contextMap) {
      const content = await readFileText(contextMap)
      language.push(
        languageRow(readHeading(content), joinRel(rel, 'CONTEXT-MAP.md'), content, ''),
      )
    }
  }
  const contextFile = find(children, (child) => child.kind === 'file' && child.name === 'CONTEXT.md')
  let contextTitle = ''
  if (contextFile) {
    const content = await readFileText(contextFile)
    contextTitle = readHeading(content)
    language.push(
      languageRow(
        contextTitle,
        joinRel(rel === '.' ? '' : rel, 'CONTEXT.md'),
        content,
        mapTitle,
      ),
    )
  }

  const docsDir = await getDir(handle, 'docs')
  const adrDir = docsDir ? await getDir(docsDir, 'adr') : null
  const adrs = await listMd(adrDir, joinRel(rel === '.' ? '' : rel, 'docs/adr'))

  const outDir = await getDir(handle, '.out-of-scope')
  const outOfScope = await listMd(outDir, joinRel(rel === '.' ? '' : rel, '.out-of-scope'))

  const scratchDir = await getDir(handle, '.scratch')
  const efforts = scratchDir ? await readEfforts(scratchDir, rel) : []
  const title =
    mapTitle || contextTitle || get(language, [0, 'title']) || (rel === '.' ? handle.name : rel)

  return { rel, title, markers, language, adrs, outOfScope, efforts }
}

function languageRel(path, sites) {
  const owner = find(sites, (site) =>
    some(get(site, 'language', []), (doc) => get(doc, 'path') === path),
  )
  if (owner) return get(owner, 'rel')
  if (path === 'CONTEXT-MAP.md' || path === 'CONTEXT.md') return '.'
  if (path.endsWith('/CONTEXT.md')) return path.slice(0, -'/CONTEXT.md'.length)
  if (path.endsWith('/CONTEXT-MAP.md')) return path.slice(0, -'/CONTEXT-MAP.md'.length)
  return '.'
}

export async function walkProject(rootHandle) {
  const found = await huntSites(rootHandle)
  const rootChildren = await collectChildren(rootHandle)
  const contextMapHandle = find(
    rootChildren,
    (child) => child.kind === 'file' && child.name === 'CONTEXT-MAP.md',
  )
  const contextMapContent = contextMapHandle ? await readFileText(contextMapHandle) : ''
  const ordered = orderSites(found, contextMapContent)

  const language = []
  if (contextMapHandle) {
    language.push(
      languageRow(
        readHeading(contextMapContent),
        'CONTEXT-MAP.md',
        contextMapContent,
        '',
      ),
    )
  }

  const sites = []
  for (const site of ordered) {
    const read = await readSite(site)
    sites.push(read)
    forEach(get(read, 'language', []), (row) => language.push(row))
  }

  const uniqueLanguage = uniqBy(language, 'path')
  const decisions = flatten(
    map(sites, (site) =>
      map(get(site, 'efforts', []), (effort) =>
        assign({}, effort, {
          siteRel: get(site, 'rel'),
          siteTitle: get(site, 'title'),
        }),
      ),
    ),
  )
  const adrs = flatten(map(sites, 'adrs'))
  const outOfScope = flatten(map(sites, 'outOfScope'))
  const maps = filter(map(decisions, 'path'), Boolean)
  const terms = flatten(
    map(uniqueLanguage, (row) => {
      const rel = languageRel(get(row, 'path'), sites)
      return map(parseTerms(get(row, 'content', ''), get(row, 'contextName')), (record) =>
        assign({}, record, { rel }),
      )
    }),
  )

  return {
    projectName: rootHandle.name,
    sites,
    maps,
    decisions,
    adrs,
    outOfScope,
    language: map(uniqueLanguage, (row) => omit(row, 'content')),
    terms,
  }
}

export async function getFileHandleByRel(rootHandle, relPath) {
  const parts = relParts(relPath)
  if (size(parts) === 0 || includes(parts, '..')) {
    throw new Error('Link target is outside the Readable tree')
  }
  let dir = rootHandle
  for (const part of slice(parts, 0, size(parts) - 1)) {
    dir = await dir.getDirectoryHandle(part)
  }
  return dir.getFileHandle(last(parts))
}

function looksBinary(bytes, text) {
  if (includes(bytes, 0)) return true
  return !/^[\t\n\r\x20-\x7E\u0080-\uFFFF]*$/.test(text.slice(0, 8192))
}

export async function readPreviewFile(rootHandle, relPath, languagePaths = []) {
  if (!isReadablePreviewPath(relPath, languagePaths)) {
    throw new Error('Link target is outside the Readable tree')
  }
  const fileHandle = await getFileHandleByRel(rootHandle, relPath)
  const file = await fileHandle.getFile()
  const buffer = new Uint8Array(await file.arrayBuffer())
  const ext = last(split(toLower(relPath), '.'))
  const isMarkdown = MARKDOWN_EXTS.has(ext)
  const text = new TextDecoder('utf-8', { fatal: false }).decode(buffer)

  if (isMarkdown) {
    return { relPath, content: text, contentType: 'text/markdown', noPreview: false }
  }
  if (looksBinary(buffer, text)) {
    return { relPath, content: null, contentType: 'text/plain', noPreview: true }
  }
  return { relPath, content: text, contentType: 'text/plain', noPreview: false }
}
