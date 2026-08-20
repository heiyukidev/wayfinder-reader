import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import map from 'lodash/map.js'
import get from 'lodash/get.js'
import find from 'lodash/find.js'
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
      spec: {
        title: 'Active Spec',
        path: '.scratch/active-effort/spec.md',
        take: null,
      },
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
          take: { commands: ['/implement'] },
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
      spec: {
        title: 'Standalone Spec',
        path: '.scratch/spec-only/spec.md',
        take: { commands: ['/to-tickets'] },
      },
      tickets: [],
      finished: false,
    },
  ])
  assert.equal(
    some(get(tree, 'children', []), (child) => child.name === 'spec-only'),
    true,
  )
  assert.deepEqual(get(buildReadableTree(project), 'specOnly'), [
    {
      title: 'Standalone Spec',
      path: '.scratch/spec-only/spec.md',
      folder: 'spec-only',
    },
  ])
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
          take: null,
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
          take: null,
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
          take: null,
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
          take: { commands: ['/implement'] },
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
          take: { commands: ['/implement'] },
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
          take: { commands: ['/implement'] },
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
          take: null,
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
          take: null,
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
          take: null,
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
          take: null,
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

test('Frontier wayfinder Types put ordered skill commands on take', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'wayfinder-take-types-'))
  const effort = path.join(project, '.scratch', 'typed')
  const issues = path.join(effort, 'issues')

  fs.mkdirSync(issues, { recursive: true })
  fs.writeFileSync(path.join(effort, 'map.md'), '# Typed Map')
  fs.writeFileSync(
    path.join(issues, '01-research.md'),
    '# Research Ticket\n\nType: research\nStatus:\nBlocked by:\n',
  )
  fs.writeFileSync(
    path.join(issues, '02-prototype.md'),
    '# Prototype Ticket\n\nType: prototype\nStatus:\nBlocked by:\n',
  )
  fs.writeFileSync(
    path.join(issues, '03-grilling.md'),
    '# Grilling Ticket\n\nType: grilling\nStatus:\nBlocked by:\n',
  )
  fs.writeFileSync(
    path.join(issues, '04-task.md'),
    '# Task Ticket\n\nType: task\nStatus:\nBlocked by:\n',
  )

  const { decisions } = buildReadableTree(project)
  const tickets = get(decisions, [0, 'tickets'], [])

  assert.deepEqual(get(tickets, [0, 'take']), { commands: ['/wayfinder', '/research'] })
  assert.deepEqual(get(tickets, [1, 'take']), { commands: ['/wayfinder', '/prototype'] })
  assert.deepEqual(get(tickets, [2, 'take']), { commands: ['/wayfinder', '/grill-with-docs'] })
  assert.deepEqual(get(tickets, [3, 'take']), { commands: ['/wayfinder'] })
})

test('Type matching for take commands is case-insensitive', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'wayfinder-take-case-'))
  const effort = path.join(project, '.scratch', 'cased')
  const issues = path.join(effort, 'issues')

  fs.mkdirSync(issues, { recursive: true })
  fs.writeFileSync(path.join(effort, 'map.md'), '# Cased Map')
  fs.writeFileSync(
    path.join(issues, '01-research.md'),
    '# Research Ticket\n\nType: Research\nStatus:\nBlocked by:\n',
  )

  const { decisions } = buildReadableTree(project)
  assert.deepEqual(get(decisions, [0, 'tickets', 0, 'take']), {
    commands: ['/wayfinder', '/research'],
  })
})

