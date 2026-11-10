import { Suspense, lazy, use, useEffect, useState } from 'react'
import type { Level, TaskRef } from '../engine/tasks/taskNumber.ts'
import { rememberShown, shownInRound, startNewRound } from '../state/questionRounds.ts'
import { setLastMix, updateSettings, useSettings } from '../state/settings.ts'
import { getAppState } from '../state/store.ts'
import type { PracticeMode } from '../state/storage.ts'
import { TaskScreen } from './guided/TaskScreen.tsx'
import { courseById, isLevelAvailable, levelCount, levelName, subjectById } from './catalog.ts'
import { type CourseEngine, loadCourseEngine } from './courseEngines.ts'
import { type MixEngine, pickMixed } from './mix.ts'
import { recentForms, rememberForm } from './recentForms.ts'
import { knownFocus, newTaskHref, pickNewSeed, questionNoOf } from './practice.ts'
import { courseHref, mixHref, mixPracticeHref, practiceHref, taskHref } from './routes.ts'
import { mixBlockedHint, mixedCourses, selectedParts } from './selection.ts'

// Eine Aufgabe üben, geführt oder frei; mix: Id des Fachs, wenn die Aufgabe aus „Themen mischen"
// kommt (?mischen=): Dann führen X, „Zur Übersicht" und „Nächste Aufgabe" zur Mischung zurück, und
// Weiterleitungen behalten die Mischung. Fortschritt, Fehler, Runden und Formen zählen beim Thema.

// Der freie Modus mit der Mathe-Tastatur ist groß und wird erst bei Bedarf geladen
const FreeTaskScreen = lazy(() => import('./free/FreeTaskScreen.tsx'))

type PracticeProps = { course: string; mode: PracticeMode; level: Level; seed: number | null; focus: string | null; mix: string | null }

export default function PracticePage({ course: courseId, mode: wantedMode, level, seed, focus: wanted, mix }: PracticeProps) {
  const { course } = courseById(courseId)!
  const focus = knownFocus(courseId, wanted)
  // Ohne freien Modus: geführt mit derselben Aufgabe
  const mode = course.free ? wantedMode : 'guided'
  // Eine Stufe über der Zahl der Stufen des Fachs (z. B. Stufe 5 in Chemie) führt zur höchsten
  const highest = levelCount(courseId) as Level
  const tooHigh = level > highest
  const redirect = seed === null || mode !== wantedMode || tooHigh

  // Ohne Nummer: neue Aufgabe würfeln und ihre Nummer in die Adresse schreiben, damit Neuladen
  // dieselbe Aufgabe zeigt. Gezielt üben sucht eine passende Aufgabe; sonst wählt PickNewTask eine
  // mit anderer Form als die letzten (dafür braucht es die Engine).
  const pick = seed === null && !focus && !tooHigh && isLevelAvailable(course, level)
  useEffect(() => {
    if (tooHigh) {
      window.location.replace(
        seed === null ? practiceHref(courseId, highest, mode, focus, mix) : taskHref(courseId, { level: highest, seed }, mode, focus, mix),
      )
      return
    }
    if (seed === null && !pick) {
      // Die Suche beim gezielten Üben kann ein paar Sekunden dauern: erst den Hinweis zeigen
      const timer = window.setTimeout(() => void newTaskHref(courseId, mode, level, focus).then((href) => window.location.replace(href)), 30)
      return () => window.clearTimeout(timer)
    }
    if (seed !== null && mode !== wantedMode) window.location.replace(taskHref(courseId, { level, seed }, mode, focus, mix))
  }, [courseId, mode, wantedMode, level, seed, focus, pick, tooHigh, highest, mix])

  // „Weitermachen" auf der Startseite führt zum zuletzt geübten Thema bzw. zur zuletzt geübten Mischung
  const { lastCourse } = useSettings()
  useEffect(() => {
    if (lastCourse !== courseId) updateSettings({ lastCourse: courseId })
    setLastMix(mix)
  }, [lastCourse, courseId, mix])

  if (pick) return <PickNewTask course={courseId} level={level} mode={mode} mix={mix} />
  if (seed === null && focus && !tooHigh) return <p className="text-zinc-500">Suche eine Aufgabe, in der dieser Fehler passieren kann …</p>
  if (redirect) return null
  if (!isLevelAvailable(course, level)) {
    return (
      <main className="space-y-4">
        <h1 className="text-2xl font-semibold">{levelName(courseId, level)} kommt bald</h1>
        <a href={mix ? mixHref(mix) : courseHref(courseId)} className="inline-block rounded-xl border border-zinc-300 px-4 py-2.5 font-medium hover:bg-zinc-50">
          Zur Übersicht
        </a>
      </main>
    )
  }
  const taskRef = { level, seed: seed! }
  const key = `${courseId}-${level}-${seed}-${focus ?? ''}-${mix ?? ''}`
  return <ResolvedPractice key={key} course={courseId} mode={mode} taskRef={taskRef} focus={focus} mix={mix} />
}

