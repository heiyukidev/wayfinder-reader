import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import map from 'lodash/map.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const APP_JS = path.join(ROOT, 'public', 'app.js')
const INDEX_HTML = path.join(ROOT, 'public', 'index.html')

const LODASH_IMPORT_RE = /from\s+['"]\/vendor\/lodash-es\/([^'"]+)['"]/g

function clientLodashModules() {
  const source = fs.readFileSync(APP_JS, 'utf8')
  const modules = []
  let match
  while ((match = LODASH_IMPORT_RE.exec(source)) !== null) {
    modules.push(match[1])
  }
  return map(modules, (rel) => path.join(ROOT, 'node_modules', 'lodash-es', rel))
}

test('client lodash modules are ESM (lodash-es)', () => {
  const modulePaths = clientLodashModules()
  assert.ok(modulePaths.length > 0, 'public/app.js should import lodash-es modules')

  for (const modulePath of modulePaths) {
    assert.ok(fs.existsSync(modulePath), `missing client module: ${modulePath}`)
    const source = fs.readFileSync(modulePath, 'utf8')
    assert.match(
      source,
      /export\s+(default|{)/,
      `${path.basename(modulePath)} must be ESM for browser import`,
    )
    assert.doesNotMatch(
      source,
      /module\.exports/,
      `${path.basename(modulePath)} must not be CommonJS`,
    )
  }
})

test('index.html does not rely on classic lodash script unless ESM imports absent', () => {
  const html = fs.readFileSync(INDEX_HTML, 'utf8')
  const usesClassicLodash = /<script[^>]+src=["'][^"']*lodash\.js["']/i.test(html)
  const appUsesLodashEs = LODASH_IMPORT_RE.test(fs.readFileSync(APP_JS, 'utf8'))
  LODASH_IMPORT_RE.lastIndex = 0

  if (usesClassicLodash) {
    assert.ok(!appUsesLodashEs, 'classic lodash script and ESM imports should not mix')
  } else {
    assert.ok(appUsesLodashEs, 'client should load lodash via ESM when no classic script')
  }
})
