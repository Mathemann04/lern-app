import { useState } from 'react'
import { type DragStep, paramOf, snapDrag } from '../../engine/linalg/drag.ts'
import type { VectorDrawing } from '../../engine/linalg/figures.ts'
import { Formula } from '../Formula.tsx'
import { VectorFigure } from './VectorFigure.tsx'

// Zieh-Aufgabe (M7 Schritt 2b): Bild zum Ziehen und darunter dieselbe Stelle zum Einstellen ohne Ziehen (für Tastatur
// und Vorlesehilfen): je Koordinate ein Feld mit „−“ und „+“, entlang einer Geraden nur der Parameter. at ist die Stelle;
// ohne onMove steht sie fest (nach dem Prüfen oder bei „Lösung zeigen“).

type Props = { step: DragStep; drawing: VectorDrawing; at: readonly number[]; onMove?: (at: readonly number[]) => void }

export function DragPad({ step, drawing, at, onMove }: Props) {
  const v = at.map((x, i) => x - (step.mode === 'arrow' ? step.from[i] : 0))
  // aus dem Wert eines Feldes die neue Stelle (eingerastet und im Rahmen)
  const setCoordinate = (k: number, value: number) => {
    if (!onMove) return
    if (step.line) {
      const p = step.line.base.map((x, i) => x + value * step.line!.dir[i])
      onMove(snapDrag(step, p))
      return
    }
    const p = at.map((x, i) => (i === k ? value + (step.mode === 'arrow' ? step.from[i] : 0) : x))
    onMove(snapDrag(step, p))
  }
  const fields = step.line
    ? [{ name: `Wert von ${plain(step.line.param)}`, value: paramOf(step.line, at) }]
    : v.map((x, k) => ({ name: `${k + 1}. ${step.mode === 'arrow' ? 'Eintrag' : 'Koordinate'}`, value: x }))
  return (
    <div className="space-y-3">
      <VectorFigure drawing={drawing} drag={{ step, at, onMove }} />
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-lg" role="group" aria-label="Stelle einstellen">
        {step.line ? (
          <span className="flex items-center gap-2">
            <Formula tex={`${step.line.param} =`} />
            <Stepper {...fields[0]} disabled={!onMove} onSet={(x) => setCoordinate(0, x)} />
            <span className="ml-2 text-base text-zinc-600">
              <Formula tex={`${step.name} = \\begin{pmatrix} ${v.join(' \\\\ ')} \\end{pmatrix}`} />
            </span>
          </span>
        ) : step.mode === 'arrow' ? (
          // Pfeil: Einträge untereinander in Klammern wie ein Spaltenvektor
          <span className="flex items-center gap-2">
            <Formula tex={`${step.name} =`} />
            <span className="flex flex-col gap-2 rounded-[1.25rem] border-x-2 border-zinc-500 px-2 py-2">
              <Stepper {...fields[0]} disabled={!onMove} onSet={(x) => setCoordinate(0, x)} />
              <Stepper {...fields[1]} disabled={!onMove} onSet={(x) => setCoordinate(1, x)} />
            </span>
          </span>
        ) : (
          // Punkt: Koordinaten mit Namen, jede für sich (bricht am Handy zwischen ihnen um)
          <>
            {['x', 'y'].map((axis, k) => (
              <span key={axis} className="mr-3 flex items-center gap-2">
                <Formula tex={`${axis}_{${step.name}} =`} />
                <Stepper {...fields[k]} disabled={!onMove} onSet={(x) => setCoordinate(k, x)} />
              </span>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

const plain = (tex: string) => tex.replace('\\lambda', 'λ')

type StepperProps = { name: string; value: number; disabled: boolean; onSet: (value: number) => void }

// Zahl mit „−“ und „+“; das Feld nimmt auch getippte ganze Zahlen (mit Minus)
function Stepper({ name, value, disabled, onSet }: StepperProps) {
  const [text, setText] = useState<string | null>(null)
  const button = 'flex size-11 items-center justify-center rounded-xl border-2 border-zinc-300 bg-surface text-xl font-semibold hover:border-accent-600 disabled:opacity-40'
  return (
    <span className="inline-flex items-center gap-1">
      <button type="button" className={button} disabled={disabled} onClick={() => onSet(value - 1)} aria-label={`${name} um 1 kleiner`}>
        −
      </button>
      <input
        type="text"
        inputMode="text"
        aria-label={name}
        disabled={disabled}
        value={text ?? String(value).replace('-', '−')}
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => {
          const raw = e.currentTarget.value
          setText(raw)
          const n = Number(raw.replace('−', '-').trim())
          if (raw.trim() !== '' && raw.trim() !== '-' && Number.isInteger(n)) onSet(n)
        }}
        onBlur={() => setText(null)}
        className="h-11 w-12 rounded-xl border-2 border-zinc-300 bg-surface text-center tabular-nums focus:border-accent-600 focus:outline-none disabled:opacity-60"
      />
      <button type="button" className={button} disabled={disabled} onClick={() => onSet(value + 1)} aria-label={`${name} um 1 größer`}>
        +
      </button>
    </span>
  )
}
