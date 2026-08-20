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

function phrases(matches) {
  return map(matches, (row) => ({ phrase: get(row, 'phrase'), index: get(row, 'index') }))
}

test('a longer glossary phrase wins over a shorter prefix when extra spaces sit between the words', () => {
  const matches = matchTermHints(
    'Join the affiliate  program today.',
    terms('Affiliate', 'Affiliate program'),
  )
  assert.deepEqual(phrases(matches), [{ phrase: 'affiliate program', index: 9 }])
})

test('a longer glossary phrase wins when a tab sits between the words', () => {
  const matches = matchTermHints(
    'Join the affiliate\tprogram today.',
    terms('Affiliate', 'Affiliate program'),
  )
  assert.deepEqual(phrases(matches), [{ phrase: 'affiliate program', index: 9 }])
})

test('a longer glossary phrase wins when a newline sits between the words', () => {
  const matches = matchTermHints(
    'Join the affiliate\nprogram today.',
    terms('Affiliate', 'Affiliate program'),
  )
  assert.deepEqual(phrases(matches), [{ phrase: 'affiliate program', index: 9 }])
})

test('a shorter Term still matches where it stands alone', () => {
  const matches = matchTermHints(
    'Join as an affiliate today.',
    terms('Affiliate', 'Affiliate program'),
  )
  assert.deepEqual(phrases(matches), [{ phrase: 'affiliate', index: 11 }])
})

test('a shorter Term after a longer match still matches outside the claimed span', () => {
  const matches = matchTermHints(
    'join the affiliate program as an affiliate',
    terms('Affiliate', 'Affiliate program'),
  )
  assert.deepEqual(phrases(matches), [
    { phrase: 'affiliate program', index: 9 },
    { phrase: 'affiliate', index: 33 },
  ])
})

test('adjacent short Terms that are not a glossary phrase stay two matches', () => {
  const matches = matchTermHints(
    'Join the affiliate program today.',
    terms('Affiliate', 'Program'),
  )
  assert.deepEqual(phrases(matches), [
    { phrase: 'affiliate', index: 9 },
    { phrase: 'program', index: 19 },
  ])
})

test('whole-word matching does not hint inside a longer token', () => {
  const matches = matchTermHints('affiliates and affiliation', terms('Affiliate'))
  assert.deepEqual(phrases(matches), [])
})

test('matching is case-insensitive', () => {
  const matches = matchTermHints(
    'Join the Affiliate Program today.',
    terms('Affiliate program'),
  )
  assert.deepEqual(phrases(matches), [{ phrase: 'affiliate program', index: 9 }])
})

test('leftmost longest wins when phrases overlap without nesting', () => {
  const matches = matchTermHints('New York City', terms('New York', 'York City'))
  assert.deepEqual(phrases(matches), [{ phrase: 'new york', index: 0 }])
})

test('empty Terms yield no matches', () => {
  assert.deepEqual(matchTermHints('Join the affiliate program today.', []), [])
})

test('a longer alias claims the span over a shorter Term inside it', () => {
  const matches = matchTermHints('Join the affiliate program today.', [
    { term: 'Affiliate', definition: 'short', aliases: [], contextName: 'Test' },
    { term: 'Partner', definition: 'long', aliases: ['affiliate program'], contextName: 'Test' },
  ])
  assert.deepEqual(phrases(matches), [{ phrase: 'affiliate program', index: 9 }])
  assert.equal(get(matches, [0, 'model', 'kind']), 'prefer')
  assert.deepEqual(get(matches, [0, 'model', 'terms']), ['Partner'])
})

test('punctuation after a longer phrase leaves the match intact', () => {
  const matches = matchTermHints(
    'Join the affiliate program.',
    terms('Affiliate', 'Affiliate program'),
  )
  assert.deepEqual(phrases(matches), [{ phrase: 'affiliate program', index: 9 }])
})

test('a hyphenated form that is not the glossary spelling misses the longer phrase', () => {
  const matches = matchTermHints(
    'Join the affiliate-program today.',
    terms('Affiliate program'),
  )
  assert.deepEqual(phrases(matches), [])
})
