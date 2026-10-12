import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { join, normalize, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { WebSocketServer, WebSocket } from 'ws'
import { createGame, playMove, type GameState } from './src/engine/game'
import type { Position, Player } from './src/engine/types'

interface Room {
  id: string
  game: GameState
  players: Map<string, { ws: WebSocket; player: Player; ready: boolean }>
  hostId: string
}

interface Message {
  type: string
  payload?: unknown
  roomId?: string
  playerId?: string
}

const rooms = new Map<string, Room>()
const playerToRoom = new Map<string, string>()

function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function generatePlayerId(): string {
  return Math.random().toString(36).substring(2, 10)
}

function broadcast(room: Room, message: Message, excludeId?: string): void {
  const data = JSON.stringify(message)
  room.players.forEach((player, id) => {
    if (id !== excludeId && player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(data)
    }
  })
}

function send(ws: WebSocket, message: Message): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message))
  }
}

function handleCreateRoom(ws: WebSocket, playerId: string): void {
  const roomId = generateRoomId()
  const room: Room = {
    id: roomId,
    game: createGame(),
    players: new Map(),
    hostId: playerId,
  }

  room.players.set(playerId, { ws, player: 'red', ready: false })
  rooms.set(roomId, room)
  playerToRoom.set(playerId, roomId)

  send(ws, { type: 'room_created', payload: { roomId, player: 'red', game: room.game } })
  console.log(`Room ${roomId} created by ${playerId}`)
}

function handleJoinRoom(ws: WebSocket, playerId: string, roomId: string): void {
  const room = rooms.get(roomId.toUpperCase())
  if (!room) {
    send(ws, { type: 'error', payload: { message: 'Room not found' } })
    return
  }

  if (room.players.size >= 2) {
    send(ws, { type: 'error', payload: { message: 'Room is full' } })
    return
  }

  const player: Player = room.players.size === 0 ? 'red' : 'blue'
  room.players.set(playerId, { ws, player, ready: false })
  playerToRoom.set(playerId, roomId)

  send(ws, { type: 'room_joined', payload: { roomId, player, game: room.game } })

  if (room.players.size === 2) {
    broadcast(room, { type: 'room_ready', payload: { hostId: room.hostId } })
  }

  console.log(`Player ${playerId} joined room ${roomId} as ${player}`)
}

function handleStart(room: Room, playerId: string): void {
  if (playerId !== room.hostId) return
  if (room.players.size < 2) return

  room.game = createGame()
  room.players.forEach((p) => (p.ready = false))
  broadcast(room, { type: 'game_start', payload: { game: room.game } })
  console.log(`Room ${room.id} started by host`)
}

function handleMove(room: Room, playerId: string, column: number): void {
  const playerInfo = room.players.get(playerId)
  if (!playerInfo) return

  if (room.game.status !== 'playing') return
  if (room.game.currentPlayer !== playerInfo.player) return

  const nextGame = playMove(room.game, column)
  if (nextGame === room.game) return

  room.game = nextGame

  broadcast(room, { type: 'move', payload: { column, game: nextGame } })

  if (nextGame.status !== 'playing') {
    broadcast(room, { type: 'game_end', payload: { game: nextGame } })
  }
}

function handleRematch(room: Room, playerId: string): void {
  const playerInfo = room.players.get(playerId)
  if (!playerInfo) return

  playerInfo.ready = true

  const allReady = Array.from(room.players.values()).every((p) => p.ready)
  if (allReady && room.players.size === 2) {
    room.game = createGame()
    room.players.forEach((p) => (p.ready = false))
    broadcast(room, { type: 'game_start', payload: { game: room.game } })
  } else {
    broadcast(room, {
      type: 'rematch_state',
      payload: { readyPlayer: playerInfo.player },
    })
  }
}

function handleLeave(playerId: string): void {
  const roomId = playerToRoom.get(playerId)
  if (!roomId) return

  const room = rooms.get(roomId)
  if (!room) return

  room.players.delete(playerId)
  playerToRoom.delete(playerId)

  if (room.players.size === 0) {
    rooms.delete(roomId)
    console.log(`Room ${roomId} deleted`)
  } else {
    broadcast(room, { type: 'player_left', payload: { playerId } })
  }
}

const PORT = Number(process.env.PORT) || 3000
const HOST = '0.0.0.0'
const DIST_DIR = fileURLToPath(new URL('./dist', import.meta.url))

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
}

