import { test } from 'node:test'
import assert from 'node:assert/strict'
import find from './vendor/lodash-es/find.js'
import get from './vendor/lodash-es/get.js'
import includes from './vendor/lodash-es/includes.js'
import keyBy from './vendor/lodash-es/keyBy.js'
import map from './vendor/lodash-es/map.js'
import some from './vendor/lodash-es/some.js'
import {
  directoryHandleFromSnapshot,
  hostedLoadMode,
  isReadablePreviewPath,
  isSiteFromNames,
  parseTerms,
  readPreviewFile,
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
      dirHandle('finished-done', [
        fileHandle('map.md', '# Alias Map\n'),
        dirHandle('issues', [
          fileHandle('01-shipped.md', '# Shipped\n\nType: task\nStatus: Done\n'),
        ]),
      ]),
      dirHandle('not-complete', [
        fileHandle('map.md', '# Other Map\n'),
        dirHandle('issues', [
          fileHandle('01-complete.md', '# Complete\n\nType: task\nStatus: complete\n'),
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
  assert.equal(get(byFolder, ['finished-done', 'finished']), true)
  assert.equal(get(byFolder, ['finished-done', 'tickets', 0, 'resolved']), true)
  assert.equal(get(byFolder, ['finished-done', 'tickets', 0, 'take']), null)
  assert.equal(get(byFolder, ['not-complete', 'finished']), false)
  assert.equal(get(byFolder, ['not-complete', 'tickets', 0, 'resolved']), false)
})

test('Status done unblocks Frontier dependents', async () => {
  const root = dirHandle('project', [
    fileHandle('CONTEXT.md', '# Project\n'),
    dirHandle('.scratch', [
      dirHandle('alias', [
        fileHandle('map.md', '# Alias Map\n'),
        dirHandle('issues', [
          fileHandle('01-groundwork.md', '# Groundwork\n\nType: task\nStatus: Done\n'),
          fileHandle(
            '02-unblocked.md',
            '# Unblocked\n\nType: task\nStatus:\nBlocked by: 01\n',
          ),
        ]),
      ]),
    ]),
  ])

  const walked = await walkProject(root)
  const group = get(keyBy(walked.decisions, 'folder'), 'alias')
  assert.equal(get(group, ['tickets', 0, 'resolved']), true)
  assert.equal(get(group, ['tickets', 0, 'frontier']), false)
  assert.equal(get(group, ['tickets', 0, 'take']), null)
  assert.equal(get(group, ['tickets', 1, 'frontier']), true)
  assert.deepEqual(get(group, ['tickets', 1, 'take']), { commands: ['/wayfinder'] })
  assert.equal(get(group, 'finished'), false)
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

test('hosted Load is handle, snapshot, or unsupported from Safari and picker flags', () => {
  assert.equal(hostedLoadMode({ isSafari: true, hasDirectoryPicker: true }), 'unsupported')
  assert.equal(hostedLoadMode({ isSafari: true, hasDirectoryPicker: false }), 'unsupported')
  assert.equal(hostedLoadMode({ isSafari: false, hasDirectoryPicker: true }), 'handle')
  assert.equal(hostedLoadMode({ isSafari: false, hasDirectoryPicker: false }), 'snapshot')
})

test('snapshot of a Project root finds the Site, Effort Map, and folder name', async () => {
  const files = [
    { rel: 'wayfinder-reader/CONTEXT.md', content: '# Reader\n' },
    { rel: 'wayfinder-reader/.scratch/hosted-reader/map.md', content: '# Host the Reader\n' },
  ]
  const walked = await walkProject(directoryHandleFromSnapshot(files))
  assert.equal(walked.projectName, 'wayfinder-reader')
  assert.deepEqual(map(walked.sites, 'rel'), ['.'])
  assert.deepEqual(map(walked.decisions, 'title'), ['Host the Reader'])
  assert.deepEqual(map(walked.decisions, 'path'), ['.scratch/hosted-reader/map.md'])
})

test('snapshot omits skipped trees and does not read their bytes', async () => {
  const reads = []
  const files = [
    { rel: 'wayfinder-reader/CONTEXT.md', get content() { reads.push('CONTEXT.md'); return '# Reader\n' } },
    {
      rel: 'wayfinder-reader/.scratch/hosted-reader/map.md',
      get content() { reads.push('map.md'); return '# Host the Reader\n' },
    },
    {
      rel: 'wayfinder-reader/node_modules/secret.md',
      get content() { reads.push('secret.md'); return '# leaked\n' },
    },
    {
      rel: 'wayfinder-reader/.git/HEAD',
      get content() { reads.push('HEAD'); return 'ref' },
    },
    {
      rel: 'wayfinder-reader/.hidden/.env',
      get content() { reads.push('.env'); return 'SECRET=1' },
    },
  ]
  const handle = directoryHandleFromSnapshot(files)
  const names = []
  for await (const child of handle.values()) names.push(child.name)
  assert.equal(some(names, (name) => name === 'node_modules' || name === '.git' || name === '.hidden'), false)
  assert.equal(some(reads, (name) => name === 'secret.md' || name === 'HEAD' || name === '.env'), false)

  const walked = await walkProject(handle)
  assert.deepEqual(map(walked.decisions, 'title'), ['Host the Reader'])
  assert.equal(some(reads, (name) => name === 'secret.md' || name === 'HEAD' || name === '.env'), false)
})

test('snapshot keeps named-hole Out-of-scope records and omits other hidden dirs', async () => {
  const files = [
    { rel: 'wayfinder-reader/CONTEXT.md', content: '# Reader\n' },
    { rel: 'wayfinder-reader/.out-of-scope/rejected.md', content: '# Rejected\n' },
    { rel: 'wayfinder-reader/.config/.env', content: 'SECRET=1' },
  ]
  const walked = await walkProject(directoryHandleFromSnapshot(files))
  assert.deepEqual(map(walked.outOfScope, 'title'), ['Rejected'])
  assert.deepEqual(map(walked.outOfScope, 'path'), ['.out-of-scope/rejected.md'])
  assert.equal(
    some(walked.language, (row) => includes(get(row, 'path', ''), '.env')),
    false,
  )
})

test('snapshot walk matches handle walk of the same Project tree', async () => {
  const root = dirHandle('wayfinder-reader', [
    fileHandle('CONTEXT.md', '# Reader\n\n## Language\n\n**Site**:\nA directory.\n'),
    dirHandle('docs', [
      dirHandle('adr', [fileHandle('0018.md', '# Directory snapshot\n')]),
    ]),
    dirHandle('.out-of-scope', [fileHandle('rejected.md', '# Rejected\n')]),
    dirHandle('.scratch', [
      dirHandle('hosted-reader', [fileHandle('map.md', '# Host the Reader\n')]),
    ]),
    dirHandle('node_modules', [fileHandle('secret.md', '# leaked\n')]),
    dirHandle('.hidden', [fileHandle('.env', 'SECRET=1')]),
  ])
  const files = [
    { rel: 'wayfinder-reader/CONTEXT.md', content: '# Reader\n\n## Language\n\n**Site**:\nA directory.\n' },
    { rel: 'wayfinder-reader/docs/adr/0018.md', content: '# Directory snapshot\n' },
    { rel: 'wayfinder-reader/.out-of-scope/rejected.md', content: '# Rejected\n' },
    { rel: 'wayfinder-reader/.scratch/hosted-reader/map.md', content: '# Host the Reader\n' },
    { rel: 'wayfinder-reader/node_modules/secret.md', content: '# leaked\n' },
    { rel: 'wayfinder-reader/.hidden/.env', content: 'SECRET=1' },
  ]
  const fromHandle = await walkProject(root)
  const fromSnapshot = await walkProject(directoryHandleFromSnapshot(files))
  assert.deepEqual(fromSnapshot, fromHandle)
})

test('preview-read after snapshot adapt returns the file text', async () => {
  const handle = directoryHandleFromSnapshot([
    { rel: 'wayfinder-reader/CONTEXT.md', content: '# Reader\n' },
    { rel: 'wayfinder-reader/.scratch/hosted-reader/map.md', content: '# Host the Reader\n' },
  ])
  const preview = await readPreviewFile(handle, 'CONTEXT.md', ['CONTEXT.md'])
  assert.equal(preview.content, '# Reader\n')
  assert.equal(preview.contentType, 'text/markdown')
  assert.equal(preview.noPreview, false)
})
