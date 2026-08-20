import { createReadStream, existsSync } from 'node:fs'
import { createServer } from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(here, '../../..')
const pagePath = path.join(here, 'map-list-from-handles.html')
const lodashPath = path.join(projectRoot, 'node_modules/lodash/lodash.min.js')
const HOST = '127.0.0.1'
const PORT = 5421

const server = createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${HOST}`)
  if (url.pathname === '/' || url.pathname === '/index.html') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    createReadStream(pagePath).pipe(res)
    return
  }
  if (url.pathname === '/lodash.min.js' && existsSync(lodashPath)) {
    res.setHeader('Content-Type', 'text/javascript; charset=utf-8')
    createReadStream(lodashPath).pipe(res)
    return
  }
  res.statusCode = 404
  res.end('Not found')
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use on ${HOST}.`)
    console.error(`Open http://${HOST}:${PORT}/ if the prototype is already up.`)
    process.exit(0)
  }
  console.error(err)
  process.exit(1)
})

server.listen(PORT, HOST, () => {
  console.log(`Prototype (throwaway) http://${HOST}:${PORT}/`)
  console.log('Chrome or Edge. Pick the Project root, not .scratch.')
})
