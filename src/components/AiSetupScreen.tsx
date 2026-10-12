import { DIFFICULTY_HINTS, DIFFICULTY_LABELS } from '../types'
import type { Difficulty } from '../engine/types'
import { IconBack, IconCpu, IconPlay } from './icons'

interface AiSetupScreenProps {
  difficulty: Difficulty
  onSelect: (difficulty: Difficulty) => void
  onStart: () => void
  onBack: () => void
}

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']

export function AiSetupScreen({ difficulty, onSelect, onStart, onBack }: AiSetupScreenProps) {
  return (
    <div className="arcade-bg relative min-h-dvh">
      <div className="arcade-grid pointer-events-none absolute inset-0" />

      <div className="relative mx-auto w-full max-w-2xl px-5 py-8 sm:px-8">
        <header className="flex items-center justify-between gap-3">
          <button type="button" className="btn btn-ghost px-3.5" onClick={onBack} aria-label="Retour au menu">
            <IconBack className="h-5 w-5" />
            <span className="hidden text-sm sm:inline">Menu</span>
          </button>
          <p className="text-center">
            <span className="logo-chrome text-lg tracking-[0.14em]">FOURIA</span>
            <span className="micro-label mt-1 block">Jouer contre l’IA</span>
          </p>
          <span className="w-[3.5rem]" aria-hidden="true" />
        </header>

        <main className="mt-10">
          <div className="panel anim-rise rounded-3xl p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue/15 text-blue-hi">
                <IconCpu className="h-6 w-6" />
              </span>
              <div>
                <h1 className="text-2xl font-extrabold tracking-wide text-white sm:text-3xl">
                  Choix du niveau
                </h1>
                <p className="text-sm text-mist-dim">À vous de commencer, l’IA répondra en bleu.</p>
              </div>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {DIFFICULTIES.map((level) => {
                const active = level === difficulty
                return (
                  <button
                    key={level}
                    type="button"
                    className={`menu-btn !flex-col !items-start !gap-1.5 !p-4 ${
                      active ? '!border-blue/60 !bg-blue/12' : ''
                    }`}
                    data-active={active}
                    aria-pressed={active}
                    onClick={() => onSelect(level)}
                  >
                    <span className={`text-base ${active ? 'text-white' : 'text-mist'}`}>
                      {DIFFICULTY_LABELS[level]}
                    </span>
                    <span className="text-[0.78rem] font-normal leading-snug text-mist-dim">
                      {DIFFICULTY_HINTS[level]}
                    </span>
                  </button>
                )
              })}
            </div>

            <button type="button" className="btn btn-primary mt-7 w-full py-4 text-base" onClick={onStart}>
              <IconPlay className="h-5 w-5" />
              Lancer la partie
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}
