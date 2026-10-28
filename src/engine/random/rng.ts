// Zufallszahlen mit Startwert (Seed): Derselbe Startwert liefert immer dieselbe Folge.
// Damit erzeugt dieselbe Aufgaben-Nummer immer dieselbe Aufgabe.

export type Rng = {
  // Zahl in [0, 1)
  next(): number
  // Ganze Zahl von min bis max (beide eingeschlossen)
  int(min: number, max: number): number
  pick<T>(items: readonly T[]): T
  chance(probability: number): boolean
  shuffle<T>(items: readonly T[]): T[]
}

// Macht aus beliebigem Text einen 32-Bit-Startwert (FNV-1a)
function hashString(text: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

// Verfahren „sfc32" mit vier 32-Bit-Zuständen: schnell und gut verteilt
export function createRng(seed: number | string): Rng {
  const s = typeof seed === 'string' ? seed : `seed:${seed}`
  let a = hashString(s)
  let b = hashString(`${s}|b`)
  let c = hashString(`${s}|c`)
  let d = hashString(`${s}|d`)

  function next(): number {
    a |= 0
    b |= 0
    c |= 0
    d |= 0
    const t = (((a + b) | 0) + d) | 0
    d = (d + 1) | 0
    a = b ^ (b >>> 9)
    b = (c + (c << 3)) | 0
    c = (c << 21) | (c >>> 11)
    c = (c + t) | 0
    return (t >>> 0) / 4294967296
  }

  // Erste Werte verwerfen, damit ähnliche Startwerte schnell auseinanderlaufen
  for (let i = 0; i < 12; i++) next()

  const rng: Rng = {
    next,
    int(min, max) {
      return min + Math.floor(next() * (max - min + 1))
    },
    pick(items) {
      if (items.length === 0) throw new RangeError('Leere Auswahl')
      return items[Math.floor(next() * items.length)]
    },
    chance(probability) {
      return next() < probability
    },
    shuffle(items) {
      const result = [...items]
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1))
        ;[result[i], result[j]] = [result[j], result[i]]
      }
      return result
    },
  }
  return rng
}
