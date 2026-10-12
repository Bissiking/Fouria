import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Board } from './components/Board'
import { MainMenu } from './components/MainMenu'
import { ScorePanel } from './components/ScorePanel'
import { IconBack, IconVolume, IconTrophy, IconPlay, IconCopy, IconWifi, IconWifiOff } from './components/icons'
import {
  DEFAULT_PLAYER_COLORS,
  resolvePlayerColors,
  type ColorId,
  type PlayerColorPreference,
} from './colors'
import { chooseMove } from './engine/ai'
import { createGame, playMove } from './engine/game'
import type { Difficulty, GameMode, GameState, Player } from './engine/types'
import { useLocalStorage } from './hooks/useLocalStorage'
import { playSound, useSound } from './hooks/useSound'
import { useWebSocket } from './hooks/useWebSocket'
import {
  DIFFICULTY_LABELS,
  EMPTY_SCORES,
  MODE_LABELS,
  playerLabel,
  type GameResult,
  type Scores,
} from './types'

const AI_PLAYER: Player = 'blue'

const SCORES_KEY = 'luma.connect.scores.v1'
const HISTORY_KEY = 'luma.connect.history.v1'
const MUTED_KEY = 'luma.connect.muted.v1'
const PREFS_KEY = 'luma.connect.prefs.v1'
const COLORS_KEY = 'luma.connect.colors.v1'

interface Preferences {
  mode: GameMode
  difficulty: Difficulty
}

