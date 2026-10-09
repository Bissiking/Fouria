import type { Difficulty, GameMode } from '../engine/types'
import {
  DIFFICULTY_HINTS,
  DIFFICULTY_LABELS,
  MODE_LABELS,
  type Scores,
} from '../types'
import { IconCpu, IconPlay, IconUsers, IconVolume } from './icons'

interface MainMenuProps {
  mode: GameMode
  difficulty: Difficulty
  scores: Scores
  muted: boolean
  onSelectMode: (mode: GameMode) => void
  onSelectDifficulty: (difficulty: Difficulty) => void
  onStart: () => void
  onToggleMute: () => void
}

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']

export function MainMenu({
  mode,
  difficulty,
  scores,
  muted,
  onSelectMode,
  onSelectDifficulty,
  onStart,
  onToggleMute,
}: MainMenuProps) {
  const modes: Array<{
    id: GameMode
    title: string
    description: string
    icon: React.ReactNode
  }> = [
    {
      id: 'pvp',
      title: MODE_LABELS.pvp,
      description: 'Deux joueurs sur le même écran, à tour de rôle.',
      icon: <IconUsers className="h-5 w-5" />,
    },
    {
      id: 'ai',
      title: MODE_LABELS.ai,
      description: 'Affrontez la machine, du débutant à l’expert.',
      icon: <IconCpu className="h-5 w-5" />,
    },
  ]

  return (
    <div className="arcade-bg relative min-h-dvh overflow-hidden">
      <div className="arcade-grid pointer-events-none absolute inset-0" />

      <main className="relative mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center gap-7 px-5 py-10">
        <header className="text-center">
          <p className="text-xs font-semibold tracking-[0.45em] text-electric-2 uppercase">
            LUMA Connect
          </p>
          <h1 className="anim-title mt-3 text-5xl font-black tracking-tight text-white sm:text-6xl">
            PUISSANCE <span className="text-coral-2">4</span>
          </h1>
          <p className="mt-3 text-sm text-mist-dim">
            Alignez quatre jetons avant votre adversaire. Arcade, local, sans compte.
          </p>
        </header>

        <section className="panel rounded-3xl p-5">
          <h2 className="text-xs font-semibold tracking-[0.2em] text-mist-dim uppercase">
            Mode de jeu
          </h2>
          <div className="mt-4 grid gap-3">
            {modes.map((option) => {
              const active = option.id === mode
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onSelectMode(option.id)}
                  data-active={active}
                  className={`flex items-center gap-4 rounded-2xl p-4 text-left transition-all duration-200 ${
                    active
                      ? 'bg-electric/12 shadow-[inset_0_0_0_1.5px_var(--color-electric)]'
                      : 'bg-white/[0.04] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] hover:bg-white/[0.07]'
                  }`}
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      active ? 'bg-electric text-white' : 'bg-white/[0.06] text-electric-2'
                    }`}
                  >
                    {option.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-white">{option.title}</span>
                    <span className="block text-sm text-mist-dim">{option.description}</span>
                  </span>
                </button>
              )
            })}
          </div>

          {mode === 'ai' && (
            <div className="mt-5">
              <h2 className="text-xs font-semibold tracking-[0.2em] text-mist-dim uppercase">
                Niveau de l’IA
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {DIFFICULTIES.map((level) => (
                  <button
                    key={level}
                    type="button"
                    className="chip"
                    data-active={level === difficulty}
                    data-tone="coral"
                    onClick={() => onSelectDifficulty(level)}
                  >
                    {DIFFICULTY_LABELS[level]}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-sm text-mist-dim">{DIFFICULTY_HINTS[difficulty]}</p>
            </div>
          )}
        </section>

        <section className="flex items-center justify-between gap-4 rounded-3xl bg-white/[0.03] px-5 py-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07)]">
          <div className="flex gap-5 text-center">
            <div>
              <div className="text-xl font-bold text-coral-2 tabular-nums">{scores.red}</div>
              <div className="text-[11px] tracking-wider text-mist-dim uppercase">Rouge</div>
            </div>
            <div>
              <div className="text-xl font-bold text-electric-2 tabular-nums">{scores.blue}</div>
              <div className="text-[11px] tracking-wider text-mist-dim uppercase">Bleu</div>
            </div>
            <div>
              <div className="text-xl font-bold text-mist tabular-nums">{scores.draws}</div>
              <div className="text-[11px] tracking-wider text-mist-dim uppercase">Nuls</div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost px-3.5"
            onClick={onToggleMute}
            aria-pressed={!muted}
            aria-label={muted ? 'Activer les sons' : 'Couper les sons'}
          >
            <IconVolume on={!muted} className="h-5 w-5" />
          </button>
        </section>

        <button type="button" className="btn btn-primary w-full py-4 text-lg" onClick={onStart}>
          <IconPlay />
          Lancer la partie
        </button>
      </main>
    </div>
  )
}