test('Frontier empty Type, decision, and implementation Tickets take /implement', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'wayfinder-take-implement-'))
  const effort = path.join(project, '.scratch', 'build')
  const issues = path.join(effort, 'issues')

  fs.mkdirSync(issues, { recursive: true })
  fs.writeFileSync(path.join(effort, 'map.md'), '# Build Map')
  fs.writeFileSync(path.join(issues, '01-empty.md'), '# Empty Type\n\nStatus:\nBlocked by:\n')
  fs.writeFileSync(
    path.join(issues, '02-decision.md'),
    '# Decision Ticket\n\nType: decision\nStatus:\nBlocked by:\n',
  )
  fs.writeFileSync(
    path.join(issues, '03-implementation.md'),
    '# Implementation Ticket\n\nType: implementation\nStatus:\nBlocked by:\n',
  )
  fs.writeFileSync(
    path.join(issues, '04-ready.md'),
    '# Ready Only\n\nStatus: ready-for-agent\n',
  )
  fs.writeFileSync(
    path.join(issues, '05-unknown.md'),
    '# Unknown Type\n\nType: mystery\nStatus:\nBlocked by:\n',
  )

  const { decisions } = buildReadableTree(project)
  const tickets = get(decisions, [0, 'tickets'], [])
  const implement = { commands: ['/implement'] }

  assert.deepEqual(get(tickets, [0, 'take']), implement)
  assert.deepEqual(get(tickets, [1, 'take']), implement)
  assert.deepEqual(get(tickets, [2, 'take']), implement)
  assert.deepEqual(get(tickets, [3, 'take']), implement)
  assert.deepEqual(get(tickets, [4, 'take']), implement)
})

test('Spec-only Effort Spec take commands are /to-tickets', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'wayfinder-spec-take-'))
  const specOnly = path.join(project, '.scratch', 'spec-only')
  fs.mkdirSync(specOnly, { recursive: true })
  fs.writeFileSync(path.join(specOnly, 'spec.md'), '# Remaining Spec\n\nStatus: ready-for-agent\n')

  const { decisions } = buildReadableTree(project)
  assert.deepEqual(get(decisions, [0, 'spec', 'take', 'commands']), ['/to-tickets'])
})

test('Spec with sibling Tickets including claimed-only is not takeable', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'wayfinder-spec-claimed-'))
  const claimedOnly = path.join(project, '.scratch', 'claimed-slice')
  const claimedIssues = path.join(claimedOnly, 'issues')
  const frontier = path.join(project, '.scratch', 'active-slice')
  const frontierIssues = path.join(frontier, 'issues')

  fs.mkdirSync(claimedIssues, { recursive: true })
  fs.mkdirSync(frontierIssues, { recursive: true })
  fs.writeFileSync(path.join(claimedOnly, 'spec.md'), '# Claimed Sibling Spec\n')
  fs.writeFileSync(
    path.join(claimedIssues, '01-held.md'),
    '# Held Ticket\n\nType: task\nStatus: claimed\n',
  )
  fs.writeFileSync(path.join(frontier, 'map.md'), '# Active Slice\n')
  fs.writeFileSync(path.join(frontier, 'spec.md'), '# Active Slice Spec\n')
  fs.writeFileSync(
    path.join(frontierIssues, '01-open.md'),
    '# Open Ticket\n\nType: task\nStatus:\nBlocked by:\n',
  )

  const { decisions } = buildReadableTree(project)
  const claimedGroup = find(decisions, (group) => get(group, 'folder') === 'claimed-slice')
  const frontierGroup = find(decisions, (group) => get(group, 'folder') === 'active-slice')

  assert.equal(get(claimedGroup, 'spec.take'), null)
  assert.equal(get(frontierGroup, 'spec.take'), null)
  assert.deepEqual(get(frontierGroup, ['tickets', 0, 'take']), { commands: ['/wayfinder'] })
})

test('root CONTEXT.md is a language row with Glossary Terms; no map file required', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'wayfinder-language-root-'))
  fs.writeFileSync(
    path.join(project, 'CONTEXT.md'),
    [
      '# Sealbox',
      '',
      'Intro with **bold** that is not a Term.',
      '',
      '## Glossary',
      '',
      '- **Customer** — a solo person who pays for an offsite copy.',
      '  _Avoid_: consumer, team',
      '- **Source** — Google Drive or Dropbox.',
      '',
      '## Product locks',
      '',
      '**Buyer**:',
      'This heading must not parse as a Term.',
      '',
    ].join('\n'),
  )

  const { language, terms, specOnly, decisions } = buildReadableTree(project)

  assert.deepEqual(language, [
    { title: 'Sealbox', path: 'CONTEXT.md', contextName: 'Sealbox' },
  ])
  assert.deepEqual(terms, [
    {
      term: 'Customer',
      definition: 'a solo person who pays for an offsite copy.',
      avoid: 'consumer, team',
      aliases: ['consumer', 'team'],
      contextName: 'Sealbox',
    },
    {
      term: 'Source',
      definition: 'Google Drive or Dropbox.',
      avoid: '',
      aliases: [],
      contextName: 'Sealbox',
    },
  ])
  assert.deepEqual(specOnly, [])
  assert.deepEqual(decisions, [])
})

