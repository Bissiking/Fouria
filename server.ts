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

const wss = new WebSocketServer({ port: 3001 })

console.log('WebSocket server running on ws://localhost:3001')

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