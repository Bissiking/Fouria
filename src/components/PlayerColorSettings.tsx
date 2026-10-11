import { useState } from 'react'
import type { GameMode, Player } from '../engine/types'
import { playerLabel } from '../types'
import {
  PLAYER_COLORS,
  boardContrast,
  colorConflict,
  discShades,
  getColor,
  type ColorId,
  type ResolvedPlayerColors,
} from '../colors'

interface PlayerColorSettingsProps {
  mode: GameMode
  colors: ResolvedPlayerColors
  onSelect: (player: Player, colorId: ColorId) => void
  onReset: () => void
}

/** Mini board snapshot used for the live token preview. */
const PREVIEW_LAYOUT: Array<Player | null> = [
  null,
  'red',
  null,
  'blue',
  'blue',
  'red',
  'blue',
  'red',
]

function previewStyle(hex: string) {
  const shades = discShades(hex)
  return {
    '--disc-hi': shades.hi,
    '--disc-base': shades.base,
    '--disc-lo': shades.lo,
  } as React.CSSProperties
}

export function PlayerColorSettings({
  mode,
  colors,
  onSelect,
  onReset,
}: PlayerColorSettingsProps) {
  const [hoverRed, setHoverRed] = useState<ColorId | null>(null)
  const [hoverBlue, setHoverBlue] = useState<ColorId | null>(null)

  const labelRed = playerLabel('red', mode)
  const labelBlue = playerLabel('blue', mode)

  const previewRed = (hoverRed ? getColor(hoverRed) : colors.red).hex
  const previewBlue = (hoverBlue ? getColor(hoverBlue) : colors.blue).hex

  const renderPicker = (player: Player) => {
    const current = colors[player]
    const other = player === 'red' ? colors.blue : colors.red
    const label = player === 'red' ? labelRed : labelBlue
    const hovered = player === 'red' ? hoverRed : hoverBlue
    const setHovered = player === 'red' ? setHoverRed : setHoverBlue

    return (
      <div>
        <div className="flex items-baseline gap-2">
          <span
            className="h-3 w-3 shrink-0 translate-y-[1px] rounded-full"
            style={{ background: current.hex }}
            aria-hidden="true"
          />
          <span className="text-sm font-semibold text-white">{label}</span>
          <span className="text-xs text-mist-dim">{current.name}</span>
        </div>

        <div
          role="radiogroup"
          aria-label={`Couleur des jetons — ${label}`}
          className="mt-3 grid grid-cols-8 gap-1.5"
        >
          {PLAYER_COLORS.map((color) => {
            const conflict = colorConflict(color, other)
            const unavailable = conflict !== null
            const selected = color.id === current.id
            const reason =
              conflict === 'identical'
                ? 'déjà utilisée par l’autre joueur'
                : conflict === 'too-close'
                  ? 'trop proche de la couleur adverse'
                  : null

            return (
              <button
                key={color.id}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-disabled={unavailable || undefined}
                tabIndex={selected ? 0 : -1}
                aria-label={`${color.name}${reason ? ` — ${reason}` : ''}`}
                title={reason ? `${color.name} — ${reason}` : color.name}
                onClick={() => {
                  if (unavailable) return
                  setHovered(null)
                  onSelect(player, color.id)
                }}
                onKeyDown={(event) => {
                  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
                  event.preventDefault()
                  const available = PLAYER_COLORS.filter(
                    (option) => colorConflict(option, other) === null,
                  )
                  const index = available.findIndex((option) => option.id === color.id)
                  const last = available.length - 1
                  const nextIndex =
                    event.key === 'ArrowLeft'
                      ? (index - 1 + available.length) % available.length
                      : event.key === 'ArrowRight'
                        ? (index + 1) % available.length
                        : event.key === 'Home'
                          ? 0
                          : last
                  const next = available[nextIndex]
                  onSelect(player, next.id)
                  const group = event.currentTarget.closest('[role="radiogroup"]')
                  const options = group?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
                  options?.[PLAYER_COLORS.findIndex((option) => option.id === next.id)]?.focus()
                }}
                onMouseEnter={() => {
                  if (!unavailable) setHovered(color.id)
                }}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => {
                  if (!unavailable) setHovered(color.id)
                }}
                onBlur={() => setHovered(null)}
                className={`relative rounded-xl p-1 transition-transform duration-150 ${
                  selected
                    ? 'bg-white/[0.08] shadow-[inset_0_0_0_1.5px_rgba(255,255,255,0.55)]'
                    : 'hover:bg-white/[0.06]'
                } ${!selected && !unavailable ? 'hover:scale-105' : ''} ${
                  unavailable ? 'cursor-not-allowed' : ''
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`block aspect-square rounded-lg ${
                    unavailable && !selected ? 'opacity-45' : ''
                  } ${reason ? 'swatch-struck' : ''}`}
                  style={{ background: color.hex }}
                />
                {selected && (
                  <span className="sr-only">sélectionnée</span>
                )}
              </button>
            )
          })}
        </div>

        <p className="mt-2 text-[11px] leading-snug text-mist-dim">
          {hovered
            ? `${getColor(hovered).name} — aperçu en direct`
            : `${current.name} · contraste sur le plateau ${boardContrast(current.hex)}`}
        </p>
      </div>
    )
  }

  return (
    <section className="panel rounded-3xl p-5" aria-labelledby="player-colors-title">
      <div className="flex items-center justify-between gap-3">
        <h2
          id="player-colors-title"
          className="text-xs font-semibold tracking-[0.2em] text-mist-dim uppercase"
        >
          Couleurs des joueurs
        </h2>
        <button
          type="button"
          className="chip shrink-0 whitespace-nowrap"
          onClick={() => {
            setHoverRed(null)
            setHoverBlue(null)
            onReset()
          }}
        >
          Par défaut
        </button>
      </div>

      <div className="mt-4 grid gap-5 sm:grid-cols-2">
        {renderPicker('red')}
        {renderPicker('blue')}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-5">
        <div
          className="board-frame shrink-0 rounded-2xl p-2"
          aria-hidden="true"
          title="Aperçu des jetons"
        >
          <div className="grid w-[152px] grid-cols-4 gap-1.5">
            {PREVIEW_LAYOUT.map((owner, index) => {
              const hex = owner === 'red' ? previewRed : owner === 'blue' ? previewBlue : null
              return (
                <div key={index} className="relative aspect-square">
                  <div className="hole absolute inset-0 rounded-full" />
                  {hex && <div className="disc" style={previewStyle(hex)} />}
                </div>
              )
            })}
          </div>
        </div>

        <p className="min-w-40 flex-1 text-xs leading-relaxed text-mist-dim">
          Les jetons adverses sont grisés : deux couleurs identiques ou trop proches seraient
          indistingables pendant la partie.{' '}
          {mode === 'ai' && "En mode IA, l'IA joue les jetons du Joueur 2."}
        </p>
      </div>
    </section>
  )
}
