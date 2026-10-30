import type { Level } from '../engine/tasks/taskNumber.ts'
import { levelSummary, useProgress } from '../state/progress.ts'
import { setCourseLevel, updateSettings, useSettings } from '../state/settings.ts'
import type { PracticeMode } from '../state/storage.ts'
import { AreaIcon } from './AreaIcon.tsx'
import { BackLink } from './BackLink.tsx'
import { courseById, playableLevel } from './catalog.ts'
import { Formula } from './Formula.tsx'
import { areaHref, cardFolderHref, practiceHref } from './routes.ts'

const MODES: Array<{ value: PracticeMode; title: string; description: string }> = [
  { value: 'guided', title: 'Geführt', description: 'Auswahl-Antworten' },
  { value: 'free', title: 'Frei', description: 'Selbst eintippen' },
]

// Ein Thema, z. B. „Brüche": Art und Stufe wählen, dann üben. Die Stufe merkt sich jedes Thema
// selbst, die Art (geführt oder frei) gilt für alle.
export function CourseScreen({ id }: { id: string }) {
  const { area, course } = courseById(id)!
  const settings = useSettings()
  // Eine gespeicherte Stufe, die (noch) nicht spielbar ist, zählt als erste spielbare
  const selected = playableLevel(course, settings.levels[id])
  // Ohne freien Modus wird geführt geübt
  const practiceMode: PracticeMode = course.free ? settings.practiceMode : 'guided'
  return (
    <main className="space-y-6">
      <div className="space-y-3">
        <BackLink href={areaHref(area.id)} label={area.title} />
        <div className="flex items-center gap-4">
          <AreaIcon kind={course.icon} className="size-16 shrink-0" />
          <div className="min-w-0 space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">{course.title}</h1>
            <p className="text-zinc-600 text-pretty">{course.description}</p>
          </div>
        </div>
      </div>

      <section aria-label="Üben" className="rounded-2xl border border-zinc-200">
        <div className="space-y-4 p-5 pb-4">
          <fieldset>
            <legend className="sr-only">Wie willst du üben?</legend>
            <div className="flex gap-1 rounded-xl bg-zinc-100 p-1">
              {MODES.map((option) => {
                const disabled = option.value === 'free' && !course.free
                const checked = practiceMode === option.value
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
                    <span className={`block font-medium ${checked ? 'text-accent-700' : ''}`}>{option.title}</span>
                    <span className="block text-sm text-zinc-500">{disabled ? 'kommt bald' : option.description}</span>
                  </label>
                )
              })}
            </div>
          </fieldset>
          <a
            href={practiceHref(id, selected, practiceMode)}
            className="block rounded-xl bg-accent-700 px-4 py-3 text-center text-lg font-medium text-on-accent hover:bg-accent-800"
          >
            Stufe {selected} {practiceMode === 'free' ? 'frei' : 'geführt'} üben
          </a>
        </div>
        {/* Linie am umgebenden Element: Bei fieldset würde die Beschriftung sie unterbrechen */}
        <div className="border-t border-zinc-100">
          <fieldset>
            <legend className="px-5 pt-4 text-sm font-medium text-zinc-500">Stufe wählen</legend>
            <div className="space-y-2 p-3 pt-2">
              {course.levels.map((level) => {
                const isSelected = level.level === selected
                return (
                  <label
                    key={level.level}
                    className={`flex gap-4 rounded-xl border-2 px-3 py-3 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-accent-600 ${
                      isSelected
                        ? 'border-accent-600 bg-accent-50'
                        : level.available
                          ? 'cursor-pointer border-transparent hover:bg-zinc-50'
                          : 'border-transparent opacity-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="stufe"
                      className="sr-only"
                      checked={isSelected}
                      disabled={!level.available}
                      onChange={() => setCourseLevel(id, level.level)}
                      aria-label={`Stufe ${level.level}: ${level.title}${level.available ? '' : ' (folgt bald)'}`}
                    />
                    <span
                      aria-hidden
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full font-semibold ${
                        isSelected ? 'bg-accent-700 text-on-accent' : 'bg-accent-50 text-accent-700'
                      }`}
                    >
                      {level.level}
                    </span>
                    <span className="min-w-0 space-y-2">
                      <span className="block font-medium">
                        {level.title}
                        {!level.available && <span className="font-normal text-zinc-500"> · folgt bald</span>}
                      </span>
                      <LevelProgressLine course={id} level={level.level} />
                      <span className="flex flex-wrap items-center gap-x-6 gap-y-2 text-lg">
                        {level.examples.map((tex) => (
                          <Formula key={tex} tex={tex} />
                        ))}
                      </span>
                    </span>
                  </label>
                )
              })}
            </div>
          </fieldset>
        </div>
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
      </section>
    </main>
  )
}

// „12 gelöst · zuletzt 8 von 10 ohne Fehler"; nichts, solange noch keine Aufgabe gelöst ist
function LevelProgressLine({ course, level }: { course: string; level: Level }) {
  const { solved, recent, recentClean } = levelSummary(useProgress(), course, level)
  if (solved === 0) return null
  return (
    <span className="block text-sm text-zinc-500">
      {solved} gelöst · zuletzt {recentClean} von {recent.length} ohne Fehler
    </span>
  )
}
