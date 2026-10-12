import { describe, expect, it } from 'vitest'
import {
  BOARD_WELL,
  DEFAULT_PLAYER_COLORS,
  MIN_DISC_CONTRAST,
  PLAYER_COLORS,
  boardContrast,
  colorConflict,
  contrastRatio,
  discShades,
  getColor,
  hueDistance,
  mix,
  resolvePlayerColors,
  withAlpha,
} from './colors'

describe('player colour palette', () => {
  it('ships exactly 8 predefined colours', () => {
    expect(PLAYER_COLORS).toHaveLength(8)
    expect(new Set(PLAYER_COLORS.map((color) => color.id)).size).toBe(8)
    expect(new Set(PLAYER_COLORS.map((color) => color.hex.toLowerCase())).size).toBe(8)
  })

  it('defaults to electric blue / amber gold', () => {
    expect(DEFAULT_PLAYER_COLORS).toEqual({ red: 'electrique', blue: 'ambre' })
    expect(getColor('electrique').hex).toBe('#367BFF')
    expect(getColor('ambre').hex).toBe('#FFC857')
  })

  it('keeps every colour readable against the board well', () => {
    for (const color of PLAYER_COLORS) {
      expect(
        contrastRatio(color.hex, BOARD_WELL),
        `${color.name} must reach ${MIN_DISC_CONTRAST}:1 on the board`,
      ).toBeGreaterThanOrEqual(MIN_DISC_CONTRAST)
    }
  })

  it('exposes a readable contrast figure per colour', () => {
    expect(boardContrast('#FF6268')).toMatch(/^\d+\.\d:1$/)
  })
})

describe('preference resolution', () => {
  it('passes valid preferences through', () => {
    const resolved = resolvePlayerColors({ red: 'jade', blue: 'violet' })
    expect(resolved.red.id).toBe('jade')
    expect(resolved.blue.id).toBe('violet')
  })

  it('falls back to defaults on missing or corrupt values', () => {
    expect(resolvePlayerColors(undefined).red.id).toBe('electrique')
    expect(resolvePlayerColors(undefined).blue.id).toBe('ambre')
    expect(resolvePlayerColors({ red: 'nope' as never, blue: 'nope' as never }).blue.id).toBe(
      'ambre',
    )
  })

  it('never resolves two identical colours, even from tampered storage', () => {
    const resolved = resolvePlayerColors({ red: 'ambre', blue: 'ambre' })
    expect(resolved.red.id).not.toBe(resolved.blue.id)
    const swapped = resolvePlayerColors({ red: 'electrique', blue: 'electrique' })
    expect(swapped.red.id).toBe('electrique')
    expect(swapped.blue.id).toBe('ambre')
  })
})

describe('pair validation', () => {
  it('forbids identical colours', () => {
    expect(colorConflict('corail', 'corail')).toBe('identical')
  })

  it('forbids colours that blur together (same hue family, close lightness)', () => {
    expect(colorConflict('ambre', 'orange')).toBe('too-close')
  })

  it('accepts the default pair and other distant pairs', () => {
    expect(colorConflict('electrique', 'ambre')).toBeNull()
    expect(colorConflict('corail', 'electrique')).toBeNull()
    expect(colorConflict('violet', 'cyan')).toBeNull()
    expect(colorConflict('jade', 'magenta')).toBeNull()
  })

  it('measures hue distance on the short arc', () => {
    expect(hueDistance('#FF0000', '#FF0000')).toBe(0)
    expect(hueDistance('#FF0000', '#0000FF')).toBeCloseTo(120, 0)
    expect(hueDistance('#FF0000', '#00FF00')).toBeCloseTo(120, 0)
  })
})

describe('colour maths', () => {
  it('matches known WCAG ratios', () => {
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 5)
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5)
  })

  it('mixes towards the target colour', () => {
    expect(mix('#000000', '#FFFFFF', 1)).toBe('#FFFFFF')
    expect(mix('#000000', '#FFFFFF', 0)).toBe('#000000')
    expect(mix('#FF6268', '#FF6268', 0.5)).toBe('#FF6268')
  })

  it('builds token shades around the base colour', () => {
    const shades = discShades('#FF6268')
    expect(shades.base).toBe('#FF6268')
    expect(relativeLuminanceOf(shades.hi)).toBeGreaterThan(relativeLuminanceOf(shades.base))
    expect(relativeLuminanceOf(shades.lo)).toBeLessThan(relativeLuminanceOf(shades.base))
  })

  it('appends alpha as an 8-digit hex', () => {
    expect(withAlpha('#FF6268', 1)).toBe('#FF6268FF')
    expect(withAlpha('#FF6268', 0)).toBe('#FF626800')
  })
})

function relativeLuminanceOf(hex: string): number {
  const [red, green, blue] = hex
    .replace('#', '')
    .match(/.{2}/g)!
    .map((part) => Number.parseInt(part, 16) / 255)
  const linearize = (value: number) =>
    value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  return 0.2126 * linearize(red) + 0.7152 * linearize(green) + 0.0722 * linearize(blue)
}