test('CONTEXT-MAP.md lists the map and mapped CONTEXT files; illegal paths are omitted', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'wayfinder-language-map-'))
  const mobileDir = path.join(project, 'apps', 'mobile')
  const frontDir = path.join(project, 'apps', 'front')
  fs.mkdirSync(mobileDir, { recursive: true })
  fs.mkdirSync(frontDir, { recursive: true })
  fs.writeFileSync(
    path.join(project, 'CONTEXT-MAP.md'),
    [
      '# Context Map',
      '',
      '- [Mobile](./apps/mobile/CONTEXT.md)',
      '- [Notes](./apps/notes.md)',
      '- [Escape](../outside/CONTEXT.md)',
      '- [Missing](./apps/desktop/CONTEXT.md)',
      '',
      '| Context | Path |',
      '| --- | --- |',
      '| Frontend | `apps/front/CONTEXT.md` |',
      '| Desktop | `apps/desktop/CONTEXT.md` |',
      '',
    ].join('\n'),
  )
  fs.writeFileSync(
    path.join(mobileDir, 'CONTEXT.md'),
    [
      '# Mobile',
      '',
      '## Language',
      '',
      '**Assistant**:',
      'Multi-turn conversational AI.',
      '_Avoid_: Search',
      '',
    ].join('\n'),
  )
  fs.writeFileSync(
    path.join(frontDir, 'CONTEXT.md'),
    [
      '# Frontend',
      '',
      '## Language',
      '',
      '**Assistant**:',
      'Web conversational AI.',
      '',
    ].join('\n'),
  )
  fs.writeFileSync(path.join(project, 'CONTEXT.md'), '# Root leftover\n')

  const { language, terms } = buildReadableTree(project)

  assert.deepEqual(language, [
    { title: 'Context Map', path: 'CONTEXT-MAP.md', contextName: 'Context Map' },
    { title: 'Mobile', path: 'apps/mobile/CONTEXT.md', contextName: 'Mobile' },
    { title: 'Frontend', path: 'apps/front/CONTEXT.md', contextName: 'Frontend' },
    { title: 'Root leftover', path: 'CONTEXT.md', contextName: 'Root leftover' },
  ])
  assert.deepEqual(terms, [
    {
      term: 'Assistant',
      definition: 'Multi-turn conversational AI.',
      avoid: 'Search',
      aliases: ['Search'],
      contextName: 'Mobile',
    },
    {
      term: 'Assistant',
      definition: 'Web conversational AI.',
      avoid: '',
      aliases: [],
      contextName: 'Frontend',
    },
  ])
})

test('language omits a mapped CONTEXT.md symlink that leaves the Project', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'wayfinder-language-symlink-'))
  const apps = path.join(project, 'apps')
  fs.mkdirSync(apps)
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'wayfinder-outside-context-'))
  fs.writeFileSync(path.join(outside, 'CONTEXT.md'), '# Leaked\n\n## Language\n\n**Secret**:\nnope\n')
  fs.symlinkSync(path.join(outside, 'CONTEXT.md'), path.join(apps, 'CONTEXT.md'))
  fs.writeFileSync(
    path.join(project, 'CONTEXT-MAP.md'),
    '# Map\n\n- [Leaked](./apps/CONTEXT.md)\n',
  )

  const { language, terms } = buildReadableTree(project)
  assert.deepEqual(language, [
    { title: 'Map', path: 'CONTEXT-MAP.md', contextName: 'Map' },
  ])
  assert.deepEqual(terms, [])
})

test('no language files yields empty language and terms', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'wayfinder-no-language-'))
  fs.mkdirSync(path.join(project, '.scratch'))
  const { language, terms, specOnly } = buildReadableTree(project)
  assert.deepEqual(language, [])
  assert.deepEqual(terms, [])
  assert.deepEqual(specOnly, [])
})
