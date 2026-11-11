import { useState } from 'react'
import { chemErrorRulesOf } from '../../engine/chem/errorRules.ts'
import { calcForm, generatedCalc, generatorsOf } from '../../engine/chem/generators/index.ts'
import { GENERATED_MIN } from '../../engine/quiz/numbers.ts'
import { type Level, formatTaskNumber } from '../../engine/tasks/taskNumber.ts'
import { varietyStats } from '../../engine/tasks/variety.ts'
import { findError } from '../../engine/errorCatalog.ts'
import { Formula } from '../Formula.tsx'
import { RichText } from '../RichText.tsx'
import { ChemFigure, FigureDrawing } from './ChemFigure.tsx'
import { figureById } from '../../engine/chem/figures.ts'
import { levelName } from '../catalog.ts'
import { taskHref } from '../routes.ts'

// Rechnungen eines Chemie-Themas auf der Testseite „Fragen durchsehen" (ab S2): je Stufe einige
// erzeugte Aufgaben mit allen Schritten, richtiger Antwort und den falschen samt Rechenfehler; die
// Abwechslung je Stufe (Formen unter den Aufgaben ab Nummer 10000, Kennzahlen aus M2b) auf Knopfdruck;
// unten alle Rechenfehler des Themas.

const SHOWN = 6
const VARIETY_SAMPLE = 200

export function CalcGallery({ course, levels }: { course: string; levels: readonly Level[] }) {
  const withCalcs = levels.filter((level) => generatorsOf(course, level).length > 0)
  const rules = chemErrorRulesOf(course)
  if (withCalcs.length === 0) return null
  return (
    <section aria-labelledby="calcs" className="space-y-6 border-t border-zinc-100 pt-8">
      <div>
        <h2 id="calcs" className="text-xl font-semibold">
          Rechnungen
        </h2>
        <p className="text-sm text-zinc-500">Von der App erzeugt und nachgerechnet, je Stufe die ersten {SHOWN} Aufgaben ab Nummer {GENERATED_MIN}.</p>
      </div>
      {withCalcs.map((level) => (
        <div key={level} className="space-y-3">
          <h3 className="text-lg font-semibold">{levelName(course, level)}</h3>
          <p className="text-sm text-zinc-600">Rechenarten: {generatorsOf(course, level).map((g) => `${g.kind} (${g.part})`).join(', ')}</p>
          <Variety course={course} level={level} />
          <ol className="space-y-4">
            {Array.from({ length: SHOWN }, (_, i) => (
              <li key={i}>
                <CalcCard course={course} level={level} seed={GENERATED_MIN + i} />
              </li>
            ))}
          </ol>
        </div>
      ))}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Rechenfehler</h3>
        <ul className="space-y-3">
          {rules.map((r) => (
            <li key={r.id} className="space-y-2 rounded-2xl border border-zinc-200 p-4">
              <RichText text={r.name} className="block font-medium" inline />
              <p className="text-sm text-zinc-500">{r.id}</p>
              <div className="overflow-x-auto">
                <Formula tex={r.wrongFormula} />
              </div>
              <RichText text={r.why.detailed} className="text-zinc-700" />
              <RichText text={`Kurz: ${r.why.short}`} className="text-sm text-zinc-600" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function Variety({ course, level }: { course: string; level: Level }) {
  const [stats, setStats] = useState<{ distinct: number; maxShare: number } | null>(null)
  const count = () => {
    const forms = Array.from({ length: VARIETY_SAMPLE }, (_, i) => calcForm(generatedCalc(course, { level, seed: GENERATED_MIN + i })!))
    setStats(varietyStats(forms))
  }
  return stats ? (
    <p className="text-sm text-zinc-600">
      Abwechslung: {stats.distinct} Formen unter {VARIETY_SAMPLE} Aufgaben, die häufigste {Math.round(stats.maxShare * 100)} von 100
    </p>
  ) : (
    <button type="button" onClick={count} className="min-h-11 rounded-xl border border-zinc-200 px-4 text-sm font-medium hover:bg-zinc-50">
      Abwechslung zählen
    </button>
  )
}

function CalcCard({ course, level, seed }: { course: string; level: Level; seed: number }) {
  const ref = { level, seed }
  const calc = generatedCalc(course, ref)
  if (!calc) return null
  const { task } = calc
  return (
    <article data-calc={calc.form} className="space-y-3 rounded-2xl border border-zinc-200 p-4">
      <p className="flex flex-wrap items-center gap-x-3 text-sm text-zinc-500">
        <a href={taskHref(course, ref)} className="inline-flex min-h-11 items-center font-medium text-accent-700 hover:underline">
          Aufgabe {formatTaskNumber(ref)}
        </a>
        <span>Form {calcForm(calc)}</span>
      </p>
      <RichText text={task.instruction} className="font-semibold" />
      {task.functionLatex && (
        <div className="overflow-x-auto text-lg">
          <Formula tex={task.functionLatex} />
        </div>
      )}
      {task.note && <RichText text={task.note} className="text-sm text-zinc-600" />}
      <ol className="space-y-3">
        {task.steps.map((step) => (
          <li key={step.id} className="space-y-1 border-l-2 border-zinc-200 pl-3">
            <RichText text={step.question} className="font-medium" />
            <ul className="space-y-1 text-sm">
              {step.choices.map((c) => (
                <li key={c.id} className={c.correct ? 'text-green-800' : 'text-red-800'}>
                  {c.figure && figureById(c.figure) && (
                    <span className="block max-w-[12rem]">
                      <FigureDrawing figure={figureById(c.figure)!} label={c.content} />
                    </span>
                  )}
                  <RichText text={c.content} inline /> {c.correct ? '(richtig)' : <span className="text-zinc-500">· {findError(c.errorRuleId ?? '')?.name ?? c.errorRuleId}</span>}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      <div className="rounded-xl bg-green-50 px-3 py-2 text-sm">
        {task.resultLatex ? <Formula tex={task.resultLatex} /> : <RichText text={task.resultText ?? ''} />}
      </div>
      {task.resultFigure && <ChemFigure id={task.resultFigure} />}
    </article>
  )
}
