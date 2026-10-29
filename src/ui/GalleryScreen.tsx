import { type FormEvent, useMemo, useState } from 'react'
import { derive } from '../engine/derive/derive.ts'
import { wrongAnswers } from '../engine/derive/errorRules.ts'
import { deriveImplicit, implicitResult, implicitWrongAnswers } from '../engine/derive/implicit.ts'
import { equationToLatex, toLatex } from '../engine/expr/print.ts'
import { type GeneratedTask, generateDerivativeTask } from '../engine/tasks/derivativeTerms.ts'
import {
  LEVELS,
  type Level,
  MAX_SEED,
  type TaskRef,
  formatTaskNumber,
  parseTaskNumber,
  randomSeed,
} from '../engine/tasks/taskNumber.ts'
import { BackLink } from './BackLink.tsx'
import { DerivationView } from './DerivationView.tsx'
import { Formula } from './Formula.tsx'
import { RichText } from './RichText.tsx'
import { notationSamples } from './samples.ts'

const TASKS_PER_PAGE = 8

// Testseite: zeigt zufällige Aufgaben-Terme der Mathe-Engine, um die Schreibweise zu prüfen
export function GalleryScreen() {
  const [level, setLevel] = useState<Level>(1)
  const [baseSeed, setBaseSeed] = useState(randomSeed)
  const [showSteps, setShowSteps] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const [lookupText, setLookupText] = useState('')
  const [lookup, setLookup] = useState<TaskRef | 'invalid' | null>(null)

  const tasks = useMemo(
    () =>
      Array.from({ length: TASKS_PER_PAGE }, (_, i) =>
        generateDerivativeTask({ level, seed: ((baseSeed + i * 7919) % MAX_SEED) + 1 }),
      ),
    [level, baseSeed],
  )
  const lookedUp = lookup && lookup !== 'invalid' ? generateDerivativeTask(lookup) : null

  function handleLookup(event: FormEvent) {
    event.preventDefault()
    setLookup(parseTaskNumber(lookupText) ?? 'invalid')
  }

  return (
    <main className="space-y-8">
      <section className="space-y-2">
        <BackLink href="#/einstellungen" label="Einstellungen" />
        <h1 className="text-3xl font-semibold tracking-tight">Formel-Galerie</h1>
        <p className="text-zinc-600 text-pretty">
          Testseite: Hier zeigt die Mathe-Engine zufällige Aufgaben aus allen Stufen mit Ableitung,
          Rechenweg und typischen Fehlern. Prüfe, ob alles aussieht wie in deinem Skript.
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-zinc-500">Stufe</span>
          <div className="flex flex-1 gap-1 rounded-xl bg-zinc-100 p-1">
            {LEVELS.map((l) => (
              <button
                key={l}
                type="button"
                aria-label={`Stufe ${l}`}
                aria-pressed={l === level}
                onClick={() => setLevel(l)}
                className={`flex-1 rounded-lg py-2 font-medium transition-colors ${
                  l === level ? 'bg-white text-accent-700 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setBaseSeed(randomSeed())}
            className="rounded-xl bg-accent-700 px-4 py-2.5 font-medium text-white hover:bg-accent-800"
          >
            Neue Aufgaben
          </button>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <label className="flex items-center gap-2 text-zinc-700">
              <input
                type="checkbox"
                checked={showSteps}
                onChange={(event) => setShowSteps(event.target.checked)}
                className="size-4 accent-accent-700"
              />
              Rechenweg zeigen
            </label>
            <label className="flex items-center gap-2 text-zinc-700">
              <input
                type="checkbox"
                checked={showErrors}
                onChange={(event) => setShowErrors(event.target.checked)}
                className="size-4 accent-accent-700"
              />
              Typische Fehler zeigen
            </label>
          </div>
        </div>

        <form onSubmit={handleLookup} className="space-y-2">
          <label htmlFor="task-number" className="block text-sm font-medium text-zinc-500">
            Aufgabe über ihre Nummer aufrufen
          </label>
          <div className="flex gap-2">
            <input
              id="task-number"
              value={lookupText}
              onChange={(event) => setLookupText(event.target.value)}
              placeholder="z. B. 3-48213"
              inputMode="numeric"
              className="min-w-0 flex-1 rounded-xl border border-zinc-300 px-3 py-2.5 focus:border-accent-600 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-xl border border-zinc-300 px-4 py-2.5 font-medium hover:bg-zinc-50"
            >
              Anzeigen
            </button>
          </div>
          {lookup === 'invalid' && (
            <p className="text-sm text-red-700">Bitte so eingeben: Stufe, Bindestrich, Nummer, z. B. 3-48213.</p>
          )}
        </form>
      </section>

      {lookedUp && (
        <section aria-label="Aufgerufene Aufgabe">
          <TaskCard generated={lookedUp} showSteps={showSteps} showErrors={showErrors} highlighted />
        </section>
      )}

      <section aria-label="Zufällige Aufgaben" className="space-y-3">
        {tasks.map((generated) => (
          <TaskCard key={generated.ref.seed} generated={generated} showSteps={showSteps} showErrors={showErrors} />
        ))}
      </section>

      <section aria-labelledby="notation" className="space-y-4 border-t border-zinc-100 pt-8">
        <div>
          <h2 id="notation" className="text-xl font-semibold">
            Schreibweise
          </h2>
          <p className="mt-1 text-zinc-600">So werden Formeln in der App gesetzt. Sieht das aus wie in deinem Skript?</p>
        </div>
        <dl className="grid gap-3 sm:grid-cols-2">
          {notationSamples.map((sample) => (
            <div key={sample.label} className="rounded-xl bg-zinc-50 px-4 py-3">
              <dt className="text-sm text-zinc-500">{sample.label}</dt>
              <dd className="mt-1 text-xl">
                <Formula tex={sample.tex} />
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  )
}

type CardProps = {
  generated: GeneratedTask
  showSteps: boolean
  showErrors: boolean
  highlighted?: boolean
}

function TaskCard({ generated, showSteps, showErrors, highlighted = false }: CardProps) {
  const { task, template, ref } = generated
  const latex = task.kind === 'function' ? `f(x) = ${toLatex(task.expr)}` : equationToLatex(task.equation)
  // Implizit: beide Seiten abgeleitet, Ergebnis y'; Fehler als falsch abgeleitete Gleichung
  const worked = useMemo(() => {
    if (task.kind === 'function') {
      const d = derive(task.expr)
      return { resultLatex: `f'(x) = ${toLatex(d.result)}`, trees: [{ label: null, derivation: d }] }
    }
    const d = deriveImplicit(task.equation)
    return {
      resultLatex: `y' = ${toLatex(implicitResult(d))}`,
      trees: [
        { label: 'Linke Seite', derivation: d.left },
        { label: 'Rechte Seite', derivation: d.right },
      ],
    }
  }, [task])
  const errors = useMemo(() => {
    if (!showErrors) return []
    if (task.kind === 'function') {
      return wrongAnswers(task.expr, worked.trees[0].derivation).map((w) => ({ ...w, latex: `f'(x) = ${toLatex(w.result)}` }))
    }
    return implicitWrongAnswers(task.equation).map((w) => ({ ...w, latex: equationToLatex(w.differentiated) }))
  }, [showErrors, task, worked])

  return (
    <article
      className={`space-y-3 rounded-2xl border p-4 ${highlighted ? 'border-accent-600 bg-accent-50' : 'border-zinc-200'}`}
    >
      <div className="overflow-x-auto py-1 text-xl">
        <Formula tex={latex} />
      </div>
      <div className="overflow-x-auto py-1 text-xl" data-testid="derivative">
        <Formula tex={worked.resultLatex} />
      </div>

      {showSteps && (
        <section className="space-y-3 border-t border-zinc-100 pt-3">
          <h3 className="text-sm font-semibold text-zinc-500">Rechenweg</h3>
          {worked.trees.map(({ label, derivation }) => (
            <div key={label ?? 'f'} className="space-y-2">
              {label && <p className="text-sm text-zinc-500">{label}</p>}
              <DerivationView derivation={derivation} />
            </div>
          ))}
        </section>
      )}

      {showErrors && (
        <section className="border-t border-zinc-100 pt-3">
          <h3 className="mb-2 text-sm font-semibold text-zinc-500">Typische Fehler ({errors.length})</h3>
          <ul className="space-y-2">
            {errors.map((w) => (
              <li key={`${w.errorRule.id}:${'side' in w ? w.side : ''}:${w.node.path.join(',')}`} className="space-y-0.5">
                <RichText
                  text={[w.errorRule, ...w.alsoMatches].map((r) => r.name).join(' oder ')}
                  className="block text-sm text-red-800"
                  inline
                />
                <div className="overflow-x-auto">
                  <Formula tex={w.latex} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-sm text-zinc-500">
        Aufgabe {formatTaskNumber(ref)} · {template.label}
      </p>
    </article>
  )
}
