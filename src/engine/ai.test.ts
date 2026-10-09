import { describe, expect, it } from 'vitest'
import { chooseMove } from './ai'
import { createEmptyBoard, dropDisc, getValidColumns } from './board'
import type { Board, Cell, Player } from './types'

function fromRows(rows: string[]): Board {
  return rows.map((row) =>
    [...row].map<Cell>((ch) => (ch === 'r' ? 'red' : ch === 'b' ? 'blue' : null)),
  )
}

describe('IA — facile', () => {
  it('joue toujours une colonne valide', () => {
    for (let i = 0; i < 30; i++) {
      const move = chooseMove(createEmptyBoard(), 'blue', 'easy')
      expect(move).not.toBeNull()
      expect(getValidColumns(createEmptyBoard())).toContain(move)
    }
  })

  it('retourne null quand la grille est pleine', () => {
    const board = fromRows([
      'rbrbrbr',
      'brbrbrb',
      'rbrbrbr',
      'brbrbrb',
      'rbrbrbr',
      'brbrbrb',
    ])
    expect(chooseMove(board, 'blue', 'hard')).toBeNull()
  })
})

describe('IA — moyen', () => {
  it('prend la victoire quand elle est disponible', () => {
    const board = fromRows(['.......', '.......', '.......', 'b......', 'b......', 'b......'])
    expect(chooseMove(board, 'blue', 'medium')).toBe(0)
  })

  it('bloque l adversaire qui menace une victoire', () => {
    const board = fromRows(['.......', '.......', '.......', 'r......', 'r......', 'r......'])
    expect(chooseMove(board, 'blue', 'medium')).toBe(0)
  })

  it('joue un coup valide sur une grille vide', () => {
    const move = chooseMove(createEmptyBoard(), 'blue', 'medium')
    expect(move).not.toBeNull()
  })
})

describe('IA — difficile', () => {
  it('gagne immédiatement quand c est possible', () => {
    const board = fromRows(['.......', '.......', '.......', 'b..r...', 'b..r...', 'b..r...'])
    expect(chooseMove(board, 'blue', 'hard')).toBe(0)
  })

  it('bloque une menace verticale adverse', () => {
    const board = fromRows(['.......', '.......', '.......', 'r......', 'r......', 'r......'])
    expect(chooseMove(board, 'blue', 'hard')).toBe(0)
  })

  it('bloque une menace horizontale adverse', () => {
    const board = fromRows([
      '.......',
      '.......',
      '.......',
      '.......',
      '.......',
      'rrr....',
    ])
    expect(chooseMove(board, 'blue', 'hard')).toBe(3)
  })

  it('joue toujours dans une colonne jouable', () => {
    const board = fromRows(['.......', '.......', '.......', 'brrr...', 'rbrb...', 'brbbr..'])
    const move = chooseMove(board, 'blue', 'hard')
    expect(getValidColumns(board)).toContain(move)
  })

  it('ne perd pas en jouant une colonne pleine', () => {
    let board = createEmptyBoard()
    for (let i = 0; i < 6; i++) board = dropDisc(board, 0, 'red')!.board
    const move = chooseMove(board, 'blue', 'hard')
    expect(move).not.toBe(0)
    expect(getValidColumns(board)).toContain(move as number)
  })
})

describe('choix adversaires', () => {
  const players: Player[] = ['red', 'blue']
  const levels = ['easy', 'medium', 'hard'] as const

  it('toutes les combinaisons joueur/niveau retournent un coup valide', () => {
    const board = fromRows(['.......', '.......', '...r...', '..br...', '.rbrb..', 'brbbr..'])
    for (const player of players) {
      for (const level of levels) {
        const move = chooseMove(board, player, level)
        expect(getValidColumns(board)).toContain(move)
      }
    }
  })
})
