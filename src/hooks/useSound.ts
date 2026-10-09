import { useCallback } from 'react'

export type SoundName = 'drop' | 'win' | 'draw' | 'click' | 'invalid'

let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor =
    window.AudioContext ??
    (window as (Window & { webkitAudioContext?: typeof AudioContext })).webkitAudioContext
  if (!Ctor) return null
  if (!audioContext) audioContext = new Ctor()
  if (audioContext.state === 'suspended') void audioContext.resume()
  return audioContext
}

interface ToneOptions {
  frequency: number
  endFrequency?: number
  type?: OscillatorType
  start?: number
  duration?: number
  volume?: number
}

function tone({ frequency, endFrequency, type = 'sine', start = 0, duration = 0.14, volume = 0.22 }: ToneOptions) {
  const ctx = getAudioContext()
  if (!ctx) return

  const now = ctx.currentTime + start
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()

  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, now)
  if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, now + duration)

  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)

  oscillator.connect(gain)
  gain.connect(ctx.destination)
  oscillator.start(now)
  oscillator.stop(now + duration + 0.03)
}

/** Synthesised sound effects: no audio files, no extra dependency. */
export function playSound(name: SoundName): void {
  switch (name) {
    case 'drop':
      tone({ frequency: 440, endFrequency: 170, duration: 0.16, volume: 0.26 })
      tone({ frequency: 920, endFrequency: 520, type: 'triangle', duration: 0.08, volume: 0.1 })
      break
    case 'win':
      ;[523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) =>
        tone({ frequency, type: 'triangle', start: index * 0.11, duration: 0.3, volume: 0.24 }),
      )
      tone({ frequency: 1318.5, type: 'triangle', start: 0.46, duration: 0.55, volume: 0.2 })
      break
    case 'draw':
      tone({ frequency: 392, endFrequency: 370, duration: 0.22, volume: 0.2 })
      tone({ frequency: 311.13, endFrequency: 290, start: 0.2, duration: 0.32, volume: 0.18 })
      break
    case 'click':
      tone({ frequency: 880, endFrequency: 660, type: 'square', duration: 0.06, volume: 0.07 })
      break
    case 'invalid':
      tone({ frequency: 150, endFrequency: 90, type: 'sawtooth', duration: 0.14, volume: 0.13 })
      break
  }
}

export function useSound(muted: boolean) {
  return useCallback((name: SoundName) => {
    if (muted) return
    playSound(name)
  }, [muted])
}
