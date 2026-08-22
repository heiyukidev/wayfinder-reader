import get from './vendor/lodash-es/get.js'
import includes from './vendor/lodash-es/includes.js'

export function isAlwaysOnOrigin(locationLike) {
  return get(locationLike, 'hostname') === '127.0.0.1' && String(get(locationLike, 'port', '')) === '5420'
}

export async function detectAlwaysOn(locationLike = globalThis.location, fetchImpl = globalThis.fetch) {
  if (!isAlwaysOnOrigin(locationLike)) return null
  try {
    const res = await fetchImpl('/api/state', { headers: { Accept: 'application/json' } })
    if (!res.ok) return null
    const contentType = res.headers.get('content-type') || ''
    if (!includes(contentType, 'json')) return null
    return await res.json()
  } catch {
    return null
  }
}
