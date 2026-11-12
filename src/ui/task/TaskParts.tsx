import { type ReactNode, useEffect, useState } from 'react'
import { findError } from '../../engine/errorCatalog.ts'
import { type TaskRef, formatTaskNumber } from '../../engine/tasks/taskNumber.ts'
import { FitWidth } from '../FitWidth.tsx'
import { Formula } from '../Formula.tsx'
import { type ExplanationMode, MODE_LABEL } from './explanationMode.ts'
import { RichText } from '../RichText.tsx'
import { courseById, isChemCourse, levelName } from '../catalog.ts'
import { taskExitHref } from '../routes.ts'
import { showsSkipNotice, skipTask } from '../skip.ts'

// Teile, die geführter und freier Modus gemeinsam haben

// Obere Leiste: Schließen (zurück zum Thema, in der Mischung zur Mischung, in der Wiederholung zur Startseite), Mitte
// (z. B. Fortschritt), Umschalter für Erklärungen
type TopBarProps = { course: string; mix?: string | null; review?: string | null; mode: ExplanationMode; onCycleMode: () => void; children?: ReactNode }

export function TaskTopBar({ course, mix = null, review = null, mode, onCycleMode, children }: TopBarProps) {
  return (
    <div className="flex items-center gap-3">
      <a href={taskExitHref(course, mix, review)} aria-label="Aufgabe beenden" className="-my-1 -ml-3 rounded-lg p-3 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900">
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

// „Stufe 2 · Leite ab" (in Chemie „Vertiefung · …") und die Funktion; ohne
// functionLatex (Wissensfragen) keine Formel; note: Zusatz darunter, z. B. Bedingungen. In der
// Mischung (mix) und in der Wiederholung (review) steht darüber, aus welchem Thema die Aufgabe kommt.
type IntroProps = { course: string; mix?: string | null; review?: string | null; taskRef: TaskRef; functionLatex?: string; instruction: string; note?: string }

export function TaskIntro({ course, mix = null, review = null, taskRef, functionLatex, instruction, note }: IntroProps) {
  return (
    <>
      {(mix || review) && (
        <p className="text-sm font-semibold text-accent-700">
          {mix ? 'Themen mischen' : 'Wiederholen'} · {courseById(course)?.course.title}
        </p>
      )}
      <p className="text-sm text-zinc-500">
        {levelName(course, taskRef.level)} · <RichText text={instruction} inline />
      </p>
      {/* Chemie: lange Gleichungen werden am Handy kleiner statt seitlich zu wischen (Mathe wie bisher) */}
      {functionLatex !== undefined &&
        (isChemCourse(course) ? (
          <FitWidth className="text-2xl">
            <Formula tex={functionLatex} />
          </FitWidth>
        ) : (
          <div className="overflow-x-auto text-2xl">
            <Formula tex={functionLatex} />
          </div>
        ))}
      {note && <RichText text={note} className="text-sm text-zinc-500" />}
    </>
  )
}

// Ganz unten: die Nummer der Aufgabe, klein (M6 Schritt 1: gebraucht nur zum Melden und Wiederfinden), und solange
// die Aufgabe offen ist der Knopf „Überspringen" (M6 Schritt 2) zur nächsten Aufgabe, ohne dass etwas zählt
type FooterProps = { course: string; taskRef: TaskRef; skipHref?: string | null; question?: number | null }

export function TaskFooter({ course, taskRef, skipHref = null, question = null }: FooterProps) {
  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      <p className="text-xs text-zinc-500">Aufgabe {formatTaskNumber(taskRef)}</p>
      {skipHref && (
        <a
          href={skipHref}
          onClick={() => skipTask({ course, level: taskRef.level, seed: taskRef.seed, question })}
          className="-mr-3 inline-flex min-h-11 items-center gap-1 rounded-xl px-3 font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
        >
          Überspringen
          <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 6l6 6-6 6M13 6l6 6-6 6" />
          </svg>
        </a>
      )}
    </div>
  )
}

// „Aufgabe übersprungen" über der ersten Aufgabe nach dem Überspringen, verschwindet nach ein paar Sekunden
export function SkipNotice({ course, seed }: { course: string; seed: number }) {
  const [visible, setVisible] = useState(() => showsSkipNotice(course, seed))
  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(() => setVisible(false), 4000)
    return () => clearTimeout(timer)
  }, [visible])
  // nur da, solange er zu sehen ist: Ein leerer Meldebereich in jeder Aufgabe stünde neben dem von „Frage melden"
  if (!visible) return null
  return (
    <p role="status" className="animate-step-in rounded-xl bg-zinc-100 px-4 py-2 text-sm text-zinc-700">
      Aufgabe übersprungen. Hier ist die nächste.
    </p>
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
