import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Board } from './components/Board'
import { EndOverlay } from './components/EndOverlay'
import { MainMenu } from './components/MainMenu'
import { ScorePanel } from './components/ScorePanel'
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
  const [screen, setScreen] = useState<'menu' | 'game'>('menu')
  const [game, setGame] = useState<GameState>(createGame)
  const [aiThinking, setAiThinking] = useState(false)

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

  const boardLocked = game.status !== 'playing' || isAiTurn || aiThinking

  const handleColumnClick = useCallback(
    (column: number) => {
      if (boardLocked) return
      playColumn(column)
    },
    [boardLocked, playColumn],
  )

  const startGame = useCallback(() => {
    setGame(createGame())
    setScreen('game')
    sound('click')
  }, [sound])

  const replay = useCallback(() => {
    setGame(createGame())
    setAiThinking(false)
    sound('click')
  }, [sound])

  const goToMenu = useCallback(() => {
    setGame(createGame())
    setScreen('menu')
    sound('click')
  }, [sound])

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
        onToggleMute={toggleMute}
      />
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
                      <>{aiThinking ? 'L’IA réfléchit…' : 'Au tour de l’IA'}</>
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
                : MODE_LABELS.pvp
            }
            colors={colors}
            onReplay={replay}
            onResetScores={resetScores}
          />
        </main>
      </div>

      {game.status !== 'playing' && (
        <EndOverlay
          winner={game.winner ?? 'draw'}
          mode={mode}
          scores={scores}
          colors={colors}
          onReplay={replay}
          onMenu={goToMenu}
        />
      )}
    </div>
  )
}
