import { describe, expect, it } from 'vitest'
import { COLS, ROWS, dropDisc } from './board'
import { createGame, otherPlayer, playMove } from './game'
import { DRAW_MOVES } from './fixtures'
import type { GameState } from './types'

describe('gestion des tours', () => {
  it('commence toujours par rouge', () => {
    const game = createGame()
    expect(game.currentPlayer).toBe('red')
    expect(game.status).toBe('playing')
    expect(game.moveCount).toBe(0)
  })

  it('alterne les joueurs à chaque coup valide', () => {
    let game = createGame()
    for (let i = 0; i < 5; i++) {
      const next = playMove(game, i % COLS)
      expect(next).not.toBe(game)
      expect(next.currentPlayer).toBe(otherPlayer(game.currentPlayer))
      game = next
    }
    expect(game.moveCount).toBe(5)
  })

  it('ignore un coup dans une colonne pleine sans changer l état', () => {
    let game = createGame()
    for (let i = 0; i < ROWS; i++) game = playMove(game, 0)
    const before = game
    const after = playMove(game, 0)
    expect(after).toBe(before)
    expect(after.moveCount).toBe(ROWS)
  })

  it('ignore tout coup après la fin de la partie', () => {
    const game = createGame()
    const won: GameState = { ...game, status: 'won', winner: 'red', winningLine: [] }
    expect(playMove(won, 3)).toBe(won)
    const draw: GameState = { ...game, status: 'draw' }
    expect(playMove(draw, 3)).toBe(draw)
  })

  it('enregistre le dernier coup joué', () => {
    let game = createGame()
    game = playMove(game, 6)
    expect(game.lastMove).toEqual({ row: ROWS - 1, col: 6 })
    game = playMove(game, 6)
    expect(game.lastMove).toEqual({ row: ROWS - 2, col: 6 })
  })
})

describe('fin de partie', () => {
  it('déclare une victoire horizontale et fige la partie', () => {
    let game = createGame()
    for (const col of [0, 0, 1, 1, 2, 2, 3]) game = playMove(game, col)

    expect(game.status).toBe('won')
    expect(game.winner).toBe('red')
    expect(game.winningLine).toHaveLength(4)
    expect(game.winningLine.map((p) => p.col)).toEqual([0, 1, 2, 3])
    expect(game.winningLine.every((p) => p.row === ROWS - 1)).toBe(true)
    expect(game.currentPlayer).toBe('blue')
  })

  it('déclare une victoire verticale', () => {
    let game = createGame()
    for (const col of [3, 4, 3, 4, 3, 4, 3]) game = playMove(game, col)

    expect(game.status).toBe('won')
    expect(game.winner).toBe('red')
    expect(game.winningLine.map((p) => p.col)).toEqual([3, 3, 3, 3])
    expect(game.winningLine.map((p) => p.row)).toEqual([2, 3, 4, 5])
  })

  it('détecte une égalité en fin de partie', () => {
    let game = createGame()
    for (const col of DRAW_MOVES) {
      const next = playMove(game, col)
      expect(next).not.toBe(game)
      game = next
    }

    expect(game.status).toBe('draw')
    expect(game.winner).toBeNull()
    expect(game.winningLine).toEqual([])
    expect(game.moveCount).toBe(ROWS * COLS)
    expect(playMove(game, 0)).toBe(game)
  })
})

describe('utilitaires', () => {
  it('otherPlayer inverse le joueur', () => {
    expect(otherPlayer('red')).toBe('blue')
    expect(otherPlayer('blue')).toBe('red')
  })

  it('createGame produit une grille indépendante', () => {
    const a = createGame()
    const b = createGame()
    dropDisc(a.board, 0, 'red')
    expect(b.board.flat().every((cell) => cell === null)).toBe(true)
  })
})
