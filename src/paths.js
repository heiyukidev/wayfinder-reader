import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const SCRATCH_PREFIX = '.scratch/'

export function expandHome(input) {
  if (!input.startsWith('~')) return input
  if (input === '~') return os.homedir()
  return path.join(os.homedir(), input.slice(1).replace(/^\//, ''))
}

export function validateProjectPath(input) {
  if (!input || typeof input !== 'string' || !input.trim()) {
    return { ok: false, error: 'Project path is required' }
  }

  const expanded = expandHome(input.trim())
  if (!path.isAbsolute(expanded)) {
    return { ok: false, error: 'Project path must be absolute' }
  }

  const normalized = path.resolve(expanded)
  if (!fs.existsSync(normalized)) {
    return { ok: false, error: 'Project path does not exist' }
  }

  const stat = fs.statSync(normalized)
  if (!stat.isDirectory()) {
    return { ok: false, error: 'Project path is not a directory' }
  }

  return { ok: true, projectPath: normalized }
}

export function scratchRoot(projectPath) {
  return path.join(projectPath, '.scratch')
}

export function isUnderRoot(realPath, rootReal) {
  const prefix = rootReal.endsWith(path.sep) ? rootReal : rootReal + path.sep
  return realPath === rootReal || realPath.startsWith(prefix)
}

export function resolveProjectRoots(projectPath) {
  let projectReal
  try {
    projectReal = fs.realpathSync(projectPath)
  } catch {
    return { ok: false, error: 'Cannot resolve project path', status: 403 }
  }

  const scratch = scratchRoot(projectPath)
  if (!fs.existsSync(scratch)) {
    return { ok: false, error: '.scratch does not exist', status: 404 }
  }

  let scratchReal
  try {
    scratchReal = fs.realpathSync(scratch)
  } catch {
    return { ok: false, error: '.scratch does not exist', status: 404 }
  }

  if (!isUnderRoot(scratchReal, projectReal)) {
    return { ok: false, error: '.scratch escapes project sandbox', status: 403 }
  }

  return { ok: true, projectReal, scratchReal }
}

export function canonicalScratchRel(scratchReal, childReal) {
  const rel = path.relative(scratchReal, childReal).replace(/\\/g, '/')
  return rel ? `.scratch/${rel}` : '.scratch'
}

export function resolveScratchRelPath(projectPath, relPath) {
  if (!relPath || typeof relPath !== 'string') {
    return { ok: false, error: 'Path is required', status: 400 }
  }

  const posix = relPath.replace(/\\/g, '/')
  if (!posix.startsWith(SCRATCH_PREFIX) && posix !== '.scratch') {
    return { ok: false, error: 'Path must be under .scratch', status: 403 }
  }

  if (posix.includes('..')) {
    return { ok: false, error: 'Path traversal is not allowed', status: 403 }
  }

  const roots = resolveProjectRoots(projectPath)
  if (!roots.ok) {
    return roots
  }

  const { projectReal, scratchReal } = roots
  const absPath = path.resolve(projectPath, posix)

  if (!fs.existsSync(absPath)) {
    return { ok: false, error: 'File not found', status: 404 }
  }

  let realPath
  try {
    realPath = fs.realpathSync(absPath)
  } catch {
    return { ok: false, error: 'Cannot resolve path', status: 403 }
  }

  if (!isUnderRoot(realPath, scratchReal)) {
    return { ok: false, error: 'Path escapes .scratch sandbox', status: 403 }
  }

  if (!isUnderRoot(realPath, projectReal)) {
    return { ok: false, error: 'Path escapes project sandbox', status: 403 }
  }

  return {
    ok: true,
    absPath: realPath,
    relPath: canonicalScratchRel(scratchReal, realPath),
  }
}
