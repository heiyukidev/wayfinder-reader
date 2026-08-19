import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  validateProjectPath,
  resolveScratchRelPath,
  resolveProjectRoots,
  expandHome,
} from './paths.js'

function makeTmpProject() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wayfinder-reader-'))
  const scratch = path.join(dir, '.scratch')
  fs.mkdirSync(scratch, { recursive: true })
  return dir
}

function makeProjectWithoutScratch() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'wayfinder-reader-'))
}

test('resolves file under .scratch', () => {
  const project = makeTmpProject()
  const effort = path.join(project, '.scratch', 'effort')
  fs.mkdirSync(effort)
  const mapFile = path.join(effort, 'map.md')
  fs.writeFileSync(mapFile, '# Map')

  const result = resolveScratchRelPath(project, '.scratch/effort/map.md')
  assert.equal(result.ok, true)
  assert.equal(result.absPath, fs.realpathSync(mapFile))
  assert.equal(result.relPath, '.scratch/effort/map.md')
})

test('rejects ../ escape', () => {
  const project = makeTmpProject()
  const result = resolveScratchRelPath(project, '.scratch/../package.json')
  assert.equal(result.ok, false)
  assert.equal(result.status, 403)
})

test('rejects path outside .scratch inside project', () => {
  const project = makeTmpProject()
  fs.writeFileSync(path.join(project, 'package.json'), '{}')
  const result = resolveScratchRelPath(project, 'package.json')
  assert.equal(result.ok, false)
  assert.equal(result.status, 403)
})

test('rejects symlink inside .scratch pointing outside project', () => {
  const project = makeTmpProject()
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'wayfinder-outside-'))
  const outsideFile = path.join(outside, 'secret.txt')
  fs.writeFileSync(outsideFile, 'secret')

  const linkParent = path.join(project, '.scratch', 'effort')
  fs.mkdirSync(linkParent)
  const linkPath = path.join(linkParent, 'escape.md')
  fs.symlinkSync(outsideFile, linkPath)

  const result = resolveScratchRelPath(project, '.scratch/effort/escape.md')
  assert.equal(result.ok, false)
  assert.equal(result.status, 403)
})

test('rejects .scratch symlink pointing outside project', () => {
  const project = makeProjectWithoutScratch()
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'wayfinder-outside-scratch-'))
  const outsideScratch = path.join(outside, 'remote-scratch')
  fs.mkdirSync(outsideScratch)
  const secretFile = path.join(outsideScratch, 'secret.md')
  fs.writeFileSync(secretFile, 'outside secret')

  fs.symlinkSync(outsideScratch, path.join(project, '.scratch'))

  const roots = resolveProjectRoots(project)
  assert.equal(roots.ok, false)
  assert.equal(roots.status, 403)

  const result = resolveScratchRelPath(project, '.scratch/secret.md')
  assert.equal(result.ok, false)
  assert.equal(result.status, 403)
})

test('validateProjectPath rejects relative paths', () => {
  const result = validateProjectPath('relative/path')
  assert.equal(result.ok, false)
})

test('validateProjectPath rejects empty', () => {
  const result = validateProjectPath('')
  assert.equal(result.ok, false)
})

test('validateProjectPath accepts absolute directory', () => {
  const project = makeTmpProject()
  const result = validateProjectPath(project)
  assert.equal(result.ok, true)
  assert.equal(result.projectPath, project)
})

test('expandHome expands tilde', () => {
  const home = os.homedir()
  assert.equal(expandHome('~'), home)
  assert.equal(expandHome('~/foo'), path.join(home, 'foo'))
})
