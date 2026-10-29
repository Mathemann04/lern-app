import { useState } from 'react'
import { ERROR_RULES, errorRule } from '../engine/derive/errorRules.ts'
import { levelSummary, resetProgress, topErrors, useProgress } from '../state/progress.ts'
import { useSettings } from '../state/settings.ts'
import { DERIVATIVES, courseById } from './catalog.ts'
import { FitWidth } from './FitWidth.tsx'
import { Formula } from './Formula.tsx'
import { practiceHref } from './routes.ts'
import { RecentDots } from './RecentDots.tsx'
import { derivativeLevels } from './samples.ts'
import { RichText } from './RichText.tsx'

// Fortschritt je Stufe und die häufigsten typischen Fehler, mit gezieltem Üben

export function ProgressScreen() {
  const progress = useProgress()
  const { derivativeLevel, practiceMode } = useSettings()
  const errors = topErrors(progress, 5, (id) => ERROR_RULES.some((rule) => rule.id === id))
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <main className="space-y-10">
      <h1 className="text-3xl font-semibold tracking-tight">Dein Fortschritt</h1>

      <section aria-labelledby="progress-levels" data-tone={courseById(DERIVATIVES)!.area.tone} className="space-y-3">
        <div>
          <p className="text-sm text-zinc-500">Differentialrechnung</p>
          <h2 id="progress-levels" className="text-xl font-semibold">
            Ableiten
          </h2>
        </div>
        <ul className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200">
          {derivativeLevels
            .filter((l) => l.available)
            .map((l) => {
              const { solved, recent, recentClean } = levelSummary(progress, l.level)
              return (
                <li key={l.level} className="flex gap-4 px-4 py-4" aria-label={`Stufe ${l.level}`}>
                  <span
                    aria-hidden
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-50 font-semibold text-accent-700"
                  >
                    {l.level}
                  </span>
                  <div className="min-w-0 space-y-2">
                    <p className="font-medium">{l.title}</p>
                    {solved === 0 ? (
                      <p className="text-sm text-zinc-500">Noch keine Aufgabe gelöst.</p>
                    ) : (
                      <>
                        <RecentDots recent={recent} />
                        <p className="text-sm text-zinc-600">
                          {solved} gelöst · zuletzt {recentClean} von {recent.length} ohne Fehler
                        </p>
                      </>
                    )}
                  </div>
                </li>
              )
            })}
        </ul>
      </section>

      <section aria-labelledby="progress-errors" data-tone={courseById(DERIVATIVES)!.area.tone} className="space-y-3">
        <h2 id="progress-errors" className="text-xl font-semibold">
          Deine häufigsten Fehler
        </h2>
        {errors.length === 0 ? (
          <p className="text-zinc-600 text-pretty">
            Noch keine Fehler gesammelt. Sobald du dich bei einer Aufgabe vertust, siehst du hier, was dir am häufigsten passiert,
            und kannst genau das gezielt üben.
          </p>
        ) : (
          <ol className="space-y-3">
            {errors.map(({ id, times }) => {
              const rule = errorRule(id)
              return (
                <li key={id} className="space-y-2 rounded-2xl border border-zinc-200 p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <RichText text={rule.name} className="block font-medium" inline />
                    <p className="shrink-0 text-sm text-zinc-500">{times}-mal</p>
                  </div>
                  <div className="text-zinc-700">
                    <span className="text-sm text-zinc-500">So sieht der Fehler aus:</span>
                    <FitWidth>
                      <Formula tex={rule.wrongFormula} />
                    </FitWidth>
                  </div>
                  <a
                    href={practiceHref(derivativeLevel, practiceMode, id)}
                    className="inline-block rounded-xl bg-accent-700 px-4 py-2.5 font-medium text-on-accent hover:bg-accent-800"
                  >
                    Gezielt üben
                  </a>
                </li>
              )
            })}
          </ol>
        )}
      </section>

      {(progress.attempts.length > 0 || errors.length > 0) && (
        <section className="space-y-2 border-t border-zinc-100 pt-6">
          {confirmReset ? (
            <div className="space-y-3 rounded-2xl bg-red-50 p-4">
              <p className="font-medium text-red-900">Wirklich den ganzen Fortschritt und alle Fehler löschen?</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    resetProgress()
                    setConfirmReset(false)
                  }}
                  className="rounded-xl bg-red-700 px-4 py-2.5 font-medium text-on-accent hover:bg-red-800"
                >
                  Ja, löschen
                </button>
                <button type="button" onClick={() => setConfirmReset(false)} className="rounded-xl px-4 py-2.5 font-medium hover:bg-red-100">
                  Abbrechen
                </button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmReset(true)} className="rounded-xl px-3 py-3 text-sm text-zinc-500 hover:bg-zinc-100">
              Fortschritt löschen
            </button>
          )}
        </section>
      )}
    </main>
  )
}
