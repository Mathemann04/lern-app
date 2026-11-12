import { setCourseLevel, setSkippedParts, useSettings } from '../state/settings.ts'
import type { PracticeMode } from '../state/storage.ts'
import { AreaIcon } from './AreaIcon.tsx'
import { BackLink } from './BackLink.tsx'
import { courseById, hasLevelNames, isFreeAt, levelName, playableLevel } from './catalog.ts'
import { CourseLinks, LevelProgressLine, ModeSwitch } from './CourseParts.tsx'
import { Formula } from './Formula.tsx'
import { PartPicker } from './PartPicker.tsx'
import { areaHref, practiceHref, subjectHref } from './routes.ts'
import { isSelectionPlayable, levelPartCount } from './selection.ts'

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
        {/* In Fächern mit Tätigkeiten (Mathe, M6) eine Ebene höher zur Seite des Fachs, sonst zum Gebiet */}
        {subject.activities ? <BackLink href={subjectHref(subject.id)} label={subject.title} /> : <BackLink href={areaHref(area.id)} label={area.title} />}
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
          <ModeSwitch course={course} mode={settings.practiceMode} />
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
          <fieldset className="min-w-0">
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
        <CourseLinks course={course} />
      </section>
    </main>
  )
}
