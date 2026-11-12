import { toLatex } from '../expr/print.ts'
import { readableLatex } from '../fraction/task.ts'
import { solveTask, stepEquationLatex, stepLabel } from '../rearrange/isolate.ts'
import { probeLatex, probeOf } from '../rearrange/probe.ts'
import { type RearrangeTask, taskLatex } from '../rearrange/task.ts'
import type { WorkedExample } from './example.ts'

// Durchgerechnetes Beispiel für eine Lernkarte zum Umstellen: der Rechenweg der Umstell-Engine, je
// Umformung eine Zeile mit der ganzen Gleichung danach; bei Gleichungen mit Zahlen (M6 Schritt 4b-3) die Probe mit den
// eingesetzten Zahlen und zum Schluss die Lösungsmenge, wenn es keine Lösung gibt

export function rearrangeExample(t: RearrangeTask): WorkedExample {
  const solution = solveTask(t)
  if (!solution) throw new Error(`Beispiel ${taskLatex(t)} lässt sich nicht nach ${t.target} auflösen`)
  const lines = solution.steps.map((step) => ({
    label: `${stepLabel(step, t.target)}:`,
    latex: readableLatex(step.kind === 'probe' && step.operand ? probeLatex(probeOf(t.equation, t.target, step.operand)) : stepEquationLatex(step.kind, step.after)),
  }))
  return {
    functionLatex: t.numeric ? taskLatex(t) : `${taskLatex(t)} \\quad \\text{nach } ${t.target}`,
    lines: !t.numeric
      ? lines
      : [...lines, solution.none ? { label: 'Keine Lösung:', latex: '\\mathbb{L} = \\{\\,\\}' } : { label: 'Lösung:', latex: readableLatex(`${t.target} = ${toLatex(solution.result)}`) }],
    result: solution.result,
  }
}
