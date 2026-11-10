// Aufgabennummern der Wissens-Themen (Chemie, später Werkstoffkunde), Plan M4 Teil B
// „Aufgabennummern". Die Nummer hat wie in Mathe die Form „Stufe-Startwert"; der Startwert sagt, was
// gezeigt wird:
// - 1 bis 9999: Frage mit dieser Nummer in der Grundform (Fassung 0)
// - 10000 bis 499999: von der App erzeugte Rechnung (eigener Zufallsbereich, ab S2)
// - 500000 bis 999999: Frage in einer Fassung, 500000 + 50 · Fragennummer + Fassung (0 bis 49)
// Gleiche Nummer → gleiche Aufgabe. Die Fassung wählt die gezeigten falschen Antworten und ihre
// Reihenfolge.

export const QUESTION_NO_MAX = 9999
export const GENERATED_MIN = 10_000
export const GENERATED_MAX = 499_999
export const VARIANT_BASE = 500_000
export const VARIANTS = 50

export type DecodedSeed =
  | { readonly kind: 'question'; readonly no: number; readonly variant: number }
  | { readonly kind: 'generated'; readonly seed: number }

// Was hinter einem Startwert steckt; null, wenn er außerhalb aller Bereiche liegt
export function decodeSeed(seed: number): DecodedSeed | null {
  if (!Number.isInteger(seed) || seed < 1) return null
  if (seed <= QUESTION_NO_MAX) return { kind: 'question', no: seed, variant: 0 }
  if (seed <= GENERATED_MAX) return { kind: 'generated', seed }
  const offset = seed - VARIANT_BASE
  const no = Math.floor(offset / VARIANTS)
  if (no < 1 || no > QUESTION_NO_MAX) return null
  return { kind: 'question', no, variant: offset % VARIANTS }
}

// Startwert einer Frage in einer Fassung (immer im Bereich ab 500000)
export function questionSeed(no: number, variant: number): number {
  if (!Number.isInteger(no) || no < 1 || no > QUESTION_NO_MAX) throw new RangeError(`Fragennummer ${no} außerhalb von 1 bis ${QUESTION_NO_MAX}`)
  if (!Number.isInteger(variant) || variant < 0 || variant >= VARIANTS) throw new RangeError(`Fassung ${variant} außerhalb von 0 bis ${VARIANTS - 1}`)
  return VARIANT_BASE + VARIANTS * no + variant
}
