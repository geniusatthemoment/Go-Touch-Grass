import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' }

createServer(async (req, res) => {
  const requested = req.url === '/' ? '/index.html' : req.url.split('?')[0]
  const file = normalize(join(root, requested))
  if (!file.startsWith(root)) { res.writeHead(403); return res.end('Forbidden') }
  try {
    const body = await readFile(file)
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' })
    res.end(body)
  } catch {
    res.writeHead(404); res.end('Not found')
  }
}).listen(5173, () => console.log('Touch Grass is running at http://localhost:5173'))