export default function App() {
  const [screen, setScreen] = useState<'menu' | 'game' | 'online-lobby'>('menu')
  const [game, setGame] = useState<GameState>(createGame)
  const [aiThinking, setAiThinking] = useState(false)
  const [onlineError, setOnlineError] = useState<string | null>(null)
  const [opponentReady, setOpponentReady] = useState(false)
  const [roomCode, setRoomCode] = useState<string>('')

  const [preferences, setPreferences] = useLocalStorage<Preferences>(PREFS_KEY, {
    mode: 'pvp',
    difficulty: 'medium',
  })
  const [scores, setScores] = useLocalStorage<Scores>(SCORES_KEY, EMPTY_SCORES)
  const [history, setHistory] = useLocalStorage<GameResult[]>(HISTORY_KEY, [])
  const [muted, setMuted] = useLocalStorage<boolean>(MUTED_KEY, false)
  const [playerColors, setPlayerColors] = useLocalStorage<PlayerColorPreference>(
    COLORS_KEY,
    DEFAULT_PLAYER_COLORS,
  )

  const sound = useSound(muted)
  const { mode, difficulty } = preferences
  const colors = useMemo(() => resolvePlayerColors(playerColors), [playerColors])

  const recordResult = useCallback(
    (state: GameState) => {
      const winner: Player | 'draw' = state.winner ?? 'draw'
      if (winner === 'draw') {
        setScores((previous) => ({ ...previous, draws: previous.draws + 1 }))
      } else if (winner === 'red') {
        setScores((previous) => ({ ...previous, red: previous.red + 1 }))
      } else {
        setScores((previous) => ({ ...previous, blue: previous.blue + 1 }))
      }
      setHistory((previous) =>
        [
          {
            id: Date.now() + Math.floor(Math.random() * 1000),
            winner,
            mode,
            difficulty: mode === 'ai' ? difficulty : undefined,
            at: Date.now(),
          },
          ...previous,
        ].slice(0, 12),
      )
    },
    [mode, difficulty, setScores, setHistory],
  )

  const playColumn = useCallback(
    (column: number) => {
      const next = playMove(game, column)
      if (next === game) {
        sound('invalid')
        return
      }
      setGame(next)
      sound('drop')
      if (next.status !== 'playing') {
        sound(next.status === 'won' ? 'win' : 'draw')
        recordResult(next)
      }
    },
    [game, sound, recordResult],
  )

  const playColumnRef = useRef(playColumn)
  useEffect(() => {
    playColumnRef.current = playColumn
  }, [playColumn])

  const isAiTurn = mode === 'ai' && game.currentPlayer === AI_PLAYER
  const isOnlineMode = mode === 'online'
  const isMyTurn = isOnlineMode ? game.currentPlayer === 'red' : true

  useEffect(() => {
    if (screen !== 'game' || game.status !== 'playing' || !isAiTurn) return

    let cancelled = false
    setAiThinking(true)
    const timer = window.setTimeout(() => {
      if (cancelled) return
      setAiThinking(false)
      const column = chooseMove(game.board, AI_PLAYER, difficulty)
      if (column !== null) playColumnRef.current(column)
    }, 450)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
      setAiThinking(false)
    }
  }, [screen, game, isAiTurn, difficulty])

  const boardLocked =
    game.status !== 'playing' ||
    isAiTurn ||
    aiThinking ||
    (isOnlineMode && !isMyTurn)

  const handleColumnClick = useCallback(
    (column: number) => {
      if (boardLocked) return
      if (isOnlineMode) {
        sendMove(column)
      } else {
        playColumn(column)
      }
    },
    [boardLocked, playColumn, isOnlineMode],
  )

  const startGame = useCallback(() => {
    setGame(createGame())
    setScreen('game')
    setAiThinking(false)
    sound('click')
  }, [sound])

  const replay = useCallback(() => {
    if (isOnlineMode) {
      sendRematch()
    } else {
      setGame(createGame())
      setAiThinking(false)
      sound('click')
    }
  }, [sound, isOnlineMode])

  const goToMenu = useCallback(() => {
    if (isOnlineMode) {
      disconnect()
    }
    setGame(createGame())
    setScreen('menu')
    setAiThinking(false)
    setOnlineError(null)
    setOpponentReady(false)
    setRoomCode('')
    sound('click')
  }, [sound, isOnlineMode])

  const resetScores = useCallback(() => {
    setScores(EMPTY_SCORES)
    setHistory([])
    sound('click')
  }, [setScores, setHistory, sound])

  const updatePreferences = useCallback(
    (patch: Partial<Preferences>) => {
      setPreferences((previous) => ({ ...previous, ...patch }))
    },
    [setPreferences],
  )

  const toggleMute = useCallback(() => {
    if (muted) playSound('click')
    setMuted((previous) => !previous)
  }, [muted, setMuted])

  const changePlayerColor = useCallback(
    (player: Player, colorId: ColorId) => {
      const other = player === 'red' ? 'blue' : 'red'
      if (playerColors[other] === colorId) {
        sound('invalid')
        return
      }
      setPlayerColors((previous) => ({ ...previous, [player]: colorId }))
      sound('click')
    },
    [playerColors, setPlayerColors, sound],
  )

  const resetPlayerColors = useCallback(() => {
    setPlayerColors(DEFAULT_PLAYER_COLORS)
    sound('click')
  }, [setPlayerColors, sound])

  const {
    connected,
    player: wsPlayer,
    createRoom,
    joinRoom,
    sendMove,
    sendRematch,
    disconnect,
  } = useWebSocket({
    onConnected: () => {},
    onRoomCreated: (id, _player, gameState) => {
      setRoomCode(id)
      setScreen('online-lobby')
      setGame(gameState)
      setOpponentReady(false)
    },
    onRoomJoined: (id, _player, gameState) => {
      setRoomCode(id)
      setScreen('game')
      setGame(gameState)
      setOpponentReady(true)
    },
    onGameStart: (gameState) => {
      setScreen('game')
      setGame(gameState)
      setOpponentReady(true)
    },
    onMove: (_column, gameState) => {
      setGame(gameState)
    },
    onGameEnd: (gameState) => {
      setGame(gameState)
      sound(gameState.status === 'won' ? 'win' : 'draw')
      recordResult(gameState)
    },
    onRematchPending: () => {
      setOpponentReady(true)
    },
    onPlayerLeft: () => {
      setOpponentReady(false)
      setOnlineError('Votre adversaire a quitté la partie')
    },
    onError: (message) => {
      setOnlineError(message)
    },
  })

  const handleCreateRoom = useCallback(() => {
    setOnlineError(null)
    createRoom()
  }, [createRoom])

  const handleJoinRoom = useCallback(() => {
    if (!roomCode.trim()) return
    setOnlineError(null)
    joinRoom(roomCode.trim().toUpperCase())
  }, [joinRoom, roomCode])

  const copyRoomCode = useCallback(() => {
    navigator.clipboard.writeText(roomCode)
    sound('click')
  }, [roomCode, sound])

  if (screen === 'menu') {
    return (
      <MainMenu
        mode={mode}
        difficulty={difficulty}
        scores={scores}
        muted={muted}
        colors={colors}
        onSelectMode={(nextMode) => updatePreferences({ mode: nextMode })}
        onSelectDifficulty={(nextDifficulty) => updatePreferences({ difficulty: nextDifficulty })}
        onSelectPlayerColor={changePlayerColor}
        onResetPlayerColors={resetPlayerColors}
        onStart={startGame}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onToggleMute={toggleMute}
      />
    )
  }

  if (screen === 'online-lobby') {
    return (
      <div className="arcade-bg relative min-h-dvh">
        <div className="arcade-grid pointer-events-none absolute inset-0" />
        <div className="relative mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
          <header className="flex items-center justify-between gap-3">
            <button
              type="button"
              className="btn btn-ghost px-3.5"
              onClick={goToMenu}
              aria-label="Retour au menu"
            >
              <IconBack className="h-5 w-5" />
              <span className="hidden text-sm sm:inline">Menu</span>
            </button>

            <div className="text-center">
              <p className="text-[11px] font-semibold tracking-[0.35em] text-electric-2 uppercase">
                Fouria
              </p>
              <p className="text-xs text-mist-dim">{MODE_LABELS.online}</p>
            </div>

            <button
              type="button"
              className="btn btn-ghost px-3.5"
              onClick={toggleMute}
              aria-pressed={!muted}
              aria-label={muted ? 'Activer les sons' : 'Couper les sons'}
            >
              <IconVolume on={!muted} className="h-5 w-5" />
            </button>
          </header>

          <main className="mt-6 flex flex-col items-center gap-6">
            <div className="panel w-full max-w-md rounded-2xl p-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <span
                  className={`h-3 w-3 rounded-full ${connected ? 'bg-emerald-500' : 'bg-rose-500'}`}
                />
                <span className="text-sm text-mist">
                  {connected ? 'Connecté au serveur' : 'Connexion...'}
                </span>
              </div>

              <p className="text-xs font-semibold tracking-[0.3em] text-mist-dim uppercase mb-3">
                Code de la salle
              </p>
              <div className="flex items-center gap-3 mb-6">
                <span className="flex-1 font-mono text-2xl font-bold text-white tracking-widest bg-ink/50 px-4 py-3 rounded-xl select-all">
                  {roomCode}
                </span>
                <button
                  type="button"
                  className="btn btn-ghost p-3"
                  onClick={copyRoomCode}
                  aria-label="Copier le code"
                >
                  <IconCopy className="h-5 w-5" />
                </button>
              </div>

              <p className="text-sm text-mist-dim mb-6">
                Partagez ce code avec un ami pour jouer ensemble
              </p>

              <div className="flex items-center justify-center gap-3 text-sm text-mist-dim">
                <span className={`flex items-center gap-1.5 ${wsPlayer === 'red' ? 'text-electric-2' : 'text-mist-dim'}`}>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: colors.red.hex }} />
                  Vous (Rouge)
                </span>
                <span className="text-mist-dim">·</span>
                <span className={`flex items-center gap-1.5 ${wsPlayer === 'blue' ? 'text-electric-2' : 'text-mist-dim'}`}>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: colors.blue.hex }} />
                  Adversaire (Bleu)
                  {opponentReady && <span className="h-2 w-2 rounded-full bg-emerald-500" />}
                </span>
              </div>

              {onlineError && (
                <p className="mt-4 text-sm text-rose-400" role="alert">{onlineError}</p>
              )}
            </div>
          </main>
        </div>
      </div>
    )
  }

  const activeLabel = playerLabel(game.currentPlayer, mode)

  return (
    <div className="arcade-bg relative min-h-dvh">
      <div className="arcade-grid pointer-events-none absolute inset-0" />

      <div className="relative mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
        <header className="flex items-center justify-between gap-3">
          <button
            type="button"
            className="btn btn-ghost px-3.5"
            onClick={goToMenu}
            aria-label="Retour au menu"
          >
            <IconBack className="h-5 w-5" />
            <span className="hidden text-sm sm:inline">Menu</span>
          </button>

          <div className="text-center">
            <p className="text-[11px] font-semibold tracking-[0.35em] text-electric-2 uppercase">
              Fouria
            </p>
            <p className="text-xs text-mist-dim">
              {MODE_LABELS[mode]}
              {mode === 'ai' ? ` · ${DIFFICULTY_LABELS[difficulty]}` : ''}
              {isOnlineMode && connected && (
                <>
                  {' '}
                  <span className="flex items-center gap-1 ml-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <IconWifi className="h-3 w-3" />
                  </span>
                </>
              )}
              {isOnlineMode && !connected && (
                <>
                  {' '}
                  <span className="flex items-center gap-1 ml-1 text-rose-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                    <IconWifiOff className="h-3 w-3" />
                  </span>
                </>
              )}
            </p>
          </div>

          <button
            type="button"
            className="btn btn-ghost px-3.5"
            onClick={toggleMute}
            aria-pressed={!muted}
            aria-label={muted ? 'Activer les sons' : 'Couper les sons'}
          >
            <IconVolume on={!muted} className="h-5 w-5" />
          </button>
        </header>

        <main className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="flex flex-col gap-4">
            <div className="panel mx-auto flex w-full max-w-[640px] items-center justify-between gap-3 rounded-2xl px-4 py-3">
              <span className="flex items-center gap-3">
                <span
                  className={`h-4 w-4 rounded-full ${
                    boardLocked && game.status === 'playing' && isAiTurn ? 'anim-blink' : ''
                  }`}
                  style={{
                    background:
                      game.currentPlayer === 'red' ? colors.red.hex : colors.blue.hex,
                  }}
                />
                <span className="text-sm text-mist">
                  {game.status === 'playing' ? (
                    isAiTurn ? (
                      <>{aiThinking ? 'L\'IA réfléchit…' : 'Au tour de l\'IA'}</>
                    ) : isOnlineMode && !isMyTurn ? (
                      <>En attente de <strong className="font-semibold text-white">{activeLabel}</strong>…</>
                    ) : (
                      <>
                        Au tour de <strong className="font-semibold text-white">{activeLabel}</strong>
                      </>
                    )
                  ) : (
                    'Partie terminée'
                  )}
                </span>
              </span>
              <span className="text-[11px] tracking-wider text-mist-dim uppercase tabular-nums">
                {game.moveCount}/42
              </span>
            </div>

            <Board
              board={game.board}
              currentPlayer={game.currentPlayer}
              winningLine={game.winningLine}
              lastMove={game.lastMove}
              moveCount={game.moveCount}
              disabled={boardLocked}
              colors={{ red: colors.red.hex, blue: colors.blue.hex }}
              onColumnClick={handleColumnClick}
            />
          </div>

          <ScorePanel
            scores={scores}
            history={history}
            mode={mode}
            modeLabel={
              mode === 'ai'
                ? `${MODE_LABELS.ai} · ${DIFFICULTY_LABELS[difficulty]}`
                : MODE_LABELS[mode]
            }
            colors={colors}
            onReplay={replay}
            onResetScores={resetScores}
          />
        </main>
      </div>

      {game.status !== 'playing' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 px-4 backdrop-blur-md">
          <div className="anim-rise panel relative w-full max-w-md rounded-[28px] p-7 text-center sm:p-9">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.06]">
              <IconTrophy className="h-8 w-8 text-electric-2" />
            </div>

            <p className="text-xs font-semibold tracking-[0.3em] text-mist-dim uppercase">
              Partie terminée
            </p>
            <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl text-electric-2">
              {game.status === 'draw' ? 'Égalité !' : `${playerLabel(game.winner!, mode)} a gagné !`}
            </h2>
            <p className="mt-3 text-sm text-mist-dim">
              {game.status === 'draw'
                ? 'Aucun alignement sur cette manche. On rejoue ?'
                : `${MODE_LABELS[mode]} · ${scores.red} – ${scores.blue} au total}`}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button type="button" className="btn btn-primary flex-1" onClick={replay}>
                <IconPlay className="h-4 w-4" />
                {isOnlineMode ? 'Demander revanche' : 'Rejouer'}
              </button>
              <button type="button" className="btn btn-ghost flex-1" onClick={goToMenu}>
                Menu principal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}