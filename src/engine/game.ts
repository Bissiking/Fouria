import { createEmptyBoard, dropDisc, getWinner, isDraw, isValidColumn } from './board'
import type { GameState, Player } from './types'

export function createGame(): GameState {
  return {
    board: createEmptyBoard(),
    currentPlayer: 'red',
    status: 'playing',
    winner: null,
    winningLine: [],
    moveCount: 0,
    lastMove: null,
  }
}

export function otherPlayer(player: Player): Player {
  return player === 'red' ? 'blue' : 'red'
}

/**
 * Plays a disc in a column. Returns the exact same object when the move is
 * illegal (full column, wrong turn, finished game) so callers can use `===`
 * to detect a no-op.
 */
export function playMove(state: GameState, col: number): GameState {
  if (state.status !== 'playing') return state
  if (!isValidColumn(state.board, col)) return state

  const player = state.currentPlayer
  const result = dropDisc(state.board, col, player)
  if (!result) return state

  const win = getWinner(result.board)
  const draw = win === null && isDraw(result.board)

  return {
    board: result.board,
    currentPlayer: otherPlayer(player),
    status: win ? 'won' : draw ? 'draw' : 'playing',
    winner: win ? win.player : null,
    winningLine: win ? win.line : [],
    moveCount: state.moveCount + 1,
    lastMove: { row: result.row, col },
  }
}

export function resetGame(): GameState {
  return createGame()
}
