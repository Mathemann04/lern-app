import { toLatex } from '../expr/print.ts'
import { num } from '../expr/types.ts'
import { factoredExpr } from '../fraction/factor.ts'
import { ansatzExpr, dividedExpr, findingEquation } from '../fraction/partial.ts'
import { type FracSolution, STEP_NAMES, nicePolyExpr, partialFactorStep, partialWork, solveFraction, solveTree } from '../fraction/solve.ts'
import { type FractionTask, limitedLatex, readableLatex, shownExpr, taskLatex, treeLatex } from '../fraction/task.ts'
import { withoutDecimals } from '../fraction/tree.ts'
import type { WorkedExample } from './example.ts'
import { m } from './format.ts'
import { compareWhere } from './fractionTexts.ts'

// Durchgerechnetes Beispiel für eine Lernkarte zu Brüchen: der Rechenweg der Bruch-Engine, je
// Schritt eine Zeile mit dem ganzen Zwischenstand

const stepLines = (solution: FracSolution) =>
  solution.steps.map((step) => {
    if (step.kind === 'lcd') return { label: `${STEP_NAMES.lcd}:`, latex: toLatex(step.detail!) }
    const label = step.kind === 'cancel' && step.detail ? `Kürzen durch ${m(step.detail)}:` : `${STEP_NAMES[step.kind]}:`
    return { label, latex: readableLatex(`= ${step.latex ?? toLatex(step.expr!)}`) }
  })

// Partialbrüche: Polynomdivision, Nenner zerlegen, Ansatz, mal den Nenner, je Zahl die Gleichung,
// aus der sie folgt
function partialLines(t: Extract<FractionTask, { kind: 'partial' }>) {
  const w = partialWork(t)
  const lines: Array<{ label: string; latex: string }> = []
  if (w.divided) lines.push({ label: `${STEP_NAMES.divide}:`, latex: `= ${toLatex(dividedExpr(w, shownExpr(t.part.den)))}` })
  if (partialFactorStep(t)) lines.push({ label: `${STEP_NAMES['factor-den']}:`, latex: `= ${toLatex(dividedExpr(w, factoredExpr(w.factored)))}` })
  lines.push({ label: `${STEP_NAMES.ansatz}:`, latex: `= ${toLatex(ansatzExpr(w.quotient, w.terms))}` })
  lines.push({ label: 'Mal den Nenner:', latex: `${toLatex(nicePolyExpr(w.rest))} = ${toLatex(w.equationRight)}` })
  for (const f of w.findings) {
    const [left, right] = findingEquation(f)
    const label = f.kind === 'insert' ? `$${w.letter} = ${toLatex(num(f.at))}$ einsetzen:` : `Zahlen ${compareWhere(w.letter, f.power)} vergleichen:`
    const equation = toLatex(right) === f.letter ? '' : `${toLatex(left)} = ${toLatex(right)} \\;\\Rightarrow\\; `
    lines.push({ label, latex: `${equation}${f.letter} = ${toLatex(num(f.value))}` })
  }
  return lines
}

// Grenzwert: jeder Zwischenstand mit dem Limes davor, zuletzt der Grenzwert
function limitLines(t: Extract<FractionTask, { kind: 'limit' }>, solution: FracSolution) {
  return solution.steps.map((step) => {
    if (step.kind === 'lcd') return { label: `${STEP_NAMES.lcd}:`, latex: toLatex(step.detail!) }
    if (step.kind === 'limit-insert' || step.kind === 'limit-value') return { label: `${STEP_NAMES[step.kind]}:`, latex: `= ${toLatex(step.expr!)}` }
    const label = step.kind === 'cancel' && step.detail ? `Kürzen durch ${m(step.detail)}:` : `${STEP_NAMES[step.kind]}:`
    return { label, latex: readableLatex(`= ${limitedLatex(t.letter, t.to, step.latex ?? toLatex(step.expr!))}`) }
  })
}

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
      : t.kind === 'partial'
        ? partialLines(t)
        : t.kind === 'limit'
          ? limitLines(t, solution)
          : stepLines(solution)
  // z. B. nach dem Malnehmen ohne Kürzen: noch ausrechnen; Partialbrüche: die Zahlen einsetzen
  const result = `= ${toLatex(solution.result)}`
  if (lines.at(-1)?.latex !== result) lines.push({ label: t.kind === 'partial' ? 'Eingesetzt:' : 'Ausrechnen:', latex: result })
  return { functionLatex: taskLatex(t), lines, result: solution.result }
}
