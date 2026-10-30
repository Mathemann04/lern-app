import { equationToLatex } from '../expr/print.ts'
import { readableLatex } from '../fraction/task.ts'
import { solveEquation, stepLabel } from '../rearrange/isolate.ts'
import { type RearrangeTask, taskLatex } from '../rearrange/task.ts'
import type { WorkedExample } from './example.ts'

// Durchgerechnetes Beispiel für eine Lernkarte zum Umstellen: der Rechenweg der Umstell-Engine, je
// Umformung eine Zeile mit der ganzen Gleichung danach

export function rearrangeExample(t: RearrangeTask): WorkedExample {
  const solution = solveEquation(t.equation, t.target)
  if (!solution) throw new Error(`Beispiel ${taskLatex(t)} lässt sich nicht nach ${t.target} auflösen`)
  return {
    functionLatex: `${taskLatex(t)} \\quad \\text{nach } ${t.target}`,
    lines: solution.steps.map((step) => ({ label: `${stepLabel(step, t.target)}:`, latex: readableLatex(equationToLatex(step.after)) })),
    result: solution.result,
  }
}
