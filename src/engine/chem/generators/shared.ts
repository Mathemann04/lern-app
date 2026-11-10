import type { Choice, GuidedTaskBase } from '../../guided/types.ts'
import type { Rng } from '../../random/rng.ts'
import { type Rational, ratToNumber } from '../../rational.ts'
import type { Level, TaskRef } from '../../tasks/taskNumber.ts'
import { chemErrorRule } from '../errorRules.ts'

// Gemeinsame Grundform der Chemie-Rechnungen (Plan M4, Teil B „Chemie-Engine", generators/*): Jeder
// Erzeuger baut aus Stufe und Zufall eine geführte Aufgabe, dazu ihre Form (Abwechslung) und den Stoff
// (derselbe Stoff kommt nie zweimal hintereinander, tasks/variety.ts).

export type ChemCalc = {
  readonly task: GuidedTaskBase
  // Form ohne Zahlen, z. B. „pne:2:symbol:ion"
  readonly form: string
  // Stoff bzw. Zusammenhang, z. B. „Cl" oder „licht-natrium"
  readonly substance: string
}

export type ChemGenerator = {
  // fest, nie umbenennen (steckt in den Formen der letzten Aufgaben)
  readonly kind: string
  // Unterthema (Id aus parts des Themas in ui/catalog.ts)
  readonly part: string
  // Anteil je Stufe; Stufen ohne Angabe haben diese Rechnung nicht
  readonly weights: Partial<Readonly<Record<Level, number>>>
  // Rechenfehler, die in dieser Rechnung vorkommen können (für gezieltes Üben)
  readonly errors: readonly string[]
  // null: Diese Zufallszahlen ergeben keine brauchbare Aufgabe (der Aufrufer zieht neu)
  generate(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null
}

// Falsche Antwort aus einem Rechenfehler: Wert zum Vergleichen (gleiche Werte zählen einmal) und Inhalt
export type WrongValue = { readonly rule: string; readonly key: string; readonly content: string }

// so viele falsche Antworten stehen höchstens neben der richtigen
export const MAX_WRONG = 3

// Antworten eines Schritts: die richtige und bis zu drei falsche, je Wert nur einmal und nie gleich der
// Lösung (die erste Regel mit diesem Wert gewinnt). focus: Diese Regel ist sicher dabei, wenn sie hier
// vorkommt. Leer, wenn kein Rechenfehler eine andere Antwort ergibt.
export function stepChoices(rng: Rng, correct: { key: string; content: string }, wrong: readonly WrongValue[], focus?: string): Choice[] {
  const seen = new Set([correct.key])
  const distinct = wrong.filter((w) => {
    if (seen.has(w.key)) return false
    seen.add(w.key)
    return true
  })
  if (distinct.length === 0) return []
  const forced = distinct.filter((w) => w.rule === focus)
  const others = rng.shuffle(distinct.filter((w) => !forced.includes(w))).slice(0, MAX_WRONG - forced.length)
  const wrongChoices: Choice[] = [...forced, ...others].map((w, i) => ({
    id: `falsch-${i + 1}`,
    content: w.content,
    correct: false,
    errorRuleId: w.rule,
    whyWrong: chemErrorRule(w.rule).why,
  }))
  return rng.shuffle([{ id: 'richtig', content: correct.content, correct: true }, ...wrongChoices])
}

// Liegen zwei Werte mindestens so weit auseinander (relativ)?
const apart = (a: Rational, b: Rational, share: number) => Math.abs(ratToNumber(a) / ratToNumber(b) - 1) >= share

// Falsche Werte bei Ergebnissen mit Toleranz (docs/CHEMIE.md §7): mindestens 6 % neben der Lösung und 3 %
// auseinander, sonst fällt der Fehler für diese Aufgabe weg. latex: Wert mit Einheit (ohne $), auch der
// Schlüssel zum Vergleichen
export function tolerantWrongs(correct: Rational, wrong: readonly { rule: string; value: Rational }[], latex: (r: Rational) => string): WrongValue[] {
  const kept: { rule: string; value: Rational }[] = []
  for (const w of wrong) if (apart(w.value, correct, 0.06) && kept.every((k) => apart(w.value, k.value, 0.03))) kept.push(w)
  return kept.map((w) => ({ rule: w.rule, key: latex(w.value), content: `$${latex(w.value)}$` }))
}
