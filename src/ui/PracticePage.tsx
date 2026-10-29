import { Suspense, lazy, useEffect } from 'react'
import type { Level } from '../engine/tasks/taskNumber.ts'
import type { PracticeMode } from '../state/storage.ts'
import { TaskScreen } from './guided/TaskScreen.tsx'
import { knownFocus, newTaskHref } from './practice.ts'
import { isLevelAvailable } from './samples.ts'

// Eine Aufgabe üben, geführt oder frei

// Der freie Modus mit der Mathe-Tastatur ist groß und wird erst bei Bedarf geladen
const FreeTaskScreen = lazy(() => import('./free/FreeTaskScreen.tsx'))

type PracticeProps = { mode: PracticeMode; level: Level; seed: number | null; focus: string | null }

export default function PracticePage({ mode, level, seed, focus: wanted }: PracticeProps) {
  const focus = knownFocus(wanted)
  // Ohne Nummer: neue Aufgabe würfeln und ihre Nummer in die Adresse schreiben,
  // damit Neuladen dieselbe Aufgabe zeigt
  useEffect(() => {
    if (seed === null) window.location.replace(newTaskHref(mode, level, focus))
  }, [mode, level, seed, focus])
  if (seed === null) return null
  if (!isLevelAvailable(level)) {
    return (
      <main className="space-y-4">
        <h1 className="text-2xl font-semibold">Stufe {level} kommt bald</h1>
        <a href="#/" className="inline-block rounded-xl border border-zinc-300 px-4 py-2.5 font-medium hover:bg-zinc-50">
          Zur Startseite
        </a>
      </main>
    )
  }
  const key = `${level}-${seed}-${focus ?? ''}`
  if (mode === 'free') {
    return (
      <Suspense fallback={<p className="text-zinc-500">Mathe-Tastatur wird geladen …</p>}>
        <FreeTaskScreen key={key} taskRef={{ level, seed }} focus={focus} />
      </Suspense>
    )
  }
  return <TaskScreen key={key} taskRef={{ level, seed }} focus={focus} />
}
