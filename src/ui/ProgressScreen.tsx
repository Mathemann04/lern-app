import { useState } from 'react'
import { findError, isErrorOf } from '../engine/errorCatalog.ts'
import { levelSummary, resetProgress, topErrors, useProgress } from '../state/progress.ts'
import { clearRounds } from '../state/questionRounds.ts'
import { clearExamPractice, useExamPractice } from '../state/examPractice.ts'
import { clearMockHistory, clearMockSession, useMockHistory } from '../state/mockExam.ts'
import { clearReviews } from '../state/reviews.ts'
import { useSettings } from '../state/settings.ts'
import { AVAILABLE_COURSES, type Course, SUBJECTS, courseById, hasLevelNames, levelName, playableLevel } from './catalog.ts'
import { ErrorShape } from './ErrorShape.tsx'
import { examOverviewHref, practiceHref } from './routes.ts'
import { RecentDots } from './RecentDots.tsx'
import { RichText } from './RichText.tsx'

// Fortschritt je Thema: gelöste Aufgaben je Stufe und die häufigsten typischen Fehler, mit
// gezieltem Üben

export function ProgressScreen() {
  const progress = useProgress()
  const [confirmReset, setConfirmReset] = useState(false)
  const examPractice = useExamPractice()
  const mockHistory = useMockHistory()
  const anything = progress.attempts.length > 0 || Object.keys(progress.errors).some((id) => findError(id)) || examPractice.length > 0 || mockHistory.length > 0

  return (
    <main className="space-y-12">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Dein Fortschritt</h1>
        {/* Fächer mit Probeklausur: wie sicher die Klausuraufgaben sitzen, steht im Klausur-Überblick (S11) */}
        {SUBJECTS.filter((subject) => subject.mock).map((subject) => (
          <a
            key={subject.id}
            href={examOverviewHref(subject.id)}
            className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-lg px-2 font-medium text-accent-700 hover:bg-accent-50"
          >
            Klausur-Überblick {subject.title}
            <span aria-hidden>→</span>
          </a>
        ))}
      </div>

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
                    // Die Runden der Wissensfragen beginnen von vorn, die Wiederholung, die Probeklausur, ihr Verlauf und die
                    // Ergebnisse der Klausuraufgaben sind leer; gemeldete Fragen bleiben
                    clearRounds()
                    clearReviews()
                    clearMockSession()
                    clearMockHistory()
                    clearExamPractice()
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
              <li key={l.level} className="flex gap-4 px-4 py-4" aria-label={levelName(course.id, l.level)}>
                <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-50 font-semibold text-accent-700">
                  {l.level}
                </span>
                <div className="min-w-0 space-y-2">
                  {hasLevelNames(course.id) && <p className="text-sm font-semibold text-accent-700">{levelName(course.id, l.level)}</p>}
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
                  <ErrorShape error={rule} />
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
