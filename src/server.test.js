import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import get from 'lodash/get.js'
import map from 'lodash/map.js'
import find from 'lodash/find.js'
import includes from 'lodash/includes.js'
import keys from 'lodash/keys.js'
import sortBy from 'lodash/sortBy.js'

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

async function loadProject(projectPath) {
  const res = await app.request('/api/project', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: projectPath }),
  })
  const body = await res.json()
  return { res, body }
}

test('project load lists Ticket-only Efforts and Finished from Status resolved only', async () => {
  const project = makeTmpProject()
  const ticketsOnly = path.join(project, '.scratch', 'first-slice')
  const issues = path.join(ticketsOnly, 'issues')
  const finishedEffort = path.join(project, '.scratch', 'done-run')
  const finishedIssues = path.join(finishedEffort, 'issues')
  const openEffort = path.join(project, '.scratch', 'open-run')
  const openIssues = path.join(openEffort, 'issues')
  const archived = path.join(project, '.scratch', '.archive', 'old-run')
  fs.mkdirSync(issues, { recursive: true })
  fs.mkdirSync(finishedIssues, { recursive: true })
  fs.mkdirSync(openIssues, { recursive: true })
  fs.mkdirSync(archived, { recursive: true })
  fs.writeFileSync(
    path.join(issues, '01-slice.md'),
    '# First slice\n\nType: task\nStatus: ready-for-agent\n\n- [x] done\n',
  )
  fs.writeFileSync(path.join(finishedEffort, 'map.md'), '# Done Run')
  fs.writeFileSync(
    path.join(finishedIssues, '01-lock.md'),
    '# Lock\n\nType: grilling\nStatus: resolved\n',
  )
  fs.writeFileSync(path.join(openIssues, '01-open.md'), '# Open\n\nType: task\nStatus:\n')
  fs.writeFileSync(path.join(archived, 'map.md'), '# Archived Map')

  const { res, body } = await loadProject(project)
  assert.equal(res.status, 200)
  const folders = map(body.decisions, (group) => get(group, 'folder'))
  assert.deepEqual(folders, ['done-run', 'effort', 'first-slice', 'open-run'])
  const ticketOnly = find(body.decisions, (group) => get(group, 'folder') === 'first-slice')
  assert.equal(get(ticketOnly, 'title'), 'first-slice')
  assert.equal(get(ticketOnly, 'path'), null)
  assert.equal(get(ticketOnly, 'finished'), false)
  assert.equal(get(ticketOnly, ['tickets', 0, 'resolved']), false)
  assert.deepEqual(get(ticketOnly, ['tickets', 0, 'take']), { commands: ['/wayfinder'] })
  const done = find(body.decisions, (group) => get(group, 'folder') === 'done-run')
  assert.equal(get(done, 'finished'), true)
  assert.equal(get(done, ['tickets', 0, 'take']), null)
  const open = find(body.decisions, (group) => get(group, 'folder') === 'open-run')
  assert.equal(get(open, 'finished'), false)
  assert.equal(get(open, ['tickets', 0, 'resolved']), false)
})

test('project load lists ADRs and Out-of-scope records', async () => {
  const project = makeTmpProject()
  const adrDir = path.join(project, 'docs', 'adr')
  const oosDir = path.join(project, '.out-of-scope')
  const nestedAdr = path.join(project, 'apps', 'mobile', 'docs', 'adr')
  fs.mkdirSync(adrDir, { recursive: true })
  fs.mkdirSync(oosDir, { recursive: true })
  fs.mkdirSync(nestedAdr, { recursive: true })
  fs.writeFileSync(path.join(adrDir, '0001-lock.md'), '# Archive finished Efforts\n\nWe archive.\n')
  fs.writeFileSync(path.join(oosDir, 'dark-mode.md'), '# Dark Mode\n\nRejected.\n')
  fs.writeFileSync(
    path.join(project, 'CONTEXT-MAP.md'),
    '# Map\n\n- [Mobile](./apps/mobile/CONTEXT.md)\n',
  )
  fs.writeFileSync(path.join(project, 'apps', 'mobile', 'CONTEXT.md'), '# Mobile\n')
  fs.writeFileSync(path.join(nestedAdr, '0001-mobile.md'), '# Mobile lock\n')

  const { res, body } = await loadProject(project)
  assert.equal(res.status, 200)
  assert.deepEqual(body.adrs, [
    { title: 'Archive finished Efforts', path: 'docs/adr/0001-lock.md' },
    { title: 'Mobile lock', path: 'apps/mobile/docs/adr/0001-mobile.md' },
  ])
  assert.deepEqual(body.outOfScope, [
    { title: 'Dark Mode', path: '.out-of-scope/dark-mode.md' },
  ])

  const treeRes = await app.request('/api/tree')
  assert.equal(treeRes.status, 200)
  const treeBody = await treeRes.json()
  assert.deepEqual(treeBody.adrs, body.adrs)
  assert.deepEqual(treeBody.outOfScope, body.outOfScope)
  assert.deepEqual(treeBody.decisions, body.decisions)
})

