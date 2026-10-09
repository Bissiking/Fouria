export type Player = 'red' | 'blue'

export type Cell = Player | null

export type Board = Cell[][]

export type GameStatus = 'playing' | 'won' | 'draw'

export type GameMode = 'pvp' | 'ai'

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Position {
  row: number
  col: number
}

export interface GameState {
  board: Board
  currentPlayer: Player
  status: GameStatus
  winner: Player | null
  winningLine: Position[]
  moveCount: number
  lastMove: Position | null
}
