import type { Choice, GuidedTaskBase } from '../../guided/types.ts'
import type { Rng } from '../../random/rng.ts'
import type { NumericAnswer } from '../../quantity/judge.ts'
import { roundSignificant } from '../../quantity/numberDe.ts'
import { type Rational, parseDecimal, rat, ratEq, ratToNumber } from '../../rational.ts'
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
  // Rechnung mit Zahlen zum Eintippen (Schritte mit numeric): kommt im freien Modus dran (S8b); ein Test
  // prüft, dass jede Aufgabe dieser Rechenart mindestens einen solchen Schritt hat und die anderen keinen
  readonly free?: boolean
  // null: Diese Zufallszahlen ergeben keine brauchbare Aufgabe (der Aufrufer zieht neu)
  generate(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null
}

// Falsche Antwort aus einem Rechenfehler: Wert zum Vergleichen (gleiche Werte zählen einmal) und Inhalt
// value: bei Zahlen der Wert (für den freien Modus, S8b; tolerantWrongs setzt ihn)
export type WrongValue = { readonly rule: string; readonly key: string; readonly content: string; readonly value?: Rational }

// Zahlen der Altklausuren, die nicht vorkommen dürfen (docs/CHEMIE.md §9): gegebene Masse eines Stoffs,
// so geschrieben, wie sie in der Aufgabe stünde
export const EXAM_GIVEN_MASSES: readonly string[] = [String.raw`m(\ce{C2H6}) = 6\,\mathrm{g}`, String.raw`m(\ce{C3H8}) = 4{,}4\,\mathrm{g}`]
export const usesExamNumbers = (latex: string) => EXAM_GIVEN_MASSES.some((x) => latex.includes(x))
// Lösungen aus den Altklausuren (Stoff, Konzentration in mol/L, Volumen in mL): so nie erzeugen
export const EXAM_SOLUTIONS: readonly (readonly [string, string, number])[] = [
  ['KOH', '0.5', 250],
  ['NaOH', '1', 500],
]
export const usesExamSolution = (id: string, c: Rational, vMl: number) =>
  EXAM_SOLUTIONS.some(([s, cc, v]) => s === id && v === vMl && ratEq(c, parseDecimal(cc)!))

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
  // verglichen werden die angezeigten Werte (drei gültige Ziffern), nicht die genauen
  const shown = (r: Rational) => roundSignificant(r).value
  const kept: { rule: string; value: Rational }[] = []
  for (const w of wrong) if (apart(shown(w.value), shown(correct), 0.06) && kept.every((k) => apart(shown(w.value), shown(k.value), 0.03))) kept.push(w)
  return kept.map((w) => ({ rule: w.rule, key: latex(w.value), content: `$${latex(w.value)}$`, value: w.value }))
}

// --- Freier Modus (S8b): Zahl selbst eingeben statt auswählen ---

// Einheit für das Eingabefeld aus der Einheit hinter einer Zahl (ohne den kleinen Abstand davor)
export const unitOf = (latex: string) => latex.replace(/^\s*\\,\s*/, '').trim()

// Antwort mit Toleranz (docs/CHEMIE.md §7) aus der Lösung und den falschen Werten von tolerantWrongs (alle,
// nicht nur die drei gezeigten). unit: Einheit als LaTeX ohne Abstand davor, z. B. „\mathrm{g/mol}"
export function tolerantNumeric(correct: Rational, wrong: readonly WrongValue[], unit: string, note?: string): NumericAnswer {
  const wrongs = wrong.flatMap((w) => (w.value ? [numericWrong(w.rule, w.value)] : []))
  return { value: correct, unit, wrongs, ...(note ? { note } : {}) }
}

// Fehlerwert für den freien Modus mit „Warum ist das falsch?" des Rechenfehlers
export const numericWrong = (rule: string, value: Rational) => ({ rule, value, why: chemErrorRule(rule).why })

// Antwort, die genau stimmen muss (ganze Zahlen wie Protonen, Ladung, Anzahl), aus den Schlüsseln der Antworten
// (ganze Zahlen als Text); falsche Werte gleich der Lösung oder doppelt fallen weg
export function exactNumeric(correctKey: string, wrong: readonly WrongValue[], unit = '', note?: string): NumericAnswer {
  const seen = new Set([correctKey])
  const wrongs = wrong.flatMap((w) => {
    if (seen.has(w.key) || !/^-?\d+$/.test(w.key)) return []
    seen.add(w.key)
    return [numericWrong(w.rule, rat(BigInt(w.key)))]
  })
  return { value: rat(BigInt(correctKey)), unit, exact: true, wrongs, ...(note ? { note } : {}) }
}
