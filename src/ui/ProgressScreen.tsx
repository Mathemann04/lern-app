import { useState } from 'react'
import { findError, isErrorOf } from '../engine/errorCatalog.ts'
import { levelSummary, resetProgress, topErrors, useProgress } from '../state/progress.ts'
import { useSettings } from '../state/settings.ts'
import { AVAILABLE_COURSES, type Course, courseById, playableLevel } from './catalog.ts'
import { FitWidth } from './FitWidth.tsx'
import { Formula } from './Formula.tsx'
import { practiceHref } from './routes.ts'
import { RecentDots } from './RecentDots.tsx'
import { RichText } from './RichText.tsx'

// Fortschritt je Thema: gelöste Aufgaben je Stufe und die häufigsten typischen Fehler, mit
// gezieltem Üben

export function ProgressScreen() {
  const progress = useProgress()
  const [confirmReset, setConfirmReset] = useState(false)
  const anything = progress.attempts.length > 0 || Object.keys(progress.errors).some((id) => findError(id))

  return (
    <main className="space-y-12">
      <h1 className="text-3xl font-semibold tracking-tight">Dein Fortschritt</h1>

      {AVAILABLE_COURSES.map((course) => (
        <CourseProgress key={course.id} course={course} />
      ))}

      {anything && (
        <section className="space-y-2 border-t border-zinc-100 pt-6">
          {confirmReset ? (
            <div className="space-y-3 rounded-2xl bg-red-50 p-4">
              <p className="font-medium text-red-900">Wirklich den ganzen Fortschritt und alle Fehler löschen, in allen Themen?</p>
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

function CourseProgress({ course }: { course: Course }) {
  const { area } = courseById(course.id)!
  const progress = useProgress()
  const settings = useSettings()
  const errors = topErrors(progress, 5, (id) => isErrorOf(course.id, id))
  // Gezielt üben in der gewählten Stufe und Art des Themas
  const level = playableLevel(course, settings.levels[course.id])
  const mode = course.free ? settings.practiceMode : 'guided'
  return (
    <section aria-labelledby={`progress-${course.id}`} data-tone={area.tone} className="space-y-6">
      <div>
        <p className="text-sm text-zinc-500">{area.title}</p>
        <h2 id={`progress-${course.id}`} className="text-2xl font-semibold tracking-tight">
          {course.title}
        </h2>
      </div>

      <ul className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200" aria-label="Stufen">
        {course.levels
          .filter((l) => l.available)
          .map((l) => {
            const { solved, recent, recentClean } = levelSummary(progress, course.id, l.level)
            return (
              <li key={l.level} className="flex gap-4 px-4 py-4" aria-label={`Stufe ${l.level}`}>
                <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-50 font-semibold text-accent-700">
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

      <section aria-labelledby={`errors-${course.id}`} className="space-y-3">
        <h3 id={`errors-${course.id}`} className="text-lg font-semibold">
          Deine häufigsten Fehler
        </h3>
        {errors.length === 0 ? (
          <p className="text-zinc-600 text-pretty">
            Noch keine Fehler gesammelt. Sobald du dich bei einer Aufgabe vertust, siehst du hier, was dir am häufigsten passiert,
            und kannst genau das gezielt üben.
          </p>
        ) : (
          <ol className="space-y-3">
            {errors.map(({ id, times }) => {
              const rule = findError(id)!
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
                  {course.focus && (
                    <a
                      href={practiceHref(course.id, level, mode, id)}
                      className="inline-block rounded-xl bg-accent-700 px-4 py-2.5 font-medium text-on-accent hover:bg-accent-800"
                    >
                      Gezielt üben
                    </a>
                  )}
                </li>
              )
            })}
          </ol>
        )}
      </section>
    </section>
  )
}
