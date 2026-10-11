import { useMemo } from 'react'
import type { GameMode, Player } from '../engine/types'
import type { ResolvedPlayerColors } from '../colors'
import { MODE_LABELS, playerLabel } from '../types'
import { IconPlay, IconTrophy } from './icons'

interface EndOverlayProps {
  winner: Player | 'draw'
  mode: GameMode
  scores: { red: number; blue: number; draws: number }
  colors: ResolvedPlayerColors
  onReplay: () => void
  onMenu: () => void
}

const CONFETTI_BASE = ['#FFC857', '#F4F8FF']

interface Piece {
  id: number
  left: number
  dx: number
  spin: number
  duration: number
  delay: number
  color: string
  size: number
  radius: string
}

function buildConfetti(seed: number, palette: string[]): Piece[] {
  return Array.from({ length: 42 }, (_, index) => ({
    id: seed * 100 + index,
    left: (index * 17 + seed * 7) % 100,
    dx: ((index * 37) % 160) - 80,
    spin: 360 + ((index * 97) % 720),
    duration: 2.6 + ((index * 13) % 20) / 10,
    delay: ((index * 29) % 22) / 10,
    color: palette[index % palette.length],
    size: 7 + ((index * 11) % 9),
    radius: index % 3 === 0 ? '2px' : '999px',
  }))
}

export function EndOverlay({
  winner,
  mode,
  scores,
  colors,
  onReplay,
  onMenu,
}: EndOverlayProps) {
  const isDraw = winner === 'draw'
  const label = isDraw ? 'Match nul' : playerLabel(winner, mode)
  const accent = isDraw ? '#94A3B8' : winner === 'red' ? colors.red.hex : colors.blue.hex
  const otherHex = winner === 'blue' ? colors.red.hex : colors.blue.hex
  const confetti = useMemo(
    () =>
      buildConfetti(isDraw ? 2 : winner === 'red' ? 1 : 3, [
        accent,
        otherHex,
        ...CONFETTI_BASE,
      ]),
    [winner, isDraw, accent, otherHex],
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 px-4 backdrop-blur-md">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {confetti.map((piece) => (
          <span
            key={piece.id}
            className="confetti"
            style={
              {
                left: `${piece.left}%`,
                width: piece.size,
                height: piece.size * 1.6,
                background: piece.color,
                borderRadius: piece.radius,
                animationDuration: `${piece.duration}s`,
                animationDelay: `-${piece.delay}s`,
                '--dx': `${piece.dx}px`,
                '--spin': `${piece.spin}deg`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <div className="anim-rise panel relative w-full max-w-md rounded-[28px] p-7 text-center sm:p-9">
        <div
          className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${
            isDraw ? 'bg-white/[0.06]' : ''
          }`}
          style={isDraw ? undefined : { background: `${accent}26` }}
        >
          <span style={{ color: accent }}>
            <IconTrophy className="h-8 w-8" />
          </span>
        </div>

        <p className="text-xs font-semibold tracking-[0.3em] text-mist-dim uppercase">
          {isDraw ? 'Partie terminée' : 'Victoire'}
        </p>
        <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl" style={{ color: accent }}>
          {isDraw ? 'Égalité !' : `${label} l’emporte !`}
        </h2>
        <p className="mt-3 text-sm text-mist-dim">
          {isDraw
            ? 'Aucun alignement sur cette manche. On rejoue ?'
            : `${MODE_LABELS[mode]} · ${scores.red} – ${scores.blue} au total`}
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button type="button" className="btn btn-primary flex-1" onClick={onReplay}>
            <IconPlay className="h-4 w-4" />
            Rejouer
          </button>
          <button type="button" className="btn btn-ghost flex-1" onClick={onMenu}>
            Menu principal
          </button>
        </div>
      </div>
    </div>
  )
}