test('project load skips escaping and symlink-out ADR paths', async () => {
  const project = makeTmpProject()
  const adrDir = path.join(project, 'docs', 'adr')
  const nestedAdr = path.join(project, 'apps', 'mobile', 'docs', 'adr')
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'wayfinder-adr-outside-'))
  fs.mkdirSync(adrDir, { recursive: true })
  fs.mkdirSync(nestedAdr, { recursive: true })
  fs.writeFileSync(path.join(adrDir, '0001-lock.md'), '# Inside lock\n')
  fs.writeFileSync(path.join(nestedAdr, '0001-mobile.md'), '# Mobile lock\n')
  fs.writeFileSync(path.join(outside, 'leaked.md'), '# Leaked ADR\n')
  fs.writeFileSync(path.join(outside, 'CONTEXT.md'), '# Outside context\n')
  fs.symlinkSync(path.join(outside, 'leaked.md'), path.join(adrDir, 'leak.md'))
  fs.writeFileSync(
    path.join(project, 'CONTEXT-MAP.md'),
    '# Map\n\n- [Outside](../elsewhere/CONTEXT.md)\n- [Mobile](./apps/mobile/CONTEXT.md)\n',
  )
  fs.writeFileSync(path.join(project, 'apps', 'mobile', 'CONTEXT.md'), '# Mobile\n')

  const { res, body } = await loadProject(project)
  assert.equal(res.status, 200)
  assert.deepEqual(body.adrs, [
    { title: 'Inside lock', path: 'docs/adr/0001-lock.md' },
    { title: 'Mobile lock', path: 'apps/mobile/docs/adr/0001-mobile.md' },
  ])
  assert.deepEqual(body.outOfScope, [])

  const leakRes = await app.request('/api/file?path=docs/adr/leak.md')
  assert.equal(leakRes.status, 403)
})

test('GET /api/file serves ADR and Out-of-scope paths and refuses Archive', async () => {
  const project = makeTmpProject()
  const adrDir = path.join(project, 'docs', 'adr')
  const oosDir = path.join(project, '.out-of-scope')
  const archived = path.join(project, '.scratch', '.archive', 'old-run')
  fs.mkdirSync(adrDir, { recursive: true })
  fs.mkdirSync(oosDir, { recursive: true })
  fs.mkdirSync(archived, { recursive: true })
  fs.writeFileSync(path.join(adrDir, '0001-lock.md'), '# Archive finished Efforts\n')
  fs.writeFileSync(path.join(oosDir, 'dark-mode.md'), '# Dark Mode\n')
  fs.writeFileSync(path.join(archived, 'map.md'), '# Hidden\n')
  fs.writeFileSync(path.join(project, '.env'), 'SECRET=1\n')

  await setProject(project)

  const adrRes = await app.request('/api/file?path=docs/adr/0001-lock.md')
  assert.equal(adrRes.status, 200)
  assert.match((await adrRes.json()).content, /Archive finished Efforts/)

  const oosRes = await app.request('/api/file?path=.out-of-scope/dark-mode.md')
  assert.equal(oosRes.status, 200)
  assert.match((await oosRes.json()).content, /Dark Mode/)

  const archivedRes = await app.request('/api/file?path=.scratch/.archive/old-run/map.md')
  assert.equal(archivedRes.status, 403)

  const pkgRes = await app.request('/api/file?path=package.json')
  assert.equal(pkgRes.status, 403)

  const envRes = await app.request('/api/file?path=.env')
  assert.equal(envRes.status, 403)
})

function makeFinishedEffort(project, slug) {
  const done = path.join(project, '.scratch', slug)
  const issues = path.join(done, 'issues')
  const research = path.join(done, 'research')
  const prototypes = path.join(done, 'prototypes')
  fs.mkdirSync(issues, { recursive: true })
  fs.mkdirSync(research, { recursive: true })
  fs.mkdirSync(prototypes, { recursive: true })
  fs.writeFileSync(path.join(done, 'map.md'), '# Done Run')
  fs.writeFileSync(path.join(issues, '01-lock.md'), '# Lock\n\nStatus: resolved\n')
  fs.writeFileSync(path.join(research, '01-notes.md'), '# Notes\n')
  fs.writeFileSync(path.join(prototypes, 'sketch.js'), 'export default {}\n')
  return done
}

