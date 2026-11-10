import { Suspense, lazy, use, useEffect } from 'react'
import type { Level, TaskRef } from '../engine/tasks/taskNumber.ts'
import { rememberShown, shownInRound, startNewRound } from '../state/questionRounds.ts'
import { updateSettings, useSettings } from '../state/settings.ts'
import type { PracticeMode } from '../state/storage.ts'
import { TaskScreen } from './guided/TaskScreen.tsx'
import { courseById, isLevelAvailable, levelCount, levelName } from './catalog.ts'
import { type CourseEngine, loadCourseEngine } from './courseEngines.ts'
import { recentForms, rememberForm } from './recentForms.ts'
import { knownFocus, newTaskHref, pickNewSeed, questionNoOf } from './practice.ts'
import { courseHref, practiceHref, taskHref } from './routes.ts'

// Eine Aufgabe üben, geführt oder frei

// Der freie Modus mit der Mathe-Tastatur ist groß und wird erst bei Bedarf geladen
const FreeTaskScreen = lazy(() => import('./free/FreeTaskScreen.tsx'))

type PracticeProps = { course: string; mode: PracticeMode; level: Level; seed: number | null; focus: string | null }

export default function PracticePage({ course: courseId, mode: wantedMode, level, seed, focus: wanted }: PracticeProps) {
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
      window.location.replace(seed === null ? practiceHref(courseId, highest, mode, focus) : taskHref(courseId, { level: highest, seed }, mode, focus))
      return
    }
    if (seed === null && !pick) {
      // Die Suche beim gezielten Üben kann ein paar Sekunden dauern: erst den Hinweis zeigen
      const timer = window.setTimeout(() => void newTaskHref(courseId, mode, level, focus).then((href) => window.location.replace(href)), 30)
      return () => window.clearTimeout(timer)
    }
    if (seed !== null && mode !== wantedMode) window.location.replace(taskHref(courseId, { level, seed }, mode, focus))
  }, [courseId, mode, wantedMode, level, seed, focus, pick, tooHigh, highest])

  // „Weitermachen" auf der Startseite führt zum zuletzt geübten Thema
  const { lastCourse } = useSettings()
  useEffect(() => {
    if (lastCourse !== courseId) updateSettings({ lastCourse: courseId })
  }, [lastCourse, courseId])

  if (pick) return <PickNewTask course={courseId} level={level} mode={mode} />
  if (seed === null && focus && !tooHigh) return <p className="text-zinc-500">Suche eine Aufgabe, in der dieser Fehler passieren kann …</p>
  if (redirect) return null
  if (!isLevelAvailable(course, level)) {
    return (
      <main className="space-y-4">
        <h1 className="text-2xl font-semibold">{levelName(courseId, level)} kommt bald</h1>
        <a href={courseHref(courseId)} className="inline-block rounded-xl border border-zinc-300 px-4 py-2.5 font-medium hover:bg-zinc-50">
          Zur Übersicht
        </a>
      </main>
    )
  }
  const taskRef = { level, seed: seed! }
  const key = `${courseId}-${level}-${seed}-${focus ?? ''}`
  return <ResolvedPractice key={key} course={courseId} mode={mode} taskRef={taskRef} focus={focus} />
}

type ResolvedProps = { course: string; mode: PracticeMode; taskRef: TaskRef; focus: string | null }

// Prüft mit der Engine, ob es die Aufgabe gibt und zu welcher Stufe sie gehört (bei Wissensfragen legt
// die Nummer die Stufe fest), dann geführt oder frei
function ResolvedPractice({ course, mode, taskRef, focus }: ResolvedProps) {
  const engine = use(loadCourseEngine(course))
  const actual = engine.resolve ? engine.resolve(taskRef) : taskRef.level
  const wrongLevel = actual !== null && actual !== taskRef.level
  useEffect(() => {
    if (wrongLevel) window.location.replace(taskHref(course, { level: actual, seed: taskRef.seed }, mode, focus))
  }, [wrongLevel, course, actual, taskRef.seed, mode, focus])
  if (actual === null) return <MissingTask course={course} level={taskRef.level} mode={mode} />
  if (wrongLevel) return null
  if (mode === 'free') {
    return (
      <Suspense fallback={<p className="text-zinc-500">Mathe-Tastatur wird geladen …</p>}>
        <FreePractice course={course} engine={engine} taskRef={taskRef} focus={focus} />
      </Suspense>
    )
  }
  return <GuidedPractice course={course} engine={engine} taskRef={taskRef} focus={focus} />
}

// Eine Nummer, zu der es keine Aufgabe (mehr) gibt, z. B. eine gelöschte Frage
function MissingTask({ course, level, mode }: { course: string; level: Level; mode: PracticeMode }) {
  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold">Diese Aufgabe gibt es nicht (mehr).</h1>
      <div className="flex flex-wrap gap-3">
        <a
          href={practiceHref(course, level, mode)}
          className="inline-block rounded-xl bg-accent-700 px-4 py-2.5 font-medium text-on-accent hover:bg-accent-800"
        >
          Neue Aufgabe
        </a>
        <a href={courseHref(course)} className="inline-block rounded-xl border border-zinc-300 px-4 py-2.5 font-medium hover:bg-zinc-50">
          Zur Übersicht
        </a>
      </div>
    </main>
  )
}

// Neue Aufgabe, deren Form nicht unter den letzten dieser Stufe ist; Nummern liefert die Engine des
// Themas (Wissensfragen: eine Frage der Stufe, die in der laufenden Runde noch nicht dran war) oder der
// Zufall
function PickNewTask({ course, level, mode }: { course: string; level: Level; mode: PracticeMode }) {
  const engine = use(loadCourseEngine(course))
  useEffect(() => {
    const { seed, newRound } = pickNewSeed(engine, level, recentForms(course, level), shownInRound(course, level))
    if (newRound) startNewRound(course, level)
    window.location.replace(taskHref(course, { level, seed }, mode, null))
  }, [engine, course, level, mode])
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

type PracticeScreenProps = { course: string; engine: CourseEngine; taskRef: TaskRef; focus: string | null }

function GuidedPractice({ course, engine, taskRef, focus }: PracticeScreenProps) {
  useRememberForm(course, engine, taskRef)
  return <TaskScreen course={course} engine={engine} taskRef={taskRef} focus={focus} />
}

function FreePractice({ course, engine, taskRef, focus }: PracticeScreenProps) {
  useRememberForm(course, engine, taskRef)
  return <FreeTaskScreen course={course} engine={engine} taskRef={taskRef} focus={focus} />
}
