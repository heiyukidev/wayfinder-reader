import { test } from 'node:test'
import assert from 'node:assert/strict'
import get from './vendor/lodash-es/get.js'
import { detectAlwaysOn, isAlwaysOnOrigin } from './always-on.js'

const HOSTED = { hostname: 'heiyukidev.github.io', port: '' }
const ALWAYS_ON = { hostname: '127.0.0.1', port: '5420' }

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

test('GitHub Pages origin is not Always-on', () => {
  assert.equal(isAlwaysOnOrigin(HOSTED), false)
})

test('Always-on bind is Always-on', () => {
  assert.equal(isAlwaysOnOrigin(ALWAYS_ON), true)
})

test('localhost is not the Always-on bind', () => {
  assert.equal(isAlwaysOnOrigin({ hostname: 'localhost', port: '5420' }), false)
})

test('hosted origin does not GET /api/state', async () => {
  let requested = null
  const fetchImpl = async (url) => {
    requested = url
    return jsonResponse({ recents: [] })
  }

  const state = await detectAlwaysOn(HOSTED, fetchImpl)
  assert.equal(state, null)
  assert.equal(requested, null)
})

test('Always-on origin reads /api/state', async () => {
  const fetchImpl = async (url, options) => {
    assert.equal(url, '/api/state')
    assert.equal(get(options, ['headers', 'Accept']), 'application/json')
    return jsonResponse({ recents: ['/tmp/project'], lastProjectPath: '/tmp/project' })
  }

  const state = await detectAlwaysOn(ALWAYS_ON, fetchImpl)
  assert.deepEqual(state, { recents: ['/tmp/project'], lastProjectPath: '/tmp/project' })
})
