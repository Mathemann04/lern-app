import { type ReactNode, useEffect, useState } from 'react'
import { SARRUS_MINUS, SARRUS_PLUS, type SarrusFigure } from '../../engine/linalg/sarrus.ts'
import { FitWidth } from '../FitWidth.tsx'
import { Formula } from '../Formula.tsx'

// Sarrus (M7 Schritt 9b): die Matrix zwischen Determinantenstrichen, rechts daneben die ersten beiden Spalten noch
// einmal. Vor der Antwort (done = false) steht nur das Schema da, ohne Knopf (das Abspielen verriete das Ergebnis).
// Danach zeigt „Abspielen“: erst leuchten die abgeschriebenen Spalten, dann nacheinander die drei Diagonalen nach rechts
// unten (Plus, blau) und die drei nach links unten (Minus, orange) wie mit einem Textmarker; die Rechnung darunter wächst
// Produkt für Produkt, zuletzt steht der Wert da. Bei „Bewegung reduzieren“ springt der Knopf gleich ans Ende.

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Bilder: 0 = abgeschriebene Spalten, 1 bis 3 Plus-Diagonalen, 4 bis 6 Minus-Diagonalen, 7 = Ergebnis
const LAST = 7
const frameMs = (f: number) => (f === 0 ? 1000 : f === LAST ? 1200 : 850)

type Diagonal = readonly (readonly [number, number])[]
const PLUS_COLOR = 'var(--vec-a)'
const MINUS_COLOR = 'var(--vec-b)'

// Mitte eines Feldes in Prozent der Fläche (fünf gleich breite Spalten, drei gleich hohe Zeilen)
const cx = (c: number) => ((c + 0.5) / 5) * 100
const cy = (r: number) => ((r + 0.5) / 3) * 100

function DiagonalLine({ d, color, strong }: { d: Diagonal; color: string; strong: boolean }) {
  const [r0, c0] = d[0]
  const [r2, c2] = d[2]
  // ein Stück über die Mitte der äußeren Felder hinaus
  const dx = (cx(c2) - cx(c0)) / 2
  const dy = (cy(r2) - cy(r0)) / 2
  const k = 0.4
  return (
    <line
      x1={`${cx(c0) - k * dx}%`}
      y1={`${cy(r0) - k * dy}%`}
      x2={`${cx(c2) + k * dx}%`}
      y2={`${cy(r2) + k * dy}%`}
      style={{ stroke: color, strokeOpacity: strong ? 0.4 : 0.55 }}
      strokeWidth={strong ? 14 : 2.5}
      strokeLinecap="round"
    />
  )
}

