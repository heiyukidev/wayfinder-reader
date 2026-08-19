import fs from 'node:fs'
import path from 'node:path'
import find from 'lodash/find.js'
import get from 'lodash/get.js'
import { scratchRoot } from './paths.js'
import { buildReadableTree } from './tree.js'

const SLUG_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/

export function archiveFinishedEffort(projectPath, slug) {
  if (typeof slug !== 'string' || !SLUG_PATTERN.test(slug) || slug === '.archive') {
    return { ok: false, error: 'Invalid Effort', status: 403 }
  }

  const { decisions } = buildReadableTree(projectPath)
  const group = find(decisions, (effort) => get(effort, 'folder') === slug)
  if (!group) {
    return { ok: false, error: 'Effort not found', status: 404 }
  }
  if (!get(group, 'finished')) {
    return { ok: false, error: 'Effort is not Finished', status: 400 }
  }

  const source = path.join(scratchRoot(projectPath), slug)
  if (!fs.existsSync(source) || !fs.statSync(source).isDirectory()) {
    return { ok: false, error: 'Effort not found', status: 404 }
  }

  const archiveRoot = path.join(scratchRoot(projectPath), '.archive')
  fs.mkdirSync(archiveRoot, { recursive: true })
  let destName = slug
  let suffix = 2
  while (fs.existsSync(path.join(archiveRoot, destName))) {
    destName = `${slug}-${suffix}`
    suffix += 1
  }

  fs.renameSync(source, path.join(archiveRoot, destName))
  return { ok: true }
}
