import fs from 'node:fs'
import path from 'node:path'
import assign from 'lodash/assign.js'
import concat from 'lodash/concat.js'
import every from 'lodash/every.js'
import filter from 'lodash/filter.js'
import find from 'lodash/find.js'
import forEach from 'lodash/forEach.js'
import get from 'lodash/get.js'
import includes from 'lodash/includes.js'
import indexOf from 'lodash/indexOf.js'
import keyBy from 'lodash/keyBy.js'
import map from 'lodash/map.js'
import max from 'lodash/max.js'
import flatten from 'lodash/flatten.js'
import omit from 'lodash/omit.js'
import replace from 'lodash/replace.js'
import size from 'lodash/size.js'
import slice from 'lodash/slice.js'
import some from 'lodash/some.js'
import split from 'lodash/split.js'
import sortBy from 'lodash/sortBy.js'
import take from 'lodash/take.js'
import toArray from 'lodash/toArray.js'
import toLower from 'lodash/toLower.js'
import uniqBy from 'lodash/uniqBy.js'
import trim from 'lodash/trim.js'
import {
  scratchRoot,
  isUnderRoot,
  canonicalScratchRel,
  resolveProjectRoots,
} from './paths.js'

const SKIP_DIRS = new Set(['node_modules', '.git'])

function isHiddenDir(name) {
  return name.startsWith('.') && name !== '.scratch'
}

function shouldSkipDir(name) {
  return SKIP_DIRS.has(name) || isHiddenDir(name)
}

function posixJoin(parent, name) {
  if (!parent || parent === '.') return name
  return `${parent}/${name}`
}

function looksLikeEffort(names) {
  return includes(names, 'map.md') || includes(names, 'spec.md') || includes(names, 'issues')
}

function isSiteFromNames(names) {
  if (includes(names, '.scratch')) return true
  return includes(names, 'CONTEXT.md') && !looksLikeEffort(names)
}

function languagePathRel(filePath) {
  if (filePath === 'CONTEXT.md' || filePath === 'CONTEXT-MAP.md') return '.'
  if (filePath.endsWith('/CONTEXT.md')) return filePath.slice(0, -'/CONTEXT.md'.length)
  if (filePath.endsWith('/CONTEXT-MAP.md')) return filePath.slice(0, -'/CONTEXT-MAP.md'.length)
  return '.'
}

function huntSites(projectPath) {
  const sites = []
  const visit = (absPath, rel) => {
    const entries = readDirEntries(absPath)
    const names = map(entries, 'name')
    if (isSiteFromNames(names)) {
      const contextFile = path.join(absPath, 'CONTEXT.md')
      let title = rel || path.basename(projectPath)
      if (fs.existsSync(contextFile)) {
        title = readHeading(readText(contextFile)) || title
      }
      sites.push({ rel: rel || '.', title })
    }
    forEach(entries, (entry) => {
      if (!entry.isDirectory()) return
      if (entry.name === '.scratch') return
      if (shouldSkipDir(entry.name)) return
      visit(path.join(absPath, entry.name), posixJoin(rel, entry.name))
    })
  }
  visit(projectPath, '')
  return sites
}

function readDirEntries(dirPath) {
  try {
    return fs.readdirSync(dirPath, { withFileTypes: true })
  } catch {
    return []
  }
}

function isValidEffortFile(projectReal, scratchReal, filePath) {
  try {
    const real = fs.realpathSync(filePath)
    return (
      isUnderRoot(real, scratchReal) &&
      isUnderRoot(real, projectReal) &&
      fs.statSync(real).isFile()
    )
  } catch {
    return false
  }
}

function isValidMap(projectReal, scratchReal, effortDir) {
  return isValidEffortFile(projectReal, scratchReal, path.join(effortDir, 'map.md'))
}

function isValidSpec(projectReal, scratchReal, effortDir) {
  return isValidEffortFile(projectReal, scratchReal, path.join(effortDir, 'spec.md'))
}

