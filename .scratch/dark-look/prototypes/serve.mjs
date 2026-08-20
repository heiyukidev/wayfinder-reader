import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(here, '../../..')
const publicDir = path.join(projectRoot, 'public')
const HOST = '127.0.0.1'
const PORT = 5424

const MIME = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
}

function resolveFile(urlPath) {
  if (urlPath === '/' || urlPath === '/index.html' || urlPath === '/dark-desk.html') {
    return path.join(here, 'dark-desk.html')
  }
  if (urlPath === '/dark-desk.js') {
    return path.join(here, 'dark-desk.js')
  }
  const rel = decodeURIComponent(urlPath.replace(/^\//, ''))
  const fromPublic = path.resolve(publicDir, rel)
  if (!fromPublic.startsWith(publicDir)) return null
  if (existsSync(fromPublic) && statSync(fromPublic).isFile()) return fromPublic
  return null
}

const server = createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${HOST}`)
  const file = resolveFile(url.pathname)
  if (!file) {
    res.statusCode = 404
    res.end('Not found')
    return
  }
  const type = MIME[path.extname(file)] || 'application/octet-stream'
  res.setHeader('Content-Type', type)
  createReadStream(file).pipe(res)
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use on ${HOST}.`)
    console.error(`Open http://${HOST}:${PORT}/?variant=A&scene=preview if the prototype is already up.`)
    process.exit(0)
  }
  console.error(err)
  process.exit(1)
})

server.listen(PORT, HOST, () => {
  console.log(`Dark desk  http://${HOST}:${PORT}/?variant=A&scene=preview`)
  console.log('A Desk invert · B Lifted Load · C Stronger grain')
  console.log('Scenes: preview, compose, show, hint, error, empty, always-on')
})
