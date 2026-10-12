import type { GameMode, GameState, Player } from '../engine/types'
import type { ResolvedPlayerColors } from '../colors'
import { MODE_LABELS } from '../types'
import { IconFlag, IconBook, IconHourglass, IconPlay, IconRefresh } from './icons'

interface GameSidebarProps {
  mode: GameMode
  modeDetail: string
  game: GameState
  scores: { red: number; blue: number }
  labels: Record<Player, string>
  colors: ResolvedPlayerColors
  rematch?: { mine: boolean; theirs: boolean }
  onAbandon: () => void
  onRules: () => void
  onReplay: () => void
}

export function GameSidebar({
  mode,
  modeDetail,
  game,
  scores,
  labels,
  colors,
  rematch,
  onAbandon,
  onRules,
  onReplay,
}: GameSidebarProps) {
  const finished = game.status !== 'playing'
  const isDraw = game.status === 'draw'
  const winner = game.winner

  const scoreRow = (player: Player) => {
    const hex = player === 'red' ? colors.red.hex : colors.blue.hex
    return (
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2.5">
          <span
            className="h-3.5 w-3.5 rounded-full"
            style={{ background: hex, boxShadow: `0 0 10px ${hex}80` }}
            aria-hidden="true"
          />
          <span className="text-sm font-semibold text-mist">{labels[player]}</span>
        </span>
        <span className="score-num" style={{ color: hex }}>
          {scores[player]}
        </span>
      </div>
    )
  }

  return (
    <aside className="flex flex-col gap-4" aria-label="État de la partie">
      <section className="panel rounded-2xl p-5">
        <p className="micro-label">Mode</p>
        <p className="mt-1.5 font-bold text-white">{MODE_LABELS[mode]}</p>
        <p className="mt-0.5 text-[0.8rem] text-mist-dim">{modeDetail}</p>
      </section>

      <section className="panel rounded-2xl p-5">
        <p className="micro-label">Score</p>
        <div className="mt-3 flex flex-col gap-3">
          {scoreRow('red')}
          <div className="h-px bg-white/8" aria-hidden="true" />
          {scoreRow('blue')}
        </div>
      </section>

      {finished && (
        <section
          className={`panel anim-rise relative overflow-hidden rounded-2xl p-5 ${
            isDraw ? '' : 'panel-gold'
          }`}
          aria-live="polite"
        >
          <div
            className="result-banner pointer-events-none absolute inset-0"
            aria-hidden="true"
          />
          <p className="micro-label relative">{isDraw ? 'Partie terminée' : 'Victoire'}</p>
          <p
            className="relative mt-1.5 text-2xl font-extrabold tracking-wide"
            style={{
              color: isDraw ? '#c9d6f2' : winner === 'red' ? colors.red.hex : colors.blue.hex,
              textShadow: isDraw ? undefined : '0 0 22px currentColor',
            }}
          >
            {isDraw ? 'Match nul' : `${labels[winner!]} l'emporte`}
          </p>
          <p className="relative mt-1 text-[0.8rem] text-mist-dim">
            {isDraw
              ? 'Aucun alignement cette fois-ci.'
              : 'La ligne gagnante pulse sur le plateau.'}
          </p>
          <div className="relative mt-4 flex flex-col gap-2">
            {mode === 'online' ? (
              rematch?.mine ? (
                <p className="sub-panel flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[0.8rem] font-semibold text-mist-dim">
                  <IconHourglass className="h-4 w-4" />
                  En attente de l’adversaire…
                </p>
              ) : (
                <button type="button" className="btn btn-gold w-full text-sm" onClick={onReplay}>
                  <IconRefresh />
                  {rematch?.theirs ? 'Accepter la revanche' : 'Demander revanche'}
                </button>
              )
            ) : (
              <button type="button" className="btn btn-gold w-full text-sm" onClick={onReplay}>
                <IconPlay />
                Rejouer
              </button>
            )}
          </div>
        </section>
      )}

      <div className="flex flex-col gap-2.5">
        <button type="button" className="btn btn-ghost w-full justify-start text-sm" onClick={onAbandon}>
          <IconFlag className="h-4 w-4" />
          Abandonner
        </button>
        <button type="button" className="btn btn-ghost w-full justify-start text-sm" onClick={onRules}>
          <IconBook className="h-4 w-4" />
          Voir les règles
        </button>
      </div>
    </aside>
  )
}
