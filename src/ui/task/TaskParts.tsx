import type { ReactNode } from 'react'
import { findError } from '../../engine/errorCatalog.ts'
import { type TaskRef, formatTaskNumber } from '../../engine/tasks/taskNumber.ts'
import { Formula } from '../Formula.tsx'
import { type ExplanationMode, MODE_LABEL } from './explanationMode.ts'
import { RichText } from '../RichText.tsx'
import { courseHref } from '../routes.ts'

// Teile, die geführter und freier Modus gemeinsam haben

// Obere Leiste: Schließen (zurück zum Thema), Mitte (z. B. Fortschritt), Umschalter für Erklärungen
type TopBarProps = { course: string; mode: ExplanationMode; onCycleMode: () => void; children?: ReactNode }

export function TaskTopBar({ course, mode, onCycleMode, children }: TopBarProps) {
  return (
    <div className="flex items-center gap-3">
      <a href={courseHref(course)} aria-label="Aufgabe beenden" className="-my-1 -ml-3 rounded-lg p-3 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900">
        <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </a>
      <div className="flex-1">{children}</div>
      <button
        type="button"
        onClick={onCycleMode}
        className="-my-2 -mr-2 min-h-11 rounded-lg px-2 text-sm text-zinc-600 hover:bg-zinc-100"
        title="Nur für diese Aufgabe umstellen"
      >
        Erklärungen: {MODE_LABEL[mode]}
      </button>
    </div>
  )
}

// Grüner Haken im Kreis, springt beim Erscheinen kurz auf
export function CheckBadge({ large = false }: { large?: boolean }) {
  return (
    <span
      aria-hidden
      className={`animate-pop mr-2 rounded-full bg-green-600 align-[-0.15em] text-white ${large ? 'size-[1.1em] p-[0.2em]' : 'size-[1.2em] p-[0.25em]'}`}
    >
      <svg viewBox="0 0 24 24" className="size-full" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12.5 10 17.5 19 7" />
      </svg>
    </span>
  )
}

// „Stufe 2 · Aufgabe 2-4711 · Leite ab" und die Funktion; note: Zusatz darunter, z. B. Bedingungen
type IntroProps = { taskRef: TaskRef; functionLatex: string; instruction: string; note?: string }

export function TaskIntro({ taskRef, functionLatex, instruction, note }: IntroProps) {
  return (
    <>
      <p className="text-sm text-zinc-500">
        Stufe {taskRef.level} · Aufgabe {formatTaskNumber(taskRef)} · <RichText text={instruction} inline />
      </p>
      <div className="overflow-x-auto text-2xl">
        <Formula tex={functionLatex} />
      </div>
      {note && <RichText text={note} className="text-sm text-zinc-500" />}
    </>
  )
}

// Hinweis beim gezielten Üben: welcher Fehler geübt wird, mit Ausstieg
export function FocusBanner({ focus }: { focus: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-amber-50 px-4 py-2 text-sm">
      <p className="flex-1 text-amber-900">
        Gezielt üben: <RichText text={findError(focus)?.name ?? ''} className="font-medium" inline />
      </p>
      <a href="#/fortschritt" className="-my-2 -mr-2 shrink-0 rounded-lg px-3 py-3 font-medium text-amber-900 hover:bg-amber-100">
        Beenden
      </a>
    </div>
  )
}
