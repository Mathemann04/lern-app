import { type ReactNode, useEffect, useMemo, useState } from 'react'
import type { FalkFigure } from '../../engine/linalg/falk.ts'
import { FitWidth } from '../FitWidth.tsx'
import { Formula } from '../Formula.tsx'

// Falk-Schema (M7 Schritt 8b): rechte Matrix oben rechts, linke unten links, Produkt unten rechts. Vor der Antwort
// (done = false) sind die gefragten Felder leer bzw. zeigen ein Fragezeichen, und es gibt nichts abzuspielen (das
// verriete das Ergebnis). Danach stehen die Einträge da, und „Abspielen“ zeigt Eintrag für Eintrag: Zeile und Spalte
// leuchten auf, je Paar ein Produkt, zuletzt der Eintrag in seinem Feld. Bei „Bewegung reduzieren“ springt der Knopf
// gleich ans Ende.

type Frame = { readonly cell: number; readonly k: number }

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
// erster Eintrag langsam, die übrigen schneller (sonst dauert ein 3 × 3-Produkt zu lange)
const frameMs = (f: Frame, n: number) => (f.cell === 0 ? 900 : 480) + (f.k === n ? 300 : 0)

export function FalkScheme({ falk, done }: { falk: FalkFigure; done: boolean }) {
  const m = falk.left.length
  const n = falk.top.length
  const p = falk.top[0].length
  const frames = useMemo(() => falk.cells.flatMap((_, cell) => Array.from({ length: n + 1 }, (_, k) => ({ cell, k }))), [falk, n])
  // Nummer des Bildes beim Abspielen; null = steht still
  const [at, setAt] = useState<number | null>(null)
  // nach dem Abspielen bleibt die Rechnung des letzten Eintrags stehen
  const [played, setPlayed] = useState(false)

  useEffect(() => {
    if (at === null) return
    const id = window.setTimeout(() => {
      if (at + 1 < frames.length) setAt(at + 1)
      else {
        setAt(null)
        setPlayed(true)
      }
    }, frameMs(frames[at], n))
    return () => window.clearTimeout(id)
  }, [at, frames, n])

  function play() {
    if (at !== null || reducedMotion()) {
      setAt(null)
      setPlayed(true)
      return
    }
    setPlayed(false)
    setAt(0)
  }

  const frame = at === null ? null : frames[at]
  const current = frame ? falk.cells[frame.cell] : null
  const order = new Map(falk.cells.map(([i, j], c) => [`${i},${j}`, c]))
  const single = falk.cells.length === 1

  // Inhalt eines Feldes des Produkts
  const productCell = (i: number, j: number) => {
    const c = order.get(`${i},${j}`)
    if (c === undefined) return ''
    if (!done) return single ? '?' : ''
    if (!frame) return falk.product[i][j]
    if (c < frame.cell || (c === frame.cell && frame.k === n)) return falk.product[i][j]
    return ''
  }

  // Rechnung unter dem Schema: beim Abspielen wachsend, danach die des letzten Eintrags
  const shown = frame ?? (played ? { cell: falk.cells.length - 1, k: n } : null)
  const line = shown
    ? (() => {
        const [i, j] = falk.cells[shown.cell]
        const terms = falk.terms[i][j].slice(0, Math.min(n, shown.k + 1))
        const tail = shown.k === n ? ` = ${falk.product[i][j]}` : ''
        // ein einziger Eintrag (Zeile mal Spalte) heißt wie das Produkt selbst
        const entry = m * p === 1 ? falk.name : `(${falk.name})_{${i + 1}${j + 1}}`
        return `${entry} = ${terms.join(' + ')}${tail}`
      })()
    : null

  const cellClass = (lit: boolean, focus: boolean, target: boolean) =>
    `flex min-h-9 min-w-9 items-center justify-center rounded-md px-1.5 py-1 transition-colors duration-200 motion-reduce:transition-none ${
      focus ? 'bg-accent-200 ring-2 ring-accent-700' : lit ? 'bg-accent-100' : ''
    } ${target ? 'ring-2 ring-accent-600' : ''}`

  const rows: ReactNode[] = []
  // oben: leere Ecke, dann die rechte Matrix
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) rows.push(<span key={`e${r}-${c}`} aria-hidden />)
    for (let j = 0; j < p; j++) {
      const lit = !!current && current[1] === j
      const focus = lit && !!frame && frame.k === r && frame.k < n
      rows.push(
        <span key={`t${r}-${j}`} className={`${j === 0 ? 'border-l-2 border-zinc-400' : ''} ${r === n - 1 ? 'border-b-2 border-zinc-400' : ''} p-0.5`}>
          <span className={cellClass(lit, focus, false)} data-falk="top">
            <Formula tex={falk.top[r][j]} />
          </span>
        </span>,
      )
    }
  }
  // unten: linke Matrix, dann das Produkt
  for (let i = 0; i < m; i++) {
    for (let k = 0; k < n; k++) {
      const lit = !!current && current[0] === i
      const focus = lit && !!frame && frame.k === k && frame.k < n
      rows.push(
        <span key={`l${i}-${k}`} className="p-0.5">
          <span className={cellClass(lit, focus, false)} data-falk="left">
            <Formula tex={falk.left[i][k]} />
          </span>
        </span>,
      )
    }
    for (let j = 0; j < p; j++) {
      const isCurrent = !!current && current[0] === i && current[1] === j
      const asked = order.has(`${i},${j}`)
      const content = productCell(i, j)
      rows.push(
        <span key={`c${i}-${j}`} className={`${j === 0 ? 'border-l-2 border-zinc-400' : ''} p-0.5`}>
          <span className={cellClass(false, isCurrent && frame!.k === n, (isCurrent || (single && asked && !frame)) && !(isCurrent && frame!.k === n))} data-falk="product">
            {content === '' ? null : <Formula tex={content} />}
          </span>
        </span>,
      )
    }
  }

  return (
    <figure className="space-y-3 rounded-2xl border border-zinc-200 bg-surface px-3 py-3" data-testid="falk-scheme">
      <div className="overflow-x-auto">
        <div
          className="mx-auto grid w-max items-center text-center"
          style={{ gridTemplateColumns: `repeat(${n + p}, auto)` }}
          role="img"
          aria-label="Falk-Schema: rechte Matrix oben rechts, linke Matrix unten links, das Produkt unten rechts"
        >
          {rows}
        </div>
      </div>
      <figcaption className="space-y-2">
        {line && (
          <FitWidth className="text-lg" min={0.6}>
            <Formula tex={line} />
          </FitWidth>
        )}
        {done ? (
          <button
            type="button"
            onClick={play}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border-2 border-zinc-300 px-4 font-medium shadow-[0_3px_0_var(--color-zinc-300)] active:translate-y-0.5 active:shadow-[0_1px_0_var(--color-zinc-300)]"
          >
            {at === null ? (
              <svg viewBox="0 0 12 12" className="size-3" aria-hidden>
                <path d="M2 1.2v9.6L10.4 6z" fill="currentColor" />
              </svg>
            ) : null}
            {at === null ? 'Abspielen' : 'Alles zeigen'}
          </button>
        ) : (
          <p className="text-sm text-zinc-600">Rechte Matrix oben, linke unten links. Nach deiner Antwort kannst du das Schema abspielen.</p>
        )}
      </figcaption>
    </figure>
  )
}