test('Load and file fetch never archive a Finished Effort', async () => {
  const project = makeTmpProject()
  makeFinishedEffort(project, 'done-run')
  const archiveDir = path.join(project, '.scratch', '.archive')
  assert.equal(fs.existsSync(archiveDir), false)

  const { res, body } = await loadProject(project)
  assert.equal(res.status, 200)
  assert.equal(includes(map(body.decisions, (group) => get(group, 'folder')), 'done-run'), true)
  assert.equal(fs.existsSync(path.join(project, '.scratch', 'done-run', 'map.md')), true)
  assert.equal(fs.existsSync(archiveDir), false)

  const fileRes = await app.request('/api/file?path=.scratch/done-run/map.md')
  assert.equal(fileRes.status, 200)
  assert.equal(fs.existsSync(path.join(project, '.scratch', 'done-run', 'map.md')), true)
  assert.equal(fs.existsSync(archiveDir), false)
})

test('POST /api/archive moves a Finished Effort and rejects the rest', async () => {
  const project = makeTmpProject()
  makeFinishedEffort(project, 'done-run')
  fs.mkdirSync(path.join(project, 'src'), { recursive: true })
  fs.writeFileSync(path.join(project, 'src', 'index.js'), 'export {}\n')
  fs.mkdirSync(path.join(project, '.scratch', '.archive', 'done-run'), { recursive: true })
  fs.writeFileSync(path.join(project, '.scratch', '.archive', 'done-run', 'map.md'), '# Previous\n')

  await setProject(project)

  const openRes = await app.request('/api/archive', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: 'effort' }),
  })
  assert.equal(openRes.status, 400)
  assert.equal(fs.existsSync(path.join(project, '.scratch', 'effort', 'map.md')), true)

  const traversalRes = await app.request('/api/archive', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: '../effort' }),
  })
  assert.equal(traversalRes.status, 403)

  const nestedRes = await app.request('/api/archive', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: 'done-run/research' }),
  })
  assert.equal(nestedRes.status, 403)
  assert.equal(
    fs.existsSync(path.join(project, '.scratch', 'done-run', 'research', '01-notes.md')),
    true,
  )

  const outsideRes = await app.request('/api/archive', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: 'src' }),
  })
  assert.notEqual(outsideRes.status, 200)
  assert.equal(fs.existsSync(path.join(project, 'src', 'index.js')), true)
  assert.equal(fs.existsSync(path.join(project, '.scratch', 'done-run', 'map.md')), true)

  const archiveSelf = await app.request('/api/archive', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: '.archive' }),
  })
  assert.equal(archiveSelf.status, 403)

  const okRes = await app.request('/api/archive', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: 'done-run' }),
  })
  assert.equal(okRes.status, 200)
  const okBody = await okRes.json()
  const folders = map(okBody.decisions, (group) => get(group, 'folder'))
  assert.equal(includes(folders, 'done-run'), false)
  assert.equal(fs.existsSync(path.join(project, '.scratch', 'done-run')), false)
  assert.equal(
    fs.existsSync(path.join(project, '.scratch', '.archive', 'done-run-2', 'research', '01-notes.md')),
    true,
  )
  assert.equal(
    fs.existsSync(path.join(project, '.scratch', '.archive', 'done-run-2', 'prototypes', 'sketch.js')),
    true,
  )
  assert.equal(
    fs.existsSync(path.join(project, '.scratch', '.archive', 'done-run', 'map.md')),
    true,
  )

  const treeRes = await app.request('/api/tree')
  assert.equal(treeRes.status, 200)
  const treeBody = await treeRes.json()
  assert.deepEqual(sortBy(keys(okBody)), sortBy(keys(treeBody)))
  assert.deepEqual(okBody.decisions, treeBody.decisions)
  assert.deepEqual(okBody.maps, treeBody.maps)
  assert.deepEqual(okBody.adrs, treeBody.adrs)
  assert.deepEqual(okBody.outOfScope, treeBody.outOfScope)
  assert.deepEqual(okBody.language, treeBody.language)

  const archivedFile = await app.request('/api/file?path=.scratch/.archive/done-run-2/map.md')
  assert.equal(archivedFile.status, 403)
})

test('POST /api/archive rejects a .scratch that escapes the Project', async () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'wayfinder-archive-outside-'))
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'wayfinder-archive-remote-'))
  const outsideScratch = path.join(outside, 'remote')
  const effort = path.join(outsideScratch, 'done-run')
  fs.mkdirSync(path.join(effort, 'issues'), { recursive: true })
  fs.writeFileSync(path.join(effort, 'map.md'), '# Done Run')
  fs.writeFileSync(path.join(effort, 'issues', '01-lock.md'), '# Lock\n\nStatus: resolved\n')
  fs.symlinkSync(outsideScratch, path.join(project, '.scratch'))

  await setProject(project)

  const res = await app.request('/api/archive', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: 'done-run' }),
  })
  assert.equal(res.status, 403)
  assert.equal(fs.existsSync(path.join(effort, 'map.md')), true)
})

