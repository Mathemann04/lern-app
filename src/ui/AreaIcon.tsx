import type { ReactNode } from 'react'
import type { AreaIcon as Kind } from './catalog.ts'

// Kleines Bild je Gebiet, im Stil der Menü-Symbole (Linien, 24 × 24)
const PATHS: Record<Kind, ReactNode> = {
  // Geteilt-Zeichen
  basics: (
    <>
      <path d="M5 12h14" />
      <circle cx="12" cy="6.5" r="1.4" fill="currentColor" />
      <circle cx="12" cy="17.5" r="1.4" fill="currentColor" />
    </>
  ),
  // Kurve mit Tangente
  derivative: (
    <>
      <path d="M3 4Q12 28 21 4" />
      <path d="M11 20.3 21.5 6.3" strokeOpacity="0.55" />
      <circle cx="16.5" cy="13" r="1.6" fill="currentColor" />
    </>
  ),
  // Fläche unter einer Kurve
  integral: (
    <>
      <path d="M3 20h18" />
      <path d="M6 20v-7c2.5-4 6-6.5 13-7v14" />
      <path d="M9 20v-9.3M12.5 20V8.4M16 20V6.6" strokeOpacity="0.45" />
    </>
  ),
  // Messuhr
  units: (
    <>
      <path d="M4 17a8 8 0 1 1 16 0" />
      <path d="M12 17l4-5" />
      <path d="M3 20h18" />
    </>
  ),
  // Balken auf zwei Lagern mit Kraftpfeil
  statics: (
    <>
      <path d="M3 12h18" />
      <path d="M6 12l-2.5 4h5zM18 12l-2.5 4h5z" />
      <path d="M2.5 19h7M14.5 19h7" />
      <path d="M12 3v6M9.5 6.5 12 9l2.5-2.5" />
    </>
  ),
}

export function AreaIcon({ kind, className = 'size-7' }: { kind: Kind; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {PATHS[kind]}
    </svg>
  )
}
