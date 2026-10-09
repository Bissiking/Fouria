import { useState } from 'react'
import { COLS, ROWS, getDropRow } from '../engine/board'
import type { Board as BoardModel, Player, Position } from '../engine/types'

interface BoardProps {
  board: BoardModel
  currentPlayer: Player
  winningLine: Position[]
  lastMove: Position | null
  moveCount: number
  disabled: boolean
  onColumnClick: (column: number) => void
}

function isSamePosition(a: Position | null, row: number, col: number): boolean {
  return a !== null && a.row === row && a.col === col
}

function isWinning(winningLine: Position[], row: number, col: number): boolean {
  return winningLine.some((position) => position.row === row && position.col === col)
}

export function Board({
  board,
  currentPlayer,
  winningLine,
  lastMove,
  moveCount,
  disabled,
  onColumnClick,
}: BoardProps) {
  const [hoverColumn, setHoverColumn] = useState<number | null>(null)

  const cells: React.ReactNode[] = []

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const player = board[row][col]
      const justDropped = isSamePosition(lastMove, row, col)
      const winning = isWinning(winningLine, row, col)
      const ghost =
        player === null && !disabled && hoverColumn === col && getDropRow(board, col) === row

      cells.push(
        <div key={`${row}-${col}-${justDropped ? moveCount : 'x'}`} className="relative aspect-square">
          <div className="hole absolute inset-0 rounded-full" />
          {player && (
            <div
              className={`disc ${player === 'red' ? 'disc-red' : 'disc-blue'} ${winning ? 'anim-win' : ''} ${justDropped ? 'anim-drop' : ''}`}
              style={
                {
                  '--fall': `-${(row + 1) * 100}%`,
                  '--glow': player === 'red' ? 'rgba(255,95,86,.85)' : 'rgba(80,150,255,.85)',
                } as React.CSSProperties
              }
            />
          )}
          {ghost && (
            <div className={`disc disc-ghost ${currentPlayer === 'red' ? 'disc-red' : 'disc-blue'}`} />
          )}
        </div>,
      )
    }
  }

  return (
    <div className="board-frame mx-auto w-[min(94vw,640px)] rounded-[26px] p-[2.6%] sm:rounded-[34px]">
      <div className="relative">
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">{cells}</div>
        <div className="absolute inset-0 grid grid-cols-7 gap-1.5 sm:gap-2.5">
          {Array.from({ length: COLS }, (_, col) => (
            <button
              key={col}
              type="button"
              disabled={disabled || getDropRow(board, col) === -1}
              aria-label={`Jouer dans la colonne ${col + 1}`}
              onMouseEnter={() => setHoverColumn(col)}
              onMouseLeave={() => setHoverColumn((current) => (current === col ? null : current))}
              onFocus={() => setHoverColumn(col)}
              onBlur={() => setHoverColumn((current) => (current === col ? null : current))}
                onClick={() => {
                  setHoverColumn(null)
                  onColumnClick(col)
                }}
              className="rounded-2xl transition-colors duration-150 hover:bg-white/[0.07] disabled:hover:bg-transparent"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
