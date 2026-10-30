import { toLatex } from '../expr/print.ts'
import { STEP_NAMES, solveFraction } from '../fraction/solve.ts'
import { type FractionTask, taskLatex } from '../fraction/task.ts'
import type { WorkedExample } from './example.ts'
import { m } from './format.ts'

// Durchgerechnetes Beispiel für eine Lernkarte zu Brüchen: der Rechenweg der Bruch-Engine, je
// Schritt eine Zeile mit dem ganzen Zwischenstand

export function fractionExample(t: FractionTask): WorkedExample {
  const solution = solveFraction(t)
  const lines = solution.steps.map((step) => {
    if (step.kind === 'lcd') return { label: `${STEP_NAMES.lcd}:`, latex: toLatex(step.detail!) }
    const label = step.kind === 'cancel' && step.detail ? `Kürzen durch ${m(step.detail)}:` : `${STEP_NAMES[step.kind]}:`
    return { label, latex: `= ${toLatex(step.expr!)}` }
  })
  // z. B. nach dem Malnehmen ohne Kürzen: noch ausrechnen
  const result = `= ${toLatex(solution.result)}`
  if (lines.at(-1)?.latex !== result) lines.push({ label: 'Ausrechnen:', latex: result })
  return { functionLatex: taskLatex(t), lines, result: solution.result }
}
