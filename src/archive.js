import fs from 'node:fs'
import path from 'node:path'
import find from 'lodash/find.js'
import get from 'lodash/get.js'
import { archiveRoot, resolveLiveEffortDir } from './paths.js'
import { buildReadableTree } from './tree.js'

export function archiveFinishedEffort(projectPath, slug) {
  const live = resolveLiveEffortDir(projectPath, slug)
  if (!live.ok) return live

  const { decisions } = buildReadableTree(projectPath)
  const group = find(decisions, (effort) => get(effort, 'folder') === slug)
  if (!group) {
    return { ok: false, error: 'Effort not found', status: 404 }
  }
  if (!get(group, 'finished')) {
    return { ok: false, error: 'Effort is not Finished', status: 400 }
  }

  const destRoot = archiveRoot(projectPath)
  fs.mkdirSync(destRoot, { recursive: true })
  let destName = slug
  let suffix = 2
  while (fs.existsSync(path.join(destRoot, destName))) {
    destName = `${slug}-${suffix}`
    suffix += 1
  }

  fs.renameSync(live.absPath, path.join(destRoot, destName))
  return { ok: true }
}
