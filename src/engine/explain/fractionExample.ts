import { toLatex } from '../expr/print.ts'
import { type FracSolution, STEP_NAMES, solveFraction, solveTree } from '../fraction/solve.ts'
import { type FractionTask, readableLatex, taskLatex, treeLatex } from '../fraction/task.ts'
import { withoutDecimals } from '../fraction/tree.ts'
import type { WorkedExample } from './example.ts'
import { m } from './format.ts'

// Durchgerechnetes Beispiel für eine Lernkarte zu Brüchen: der Rechenweg der Bruch-Engine, je
// Schritt eine Zeile mit dem ganzen Zwischenstand

const stepLines = (solution: FracSolution) =>
  solution.steps.map((step) => {
    if (step.kind === 'lcd') return { label: `${STEP_NAMES.lcd}:`, latex: toLatex(step.detail!) }
    const label = step.kind === 'cancel' && step.detail ? `Kürzen durch ${m(step.detail)}:` : `${STEP_NAMES[step.kind]}:`
    return { label, latex: readableLatex(`= ${step.latex ?? toLatex(step.expr!)}`) }
  })

export function fractionExample(t: FractionTask): WorkedExample {
  const solution = solveFraction(t)
  // Rechenbaum: je Teil eine Zeile mit dem Teilergebnis und dem ganzen Zwischenstand, der letzte
  // Teil mit seinem Rechenweg
  const lines =
    t.kind === 'tree'
      ? (() => {
          const tree = solveTree(t)
          const out = tree.steps[0]?.kind === 'decimal' ? [{ label: `${STEP_NAMES.decimal}:`, latex: readableLatex(`= ${treeLatex(withoutDecimals(t.root))}`) }] : []
          tree.stages.forEach((stage, i) => {
            if (i === tree.stages.length - 1) out.push(...stepLines(stage.solution))
            else out.push({ label: `Zuerst $${treeLatex(stage.node)} = ${toLatex(stage.solution.result)}$:`, latex: readableLatex(`= ${treeLatex(stage.after)}`) })
          })
          return out
        })()
      : stepLines(solution)
  // z. B. nach dem Malnehmen ohne Kürzen: noch ausrechnen
  const result = `= ${toLatex(solution.result)}`
  if (lines.at(-1)?.latex !== result) lines.push({ label: 'Ausrechnen:', latex: result })
  return { functionLatex: taskLatex(t), lines, result: solution.result }
}
