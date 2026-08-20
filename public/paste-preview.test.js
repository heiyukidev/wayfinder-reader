import { test } from 'node:test'
import assert from 'node:assert/strict'
import assign from './vendor/lodash-es/assign.js'
import {
  createPasteSession,
  leavePaste,
  markProjectLoaded,
  pasteCaptionText,
  pasteLinkKind,
  setPasteBuffer,
  setPasteCompose,
  togglePaste,
} from './paste-preview.js'

test('Paste stays off until a Project is Loaded', () => {
  const session = createPasteSession()
  assert.equal(session.loaded, false)
  assert.deepEqual(togglePaste(session), session)
})

test('Load enables Paste and clears the buffer', () => {
  const loaded = markProjectLoaded({
    loaded: false,
    showing: true,
    compose: false,
    buffer: '# leftover',
  })
  assert.equal(loaded.loaded, true)
  assert.equal(loaded.showing, false)
  assert.equal(loaded.compose, true)
  assert.equal(loaded.buffer, '')
})

test('an empty buffer opens Compose; a kept buffer opens Show', () => {
  const empty = markProjectLoaded()
  const composing = togglePaste(empty)
  assert.equal(composing.showing, true)
  assert.equal(composing.compose, true)

  const withBuffer = assign({}, empty, { buffer: '# notes' })
  const showing = togglePaste(withBuffer)
  assert.equal(showing.showing, true)
  assert.equal(showing.compose, false)
})

test('a Map list click leaves Paste and keeps the buffer', () => {
  const showing = {
    loaded: true,
    showing: true,
    compose: false,
    buffer: '# notes',
  }
  const left = leavePaste(showing)
  assert.equal(left.showing, false)
  assert.equal(left.buffer, '# notes')
  assert.equal(togglePaste(left).showing, true)
})

test('the caption is Paste preview while showing paste, else the file path', () => {
  const loaded = markProjectLoaded()
  assert.equal(pasteCaptionText(loaded, '.scratch/map.md'), '.scratch/map.md')
  assert.equal(pasteCaptionText(togglePaste(loaded), '.scratch/map.md'), 'Paste preview')
  assert.equal(pasteCaptionText(createPasteSession(), '.scratch/map.md'), '')
})

test('typing into Compose keeps the buffer without leaving Paste', () => {
  const composing = togglePaste(markProjectLoaded())
  const typed = setPasteBuffer(composing, '## Grill')
  assert.equal(typed.showing, true)
  assert.equal(typed.compose, true)
  assert.equal(typed.buffer, '## Grill')
  assert.equal(setPasteCompose(typed, false).compose, false)
})

test('pasted GFM does not resolve relative links against the Readable tree', () => {
  assert.equal(pasteLinkKind('https://example.com'), 'external')
  assert.equal(pasteLinkKind('http://example.com/a'), 'external')
  assert.equal(pasteLinkKind('#heading'), 'hash')
  assert.equal(pasteLinkKind('../map.md'), 'relative')
  assert.equal(pasteLinkKind('issues/01.md'), 'relative')
})
