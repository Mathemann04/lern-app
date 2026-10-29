import { parseRichText } from '../engine/explain/richText.ts'
import { Formula } from './Formula.tsx'

// Text mit eingebetteten Formeln ($…$), ein Absatz pro Zeile.
// `inline`: ohne Absatz-Blöcke, für Überschriften und Knöpfe.
export function RichText({ text, className = '', inline = false }: { text: string; className?: string; inline?: boolean }) {
  const paragraphs = parseRichText(text)
  const content = (segments: (typeof paragraphs)[number]) =>
    segments.map((s, j) => (s.kind === 'math' ? <Formula key={j} tex={s.latex} /> : <span key={j}>{s.text}</span>))
  if (inline) {
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
