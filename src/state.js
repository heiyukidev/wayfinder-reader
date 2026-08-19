import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import uniq from 'lodash/uniq.js'

const RECENTS_CAP = 10

function statePaths() {
  const dir = process.env.WAYFINDER_READER_STATE_DIR
    ? path.resolve(process.env.WAYFINDER_READER_STATE_DIR)
    : path.join(os.homedir(), '.wayfinder-reader')
  return { stateDir: dir, stateFile: path.join(dir, 'state.json') }
}

function ensureDir() {
  const { stateDir } = statePaths()
  fs.mkdirSync(stateDir, { recursive: true })
}

export function readState() {
  const { stateFile } = statePaths()
  try {
    const raw = fs.readFileSync(stateFile, 'utf8')
    const parsed = JSON.parse(raw)
    return {
      lastProjectPath: parsed.lastProjectPath ?? null,
      recents: Array.isArray(parsed.recents) ? parsed.recents : [],
    }
  } catch {
    return { lastProjectPath: null, recents: [] }
  }
}

export function writeState(patch) {
  ensureDir()
  const current = readState()
  const merged = { ...current, ...patch }
  const { stateFile } = statePaths()
  fs.writeFileSync(stateFile, JSON.stringify(merged, null, 2))
  return merged
}

export function rememberProject(projectPath) {
  const current = readState()
  const recents = uniq([projectPath, ...current.recents]).slice(0, RECENTS_CAP)
  return writeState({ lastProjectPath: projectPath, recents })
}
