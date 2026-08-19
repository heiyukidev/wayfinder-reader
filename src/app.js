import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { validateProjectPath, resolveScratchRelPath } from './paths.js'
import { buildReadableTree } from './tree.js'
import { readState, rememberProject } from './state.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

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
  const { tree, maps, decisions } = buildReadableTree(projectPath)
  return c.json({ projectPath, tree, maps, decisions })
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

  const { tree, maps, decisions } = buildReadableTree(validation.projectPath)
  return c.json({ projectPath: validation.projectPath, tree, maps, decisions })
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
  const resolved = resolveScratchRelPath(validation.projectPath, relPath)
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
