import type { NamedError } from '../engine/errorCatalog.ts'
import { FitWidth } from './FitWidth.tsx'
import { Formula } from './Formula.tsx'
import { RichText } from './RichText.tsx'

// „So sieht der Fehler aus:" mit dem Fehler als Formel (Mathe) oder als falsche Aussage (Denkfehler
// bei Wissensfragen)
export function ErrorShape({ error }: { error: NamedError }) {
  if (error.wrongFormula === undefined && error.wrongText === undefined) return null
  return (
    <div className="text-zinc-700">
      <span className="text-sm text-zinc-500">So sieht der Fehler aus:</span>
      {error.wrongFormula !== undefined ? (
        <FitWidth>
          <Formula tex={error.wrongFormula} />
        </FitWidth>
      ) : (
        <RichText text={`„${error.wrongText}“`} className="mt-1 italic" />
      )}
    </div>
  )
}
