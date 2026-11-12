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
      return 'Dein Ergebnis'
  }
}

export function EntryInput({ groups, keyboard, readOnly, marks, markTone, onInput, onSubmit, onKeyboardHeight }: Props) {
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
        className={`entry-box ${width} rounded-xl border-2 bg-surface px-2 py-1 focus-within:border-accent-600 ${marked ? (markTone === 'red' ? 'border-red-500' : 'border-amber-500') : 'border-zinc-300'}`}
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
