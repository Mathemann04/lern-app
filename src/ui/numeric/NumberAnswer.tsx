import { useLayoutEffect, useState } from 'react'
import type { NumericAnswer } from '../../engine/quantity/judge.ts'
import { formatLatex, readNumber } from '../../engine/quantity/numberDe.ts'
import type { Rational } from '../../engine/rational.ts'
import { Formula } from '../Formula.tsx'
import { RichText } from '../RichText.tsx'

// Zahl selbst eintippen (freier Modus der Chemie, S8b; allgemein, später auch Werkstoffkunde und Physik):
// eigener Ziffernblock mit Komma, Minus und Zehnerpotenz, ohne die Tastatur des Handys (keine
// Autokorrektur). Über dem Feld steht, wie die App die Zahl gelesen hat; die Einheit steht fest daneben.
// Auch mit der Tastatur des Laptops bedienbar (Ziffern, Komma oder Punkt, Minus, e für die Zehnerpotenz,
// Rücktaste, Enter). Beurteilt wird außerhalb (judgeNumber in engine/quantity/judge.ts bzw. die Klausur).

type Entry = { readonly mantissa: string; readonly exponent: string | null }
const EMPTY: Entry = { mantissa: '', exponent: null }

// Eingabe als Text für readNumber
const entryText = ({ mantissa, exponent }: Entry) => (exponent === null ? mantissa : `${mantissa}e${exponent}`)

// Eingabe so, wie sie dasteht (LaTeX), z. B. „1{,}8 \cdot 10^{-5}"
function entryLatex({ mantissa, exponent }: Entry): string {
  const m = mantissa.replace(/,/g, '{,}') || (exponent === null ? '' : '\\square')
  if (exponent === null) return m
  return `${m} \\cdot 10^{${exponent === '' ? '\\square' : exponent}}`
}

function apply(entry: Entry, key: string): Entry {
  const inExponent = entry.exponent !== null
  if (key === 'back') {
    if (inExponent) return entry.exponent === '' ? { ...entry, exponent: null } : { ...entry, exponent: entry.exponent!.slice(0, -1) }
    return { ...entry, mantissa: entry.mantissa.slice(0, -1) }
  }
  if (key === 'minus') {
    if (inExponent) return { ...entry, exponent: entry.exponent!.startsWith('-') ? entry.exponent!.slice(1) : `-${entry.exponent}` }
    return { ...entry, mantissa: entry.mantissa.startsWith('-') ? entry.mantissa.slice(1) : `-${entry.mantissa}` }
  }
  if (key === 'power') return inExponent ? entry : { ...entry, exponent: '' }
  if (key === ',') {
    if (inExponent || entry.mantissa.includes(',')) return entry
    // „," am Anfang wird zu „0,"
    return { ...entry, mantissa: `${entry.mantissa === '' || entry.mantissa === '-' ? `${entry.mantissa}0` : entry.mantissa},` }
  }
  if (/^\d$/.test(key)) {
    if (inExponent) return entry.exponent!.replace('-', '').length >= 3 ? entry : { ...entry, exponent: entry.exponent + key }
    return entry.mantissa.replace(/[-,]/g, '').length >= 12 ? entry : { ...entry, mantissa: entry.mantissa + key }
  }
  return entry
}

// Eingabe aus einem gespeicherten Text (entryText), z. B. „1,85e-3"
function entryOf(text: string | undefined): Entry {
  if (!text) return EMPTY
  const [mantissa, exponent] = text.split('e')
  return { mantissa, exponent: exponent ?? null }
}

type Props = {
  // Einheit neben dem Feld, genaue Zahl (dann kein Rundungshinweis), Hinweis unter dem Feld
  readonly answer: Pick<NumericAnswer, 'unit' | 'exact' | 'note'>
  // nach der richtigen Antwort gesperrt
  readonly disabled: boolean
  // gelesene Zahl und die Eingabe als Text (zum Speichern, readNumber liest sie wieder)
  readonly onSubmit: (value: Rational, text: string) => void
  // Beschriftung des Knopfs, z. B. „Prüfen" (üben) oder „Übernehmen" (Klausur, ohne Rückmeldung)
  readonly submitLabel?: string
  // schon eingetippte Eingabe (entryText)
  readonly initial?: string
}

