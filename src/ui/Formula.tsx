import { useMemo } from 'react'
import { renderFormula } from './renderFormula.ts'

type Props = {
  tex: string
  display?: boolean
  className?: string
}

// Eine gesetzte Formel. Alle Formeln der App laufen über diese Komponente.
export function Formula({ tex, display = false, className }: Props) {
  const html = useMemo(() => {
    try {
      return renderFormula(tex, display)
    } catch (error) {
      console.error('Formel konnte nicht gesetzt werden:', tex, error)
      return null
    }
  }, [tex, display])

  if (html === null) {
    return <code className="text-red-700">{tex}</code>
  }
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
}
