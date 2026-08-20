import { test } from 'node:test'
import assert from 'node:assert/strict'
import get from './vendor/lodash-es/get.js'
import find from './vendor/lodash-es/find.js'
import map from './vendor/lodash-es/map.js'
import size from './vendor/lodash-es/size.js'
import some from './vendor/lodash-es/some.js'
import { matchTermHints, overlayTermsForPreview } from './term-hints.js'

function terms(...names) {
  return map(names, (name) => ({
    term: name,
    definition: `${name} def`,
    aliases: [],
    contextName: 'Test',
  }))
}

function spans(matches) {
  return map(matches, (row) => ({
    text: get(row, 'text'),
    index: get(row, 'index'),
    phrase: get(row, 'phrase'),
    kind: get(row, 'model.kind'),
  }))
}

test('a longer glossary phrase wins over a shorter prefix when extra spaces sit between the words', () => {
  const matches = matchTermHints(
    'Join the affiliate  program today.',
    terms('Affiliate', 'Affiliate program'),
  )
  assert.deepEqual(spans(matches), [
    { text: 'affiliate  program', index: 9, phrase: 'affiliate program', kind: 'definition' },
  ])
})

test('a longer glossary phrase wins when a tab sits between the words', () => {
  const matches = matchTermHints(
    'Join the affiliate\tprogram today.',
    terms('Affiliate', 'Affiliate program'),
  )
  assert.deepEqual(spans(matches), [
    { text: 'affiliate\tprogram', index: 9, phrase: 'affiliate program', kind: 'definition' },
  ])
})

test('a longer glossary phrase wins when a newline sits between the words', () => {
  const matches = matchTermHints(
    'Join the affiliate\nprogram today.',
    terms('Affiliate', 'Affiliate program'),
  )
  assert.deepEqual(spans(matches), [
    { text: 'affiliate\nprogram', index: 9, phrase: 'affiliate program', kind: 'definition' },
  ])
})

test('a longer glossary phrase wins over a shorter inner word', () => {
  const matches = matchTermHints(
    'Join the affiliate program today.',
    terms('Program', 'Affiliate program'),
  )
  assert.deepEqual(spans(matches), [
    { text: 'affiliate program', index: 9, phrase: 'affiliate program', kind: 'definition' },
  ])
})

test('a shorter Term still matches where it stands alone', () => {
  const matches = matchTermHints(
    'Join as an affiliate today.',
    terms('Affiliate', 'Affiliate program'),
  )
  assert.deepEqual(spans(matches), [
    { text: 'affiliate', index: 11, phrase: 'affiliate', kind: 'definition' },
  ])
})

test('a shorter Term after a longer match still matches outside the claimed span', () => {
  const matches = matchTermHints(
    'join the affiliate program as an affiliate',
    terms('Affiliate', 'Affiliate program'),
  )
  assert.deepEqual(spans(matches), [
    { text: 'affiliate program', index: 9, phrase: 'affiliate program', kind: 'definition' },
    { text: 'affiliate', index: 33, phrase: 'affiliate', kind: 'definition' },
  ])
})

test('adjacent short Terms that are not a glossary phrase stay two matches', () => {
  const matches = matchTermHints(
    'Join the affiliate program today.',
    terms('Affiliate', 'Program'),
  )
  assert.deepEqual(spans(matches), [
    { text: 'affiliate', index: 9, phrase: 'affiliate', kind: 'definition' },
    { text: 'program', index: 19, phrase: 'program', kind: 'definition' },
  ])
})

test('whole-word matching does not hint inside a longer token', () => {
  const matches = matchTermHints('affiliates and affiliation', terms('Affiliate'))
  assert.deepEqual(spans(matches), [])
})

test('matching is case-insensitive', () => {
  const matches = matchTermHints(
    'Join the Affiliate Program today.',
    terms('Affiliate program'),
  )
  assert.deepEqual(spans(matches), [
    { text: 'Affiliate Program', index: 9, phrase: 'affiliate program', kind: 'definition' },
  ])
})

test('leftmost longest wins when phrases overlap without nesting', () => {
  const matches = matchTermHints('New York City', terms('New York', 'York City'))
  assert.deepEqual(spans(matches), [
    { text: 'New York', index: 0, phrase: 'new york', kind: 'definition' },
  ])
})

test('empty Terms yield no matches', () => {
  assert.deepEqual(matchTermHints('Join the affiliate program today.', []), [])
})

test('a longer alias claims the span over a shorter Term inside it', () => {
  const matches = matchTermHints('Join the affiliate program today.', [
    { term: 'Affiliate', definition: 'short', aliases: [], contextName: 'Test' },
    { term: 'Partner', definition: 'long', aliases: ['affiliate program'], contextName: 'Test' },
  ])
  assert.deepEqual(spans(matches), [
    { text: 'affiliate program', index: 9, phrase: 'affiliate program', kind: 'prefer' },
  ])
  assert.deepEqual(get(matches, [0, 'model', 'terms']), ['Partner'])
})

