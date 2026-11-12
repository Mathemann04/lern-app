import { useState } from 'react'
import type { EntryGroup, KeyboardSpec } from '../../engine/check/freeTask.ts'
import { Formula } from '../Formula.tsx'
import { MathInput } from './MathInput.tsx'

// Eingabe in Kästchen (M7 Schritt 1b, Vektoren): je Eintrag ein Feld mit der Mathe-Tastatur. Ein Vektor steht als Spalte
// in großen Klammern, ein Punkt als Zeile Q( □ | □ | □ ), eine Zahl allein, zwei Lösungen untereinander. Markierte
// Kästchen bekommen einen roten (falsch) bzw. gelben Rand (leer, nicht lesbar, nicht fertig). Enter oder „Prüfen" auf der Tastatur prüft alles.

type Props = {
  groups: readonly EntryGroup[]
  keyboard: KeyboardSpec
  readOnly: boolean
  // je Teil und Eintrag: markiert?
  marks: readonly (readonly boolean[])[] | null
  // rot bei falschen Einträgen, gelb bei leeren, unlesbaren oder nicht fertigen
  markTone: 'red' | 'amber'
  onInput: (group: number, entry: number, latex: string) => void
  onSubmit: () => void
  onKeyboardHeight: (height: number) => void
}

// Name eines Kästchens für Vorlesehilfen und Browser-Tests
function boxLabel(group: EntryGroup, entry: number): string {
  const n = entry + 1
  switch (group.shape) {
    case 'vector':
      return `${n}. Eintrag`
    case 'point':
      return `${n}. Koordinate`
    case 'solutions':
      return `${n}. Lösung`
    case 'number':
    case 'inequality':
      return 'Dein Ergebnis'
    case 'choice':
      return 'Deine Antwort'
  }
}

// Text einer Antwort zum Auswählen: Zeichen der Ungleichung als Formel, Wörter als Text
const RELATION_NAMES: Readonly<Record<string, string>> = { '<': 'kleiner als', '>': 'größer als' }

export function EntryInput({ groups, keyboard, readOnly, marks, markTone, onInput, onSubmit, onKeyboardHeight }: Props) {
  // gewählte Antwort je Teil (Auswahl und Zeichen einer Ungleichung)
  const [picked, setPicked] = useState<Readonly<Record<number, string>>>({})
  const markClass = (marked: boolean) => (marked ? (markTone === 'red' ? 'border-red-500' : 'border-amber-500') : 'border-zinc-300')

  // Umschalter mit Knöpfen (mindestens 44 px hoch); entry ist der Eintrag, in den die Wahl geht
  const options = (gi: number, entry: number, name: string, math: boolean) => {
    const group = groups[gi]
    const marked = marks?.[gi]?.[entry] ?? false
    return (
      <div
        role="radiogroup"
        aria-label={name}
        data-testid="entry-choice"
        data-marked={marked ? 'true' : undefined}
        className={`inline-flex flex-wrap gap-1 rounded-xl border-2 p-1 ${markClass(marked)}`}
      >
        {(group.options ?? []).map((option) => {
          const active = picked[gi] === option
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={math ? RELATION_NAMES[option] : undefined}
              disabled={readOnly}
              onClick={() => {
                setPicked((p) => ({ ...p, [gi]: option }))
                onInput(gi, entry, option)
              }}
              className={`min-h-11 min-w-11 rounded-lg px-3 font-medium ${active ? 'bg-accent-600 text-on-accent' : 'text-zinc-700'}`}
            >
              {math ? <Formula tex={option} /> : option}
            </button>
          )
        })}
        {marked && <span className="sr-only">markiert</span>}
      </div>
    )
  }

  const box = (gi: number, ei: number, width: string) => {
    const group = groups[gi]
    const marked = marks?.[gi]?.[ei] ?? false
    // mehrere Teile (Punkt und Länge): Name des Teils dazu
    const label = groups.length > 1 ? `${boxLabel(group, ei)} von Teil ${gi + 1}` : boxLabel(group, ei)
    return (
      <div
        key={`${gi}-${ei}`}
        data-testid="entry"
        data-marked={marked ? 'true' : undefined}
        className={`entry-box ${width} rounded-xl border-2 bg-surface px-2 py-1 focus-within:border-accent-600 ${markClass(marked)}`}
      >
        <MathInput
          label={label}
          keyboard={keyboard}
          readOnly={readOnly}
          autoFocus={gi === 0 && ei === 0}
          fieldClassName="block w-full text-xl"
          onInput={(latex) => onInput(gi, ei, latex)}
          onSubmit={onSubmit}
          onKeyboardHeight={onKeyboardHeight}
        />
        {marked && <span className="sr-only">markiert</span>}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {groups.map((group, gi) => {
        const entries = Array.from({ length: group.count }, (_, ei) => ei)
        switch (group.shape) {
          case 'vector':
            return (
              <div key={gi} className="flex items-center gap-2">
                {group.label && (
                  <span className="shrink-0 text-2xl">
                    <Formula tex={group.label} />
                  </span>
                )}
                <div className="flex items-stretch gap-1">
                  <span aria-hidden="true" className="w-3 rounded-l-[100%_50%] border-l-2 border-zinc-600" />
                  <div className="flex flex-col gap-2 py-1">{entries.map((ei) => box(gi, ei, 'w-32 sm:w-40'))}</div>
                  <span aria-hidden="true" className="w-3 rounded-r-[100%_50%] border-r-2 border-zinc-600" />
                </div>
              </div>
            )
          case 'point':
            return (
              <div key={gi} className="flex flex-wrap items-center gap-x-1 gap-y-2 text-2xl">
                <span className="shrink-0">
                  <Formula tex={`${group.label}\\Big(`} />
                </span>
                {entries.map((ei) => (
                  <span key={ei} className="flex items-center gap-1">
                    {box(gi, ei, 'w-20 sm:w-28')}
                    <span aria-hidden="true">{ei < group.count - 1 ? <Formula tex="\mid" /> : <Formula tex="\Big)" />}</span>
                  </span>
                ))}
              </div>
            )
          case 'number':
            return (
              <div key={gi} className="flex items-center gap-2">
                {group.label && (
                  <span className="shrink-0 text-2xl">
                    <Formula tex={group.label} />
                  </span>
                )}
                {box(gi, 0, 'w-40 sm:w-48')}
                {group.suffix && (
                  <span className="shrink-0 text-2xl">
                    <Formula tex={group.suffix} />
                  </span>
                )}
              </div>
            )
          case 'inequality':
            return (
              <div key={gi} className="flex flex-wrap items-center gap-2">
                <span className="shrink-0 text-2xl">
                  <Formula tex={group.label} />
                </span>
                {options(gi, 0, 'Zeichen', true)}
                {box(gi, 1, 'w-36 sm:w-44')}
              </div>
            )
          case 'choice':
            return (
              <div key={gi} className="flex flex-wrap items-center gap-2">
                <span className="shrink-0">Der Winkel ist</span>
                {options(gi, 0, 'Der Winkel ist', false)}
              </div>
            )
          case 'solutions':
            return (
              <div key={gi} className="space-y-2">
                {entries.map((ei) => (
                  <div key={ei} className="flex items-center gap-2">
                    <span className="shrink-0 text-2xl">
                      <Formula tex={`${group.label}_${ei + 1} =`} />
                    </span>
                    {box(gi, ei, 'w-32 sm:w-40')}
                  </div>
                ))}
              </div>
            )
        }
      })}
    </div>
  )
}
