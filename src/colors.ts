/**
 * Player colour identities (Fouria v1.1.0).
 *
 * The engine keeps playing with `red` / `blue` players; these ids are only a
 * presentation-layer mapping so a colour choice never touches game logic or
 * existing persisted scores/history.
 */

export type ColorId =
  | 'corail'
  | 'electrique'
  | 'ambre'
  | 'jade'
  | 'magenta'
  | 'violet'
  | 'orange'
  | 'cyan'

export interface PlayerColor {
  id: ColorId
  name: string
  hex: string
}

export interface PlayerColorPreference {
  red: ColorId
  blue: ColorId
}

export interface ResolvedPlayerColors {
  red: PlayerColor
  blue: PlayerColor
}

/** The 8 predefined colours. Every entry must stay distinguishable on the board. */
export const PLAYER_COLORS: readonly PlayerColor[] = [
  { id: 'corail', name: 'Corail', hex: '#FF6268' },
  { id: 'electrique', name: 'Électrique', hex: '#367BFF' },
  { id: 'ambre', name: 'Ambre', hex: '#FFC857' },
  { id: 'jade', name: 'Jade', hex: '#27C499' },
  { id: 'magenta', name: 'Magenta', hex: '#EC4899' },
  { id: 'violet', name: 'Violet', hex: '#8B5CF6' },
  { id: 'orange', name: 'Orange', hex: '#FF8A3D' },
  { id: 'cyan', name: 'Cyan', hex: '#22D3EE' },
]

export const DEFAULT_PLAYER_COLORS: PlayerColorPreference = {
  red: 'electrique',
  blue: 'ambre',
}

/** Background of an empty board cell: the contrast baseline for discs. */
export const BOARD_WELL = '#0A1122'

/** Minimum contrast (WCAG) a disc colour must keep against the board well. */
export const MIN_DISC_CONTRAST = 3

const COLOR_BY_ID = new Map<string, PlayerColor>(PLAYER_COLORS.map((color) => [color.id, color]))

export function getColor(id: ColorId | string | null | undefined): PlayerColor {
  return COLOR_BY_ID.get(id ?? '') ?? PLAYER_COLORS[0]
}

/**
 * Turns a persisted preference into a usable pair. Corrupt or stale values
 * fall back to the defaults, and both players are always left with distinct
 * colours (a hand-edited localStorage value cannot break the game).
 */
export function resolvePlayerColors(
  preference: Partial<PlayerColorPreference> | null | undefined,
): ResolvedPlayerColors {
  const red = COLOR_BY_ID.get(preference?.red ?? '') ?? getColor(DEFAULT_PLAYER_COLORS.red)
  let blue = COLOR_BY_ID.get(preference?.blue ?? '') ?? getColor(DEFAULT_PLAYER_COLORS.blue)
  if (blue.id === red.id) {
    blue =
      red.id === DEFAULT_PLAYER_COLORS.blue
        ? getColor(DEFAULT_PLAYER_COLORS.red)
        : getColor(DEFAULT_PLAYER_COLORS.blue)
  }
  return { red, blue }
}

/* ------------------------------------------------------------------ */
/* Colour maths (WCAG 2.x relative luminance & contrast)               */
/* ------------------------------------------------------------------ */

function linearize(channel: number): number {
  const value = channel / 255
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

export function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '')
  const full =
    normalized.length === 3
      ? normalized
          .split('')
          .map((character) => character + character)
          .join('')
      : normalized
  const value = Number.parseInt(full, 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

export function relativeLuminance(hex: string): number {
  const [red, green, blue] = hexToRgb(hex)
  return (
    0.2126 * linearize(red) + 0.7152 * linearize(green) + 0.0722 * linearize(blue)
  )
}

/** WCAG contrast ratio between two colours (1 → 21). */
export function contrastRatio(first: string, second: string): number {
  const a = relativeLuminance(first)
  const b = relativeLuminance(second)
  const lighter = Math.max(a, b)
  const darker = Math.min(a, b)
  return (lighter + 0.05) / (darker + 0.05)
}

export function hueOf(hex: string): number {
  const [red, green, blue] = hexToRgb(hex).map((channel) => channel / 255)
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const delta = max - min
  if (delta === 0) return 0
  let hue: number
  if (max === red) hue = ((green - blue) / delta) % 6
  else if (max === green) hue = (blue - red) / delta + 2
  else hue = (red - green) / delta + 4
  return (hue * 60 + 360) % 360
}

export function hueDistance(first: string, second: string): number {
  const gap = Math.abs(hueOf(first) - hueOf(second))
  return Math.min(gap, 360 - gap)
}

/** Linear sRGB mix of two hex colours; `ratio` is the weight of `to`. */
export function mix(from: string, to: string, ratio: number): string {
  const [r1, g1, b1] = hexToRgb(from)
  const [r2, g2, b2] = hexToRgb(to)
  const channel = (a: number, b: number) => Math.round(a + (b - a) * ratio)
  const toHex = (value: number) => value.toString(16).padStart(2, '0')
  return `#${toHex(channel(r1, r2))}${toHex(channel(g1, g2))}${toHex(channel(b1, b2))}`.toUpperCase()
}

/** 8-digit hex with alpha, e.g. for win glows. */
export function withAlpha(hex: string, alpha: number): string {
  const clamped = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
  return `${hex}${clamped.toString(16).padStart(2, '0').toUpperCase()}`
}

/** Physical-looking token shading derived from a single base colour. */
export function discShades(hex: string): { hi: string; base: string; lo: string } {
  return {
    hi: mix(hex, '#FFFFFF', 0.45),
    base: hex.toUpperCase(),
    lo: mix(hex, '#05070D', 0.5),
  }
}

/* ------------------------------------------------------------------ */
/* Pair validation                                                     */
/* ------------------------------------------------------------------ */

export type ColorConflict = 'identical' | 'too-close'

/**
 * Two colours are forbidden when they are the same, or when they share both
 * hue and lightness closely enough to blur together during play.
 */
export function colorConflict(
  first: PlayerColor | string,
  second: PlayerColor | string,
): ColorConflict | null {
  const a = typeof first === 'string' ? getColor(first) : first
  const b = typeof second === 'string' ? getColor(second) : second
  if (a.id === b.id) return 'identical'
  if (hueDistance(a.hex, b.hex) < 25 && contrastRatio(a.hex, b.hex) < 2) return 'too-close'
  return null
}

/** Contrast of a colour against the empty board cell, formatted for display. */
export function boardContrast(hex: string): string {
  return `${contrastRatio(hex, BOARD_WELL).toFixed(1)}:1`
}
