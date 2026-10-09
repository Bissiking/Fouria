import { describe, expect, it } from 'vitest'
import {
  COLS,
  ROWS,
  createEmptyBoard,
  dropDisc,
  findWinningLine,
  getDropRow,
  getValidColumns,
  getWinner,
  isBoardFull,
  isDraw,
  isValidColumn,
} from './board'
import type { Player } from './types'
import { DRAW_ROWS, fromRows } from './fixtures'

describe('grille', () => {
  it('crée une grille vide de 7 colonnes x 6 lignes', () => {
    const board = createEmptyBoard()
    expect(board).toHaveLength(ROWS)
    expect(board.every((row) => row.length === COLS)).toBe(true)
    expect(board.flat().every((cell) => cell === null)).toBe(true)
  })

  it('fait tomber les jetons jusqu au bas de la colonne', () => {
    let board = createEmptyBoard()
    expect(getDropRow(board, 3)).toBe(ROWS - 1)

    board = dropDisc(board, 3, 'red')!.board
    board = dropDisc(board, 3, 'blue')!.board

    expect(board[ROWS - 1][3]).toBe('red')
    expect(board[ROWS - 2][3]).toBe('blue')
    expect(getDropRow(board, 3)).toBe(ROWS - 3)
  })

  it('refuse un jeton dans une colonne pleine ou invalide', () => {
    let board = createEmptyBoard()
    for (let i = 0; i < ROWS; i++) {
      expect(dropDisc(board, 0, 'red')).not.toBeNull()
      board = dropDisc(board, 0, 'red')!.board
    }
    expect(dropDisc(board, 0, 'blue')).toBeNull()
    expect(isValidColumn(board, 0)).toBe(false)
    expect(getDropRow(board, 99)).toBe(-1)
    expect(dropDisc(board, -1, 'red')).toBeNull()
  })

  it('liste les colonnes jouables', () => {
    let board = createEmptyBoard()
    expect(getValidColumns(board)).toEqual([0, 1, 2, 3, 4, 5, 6])
    for (let i = 0; i < ROWS; i++) board = dropDisc(board, 6, 'red')!.board
    expect(getValidColumns(board)).toEqual([0, 1, 2, 3, 4, 5])
    expect(isBoardFull(board)).toBe(false)
  })
})

describe('détection des victoires', () => {
  const cases: Array<{ label: string; rows: string[]; player: Player }> = [
    { label: 'horizontale', rows: ['.......', '.......', '.......', '.......', '.......', 'rrrr...'], player: 'red' },
    { label: 'verticale', rows: ['.......', '.......', '...b...', '...b...', '...b...', '...b...'], player: 'blue' },
    { label: 'diagonale descendante', rows: ['.......', '.......', '...r...', '..r....', '.r.....', 'r......'], player: 'red' },
    { label: 'diagonale ascendante', rows: ['.......', '...b...', '..b....', '.b.....', 'b......', '.......'], player: 'blue' },
  ]

  for (const { label, rows, player } of cases) {
    it(`détecte une victoire ${label}`, () => {
      const board = fromRows(rows)
      const win = getWinner(board)
      expect(win?.player).toBe(player)
      expect(win?.line).toHaveLength(4)
      expect(findWinningLine(board, player)).toHaveLength(4)
    })
  }

  it('détecte une victoire même après d autres jetons', () => {
    const board = fromRows([
      '.......',
      '.......',
      '.......',
      'rb....',
      'rb....',
      'rrrr..',
    ])
    expect(getWinner(board)?.player).toBe('red')
    expect(getWinner(board)?.line).toEqual([
      { row: 5, col: 0 },
      { row: 5, col: 1 },
      { row: 5, col: 2 },
      { row: 5, col: 3 },
    ])
  })

  it('ne détecte pas de faux positif avec trois jetons alignés', () => {
    const board = fromRows(['.......', '.......', '.......', '.......', '.......', 'rrr....'])
    expect(getWinner(board)).toBeNull()
  })

  it('renvoie une ligne vide quand il n y a pas de vainqueur', () => {
    const board = createEmptyBoard()
    expect(findWinningLine(board, 'red')).toEqual([])
  })
})

describe('égalité', () => {
  it('détecte une grille complète sans vainqueur', () => {
    const board = fromRows(DRAW_ROWS)
    expect(isBoardFull(board)).toBe(true)
    expect(getWinner(board)).toBeNull()
    expect(isDraw(board)).toBe(true)
  })

  it('ne compte pas comme égalité s il y a un vainqueur', () => {
    const board = fromRows(['rrrrbrb', ...DRAW_ROWS.slice(1)])
    expect(isBoardFull(board)).toBe(true)
    expect(getWinner(board)).not.toBeNull()
    expect(isDraw(board)).toBe(false)
  })

  it('ne conclut pas à égalité tant que la grille n est pas pleine', () => {
    expect(isDraw(createEmptyBoard())).toBe(false)
  })
})
