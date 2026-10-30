import { useMemo } from 'react'
import { equationToLatex, toLatex } from '../engine/expr/print.ts'
import { rearrangeWrongAnswers } from '../engine/rearrange/errorRules.ts'
import { solveEquation, stepLabel } from '../engine/rearrange/isolate.ts'
import { conditionsText, instructionFor, taskLatex } from '../engine/rearrange/task.ts'
import type { GeneratedRearrangeTask } from '../engine/tasks/rearrangeTerms.ts'
import { formatTaskNumber } from '../engine/tasks/taskNumber.ts'
import { Formula } from './Formula.tsx'
import { RichText } from './RichText.tsx'

// Umstell-Aufgabe auf der Testseite: Aufgabe, Ergebnis, auf Wunsch Rechenweg und typische Fehler

type Props = {
  generated: GeneratedRearrangeTask
  showSteps: boolean
  showErrors: boolean
  highlighted?: boolean
}

export function RearrangeGalleryCard({ generated, showSteps, showErrors, highlighted = false }: Props) {
  const { task, template, ref } = generated
  const solution = useMemo(() => solveEquation(task.equation, task.target)!, [task])
  const wrong = useMemo(() => (showErrors ? rearrangeWrongAnswers(task, solution) : []), [showErrors, task, solution])

  return (
    <article className={`space-y-3 rounded-2xl border p-4 ${highlighted ? 'border-accent-600 bg-accent-50' : 'border-zinc-200'}`}>
      <p className="text-sm text-zinc-500">
        <RichText text={`${instructionFor(task)} ${conditionsText(task)}`} inline />
      </p>
      <div className="overflow-x-auto py-1 text-xl">
        <Formula tex={taskLatex(task)} />
      </div>
      <div className="overflow-x-auto py-1 text-xl" data-testid="rearrange-result">
        <Formula tex={`${task.target} = ${toLatex(solution.result)}`} />
      </div>

      {showSteps && (
        <section className="space-y-3 border-t border-zinc-100 pt-3">
          <h3 className="text-sm font-semibold text-zinc-500">Rechenweg</h3>
          <ol className="space-y-3">
            {solution.steps.map((step, i) => (
              <li key={i} className="space-y-1">
                <p className="text-sm font-medium text-accent-700">
                  <RichText text={stepLabel(step, task.target)} inline />
                </p>
                <div className="overflow-x-auto py-0.5">
                  <Formula tex={equationToLatex(step.after)} />
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {showErrors && (
        <section className="border-t border-zinc-100 pt-3">
          <h3 className="mb-2 text-sm font-semibold text-zinc-500">Typische Fehler ({wrong.length})</h3>
          <ul className="space-y-3">
            {wrong.map((w) => (
              <li key={`${w.rule.id}:${w.stepIndex}:${equationToLatex(w.after)}`} className="space-y-0.5">
                <RichText text={w.rule.name} className="block text-sm text-red-800" inline />
                <RichText text={`im Schritt: ${stepLabel(solution.steps[w.stepIndex], task.target)}`} className="block text-sm text-zinc-500" inline />
                <div className="overflow-x-auto">
                  <Formula tex={equationToLatex(w.after)} />
                </div>
                {w.result && equationToLatex(w.after) !== `${task.target} = ${toLatex(w.result)}` && (
                  <div className="overflow-x-auto text-sm text-zinc-500">
                    führt zu <Formula tex={`${task.target} = ${toLatex(w.result)}`} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-sm text-zinc-500">
        Aufgabe {formatTaskNumber(ref)} · <RichText text={template.label} inline />
      </p>
    </article>
  )
}