function buildNode(projectReal, scratchReal, absPath, relPath, name, type) {
  const node = { name, relPath, type }
  if (type === 'dir') {
    if (isValidMap(projectReal, scratchReal, absPath)) {
      node.isMap = true
    }
    const entries = sortBy(readDirEntries(absPath), (e) => e.name)
    const children = []
    for (const entry of entries) {
      if (entry.isDirectory() && shouldSkipDir(entry.name)) continue
      const childAbs = path.join(absPath, entry.name)
      let childReal
      try {
        childReal = fs.realpathSync(childAbs)
      } catch {
        continue
      }
      if (!isUnderRoot(childReal, scratchReal) || !isUnderRoot(childReal, projectReal)) {
        continue
      }
      const childRel = canonicalScratchRel(scratchReal, childReal)
      children.push(
        buildNode(
          projectReal,
          scratchReal,
          childReal,
          childRel,
          entry.name,
          entry.isDirectory() ? 'dir' : 'file',
        ),
      )
    }
    if (children.length) node.children = children
  }
  return node
}

export function discoverMaps(scratchReal, projectReal) {
  if (!fs.existsSync(scratchReal)) return []
  const entries = readDirEntries(scratchReal)
  const maps = []
  for (const entry of entries) {
    if (!entry.isDirectory() || shouldSkipDir(entry.name)) continue
    const effortDir = path.join(scratchReal, entry.name)
    if (isValidMap(projectReal, scratchReal, effortDir)) {
      maps.push(`.scratch/${entry.name}/map.md`)
    }
  }
  return sortBy(maps)
}

function readText(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8')
  } catch {
    return ''
  }
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

function parseTicket(effortName, issuesPath, entry) {
  const content = readText(path.join(issuesPath, entry.name))
  const headerLines = take(split(content, '\n'), 20)
  const type = readHeader(headerLines, 'Type').toLowerCase()
  const status = readHeader(headerLines, 'Status').toLowerCase()
  const blockerValue = readHeader(headerLines, 'Blocked by')
  const blockers = map(blockerValue.match(/\d+/g) ?? [], Number)
  const resolved = status === 'resolved'
  const claimed = status === 'claimed'

  return {
    number: Number(get(entry.name.match(/^(\d+)-/), 1, 0)),
    title: readHeading(content),
    path: `.scratch/${effortName}/issues/${entry.name}`,
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
    forEach(get(ticket, 'blockers', []), (blockerNumber) => {
      visit(blockerNumber, nextStack)
    })
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
    const computed = assign({}, ticket, {
      depth: ticketDepth(
        ticket,
        ticketsByNumber,
        cycleNumbers,
        [get(ticket, 'number')],
      ),
      frontier,
      cycle,
      take: ticketTake(ticket, frontier, cycle),
    })
    return omit(computed, 'number')
  })
}

function resolveIssuesPath(effortPath, scratchReal, projectReal) {
  const issuesPath = path.join(effortPath, 'issues')
  try {
    const issuesReal = fs.realpathSync(issuesPath)
    const isSafe =
      isUnderRoot(issuesReal, scratchReal) &&
      isUnderRoot(issuesReal, projectReal) &&
      fs.statSync(issuesReal).isDirectory()
    return isSafe ? issuesReal : null
  } catch {
    return null
  }
}

function listTicketEntries(issuesPath) {
  return sortBy(
    filter(
      issuesPath ? readDirEntries(issuesPath) : [],
      (entry) => entry.isFile() && /^\d+-.*\.md$/i.test(entry.name),
    ),
    (entry) => Number(get(entry.name.match(/^(\d+)-/), 1, 0)),
  )
}

function hasTickets(effortPath, scratchReal, projectReal) {
  return size(listTicketEntries(resolveIssuesPath(effortPath, scratchReal, projectReal))) > 0
}

function discoverEffortNames(scratchReal, projectReal) {
  if (!fs.existsSync(scratchReal)) return []
  const names = filter(readDirEntries(scratchReal), (entry) => {
    if (!entry.isDirectory() || shouldSkipDir(entry.name)) return false
    const effortDir = path.join(scratchReal, entry.name)
    return (
      isValidMap(projectReal, scratchReal, effortDir) ||
      isValidSpec(projectReal, scratchReal, effortDir) ||
      hasTickets(effortDir, scratchReal, projectReal)
    )
  })
  return sortBy(map(names, (entry) => entry.name))
}

