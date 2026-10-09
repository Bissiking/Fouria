import { DIFFICULTY_LABELS, MODE_LABELS, type GameResult, type Scores } from '../types'
import { IconRefresh, IconTrash } from './icons'

interface ScorePanelProps {
  scores: Scores
  history: GameResult[]
  modeLabel: string
  onReplay: () => void
  onResetScores: () => void
}

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

export function ScorePanel({ scores, history, modeLabel, onReplay, onResetScores }: ScorePanelProps) {
  const stats = [
    { label: 'Rouge', value: scores.red, className: 'text-coral-2', dot: 'bg-coral' },
    { label: 'Bleu', value: scores.blue, className: 'text-electric-2', dot: 'bg-electric' },
    { label: 'Égalités', value: scores.draws, className: 'text-mist', dot: 'bg-mist-dim' },
  ]

  return (
    <section className="panel rounded-3xl p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold tracking-[0.2em] text-mist-dim uppercase">Scores</h2>
        <span className="text-[11px] tracking-wider text-mist-dim uppercase">{modeLabel}</span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl bg-white/[0.04] p-3 text-center shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07)]"
          >
            <div className={`text-2xl font-bold tabular-nums ${stat.className}`}>{stat.value}</div>
            <div className="mt-1 flex items-center justify-center gap-1.5 text-[11px] text-mist-dim">
              <span className={`h-1.5 w-1.5 rounded-full ${stat.dot}`} />
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary flex-1 text-sm" onClick={onReplay}>
          <IconRefresh />
          Rejouer
        </button>
        <button type="button" className="btn btn-ghost text-sm" onClick={onResetScores}>
          <IconTrash />
          Réinitialiser
        </button>
      </div>

      <div className="mt-5">
        <h3 className="text-xs font-semibold tracking-[0.2em] text-mist-dim uppercase">
          Historique
        </h3>
        {history.length === 0 ? (
          <p className="mt-3 rounded-2xl bg-white/[0.03] px-4 py-4 text-center text-sm text-mist-dim">
            Aucune partie terminée pour le moment.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {history.slice(0, 5).map((result) => (
              <li
                key={result.id}
                className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.03] px-3.5 py-2.5 text-sm"
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      result.winner === 'red'
                        ? 'bg-coral'
                        : result.winner === 'blue'
                          ? 'bg-electric'
                          : 'bg-mist-dim'
                    }`}
                  />
                  <span className="text-mist">
                    {result.winner === 'draw'
                      ? 'Égalité'
                      : result.winner === 'red'
                        ? 'Victoire rouge'
                        : 'Victoire bleue'}
                  </span>
                </span>
                <span className="text-[11px] text-mist-dim">
                  {MODE_LABELS[result.mode]}
                  {result.difficulty ? ` · ${DIFFICULTY_LABELS[result.difficulty]}` : ''} ·{' '}
                  {formatDate(result.at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
