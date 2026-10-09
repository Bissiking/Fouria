import type { Board, Cell, Player, Position } from './types'

export const ROWS = 6
export const COLS = 7
export const WIN_LENGTH = 4

const HORIZONTAL: ReadonlyArray<readonly [number, number]> = [
  [0, 1],
  [0, -1],
]
const VERTICAL: ReadonlyArray<readonly [number, number]> = [[1, 0]]
const DIAGONALS: ReadonlyArray<readonly [number, number]> = [
  [1, 1],
  [1, -1],
]

export function createEmptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(null))
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => row.slice())
}

export function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < ROWS && col >= 0 && col < COLS
}

/** Row where a disc would land, or -1 when the column is full / invalid. */
export function getDropRow(board: Board, col: number): number {
  if (col < 0 || col >= COLS) return -1
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row][col] === null) return row
  }
  return -1
}

export function isValidColumn(board: Board, col: number): boolean {
  return getDropRow(board, col) !== -1
}

export function getValidColumns(board: Board): number[] {
  const columns: number[] = []
  for (let col = 0; col < COLS; col++) {
    if (isValidColumn(board, col)) columns.push(col)
  }
  return columns
}

export function isBoardFull(board: Board): boolean {
  return getValidColumns(board).length === 0
}

export function dropDisc(
  board: Board,
  col: number,
  player: Player,
): { board: Board; row: number } | null {
  const row = getDropRow(board, col)
  if (row === -1) return null
  const next = cloneBoard(board)
  next[row][col] = player
  return { board: next, row }
}

function lineAt(
  board: Board,
  row: number,
  col: number,
  dRow: number,
  dCol: number,
  player: Player,
): Position[] {
  const line: Position[] = [{ row, col }]
  for (let step = 1; step < WIN_LENGTH; step++) {
    const nextRow = row + dRow * step
    const nextCol = col + dCol * step
    if (!inBounds(nextRow, nextCol) || board[nextRow][nextCol] !== player) break
    line.push({ row: nextRow, col: nextCol })
  }
  return line
}

function searchWin(board: Board, player: Player): Position[] {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (board[row][col] !== player) continue
      const directions = [...HORIZONTAL, ...VERTICAL, ...DIAGONALS]
      for (const [dRow, dCol] of directions) {
        const line = lineAt(board, row, col, dRow, dCol, player)
        if (line.length === WIN_LENGTH) return line
      }
    }
  }
  return []
}

/** Returns the winning line for a player, or an empty array. */
export function findWinningLine(board: Board, player: Player): Position[] {
  return searchWin(board, player)
}

export interface WinResult {
  player: Player
  line: Position[]
}

/** Detects any winner on the board (checked in the classic red-first order). */
export function getWinner(board: Board): WinResult | null {
  const red = searchWin(board, 'red')
  if (red.length > 0) return { player: 'red', line: red }
  const blue = searchWin(board, 'blue')
  if (blue.length > 0) return { player: 'blue', line: blue }
  return null
}

export function isDraw(board: Board): boolean {
  return isBoardFull(board) && getWinner(board) === null
}
