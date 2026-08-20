import { test } from 'node:test'
import assert from 'node:assert/strict'
import get from './vendor/lodash-es/get.js'
import map from './vendor/lodash-es/map.js'
import { matchTermHints } from './term-hints.js'

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
