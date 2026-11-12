import { useEffect, useState } from 'react'
import type { Level } from '../engine/tasks/taskNumber.ts'
import { setCourseLevel, setSkippedParts, useSettings } from '../state/settings.ts'
import { AreaIcon } from './AreaIcon.tsx'
import { BackLink } from './BackLink.tsx'
import { courseById, levelName, playableLevel } from './catalog.ts'
import { loadCourseEngine } from './courseEngines.ts'
import { CourseLinks, LevelProgressLine, ModeSwitch } from './CourseParts.tsx'
import { FitWidth } from './FitWidth.tsx'
import { Formula } from './Formula.tsx'
import { PartPicker } from './PartPicker.tsx'
import { practiceHref, subjectHref } from './routes.ts'
import { blockedHint, checkedParts, isSelectionPlayable, modeAt, partWords, playableLevels, selectedParts } from './selection.ts'

// Seite einer Tätigkeit mit Bausteinen (M6 Schritt 3, docs/PLAN-M6.md „Bedienung"): „Was soll drankommen?" mit den Bausteinen
// in Gruppen („Alle", „Keine", je Baustein „nur"), „Wie verschachtelt?" mit den Stufen 1 bis 5 und einem Beispiel aus der
// Auswahl, dann „Geführt" oder „Frei" und der Knopf zum Üben. Auswahl und Stufe merkt sich jede Tätigkeit (skipParts,
// levels), die Art gilt für alle. Gibt es zur Auswahl in der Stufe keine Aufgaben, ist der Knopf gesperrt und ein Hinweis
// sagt, was fehlt.
export default function ActivityScreen({ id }: { id: string }) {
  const { subject, course } = courseById(id)!
  const settings = useSettings()
  const selected = playableLevel(course, settings.levels[id])
  const mode = modeAt(course, selected, settings.practiceMode)
  const playable = isSelectionPlayable(course, settings, selected)
  const words = partWords(course)
  // angekreuzte Bausteine (über alle Stufen): „· 3 Bausteine", alle: „· alle Bausteine"
  const checked = checkedParts(course, settings).length
  const allChecked = checked === (course.parts ?? []).length
  const blocksLabel = allChecked ? `alle ${words.many}` : `${checked} ${checked === 1 ? words.one : words.many}`
  const practiceLabel = `${levelName(id, selected)} ${mode === 'free' ? 'frei' : 'geführt'} üben · ${blocksLabel}`
  const allIds = (course.parts ?? []).map((part) => part.id)
  const elsewhere = playable ? [] : playableLevels(course, settings).filter((level) => level !== selected)
  const level = course.levels.find((l) => l.level === selected)!
  return (
    <main className="space-y-6">
      <div className="space-y-3">
        <BackLink href={subjectHref(subject.id)} label={subject.title} />
        <div className="flex items-center gap-4">
          <AreaIcon kind={course.icon} className="size-16 shrink-0" />
          <div className="min-w-0 space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight hyphens-auto">{course.title}</h1>
            <p className="text-zinc-600 text-pretty">{course.description}</p>
          </div>
        </div>
      </div>

      <section aria-label="Üben" className="rounded-2xl border border-zinc-200">
        <section aria-labelledby="blocks-title" aria-describedby="blocks-hint" className="p-3 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-x-3 px-2">
            <h2 id="blocks-title" className="text-lg font-semibold">
              Was soll drankommen?
            </h2>
            <div className="-mr-2 flex gap-1">
              <button
                type="button"
                onClick={() => setSkippedParts(id, [])}
                className="min-h-11 rounded-lg px-3 text-sm font-medium text-accent-700 hover:bg-accent-50"
              >
                Alle
              </button>
              <button
                type="button"
                onClick={() => setSkippedParts(id, allIds)}
                className="min-h-11 rounded-lg px-3 text-sm font-medium text-accent-700 hover:bg-accent-50"
              >
                Keine
              </button>
            </div>
          </div>
          <p id="blocks-hint" className="px-2 pb-3 text-sm text-pretty text-zinc-500">
            Eine Aufgabe kommt nur dran, wenn alle ihre {words.many} angekreuzt sind. Deine Auswahl gilt für alle Stufen.
          </p>
          <PartPicker course={course} level={selected} settings={settings} />
        </section>

        <div className="border-t border-zinc-100">
          <fieldset className="space-y-3 p-5">
            <legend className="text-lg font-semibold">Wie verschachtelt?</legend>
            <div className="grid grid-cols-5 gap-1 rounded-xl bg-zinc-100 p-1">
              {course.levels.map((l) => {
                const isSelected = l.level === selected
                return (
                  <label
                    key={l.level}
                    className={`flex min-h-11 flex-col items-center justify-center rounded-lg px-1 py-1.5 text-center transition-colors has-focus-visible:ring-2 has-focus-visible:ring-accent-600 ${
                      isSelected ? 'bg-raised shadow-sm' : l.available ? 'cursor-pointer text-zinc-600 hover:text-zinc-900' : 'text-zinc-500'
                    }`}
                  >
                    <input
                      type="radio"
                      name="stufe"
                      className="sr-only"
                      checked={isSelected}
                      disabled={!l.available}
                      onChange={() => setCourseLevel(id, l.level)}
                      aria-label={`${levelName(id, l.level)}: ${l.title}`}
                    />
                    <span aria-hidden className={`text-lg font-semibold ${isSelected ? 'text-accent-700 dark:text-accent-800' : ''}`}>
                      {l.level}
                    </span>
                    {/* am Handy nur die Zahl (die Namen passen nicht nebeneinander), der Name steht darunter */}
                    <span aria-hidden className="hidden w-full truncate text-xs sm:block">
                      {l.name ?? levelName(id, l.level)}
                    </span>
                  </label>
                )
              })}
            </div>
            <div className="space-y-1">
              <p className="font-medium text-pretty">
                {levelName(id, selected)} · {level.title}
              </p>
              <LevelProgressLine course={id} level={selected} />
            </div>
            {playable && <ExampleTask course={id} level={selected} parts={selectedParts(course, settings, selected)} />}
          </fieldset>
        </div>

        <div className="space-y-3 border-t border-zinc-100 p-5">
          <ModeSwitch course={course} mode={settings.practiceMode} />
          {playable ? (
            <a
              href={practiceHref(id, selected, mode)}
              className="block rounded-xl bg-accent-700 px-4 py-3 text-center text-lg font-medium text-on-accent hover:bg-accent-800"
            >
              {practiceLabel}
            </a>
          ) : (
            <button
              type="button"
              disabled
              aria-describedby="blocked-note"
              className="block w-full cursor-not-allowed rounded-xl bg-zinc-100 px-4 py-3 text-center text-lg font-medium text-zinc-500"
            >
              {practiceLabel}
            </button>
          )}
          {!playable && (
            <div className="space-y-2" data-testid="blocked">
              <p id="blocked-note" className="text-sm text-pretty text-zinc-600">
                {blockedHint(course, settings, selected)}
              </p>
              {elsewhere.length > 0 && checked > 0 && (
                <button
                  type="button"
                  onClick={() => setCourseLevel(id, nearest(elsewhere, selected))}
                  className="-ml-2 min-h-11 rounded-lg px-2 text-sm font-medium text-accent-700 hover:bg-accent-50"
                >
                  {levelName(id, nearest(elsewhere, selected))} wählen
                </button>
              )}
            </div>
          )}
        </div>
        <CourseLinks course={course} />
      </section>
    </main>
  )
}

