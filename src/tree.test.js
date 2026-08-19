import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import map from 'lodash/map.js'
import get from 'lodash/get.js'
import some from 'lodash/some.js'
import { buildReadableTree, discoverMaps } from './tree.js'

function makeFixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wayfinder-tree-'))
  const scratch = path.join(dir, '.scratch')
  const mapEffort = path.join(scratch, 'map-reader')
  const specOnly = path.join(scratch, 'spec-only')
  const issues = path.join(mapEffort, 'issues')

  fs.mkdirSync(issues, { recursive: true })
  fs.writeFileSync(path.join(mapEffort, 'map.md'), '# Map')
  fs.writeFileSync(path.join(issues, '01-ticket.md'), '# Ticket')
  fs.mkdirSync(specOnly)
  fs.writeFileSync(path.join(specOnly, 'notes.md'), '# Notes only')

  return dir
}

function collectRelPaths(node) {
  const paths = [node.relPath]
  for (const child of get(node, 'children', [])) {
    paths.push(...collectRelPaths(child))
  }
  return paths
}

test('tree lists Map and spec-only sibling; maps only includes Map', () => {
  const project = makeFixture()
  const { tree, maps } = buildReadableTree(project)

  assert.equal(maps.length, 1)
  assert.equal(maps[0], '.scratch/map-reader/map.md')

  const children = tree.children ?? []
  const childNames = map(children, (c) => c.name).sort()
  assert.deepEqual(childNames, ['map-reader', 'spec-only'])

  const mapNode = children.find((c) => c.name === 'map-reader')
  assert.equal(mapNode?.isMap, true)

  const specNode = children.find((c) => c.name === 'spec-only')
  assert.equal(specNode?.isMap, undefined)
})

test('tree relPaths are canonical .scratch/... paths', () => {
  const project = makeFixture()
  const { tree } = buildReadableTree(project)
  const relPaths = collectRelPaths(tree)
  for (const rel of relPaths) {
    assert.match(rel, /^\.scratch(\/|$)/)
    assert.doesNotMatch(rel, /\.\./)
  }
})

test('missing .scratch yields empty maps', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wayfinder-empty-'))
  const { tree, maps } = buildReadableTree(dir)
  assert.equal(tree, null)
  assert.deepEqual(maps, [])
})

test('empty .scratch yields empty maps', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wayfinder-scratch-empty-'))
  fs.mkdirSync(path.join(dir, '.scratch'))
  const { tree, maps } = buildReadableTree(dir)
  assert.equal(tree?.type, 'dir')
  assert.deepEqual(maps, [])
  assert.deepEqual(tree.children ?? [], [])
})

test('discoverMaps finds one-level map.md only', () => {
  const project = makeFixture()
  const scratchReal = fs.realpathSync(path.join(project, '.scratch'))
  const projectReal = fs.realpathSync(project)
  const maps = discoverMaps(scratchReal, projectReal)
  assert.equal(maps.length, 1)
  assert.equal(maps[0], '.scratch/map-reader/map.md')
})

test('discoverMaps ignores map.md symlink outside project', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'wayfinder-map-symlink-'))
  const scratch = path.join(project, '.scratch')
  fs.mkdirSync(scratch)
  const effort = path.join(scratch, 'effort')
  fs.mkdirSync(effort)

  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'wayfinder-outside-map-'))
  const outsideMap = path.join(outside, 'map.md')
  fs.writeFileSync(outsideMap, '# Outside')
  fs.symlinkSync(outsideMap, path.join(effort, 'map.md'))

  const scratchReal = fs.realpathSync(scratch)
  const projectReal = fs.realpathSync(project)
  const maps = discoverMaps(scratchReal, projectReal)
  assert.deepEqual(maps, [])
})

