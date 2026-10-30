import { Suspense, lazy, use, useEffect } from 'react'
import type { Level, TaskRef } from '../engine/tasks/taskNumber.ts'
import { updateSettings, useSettings } from '../state/settings.ts'
import type { PracticeMode } from '../state/storage.ts'
import { TaskScreen } from './guided/TaskScreen.tsx'
import { courseById, isLevelAvailable } from './catalog.ts'
import { loadCourseEngine } from './courseEngines.ts'
import { knownFocus, newTaskHref } from './practice.ts'
import { courseHref, taskHref } from './routes.ts'

// Eine Aufgabe üben, geführt oder frei

// Der freie Modus mit der Mathe-Tastatur ist groß und wird erst bei Bedarf geladen
const FreeTaskScreen = lazy(() => import('./free/FreeTaskScreen.tsx'))

type PracticeProps = { course: string; mode: PracticeMode; level: Level; seed: number | null; focus: string | null }

export default function PracticePage({ course: courseId, mode: wantedMode, level, seed, focus: wanted }: PracticeProps) {
  const { course } = courseById(courseId)!
  const focus = knownFocus(courseId, wanted)
  // Ohne freien Modus (Brüche bis Schritt 5): geführt mit derselben Aufgabe
  const mode = course.free ? wantedMode : 'guided'
  const redirect = seed === null || mode !== wantedMode

  // Ohne Nummer: neue Aufgabe würfeln und ihre Nummer in die Adresse schreiben,
  // damit Neuladen dieselbe Aufgabe zeigt
  useEffect(() => {
    if (seed === null) window.location.replace(newTaskHref(courseId, mode, level, focus))
    else if (mode !== wantedMode) window.location.replace(taskHref(courseId, { level, seed }, mode, focus))
  }, [courseId, mode, wantedMode, level, seed, focus])

  // „Weitermachen" auf der Startseite führt zum zuletzt geübten Thema
  const { lastCourse } = useSettings()
  useEffect(() => {
    if (lastCourse !== courseId) updateSettings({ lastCourse: courseId })
  }, [lastCourse, courseId])

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
        <FreeTaskScreen key={key} course={courseId} taskRef={taskRef} focus={focus} />
      </Suspense>
    )
  }
  return <GuidedPractice key={key} course={courseId} taskRef={taskRef} focus={focus} />
}

// Wartet auf die Engine des Themas (App.tsx zeigt so lange „Wird geladen …")
function GuidedPractice({ course, taskRef, focus }: { course: string; taskRef: TaskRef; focus: string | null }) {
  const engine = use(loadCourseEngine(course))
  return <TaskScreen course={course} engine={engine} taskRef={taskRef} focus={focus} />
}
