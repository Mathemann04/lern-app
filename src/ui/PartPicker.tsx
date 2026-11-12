import { useId } from 'react'
import { BLOCK_GROUPS } from '../engine/tasks/blocks.ts'
import type { Level } from '../engine/tasks/taskNumber.ts'
import { setPartChecked, setSkippedParts } from '../state/settings.ts'
import type { Settings } from '../state/storage.ts'
import { type Course, type CoursePart, levelName } from './catalog.ts'
import { allPartsChecked, isPartChecked } from './selection.ts'

// Kästchen der Unterthemen eines Themas (S1b), auf der Themenseite und in der Mischung dieselbe
// gespeicherte Auswahl (skipParts). Die Auswahl gilt für alle Stufen: Unterthemen ohne Fragen in der
// gewählten Stufe bleiben ankreuzbar, stehen aber blass mit „erst ab Vertiefung" bzw. „nicht in
// Vertiefung" da. Ohne Engine und ohne KaTeX (Titel sind reiner Text). Bausteine der Mathe-Tätigkeiten (M6)
// stehen in Gruppen (group) mit Zusatz (note) und je einem Knopf „nur" (nur diesen ankreuzen).

type Props = {
  course: Course
  // gewählte Stufe (Themenseite) bzw. Stufe der Mischung
  level: Level
  settings: Pick<Settings, 'skipParts'>
  // Knopf „Alle wählen" unter den Kästchen, solange nicht alles angekreuzt ist (Mischseite; auf der
  // Themenseite steht er unter dem Üben-Knopf)
  selectAll?: boolean
}

export function PartPicker({ course, level, settings, selectAll = false }: Props) {
  const parts = course.parts ?? []
  const grouped = parts.some((part) => part.group !== undefined)
  const row = (part: CoursePart) => (
    <li key={part.id}>
      <PartRow course={course} part={part} level={level} checked={isPartChecked(course, part.id, settings)} only={grouped} />
    </li>
  )
  return (
    <div className="space-y-1">
      {grouped ? (
        <div className="space-y-4">
          {BLOCK_GROUPS.filter((group) => parts.some((part) => part.group === group.id)).map((group) => (
            <section key={group.id} aria-labelledby={`group-${group.id}`}>
              <h3 id={`group-${group.id}`} className="px-3 pb-1 text-sm font-semibold text-zinc-600">
                {group.title}
              </h3>
              {/* am Laptop zwei Spalten, damit die lange Liste kürzer wird */}
              <ul className="space-y-1 sm:grid sm:grid-cols-2 sm:gap-x-2 sm:space-y-0">{parts.filter((part) => part.group === group.id).map(row)}</ul>
            </section>
          ))}
        </div>
      ) : (
        <ul className="space-y-1">{parts.map(row)}</ul>
      )}
      {selectAll && !allPartsChecked(course, settings) && (
        <button
          type="button"
          onClick={() => setSkippedParts(course.id, [])}
          className="ml-10 min-h-11 rounded-lg px-2 text-sm font-medium text-accent-700 hover:bg-accent-50"
        >
          Alle wählen
        </button>
      )}
    </div>
  )
}

type RowProps = { course: Course; part: CoursePart; level: Level; checked: boolean; only: boolean }

function PartRow({ course, part, level, checked, only }: RowProps) {
  const id = useId()
  const inLevel = part.levels.includes(level)
  const note = inLevel ? null : partNote(course.id, part, level)
  const label = (
    <label className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-zinc-50 has-focus-visible:ring-2 has-focus-visible:ring-accent-600">
      <Checkbox
        checked={checked}
        onChange={(value) => setPartChecked(course.id, part.id, value)}
        labelledBy={`${id}-title`}
        describedBy={note || part.note ? `${id}-note` : undefined}
      />
      <span className="min-w-0">
        <span id={`${id}-title`} className={`block text-pretty ${inLevel ? '' : 'text-zinc-500'}`}>
          {part.title}
        </span>
        {(note || part.note) && (
          <span id={`${id}-note`} className="block text-sm text-pretty text-zinc-500">
            {[part.note, note].filter(Boolean).join(' · ')}
          </span>
        )}
      </span>
    </label>
  )
  if (!only) return label
  // „nur": nur diesen Baustein ankreuzen (ein Thema gezielt üben)
  const others = (course.parts ?? []).filter((p) => p.id !== part.id).map((p) => p.id)
  return (
    <div className="flex items-center gap-1">
      {label}
      <button
        type="button"
        onClick={() => setSkippedParts(course.id, others)}
        aria-label={`Nur ${part.title}`}
        className="min-h-11 shrink-0 rounded-lg px-3 text-sm font-medium text-accent-700 hover:bg-accent-50"
      >
        nur
      </button>
    </div>
  )
}

// „erst ab Vertiefung", wenn das Unterthema erst in einer höheren Stufe vorkommt, sonst „nicht in
// Vertiefung" (z. B. Stoffe: Grundlagen und Klausurniveau)
function partNote(course: string, part: CoursePart, level: Level): string {
  const first = Math.min(...part.levels) as Level
  return first > level ? `erst ab ${levelName(course, first)}` : `nicht in ${levelName(course, level)}`
}

type CheckboxProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  // Id des Namens bzw. eines Zusatzes (Vorlesehilfen lesen den Zusatz nach dem Namen)
  labelledBy?: string
  describedBy?: string
}

// Echtes Kästchen in der Akzentfarbe, mit Haken; steht in einem label, das die ganze Zeile klickbar
// macht und den Fokusring trägt (has-focus-visible)
export function Checkbox({ checked, onChange, labelledBy, describedBy }: CheckboxProps) {
  return (
    <span className="relative grid size-6 shrink-0 place-items-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        className="peer size-6 cursor-pointer appearance-none rounded-md border-2 border-zinc-500 bg-surface transition-colors checked:border-accent-700 checked:bg-accent-700 focus-visible:outline-none"
      />
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="pointer-events-none absolute size-4 text-on-accent opacity-0 peer-checked:opacity-100"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 12.5 10 17.5 19 7" />
      </svg>
    </span>
  )
}