test('decisions lists only numbered Ticket files under Maps', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'wayfinder-decisions-'))
  const scratch = path.join(project, '.scratch')
  const activeEffort = path.join(scratch, 'active-effort')
  const issues = path.join(activeEffort, 'issues')
  const emptyEffort = path.join(scratch, 'empty-effort')
  const missingIssuesEffort = path.join(scratch, 'missing-issues')
  const specOnly = path.join(scratch, 'spec-only')

  fs.mkdirSync(path.join(activeEffort, 'research'), { recursive: true })
  fs.mkdirSync(path.join(activeEffort, 'prototypes'), { recursive: true })
  fs.mkdirSync(issues)
  fs.mkdirSync(path.join(emptyEffort, 'issues'), { recursive: true })
  fs.mkdirSync(missingIssuesEffort, { recursive: true })
  fs.mkdirSync(specOnly, { recursive: true })
  fs.writeFileSync(path.join(activeEffort, 'map.md'), '# Active Map')
  fs.writeFileSync(path.join(activeEffort, 'spec.md'), '# Active Spec')
  fs.writeFileSync(path.join(activeEffort, 'research', '01-notes.md'), '# Research Notes')
  fs.writeFileSync(path.join(activeEffort, 'prototypes', 'stub.html'), '<h1>Prototype</h1>')
  fs.writeFileSync(
    path.join(issues, '01-first-ticket.md'),
    '# First Ticket\n\nType: decision\nStatus:\nBlocked by:\n',
  )
  fs.writeFileSync(path.join(issues, 'notes.md'), '# Unnumbered Notes')
  fs.writeFileSync(path.join(emptyEffort, 'map.md'), '# Empty Map')
  fs.writeFileSync(path.join(missingIssuesEffort, 'map.md'), '# Missing Issues Map')
  fs.writeFileSync(path.join(specOnly, 'spec.md'), '# Standalone Spec')

  const { tree, maps, decisions } = buildReadableTree(project)

  assert.deepEqual(maps, [
    '.scratch/active-effort/map.md',
    '.scratch/empty-effort/map.md',
    '.scratch/missing-issues/map.md',
  ])
  assert.deepEqual(decisions, [
    {
      title: 'Active Map',
      path: '.scratch/active-effort/map.md',
      folder: 'active-effort',
      spec: { title: 'Active Spec', path: '.scratch/active-effort/spec.md' },
      tickets: [
        {
          title: 'First Ticket',
          path: '.scratch/active-effort/issues/01-first-ticket.md',
          type: 'decision',
          status: '',
          blockers: [],
          depth: 0,
          frontier: true,
          resolved: false,
          claimed: false,
          cycle: false,
        },
      ],
      finished: false,
    },
    {
      title: 'Empty Map',
      path: '.scratch/empty-effort/map.md',
      folder: 'empty-effort',
      spec: null,
      tickets: [],
      finished: false,
    },
    {
      title: 'Missing Issues Map',
      path: '.scratch/missing-issues/map.md',
      folder: 'missing-issues',
      spec: null,
      tickets: [],
      finished: false,
    },
    {
      title: 'Standalone Spec',
      path: null,
      folder: 'spec-only',
      spec: { title: 'Standalone Spec', path: '.scratch/spec-only/spec.md' },
      tickets: [],
      finished: false,
    },
  ])
  assert.equal(
    some(get(tree, 'children', []), (child) => child.name === 'spec-only'),
    true,
  )
})

test('decisions computes blocker depth and Frontier from Ticket status', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'wayfinder-blockers-'))
  const effort = path.join(project, '.scratch', 'blockers')
  const issues = path.join(effort, 'issues')

  fs.mkdirSync(issues, { recursive: true })
  fs.writeFileSync(path.join(effort, 'map.md'), '# Blocking Map')
  fs.writeFileSync(
    path.join(issues, '01-resolved.md'),
    '# Resolved Groundwork\n\n**Type:** research\n**Status:** resolved\n**Blocked by:**\n',
  )
  fs.writeFileSync(
    path.join(issues, '02-claimed.md'),
    '# Claimed Decision\n\nType: decision\nStatus: claimed\nBlocked by: 01\n',
  )
  fs.writeFileSync(
    path.join(issues, '03-deep.md'),
    '# Deep Ticket\n\nType: implementation\nStatus:\nBlocked by: 1, 02\n',
  )
  fs.writeFileSync(
    path.join(issues, '04-ready-after-resolved.md'),
    '# Ready After Resolved\n\nType: decision\nBlocked by: 01\n',
  )
  fs.writeFileSync(
    path.join(issues, '05-omitted.md'),
    '# Omitted Blockers\n\nType: decision\nStatus:\n',
  )
  fs.writeFileSync(
    path.join(issues, '06-empty.md'),
    '# Empty Blockers\n\nType: decision\nStatus:\nBlocked by:\n',
  )
  fs.writeFileSync(
    path.join(issues, '07-dangling.md'),
    '# Dangling Blocker\n\nType: decision\nStatus:\nBlocked by: 99\n',
  )

  const { decisions } = buildReadableTree(project)

  assert.deepEqual(decisions, [
    {
      title: 'Blocking Map',
      path: '.scratch/blockers/map.md',
      folder: 'blockers',
      spec: null,
      tickets: [
        {
          title: 'Resolved Groundwork',
          path: '.scratch/blockers/issues/01-resolved.md',
          type: 'research',
          status: 'resolved',
          blockers: [],
          depth: 0,
          frontier: false,
          resolved: true,
          claimed: false,
          cycle: false,
        },
        {
          title: 'Claimed Decision',
          path: '.scratch/blockers/issues/02-claimed.md',
          type: 'decision',
          status: 'claimed',
          blockers: [1],
          depth: 1,
          frontier: false,
          resolved: false,
          claimed: true,
          cycle: false,
        },
        {
          title: 'Deep Ticket',
          path: '.scratch/blockers/issues/03-deep.md',
          type: 'implementation',
          status: '',
          blockers: [1, 2],
          depth: 2,
          frontier: false,
          resolved: false,
          claimed: false,
          cycle: false,
        },
        {
          title: 'Ready After Resolved',
          path: '.scratch/blockers/issues/04-ready-after-resolved.md',
          type: 'decision',
          status: '',
          blockers: [1],
          depth: 1,
          frontier: true,
          resolved: false,
          claimed: false,
          cycle: false,
        },
        {
          title: 'Omitted Blockers',
          path: '.scratch/blockers/issues/05-omitted.md',
          type: 'decision',
          status: '',
          blockers: [],
          depth: 0,
          frontier: true,
          resolved: false,
          claimed: false,
          cycle: false,
        },
        {
          title: 'Empty Blockers',
          path: '.scratch/blockers/issues/06-empty.md',
          type: 'decision',
          status: '',
          blockers: [],
          depth: 0,
          frontier: true,
          resolved: false,
          claimed: false,
          cycle: false,
        },
        {
          title: 'Dangling Blocker',
          path: '.scratch/blockers/issues/07-dangling.md',
          type: 'decision',
          status: '',
          blockers: [99],
          depth: 1,
          frontier: false,
          resolved: false,
          claimed: false,
          cycle: false,
        },
      ],
      finished: false,
    },
  ])
})

