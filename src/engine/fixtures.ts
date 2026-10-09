import type { Board, Cell } from './types'

/**
 * A complete 42-move game that ends in a draw, generated once and replayed
 * in tests to obtain a full board without any four-in-a-row.
 */
export const DRAW_MOVES = [
  0, 6, 5, 4, 3, 2, 1, 0, 6, 5, 4, 3, 2, 1, 0, 6, 5, 4, 3, 2, 1, 0, 0, 6, 5, 4, 3, 2, 0, 6, 5, 4, 3,
  2, 1, 1, 6, 5, 4, 3, 2, 1,
]

/** Resulting board of DRAW_MOVES: full, with no winner. */
export const DRAW_ROWS = [
  'rbrbrbr',
  'rbbrbrb',
  'brbrbrb',
  'rrbrbrb',
  'bbrbrbr',
  'rrbrbrb',
]

export function fromRows(rows: string[]): Board {
  return rows.map((row) =>
    [...row].map<Cell>((ch) => (ch === 'r' ? 'red' : ch === 'b' ? 'blue' : null)),
  )
}
