import { useState } from 'react'
import { findError, isErrorOf } from '../engine/errorCatalog.ts'
import { SUGGEST_WINDOW, levelSummary, resetProgress, topErrors, useProgress } from '../state/progress.ts'
import { clearRounds } from '../state/questionRounds.ts'
import { clearExamPractice, useExamPractice } from '../state/examPractice.ts'
import { clearMockHistory, clearMockSession, useMockHistory } from '../state/mockExam.ts'
import { clearReviews } from '../state/reviews.ts'
import { useSettings } from '../state/settings.ts'
import { AreaIcon } from './AreaIcon.tsx'
import { type Course, SUBJECTS, type Subject, courseById, hasLevelNames, isCourseAvailable, isSubjectAvailable, levelName, playableLevel } from './catalog.ts'
import { ErrorShape } from './ErrorShape.tsx'
import { examOverviewHref, practiceHref } from './routes.ts'
import { RecentDots } from './RecentDots.tsx'
import { RichText } from './RichText.tsx'
import { joinTitles } from './selection.ts'

// Fortschritt je Fach (M6 Schritt 1): kurz, Geübtes zuerst; je Thema auf Antippen die gelösten Aufgaben je Stufe und
// die häufigsten typischen Fehler mit gezieltem Üben

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

      {SUBJECTS.filter(isSubjectAvailable).map((subject) => (
        <SubjectProgress key={subject.id} subject={subject} />
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

// Ein Fach (M6 Schritt 1): geübte Themen zuerst (zuletzt geübtes oben) als kurze Karten, die übrigen in einer Zeile
function SubjectProgress({ subject }: { subject: Subject }) {
  const progress = useProgress()
  const courses = subject.areas.flatMap((area) => area.courses.filter(isCourseAvailable))
  const lastAt = (course: Course) => Math.max(-1, ...progress.attempts.filter((a) => a.course === course.id).map((a) => a.at))
  const hasErrors = (course: Course) => Object.keys(progress.errors).some((id) => isErrorOf(course.id, id) && findError(id))
  const practiced = courses.filter((course) => lastAt(course) >= 0 || hasErrors(course)).sort((a, b) => lastAt(b) - lastAt(a))
  const rest = courses.filter((course) => !practiced.includes(course))
  return (
    <section aria-labelledby={`subject-${subject.id}`} className="space-y-4">
      <h2 id={`subject-${subject.id}`} className="text-2xl font-semibold tracking-tight">
        {subject.title}
      </h2>
      {practiced.length === 0 ? (
        <p className="text-zinc-600">Noch nichts geübt.</p>
      ) : (
        <ul className="space-y-3">
          {practiced.map((course) => (
            <li key={course.id}>
              <CourseProgress course={course} />
            </li>
          ))}
        </ul>
      )}
      {rest.length > 0 && practiced.length > 0 && (
        <p className="text-sm text-pretty text-zinc-600">
          <span className="font-medium text-zinc-700">Noch nicht geübt:</span> {joinTitles(rest.map((course) => course.title))}
        </p>
      )}
    </section>
  )
}

// Kurze Karte eines Themas: die letzten Aufgaben über alle Stufen und der häufigste Fehler; „Einzelheiten" klappt die
// Stufen und die häufigsten Fehler mit gezieltem Üben auf
function CourseProgress({ course }: { course: Course }) {
  const { area } = courseById(course.id)!
  const progress = useProgress()
  const settings = useSettings()
  const [open, setOpen] = useState(false)
  const errors = topErrors(progress, 5, (id) => isErrorOf(course.id, id))
  const attempts = progress.attempts.filter((a) => a.course === course.id)
  const recent = attempts.slice(-SUGGEST_WINDOW)
  const recentClean = recent.filter((a) => a.clean).length
  // Gezielt üben in der gewählten Stufe und Art des Themas
  const level = playableLevel(course, settings.levels[course.id])
  const mode = course.free ? settings.practiceMode : 'guided'
  const detailsId = `details-${course.id}`
  return (
    <section aria-labelledby={`progress-${course.id}`} data-tone={area.tone} className="rounded-2xl border border-zinc-200">
      <div className="flex items-start gap-4 p-4">
        <AreaIcon kind={course.icon} className="size-12 shrink-0" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <h3 id={`progress-${course.id}`} className="text-lg font-semibold">
            {course.title}
          </h3>
          {attempts.length === 0 ? (
            <p className="text-sm text-zinc-600">Noch keine Aufgabe gelöst.</p>
          ) : (
            <>
              <RecentDots recent={recent} />
              <p className="text-sm text-zinc-600">
                {attempts.length} gelöst · zuletzt {recentClean} von {recent.length} ohne Fehler
              </p>
            </>
          )}
          {errors.length > 0 && (
            <p className="text-sm text-pretty text-zinc-600">
              Häufigster Fehler: <RichText text={findError(errors[0].id)!.name} inline />
            </p>
          )}
        </div>
      </div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={detailsId}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-11 w-full items-center justify-between rounded-b-2xl border-t border-zinc-100 px-4 py-2 font-medium text-accent-700 hover:bg-accent-50"
      >
        Einzelheiten
        <svg aria-hidden viewBox="0 0 24 24" className={`size-5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div id={detailsId} className="space-y-6 border-t border-zinc-100 p-4">
          <ul className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200" aria-label="Stufen">
            {course.levels
              .filter((l) => l.available)
              .map((l) => {
                const summary = levelSummary(progress, course.id, l.level)
                return (
                  <li key={l.level} className="flex gap-4 px-4 py-4" aria-label={levelName(course.id, l.level)}>
                    <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-50 font-semibold text-accent-700">
                      {l.level}
                    </span>
                    <div className="min-w-0 space-y-2">
                      {hasLevelNames(course.id) && <p className="text-sm font-semibold text-accent-700">{levelName(course.id, l.level)}</p>}
                      <p className="font-medium">{l.title}</p>
                      {summary.solved === 0 ? (
                        <p className="text-sm text-zinc-500">Noch keine Aufgabe gelöst.</p>
                      ) : (
                        <>
                          <RecentDots recent={summary.recent} />
                          <p className="text-sm text-zinc-600">
                            {summary.solved} gelöst · zuletzt {summary.recentClean} von {summary.recent.length} ohne Fehler
                          </p>
                        </>
                      )}
                    </div>
                  </li>
                )
              })}
          </ul>

          <section aria-labelledby={`errors-${course.id}`} className="space-y-3">
            <h4 id={`errors-${course.id}`} className="text-lg font-semibold">
              Deine häufigsten Fehler
            </h4>
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
        </div>
      )}
    </section>
  )
}
