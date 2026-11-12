import { useId, useState } from 'react'
import type { Level } from '../engine/tasks/taskNumber.ts'
import { setMixCourseChecked, setMixLevel, useSettings } from '../state/settings.ts'
import type { Settings } from '../state/storage.ts'
import { AreaIcon } from './AreaIcon.tsx'
import { BackLink } from './BackLink.tsx'
import {
  type Area,
  type Course,
  type Subject,
  isAreaAvailable,
  isCourseAvailable,
  isLevelAvailable,
  subjectById,
  subjectLevelCount,
  subjectLevelName,
} from './catalog.ts'
import { Checkbox, PartPicker } from './PartPicker.tsx'
import { mixPracticeHref, subjectHref } from './routes.ts'
import {
  allPartsChecked,
  checkedParts,
  courseSummary,
  isMixCourseChecked,
  isSelectionPlayable,
  joinTitles,
  mixBlockedHint,
  mixChoiceOf,
  mixedCourses,
} from './selection.ts'

// „Themen mischen" eines Fachs (#/mischen/chemie, S1b): Stufe wählen, Themen ankreuzen (je Thema
// aufklappbar seine Unterthemen, dieselbe Auswahl wie auf der Themenseite), dann kommen die Fragen
// gemischt (#/mischen/chemie/2, PracticePage.tsx). Ohne Engine und ohne KaTeX.