// Stufe, die der gewählten am nächsten liegt (bei Gleichstand die leichtere)
function nearest(levels: readonly Level[], to: Level): Level {
  return [...levels].sort((a, b) => Math.abs(a - to) - Math.abs(b - to) || a - b)[0]
}

// Beispiel aus der Auswahl: eine Aufgabe der Stufe, wie sie beim Üben drankommen kann (Engine erst hier geladen); „Anderes
// Beispiel" zieht ein neues
function ExampleTask({ course, level, parts }: { course: string; level: Level; parts: ReadonlySet<string> | undefined }) {
  const partsKey = parts ? [...parts].sort().join('+') : ''
  const [draw, setDraw] = useState(0)
  const [example, setExample] = useState<{ readonly key: string; readonly latex: string } | null>(null)
  const key = `${level}:${partsKey}:${draw}`
  useEffect(() => {
    let cancelled = false
    void loadCourseEngine(course).then((engine) => {
      if (cancelled || !engine.exampleLatex) return
      const chosen = partsKey ? new Set(partsKey.split('+')) : undefined
      const seed = engine.nextSeed ? engine.nextSeed(level, undefined, chosen) : 1
      setExample({ key, latex: engine.exampleLatex({ level, seed }) })
    })
    return () => {
      cancelled = true
    }
  }, [course, level, partsKey, key])
  const current = example?.key === key ? example : null
  return (
    <div className="space-y-2 rounded-xl bg-zinc-50 px-4 py-3" data-testid="example">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">Beispiel aus deiner Auswahl</p>
        <button
          type="button"
          onClick={() => setDraw((n) => n + 1)}
          className="-my-2 -mr-2 min-h-11 shrink-0 rounded-lg px-2 text-sm font-medium text-accent-700 hover:bg-accent-50"
        >
          Anderes Beispiel
        </button>
      </div>
      {current ? (
        <FitWidth className="text-xl">
          <Formula tex={current.latex} />
        </FitWidth>
      ) : (
        <p className="animate-late min-h-8 text-zinc-500">Wird geladen …</p>
      )}
    </div>
  )
}
