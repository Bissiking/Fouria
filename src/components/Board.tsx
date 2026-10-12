import { useMemo, useState } from 'react'
import { COLS, ROWS, getDropRow } from '../engine/board'
import type { Board as BoardModel, Player, Position } from '../engine/types'
import { discShades, withAlpha } from '../colors'

interface BoardProps {
  board: BoardModel
  currentPlayer: Player
  winningLine: Position[]
  lastMove: Position | null
  moveCount: number
  disabled: boolean
  colors: Record<Player, string>
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
  colors,
  onColumnClick,
}: BoardProps) {
  const [hoverColumn, setHoverColumn] = useState<number | null>(null)

  const shadeStyles = useMemo(() => {
    const build = (hex: string) => {
      const shades = discShades(hex)
      return {
        '--disc-hi': shades.hi,
        '--disc-base': shades.base,
        '--disc-lo': shades.lo,
        '--glow': withAlpha(hex, 0.85),
      } as React.CSSProperties
    }
    return { red: build(colors.red), blue: build(colors.blue) }
  }, [colors.red, colors.blue])

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
              className={`disc ${winning ? 'anim-win' : ''} ${justDropped ? 'anim-drop' : ''}`}
              style={
                {
                  ...shadeStyles[player],
                  '--fall': `-${(row + 1) * 100}%`,
                } as React.CSSProperties
              }
            />
          )}
          {ghost && <div className="disc disc-ghost" style={shadeStyles[currentPlayer]} />}
        </div>,
      )
    }
  }

  return (
    <div className="mx-auto w-[min(94vw,640px)]">
      <div className="board-frame rounded-[26px] p-[2.6%] sm:rounded-[34px]">
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

      <div className="mt-2.5 grid grid-cols-7 gap-1.5 px-[2.6%] sm:gap-2.5" aria-hidden="true">
        {Array.from({ length: COLS }, (_, col) => {
          const columnFull = getDropRow(board, col) === -1
          const active = !disabled && !columnFull && hoverColumn === col
          return (
            <span key={col} className="text-center">
              <span
                className={`mx-auto block h-1.5 w-1.5 rounded-full transition-all duration-150 ${
                  active ? 'bg-blue-hi shadow-[0_0_10px_rgba(110,168,255,0.9)]' : 'bg-white/15'
                }`}
              />
              <span className="col-num mt-1 block" data-active={active}>
                {col + 1}
              </span>
            </span>
          )
        })}
      </div>
    </div>
  )
}
