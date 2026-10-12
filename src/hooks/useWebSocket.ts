import { useCallback, useEffect, useRef, useState } from 'react'
import type { GameState, Player } from '../engine/types'

interface WebSocketMessage {
  type: string
  payload?: {
    playerId?: string
    roomId?: string
    player?: Player
    game?: GameState
    column?: number
    message?: string
    hostId?: string
    readyPlayer?: Player
  }
}

interface UseWebSocketOptions {
  onConnected?: (playerId: string) => void
  onRoomCreated?: (roomId: string, player: Player, game: GameState) => void
  onRoomJoined?: (roomId: string, player: Player, game: GameState) => void
  onRoomReady?: (hostId: string) => void
  onGameStart?: (game: GameState) => void
  onMove?: (column: number, game: GameState) => void
  onGameEnd?: (game: GameState) => void
  onRematchState?: (readyPlayer: Player) => void
  onPlayerLeft?: () => void
  onError?: (message: string) => void
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const [connected, setConnected] = useState(false)
  const [roomId, setRoomId] = useState<string | null>(null)
  const [player, setPlayer] = useState<Player | null>(null)
  const [playerId, setPlayerId] = useState<string | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<number | null>(null)
  const optionsRef = useRef(options)

  optionsRef.current = options

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = import.meta.env.VITE_WS_HOST || 'localhost:3001'
    const ws = new WebSocket(`${protocol}//${host}`)

    ws.onopen = () => {
      setConnected(true)
    }

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data)
        handleMessage(message)
      } catch {
        // ignore malformed frames
      }
    }

    ws.onclose = () => {
      setConnected(false)
      reconnectTimeoutRef.current = window.setTimeout(() => {
        connect()
      }, 3000)
    }

    ws.onerror = () => {
      // the close handler drives reconnection
    }

    wsRef.current = ws
  }, [])

  const handleMessage = useCallback((message: WebSocketMessage) => {
    const opts = optionsRef.current

    switch (message.type) {
      case 'connected':
        setPlayerId(message.payload?.playerId ?? null)
        opts.onConnected?.(message.payload?.playerId ?? '')
        break

      case 'room_created':
        setRoomId(message.payload?.roomId ?? null)
        setPlayer(message.payload?.player ?? null)
        opts.onRoomCreated?.(
          message.payload?.roomId ?? '',
          message.payload?.player ?? 'red',
          message.payload?.game!,
        )
        break

      case 'room_joined':
        setRoomId(message.payload?.roomId ?? null)
        setPlayer(message.payload?.player ?? null)
        opts.onRoomJoined?.(
          message.payload?.roomId ?? '',
          message.payload?.player ?? 'blue',
          message.payload?.game!,
        )
        break

      case 'room_ready':
        opts.onRoomReady?.(message.payload?.hostId ?? '')
        break

      case 'game_start':
        opts.onGameStart?.(message.payload?.game!)
        break

      case 'move':
        opts.onMove?.(message.payload?.column ?? 0, message.payload?.game!)
        break

      case 'game_end':
        opts.onGameEnd?.(message.payload?.game!)
        break

      case 'rematch_state':
        opts.onRematchState?.(message.payload?.readyPlayer ?? 'red')
        break

      case 'player_left':
        opts.onPlayerLeft?.()
        break

      case 'error':
        opts.onError?.(message.payload?.message ?? 'Erreur inconnue')
        break
    }
  }, [])

  const createRoom = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: 'create_room' }))
  }, [])

  const joinRoom = useCallback((id: string) => {
    wsRef.current?.send(JSON.stringify({ type: 'join_room', payload: { roomId: id.toUpperCase() } }))
  }, [])

  const sendMove = useCallback((column: number) => {
    wsRef.current?.send(JSON.stringify({ type: 'move', payload: { column } }))
  }, [])

  const sendStart = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: 'start' }))
  }, [])

  const sendRematch = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: 'rematch' }))
  }, [])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    wsRef.current?.close()
    wsRef.current = null
    setConnected(false)
    setRoomId(null)
    setPlayer(null)
    setPlayerId(null)
  }, [])

  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      wsRef.current?.close()
    }
  }, [connect])

  return {
    connected,
    roomId,
    player,
    playerId,
    createRoom,
    joinRoom,
    sendMove,
    sendStart,
    sendRematch,
    disconnect,
  }
}
