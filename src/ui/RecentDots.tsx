import { SUGGEST_WINDOW } from '../state/progress.ts'
import type { Attempt } from '../state/storage.ts'

// Die letzten Aufgaben als Punkte: grün ohne Fehler, gelb mit Fehlern, grau noch offen
export function RecentDots({ recent }: { recent: readonly Attempt[] }) {
  const clean = recent.filter((a) => a.clean).length
  return (
    <div className="flex gap-1.5" role="img" aria-label={`Letzte ${recent.length}: ${clean} ohne Fehler`}>
      {Array.from({ length: SUGGEST_WINDOW }, (_, i) => {
        const attempt = recent[i]
        const color = !attempt ? 'border border-zinc-300' : attempt.clean ? 'bg-green-600' : 'bg-amber-400'
        return <span key={i} className={`size-3 rounded-full ${color}`} />
      })}
    </div>
  )
}