export function SarrusScheme({ sarrus, done }: { sarrus: SarrusFigure; done: boolean }) {
  // Nummer des Bildes beim Abspielen; null = steht still
  const [at, setAt] = useState<number | null>(null)
  // nach dem Abspielen bleiben alle sechs Diagonalen dünn stehen und die ganze Rechnung
  const [played, setPlayed] = useState(false)

  useEffect(() => {
    if (at === null) return
    const id = window.setTimeout(() => {
      if (at < LAST) setAt(at + 1)
      else {
        setAt(null)
        setPlayed(true)
      }
    }, frameMs(at))
    return () => window.clearTimeout(id)
  }, [at])

  function play() {
    if (at !== null || reducedMotion()) {
      setAt(null)
      setPlayed(true)
      return
    }
    setPlayed(false)
    setAt(0)
  }

  // wie weit die Rechnung steht: Bild 7 bzw. danach ganz
  const shown = at ?? (played ? LAST : null)
  const plusCount = shown === null ? 0 : Math.min(3, shown)
  const minusCount = shown === null ? 0 : Math.max(0, Math.min(3, shown - 3))
  const current: { d: Diagonal; color: string } | null =
    at !== null && at >= 1 && at <= 3 ? { d: SARRUS_PLUS[at - 1], color: PLUS_COLOR } : at !== null && at >= 4 && at <= 6 ? { d: SARRUS_MINUS[at - 4], color: MINUS_COLOR } : null
  const litCell = (r: number, c: number) => !!current && current.d.some(([i, j]) => i === r && j === c)

  // Rechnung untereinander: Plus-Produkte, Minus-Produkte, Ergebnis (in einer Zeile wäre sie am Handy zu klein)
  const line =
    shown === null || shown === 0
      ? null
      : [
          `${sarrus.name} &= ${sarrus.plus.slice(0, plusCount).join(' + ')}`,
          ...(minusCount > 0 ? [`&\\quad - ${sarrus.minus.slice(0, minusCount).join(' - ')}`] : []),
          ...(shown === LAST ? [`&= ${sarrus.values === '' ? '' : `${sarrus.values} = `}${sarrus.result}`] : []),
        ]
  const calc = line ? `\\begin{aligned} ${line.join(' \\\\ ')} \\end{aligned}` : null
  // am Ende stehen alle sechs Diagonalen dünn hinter den Zahlen
  const resting = played && at === null

  const cells: ReactNode[] = []
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 5; c++) {
      const copy = c >= 3
      const lit = litCell(r, c)
      const copyLit = copy && at === 0
      cells.push(
        <span key={`${r}-${c}`} className={`p-0.5 ${c === 0 ? 'border-l-2 border-zinc-400' : ''} ${c === 2 ? 'border-r-2 border-zinc-400' : ''}`}>
          <span
            className={`flex min-h-10 min-w-10 items-center justify-center rounded-md px-1.5 py-1 transition-colors duration-200 motion-reduce:transition-none ${copy ? 'text-zinc-500' : ''} ${
              copyLit ? 'bg-accent-100 ring-2 ring-accent-600' : ''
            }`}
            style={lit && current ? { boxShadow: `0 0 0 2px ${current.color}` } : undefined}
            data-sarrus={copy ? 'copy' : 'cell'}
            data-lit={lit || copyLit ? 'true' : undefined}
          >
            <span className={resting ? 'relative rounded bg-surface px-0.5' : ''}>
              <Formula tex={sarrus.matrix[r][c % 3]} />
            </span>
          </span>
        </span>,
      )
    }

  return (
    <figure className="space-y-3 rounded-2xl border border-zinc-200 bg-surface px-3 py-3" data-testid="sarrus-scheme">
      <div className="overflow-x-auto">
        <div
          className="relative mx-auto grid w-max items-center text-center"
          style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gridTemplateRows: 'repeat(3, minmax(0, 1fr))' }}
          role="img"
          aria-label="Sarrus-Schema: die Matrix mit den ersten beiden Spalten noch einmal rechts daneben. Die drei Diagonalen nach rechts unten zählen mit Plus, die drei nach links unten mit Minus."
        >
          <svg className="pointer-events-none absolute inset-0 size-full overflow-visible" aria-hidden>
            {resting && (
              <>
                {SARRUS_PLUS.map((d, i) => (
                  <DiagonalLine key={`p${i}`} d={d} color={PLUS_COLOR} strong={false} />
                ))}
                {SARRUS_MINUS.map((d, i) => (
                  <DiagonalLine key={`m${i}`} d={d} color={MINUS_COLOR} strong={false} />
                ))}
              </>
            )}
            {current && <DiagonalLine d={current.d} color={current.color} strong />}
          </svg>
          {cells}
        </div>
      </div>
      <figcaption className="space-y-2">
        {at === 0 && <p className="text-sm text-zinc-600">Die ersten beiden Spalten noch einmal rechts daneben.</p>}
        {calc && (
          <FitWidth className="text-lg" min={0.6}>
            <Formula tex={calc} />
          </FitWidth>
        )}
        {(at !== null && at >= 1) || played ? (
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-1 w-5 rounded-full" style={{ background: PLUS_COLOR }} aria-hidden />
              nach rechts unten: Plus
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-1 w-5 rounded-full" style={{ background: MINUS_COLOR }} aria-hidden />
              nach links unten: Minus
            </span>
          </p>
        ) : null}
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
          <p className="text-sm text-zinc-600">Die ersten beiden Spalten stehen rechts daneben. Nach deiner Antwort kannst du Sarrus abspielen.</p>
        )}
      </figcaption>
    </figure>
  )
}