export function MixScreen({ id }: { id: string }) {
  const subject = subjectById(id)!
  const settings = useSettings()
  const { level } = mixChoiceOf(subject, settings)
  const courses = mixedCourses(subject, settings, level)
  const levelTitle = subjectLevelName(subject, level)
  const label = `${levelTitle} gemischt üben`
  const playableAreas = subject.areas.filter(isAreaAvailable)
  const comingAreas = subject.areas.filter((area) => !isAreaAvailable(area))
  return (
    <main className="space-y-6">
      <div className="space-y-3">
        <BackLink href={subjectHref(subject.id)} label={subject.title} />
        <div className="flex items-center gap-4">
          <AreaIcon kind="mix" className="size-16 shrink-0" />
          <div className="min-w-0 space-y-1">
            <p className="text-sm text-zinc-500">{subject.title}</p>
            <h1 className="text-3xl font-semibold tracking-tight">Themen mischen</h1>
          </div>
        </div>
        <p className="text-zinc-600 text-pretty">Kreuze an, was drankommen soll. Die Fragen kommen dann bunt gemischt aus allen angekreuzten Themen.</p>
      </div>

      <section aria-label="Üben" className="rounded-2xl border border-zinc-200">
        <div className="space-y-2 p-5 pb-4">
          {courses.length > 0 ? (
            <a
              href={mixPracticeHref(subject.id, level)}
              className="block rounded-xl bg-accent-700 px-4 py-3 text-center text-lg font-medium text-on-accent hover:bg-accent-800"
            >
              {label}
            </a>
          ) : (
            <button
              type="button"
              disabled
              aria-describedby="mix-summary"
              className="block w-full cursor-not-allowed rounded-xl bg-zinc-100 px-4 py-3 text-center text-lg font-medium text-zinc-500"
            >
              {label}
            </button>
          )}
          <p id="mix-summary" className="text-sm text-pretty text-zinc-600">
            {courses.length > 0
              ? `Fragen aus ${joinTitles(courses.map((course) => courseSummary(course, settings, level)))}`
              : mixBlockedHint(subject, settings, level, true)}
          </p>
        </div>

        {/* Linie am umgebenden Element: Bei fieldset würde die Beschriftung sie unterbrechen */}
        <div className="border-t border-zinc-100">
          <fieldset>
            <legend className="px-5 pt-4 text-sm font-medium text-zinc-500">Stufe wählen</legend>
            <LevelChoice subject={subject} level={level} />
          </fieldset>
        </div>

        <div className="border-t border-zinc-100">
          <fieldset>
            <legend className="px-5 pt-4 text-sm font-medium text-zinc-500">Was soll drankommen?</legend>
            <div className="space-y-4 p-3 pt-3">
              {playableAreas.map((area) => (
                <AreaGroup key={area.id} subject={subject} area={area} level={level} settings={settings} />
              ))}
            </div>
          </fieldset>
        </div>

        {comingAreas.length > 0 && (
          <div className="rounded-b-2xl border-t border-zinc-100 px-5 py-4">
            <h2 className="text-sm font-medium text-zinc-500">Kommt bald dazu</h2>
            <ul className="mt-2 space-y-1">
              {comingAreas.map((area) => (
                <li key={area.id} data-tone={area.tone} className="flex items-center gap-3 py-1 text-zinc-500">
                  <AreaIcon kind={area.icon} className="size-8 shrink-0 opacity-50" />
                  {area.title}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </main>
  )
}

// Stufen des Fachs (Chemie: Grundlagen, Vertiefung, Klausurniveau) wie auf der Themenseite, nur ohne
// Inhalt der Stufe (der hängt vom Thema ab); eine Stufe, die noch kein Thema hat, ist blass
function LevelChoice({ subject, level: selected }: { subject: Subject; level: Level }) {
  const levels = Array.from({ length: subjectLevelCount(subject) }, (_, i) => (i + 1) as Level)
  const courses = subject.areas.flatMap((area) => area.courses)
  return (
    <div className="space-y-2 p-3 pt-2">
      {levels.map((level) => {
        const available = courses.some((course) => isLevelAvailable(course, level))
        const isSelected = level === selected
        const name = subjectLevelName(subject, level)
        return (
          <label
            key={level}
            className={`flex items-center gap-4 rounded-xl border-2 px-3 py-2 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-accent-600 ${
              isSelected
                ? 'border-accent-600 bg-accent-50'
                : available
                  ? 'cursor-pointer border-transparent hover:bg-zinc-50'
                  : 'border-transparent opacity-50'
            }`}
          >
            <input
              type="radio"
              name="stufe"
              className="sr-only"
              checked={isSelected}
              disabled={!available}
              onChange={() => setMixLevel(subject.id, level)}
              aria-label={available ? name : `${name} (folgt bald)`}
            />
            <span
              aria-hidden
              className={`flex size-8 shrink-0 items-center justify-center rounded-full font-semibold ${
                isSelected ? 'bg-accent-700 text-on-accent' : 'bg-accent-50 text-accent-700'
              }`}
            >
              {level}
            </span>
            <span aria-hidden className="font-medium">
              {name}
              {!available && <span className="font-normal text-zinc-500"> · folgt bald</span>}
            </span>
          </label>
        )
      })}
    </div>
  )
}

type GroupProps = { subject: Subject; area: Area; level: Level; settings: Settings }

// Ein Gebiet mit seinen Themen, in seiner Farbe; Themen, die noch kommen, blass ohne Kästchen
function AreaGroup({ subject, area, level, settings }: GroupProps) {
  return (
    <div data-tone={area.tone} className="space-y-1">
      <h2 className="flex items-center gap-2 px-3 text-sm font-semibold text-accent-700">
        <AreaIcon kind={area.icon} className="size-6 shrink-0" />
        {area.title}
      </h2>
      <ul className="space-y-1">
        {area.courses.map((course) =>
          isCourseAvailable(course) ? (
            <li key={course.id}>
              <CourseRow subject={subject} course={course} level={level} settings={settings} />
            </li>
          ) : (
            <li key={course.id} className="flex min-h-11 items-center gap-3 px-3 py-2 text-zinc-500">
              {/* Platz des Kästchens, damit die Namen untereinander stehen */}
              <span aria-hidden className="size-6 shrink-0" />
              <span className="min-w-0 flex-1">{course.title}</span>
              <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">kommt bald</span>
            </li>
          ),
        )}
      </ul>
    </div>
  )
}

type RowProps = { subject: Subject; course: Course; level: Level; settings: Settings }

// Ein Thema zum Ankreuzen; mit Unterthemen darunter ein Knopf zum Aufklappen ihrer Kästchen. Liegt es
// an den Unterthemen, dass ein angekreuztes Thema in der Stufe nicht drankommt, klappen sie von selbst
// auf (und bleiben offen, bis man sie zuklappt).
function CourseRow({ subject, course, level, settings }: RowProps) {
  const id = useId()
  const checked = isMixCourseChecked(subject, course, settings)
  const partsBlocked = checked && isLevelAvailable(course, level) && !isSelectionPlayable(course, settings, level)
  const [open, setOpen] = useState(partsBlocked)
  // Zustand an die Auswahl anpassen, sobald die Unterthemen den Weg versperren (React-Muster ohne Effekt)
  const [wasBlocked, setWasBlocked] = useState(partsBlocked)
  if (partsBlocked !== wasBlocked) {
    setWasBlocked(partsBlocked)
    if (partsBlocked) setOpen(true)
  }
  const levelTitle = subjectLevelName(subject, level)
  // Warum ein angekreuztes Thema in dieser Stufe nicht drankommt
  const note = !isLevelAvailable(course, level)
    ? `${levelTitle} gibt es hier noch nicht`
    : partsBlocked
      ? `Keins der angekreuzten Unterthemen gibt es in ${levelTitle}`
      : null
  const parts = course.parts
  return (
    <div>
      <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-zinc-50 has-focus-visible:ring-2 has-focus-visible:ring-accent-600">
        <Checkbox
          checked={checked}
          onChange={(value) => setMixCourseChecked(subject.id, course.id, value)}
          labelledBy={`${id}-title`}
          describedBy={note ? `${id}-note` : undefined}
        />
        <span className="min-w-0 flex-1">
          <span id={`${id}-title`} className={`block text-lg font-medium ${isLevelAvailable(course, level) ? '' : 'text-zinc-500'}`}>
            {course.title}
          </span>
          {note && (
            <span id={`${id}-note`} className="block text-sm text-zinc-500">
              {note}
            </span>
          )}
        </span>
        <AreaIcon kind={course.icon} className="size-10 shrink-0" />
      </label>
      {parts && (
        <div className="pl-9">
          <button
            type="button"
            aria-expanded={open}
            aria-controls={`${id}-parts`}
            onClick={() => setOpen((value) => !value)}
            className="flex min-h-11 items-center gap-1 rounded-lg px-3 text-sm font-medium text-accent-700 hover:bg-accent-50"
          >
            Unterthemen: {allPartsChecked(course, settings) ? 'alle' : `${checkedParts(course, settings).length} von ${parts.length}`}
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {/* Immer vorhanden (aria-controls zeigt darauf), zugeklappt versteckt */}
          <fieldset id={`${id}-parts`} hidden={!open} className="animate-step-in">
            <legend className="sr-only">Unterthemen von {course.title}</legend>
            <PartPicker course={course} level={level} settings={settings} selectAll />
            <p className="pt-1 pr-3 pb-2 pl-12 text-sm text-pretty text-zinc-500">Diese Auswahl gilt auch, wenn du {course.title} allein übst.</p>
          </fieldset>
        </div>
      )}
    </div>
  )
}
