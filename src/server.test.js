import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import get from 'lodash/get.js'

let app
let stateDir

function makeTmpProject() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wayfinder-api-'))
  const scratch = path.join(dir, '.scratch')
  fs.mkdirSync(scratch, { recursive: true })
  const effort = path.join(scratch, 'effort')
  fs.mkdirSync(effort)
  fs.writeFileSync(path.join(effort, 'map.md'), '# Map')
  fs.writeFileSync(path.join(effort, 'note.md'), '# Note')
  fs.writeFileSync(path.join(dir, 'package.json'), '{}')
  return dir
}

before(async () => {
  stateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wayfinder-state-'))
  process.env.WAYFINDER_READER_STATE_DIR = stateDir
  const mod = await import('./app.js')
  app = mod.app
})

after(() => {
  delete process.env.WAYFINDER_READER_STATE_DIR
})

async function setProject(projectPath) {
  const { rememberProject } = await import('./state.js')
  rememberProject(projectPath)
}

test('GET /api/file serves file under .scratch', async () => {
  const project = makeTmpProject()
  await setProject(project)

  const res = await app.request('/api/file?path=.scratch/effort/note.md')
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.equal(body.relPath, '.scratch/effort/note.md')
  assert.match(body.content, /Note/)
})

test('GET /api/file rejects ../ traversal with 403', async () => {
  const project = makeTmpProject()
  await setProject(project)

  const res = await app.request('/api/file?path=.scratch/../package.json')
  assert.equal(res.status, 403)
  const body = await res.json()
  assert.match(body.error, /traversal|under \.scratch/i)
})

test('GET /api/file rejects path outside .scratch with 403', async () => {
  const project = makeTmpProject()
  await setProject(project)

  const res = await app.request('/api/file?path=package.json')
  assert.equal(res.status, 403)
})

test('GET /api/file rejects .scratch symlink outside project with 403', async () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'wayfinder-api-outside-'))
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'wayfinder-api-remote-'))
  const outsideScratch = path.join(outside, 'remote')
  fs.mkdirSync(outsideScratch)
  fs.writeFileSync(path.join(outsideScratch, 'leaked.md'), 'leaked')
  fs.symlinkSync(outsideScratch, path.join(project, '.scratch'))

  await setProject(project)

  const res = await app.request('/api/file?path=.scratch/leaked.md')
  assert.equal(res.status, 403)
  const body = await res.json()
  assert.match(get(body, 'error', ''), /sandbox|\.scratch/i)
})

test('GET /api/file rejects symlink inside .scratch pointing outside with 403', async () => {
  const project = makeTmpProject()
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'wayfinder-api-escape-'))
  const outsideFile = path.join(outside, 'secret.md')
  fs.writeFileSync(outsideFile, 'secret')
  fs.symlinkSync(outsideFile, path.join(project, '.scratch', 'effort', 'escape.md'))

  await setProject(project)

  const res = await app.request('/api/file?path=.scratch/effort/escape.md')
  assert.equal(res.status, 403)
})

test('project select and tree refresh include decisions', async () => {
  const project = makeTmpProject()
  const expectedDecisions = [
    {
      title: 'Map',
      path: '.scratch/effort/map.md',
      tickets: [],
    },
  ]

  const selectResponse = await app.request('/api/project', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: project }),
  })
  assert.equal(selectResponse.status, 200)
  const selectBody = await selectResponse.json()
  assert.deepEqual(selectBody.decisions, expectedDecisions)
  assert.equal(get(selectBody, 'tree.name'), '.scratch')
  assert.deepEqual(selectBody.maps, ['.scratch/effort/map.md'])

  const refreshResponse = await app.request('/api/tree')
  assert.equal(refreshResponse.status, 200)
  const refreshBody = await refreshResponse.json()
  assert.deepEqual(refreshBody.decisions, expectedDecisions)
  assert.equal(get(refreshBody, 'tree.name'), '.scratch')
  assert.deepEqual(refreshBody.maps, ['.scratch/effort/map.md'])
})
