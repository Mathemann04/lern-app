import type { BoxInputStep } from '../guided/types.ts'
import type { Verdict } from '../quantity/judge.ts'
import type { Box } from './electrons.ts'

// Orbital-Kästchen zum Antippen (N2a, Plan M4 „Besondere Eingaben“): Tippen schaltet ein Kästchen leer → ↑ → ↓ → ↑↓
// → leer. Zwei gleiche Pfeile (Pauli verletzt) lassen sich so nicht eintippen; das kommt als Bild zum Beurteilen.
// Geprüft wird je Zeile die Zahl der Elektronen und die Form nach Hund: höchstens so viele Paare wie nötig, die
// einzelnen Elektronen mit gleichem Spin (alle ↑ oder alle ↓); an welchem Platz der Zeile sie sitzen, ist egal.

export type InputBox = Exclude<Box, 'x'>

const CYCLE: Readonly<Record<InputBox, InputBox>> = { '0': 'u', u: 'd', d: '2', '2': '0' }
export const nextBox = (box: InputBox): InputBox => CYCLE[box]

const electronsIn = (boxes: readonly InputBox[]) => boxes.reduce((sum, b) => sum + (b === '2' ? 2 : b === '0' ? 0 : 1), 0)

// Zahl der Elektronen je Zeile
export const countsOf = (input: readonly (readonly InputBox[])[]) => input.map(electronsIn)

// Form einer Zeile mit der richtigen Zahl: richtig nach Hund, Paare zu früh (Hund verletzt) oder einzelne mit
// verschiedenem Spin
function rowForm(boxes: readonly InputBox[], orbitals: number): 'hund' | 'paired' | 'spin' {
  const count = electronsIn(boxes)
  const pairs = boxes.filter((b) => b === '2').length
  if (pairs > Math.max(0, count - orbitals)) return 'paired'
  const singles = boxes.filter((b) => b === 'u' || b === 'd')
  if (singles.some((b) => b !== singles[0])) return 'spin'
  return 'hund'
}

// Urteil über eine eingetippte Besetzung: richtig, typischer Fehler (Rechenfehler-Id) oder falsch
export function judgeBoxes(step: BoxInputStep, input: readonly (readonly InputBox[])[]): Verdict {
  const counts = countsOf(input)
  if (counts.every((c, i) => c === step.rows[i].count)) {
    const forms = input.map((boxes, i) => rowForm(boxes, step.rows[i].orbitals))
    if (forms.every((f) => f === 'hund')) return { kind: 'correct' }
    if (forms.includes('paired')) return { kind: 'error', rule: 'chem-el-hund' }
    return { kind: 'error', rule: 'chem-el-hund-spin' }
  }
  const alternative = step.alternatives.find((a) => a.counts.every((c, i) => c === counts[i]))
  return alternative ? { kind: 'error', rule: alternative.rule } : { kind: 'wrong' }
}

// Stimmt wenigstens die Zahl aller Elektronen? (für den Hinweis bei einer falschen Besetzung)
export const totalMatches = (step: BoxInputStep, input: readonly (readonly InputBox[])[]) =>
  countsOf(input).reduce((a, b) => a + b, 0) === step.rows.reduce((a, r) => a + r.count, 0)

// richtige Besetzung zum Zeigen (erst die Paare, dann die einzelnen ↑)
export const solutionBoxes = (step: BoxInputStep): InputBox[][] =>
  step.rows.map(({ orbitals, count }) =>
    Array.from({ length: orbitals }, (_, i): InputBox => (count >= orbitals + i + 1 ? '2' : count > i ? 'u' : '0')),
  )
