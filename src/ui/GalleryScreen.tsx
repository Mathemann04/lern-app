import { type FormEvent, useMemo, useState } from 'react'
import { derive } from '../engine/derive/derive.ts'
import { wrongAnswers } from '../engine/derive/errorRules.ts'
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
import { DerivationView } from './DerivationView.tsx'
import { Formula } from './Formula.tsx'

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
  const derivation = useMemo(() => (task.kind === 'function' ? derive(task.expr) : null), [task])
  const errors = useMemo(
    () => (showErrors && task.kind === 'function' && derivation ? wrongAnswers(task.expr, derivation) : []),
    [showErrors, task, derivation],
  )

  return (
    <article
      className={`space-y-3 rounded-2xl border p-4 ${highlighted ? 'border-accent-600 bg-accent-50' : 'border-zinc-200'}`}
    >
      <div className="overflow-x-auto py-1 text-xl">
        <Formula tex={latex} />
      </div>
      {derivation ? (
        <div className="overflow-x-auto py-1 text-xl" data-testid="derivative">
          <Formula tex={`f'(x) = ${toLatex(derivation.result)}`} />
        </div>
      ) : (
        <p className="text-sm text-zinc-500">Implizites Ableiten kommt in Schritt 11.</p>
      )}

      {showSteps && derivation && (
        <section className="border-t border-zinc-100 pt-3">
          <h3 className="mb-2 text-sm font-semibold text-zinc-500">Rechenweg</h3>
          <DerivationView derivation={derivation} />
        </section>
      )}

      {showErrors && derivation && (
        <section className="border-t border-zinc-100 pt-3">
          <h3 className="mb-2 text-sm font-semibold text-zinc-500">Typische Fehler ({errors.length})</h3>
          <ul className="space-y-2">
            {errors.map((w) => (
              <li key={`${w.errorRule.id}:${w.node.path.join(',')}`} className="space-y-0.5">
                <p className="text-sm text-red-800">
                  {[w.errorRule, ...w.alsoMatches].map((r) => r.name).join(' oder ')}
                </p>
                <div className="overflow-x-auto">
                  <Formula tex={`f'(x) = ${toLatex(w.result)}`} />
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
