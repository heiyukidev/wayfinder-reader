import { serve } from '@hono/node-server'
import { app } from './app.js'

const HOST = '127.0.0.1'
const PORT = 5420

const server = serve({ fetch: app.fetch, hostname: HOST, port: PORT }, (info) => {
  console.log(`Reader listening on http://${info.address}:${info.port}`)
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use on ${HOST}. The Reader will not start on another port.`)
    process.exit(0)
  }
  console.error(err)
  process.exit(1)
})
