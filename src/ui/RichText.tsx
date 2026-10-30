import { type Segment, parseRichText } from '../engine/explain/richText.ts'
import { Formula } from './Formula.tsx'

// Text mit eingebetteten Formeln ($…$), ein Absatz pro Zeile.
// `inline`: ohne Absatz-Blöcke, für Überschriften, Knöpfe und mitten im Satz (ein einzelner Absatz
// bleibt in der Zeile, mehrere stehen untereinander).
export function RichText({ text, className = '', inline = false }: { text: string; className?: string; inline?: boolean }) {
  const paragraphs = parseRichText(text)
  const content = (segments: (typeof paragraphs)[number]) =>
    segments.map((s, j) => {
      if (s.kind === 'text') {
        // Satzzeichen direkt nach einer Formel stehen schon bei der Formel (siehe unten)
        const glued = j > 0 ? gluedPunctuation(segments, j - 1) : ''
        return <span key={j}>{s.text.slice(glued.length)}</span>
      }
      const punctuation = gluedPunctuation(segments, j)
      if (!punctuation) return <Formula key={j} tex={s.latex} />
      // Kurze Formel und Satzzeichen bleiben zusammen, sonst steht etwa „?" allein in der nächsten Zeile
      return (
        <span key={j} className="whitespace-nowrap">
          <Formula tex={s.latex} />
          {punctuation}
        </span>
      )
    })
  if (inline) {
    if (paragraphs.length === 1) return <span className={className}>{content(paragraphs[0])}</span>
    return (
      <span className={className}>
        {paragraphs.map((segments, i) => (
          <span key={i} className="block">
            {content(segments)}
          </span>
        ))}
      </span>
    )
  }
  return (
    <div className={`space-y-2 ${className}`}>
      {paragraphs.map((segments, i) => (
        <p key={i}>{content(segments)}</p>
      ))}
    </div>
  )
}

// Lange Formeln dürfen in sich umbrechen; nur kurze werden mit dem Satzzeichen zusammengehalten
const GLUE_MAX_LATEX = 60

// Satzzeichen direkt hinter der Formel an Stelle i, die bei ihr bleiben
function gluedPunctuation(segments: readonly Segment[], i: number): string {
  const [formula, next] = [segments[i], segments[i + 1]]
  if (formula?.kind !== 'math' || next?.kind !== 'text' || formula.latex.length > GLUE_MAX_LATEX) return ''
  return /^[.,:;!?)]+/.exec(next.text)?.[0] ?? ''
}