test('project load lists a Spec-only Effort that is not finished', async () => {
  const project = makeTmpProject()
  const specOnly = path.join(project, '.scratch', 'first-slice')
  const notesOnly = path.join(project, '.scratch', 'notes-only')
  fs.mkdirSync(specOnly)
  fs.mkdirSync(notesOnly)
  fs.writeFileSync(path.join(specOnly, 'spec.md'), '# Standalone Spec\n\nStatus: ready-for-agent\n')
  fs.writeFileSync(path.join(notesOnly, 'notes.md'), '# Notes only\n')

  const { res, body } = await loadProject(project)
  assert.equal(res.status, 200)
  assert.deepEqual(body.decisions, [
    {
      title: 'Map',
      path: '.scratch/effort/map.md',
      folder: 'effort',
      spec: null,
      tickets: [],
      finished: false,
    },
    {
      title: 'Standalone Spec',
      path: null,
      folder: 'first-slice',
      spec: {
        title: 'Standalone Spec',
        path: '.scratch/first-slice/spec.md',
        take: { commands: ['/to-tickets'] },
      },
      tickets: [],
      finished: false,
    },
  ])
})

test('project load lists Spec and Tickets without a Map as one unfinished Effort', async () => {
  const project = makeTmpProject()
  const dir = path.join(project, '.scratch', 'plan-run')
  const issues = path.join(dir, 'issues')
  fs.mkdirSync(issues, { recursive: true })
  fs.writeFileSync(path.join(dir, 'spec.md'), '# Plan\n')
  fs.writeFileSync(path.join(issues, '01-slice.md'), '# Slice\n\nStatus: claimed\n')

  const { res, body } = await loadProject(project)
  assert.equal(res.status, 200)
  const group = find(body.decisions, (item) => get(item, 'folder') === 'plan-run')
  assert.equal(get(group, 'title'), 'Plan')
  assert.equal(get(group, 'path'), null)
  assert.equal(get(group, 'spec.path'), '.scratch/plan-run/spec.md')
  assert.equal(get(group, 'spec.take'), null)
  assert.equal(get(group, 'finished'), false)
  assert.equal(get(group, ['tickets', 0, 'claimed']), true)
  assert.equal(get(group, ['tickets', 0, 'resolved']), false)
  assert.equal(get(group, ['tickets', 0, 'take']), null)
})

test('project select and tree refresh include decisions', async () => {
  const project = makeTmpProject()
  const expectedDecisions = [
    {
      title: 'Map',
      path: '.scratch/effort/map.md',
      folder: 'effort',
      spec: null,
      tickets: [],
      finished: false,
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
  assert.deepEqual(selectBody.adrs, [])
  assert.deepEqual(selectBody.outOfScope, [])

  const refreshResponse = await app.request('/api/tree')
  assert.equal(refreshResponse.status, 200)
  const refreshBody = await refreshResponse.json()
  assert.deepEqual(refreshBody.decisions, expectedDecisions)
  assert.equal(get(refreshBody, 'tree.name'), '.scratch')
  assert.deepEqual(refreshBody.maps, ['.scratch/effort/map.md'])
  assert.deepEqual(refreshBody.adrs, [])
  assert.deepEqual(refreshBody.outOfScope, [])
  assert.deepEqual(refreshBody.language, [])
  assert.deepEqual(refreshBody.terms, [])
  assert.deepEqual(refreshBody.specOnly, [])
})

test('GET /api/file serves language paths and still refuses package.json and .env', async () => {
  const project = makeTmpProject()
  fs.writeFileSync(
    path.join(project, 'CONTEXT.md'),
    '# Glossary\n\n## Glossary\n\n- **Reader** — local viewer.\n',
  )
  fs.writeFileSync(path.join(project, '.env'), 'SECRET=1\n')

  const { res, body } = await loadProject(project)
  assert.equal(res.status, 200)
  assert.deepEqual(body.language, [
    { title: 'Glossary', path: 'CONTEXT.md', contextName: 'Glossary' },
  ])
  assert.equal(get(body, ['terms', 0, 'term']), 'Reader')
  assert.equal(get(body, ['terms', 0, 'rel']), '.')

  const fileRes = await app.request('/api/file?path=CONTEXT.md')
  assert.equal(fileRes.status, 200)
  assert.match((await fileRes.json()).content, /local viewer/)

  const pkgRes = await app.request('/api/file?path=package.json')
  assert.equal(pkgRes.status, 403)

  const envRes = await app.request('/api/file?path=.env')
  assert.equal(envRes.status, 403)

  const traversalRes = await app.request('/api/file?path=.scratch/../CONTEXT.md')
  assert.equal(traversalRes.status, 403)
})
