import { useEffect, useState } from 'react'
import { dueReviewsOf, waitingReviewCount } from '../state/reviews.ts'
import { subjectById, subjectCourseIds } from './catalog.ts'
import { loadCourseEngine } from './courseEngines.ts'
import { pickReviewTask } from './reviewPick.ts'
import { examOverviewHref, taskHref } from './routes.ts'

// „Wiederholen" über alle Themen eines Fachs (S11, #/wiederholen/<fach>): wählt die am längsten fällige Frage
// (state/reviews.ts, dueReviewsOf), lädt die Engine ihres Themas für die Stufe (reviewPick.ts) und leitet zur Aufgabe
// mit ?wiederholen=<fach> weiter, damit Neuladen dieselbe Aufgabe zeigt. Dort führt „Nächste Aufgabe" wieder hierher.
// Wiederholt wird immer geführt (Wissensfragen gibt es nur geführt), ohne Rücksicht auf angekreuzte Unterthemen.
// Ist nichts mehr fällig: „Für heute ist alles wiederholt".

export default function ReviewPage({ subject: subjectId }: { subject: string }) {
  const subject = subjectById(subjectId)!
  const [state, setState] = useState<'loading' | 'done' | 'failed'>('loading')
  useEffect(() => {
    let cancelled = false
    const courses = subjectCourseIds(subject)
    pickReviewTask(dueReviewsOf(courses), async (course, seed) => {
      const engine = await loadCourseEngine(course)
      // ohne resolve (Mathe) gibt es keine Wissensfragen
      return engine.resolve ? engine.resolve({ level: 1, seed }) : null
    })
      .then((picked) => {
        if (cancelled) return
        if (picked) window.location.replace(taskHref(picked.course, picked.ref, 'guided', null, null, subject.id))
        else setState('done')
      })
      .catch(() => {
        if (!cancelled) setState('failed')
      })
    return () => {
      cancelled = true
    }
  }, [subject])

  // Hinweis erst nach einer Weile (wie beim Laden der Seiten in App.tsx): Meist geht es sofort weiter
  if (state === 'loading') return <p className="animate-late text-zinc-500">Wird geladen …</p>
  if (state === 'failed') {
    return (
      <main className="space-y-4">
        <h1 className="text-2xl font-semibold text-balance">Die Aufgaben ließen sich nicht laden.</h1>
        <p className="text-pretty text-zinc-600">Prüfe die Internetverbindung und versuche es noch einmal.</p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex min-h-11 items-center rounded-xl bg-accent-700 px-4 font-medium text-on-accent hover:bg-accent-800"
          >
            Noch einmal versuchen
          </button>
          <a href="#/" className="inline-flex min-h-11 items-center rounded-xl border border-zinc-300 px-4 font-medium hover:bg-zinc-50">
            Zur Startseite
          </a>
        </div>
      </main>
    )
  }
  const waiting = waitingReviewCount(subjectCourseIds(subject))
  return (
    <main className="space-y-4">
      <h1 className="text-3xl font-semibold tracking-tight text-balance">Für heute ist alles wiederholt</h1>
      <p className="text-pretty text-zinc-600" data-testid="review-done-text">
        {waiting > 0
          ? `${waiting === 1 ? 'Eine Frage kommt' : `${waiting} Fragen kommen`} später wieder: nach drei anderen Aufgaben oder an einem der nächsten Tage.`
          : `In ${subject.title} wartet gerade keine Frage auf eine Wiederholung. Falsch beantwortete Fragen kommen von selbst wieder.`}
      </p>
      <div className="flex flex-wrap gap-3">
        <a href="#/" className="inline-flex min-h-11 items-center rounded-xl bg-accent-700 px-5 font-medium text-on-accent hover:bg-accent-800">
          Zur Startseite
        </a>
        {subject.mock && (
          <a href={examOverviewHref(subject.id)} className="inline-flex min-h-11 items-center rounded-xl border border-zinc-300 px-5 font-medium hover:bg-zinc-50">
            Klausur-Überblick
          </a>
        )}
      </div>
    </main>
  )
}