function resolveStaticFile(pathname: string): string | null {
  let decoded: string
  try {
    decoded = decodeURIComponent(pathname)
  } catch {
    return null
  }
  const full = normalize(join(DIST_DIR, decoded))
  if (full !== DIST_DIR && !full.startsWith(DIST_DIR + sep)) return null
  return full
}

async function sendFile(
  req: IncomingMessage,
  res: ServerResponse,
  filePath: string,
  cacheControl: string,
): Promise<void> {
  const data = await readFile(filePath)
  res.writeHead(200, {
    'Content-Type': MIME_TYPES[filePath.slice(filePath.lastIndexOf('.'))] ?? 'application/octet-stream',
    'Content-Length': data.length,
    'Cache-Control': cacheControl,
  })
  res.end(req.method === 'HEAD' ? undefined : data)
}

async function handleHttpRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)
  const { pathname } = url

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' })
    res.end('Method Not Allowed')
    return
  }

  // The WebSocket endpoint is reserved: never fall back to index.html for it.
  if (pathname === '/ws') {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('WebSocket endpoint: upgrade required')
    return
  }

  try {
    const filePath = resolveStaticFile(pathname === '/' ? '/index.html' : pathname)
    if (filePath) {
      const info = await stat(filePath).catch(() => null)
      const isFile = info?.isFile()
      const file = isFile
        ? filePath
        : pathname !== '/'
          ? null
          : join(DIST_DIR, 'index.html')
      if (file) {
        const isHashedAsset = file.startsWith(join(DIST_DIR, 'assets') + sep)
        await sendFile(
          req,
          res,
          file,
          isHashedAsset ? 'public, max-age=31536000, immutable' : 'no-cache',
        )
        return
      }
    }

    // SPA fallback: unknown non-asset routes serve the app shell.
    if (pathname.startsWith('/assets/')) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('Not Found')
      return
    }
    await sendFile(req, res, join(DIST_DIR, 'index.html'), 'no-cache')
  } catch {
    res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Frontend not built: run "npm run build" first.')
  }
}

const server = createServer((req, res) => {
  handleHttpRequest(req, res).catch(() => {
    if (!res.headersSent) res.writeHead(500)
    res.end('Internal Server Error')
  })
})

const wss = new WebSocketServer({ noServer: true })

server.on('upgrade', (req, socket, head) => {
  const pathname = new URL(req.url ?? '/', 'http://localhost').pathname
  if (pathname !== '/ws') {
    socket.destroy()
    return
  }
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req)
  })
})

server.listen(PORT, HOST, () => {
  console.log(`Fouria listening on http://${HOST}:${PORT} (static + /ws)`)
})

function shutdown(): void {
  wss.clients.forEach((client) => client.close())
  server.close(() => process.exit(0))
  setTimeout(() => process.exit(0), 2000).unref()
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

wss.on('connection', (ws: WebSocket) => {
  const playerId = generatePlayerId()
  console.log(`Player connected: ${playerId}`)

  send(ws, { type: 'connected', payload: { playerId } })

  ws.on('message', (data: Buffer) => {
    try {
      const message: Message = JSON.parse(data.toString())

      switch (message.type) {
        case 'create_room':
          handleCreateRoom(ws, playerId)
          break
        case 'join_room':
          handleJoinRoom(ws, playerId, (message.payload as { roomId: string })?.roomId)
          break
        case 'move':
          {
            const roomId = playerToRoom.get(playerId)
            if (roomId) {
              const room = rooms.get(roomId)
              if (room) handleMove(room, playerId, (message.payload as { column: number }).column)
            }
          }
          break
        case 'start':
          {
            const roomId = playerToRoom.get(playerId)
            if (roomId) {
              const room = rooms.get(roomId)
              if (room) handleStart(room, playerId)
            }
          }
          break
        case 'rematch':
          {
            const roomId = playerToRoom.get(playerId)
            if (roomId) {
              const room = rooms.get(roomId)
              if (room) handleRematch(room, playerId)
            }
          }
          break
      }
    } catch (error) {
      console.error('Error processing message:', error)
    }
  })

  ws.on('close', () => {
    console.log(`Player disconnected: ${playerId}`)
    handleLeave(playerId)
  })

  ws.on('error', (error) => {
    console.error(`WebSocket error for ${playerId}:`, error)
    handleLeave(playerId)
  })
})