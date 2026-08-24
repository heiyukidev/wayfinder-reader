import { test } from 'node:test'
import assert from 'node:assert/strict'
import { canLoadAgain, shouldKeepPreview } from './load-again.js'

test('Load again is for a Project path or a Directory handle, not a snapshot', () => {
  assert.equal(
    canLoadAgain({ alwaysOn: true, projectPath: '/Users/me/project' }),
    true,
  )
  assert.equal(canLoadAgain({ alwaysOn: true, projectPath: '' }), false)
  assert.equal(
    canLoadAgain({
      alwaysOn: false,
      hostedHandleLoad: true,
      rootHandle: { name: 'project' },
    }),
    true,
  )
  assert.equal(
    canLoadAgain({
      alwaysOn: false,
      hostedHandleLoad: false,
      rootHandle: { name: 'project' },
    }),
    false,
  )
  assert.equal(
    canLoadAgain({ alwaysOn: false, hostedHandleLoad: true, rootHandle: null }),
    false,
  )
})

test('Load again keeps a readable preview path and drops an unreadable one', () => {
  assert.equal(shouldKeepPreview('.scratch/effort/map.md'), true)
  assert.equal(shouldKeepPreview('CONTEXT.md', ['CONTEXT.md']), true)
  assert.equal(shouldKeepPreview('.scratch/.archive/old/map.md'), false)
  assert.equal(shouldKeepPreview('package.json'), false)
  assert.equal(shouldKeepPreview(''), false)
  assert.equal(shouldKeepPreview(null), false)
})
