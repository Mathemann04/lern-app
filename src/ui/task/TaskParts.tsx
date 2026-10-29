import type { ReactNode } from 'react'
import { type TaskRef, formatTaskNumber } from '../../engine/tasks/taskNumber.ts'
import { Formula } from '../Formula.tsx'
import { type ExplanationMode, MODE_LABEL } from './explanationMode.ts'

// Teile, die geführter und freier Modus gemeinsam haben

// Obere Leiste: Schließen, Mitte (z. B. Fortschritt), Umschalter für Erklärungen
export function TaskTopBar({ mode, onCycleMode, children }: { mode: ExplanationMode; onCycleMode: () => void; children?: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <a href="#/" aria-label="Aufgabe beenden" className="-ml-2 rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900">
        <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </a>
      <div className="flex-1">{children}</div>
      <button
        type="button"
        onClick={onCycleMode}
        className="rounded-lg px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100"
        title="Nur für diese Aufgabe umstellen"
      >
        Erklärungen: {MODE_LABEL[mode]}
      </button>
    </div>
  )
}

// „Stufe 2 · Aufgabe 2-4711 · Leite ab" und die Funktion
export function TaskIntro({ taskRef, functionLatex }: { taskRef: TaskRef; functionLatex: string }) {
  return (
    <>
      <p className="text-sm text-zinc-500">
        Stufe {taskRef.level} · Aufgabe {formatTaskNumber(taskRef)} · Leite ab
      </p>
      <div className="overflow-x-auto text-2xl">
        <Formula tex={functionLatex} />
      </div>
    </>
  )
}
