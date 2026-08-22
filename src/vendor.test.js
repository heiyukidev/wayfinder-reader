import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import flatten from 'lodash/flatten.js'
import map from 'lodash/map.js'
import uniq from 'lodash/uniq.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PUBLIC = path.join(ROOT, 'public')
const INDEX_HTML = path.join(PUBLIC, 'index.html')
const STYLES_CSS = path.join(PUBLIC, 'styles.css')
const CLIENT_JS = [
  path.join(PUBLIC, 'app.js'),
  path.join(PUBLIC, 'always-on.js'),
  path.join(PUBLIC, 'term-hints.js'),
  path.join(PUBLIC, 'walk.js'),
  path.join(PUBLIC, 'recents.js'),
]

const LODASH_IMPORT_RE = /from\s+['"]\.\/vendor\/lodash-es\/([^'"]+)['"]/g
const MARKED_IMPORT_RE = /from\s+['"]\.\/vendor\/marked\/lib\/marked\.esm\.js['"]/

function clientLodashModules() {
  return uniq(
    flatten(
      map(CLIENT_JS, (filePath) => {
        const source = fs.readFileSync(filePath, 'utf8')
        const modules = []
        let match
        LODASH_IMPORT_RE.lastIndex = 0
        while ((match = LODASH_IMPORT_RE.exec(source)) !== null) {
          modules.push(match[1])
        }
        return modules
      }),
    ),
  )
}

test('client lodash modules are vendored ESM under public/vendor', () => {
  const modules = clientLodashModules()
  assert.ok(modules.length > 0, 'client files should import lodash-es modules')

  for (const rel of modules) {
    const modulePath = path.join(PUBLIC, 'vendor', 'lodash-es', rel)
    assert.ok(fs.existsSync(modulePath), `missing vendored module: ${rel}`)
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

test('marked is vendored in the static tree', () => {
  const markedPath = path.join(PUBLIC, 'vendor', 'marked', 'lib', 'marked.esm.js')
  assert.ok(fs.existsSync(markedPath), 'public/vendor/marked/lib/marked.esm.js must exist')
  for (const filePath of CLIENT_JS) {
    const source = fs.readFileSync(filePath, 'utf8')
    if (!source.includes('marked')) continue
    assert.match(source, MARKED_IMPORT_RE, `${path.basename(filePath)} must import vendored marked`)
  }
})

test('static assets are path-relative so a project-site origin still loads them', () => {
  const html = fs.readFileSync(INDEX_HTML, 'utf8')
  const css = fs.readFileSync(STYLES_CSS, 'utf8')
  const app = fs.readFileSync(path.join(PUBLIC, 'app.js'), 'utf8')

  assert.match(html, /href=["']\.\/styles\.css(?:\?[^"']*)?["']/)
  assert.match(html, /rel=["']icon["']/)
  assert.match(html, /href=["']\.\/favicon\.svg["']/)
  assert.doesNotMatch(html, /href=["']\/favicon/)
  assert.ok(fs.existsSync(path.join(PUBLIC, 'favicon.svg')), 'public/favicon.svg must exist')
  assert.match(html, /src=["']\.\/app\.js["']/)
  assert.doesNotMatch(html, /href=["']\/styles\.css["']/)
  assert.doesNotMatch(html, /src=["']\/app\.js["']/)
  assert.doesNotMatch(css, /url\(['"]?\//)
  assert.doesNotMatch(app, /from\s+['"]\//)
})

test('index.html does not rely on classic lodash script unless ESM imports absent', () => {
  const html = fs.readFileSync(INDEX_HTML, 'utf8')
  const usesClassicLodash = /<script[^>]+src=["'][^"']*lodash\.js["']/i.test(html)
  const appUsesLodashEs = LODASH_IMPORT_RE.test(fs.readFileSync(path.join(PUBLIC, 'app.js'), 'utf8'))
  LODASH_IMPORT_RE.lastIndex = 0

  if (usesClassicLodash) {
    assert.ok(!appUsesLodashEs, 'classic lodash script and ESM imports should not mix')
  } else {
    assert.ok(appUsesLodashEs, 'client should load lodash via ESM when no classic script')
  }
})

test('hosted Reader Load is a directory picker; Always-on path and Archive are feature-detected', () => {
  const html = fs.readFileSync(INDEX_HTML, 'utf8')
  const app = fs.readFileSync(path.join(PUBLIC, 'app.js'), 'utf8')
  const alwaysOn = fs.readFileSync(path.join(PUBLIC, 'always-on.js'), 'utf8')
  assert.match(html, /id=["']project-path["']/)
  assert.match(html, /id=["']project-path["'][\s\S]*?\bhidden\b/)
  assert.doesNotMatch(html, />Archive</)
  assert.match(html, /id=["']load-btn["']/)
  assert.match(app, /showDirectoryPicker/)
  assert.match(app, /from ['"]\.\/always-on\.js['"]/)
  assert.match(alwaysOn, /\/api\/state/)
  assert.match(app, /\/api\/project/)
  assert.match(app, /\/api\/tree/)
  assert.match(app, /\/api\/file/)
  assert.match(app, /\/api\/archive/)
  assert.match(app, /archiveEffort/)
  assert.match(app, /detectAlwaysOn/)
})

test('pending Load occupies the desk; file switch does not say Loading…', () => {
  const app = fs.readFileSync(path.join(PUBLIC, 'app.js'), 'utf8')
  const css = fs.readFileSync(STYLES_CSS, 'utf8')
  assert.match(app, /beginPendingLoad/)
  assert.match(app, /pending-load\.js/)
  assert.doesNotMatch(app, /Loading…/)
  assert.doesNotMatch(app, /showLoadingPreview/)
  assert.match(css, /\.map-pending-bar/)
  assert.match(css, /map-pending-breathe/)
  assert.doesNotMatch(css, /preview-loading-text/)
})