test('a longer Term claims the span over a shorter alias inside it', () => {
  const matches = matchTermHints('Join the affiliate program today.', [
    { term: 'Affiliate program', definition: 'long', aliases: [], contextName: 'Test' },
    { term: 'Partner', definition: 'other', aliases: ['affiliate'], contextName: 'Test' },
  ])
  assert.deepEqual(spans(matches), [
    { text: 'affiliate program', index: 9, phrase: 'affiliate program', kind: 'definition' },
  ])
  assert.equal(get(matches, [0, 'model', 'term']), 'Affiliate program')
})

test('punctuation after a longer phrase leaves the match intact', () => {
  const matches = matchTermHints(
    'Join the affiliate program.',
    terms('Affiliate', 'Affiliate program'),
  )
  assert.deepEqual(spans(matches), [
    { text: 'affiliate program', index: 9, phrase: 'affiliate program', kind: 'definition' },
  ])
})

test('a hyphenated form that is not the glossary spelling misses the longer phrase', () => {
  const matches = matchTermHints(
    'Join the affiliate-program today.',
    terms('Affiliate program'),
  )
  assert.deepEqual(spans(matches), [])
})

function overlayRecord(term, rel, extra = {}) {
  return {
    term,
    definition: `${term} def`,
    aliases: [],
    contextName: rel === '.' ? 'Reader' : term,
    rel,
    ...extra,
  }
}

function overlayFuel(result) {
  return {
    owningRel: get(result, 'owningRel'),
    terms: map(get(result, 'terms'), (row) => ({
      term: get(row, 'term'),
      rel: get(row, 'rel'),
      contextName: get(row, 'contextName'),
      aliases: get(row, 'aliases'),
    })),
  }
}

const THREE_SITES = [
  { rel: '.', title: 'Reader' },
  { rel: 'apps/billing', title: 'Billing' },
  { rel: 'apps/shipping', title: 'Shipping' },
]

test('a billing ADR overlay excludes a sibling Site', () => {
  const records = [
    overlayRecord('Invoice', 'apps/billing', { contextName: 'Billing' }),
    overlayRecord('Site', '.', { contextName: 'Reader' }),
    overlayRecord('Shipping rate', 'apps/shipping', { contextName: 'Shipping' }),
  ]
  assert.deepEqual(
    overlayFuel(overlayTermsForPreview(records, THREE_SITES, 'apps/billing/docs/adr/0001.md')),
    {
      owningRel: 'apps/billing',
      terms: [
        { term: 'Invoice', rel: 'apps/billing', contextName: 'Billing', aliases: [] },
        { term: 'Site', rel: '.', contextName: 'Reader', aliases: [] },
      ],
    },
  )
})

test('previewing a nested CONTEXT.md still inherits root and excludes cousins', () => {
  const records = [
    overlayRecord('Invoice', 'apps/billing', { contextName: 'Billing' }),
    overlayRecord('Site', '.', { contextName: 'Reader' }),
    overlayRecord('Shipping rate', 'apps/shipping', { contextName: 'Shipping' }),
  ]
  const result = overlayTermsForPreview(records, THREE_SITES, 'apps/billing/CONTEXT.md')
  assert.equal(get(result, 'owningRel'), 'apps/billing')
  assert.deepEqual(map(get(result, 'terms'), 'rel'), ['apps/billing', '.'])
})

test('a root preview does not inherit child language', () => {
  const records = [
    overlayRecord('Invoice', 'apps/billing', { contextName: 'Billing' }),
    overlayRecord('Site', '.', { contextName: 'Reader' }),
  ]
  const result = overlayTermsForPreview(records, THREE_SITES, 'docs/adr/0001.md')
  assert.equal(get(result, 'owningRel'), '.')
  assert.deepEqual(map(get(result, 'terms'), 'term'), ['Site'])
})

test('a mid-tree Site is an ancestor of a deeper Site', () => {
  const sites = [
    { rel: '.', title: 'Root' },
    { rel: 'apps', title: 'Apps' },
    { rel: 'apps/billing', title: 'Billing' },
  ]
  const records = [
    overlayRecord('RootTerm', '.'),
    overlayRecord('AppsTerm', 'apps', { contextName: 'Apps' }),
    overlayRecord('Invoice', 'apps/billing', { contextName: 'Billing' }),
  ]
  const result = overlayTermsForPreview(records, sites, 'apps/billing/docs/adr/0001.md')
  assert.equal(get(result, 'owningRel'), 'apps/billing')
  assert.deepEqual(map(get(result, 'terms'), 'rel'), ['apps/billing', 'apps', '.'])
})

test('Site containment is directory membership, not a string prefix', () => {
  const sites = [
    { rel: '.', title: 'Root' },
    { rel: 'apps/billing', title: 'Billing' },
    { rel: 'apps/billing-extra', title: 'Extra' },
  ]
  const records = [
    overlayRecord('Invoice', 'apps/billing', { contextName: 'Billing' }),
    overlayRecord('Extra', 'apps/billing-extra', { contextName: 'Extra' }),
    overlayRecord('Site', '.', { contextName: 'Reader' }),
  ]
  const result = overlayTermsForPreview(records, sites, 'apps/billing-extra/CONTEXT.md')
  assert.equal(get(result, 'owningRel'), 'apps/billing-extra')
  assert.deepEqual(map(get(result, 'terms'), 'term'), ['Extra', 'Site'])
})

