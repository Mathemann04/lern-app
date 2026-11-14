import type { ReactNode } from 'react'
import { type Segment, parseRichText } from '../engine/explain/richText.ts'
import { FitWidth } from './FitWidth.tsx'
import { Formula } from './Formula.tsx'

// Text mit eingebetteten Formeln ($…$), ein Absatz pro Zeile.
// `inline`: ohne Absatz-Blöcke, für Überschriften, Knöpfe und mitten im Satz (ein einzelner Absatz
// bleibt in der Zeile, mehrere stehen untereinander).
export function RichText({ text, className = '', inline = false }: { text: string; className?: string; inline?: boolean }) {
  const paragraphs = parseRichText(text)
  const content = (segments: (typeof paragraphs)[number]) => {
    // **fett** (seit M7 Schritt 9a), auch über eine Formel hinweg: Der Zustand läuft durch den Absatz
    let bold = false
    const strong = (node: ReactNode, key: string | number) => (bold ? <strong key={key}>{node}</strong> : node)
    return segments.map((s, j) => {
      if (s.kind === 'text') {
        // Satzzeichen direkt nach einer Formel und eine öffnende Klammer oder „ direkt davor stehen schon
        // bei der Formel (siehe unten)
        const glued = j > 0 ? gluedPunctuation(segments, j - 1) : ''
        const opening = gluedOpening(segments, j + 1)
        const pieces = s.text.slice(glued.length, s.text.length - opening.length).split('**')
        return (
          <span key={j}>
            {pieces.map((piece, k) => {
              if (k > 0) bold = !bold
              return piece === '' ? null : strong(piece, k)
            })}
          </span>
        )
      }
      const opening = gluedOpening(segments, j)
      const punctuation = gluedPunctuation(segments, j)
      if (!opening && !punctuation) return strong(<Formula key={j} tex={s.latex} />, j)
      // Kurze Formel und Satzzeichen bleiben zusammen, sonst steht etwa „?" allein in der nächsten Zeile
      // oder „(" allein am Ende der Zeile davor
      return strong(
        <span key={j} className="whitespace-nowrap">
          {opening}
          <Formula tex={s.latex} />
          {punctuation}
        </span>,
        j,
      )
    })
  }
  // Ein Absatz aus nur einer Formel (z. B. eine Tabelle in der Frage) wird am Handy kleiner, statt die Seite seitlich
  // zu verbreitern (M7 Schritt 13)
  const alone = (segments: (typeof paragraphs)[number]) => segments.length === 1 && segments[0].kind === 'math'
  if (inline) {
    if (paragraphs.length === 1) return <span className={className}>{content(paragraphs[0])}</span>
    return (
      <span className={className}>
        {paragraphs.map((segments, i) =>
          alone(segments) ? (
            <FitWidth key={i} min={0.6}>
              {content(segments)}
            </FitWidth>
          ) : (
            <span key={i} className="block">
              {content(segments)}
            </span>
          ),
        )}
      </span>
    )
  }
  return (
    <div className={`space-y-2 ${className}`}>
      {paragraphs.map((segments, i) =>
        alone(segments) ? (
          <FitWidth key={i} min={0.6}>
            {content(segments)}
          </FitWidth>
        ) : (
          <p key={i}>{content(segments)}</p>
        ),
      )}
    </div>
  )
}

// Lange Formeln dürfen in sich umbrechen; nur kurze werden mit dem Satzzeichen zusammengehalten
const GLUE_MAX_LATEX = 60

// Satzzeichen direkt hinter der Formel an Stelle i, die bei ihr bleiben
function gluedPunctuation(segments: readonly Segment[], i: number): string {
  const [formula, next] = [segments[i], segments[i + 1]]
  if (formula?.kind !== 'math' || next?.kind !== 'text' || formula.latex.length > GLUE_MAX_LATEX) return ''
  return /^[.,:;!?)“]+/.exec(next.text)?.[0] ?? ''
}

// Öffnende Klammer oder Anführungszeichen direkt vor der Formel an Stelle i, die bei ihr bleiben
function gluedOpening(segments: readonly Segment[], i: number): string {
  const [previous, formula] = [segments[i - 1], segments[i]]
  if (formula?.kind !== 'math' || previous?.kind !== 'text' || formula.latex.length > GLUE_MAX_LATEX) return ''
  return /[(„]+$/.exec(previous.text)?.[0] ?? ''
}
