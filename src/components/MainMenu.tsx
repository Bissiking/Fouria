import {
  IconCpu,
  IconLuma,
  IconPalette,
  IconPlay,
  IconSettings,
  IconWifi,
} from './icons'

interface MainMenuProps {
  onPlayLocal: () => void
  onOnline: () => void
  onAi: () => void
  onCustomize: () => void
  onSettings: () => void
}

const DISC_BLUE = { hi: '#B8D4FF', base: '#367BFF', lo: '#0B2B7A', glow: 'rgba(47,123,255,0.5)' }
const DISC_GOLD = { hi: '#FFF3CE', base: '#FFC857', lo: '#7A4E08', glow: 'rgba(255,200,87,0.45)' }

function discVars(disc: typeof DISC_BLUE, tilt: number, bob: number): React.CSSProperties {
  return {
    '--disc-hi': disc.hi,
    '--disc-base': disc.base,
    '--disc-lo': disc.lo,
    '--glow': disc.glow,
    '--tilt': `${tilt}deg`,
    '--bob': `${bob}s`,
  } as React.CSSProperties
}

export function MainMenu({
  onPlayLocal,
  onOnline,
  onAi,
  onCustomize,
  onSettings,
}: MainMenuProps) {
  const actions = [
    {
      id: 'play',
      label: 'Jouer',
      description: 'Deux joueurs, le même écran',
      icon: <IconPlay className="h-5 w-5" />,
      onClick: onPlayLocal,
      variant: 'primary' as const,
    },
    {
      id: 'online',
      label: 'Multijoueur en ligne',
      description: 'Un code de salle, un ami à distance',
      icon: <IconWifi className="h-5 w-5" />,
      onClick: onOnline,
    },
    {
      id: 'ai',
      label: 'Jouer contre l\u2019IA',
      description: 'Du débutant à l\u2019expert',
      icon: <IconCpu className="h-5 w-5" />,
      onClick: onAi,
    },
    {
      id: 'customize',
      label: 'Personnalisation',
      description: 'Choisissez vos jetons',
      icon: <IconPalette className="h-5 w-5" />,
      onClick: onCustomize,
    },
    {
      id: 'settings',
      label: 'Paramètres',
      description: 'Sons et scores',
      icon: <IconSettings className="h-5 w-5" />,
      onClick: onSettings,
    },
  ]

  return (
    <div className="arcade-bg relative min-h-dvh overflow-hidden">
      <div className="arcade-grid pointer-events-none absolute inset-0" />

      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <span
          className="bokeh"
          style={{ width: 240, height: 240, left: '6%', top: '12%', background: 'rgba(47,123,255,0.5)' }}
        />
        <span
          className="bokeh"
          style={{ width: 170, height: 170, right: '8%', top: '20%', background: 'rgba(255,200,87,0.4)' }}
        />
        <span
          className="bokeh"
          style={{ width: 300, height: 300, right: '18%', bottom: '6%', background: 'rgba(47,123,255,0.35)' }}
        />
        <span
          className="bokeh"
          style={{ width: 150, height: 150, left: '14%', bottom: '14%', background: 'rgba(255,200,87,0.3)' }}
        />

        <span
          className="float-disc anim-bob hidden sm:block"
          style={{ width: 130, height: 130, left: '5%', top: '30%', ...discVars(DISC_BLUE, -14, 7) }}
        />
        <span
          className="float-disc anim-bob hidden sm:block"
          style={{ width: 170, height: 170, right: '4%', top: '48%', ...discVars(DISC_GOLD, 10, 8.5) }}
        />
        <span
          className="float-disc anim-bob hidden lg:block"
          style={{ width: 92, height: 92, right: '22%', top: '10%', ...discVars(DISC_BLUE, 18, 6) }}
        />
        <span
          className="float-disc anim-bob hidden lg:block"
          style={{ width: 110, height: 110, left: '16%', bottom: '10%', ...discVars(DISC_GOLD, -8, 9) }}
        />
        <span
          className="float-disc anim-bob sm:hidden"
          style={{ width: 90, height: 90, left: '-3%', top: '18%', ...discVars(DISC_BLUE, -14, 7) }}
        />
        <span
          className="float-disc anim-bob sm:hidden"
          style={{ width: 110, height: 110, right: '-5%', bottom: '18%', ...discVars(DISC_GOLD, 10, 8.5) }}
        />
      </div>

      <main className="relative mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center gap-8 px-5 py-12">
        <header className="text-center">
          <h1 className="anim-title logo-chrome text-[clamp(2.6rem,11vw,5.2rem)] leading-none tracking-[0.08em]">
            FOURIA
          </h1>
          <p className="micro-label mt-4 text-mist-dim">
            Stratégie <span className="text-blue-hi">·</span> Réflexion{' '}
            <span className="text-gold">·</span> Duel
          </p>
        </header>

        <nav className="flex flex-col gap-3" aria-label="Menu principal">
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              className="menu-btn anim-rise"
              data-variant={action.variant}
              style={{ animationDelay: `${actions.indexOf(action) * 70}ms` }}
              onClick={action.onClick}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  action.variant === 'primary'
                    ? 'bg-white/20 text-white'
                    : 'bg-white/[0.06] text-blue-hi'
                }`}
                aria-hidden="true"
              >
                {action.icon}
              </span>
              <span className="min-w-0">
                <span className="block">{action.label}</span>
                <span
                  className={`block text-[0.78rem] font-normal ${
                    action.variant === 'primary' ? 'text-white/75' : 'text-mist-dim'
                  }`}
                >
                  {action.description}
                </span>
              </span>
            </button>
          ))}
        </nav>

        <footer className="flex items-end justify-between gap-4 text-mist-dim">
          <div className="flex items-center gap-2.5">
            <IconLuma className="h-7 w-7 text-mist" />
            <span className="text-left">
              <span className="micro-label block">Un jeu</span>
              <span className="block text-sm font-bold tracking-wide text-mist">LUMA Games</span>
            </span>
          </div>
          <span className="font-mono text-[0.7rem] tracking-wider">Version {__APP_VERSION__}</span>
        </footer>
      </main>
    </div>
  )
}
