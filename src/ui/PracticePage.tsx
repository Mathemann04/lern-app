import { Suspense, lazy, use, useEffect } from 'react'
import { type Level, type TaskRef, randomSeed } from '../engine/tasks/taskNumber.ts'
import { pickFresh } from '../engine/tasks/variety.ts'
import { updateSettings, useSettings } from '../state/settings.ts'
import type { PracticeMode } from '../state/storage.ts'
import { TaskScreen } from './guided/TaskScreen.tsx'
import { courseById, isLevelAvailable } from './catalog.ts'
import { type CourseEngine, loadCourseEngine } from './courseEngines.ts'
import { recentForms, rememberForm } from './recentForms.ts'
import { knownFocus, newTaskHref } from './practice.ts'
import { courseHref, taskHref } from './routes.ts'

// Eine Aufgabe üben, geführt oder frei

// Der freie Modus mit der Mathe-Tastatur ist groß und wird erst bei Bedarf geladen
const FreeTaskScreen = lazy(() => import('./free/FreeTaskScreen.tsx'))

type PracticeProps = { course: string; mode: PracticeMode; level: Level; seed: number | null; focus: string | null }

export default function PracticePage({ course: courseId, mode: wantedMode, level, seed, focus: wanted }: PracticeProps) {
  const { course } = courseById(courseId)!
  const focus = knownFocus(courseId, wanted)
  // Ohne freien Modus: geführt mit derselben Aufgabe
  const mode = course.free ? wantedMode : 'guided'
  const redirect = seed === null || mode !== wantedMode

  // Ohne Nummer: neue Aufgabe würfeln und ihre Nummer in die Adresse schreiben, damit Neuladen
  // dieselbe Aufgabe zeigt. Gezielt üben sucht eine passende Aufgabe; sonst wählt PickNewTask eine
  // mit anderer Form als die letzten (dafür braucht es die Engine).
  const pick = seed === null && !focus && isLevelAvailable(course, level)
  useEffect(() => {
    if (seed === null && !pick) {
      // Die Suche beim gezielten Üben kann ein paar Sekunden dauern: erst den Hinweis zeigen
      const timer = window.setTimeout(() => void newTaskHref(courseId, mode, level, focus).then((href) => window.location.replace(href)), 30)
      return () => window.clearTimeout(timer)
    }
    if (seed !== null && mode !== wantedMode) window.location.replace(taskHref(courseId, { level, seed }, mode, focus))
  }, [courseId, mode, wantedMode, level, seed, focus, pick])

  // „Weitermachen" auf der Startseite führt zum zuletzt geübten Thema
  const { lastCourse } = useSettings()
  useEffect(() => {
    if (lastCourse !== courseId) updateSettings({ lastCourse: courseId })
  }, [lastCourse, courseId])

  if (pick) return <PickNewTask course={courseId} level={level} mode={mode} />
  if (seed === null && focus) return <p className="text-zinc-500">Suche eine Aufgabe, in der dieser Fehler passieren kann …</p>
  if (redirect) return null
  if (!isLevelAvailable(course, level)) {
    return (
      <main className="space-y-4">
        <h1 className="text-2xl font-semibold">Stufe {level} kommt bald</h1>
        <a href={courseHref(courseId)} className="inline-block rounded-xl border border-zinc-300 px-4 py-2.5 font-medium hover:bg-zinc-50">
          Zur Übersicht
        </a>
      </main>
    )
  }
  const taskRef = { level, seed: seed! }
  const key = `${courseId}-${level}-${seed}-${focus ?? ''}`
  if (mode === 'free') {
    return (
      <Suspense fallback={<p className="text-zinc-500">Mathe-Tastatur wird geladen …</p>}>
        <FreePractice key={key} course={courseId} taskRef={taskRef} focus={focus} />
      </Suspense>
    )
  }
  return <GuidedPractice key={key} course={courseId} taskRef={taskRef} focus={focus} />
}

// Neue Aufgabe, deren Form nicht unter den letzten dieser Stufe ist
function PickNewTask({ course, level, mode }: { course: string; level: Level; mode: PracticeMode }) {
  const engine = use(loadCourseEngine(course))
  useEffect(() => {
    const seed = pickFresh((s) => engine.formOf({ level, seed: s }), recentForms(course, level), randomSeed)
    window.location.replace(taskHref(course, { level, seed }, mode, null))
  }, [engine, course, level, mode])
  return null
}

// Merkt sich die Form der gezeigten Aufgabe
function useRememberForm(course: string, engine: CourseEngine, taskRef: TaskRef) {
  const { level, seed } = taskRef
  useEffect(() => rememberForm(course, level, engine.formOf({ level, seed })), [course, engine, level, seed])
}

// Wartet auf die Engine des Themas (App.tsx zeigt so lange „Wird geladen …")
function GuidedPractice({ course, taskRef, focus }: { course: string; taskRef: TaskRef; focus: string | null }) {
  const engine = use(loadCourseEngine(course))
  useRememberForm(course, engine, taskRef)
  return <TaskScreen course={course} engine={engine} taskRef={taskRef} focus={focus} />
}

function FreePractice({ course, taskRef, focus }: { course: string; taskRef: TaskRef; focus: string | null }) {
  const engine = use(loadCourseEngine(course))
  useRememberForm(course, engine, taskRef)
  return <FreeTaskScreen course={course} engine={engine} taskRef={taskRef} focus={focus} />
}
