import type { Level } from '../engine/tasks/taskNumber.ts'
import { levelSummary, useProgress } from '../state/progress.ts'
import { updateSettings } from '../state/settings.ts'
import type { PracticeMode } from '../state/storage.ts'
import type { Course } from './catalog.ts'
import { cardFolderHref } from './routes.ts'

// Teile, die die Seite eines Themas (CourseScreen.tsx, Chemie) und die Seite einer Tätigkeit (ActivityScreen.tsx, Mathe
// seit M6) gemeinsam haben

const MODES: Array<{ value: PracticeMode; title: string; description: string }> = [
  { value: 'guided', title: 'Geführt', description: 'Auswahl-Antworten' },
  { value: 'free', title: 'Frei', description: 'Selbst eintippen' },
]

// Wahl „Geführt" oder „Frei" (gilt für alle Themen); ohne freien Modus ist „Frei" gesperrt mit „kommt bald"
export function ModeSwitch({ course, mode }: { course: Course; mode: PracticeMode }) {
  return (
    <fieldset>
      <legend className="sr-only">Wie willst du üben?</legend>
      <div className="flex gap-1 rounded-xl bg-zinc-100 p-1">
        {MODES.map((option) => {
          const disabled = option.value === 'free' && !course.free
          const checked = (course.free ? mode : 'guided') === option.value
          return (
            <label
              key={option.value}
              className={`flex-1 rounded-lg px-3 py-2 text-center transition-colors has-focus-visible:ring-2 has-focus-visible:ring-accent-600 ${
                checked ? 'bg-raised shadow-sm' : disabled ? 'text-zinc-500' : 'cursor-pointer text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <input
                type="radio"
                name="art"
                className="sr-only"
                checked={checked}
                disabled={disabled}
                onChange={() => updateSettings({ practiceMode: option.value })}
              />
              {/* Im Dunkeln eine Stufe heller: auf der grauen Fläche sonst zu wenig Kontrast */}
              <span className={`block font-medium ${checked ? 'text-accent-700 dark:text-accent-800' : ''}`}>{option.title}</span>
              <span className="block text-sm text-zinc-500">{disabled ? 'kommt bald' : option.description}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

// „12 gelöst · zuletzt 8 von 10 ohne Fehler"; nichts, solange noch keine Aufgabe gelöst ist
export function LevelProgressLine({ course, level }: { course: string; level: Level }) {
  const { solved, recent, recentClean } = levelSummary(useProgress(), course, level)
  if (solved === 0) return null
  return (
    <span className="block text-sm text-zinc-500">
      {solved} gelöst · zuletzt {recentClean} von {recent.length} ohne Fehler
    </span>
  )
}

// Links unten auf der Seite: Lernkarten des Themas und Fortschritt
export function CourseLinks({ course }: { course: Course }) {
  return (
    <>
      {course.cards && (
        <a
          href={cardFolderHref(course.cards)}
          className="flex items-center justify-between border-t border-zinc-100 px-5 py-4 font-medium text-accent-700 hover:bg-accent-50"
        >
          Lernkarten: alle Regeln im Überblick
          <span aria-hidden>→</span>
        </a>
      )}
      <a
        href="#/fortschritt"
        className="flex items-center justify-between rounded-b-2xl border-t border-zinc-100 px-5 py-4 font-medium text-accent-700 hover:bg-accent-50"
      >
        Dein Fortschritt und deine häufigsten Fehler
        <span aria-hidden>→</span>
      </a>
    </>
  )
}