function specTake(ticketCount) {
  if (ticketCount > 0) return null
  return { commands: ['/to-tickets'] }
}

function specPointer(effortName, effortPath, scratchReal, projectReal, ticketCount) {
  if (!isValidSpec(projectReal, scratchReal, effortPath)) return null
  const specPath = path.join(effortPath, 'spec.md')
  const title = readHeading(readText(specPath))
  return {
    title: title || 'spec.md',
    path: `.scratch/${effortName}/spec.md`,
    take: specTake(ticketCount),
  }
}

function buildDecisions(scratchReal, projectReal) {
  return map(discoverEffortNames(scratchReal, projectReal), (effortName) => {
    const effortPath = path.join(scratchReal, effortName)
    const hasMap = isValidMap(projectReal, scratchReal, effortPath)
    const issuesPath = resolveIssuesPath(effortPath, scratchReal, projectReal)
    const tickets = finalizeTickets(
      map(listTicketEntries(issuesPath), (entry) => parseTicket(effortName, issuesPath, entry)),
    )
    const spec = specPointer(effortName, effortPath, scratchReal, projectReal, size(tickets))
    const mapTitle = hasMap ? readHeading(readText(path.join(effortPath, 'map.md'))) : ''
    const title = mapTitle || get(spec, 'title', '') || effortName
    return {
      title,
      path: hasMap ? `.scratch/${effortName}/map.md` : null,
      folder: effortName,
      spec,
      tickets,
      finished: size(tickets) > 0 && every(tickets, (ticket) => get(ticket, 'resolved', false)),
    }
  })
}

function projectRelPosix(projectReal, realPath) {
  return path.relative(projectReal, realPath).replace(/\\/g, '/')
}

function listMdFiles(dirPath, projectReal) {
  const entries = sortBy(
    filter(readDirEntries(dirPath), (entry) => entry.isFile() && /\.md$/i.test(entry.name)),
    (entry) => entry.name,
  )
  return filter(
    map(entries, (entry) => {
      const absPath = path.join(dirPath, entry.name)
      let realPath
      try {
        realPath = fs.realpathSync(absPath)
      } catch {
        return null
      }
      if (!isUnderRoot(realPath, projectReal) || !fs.statSync(realPath).isFile()) return null
      const title = readHeading(readText(realPath))
      return {
        title: title || entry.name,
        path: projectRelPosix(projectReal, realPath),
      }
    }),
    Boolean,
  )
}

