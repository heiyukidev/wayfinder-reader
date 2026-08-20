import concat from './vendor/lodash-es/concat.js'
import forEach from './vendor/lodash-es/forEach.js'
import get from './vendor/lodash-es/get.js'
import sortBy from './vendor/lodash-es/sortBy.js'
import take from './vendor/lodash-es/take.js'

const DB_NAME = 'wayfinder-reader'
const STORE = 'recents'
const MAX_RECENTS = 10

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function listRecents() {
  try {
    const db = await openDb()
    const rows = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).getAll()
      req.onsuccess = () => resolve(req.result || [])
      req.onerror = () => reject(req.error)
    })
    return sortBy(rows, (row) => -get(row, 'savedAt', 0))
  } catch {
    return []
  }
}

async function putRecents(rows) {
  const db = await openDb()
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    store.clear()
    forEach(rows, (row) => store.put(row))
    tx.oncomplete = resolve
    tx.onerror = () => reject(tx.error)
  })
}

export async function rememberHandle(handle) {
  const recents = await listRecents()
  const kept = []
  for (const row of recents) {
    try {
      if (row.handle && (await handle.isSameEntry(row.handle))) continue
    } catch {
      continue
    }
    kept.push(row)
  }
  const next = take(
    concat(
      [
        {
          id: `${Date.now()}-${handle.name}`,
          name: handle.name,
          handle,
          savedAt: Date.now(),
        },
      ],
      kept,
    ),
    MAX_RECENTS,
  )
  try {
    await putRecents(next)
  } catch {
    return kept
  }
  return next
}

export async function queryReadPermission(handle) {
  if (!handle?.queryPermission) return 'unknown'
  try {
    return await handle.queryPermission({ mode: 'read' })
  } catch {
    return 'unknown'
  }
}

export async function requestReadPermission(handle) {
  let permission = await queryReadPermission(handle)
  if (permission !== 'granted' && handle?.requestPermission) {
    try {
      permission = await handle.requestPermission({ mode: 'read' })
    } catch {
      return permission
    }
  }
  return permission
}
