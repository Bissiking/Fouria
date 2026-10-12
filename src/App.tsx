import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Board } from './components/Board'
import { GameSidebar } from './components/GameSidebar'
import { MainMenu } from './components/MainMenu'
import { OnlineScreen } from './components/OnlineScreen'
import { AiSetupScreen } from './components/AiSetupScreen'
import { SettingsScreen } from './components/SettingsScreen'
import { PlayerColorSettings } from './components/PlayerColorSettings'
import { RulesOverlay } from './components/RulesOverlay'
import { IconBack, IconVolume } from './components/icons'
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
import { MODE_LABELS, EMPTY_SCORES, type GameResult, type Scores } from './types'

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

type Screen = 'menu' | 'ai-setup' | 'online' | 'customize' | 'settings' | 'game'

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu')
  const [game, setGame] = useState<GameState>(createGame)
  const [gameMode, setGameMode] = useState<GameMode>('pvp')
  const [aiThinking, setAiThinking] = useState(false)
  const [rulesOpen, setRulesOpen] = useState(false)

  const [inLobby, setInLobby] = useState(false)
  const [roomCode, setRoomCode] = useState('')
  const [opponentPresent, setOpponentPresent] = useState(false)
  const [onlineError, setOnlineError] = useState<string | null>(null)
  const [rematch, setRematch] = useState({ mine: false, theirs: false })

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
  const { difficulty } = preferences
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
            mode: gameMode,
            difficulty: gameMode === 'ai' ? difficulty : undefined,
            at: Date.now(),
          },
          ...previous,
        ].slice(0, 12),
      )
    },
    [gameMode, difficulty, setScores, setHistory],
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

  const isAiTurn = gameMode === 'ai' && game.currentPlayer === AI_PLAYER

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

  const {
    connected,
    player: wsPlayer,
    playerId,
    createRoom,
    joinRoom,
    sendMove,
    sendStart,
    sendRematch,
    disconnect,
  } = useWebSocket({
    onRoomCreated: (id, _player, gameState) => {
      setRoomCode(id)
      setInLobby(true)
      setOpponentPresent(false)
      setOnlineError(null)
      setGame(gameState)
    },
    onRoomJoined: (id, _player, gameState) => {
      setRoomCode(id)
      setInLobby(true)
      setOnlineError(null)
      setGame(gameState)
    },
    onRoomReady: () => {
      setOpponentPresent(true)
    },
    onGameStart: (gameState) => {
      setGame(gameState)
      setRematch({ mine: false, theirs: false })
      setScreen('game')
      sound('click')
    },
    onMove: (_column, gameState) => {
      setGame(gameState)
      sound('drop')
    },
    onGameEnd: (gameState) => {
      setGame(gameState)
      sound(gameState.status === 'won' ? 'win' : 'draw')
      recordResult(gameState)
    },
    onRematchState: (readyPlayer) => {
      setRematch((previous) =>
        readyPlayer === wsPlayer
          ? { ...previous, mine: true }
          : { ...previous, theirs: true },
      )
    },
    onPlayerLeft: () => {
      setOpponentPresent(false)
      setOnlineError('Votre adversaire a quitté la salle')
      setRematch({ mine: false, theirs: false })
    },
    onError: (message) => {
      setOnlineError(message)
    },
  })

  const isOnline = gameMode === 'online'
  const isHost = wsPlayer === 'red' && playerId !== null
  const myTurn = !isOnline || game.currentPlayer === wsPlayer

  const boardLocked =
    game.status !== 'playing' || isAiTurn || aiThinking || (isOnline && !myTurn)

  const handleColumnClick = useCallback(
    (column: number) => {
      if (boardLocked) return
      if (isOnline) {
        sendMove(column)
      } else {
        playColumn(column)
      }
    },
    [boardLocked, isOnline, sendMove, playColumn],
  )

  const startLocalGame = useCallback(
    (mode: GameMode) => {
      setGameMode(mode)
      setGame(createGame())
      setAiThinking(false)
      setScreen('game')
      sound('click')
    },
    [sound],
  )

  const goToMenu = useCallback(() => {
    if (gameMode === 'online') {
      disconnect()
      setInLobby(false)
      setRoomCode('')
      setOpponentPresent(false)
      setRematch({ mine: false, theirs: false })
      setOnlineError(null)
    }
    setGameMode('pvp')
    setGame(createGame())
    setAiThinking(false)
    setRulesOpen(false)
    setScreen('menu')
    sound('click')
  }, [gameMode, disconnect, sound])

  const replay = useCallback(() => {
    if (gameMode === 'online') {
      sendRematch()
      return
    }
    setGame(createGame())
    setAiThinking(false)
    sound('click')
  }, [gameMode, sendRematch, sound])

  const resetScores = useCallback(() => {
    setScores(EMPTY_SCORES)
    setHistory([])
    sound('click')
  }, [setScores, setHistory, sound])

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

  const handleCreateRoom = useCallback(() => {
    setOnlineError(null)
    createRoom()
  }, [createRoom])

  const handleJoinRoom = useCallback(
    (code: string) => {
      if (!code.trim()) return
      setOnlineError(null)
      joinRoom(code.trim().toUpperCase())
    },
    [joinRoom],
  )

  const copyRoomCode = useCallback(() => {
    navigator.clipboard.writeText(roomCode)
    sound('click')
  }, [roomCode, sound])

  if (rulesOpen) {
    return <RulesOverlay onBack={() => setRulesOpen(false)} />
  }

  if (screen === 'menu') {
    return (
      <MainMenu
        onPlayLocal={() => startLocalGame('pvp')}
        onOnline={() => {
          setGameMode('online')
          setScreen('online')
          sound('click')
        }}
        onAi={() => {
          setScreen('ai-setup')
          sound('click')
        }}
        onCustomize={() => {
          setScreen('customize')
          sound('click')
        }}
        onSettings={() => {
          setScreen('settings')
          sound('click')
        }}
      />
    )
  }

  if (screen === 'ai-setup') {
    return (
      <AiSetupScreen
        difficulty={difficulty}
        onSelect={(next) => {
          setPreferences((previous) => ({ ...previous, difficulty: next }))
          sound('click')
        }}
        onStart={() => startLocalGame('ai')}
        onBack={goToMenu}
      />
    )
  }

  if (screen === 'online') {
    return (
      <OnlineScreen
        connected={connected}
        inLobby={inLobby}
        roomCode={roomCode}
        player={wsPlayer}
        isHost={isHost}
        opponentPresent={opponentPresent}
        colors={colors}
        error={onlineError}
        onCreate={handleCreateRoom}
        onJoin={handleJoinRoom}
        onCopy={copyRoomCode}
        onLaunch={() => {
          sendStart()
          sound('click')
        }}
        onBack={goToMenu}
      />
    )
  }

  if (screen === 'customize') {
    return (
      <div className="arcade-bg relative min-h-dvh">
        <div className="arcade-grid pointer-events-none absolute inset-0" />
        <div className="relative mx-auto w-full max-w-2xl px-5 py-8 sm:px-8">
          <header className="flex items-center justify-between gap-3">
            <button type="button" className="btn btn-ghost px-3.5" onClick={goToMenu} aria-label="Retour au menu">
              <IconBack className="h-5 w-5" />
              <span className="hidden text-sm sm:inline">Menu</span>
            </button>
            <p className="text-center">
              <span className="logo-chrome text-lg tracking-[0.14em]">FOURIA</span>
              <span className="micro-label mt-1 block">Personnalisation</span>
            </p>
            <span className="w-[3.5rem]" aria-hidden="true" />
          </header>

          <main className="mt-10">
            <div className="mb-5 text-center">
              <h1 className="text-2xl font-extrabold tracking-wide text-white sm:text-3xl">
                Choix des couleurs
              </h1>
              <p className="mt-1.5 text-sm text-mist-dim">Personnalisez vos jetons</p>
            </div>

            <PlayerColorSettings
              mode="pvp"
              colors={colors}
              onSelect={changePlayerColor}
              onReset={resetPlayerColors}
            />

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button type="button" className="btn btn-ghost flex-1" onClick={goToMenu}>
                Retour
              </button>
              <button type="button" className="btn btn-primary flex-1" onClick={goToMenu}>
                Valider
              </button>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (screen === 'settings') {
    return (
      <SettingsScreen
        muted={muted}
        scores={scores}
        history={history}
        colors={colors}
        onToggleMute={toggleMute}
        onResetScores={resetScores}
        onRules={() => setRulesOpen(true)}
        onBack={goToMenu}
      />
    )
  }

  const isDraw = game.status === 'draw'
  const isFinished = game.status !== 'playing'

  const labels: Record<Player, string> = isOnline
    ? {
        red: wsPlayer === 'red' ? 'Vous' : 'Adversaire',
        blue: wsPlayer === 'blue' ? 'Vous' : 'Adversaire',
      }
    : gameMode === 'ai'
      ? { red: 'Vous', blue: 'IA' }
      : { red: 'Joueur 1', blue: 'Joueur 2' }

  const modeDetail =
    gameMode === 'ai'
      ? `Niveau ${difficulty === 'easy' ? 'facile' : difficulty === 'medium' ? 'moyen' : 'difficile'}`
      : gameMode === 'online'
        ? `Salon ${roomCode}`
        : 'Premier à 4 alignements'

  const playerPanel = (slot: Player) => {
    const hex = slot === 'red' ? colors.red.hex : colors.blue.hex
    const active = game.status === 'playing' && game.currentPlayer === slot
    const label = labels[slot]
    const pips = Math.min(scores[slot], 6)

    let stateText: string
    if (isFinished) {
      stateText = game.winner === slot ? 'Victoire' : isDraw ? 'Match nul' : 'Défaite'
    } else if (active) {
      if (gameMode === 'ai' && slot === AI_PLAYER) {
        stateText = aiThinking ? 'L\u2019IA réfléchit…' : 'Au tour de l\u2019IA'
      } else if (isOnline && slot === wsPlayer) {
        stateText = 'À vous de jouer'
      } else if (isOnline) {
        stateText = 'En attente…'
      } else {
        stateText = 'Coup en cours'
      }
    } else {
      stateText = 'Au tour adverse'
    }

    return (
      <div
        className={`panel flex min-w-0 flex-1 items-center gap-3.5 rounded-2xl px-4 py-3 transition-all duration-300 ${
          active ? 'turn-live' : isFinished ? '' : 'turn-idle'
        }`}
        style={active ? { borderColor: `${hex}66` } : undefined}
      >
        <span
          className="h-10 w-10 shrink-0 rounded-full"
          style={{
            background: `radial-gradient(circle at 32% 26%, #ffffff88 0%, ${hex} 55%, #00000066 100%)`,
            boxShadow: active ? `0 0 18px ${hex}` : `0 0 8px ${hex}66`,
          }}
          aria-hidden="true"
        />
        <span className="min-w-0">
          <span className="block truncate font-extrabold tracking-wide text-white">{label}</span>
          <span
            className={`block text-[0.72rem] font-semibold ${
              active ? 'text-white/85' : 'text-mist-dim'
            }`}
          >
            {active && game.status === 'playing' && !(gameMode === 'ai' && slot !== AI_PLAYER) && !(isOnline && slot !== wsPlayer) ? (
              <span className="anim-blink">{stateText}</span>
            ) : (
              stateText
            )}
          </span>
        </span>
        {pips > 0 && (
          <span className="ml-auto flex shrink-0 items-center gap-1" aria-label={`${scores[slot]} victoires`}>
            {Array.from({ length: pips }, (_, index) => (
              <span
                key={index}
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: hex, boxShadow: `0 0 6px ${hex}` }}
              />
            ))}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="arcade-bg relative min-h-dvh">
      <div className="arcade-grid pointer-events-none absolute inset-0" />

      <div className="relative mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-7">
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
            <p className="logo-chrome text-sm tracking-[0.28em] sm:text-base">FOURIA</p>
            <p className="micro-label mt-0.5">
              {MODE_LABELS[gameMode]}
              {isOnline ? ` · ${roomCode}` : ''}
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

        <main className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <div className="flex flex-col gap-4">
            <div className="flex items-stretch gap-2 sm:gap-3" role="group" aria-label="Joueurs">
              {playerPanel('red')}
              <span
                className="flex shrink-0 items-center px-0.5 font-black tracking-widest text-mist-dim sm:px-1"
                aria-hidden="true"
              >
                VS
              </span>
              {playerPanel('blue')}
            </div>

            {onlineError && (
              <p
                className="panel rounded-xl px-4 py-2.5 text-center text-sm font-semibold text-rose-400"
                role="alert"
              >
                {onlineError}
              </p>
            )}

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

          <GameSidebar
            mode={gameMode}
            modeDetail={modeDetail}
            game={game}
            scores={scores}
            labels={labels}
            colors={colors}
            rematch={rematch}
            onAbandon={goToMenu}
            onRules={() => setRulesOpen(true)}
            onReplay={replay}
          />
        </main>
      </div>
    </div>
  )
}
