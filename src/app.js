import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { validateProjectPath, resolveScratchRelPath, isArchiveRelPath, resolveProjectRelPath } from './paths.js'
import { buildReadableTree } from './tree.js'
import { archiveFinishedEffort } from './archive.js'
import { readState, rememberProject } from './state.js'
import concat from 'lodash/concat.js'
import get from 'lodash/get.js'
import includes from 'lodash/includes.js'
import map from 'lodash/map.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

function projectPayload(projectPath) {
  const { tree, maps, decisions, adrs, outOfScope, language, terms, specOnly } =
    buildReadableTree(projectPath)
  return { projectPath, tree, maps, decisions, adrs, outOfScope, language, terms, specOnly }
}

function resolvePreviewPath(projectPath, relPath) {
  if (isArchiveRelPath(relPath)) {
    return { ok: false, error: 'Archive is not readable', status: 403 }
  }

  const posix = typeof relPath === 'string' ? relPath.replace(/\\/g, '/') : ''
  if (posix.startsWith('.scratch')) {
    return resolveScratchRelPath(projectPath, relPath)
  }

  const { adrs, outOfScope, language } = buildReadableTree(projectPath)
  const allowed = concat(map(adrs, 'path'), map(outOfScope, 'path'), map(language, 'path'))
  if (!includes(allowed, posix)) {
    return { ok: false, error: 'Path must be under .scratch', status: 403 }
  }
  return resolveProjectRelPath(projectPath, posix)
}

export const app = new Hono()

app.get('/api/state', (c) => {
  return c.json(readState())
})

app.post('/api/project', async (c) => {
  const body = await c.req.json()
  const validation = validateProjectPath(body?.path)
  if (!validation.ok) {
    return c.json({ error: validation.error }, 400)
  }

  const projectPath = validation.projectPath
  rememberProject(projectPath)
  return c.json(projectPayload(projectPath))
})

app.get('/api/tree', (c) => {
  const { lastProjectPath } = readState()
  if (!lastProjectPath) {
    return c.json({ error: 'No project selected' }, 404)
  }

  const validation = validateProjectPath(lastProjectPath)
  if (!validation.ok) {
    return c.json({ error: validation.error }, 404)
  }

  return c.json(projectPayload(validation.projectPath))
})

app.post('/api/archive', async (c) => {
  const { lastProjectPath } = readState()
  if (!lastProjectPath) {
    return c.json({ error: 'No project selected' }, 404)
  }

  const validation = validateProjectPath(lastProjectPath)
  if (!validation.ok) {
    return c.json({ error: validation.error }, 404)
  }

  const body = await c.req.json()
  const result = archiveFinishedEffort(validation.projectPath, get(body, 'slug'))
  if (!result.ok) {
    return c.json({ error: result.error }, result.status)
  }
  return c.json(projectPayload(validation.projectPath))
})

app.get('/api/file', (c) => {
  const { lastProjectPath } = readState()
  if (!lastProjectPath) {
    return c.json({ error: 'No project selected' }, 404)
  }

  const validation = validateProjectPath(lastProjectPath)
  if (!validation.ok) {
    return c.json({ error: validation.error }, 404)
  }

  const relPath = c.req.query('path')
  const resolved = resolvePreviewPath(validation.projectPath, relPath)
  if (!resolved.ok) {
    return c.json({ error: resolved.error }, resolved.status)
  }

  const stat = fs.statSync(resolved.absPath)
  if (!stat.isFile()) {
    return c.json({ error: 'Not a file' }, 400)
  }

  const buffer = fs.readFileSync(resolved.absPath)
  const ext = path.extname(resolved.absPath).toLowerCase()
  const markdownExts = new Set(['.md', '.markdown', '.mdown', '.mkd'])
  const isMarkdown = markdownExts.has(ext)

  let content
  let contentType = 'text/plain'
  let noPreview = false

  if (isMarkdown) {
    content = buffer.toString('utf8')
    contentType = 'text/markdown'
  } else {
    const text = buffer.toString('utf8')
    const looksBinary = buffer.includes(0) || !/^[\t\n\r\x20-\x7E\u0080-\uFFFF]*$/.test(text.slice(0, 8192))
    if (looksBinary) {
      noPreview = true
      content = null
    } else {
      content = text
      contentType = 'text/plain'
    }
  }

  return c.json({
    relPath: resolved.relPath,
    content,
    contentType,
    noPreview,
  })
})

app.use(
  '/vendor/lodash-es/*',
  serveStatic({
    root: path.join(ROOT, 'node_modules/lodash-es'),
    rewriteRequestPath: (p) => p.replace(/^\/vendor\/lodash-es/, ''),
  }),
)
app.use(
  '/vendor/marked/*',
  serveStatic({
    root: path.join(ROOT, 'node_modules/marked'),
    rewriteRequestPath: (p) => p.replace(/^\/vendor\/marked/, ''),
  }),
)
app.use('/*', serveStatic({ root: path.join(ROOT, 'public') }))
