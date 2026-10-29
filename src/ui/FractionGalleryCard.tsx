import { useMemo } from 'react'
import { toLatex } from '../engine/expr/print.ts'
import { num } from '../engine/expr/types.ts'
import { fractionWrongAnswers } from '../engine/fraction/errorRules.ts'
import { type FracStep, STEP_NAMES, solveFraction } from '../engine/fraction/solve.ts'
import { instructionFor, taskLatex } from '../engine/fraction/task.ts'
import type { GeneratedFractionTask } from '../engine/tasks/fractionTerms.ts'
import { formatTaskNumber } from '../engine/tasks/taskNumber.ts'
import type { Rational } from '../engine/rational.ts'
import { Formula } from './Formula.tsx'
import { RichText } from './RichText.tsx'

// Bruchaufgabe auf der Testseite: Aufgabe, Ergebnis, auf Wunsch Rechenweg und typische Fehler

type Props = {
  generated: GeneratedFractionTask
  showSteps: boolean
  showErrors: boolean
  highlighted?: boolean
}

// x ≠ −1, x ≠ 1
const excludedLatex = (values: readonly Rational[]) => values.map((r) => `x \\neq ${toLatex(num(r))}`).join(',\\ ')

function stepLatex(step: FracStep): string {
  if (step.kind === 'lcd') return toLatex(step.detail!)
  if (step.kind === 'cancel' && step.before) return `${toLatex(step.before)} = ${toLatex(step.expr!)}`
  return toLatex(step.expr!)
}

export function FractionGalleryCard({ generated, showSteps, showErrors, highlighted = false }: Props) {
  const { task, template, ref } = generated
  const solution = useMemo(() => solveFraction(task), [task])
  const wrong = useMemo(() => (showErrors ? fractionWrongAnswers(task, solution) : []), [showErrors, task, solution])

  return (
    <article className={`space-y-3 rounded-2xl border p-4 ${highlighted ? 'border-accent-600 bg-accent-50' : 'border-zinc-200'}`}>
      <p className="text-sm text-zinc-500">{instructionFor(task)}</p>
      <div className="overflow-x-auto py-1 text-xl">
        <Formula tex={taskLatex(task)} />
      </div>
      <div className="overflow-x-auto py-1 text-xl" data-testid="fraction-result">
        <Formula tex={`= ${toLatex(solution.result)}`} />
      </div>
      {solution.excluded && solution.excluded.length > 0 && (
        <p className="text-sm text-zinc-500">
          gilt für <Formula tex={excludedLatex(solution.excluded)} />
        </p>
      )}

      {showSteps && (
        <section className="space-y-3 border-t border-zinc-100 pt-3">
          <h3 className="text-sm font-semibold text-zinc-500">Rechenweg</h3>
          <ol className="space-y-3">
            {solution.steps.map((step, i) => (
              <li key={i} className="space-y-1">
                <p className="text-sm">
                  <span className="font-medium text-accent-700">{STEP_NAMES[step.kind]}</span>
                  {step.kind === 'cancel' && step.detail && (
                    <span className="text-zinc-500">
                      {' '}
                      durch <Formula tex={toLatex(step.detail)} />
                    </span>
                  )}
                </p>
                <div className="overflow-x-auto py-0.5">
                  <Formula tex={stepLatex(step)} />
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
              <li key={`${w.rule.id}:${w.step}:${toLatex(w.stepExpr)}`} className="space-y-0.5">
                <p className="text-sm">
                  <RichText text={w.rule.name} className="text-red-800" inline />
                  <span className="text-zinc-500"> · {STEP_NAMES[w.step]}</span>
                </p>
                <div className="overflow-x-auto">
                  <Formula tex={toLatex(w.stepExpr)} />
                </div>
                {w.result && toLatex(w.result) !== toLatex(w.stepExpr) && (
                  <div className="overflow-x-auto text-sm text-zinc-500">
                    führt zu <Formula tex={toLatex(w.result)} />
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