test('a tracker-only Site still owns the preview and inherits ancestors', () => {
  const records = [
    overlayRecord('Site', '.', { contextName: 'Reader' }),
    overlayRecord('Shipping rate', 'apps/shipping', { contextName: 'Shipping' }),
  ]
  const result = overlayTermsForPreview(records, THREE_SITES, 'apps/billing/.scratch/foo/map.md')
  assert.equal(get(result, 'owningRel'), 'apps/billing')
  assert.deepEqual(map(get(result, 'terms'), 'term'), ['Site'])
})

test('same-Site collisions still list both records', () => {
  const records = [
    overlayRecord('Map', '.', { contextName: 'Reader' }),
    overlayRecord('Map', '.', { contextName: 'Context map' }),
  ]
  const result = overlayTermsForPreview(records, THREE_SITES, 'CONTEXT.md')
  assert.equal(size(get(result, 'terms')), 2)
  assert.deepEqual(map(get(result, 'terms'), 'contextName'), ['Reader', 'Context map'])
})

test('two Sites that share a title stay distinct by rel', () => {
  const sites = [
    { rel: 'apps/one', title: 'Billing' },
    { rel: 'apps/two', title: 'Billing' },
  ]
  const records = [
    overlayRecord('Invoice', 'apps/one', { contextName: 'Billing' }),
    overlayRecord('Invoice', 'apps/two', { contextName: 'Billing' }),
  ]
  const result = overlayTermsForPreview(records, sites, 'apps/one/CONTEXT.md')
  assert.equal(get(result, 'owningRel'), 'apps/one')
  assert.deepEqual(map(get(result, 'terms'), 'rel'), ['apps/one'])
})

test('a silent child falls through to the parent for that phrase', () => {
  const records = [
    overlayRecord('Site', '.', { contextName: 'Reader' }),
    overlayRecord('Invoice', 'apps/billing', { contextName: 'Billing' }),
  ]
  const result = overlayTermsForPreview(records, THREE_SITES, 'apps/billing/docs/adr/0001.md')
  assert.ok(some(get(result, 'terms'), (row) => get(row, 'term') === 'Site' && get(row, 'rel') === '.'))
})

test('a child alias shadows a parent Term for that same phrase', () => {
  const records = [
    overlayRecord('Term hint', '.', {
      contextName: 'Reader',
      aliases: ['highlight'],
    }),
    overlayRecord('Mark', 'apps/billing', {
      contextName: 'Billing',
      aliases: ['highlight'],
    }),
  ]
  const result = overlayTermsForPreview(records, THREE_SITES, 'apps/billing/docs/adr/0001.md')
  const parent = find(get(result, 'terms'), (row) => get(row, 'term') === 'Term hint')
  const child = find(get(result, 'terms'), (row) => get(row, 'term') === 'Mark')
  assert.deepEqual(get(parent, 'aliases'), [])
  assert.deepEqual(get(child, 'aliases'), ['highlight'])
})

test('a child shorter Term does not drop a parent longer phrase', () => {
  const records = [
    overlayRecord('Affiliate program', '.', { contextName: 'Reader' }),
    overlayRecord('Affiliate', 'apps/billing', { contextName: 'Billing' }),
  ]
  const result = overlayTermsForPreview(records, THREE_SITES, 'apps/billing/docs/adr/0001.md')
  assert.deepEqual(
    map(get(result, 'terms'), (row) => `${get(row, 'rel')}:${get(row, 'term')}`).sort(),
    ['.:Affiliate program', 'apps/billing:Affiliate'],
  )
})

test('Paste with no selection uses the root Site only', () => {
  const records = [
    overlayRecord('Site', '.', { contextName: 'Reader' }),
    overlayRecord('Invoice', 'apps/billing', { contextName: 'Billing' }),
  ]
  const result = overlayTermsForPreview(records, THREE_SITES, '')
  assert.equal(get(result, 'owningRel'), '.')
  assert.deepEqual(map(get(result, 'terms'), 'term'), ['Site'])
})

test('Paste with no selection in a nested-only Project yields no overlay', () => {
  const sites = [
    { rel: 'apps/billing', title: 'Billing' },
    { rel: 'apps/shipping', title: 'Shipping' },
  ]
  const records = [
    overlayRecord('Invoice', 'apps/billing', { contextName: 'Billing' }),
  ]
  const result = overlayTermsForPreview(records, sites, '')
  assert.deepEqual(overlayFuel(result), { owningRel: '', terms: [] })
})

test('empty Sites or empty Terms yield no overlay', () => {
  assert.deepEqual(overlayFuel(overlayTermsForPreview([], THREE_SITES, 'CONTEXT.md')), {
    owningRel: '',
    terms: [],
  })
  assert.deepEqual(
    overlayFuel(overlayTermsForPreview([overlayRecord('Site', '.')], [], 'CONTEXT.md')),
    { owningRel: '', terms: [] },
  )
})
