import { test } from 'node:test'
import assert from 'node:assert/strict'
import find from './vendor/lodash-es/find.js'
import get from './vendor/lodash-es/get.js'
import keyBy from './vendor/lodash-es/keyBy.js'
import map from './vendor/lodash-es/map.js'
import some from './vendor/lodash-es/some.js'
import {
  isReadablePreviewPath,
  isSiteFromNames,
  parseTerms,
  shouldSkipDir,
  walkProject,
} from './walk.js'

function fileHandle(name, content, onRead) {
  return {
    kind: 'file',
    name,
    async getFile() {
      if (onRead) onRead(name)
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

function dirHandle(name, children) {
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

test('skip-by-name hides node_modules, .git, and hidden dirs except .scratch', () => {
  assert.equal(shouldSkipDir('node_modules'), true)
  assert.equal(shouldSkipDir('.git'), true)
  assert.equal(shouldSkipDir('.archive'), true)
  assert.equal(shouldSkipDir('.out-of-scope'), true)
  assert.equal(shouldSkipDir('.scratch'), false)
  assert.equal(shouldSkipDir('docs'), false)
})

test('Effort CONTEXT.md is not a Site; markers make a Site', () => {
  assert.equal(isSiteFromNames(['CONTEXT.md', '.scratch']), true)
  assert.equal(isSiteFromNames(['CONTEXT.md']), true)
  assert.equal(isSiteFromNames(['.scratch']), true)
  assert.equal(isSiteFromNames(['CONTEXT.md', 'map.md', 'issues']), false)
})

test('walk skips skipped trees without reading their files', async () => {
  const reads = []
  const root = dirHandle('wayfinder-reader', [
    fileHandle('CONTEXT.md', '# Reader\n', (name) => reads.push(name)),
    dirHandle('.scratch', [
      dirHandle('hosted-reader', [
        fileHandle('map.md', '# Host the Reader\n', (name) => reads.push(name)),
      ]),
    ]),
    dirHandle('node_modules', [
      fileHandle('secret.md', '# leaked\n', (name) => reads.push(name)),
    ]),
    dirHandle('.git', [fileHandle('HEAD', 'ref', (name) => reads.push(name))]),
    dirHandle('.hidden', [fileHandle('nope.md', '# no\n', (name) => reads.push(name))]),
  ])

  const walked = await walkProject(root)
  assert.equal(some(reads, (name) => name === 'secret.md' || name === 'HEAD' || name === 'nope.md'), false)
  assert.deepEqual(map(walked.decisions, 'title'), ['Host the Reader'])
})

test('named-hole .out-of-scope and docs/adr appear; .archive does not', async () => {
  const root = dirHandle('wayfinder-reader', [
    fileHandle('CONTEXT.md', '# Reader\n'),
    dirHandle('docs', [
      dirHandle('adr', [fileHandle('0012-file-system-access-load.md', '# File System Access Load\n')]),
    ]),
    dirHandle('.out-of-scope', [fileHandle('safari.md', '# Safari is out\n')]),
    dirHandle('.scratch', [
      dirHandle('.archive', [
        dirHandle('old', [fileHandle('map.md', '# Archived Map\n')]),
      ]),
      dirHandle('live', [fileHandle('map.md', '# Live Map\n')]),
    ]),
  ])

  const walked = await walkProject(root)
  assert.deepEqual(map(walked.adrs, 'title'), ['File System Access Load'])
  assert.deepEqual(map(walked.outOfScope, 'title'), ['Safari is out'])
  assert.deepEqual(map(walked.decisions, 'title'), ['Live Map'])
  assert.equal(
    some(walked.decisions, (group) => get(group, 'title') === 'Archived Map'),
    false,
  )
})

test('Map list uses titles, take commands, and Finished from Ticket status', async () => {
  const root = dirHandle('project', [
    fileHandle('CONTEXT.md', '# Project\n'),
    dirHandle('.scratch', [
      dirHandle('active-effort', [
        fileHandle('map.md', '# Active Map\n'),
        fileHandle('spec.md', '# Active Spec\n'),
        dirHandle('issues', [
          fileHandle(
            '01-first-ticket.md',
            '# First Ticket\n\nType: task\nStatus:\nBlocked by:\n',
          ),
        ]),
      ]),
      dirHandle('spec-only', [fileHandle('spec.md', '# Standalone Spec\n')]),
      dirHandle('finished', [
        fileHandle('map.md', '# Done Map\n'),
        dirHandle('issues', [
          fileHandle('01-done.md', '# Done Ticket\n\nType: task\nStatus: resolved\n'),
        ]),
      ]),
    ]),
  ])

  const walked = await walkProject(root)
  const byFolder = keyBy(walked.decisions, 'folder')
  assert.equal(get(byFolder, ['active-effort', 'title']), 'Active Map')
  assert.deepEqual(get(byFolder, ['active-effort', 'tickets', 0, 'take']), {
    commands: ['/wayfinder'],
  })
  assert.equal(get(byFolder, ['active-effort', 'finished']), false)
  assert.deepEqual(get(byFolder, ['spec-only', 'spec', 'take']), {
    commands: ['/to-tickets'],
  })
  assert.equal(get(byFolder, ['finished', 'finished']), true)
})

test('CONTEXT-MAP titles and orders nested Sites; unlisted Site still appears', async () => {
  const root = dirHandle('monorepo', [
    fileHandle(
      'CONTEXT-MAP.md',
      '# Context Map\n\n- [Mobile](./apps/mobile/CONTEXT.md)\n',
    ),
    fileHandle('CONTEXT.md', '# Root leftover\n'),
    dirHandle('apps', [
      dirHandle('mobile', [fileHandle('CONTEXT.md', '# Mobile heading\n')]),
      dirHandle('web', [
        fileHandle('CONTEXT.md', '# Web\n'),
        dirHandle('.scratch', [dirHandle('nav', [fileHandle('map.md', '# Nav Map\n')])]),
      ]),
    ]),
  ])

  const walked = await walkProject(root)
  assert.deepEqual(map(walked.language, 'title'), [
    'Context Map',
    'Mobile',
    'Root leftover',
    'Web',
  ])
  assert.deepEqual(map(walked.language, 'path'), [
    'CONTEXT-MAP.md',
    'apps/mobile/CONTEXT.md',
    'CONTEXT.md',
    'apps/web/CONTEXT.md',
  ])
  const nav = find(walked.decisions, (group) => get(group, 'folder') === 'nav')
  assert.equal(get(nav, 'siteTitle'), 'Web')
  assert.equal(get(nav, 'path'), 'apps/web/.scratch/nav/map.md')
})

test('terms carry the owning Site rel', async () => {
  const root = dirHandle('repo', [
    fileHandle('CONTEXT.md', '# Root\n\n## Language\n\n**Site**:\nA directory.\n'),
    dirHandle('apps', [
      dirHandle('billing', [
        fileHandle('CONTEXT.md', '# Billing\n\n## Language\n\n**Invoice**:\nA bill.\n'),
      ]),
    ]),
  ])
  const walked = await walkProject(root)
  assert.deepEqual(
    map(walked.terms, (row) => ({ term: get(row, 'term'), rel: get(row, 'rel') })),
    [
      { term: 'Site', rel: '.' },
      { term: 'Invoice', rel: 'apps/billing' },
    ],
  )
})

test('terms parse from Glossary; preview paths stay in the Readable tree', () => {
  const terms = parseTerms(
    [
      '# Sealbox',
      '',
      '## Glossary',
      '',
      '- **Customer** — a solo person who pays.',
      '  _Avoid_: consumer',
      '',
      '## Product locks',
      '',
      '**Buyer**:',
      'not a Term',
      '',
    ].join('\n'),
    'Sealbox',
  )
  assert.deepEqual(terms, [
    {
      term: 'Customer',
      definition: 'a solo person who pays.',
      avoid: 'consumer',
      aliases: ['consumer'],
      contextName: 'Sealbox',
    },
  ])

  assert.equal(isReadablePreviewPath('.scratch/foo/map.md'), true)
  assert.equal(isReadablePreviewPath('docs/adr/0001.md'), true)
  assert.equal(isReadablePreviewPath('.out-of-scope/no.md'), true)
  assert.equal(isReadablePreviewPath('apps/web/.scratch/nav/map.md'), true)
  assert.equal(isReadablePreviewPath('CONTEXT.md', ['CONTEXT.md']), true)
  assert.equal(isReadablePreviewPath('package.json'), false)
  assert.equal(isReadablePreviewPath('.scratch/../package.json'), false)
  assert.equal(isReadablePreviewPath('.scratch/.archive/old/map.md'), false)
  assert.equal(isReadablePreviewPath('node_modules/x.md'), false)
})