test('decisions flags blocker cycles and emits every Ticket once', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'wayfinder-cycle-'))
  const effort = path.join(project, '.scratch', 'cycle')
  const issues = path.join(effort, 'issues')

  fs.mkdirSync(issues, { recursive: true })
  fs.writeFileSync(path.join(effort, 'map.md'), '# Cyclic Map')
  fs.writeFileSync(
    path.join(issues, '01-alpha.md'),
    '# Alpha\n\nType: decision\nStatus:\nBlocked by: 02\n',
  )
  fs.writeFileSync(
    path.join(issues, '02-beta.md'),
    '# Beta\n\nType: decision\nStatus:\nBlocked by: 1\n',
  )
  fs.writeFileSync(
    path.join(issues, '03-after-cycle.md'),
    '# After Cycle\n\nType: implementation\nStatus:\nBlocked by: 01\n',
  )

  const { decisions } = buildReadableTree(project)

  assert.deepEqual(decisions, [
    {
      title: 'Cyclic Map',
      path: '.scratch/cycle/map.md',
      folder: 'cycle',
      spec: null,
      tickets: [
        {
          title: 'Alpha',
          path: '.scratch/cycle/issues/01-alpha.md',
          type: 'decision',
          status: '',
          blockers: [2],
          depth: 0,
          frontier: false,
          resolved: false,
          claimed: false,
          cycle: true,
        },
        {
          title: 'Beta',
          path: '.scratch/cycle/issues/02-beta.md',
          type: 'decision',
          status: '',
          blockers: [1],
          depth: 0,
          frontier: false,
          resolved: false,
          claimed: false,
          cycle: true,
        },
        {
          title: 'After Cycle',
          path: '.scratch/cycle/issues/03-after-cycle.md',
          type: 'implementation',
          status: '',
          blockers: [1],
          depth: 1,
          frontier: false,
          resolved: false,
          claimed: false,
          cycle: false,
        },
      ],
      finished: false,
    },
  ])
})

test('decisions ignores an issues symlink outside the Project sandbox', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'wayfinder-decision-symlink-'))
  const effort = path.join(project, '.scratch', 'effort')
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'wayfinder-outside-issues-'))

  fs.mkdirSync(effort, { recursive: true })
  fs.writeFileSync(path.join(effort, 'map.md'), '# Safe Map')
  fs.writeFileSync(
    path.join(outside, '01-secret.md'),
    '# Secret\n\nType: decision\nStatus:\nBlocked by:\n',
  )
  fs.symlinkSync(outside, path.join(effort, 'issues'))

  const { decisions } = buildReadableTree(project)

  assert.deepEqual(decisions, [
    {
      title: 'Safe Map',
      path: '.scratch/effort/map.md',
      folder: 'effort',
      spec: null,
      tickets: [],
      finished: false,
    },
  ])
})