function cleanHref(raw) {
  return replace(trim(get(split(trim(raw), /\s+/), 0, '')), /['"]/g, '')
}

function isContextMdHref(href) {
  return Boolean(href) && !includes(href, '..') && path.basename(href) === 'CONTEXT.md'
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

function resolveProjectFile(projectPath, projectReal, absPath) {
  let realPath
  try {
    realPath = fs.realpathSync(absPath)
  } catch {
    return null
  }
  if (!isUnderRoot(realPath, projectReal) || !fs.statSync(realPath).isFile()) return null
  return {
    realPath,
    path: projectRelPosix(projectReal, realPath),
    content: readText(realPath),
  }
}

function resolveNamedRootFile(projectPath, projectReal, basename) {
  const absPath = path.join(projectPath, basename)
  if (!fs.existsSync(absPath)) return null
  const file = resolveProjectFile(projectPath, projectReal, absPath)
  if (!file || path.basename(get(file, 'realPath')) !== basename) return null
  return file
}

function resolveHrefFile(projectPath, projectReal, href) {
  if (!isContextMdHref(href)) return null
  return resolveProjectFile(projectPath, projectReal, path.resolve(projectPath, href))
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

function parseTerms(content, contextName) {
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

function listLanguageDocs(projectPath) {
  let projectReal
  try {
    projectReal = fs.realpathSync(projectPath)
  } catch {
    return { language: [], terms: [] }
  }

  const language = []
  const seen = new Set()

  const pushFile = (file, knownName) => {
    if (!file || seen.has(get(file, 'path'))) return
    seen.add(get(file, 'path'))
    const content = get(file, 'content', '')
    const title = knownName || readHeading(content) || path.basename(get(file, 'path'))
    language.push({
      title,
      path: get(file, 'path'),
      contextName: title,
      content,
    })
  }

  const mapFile = resolveNamedRootFile(projectPath, projectReal, 'CONTEXT-MAP.md')
  if (mapFile) {
    pushFile(mapFile, '')
    forEach(mappedContextCandidates(get(mapFile, 'content', '')), (candidate) => {
      pushFile(
        resolveHrefFile(projectPath, projectReal, get(candidate, 'href')),
        get(candidate, 'name', ''),
      )
    })
  }

  pushFile(resolveNamedRootFile(projectPath, projectReal, 'CONTEXT.md'), '')

  return {
    language: map(language, (row) => ({
      title: get(row, 'title'),
      path: get(row, 'path'),
      contextName: get(row, 'contextName'),
    })),
    terms: flatten(
      map(language, (row) =>
        map(parseTerms(get(row, 'content', ''), get(row, 'contextName')), (record) =>
          assign({}, record, { rel: languagePathRel(get(row, 'path')) }),
        ),
      ),
    ),
  }
}

function contextMapAdrDirs(projectPath, projectReal) {
  const mapFile = resolveNamedRootFile(projectPath, projectReal, 'CONTEXT-MAP.md')
  if (!mapFile) return []
  return filter(
    map(mappedContextCandidates(get(mapFile, 'content', '')), (candidate) => {
      const file = resolveHrefFile(projectPath, projectReal, get(candidate, 'href'))
      return file ? path.join(path.dirname(get(file, 'realPath')), 'docs', 'adr') : null
    }),
    Boolean,
  )
}

export function listProjectDocs(projectPath) {
  let projectReal
  try {
    projectReal = fs.realpathSync(projectPath)
  } catch {
    return { adrs: [], outOfScope: [] }
  }

  const adrDirs = concat(
    [path.join(projectPath, 'docs', 'adr')],
    contextMapAdrDirs(projectPath, projectReal),
  )
  const adrs = uniqBy(
    concat(
      ...map(adrDirs, (dirPath) => listMdFiles(dirPath, projectReal)),
    ),
    'path',
  )
  const outOfScope = listMdFiles(path.join(projectPath, '.out-of-scope'), projectReal)
  return { adrs, outOfScope }
}

function specOnlyList(decisions) {
  return map(
    filter(decisions, (group) => !get(group, 'path') && get(group, 'spec')),
    (group) => ({
      title: get(group, 'spec.title'),
      path: get(group, 'spec.path'),
      folder: get(group, 'folder'),
    }),
  )
}

export function buildReadableTree(projectPath) {
  const docs = listProjectDocs(projectPath)
  const languageDocs = listLanguageDocs(projectPath)
  let sites = []
  try {
    if (fs.existsSync(projectPath)) sites = huntSites(projectPath)
  } catch {
    sites = []
  }
  const empty = {
    tree: null,
    maps: [],
    decisions: [],
    specOnly: [],
    sites,
    ...docs,
    ...languageDocs,
  }
  const scratch = scratchRoot(projectPath)
  if (!fs.existsSync(scratch)) {
    return empty
  }

  const roots = resolveProjectRoots(projectPath)
  if (!roots.ok) {
    return empty
  }

  const { projectReal, scratchReal } = roots
  const maps = discoverMaps(scratchReal, projectReal)
  const tree = buildNode(projectReal, scratchReal, scratchReal, '.scratch', '.scratch', 'dir')
  const decisions = buildDecisions(scratchReal, projectReal)
  return {
    tree,
    maps,
    decisions,
    specOnly: specOnlyList(decisions),
    sites,
    ...docs,
    ...languageDocs,
  }
}

export function listMapsOnly(projectPath) {
  const scratch = scratchRoot(projectPath)
  if (!fs.existsSync(scratch)) return []
  const roots = resolveProjectRoots(projectPath)
  if (!roots.ok) return []
  return discoverMaps(roots.scratchReal, roots.projectReal)
}
