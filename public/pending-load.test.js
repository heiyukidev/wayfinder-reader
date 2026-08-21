import { test } from 'node:test'
import assert from 'node:assert/strict'
import every from './vendor/lodash-es/every.js'
import includes from './vendor/lodash-es/includes.js'
import map from './vendor/lodash-es/map.js'
import { PENDING_MAP_BARS, PENDING_PREVIEW_COPY, pendingPreviewHtml } from './pending-load.js'

test('pending preview copy names the Load, not a generic spinner', () => {
  assert.equal(PENDING_PREVIEW_COPY, 'Opening this Project.')
  assert.equal(
    pendingPreviewHtml(),
    `<p class="preview-placeholder preview-pending-text">${PENDING_PREVIEW_COPY}</p>`,
  )
  assert.equal(includes(pendingPreviewHtml(), 'Loading'), false)
})

test('pending Map list bars match list rhythm: labels, headings, indented tickets', () => {
  const kinds = map(PENDING_MAP_BARS, 'kind')
  assert.deepEqual(kinds, ['label', 'heading', 'ticket', 'ticket', 'label', 'heading', 'ticket'])
  assert.equal(
    every(PENDING_MAP_BARS, (bar) => includes(bar.width, '%')),
    true,
  )
})