type ResolvedProps = { course: string; mode: PracticeMode; taskRef: TaskRef; focus: string | null; mix: string | null }

// Prüft mit der Engine, ob es die Aufgabe gibt und zu welcher Stufe sie gehört (bei Wissensfragen legt
// die Nummer die Stufe fest), dann geführt oder frei
function ResolvedPractice({ course, mode, taskRef, focus, mix }: ResolvedProps) {
  const engine = use(loadCourseEngine(course))
  const actual = engine.resolve ? engine.resolve(taskRef) : taskRef.level
  const wrongLevel = actual !== null && actual !== taskRef.level
  useEffect(() => {
    if (wrongLevel) window.location.replace(taskHref(course, { level: actual, seed: taskRef.seed }, mode, focus, mix))
  }, [wrongLevel, course, actual, taskRef.seed, mode, focus, mix])
  if (actual === null) return <MissingTask course={course} level={taskRef.level} mode={mode} mix={mix} />
  if (wrongLevel) return null
  if (mode === 'free') {
    return (
      <Suspense fallback={<p className="text-zinc-500">Mathe-Tastatur wird geladen …</p>}>
        <FreePractice course={course} engine={engine} taskRef={taskRef} focus={focus} mix={mix} />
      </Suspense>
    )
  }
  return <GuidedPractice course={course} engine={engine} taskRef={taskRef} focus={focus} mix={mix} />
}

// Eine Nummer, zu der es keine Aufgabe (mehr) gibt, z. B. eine gelöschte Frage; in der Mischung geht es
// mit einer neuen gemischten Aufgabe weiter
function MissingTask({ course, level, mode, mix }: { course: string; level: Level; mode: PracticeMode; mix: string | null }) {
  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold">Diese Aufgabe gibt es nicht (mehr).</h1>
      <div className="flex flex-wrap gap-3">
        <a
          href={mix ? mixPracticeHref(mix, level) : practiceHref(course, level, mode)}
          className="inline-block rounded-xl bg-accent-700 px-4 py-2.5 font-medium text-on-accent hover:bg-accent-800"
        >
          Neue Aufgabe
        </a>
        <a href={mix ? mixHref(mix) : courseHref(course)} className="inline-block rounded-xl border border-zinc-300 px-4 py-2.5 font-medium hover:bg-zinc-50">
          Zur Übersicht
        </a>
      </div>
    </main>
  )
}

// Neue Aufgabe, deren Form nicht unter den letzten dieser Stufe ist; Nummern liefert die Engine des
// Themas (Wissensfragen: eine Frage der Stufe und der angekreuzten Unterthemen, die in der laufenden
// Runde noch nicht dran war) oder der Zufall
function PickNewTask({ course, level, mode, mix }: { course: string; level: Level; mode: PracticeMode; mix: string | null }) {
  const engine = use(loadCourseEngine(course))
  useEffect(() => {
    // Auswahl beim Würfeln lesen (nicht als Abhängigkeit: Sonst würfelte eine Änderung der Einstellungen neu)
    const parts = selectedParts(courseById(course)!.course, getAppState().settings, level)
    const { seed, newRound } = pickNewSeed(engine, level, recentForms(course, level), shownInRound(course, level), parts)
    if (newRound) startNewRound(course, level, engine.questionNos?.(level, parts))
    window.location.replace(taskHref(course, { level, seed }, mode, null, mix))
  }, [engine, course, level, mode, mix])
  return null
}

// Merkt sich die Form der gezeigten Aufgabe, bei Wissensfragen auch die Frage für die Runde
function useRememberForm(course: string, engine: CourseEngine, taskRef: TaskRef) {
  const { level, seed } = taskRef
  useEffect(() => {
    rememberForm(course, level, engine.formOf({ level, seed }))
    const no = questionNoOf(engine, seed)
    if (no !== null) rememberShown(course, level, no)
  }, [course, engine, level, seed])
}

