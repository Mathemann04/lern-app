import { type ReactNode, useEffect, useRef } from 'react'
import { ELEMENTS } from '../../engine/chem/elements.ts'
import { placeOf } from '../../engine/chem/pse.ts'
import { cardById } from '../../engine/explain/cards.ts'
import { courseById } from '../catalog.ts'
import { FitWidth } from '../FitWidth.tsx'
import { Formula } from '../Formula.tsx'
import { RichText } from '../RichText.tsx'
import { useSheetHistory } from '../useSheetHistory.ts'
import { FORMULA_CARDS } from './formulaCards.ts'

// Hilfsmittel in der Probeklausur (S9b): Periodensystem (Ordnungszahl, Symbol, Molmasse mit einer Nachkommastelle wie
// das Periodensystem der Klausur) und Formelsammlung (Formeln ausgewählter Lernkarten, ohne Erklärungen), beide als
// Fenster über der Klausur. Die Uhr läuft weiter.

function Sheet({ title, open, onClose, wide = false, children }: { title: string; open: boolean; onClose: () => void; wide?: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])
  return (
    <dialog
      ref={ref}
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose()
      }}
      className={`mx-0 mt-auto mb-0 max-h-[85dvh] w-full max-w-none overflow-y-auto overscroll-contain rounded-t-3xl bg-surface p-0 text-zinc-900 shadow-xl backdrop:bg-black/50 sm:m-auto sm:rounded-3xl ${
        wide ? 'sm:max-w-5xl' : 'sm:max-w-xl'
      }`}
    >
      {open && (
        <div className="space-y-4 px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">{title}</h2>
            <button type="button" onClick={onClose} className="-mr-2 min-h-11 rounded-lg px-3 font-medium text-accent-700 hover:bg-accent-50">
              Schließen
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  )
}

// Knöpfe „Periodensystem" und „Formelsammlung" mit ihren Fenstern
export function ExamTools() {
  const pse = useSheetHistory()
  const formulas = useSheetHistory()
  const button = 'min-h-11 rounded-xl border-2 border-zinc-200 bg-surface px-3 font-medium text-zinc-800 hover:border-accent-600'
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-zinc-500">Hilfsmittel:</span>
      <button type="button" onClick={pse.show} className={button}>
        Periodensystem
      </button>
      <button type="button" onClick={formulas.show} className={button}>
        Formelsammlung
      </button>
      <Sheet title="Periodensystem" open={pse.open} onClose={pse.close} wide>
        <PeriodicTable />
      </Sheet>
      <Sheet title="Formelsammlung" open={formulas.open} onClose={formulas.close}>
        <FormulaList />
      </Sheet>
    </div>
  )
}

const GROUPS = Array.from({ length: 18 }, (_, i) => i + 1)
const PLACED = ELEMENTS.map((el) => ({ el, place: placeOf(el) }))
const PERIODS = Array.from({ length: Math.max(...PLACED.map((p) => p.place.period)) }, (_, i) => i + 1)

// Periodensystem als Tabelle: Gruppen 1 bis 18 nebeneinander, Perioden untereinander; am Handy seitlich wischen
export function PeriodicTable() {
  return (
    <div className="space-y-2">
      <p className="text-sm text-pretty text-zinc-600">
        Ordnungszahl, Symbol und molare Masse in g/mol. In Periode 6 nur die Elemente, die in Aufgaben vorkommen. Am Handy zur Seite wischen.
      </p>
      <div className="overflow-x-auto overscroll-x-contain pb-2" data-testid="pse-table">
        <table className="border-separate border-spacing-0.5 text-center">
          <thead>
            <tr>
              <th scope="col" className="w-6" />
              {GROUPS.map((g) => (
                <th key={g} scope="col" className="text-xs font-medium text-zinc-500">
                  {g}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map((period) => (
              <tr key={period}>
                <th scope="row" className="text-xs font-medium text-zinc-500">
                  {period}
                </th>
                {GROUPS.map((group) => {
                  const found = PLACED.find((p) => p.place.period === period && p.place.group === group)
                  if (!found) return <td key={group} className="min-w-12" />
                  const { el } = found
                  return (
                    <td key={group} className="min-w-12 rounded-md bg-zinc-100 px-0.5 py-1 leading-tight" title={el.name}>
                      <span className="block text-left text-[0.65rem] text-zinc-600">{el.z}</span>
                      <span className="block text-base font-semibold">{el.symbol}</span>
                      <span className="block text-[0.65rem] text-zinc-600">{el.molarMass.replace('.', ',')}</span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Formeln der ausgewählten Lernkarten, nach Thema
export function FormulaList() {
  const cards = FORMULA_CARDS.flatMap((id) => cardById(id) ?? [])
  const topics = [...new Set(cards.map((c) => c.topic))]
  return (
    <div className="space-y-5">
      {topics.map((topic) => (
        <section key={topic} className="space-y-3">
          <h3 className="text-sm font-semibold text-zinc-500">{courseById(topic)?.course.title ?? topic}</h3>
          {cards
            .filter((c) => c.topic === topic)
            .map((card) => (
              <div key={card.id} className="space-y-1 rounded-2xl bg-zinc-100 px-4 py-3">
                <RichText text={card.title} className="block text-sm font-medium" inline />
                {card.formulas.map((tex) => (
                  <FitWidth key={tex}>
                    <Formula tex={tex} />
                  </FitWidth>
                ))}
              </div>
            ))}
        </section>
      ))}
    </div>
  )
}
