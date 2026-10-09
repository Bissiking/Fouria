import { COLS, ROWS, dropDisc, getValidColumns, inBounds } from './board'
import { otherPlayer } from './game'
import type { Board, Difficulty, Player } from './types'

const DIRECTIONS: ReadonlyArray<readonly [number, number]> = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
]

const WIN_SCORE = 100_000

const HARD_DEPTH = 7

function randomChoice(values: number[]): number {
  return values[Math.floor(Math.random() * values.length)]
}

/** Win through the cell that was just played (cheap incremental detection). */
function findWinThrough(board: Board, row: number, col: number): Player | null {
  const player = board[row][col]
  if (!player) return null
  for (const [dRow, dCol] of DIRECTIONS) {
    let count = 1
    for (const sign of [1, -1]) {
      let nextRow = row + dRow * sign
      let nextCol = col + dCol * sign
      while (inBounds(nextRow, nextCol) && board[nextRow][nextCol] === player) {
        count++
        nextRow += dRow * sign
        nextCol += dCol * sign
      }
    }
    if (count >= 4) return player
  }
  return null
}

function findImmediateWin(board: Board, player: Player): number | null {
  for (const col of getValidColumns(board)) {
    const result = dropDisc(board, col, player)
    if (!result) continue
    if (findWinThrough(result.board, result.row, col) === player) return col
  }
  return null
}

function centerOrdered(columns: number[]): number[] {
  const center = Math.floor(COLS / 2)
  return [...columns].sort((a, b) => Math.abs(a - center) - Math.abs(b - center))
}

function windowScore(board: Board, row: number, col: number, dRow: number, dCol: number, ai: Player): number {
  let own = 0
  let opponent = 0
  for (let step = 0; step < 4; step++) {
    const cell = board[row + dRow * step][col + dCol * step]
    if (cell === ai) own++
    else if (cell) opponent++
  }
  if (own > 0 && opponent > 0) return 0

  if (own === 3) return 50
  if (own === 2) return 10
  if (own === 1) return 2
  if (opponent === 3) return -60
  if (opponent === 2) return -12
  if (opponent === 1) return -3
  return 0
}

function evaluate(board: Board, ai: Player): number {
  let score = 0

  const center = Math.floor(COLS / 2)
  for (let row = 0; row < ROWS; row++) {
    if (board[row][center] === ai) score += 6
    else if (board[row][center]) score -= 6
  }

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      for (const [dRow, dCol] of DIRECTIONS) {
        const endRow = row + dRow * 3
        const endCol = col + dCol * 3
        if (!inBounds(endRow, endCol)) continue
        score += windowScore(board, row, col, dRow, dCol, ai)
      }
    }
  }
  return score
}

function search(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
  ai: Player,
  lastRow: number,
  lastCol: number,
): number {
  const winner = lastRow >= 0 ? findWinThrough(board, lastRow, lastCol) : null
  if (winner) {
    return winner === ai ? WIN_SCORE + depth : -(WIN_SCORE + depth)
  }

  const columns = getValidColumns(board)
  if (columns.length === 0) return 0
  if (depth === 0) return evaluate(board, ai)

  const ordered = centerOrdered(columns)
  const player = maximizing ? ai : otherPlayer(ai)
  let best = maximizing ? -Infinity : Infinity

  for (const col of ordered) {
    const result = dropDisc(board, col, player)
    if (!result) continue
    const score = search(
      result.board,
      depth - 1,
      alpha,
      beta,
      !maximizing,
      ai,
      result.row,
      col,
    )
    if (maximizing) {
      if (score > best) best = score
      if (best > alpha) alpha = best
    } else {
      if (score < best) best = score
      if (best < beta) beta = best
    }
    if (beta <= alpha) break
  }
  return best
}

function chooseHardMove(board: Board, ai: Player): number {
  const columns = centerOrdered(getValidColumns(board))
  const immediate = findImmediateWin(board, ai)
  if (immediate !== null) return immediate

  let bestScore = -Infinity
  let bestColumns: number[] = []

  for (const col of columns) {
    const result = dropDisc(board, col, ai)
    if (!result) continue
    const score = search(
      result.board,
      HARD_DEPTH - 1,
      -Infinity,
      Infinity,
      false,
      ai,
      result.row,
      col,
    )
    if (score > bestScore) {
      bestScore = score
      bestColumns = [col]
    } else if (score === bestScore) {
      bestColumns.push(col)
    }
  }

  if (bestColumns.length === 0) return randomChoice(columns)
  return randomChoice(bestColumns)
}

function chooseMediumMove(board: Board, ai: Player): number {
  const columns = getValidColumns(board)
  const winning = findImmediateWin(board, ai)
  if (winning !== null) return winning

  const block = findImmediateWin(board, otherPlayer(ai))
  if (block !== null) return block

  const safe: number[] = []
  const risky: number[] = []
  const opponent = otherPlayer(ai)
  for (const col of columns) {
    const result = dropDisc(board, col, ai)
    if (!result) continue
    const letsOpponentWin = findImmediateWin(result.board, opponent) !== null
    if (letsOpponentWin) risky.push(col)
    else safe.push(col)
  }

  const pool = safe.length > 0 ? safe : columns
  const ordered = centerOrdered(pool)
  const spread = ordered.slice(0, Math.min(3, ordered.length))
  return randomChoice(spread)
}

function chooseEasyMove(board: Board): number {
  return randomChoice(getValidColumns(board))
}

/** Returns the column chosen by the AI, or null when no move is possible. */
export function chooseMove(
  board: Board,
  aiPlayer: Player,
  difficulty: Difficulty,
): number | null {
  const columns = getValidColumns(board)
  if (columns.length === 0) return null

  switch (difficulty) {
    case 'easy':
      return chooseEasyMove(board)
    case 'medium':
      return chooseMediumMove(board, aiPlayer)
    case 'hard':
      return chooseHardMove(board, aiPlayer)
  }
}
