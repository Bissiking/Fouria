import { DIFFICULTY_LABELS, MODE_LABELS, type GameResult, type Scores } from '../types'
import type { ResolvedPlayerColors } from '../colors'
import { IconBack, IconBook, IconTrash, IconVolume } from './icons'

interface SettingsScreenProps {
  muted: boolean
  scores: Scores
  history: GameResult[]
  colors: ResolvedPlayerColors
  onToggleMute: () => void
  onResetScores: () => void
  onRules: () => void
  onBack: () => void
}

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

function historyLabel(result: GameResult): string {
  if (result.winner === 'draw') return 'Égalité'
  if (result.mode === 'ai') return result.winner === 'red' ? 'Victoire' : 'Défaite'
  return result.winner === 'red' ? 'Joueur 1' : 'Joueur 2'
}

export function SettingsScreen({
  muted,
  scores,
  history,
  colors,
  onToggleMute,
  onResetScores,
  onRules,
  onBack,
}: SettingsScreenProps) {
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
            <span className="micro-label mt-1 block">Paramètres</span>
          </p>
          <span className="w-[3.5rem]" aria-hidden="true" />
        </header>

        <main className="mt-10 flex flex-col gap-5">
          <section className="panel anim-rise rounded-3xl p-6">
            <h2 className="text-lg font-bold text-white">Son</h2>
            <button
              type="button"
              className="menu-btn mt-4"
              onClick={onToggleMute}
              aria-pressed={!muted}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-blue-hi">
                <IconVolume on={!muted} className="h-5 w-5" />
              </span>
              <span>
                <span className="block">Effets sonores</span>
                <span className="block text-[0.78rem] font-normal text-mist-dim">
                  {muted ? 'Sons coupés' : 'Sons actifs'}
                </span>
              </span>
            </button>
          </section>

          <section className="panel anim-rise rounded-3xl p-6" style={{ animationDelay: '70ms' }}>
            <h2 className="text-lg font-bold text-white">Scores</h2>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { label: 'Joueur 1', value: scores.red, hex: colors.red.hex },
                { label: 'Joueur 2', value: scores.blue, hex: colors.blue.hex },
                { label: 'Égalités', value: scores.draws, hex: '#8496bd' },
              ].map((stat) => (
                <div key={stat.label} className="sub-panel rounded-2xl p-3.5 text-center">
                  <div className="score-num" style={{ color: stat.hex }}>
                    {stat.value}
                  </div>
                  <div className="micro-label mt-1.5">{stat.label}</div>
                </div>
              ))}
            </div>
            <button type="button" className="btn btn-ghost mt-4 w-full text-sm" onClick={onResetScores}>
              <IconTrash className="h-4 w-4" />
              Réinitialiser les scores
            </button>
          </section>

          <section className="panel anim-rise rounded-3xl p-6" style={{ animationDelay: '140ms' }}>
            <h2 className="text-lg font-bold text-white">Historique</h2>
            {history.length === 0 ? (
              <p className="sub-panel mt-4 rounded-2xl px-4 py-5 text-center text-sm text-mist-dim">
                Aucune partie terminée pour le moment.
              </p>
            ) : (
              <ul className="mt-4 flex flex-col gap-2">
                {history.slice(0, 8).map((result) => (
                  <li key={result.id} className="sub-panel flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-sm">
                    <span className="flex items-center gap-2.5">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          background:
                            result.winner === 'red'
                              ? colors.red.hex
                              : result.winner === 'blue'
                                ? colors.blue.hex
                                : '#8496bd',
                        }}
                      />
                      <span className="font-semibold text-mist">{historyLabel(result)}</span>
                    </span>
                    <span className="text-[0.7rem] tracking-wide text-mist-dim">
                      {MODE_LABELS[result.mode]}
                      {result.difficulty ? ` · ${DIFFICULTY_LABELS[result.difficulty]}` : ''} ·{' '}
                      {formatDate(result.at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel anim-rise rounded-3xl p-6" style={{ animationDelay: '210ms' }}>
            <button type="button" className="menu-btn" onClick={onRules}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-blue-hi">
                <IconBook className="h-5 w-5" />
              </span>
              <span>
                <span className="block">Voir les règles</span>
                <span className="block text-[0.78rem] font-normal text-mist-dim">
                  Comment gagner une manche
                </span>
              </span>
            </button>
            <p className="mt-5 text-center text-[0.7rem] tracking-wider text-mist-dim">
              Fouria — Version {__APP_VERSION__} · LUMA Games
            </p>
          </section>
        </main>
      </div>
    </div>
  )
}
