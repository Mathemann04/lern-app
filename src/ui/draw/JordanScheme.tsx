import { type ReactNode, useEffect, useState } from 'react'
import type { JordanFigure } from '../../engine/linalg/jordan.ts'
import { Formula } from '../Formula.tsx'
import { RichText } from '../RichText.tsx'

// Gauß-Jordan (M7 Schritt 12c): die Tabelle (A | E) mit Zeilennamen und Umformungen rechts daneben. Sie erscheint erst
// nach der Antwort. „Abspielen“ geht Bild für Bild durch das Verfahren: Zeilen tauschen, Nullen unter, dann über der
// Diagonale, zuletzt jede Zeile durch ihre Zahl auf der Diagonale. Geänderte Zeilen leuchten, die Stufenzahl hat einen
// Rahmen, neue Nullen links sind kräftiger. Links entsteht so E, rechts A⁻¹. „Zurück“ und „Weiter“ gehen einzeln. Bei
// „Bewegung reduzieren“ springt „Abspielen“ gleich ans Ende.

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const frameMs = (f: number) => (f === 0 ? 1400 : 2000)

const BUTTON =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-zinc-300 px-4 font-medium shadow-[0_3px_0_var(--color-zinc-300)] active:translate-y-0.5 active:shadow-[0_1px_0_var(--color-zinc-300)] disabled:opacity-40 disabled:shadow-none'

export function JordanScheme({ jordan }: { jordan: JordanFigure }) {
  const { n, frames } = jordan
  const last = frames.length - 1
  const [at, setAt] = useState(0)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!playing) return
    // beim letzten Bild hört das Abspielen auf (es gibt immer mindestens zwei Bilder)
    const id = window.setTimeout(() => {
      if (at + 1 >= last) setPlaying(false)
      setAt(Math.min(at + 1, last))
    }, frameMs(at))
    return () => window.clearTimeout(id)
  }, [at, playing, last])

  function play() {
    if (playing) {
      setPlaying(false)
      return
    }
    if (reducedMotion()) {
      setAt(last)
      return
    }
    setAt(0)
    setPlaying(true)
  }
  const go = (k: number) => {
    setPlaying(false)
    setAt(Math.max(0, Math.min(last, k)))
  }

  const frame = frames[at]
  const changed = new Set(frame.changed)
  const zeros = new Set(frame.zeros.map(([r, c]) => `${r},${c}`))
  const isPivot = (r: number, c: number) => !!frame.pivot && frame.pivot[0] === r && frame.pivot[1] === c
  const roman = ['I', 'II', 'III', 'IV']

  const cells: ReactNode[] = []
  // Namen über den Hälften (am Anfang „A“ und „E“, am Ende „E“ und „A^{-1}“); die Zeile bleibt immer da, damit nichts springt
  cells.push(<span key="h0" aria-hidden />)
  for (const [i, label] of (frame.labels ?? ['', '']).entries())
    cells.push(
      <span key={`h${i + 1}`} className={`min-h-7 text-sm font-semibold text-accent-700 ${i === 1 ? 'border-l-2 border-transparent' : ''}`} style={{ gridColumn: `span ${n}` }} data-jordan="label">
        {label ? <Formula tex={label} /> : null}
      </span>,
    )
  cells.push(<span key="h3" aria-hidden />)
  frame.rows.forEach((row, r) => {
    const lit = changed.has(r)
    cells.push(
      <span key={`n${r}`} className="pr-2 text-sm text-zinc-600">
        {roman[r]}
      </span>,
    )
    row.forEach((tex, c) => {
      const zero = c < n && zeros.has(`${r},${c}`)
      const pivot = isPivot(r, c)
      cells.push(
        <span key={`c${r}-${c}`} className={`p-0.5 ${c === n ? 'border-l-2 border-zinc-400' : ''}`}>
          <span
            // neuer Schlüssel je Bild: geänderte Einträge gleiten neu herein
            key={lit ? `${at}` : 'fest'}
            className={`flex min-h-10 min-w-9 items-center justify-center rounded-md px-1.5 py-1 transition-colors duration-200 motion-reduce:transition-none ${
              zero ? 'bg-accent-200' : lit ? 'bg-accent-100' : ''
            } ${pivot ? 'ring-2 ring-accent-700' : ''} ${lit ? 'animate-step-in' : ''}`}
            data-jordan={c < n ? 'left' : 'right'}
            data-lit={lit ? 'true' : undefined}
          >
            <Formula tex={tex} />
          </span>
        </span>,
      )
    })
    cells.push(
      <span key={`o${r}`} className="pl-2 text-left text-sm text-zinc-600" data-jordan="note">
        {frame.notes[r] ? <Formula tex={frame.notes[r]} /> : null}
      </span>,
    )
  })

  return (
    <figure className="space-y-3 rounded-2xl border border-zinc-200 bg-surface px-3 py-3" data-testid="jordan-scheme">
      <div className="overflow-x-auto">
        <div
          className="mx-auto grid w-max items-center text-center"
          style={{ gridTemplateColumns: `auto repeat(${2 * n}, auto) minmax(4.5rem, auto)` }}
          role="img"
          aria-label={`Gauß-Jordan-Verfahren, Bild ${at + 1} von ${frames.length}: ${frame.caption.replaceAll('$', '')}`}
        >
          {cells}
        </div>
      </div>
      <figcaption className="space-y-3">
        <p className="min-h-12 text-zinc-700" aria-live="polite">
          <RichText text={frame.caption} inline />
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={play} className={BUTTON}>
            {playing ? null : (
              <svg viewBox="0 0 12 12" className="size-3" aria-hidden>
                <path d="M2 1.2v9.6L10.4 6z" fill="currentColor" />
              </svg>
            )}
            {playing ? 'Anhalten' : 'Abspielen'}
          </button>
          <button type="button" onClick={() => go(at - 1)} disabled={at === 0} className={BUTTON} aria-label="Ein Bild zurück">
            ←
          </button>
          <button type="button" onClick={() => go(at + 1)} disabled={at === last} className={BUTTON} aria-label="Ein Bild weiter">
            →
          </button>
          <span className="text-sm text-zinc-600" data-testid="jordan-count">
            Bild {at + 1} von {frames.length}
          </span>
        </div>
      </figcaption>
    </figure>
  )
}
