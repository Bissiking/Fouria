import type { Difficulty, GameMode, Player } from './engine/types'

export interface Scores {
  red: number
  blue: number
  draws: number
}

export interface GameResult {
  id: number
  winner: Player | 'draw'
  mode: GameMode
  difficulty?: Difficulty
  at: number
}

export const EMPTY_SCORES: Scores = { red: 0, blue: 0, draws: 0 }

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Facile',
  medium: 'Moyen',
  hard: 'Difficile',
}

export const DIFFICULTY_HINTS: Record<Difficulty, string> = {
  easy: 'Coups au hasard, idéal pour s’échauffer.',
  medium: 'Bloque les menaces et saisit ses occasions.',
  hard: 'Anticipe plusieurs coups à l’avance.',
}

export const MODE_LABELS: Record<GameMode, string> = {
  pvp: '2 joueurs',
  ai: 'Contre l IA',
}

export function playerLabel(player: Player, mode: GameMode): string {
  if (mode === 'ai') return player === 'red' ? 'Vous' : 'IA'
  return player === 'red' ? 'Joueur 1' : 'Joueur 2'
}
