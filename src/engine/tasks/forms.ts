import { equationToLatex, toLatex } from '../expr/print.ts'
import { taskLatex as fractionLatex } from '../fraction/task.ts'
import { taskLatex as rearrangeLatex } from '../rearrange/task.ts'
import { generateDerivativeTask } from './derivativeTerms.ts'
import { generateFractionTask } from './fractionTerms.ts'
import { generateRearrangeTask } from './rearrangeTerms.ts'
import type { TaskRef } from './taskNumber.ts'
import { formOfLatex } from './variety.ts'

// Form einer Aufgabe je Thema (Abwechslung beim Ziehen, tasks/variety.ts)

export function derivativeForm(ref: TaskRef): string {
  const { task } = generateDerivativeTask(ref)
  return formOfLatex(task.kind === 'function' ? toLatex(task.expr) : equationToLatex(task.equation))
}

// Partialbrüche sehen aus wie ein Bruch zum Kürzen, sind aber eine eigene Form
export function fractionForm(ref: TaskRef): string {
  const { task } = generateFractionTask(ref)
  return `${task.kind === 'partial' ? 'zerlegen: ' : ''}${formOfLatex(fractionLatex(task))}`
}

export function rearrangeForm(ref: TaskRef): string {
  const { task } = generateRearrangeTask(ref)
  return `${formOfLatex(rearrangeLatex(task))} nach ${task.target}`
}
