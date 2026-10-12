import { IconBack } from './icons'

interface RulesOverlayProps {
  onBack: () => void
}

const RULES: Array<{ title: string; body: string }> = [
  {
    title: 'Objectif',
    body: 'Aligner quatre de vos jetons en ligne — horizontalement, verticalement ou en diagonale — avant votre adversaire.',
  },
  {
    title: 'Déroulement',
    body: 'À votre tour, choisissez une colonne : votre jeton tombe au dernier emplacement libre. Le joueur aux jetons bleus commence chaque manche.',
  },
  {
    title: 'Victoire',
    body: 'Dès qu\u2019un alignement de quatre jetons est formé, la ligne gagnante s\u2019illumine sur le plateau et la manche est terminée.',
  },
  {
    title: 'Match nul',
    body: 'Si les 42 emplacements sont remplis sans aucun alignement, la manche est déclarée nulle.',
  },
  {
    title: 'En ligne',
    body: 'Créez une salle pour obtenir un code à six caractères, partagez-le : votre ami rejoint, vous lancez la partie. Chacun joue depuis son écran.',
  },
]

export function RulesOverlay({ onBack }: RulesOverlayProps) {
  return (
    <div className="arcade-bg fixed inset-0 z-50 overflow-y-auto">
      <div className="arcade-grid pointer-events-none fixed inset-0" />

      <div className="relative mx-auto w-full max-w-2xl px-5 py-8 sm:px-8">
        <button
          type="button"
          className="btn btn-ghost px-3.5"
          onClick={onBack}
          aria-label="Retour"
        >
          <IconBack className="h-5 w-5" />
          <span className="text-sm">Retour</span>
        </button>

        <h1 className="mt-6 text-3xl font-extrabold tracking-wide text-white sm:text-4xl">
          Règles du jeu
        </h1>
        <p className="mt-2 text-sm text-mist-dim">
          Quatre jetons à aligner. Une manche, un plateau, deux couleurs.
        </p>

        <div className="panel anim-rise mt-7 rounded-3xl p-6 sm:p-8">
          <div className="rules-prose flex flex-col gap-6">
            {RULES.map((rule) => (
              <section key={rule.title}>
                <h3>{rule.title}</h3>
                <p>{rule.body}</p>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
