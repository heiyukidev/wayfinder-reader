import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(here, '../../..')
const publicDir = path.join(projectRoot, 'public')
const HOST = '127.0.0.1'
const PORT = 5422

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
  if (urlPath === '/' || urlPath === '/index.html') {
    return path.join(here, 'occupy-preview.html')
  }
  if (urlPath === '/polish' || urlPath === '/polish.html' || urlPath === '/visual-polish.html') {
    return path.join(here, 'visual-polish.html')
  }
  if (urlPath === '/occupy-preview.js') {
    return path.join(here, 'occupy-preview.js')
  }
  if (urlPath === '/visual-polish.js') {
    return path.join(here, 'visual-polish.js')
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
    console.error(`Open http://${HOST}:${PORT}/?variant=A if the prototype is already up.`)
    process.exit(0)
  }
  console.error(err)
  process.exit(1)
})

server.listen(PORT, HOST, () => {
  console.log(`Occupy  http://${HOST}:${PORT}/?variant=A`)
  console.log('A Caption toggle · B Header + stacked live · C Sidebar + split')
  console.log(`Polish  http://${HOST}:${PORT}/polish?variant=A`)
  console.log('A Matched chrome · B Draft sheet · C Mode in the title')
})
