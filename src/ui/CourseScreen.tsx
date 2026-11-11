import type { Level } from '../engine/tasks/taskNumber.ts'
import { levelSummary, useProgress } from '../state/progress.ts'
import { setCourseLevel, setSkippedParts, updateSettings, useSettings } from '../state/settings.ts'
import type { PracticeMode } from '../state/storage.ts'
import { AreaIcon } from './AreaIcon.tsx'
import { BackLink } from './BackLink.tsx'
import { courseById, hasLevelNames, isFreeAt, levelName, playableLevel } from './catalog.ts'
import { Formula } from './Formula.tsx'
import { PartPicker } from './PartPicker.tsx'
import { areaHref, cardFolderHref, practiceHref } from './routes.ts'
import { isSelectionPlayable, levelPartCount } from './selection.ts'

const MODES: Array<{ value: PracticeMode; title: string; description: string }> = [
  { value: 'guided', title: 'Geführt', description: 'Auswahl-Antworten' },
  { value: 'free', title: 'Frei', description: 'Selbst eintippen' },
]

// Ein Thema, z. B. „Brüche": Art und Stufe wählen, dann üben. Die Stufe merkt sich jedes Thema
// selbst, die Art (geführt oder frei) gilt für alle. Themen mit Unterthemen (Chemie) haben zusätzlich
// „Was soll drankommen?" mit Kästchen (PartPicker.tsx); gibt es zu den angekreuzten in der Stufe keine
// Fragen, ist der Üben-Knopf nicht klickbar.
export function CourseScreen({ id }: { id: string }) {
  const { subject, area, course } = courseById(id)!
  const settings = useSettings()
  // Eine gespeicherte Stufe, die (noch) nicht spielbar ist, zählt als erste spielbare
  const selected = playableLevel(course, settings.levels[id])
  // Ohne freien Modus wird geführt geübt, auch in Stufen ohne Rechnung zum Eintippen (Chemie, S8b)
  const practiceMode: PracticeMode = isFreeAt(course, selected) ? settings.practiceMode : 'guided'
  const freeElsewhere = course.free && settings.practiceMode === 'free' && practiceMode === 'guided'
  // Stufen mit Namen (Chemie): der Name steht über dem Inhalt der Stufe
  const named = hasLevelNames(id)
  // Unterthemen: Lässt sich mit der Auswahl in dieser Stufe üben? Wie viele der Unterthemen dieser Stufe
  // sind angekreuzt? (Nicht angekreuzte anderer Stufen kommen hier ohnehin nicht dran.)
  const playable = isSelectionPlayable(course, settings, selected)
  const partCount = levelPartCount(course, settings, selected)
  const practiceLabel = `${levelName(id, selected)} ${practiceMode === 'free' ? 'frei' : 'geführt'} üben`
  return (
    <main className="space-y-6">
      <div className="space-y-3">
        <BackLink href={areaHref(area.id)} label={area.title} />
        <div className="flex items-center gap-4">
          <AreaIcon kind={course.icon} className="size-16 shrink-0" />
          <div className="min-w-0 space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight hyphens-auto">{course.title}</h1>
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
                const checked = (course.free ? settings.practiceMode : 'guided') === option.value
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
          <div className="space-y-2">
            {playable ? (
              <a
                href={practiceHref(id, selected, practiceMode)}
                className="block rounded-xl bg-accent-700 px-4 py-3 text-center text-lg font-medium text-on-accent hover:bg-accent-800"
              >
                {practiceLabel}
              </a>
            ) : (
              <button
                type="button"
                disabled
                aria-describedby="parts-note"
                className="block w-full cursor-not-allowed rounded-xl bg-zinc-100 px-4 py-3 text-center text-lg font-medium text-zinc-500"
              >
                {practiceLabel}
              </button>
            )}
            {freeElsewhere && (
              <p className="text-sm text-pretty text-zinc-600" data-testid="free-note">
                In {levelName(id, selected)} gibt es hier nichts zum Eintippen, deshalb übst du geführt.
              </p>
            )}
            {partCount && (
              <div className="flex items-center justify-between gap-3 text-sm">
                <p id="parts-note" className="text-pretty text-zinc-600">
                  {playable
                    ? `In ${levelName(id, selected)}: ${partCount.checked} von ${partCount.total} Unterthemen angekreuzt`
                    : `Kreuze unten mindestens ein Unterthema an, das es in ${levelName(id, selected)} gibt.`}
                </p>
                <button
                  type="button"
                  onClick={() => setSkippedParts(id, [])}
                  className="-my-1 -mr-2 min-h-11 shrink-0 rounded-lg px-2 font-medium text-accent-700 hover:bg-accent-50"
                >
                  Alle wählen
                </button>
              </div>
            )}
          </div>
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
                      aria-label={`${levelName(id, level.level)}: ${level.title}${level.available ? '' : ' (folgt bald)'}`}
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
                      {named && <span className="block text-sm font-semibold text-accent-700">{levelName(id, level.level)}</span>}
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
        {course.parts && (
          <div className="border-t border-zinc-100">
            <fieldset aria-describedby="parts-hint">
              <legend className="px-5 pt-4 text-sm font-medium text-zinc-500">Was soll drankommen?</legend>
              <p id="parts-hint" className="px-5 text-sm text-pretty text-zinc-500">
                Deine Auswahl gilt für alle Stufen{subject.mix ? ' und auch beim Mischen' : ''}.
              </p>
              <div className="p-3 pt-2">
                <PartPicker course={course} level={selected} settings={settings} />
              </div>
            </fieldset>
          </div>
        )}
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