const KEYS: readonly (readonly [string, string, string])[] = [
  // [Taste, Beschriftung, Name für Vorlesehilfen]
  ['7', '7', '7'],
  ['8', '8', '8'],
  ['9', '9', '9'],
  ['back', '⌫', 'Löschen'],
  ['4', '4', '4'],
  ['5', '5', '5'],
  ['6', '6', '6'],
  ['minus', '−', 'Minus'],
  ['1', '1', '1'],
  ['2', '2', '2'],
  ['3', '3', '3'],
  ['power', '·10ⁿ', 'mal zehn hoch'],
  ['0', '0', '0'],
  [',', ',', 'Komma'],
]

export function NumberAnswer({ answer, disabled, onSubmit, submitLabel = 'Prüfen', initial }: Props) {
  const [entry, setEntry] = useState<Entry>(() => entryOf(initial))
  const value = readNumber(entryText(entry))

  function check() {
    if (disabled || !value) return
    onSubmit(value, entryText(entry))
  }

  // Tastatur des Laptops (nicht, solange ein Fenster wie die Lernkarten offen ist oder eine Taste mit
  // Strg, Alt oder Cmd gedrückt wird). useLayoutEffect, damit die Tasten ab dem ersten sichtbaren Bild
  // ankommen: Mit useEffect hing der Empfänger erst ein paar Millisekunden nach dem Zeichnen dran; schnell
  // getippte Ziffern gingen dann verloren (Browser-Test „Lösung zeigen nach einem Fehler“ am 14.11.2026 rot).
  useLayoutEffect(() => {
    if (disabled) return
    function onKey(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey || document.querySelector('[role="dialog"]')) return
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return
      const key =
        event.key === 'Backspace'
          ? 'back'
          : event.key === '-' || event.key === '−'
            ? 'minus'
            : event.key === 'e' || event.key === 'E' || event.key === '^'
              ? 'power'
              : event.key === '.' || event.key === ','
                ? ','
                : /^\d$/.test(event.key)
                  ? event.key
                  : null
      if (event.key === 'Enter' && document.activeElement?.tagName !== 'BUTTON') {
        event.preventDefault()
        check()
        return
      }
      if (!key) return
      event.preventDefault()
      setEntry((e) => apply(e, key))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const shown = entryLatex(entry)
  return (
    <div className="space-y-3" role="group" aria-label="Zahl eingeben">
      <p className="min-h-6 text-sm text-zinc-600" aria-live="polite" data-testid="read-as">
        {entry.mantissa === '' && entry.exponent === null ? (
          'Tippe das Ergebnis ein.'
        ) : value ? (
          <>
            Gelesen als <Formula tex={`${formatLatex(value, { significant: 12 })}${answer.unit ? `\\,${answer.unit}` : ''}`} />
          </>
        ) : (
          'Noch keine vollständige Zahl.'
        )}
      </p>
      <div
        className={`flex min-h-14 items-center gap-2 rounded-2xl border-2 px-4 py-2 text-2xl ${disabled ? 'border-green-600 bg-green-50' : 'border-accent-600 bg-surface'}`}
        data-testid="number-field"
      >
        <span className="min-w-0 flex-1 overflow-x-auto">{shown ? <Formula tex={shown} /> : <span className="text-zinc-500">?</span>}</span>
        {answer.unit && (
          <span className="shrink-0 text-zinc-600">
            <Formula tex={answer.unit} />
          </span>
        )}
      </div>
      {answer.note && <RichText text={answer.note} className="block text-sm text-zinc-600" />}
      {!disabled && (
        <>
          <div className="grid grid-cols-4 gap-2">
            {KEYS.map(([key, label, name]) => (
              <button
                key={key}
                type="button"
                aria-label={name}
                onClick={() => setEntry((e) => apply(e, key))}
                className="min-h-12 rounded-xl border border-zinc-200 bg-surface text-xl font-medium hover:border-accent-600 active:bg-accent-50"
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={check}
              disabled={!value}
              className="col-span-2 min-h-12 rounded-xl bg-accent-700 text-lg font-medium text-on-accent hover:bg-accent-800 disabled:opacity-50"
            >
              {submitLabel}
            </button>
          </div>
          {!answer.exact && <p className="text-sm text-zinc-500">Runde auf drei gültige Ziffern, z.{' '}B. 0,0234 oder 1,85{' '}·{' '}10⁵.</p>}
        </>
      )}
    </div>
  )
}