type PracticeScreenProps = { course: string; engine: CourseEngine; taskRef: TaskRef; focus: string | null; mix: string | null }

function GuidedPractice({ course, engine, taskRef, focus, mix }: PracticeScreenProps) {
  useRememberForm(course, engine, taskRef)
  return <TaskScreen course={course} engine={engine} taskRef={taskRef} focus={focus} mix={mix} />
}

function FreePractice({ course, engine, taskRef, focus, mix }: PracticeScreenProps) {
  useRememberForm(course, engine, taskRef)
  return <FreeTaskScreen course={course} engine={engine} taskRef={taskRef} focus={focus} mix={mix} />
}

// Neue gemischte Aufgabe (#/mischen/chemie/2): lädt die Engines der Themen, die drankommen
// (selection.ts, mixedCourses), wählt Thema und Aufgabe (mix.ts, pickMixed) und leitet zur Aufgabe mit
// ?mischen= weiter, damit Neuladen dieselbe Aufgabe zeigt. Die Frage merkt sich useRememberForm beim
// Anzeigen wie sonst auch. Bis dahin „Wird geladen …"; gibt es nichts zu üben oder lassen sich die Teile
// nicht laden: Hinweis mit dem Weg zur Auswahl.
export function MixPracticePage({ subject: subjectId, level }: { subject: string; level: Level }) {
  const subject = subjectById(subjectId)!
  const [state, setState] = useState<'loading' | 'empty' | 'failed'>('loading')
  useEffect(() => {
    let cancelled = false
    // Auswahl beim Würfeln lesen (nicht als Abhängigkeit: Sonst würfelte eine Änderung neu)
    const settings = getAppState().settings
    const courses = mixedCourses(subject, settings, level)
    Promise.all(courses.map((course) => loadCourseEngine(course.id)))
      .then((engines) => {
        if (cancelled) return
        const byId = new Map<string, MixEngine>(courses.map((course, i) => [course.id, engines[i]]))
        const picked = pickMixed({
          courses,
          level,
          engineOf: (course) => byId.get(course)!,
          shownOf: (course) => shownInRound(course, level),
          recentOf: (course) => recentForms(course, level),
          partsOf: (course) => selectedParts(courseById(course)!.course, settings, level),
        })
        if (!picked) {
          setState('empty')
          return
        }
        if (picked.newRound) startNewRound(picked.course, level, picked.nos)
        // Art für alle Themen gleich, ohne freien Modus geführt
        const mode = courseById(picked.course)!.course.free ? settings.practiceMode : 'guided'
        window.location.replace(taskHref(picked.course, { level, seed: picked.seed }, mode, null, subject.id))
      })
      .catch(() => {
        if (!cancelled) setState('failed')
      })
    return () => {
      cancelled = true
    }
  }, [subject, level])
  // Hinweis erst nach einer Weile (wie beim Laden der Seiten in App.tsx): Meist geht es sofort weiter
  if (state === 'loading') return <p className="animate-late text-zinc-500">Wird geladen …</p>
  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold text-balance">
        {state === 'empty' ? 'Gerade gibt es nichts zu mischen.' : 'Die Aufgaben ließen sich nicht laden.'}
      </h1>
      <p className="text-zinc-600 text-pretty">
        {state === 'empty'
          ? mixBlockedHint(subject, getAppState().settings, level)
          : 'Prüfe die Internetverbindung und versuche es noch einmal.'}
      </p>
      <div className="flex flex-wrap gap-3">
        {state === 'failed' && (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-block rounded-xl bg-accent-700 px-4 py-2.5 font-medium text-on-accent hover:bg-accent-800"
          >
            Noch einmal versuchen
          </button>
        )}
        <a
          href={mixHref(subject.id)}
          className={
            state === 'empty'
              ? 'inline-block rounded-xl bg-accent-700 px-4 py-2.5 font-medium text-on-accent hover:bg-accent-800'
              : 'inline-block rounded-xl border border-zinc-300 px-4 py-2.5 font-medium hover:bg-zinc-50'
          }
        >
          Zur Auswahl
        </a>
      </div>
    </main>
  )
}
