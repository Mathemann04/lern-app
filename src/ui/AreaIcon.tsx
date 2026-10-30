import { type ReactNode, useId } from 'react'
import type { AreaIcon as Kind } from './catalog.ts'

// Farbige Bilder für Gebiete und Themen, im Stil von Brilliant. Die Farben kommen aus der Tonleiter
// des Gebiets (tone-*, siehe data-tone in index.css), so passen sie in beide Designs.

const ART: Record<Kind, (id: string) => ReactNode> = {
  // Grundlagen: gestapelte Bausteine
  basics: () => (
    <>
      <Cube x={18.8} y={15} />
      <Cube x={18.8} y={3} />
      <Cube x={29.2} y={21} />
    </>
  ),
  // Differentialrechnung: Kurve mit Tangente
  derivative: () => (
    <>
      <Card />
      <path d="M17.7 36 35.6 20" className="stroke-tone-500" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M10 34Q28 34 38 12" className="stroke-tone-700" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <circle cx="27.4" cy="27.3" r="3.2" className="fill-white stroke-tone-700" strokeWidth="2.5" />
    </>
  ),
  // Ableiten: Parabel mit Tangente und Steigungsdreieck
  slope: () => (
    <>
      <Card />
      <path d="M28 31.5H37V23.9Z" className="fill-tone-300" />
      <path d="M28 31.5H37V23.9" className="stroke-tone-600" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M19.5 38.6 41 20.6" className="stroke-tone-500" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M8 20.3Q24 51.6 40 11.3" className="stroke-tone-700" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <circle cx="28" cy="31.5" r="2.8" className="fill-white stroke-tone-700" strokeWidth="2.2" />
    </>
  ),
  // Brüche: Kreis in Vierteln, ein Viertel herausgezogen
  fraction: () => (
    <>
      <Card />
      <path d="M25.5 23.5V11.5A12 12 0 1 1 13.5 23.5Z" className="fill-tone-500" />
      <path d="M25.5 23.5V11.5A12 12 0 0 1 37.5 23.5Z" className="fill-tone-400" />
      <path d="M25.5 23.5H37.5A12 12 0 0 1 25.5 35.5Z" className="fill-tone-600" />
      <path d="M22.5 20.5H10.5A12 12 0 0 1 22.5 8.5Z" className="fill-tone-700" />
    </>
  ),
  // Gleichungen umstellen: Waage im Gleichgewicht
  rearrange: () => (
    <>
      <path d="M24 13 18 39h12z" className="fill-tone-700" />
      <rect x="6" y="11" width="36" height="4" rx="2" className="fill-tone-600" />
      <path d="M5 27h14a7 5 0 0 1-14 0zM29 27h14a7 5 0 0 1-14 0z" className="fill-tone-300" />
      <path d="M12 15v12M36 15v12" className="stroke-tone-500" strokeWidth="1.5" />
      <rect x="8" y="20" width="8" height="7" rx="1.5" className="fill-tone-500" />
      <rect x="33" y="22" width="6" height="5" rx="1.5" className="fill-tone-400" />
      <circle cx="24" cy="13" r="3" className="fill-tone-800" />
    </>
  ),
  // Potenzen, Wurzeln, Logarithmen: Quadrate, die immer größer werden
  powers: () => (
    <>
      <rect x="4" y="34" width="6" height="6" rx="1.5" className="fill-tone-300" />
      <rect x="12" y="28" width="12" height="12" rx="2" className="fill-tone-500" />
      <rect x="26" y="22" width="18" height="18" rx="2.5" className="fill-tone-700" />
    </>
  ),
  // Integralrechnung: Fläche unter einer Kurve mit Rechteckstreifen
  integral: (id) => (
    <>
      <Card />
      <clipPath id={id}>
        <path d="M8 30Q22 6 40 22V36H8Z" />
      </clipPath>
      <g clipPath={`url(#${id})`}>
        <rect x="13" y="10" width="22" height="26" className="fill-tone-200" />
        <path d="M13.5 22.9h4.5V36h-4.5zM19 18h4.5v18H19zM24.5 15.8H29V36h-4.5zM30 16h4.5v20H30z" className="fill-tone-400" />
      </g>
      <path d="M8 36h32" className="stroke-tone-600" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M8 30Q22 6 40 22" className="stroke-tone-700" strokeWidth="3.5" strokeLinecap="round" fill="none" />
    </>
  ),
  // Formeln mit Einheiten: Messuhr
  units: () => (
    <>
      <rect x="5" y="33" width="38" height="8" rx="4" className="fill-tone-200" />
      <path d="M9.2 31A15 15 0 0 1 15.6 19.7" className="stroke-tone-300" strokeWidth="6" fill="none" />
      <path d="M18 18.1A15 15 0 0 1 30 18.1" className="stroke-tone-500" strokeWidth="6" fill="none" />
      <path d="M32.4 19.7A15 15 0 0 1 38.8 31" className="stroke-tone-700" strokeWidth="6" fill="none" />
      <path d="M24 32 31.7 22.8" className="stroke-tone-800" strokeWidth="3" strokeLinecap="round" />
      <circle cx="24" cy="32" r="3.5" className="fill-tone-800" />
    </>
  ),
  // Statik: Balken auf Fest- und Loslager mit Kraftpfeil
  statics: () => (
    <>
      <path d="M24 4v10" className="stroke-tone-600" strokeWidth="3" strokeLinecap="round" />
      <path d="M19 12.5h10L24 19z" className="fill-tone-600" />
      <rect x="5" y="20" width="38" height="7" rx="2" className="fill-tone-500" />
      <rect x="5" y="20" width="38" height="2.5" rx="1.25" className="fill-tone-300" />
      <path d="M12 27 7 36h10z" className="fill-tone-700" />
      <path d="M36 27 31.5 33.5h9z" className="fill-tone-700" />
      <circle cx="33.5" cy="35.2" r="1.7" className="fill-tone-700" />
      <circle cx="38.5" cy="35.2" r="1.7" className="fill-tone-700" />
      <rect x="4" y="37.5" width="16" height="2.5" rx="1.25" className="fill-tone-300" />
      <rect x="28" y="37.5" width="16" height="2.5" rx="1.25" className="fill-tone-300" />
    </>
  ),
}

// Würfel in Schrägansicht, (x, y) ist die obere Ecke
function Cube({ x, y }: { x: number; y: number }) {
  const dx = 10.4
  const dy = 6
  const s = 12
  return (
    <>
      <path d={`M${x} ${y}l${dx} ${dy}-${dx} ${dy}-${dx}-${dy}z`} className="fill-tone-300" />
      <path d={`M${x - dx} ${y + dy}l${dx} ${dy}v${s}l-${dx}-${dy}z`} className="fill-tone-500" />
      <path d={`M${x} ${y + 2 * dy}l${dx}-${dy}v${s}l-${dx} ${dy}z`} className="fill-tone-700" />
    </>
  )
}

// Karte mit Kante, auf der eine Kurve liegt
function Card() {
  return (
    <>
      <rect x="4" y="8" width="40" height="35" rx="7" className="fill-tone-300 dark:fill-tone-800" />
      <rect x="4" y="5" width="40" height="35" rx="7" className="fill-tone-100" />
    </>
  )
}

export function AreaIcon({ kind, className = 'size-12' }: { kind: Kind; className?: string }) {
  const id = useId()
  return (
    <svg aria-hidden viewBox="0 0 48 48" className={className}>
      {ART[kind](id)}
    </svg>
  )
}
