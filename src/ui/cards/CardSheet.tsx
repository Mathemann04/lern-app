import { useEffect, useRef, useState } from 'react'
import { cardById } from '../../engine/explain/cards.ts'
import type { Expr } from '../../engine/expr/types.ts'
import { FitWidth } from '../FitWidth.tsx'
import { Formula } from '../Formula.tsx'
import { RichText } from '../RichText.tsx'
import { cardHref } from './cardRoute.ts'
import { CardBody } from './CardBody.tsx'

// Lernkarten aus einer Aufgabe heraus: als Fenster über der Aufgabe, damit nichts verloren geht.
// Die Zurück-Taste des Handys schließt das Fenster, statt die Aufgabe zu verlassen.

function useSheetHistory() {
  const [open, setOpen] = useState(false)
  // Eintrag im Verlauf, den das Öffnen angelegt hat (gleiche Adresse, nur fürs Zurück)
  const pushed = useRef(false)

  useEffect(() => {
    if (!open) return
    const onBack = () => {
      pushed.current = false
      setOpen(false)
    }
    window.addEventListener('popstate', onBack)
    return () => window.removeEventListener('popstate', onBack)
  }, [open])

  const show = () => {
    window.history.pushState({ sheet: true }, '')
    pushed.current = true
    setOpen(true)
  }
  const close = () => {
    if (pushed.current) {
      pushed.current = false
      window.history.back()
    }
    setOpen(false)
  }
  return { open, show, close }
}

// Knopf „Lernkarte" mit dem Fenster dazu; title: Überschrift im Fenster, task: die Aufgabe
export function CardSheetButton({ ids, title, task }: { ids: readonly string[]; title: string; task: Expr }) {
  const sheet = useSheetHistory()
  if (ids.length === 0) return null
  return (
    <>
      <button type="button" onClick={sheet.show} className="rounded-xl px-3 py-2.5 font-medium text-accent-700 hover:bg-accent-50">
        {ids.length === 1 ? 'Lernkarte' : 'Lernkarten'}
      </button>
      <CardSheet ids={ids} title={title} task={task} open={sheet.open} onClose={sheet.close} />
    </>
  )
}

type SheetProps = { ids: readonly string[]; title: string; task: Expr; open: boolean; onClose: () => void }

function CardSheet({ ids, title, task, open, onClose }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  const cards = ids.flatMap((id) => cardById(id) ?? [])
  return (
    <dialog
      ref={ref}
      aria-labelledby="card-sheet-title"
      // Escape schließt über denselben Weg wie der Knopf (mit dem Verlauf)
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      // Tippen auf den abgedunkelten Hintergrund schließt
      onClick={(event) => {
        if (event.target === ref.current) onClose()
      }}
      className="mx-0 mt-auto mb-0 max-h-[85dvh] w-full max-w-none overflow-y-auto overscroll-contain rounded-t-3xl bg-white p-0 text-zinc-900 shadow-xl backdrop:bg-zinc-900/40 sm:m-auto sm:max-w-xl sm:rounded-3xl"
    >
      {open && (
        <div className="space-y-5 px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-between gap-3">
            <h2 id="card-sheet-title" className="text-sm font-medium text-zinc-500">
              {title}
            </h2>
            <button type="button" onClick={onClose} className="-mr-2 rounded-lg px-3 py-2.5 font-medium text-accent-700 hover:bg-accent-50">
              Schließen
            </button>
          </div>
          {cards.length === 1 ? (
            <div className="space-y-4">
              <h3 className="text-2xl font-semibold tracking-tight">
                <RichText text={cards[0].title} inline />
              </h3>
              <CardBody card={cards[0]} heading="h4" practice={false} task={task} />
            </div>
          ) : (
            <ul className="space-y-3">
              {cards.map((card) => (
                <li key={card.id}>
                  <details className="group rounded-2xl border border-zinc-200 open:border-accent-600">
                    <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                      <span className="min-w-0 flex-1 space-y-1">
                        <RichText text={card.title} className="block font-medium" inline />
                        <FitWidth className="text-zinc-600">
                          <Formula tex={card.formulas[0]} />
                        </FitWidth>
                      </span>
                      <span aria-hidden className="text-accent-700 transition-transform group-open:rotate-90">
                        ›
                      </span>
                    </summary>
                    <div className="border-t border-zinc-100 px-4 py-4">
                      <CardBody card={card} heading="h3" practice={false} task={task} />
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </dialog>
  )
}

// Links zu den Lernkarten einer gelösten Aufgabe (dann darf man die Aufgabe verlassen)
export function TaskCardLinks({ ids }: { ids: readonly string[] }) {
  const cards = ids.flatMap((id) => cardById(id) ?? [])
  if (cards.length === 0) return null
  return (
    <nav aria-label="Lernkarten zu dieser Aufgabe" className="space-y-2">
      <p className="text-sm text-zinc-500">Regeln in dieser Aufgabe zum Nachlesen:</p>
      <ul className="flex flex-wrap gap-2">
        {cards.map((card) => (
          <li key={card.id}>
            <a href={cardHref(card.id)} className="inline-block rounded-full border border-zinc-200 px-3 py-1 hover:border-accent-600 hover:bg-accent-50">
              <RichText text={card.title} inline />
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
