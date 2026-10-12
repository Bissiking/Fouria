import { useState } from 'react'
import type { Player } from '../engine/types'
import type { ResolvedPlayerColors } from '../colors'
import { IconBack, IconCheck, IconCopy, IconHourglass, IconPlay, IconWifi } from './icons'

interface OnlineScreenProps {
  connected: boolean
  inLobby: boolean
  roomCode: string
  player: Player | null
  isHost: boolean
  opponentPresent: boolean
  colors: ResolvedPlayerColors
  error: string | null
  onCreate: () => void
  onJoin: (code: string) => void
  onCopy: () => void
  onLaunch: () => void
  onBack: () => void
}

export function OnlineScreen({
  connected,
  inLobby,
  roomCode,
  player,
  isHost,
  opponentPresent,
  colors,
  error,
  onCreate,
  onJoin,
  onCopy,
  onLaunch,
  onBack,
}: OnlineScreenProps) {
  const [joinCode, setJoinCode] = useState('')

  const statusDot = (ready: boolean) =>
    ready ? (
      <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
        <IconCheck className="h-3.5 w-3.5" />
        Prêt
      </span>
    ) : (
      <span className="flex items-center gap-1.5 text-xs font-bold text-mist-dim">
        <IconHourglass className="h-3.5 w-3.5" />
        En attente
      </span>
    )

  const playerRow = (slot: Player, present: boolean) => {
    const isYou = player === slot
    const hex = slot === 'red' ? colors.red.hex : colors.blue.hex
    return (
      <li
        className={`flex items-center justify-between gap-3 rounded-xl px-3.5 py-3 ${
          present ? 'sub-panel' : 'sub-panel opacity-55'
        }`}
      >
        <span className="flex items-center gap-3">
          <span
            className="h-3.5 w-3.5 rounded-full"
            style={{
              background: present ? hex : 'transparent',
              border: present ? 'none' : '1.5px dashed rgba(255,255,255,0.25)',
              boxShadow: present ? `0 0 10px ${hex}80` : undefined,
            }}
            aria-hidden="true"
          />
          <span className="text-sm font-semibold text-mist">
            {present ? (isYou ? 'Vous' : 'Adversaire') : 'En attente d\u2019un joueur\u2026'}
          </span>
        </span>
        {present ? statusDot(true) : null}
      </li>
    )
  }

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
            <span className="micro-label mt-1 block">Multijoueur en ligne</span>
          </p>
          <span className="flex items-center gap-2 px-3.5 text-xs text-mist-dim">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                connected ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-rose-400'
              }`}
            />
            <span className="hidden sm:inline">{connected ? 'Connecté' : 'Connexion…'}</span>
          </span>
        </header>

        {!inLobby ? (
          <main className="mt-10 flex flex-col gap-5">
            <div className="panel anim-rise rounded-3xl p-6 sm:p-8">
              <h1 className="text-2xl font-extrabold tracking-wide text-white sm:text-3xl">
                Salon multijoueur
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-mist-dim">
                Créez une salle pour obtenir un code, ou rejoignez celle d’un ami avec son code
                à six caractères. Aucun compte, aucune attente.
              </p>

              <button
                type="button"
                className="btn btn-primary mt-6 w-full py-4 text-base"
                onClick={onCreate}
                disabled={!connected}
              >
                <IconWifi className="h-5 w-5" />
                Créer une salle
              </button>
            </div>

            <div className="panel anim-rise rounded-3xl p-6 sm:p-8" style={{ animationDelay: '90ms' }}>
              <h2 className="text-lg font-bold text-white">Rejoindre une salle</h2>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="ABCDEF"
                  aria-label="Code de la salle"
                  maxLength={6}
                  value={joinCode}
                  onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && joinCode.trim().length === 6) {
                      onJoin(joinCode.trim())
                    }
                  }}
                  className="room-code w-full rounded-xl px-4 py-3.5 text-center text-xl outline-none placeholder:text-mist-dim/60 sm:w-64"
                />
                <button
                  type="button"
                  className="btn btn-gold py-3.5 sm:px-8"
                  onClick={() => onJoin(joinCode.trim())}
                  disabled={!connected || joinCode.trim().length !== 6}
                >
                  Rejoindre
                </button>
              </div>
              {error && (
                <p className="mt-4 text-sm font-semibold text-rose-400" role="alert">
                  {error}
                </p>
              )}
            </div>
          </main>
        ) : (
          <main className="mt-10">
            <div className="panel anim-rise rounded-3xl p-6 sm:p-8">
              <h1 className="text-2xl font-extrabold tracking-wide text-white">Salon multijoueur</h1>

              <p className="micro-label mt-6">Code du salon</p>
              <div className="mt-2 flex items-center gap-3">
                <span className="room-code flex-1 rounded-xl px-4 py-4 text-center text-2xl sm:text-3xl select-all">
                  {roomCode}
                </span>
                <button
                  type="button"
                  className="btn btn-ghost p-3.5"
                  onClick={onCopy}
                  aria-label="Copier le code de la salle"
                >
                  <IconCopy className="h-5 w-5" />
                </button>
              </div>
              <p className="mt-2 text-[0.8rem] text-mist-dim">
                Partagez ce code — votre ami le saisit dans « Rejoindre une salle ».
              </p>

              <ul className="mt-6 flex flex-col gap-2.5" aria-label="Joueurs de la salle">
                {playerRow('red', true)}
                {playerRow('blue', opponentPresent)}
              </ul>

              {error && (
                <p className="mt-4 text-sm font-semibold text-rose-400" role="alert">
                  {error}
                </p>
              )}

              <div className="mt-7">
                {isHost ? (
                  <button
                    type="button"
                    className="btn btn-gold w-full py-4 text-base"
                    onClick={onLaunch}
                    disabled={!opponentPresent}
                  >
                    <IconPlay className="h-5 w-5" />
                    Lancer la partie
                  </button>
                ) : (
                  <p className="sub-panel flex items-center justify-center gap-2 rounded-xl px-4 py-4 text-sm font-semibold text-mist-dim">
                    <IconHourglass className="h-4 w-4" />
                    En attente de l’hôte pour lancer…
                  </p>
                )}
              </div>
            </div>
          </main>
        )}
      </div>
    </div>
  )
}
