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
  // Vektoren: zwei Pfeile aneinandergehängt, gestrichelt der Summenpfeil
  vectors: () => (
    <>
      <Card />
      <path d="M11 33.5 34 12.5" className="stroke-tone-400" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="2.5 4.5" />
      <path d="M11 33.5 29 29" className="stroke-tone-700" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M31.5 28.4 25.7 25.6 26.9 32.2Z" className="fill-tone-700 stroke-tone-700" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M30.5 28 34.5 15.5" className="stroke-tone-500" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M35.3 12.6 31.2 17.6 37.5 18.6Z" className="fill-tone-500 stroke-tone-500" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="11" cy="33.5" r="2.6" className="fill-tone-800" />
    </>
  ),
  // Geraden und Ebenen (M7 Schritt 6): Ebenenstück, das eine Gerade durchstößt
  lines: () => (
    <>
      <Card />
      <path d="M9 30 21 23 39 25 27 33Z" className="fill-tone-300 stroke-tone-500" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M17 11 24 28" className="stroke-tone-700" strokeWidth="3" strokeLinecap="round" />
      <path d="M24 28 27 35" className="stroke-tone-700" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 3" />
      <circle cx="24" cy="28" r="2.4" className="fill-tone-800" />
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
  // Aufbau der Materie: Kern mit drei Elektronenbahnen (vereinfachtes Bild, wie es Chemiebücher zeigen)
  atom: () => (
    <>
      <ellipse cx="24" cy="24" rx="19" ry="7.5" className="stroke-tone-300" strokeWidth="2.5" fill="none" />
      <ellipse cx="24" cy="24" rx="19" ry="7.5" transform="rotate(60 24 24)" className="stroke-tone-400" strokeWidth="2.5" fill="none" />
      <ellipse cx="24" cy="24" rx="19" ry="7.5" transform="rotate(-60 24 24)" className="stroke-tone-500" strokeWidth="2.5" fill="none" />
      <circle cx="24" cy="24" r="5" className="fill-tone-700" />
      <circle cx="5" cy="24" r="2.8" className="fill-tone-600" />
      <circle cx="33.5" cy="40.5" r="2.8" className="fill-tone-600" />
      <circle cx="33.5" cy="7.5" r="2.8" className="fill-tone-600" />
    </>
  ),
  // Atombau: Atomkern aus Protonen (dunkel, mit Plus) und Neutronen (hell), dicht gepackt; der Rand in
  // der hellsten Stufe trennt gleichfarbige Teilchen
  nucleus: () => (
    <>
      {NUCLEONS.map(([x, y, proton]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r="7.2" className={`stroke-tone-100 ${proton ? 'fill-tone-700' : 'fill-tone-400'}`} strokeWidth="1.6" />
          {proton && <path d={`M${x - 2.6} ${y}h5.2M${x} ${y - 2.6}v5.2`} className="stroke-tone-50" strokeWidth="1.8" strokeLinecap="round" />}
        </g>
      ))}
    </>
  ),
  // Elektronen: Kästchen der Orbitale mit Pfeilen für die Elektronen wie beim Stickstoff (2s voll, in
  // den drei 2p-Kästchen je eines), die p-Kästchen eine Stufe höher
  orbitals: () => (
    <>
      <rect x="3" y="27" width="14" height="15" rx="2.5" className="fill-tone-200 stroke-tone-600" strokeWidth="2" />
      <rect x="18.5" y="8" width="27" height="15" rx="2.5" className="fill-tone-200 stroke-tone-600" strokeWidth="2" />
      <path d="M27.5 8v15M36.5 8v15" className="stroke-tone-600" strokeWidth="2" />
      {ORBITAL_ARROWS.map(([x, y, up]) => (
        <path
          key={`${x}-${y}`}
          d={up ? `M${x} ${y + 10}V${y}m-2.2 2.6L${x} ${y}l2.2 2.6` : `M${x} ${y}V${y + 10}m-2.2-2.6L${x} ${y + 10}l2.2-2.6`}
          className="stroke-tone-800"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      ))}
    </>
  ),
  // Periodensystem: Kästchen in der Form der Tabelle (s-, d- und p-Block)
  periodic: () => (
    <>
      {PERIODIC_CELLS.map(([column, row]) => (
        <rect
          key={`${column}-${row}`}
          x={3 + column * 7.5}
          y={9 + row * 7.5}
          width="6.5"
          height="6.5"
          rx="1.5"
          className={column < 2 ? 'fill-tone-700' : column === 2 ? 'fill-tone-300' : 'fill-tone-500'}
        />
      ))}
    </>
  ),
  // Chemische Bindung: gewinkeltes Molekül aus drei Atomen
  bond: () => (
    <>
      <path d="M24 19 12 34M24 19l12 15" className="stroke-tone-500" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="24" cy="17" r="9" className="fill-tone-700" />
      <circle cx="11" cy="35" r="6.5" className="fill-tone-400" />
      <circle cx="37" cy="35" r="6.5" className="fill-tone-400" />
      <circle cx="21" cy="14" r="2.5" className="fill-tone-500" />
    </>
  ),
  // Stöchiometrie: Erlenmeyerkolben mit Flüssigkeit
  flask: (id) => (
    <>
      <path d="M19 6h10v12.5l11.4 19.8A3.2 3.2 0 0 1 37.6 43H10.4a3.2 3.2 0 0 1-2.8-4.7L19 18.5z" className="fill-tone-200" />
      <clipPath id={id}>
        <path d="M19 6h10v12.5l11.4 19.8A3.2 3.2 0 0 1 37.6 43H10.4a3.2 3.2 0 0 1-2.8-4.7L19 18.5z" />
      </clipPath>
      <g clipPath={`url(#${id})`}>
        <rect x="4" y="29" width="40" height="16" className="fill-tone-500" />
        <circle cx="20" cy="36" r="2" className="fill-tone-300" />
        <circle cx="27" cy="33" r="1.5" className="fill-tone-300" />
      </g>
      <rect x="16.5" y="3.5" width="15" height="4.5" rx="2.25" className="fill-tone-700" />
    </>
  ),
  // Gleichgewicht: zwei halbe Pfeile in beide Richtungen
  equilibrium: () => (
    <>
      <Card />
      <path d="M10 18.5h27.5l-6.5-6" className="stroke-tone-700" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M38 27.5H10.5l6.5 6" className="stroke-tone-500" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),
  // Säuren und Basen: Tropfen über einer Farbskala
  ph: () => (
    <>
      <path d="M24 4C20.5 9 15 15.5 15 20.5a9 9 0 0 0 18 0C33 15.5 27.5 9 24 4z" className="fill-tone-500" />
      <rect x="5" y="34" width="7.6" height="8" rx="2" className="fill-tone-200" />
      <rect x="12.6" y="34" width="7.6" height="8" className="fill-tone-300" />
      <rect x="20.2" y="34" width="7.6" height="8" className="fill-tone-500" />
      <rect x="27.8" y="34" width="7.6" height="8" className="fill-tone-600" />
      <rect x="35.4" y="34" width="7.6" height="8" rx="2" className="fill-tone-800" />
    </>
  ),
  // Redox und Elektrochemie: Batterie mit Plus- und Minuspol
  redox: () => (
    <>
      <rect x="4" y="13" width="36" height="22" rx="5" className="fill-tone-700" />
      <rect x="7.5" y="16.5" width="29" height="15" rx="2.5" className="fill-tone-100" />
      <rect x="10.5" y="19.5" width="7" height="9" rx="1.5" className="fill-tone-500" />
      <rect x="19.5" y="19.5" width="7" height="9" rx="1.5" className="fill-tone-500" />
      <rect x="40" y="19" width="4.5" height="10" rx="1.5" className="fill-tone-700" />
      <path d="M31 21v6M28 24h6" className="stroke-tone-700" strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
  // Themen mischen: zwei Kärtchen übereinander, das vordere eine Liste mit Kästchen, zwei davon
  // angekreuzt
  mix: () => (
    <>
      <rect x="3.5" y="9" width="29" height="34" rx="5" transform="rotate(-11 18 26)" className="fill-tone-400" />
      <rect x="15" y="8" width="29" height="34" rx="5" className="fill-tone-300 dark:fill-tone-800" />
      <rect x="14" y="5" width="29" height="34" rx="5" className="fill-tone-100" />
      {MIX_ROWS.map(([y, checked]) => (
        <g key={y}>
          {checked ? (
            <>
              <rect x="18.5" y={y} width="7" height="7" rx="1.8" className="fill-tone-700" />
              <path d={`M20.2 ${y + 3.6}l1.6 1.6 2.9-3.2`} className="stroke-tone-50" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </>
          ) : (
            <rect x="19.2" y={y + 0.7} width="5.6" height="5.6" rx="1.4" className="stroke-tone-500" strokeWidth="1.4" fill="none" />
          )}
          <rect x="28.5" y={y + 2.2} width="10" height="2.6" rx="1.3" className={checked ? 'fill-tone-500' : 'fill-tone-300'} />
        </g>
      ))}
    </>
  ),
  // Probeklausur: Blatt mit Aufgabenzeilen, unten rechts eine Uhr
  exam: () => (
    <>
      <rect x="7" y="7" width="28" height="36" rx="4" className="fill-tone-300 dark:fill-tone-800" />
      <rect x="6" y="4" width="28" height="36" rx="4" className="fill-tone-100" />
      <rect x="11" y="10" width="14" height="3" rx="1.5" className="fill-tone-700" />
      <rect x="11" y="17" width="18" height="2.6" rx="1.3" className="fill-tone-400" />
      <rect x="11" y="23" width="12" height="2.6" rx="1.3" className="fill-tone-400" />
      <rect x="11" y="29" width="8" height="2.6" rx="1.3" className="fill-tone-400" />
      <circle cx="34" cy="33" r="10" className="fill-tone-500" />
      <circle cx="34" cy="33" r="7.5" className="fill-tone-50" />
      <path d="M34 28.5V33l3 2" className="stroke-tone-700" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),
  // Werkstoffkunde: Ausschnitt eines Kristallgitters (3 × 3 Atome mit Bindungen)
  material: () => (
    <>
      <Card />
      <path d="M13 13H35M13 22.5H35M13 32H35M13 13V32M24 13V32M35 13V32" className="stroke-tone-400" strokeWidth="2" />
      {[13, 24, 35].flatMap((x) =>
        [13, 22.5, 32].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="4" className={x === 24 && y === 22.5 ? 'fill-tone-500' : 'fill-tone-700'} />),
      )}
    </>
  ),
}

// Zeilen der Liste im Bild „Themen mischen" als (y, angekreuzt?)
const MIX_ROWS: ReadonlyArray<readonly [number, boolean]> = [
  [10, true],
  [18.5, false],
  [27, true],
]

// Kästchen des Periodensystems als (Spalte, Zeile): zwei Spalten links (s-Block), eine Spalte als
// Andeutung der Nebengruppen (d-Block), drei Spalten rechts (p-Block)
const PERIODIC_CELLS: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [5, 0],
  [0, 1],
  [1, 1],
  [3, 1],
  [4, 1],
  [5, 1],
  ...[0, 1, 2, 3, 4, 5].flatMap((column) => [[column, 2] as const, [column, 3] as const]),
]

// Kernteilchen als (x, y, Proton?): eins in der Mitte, sechs im Kreis darum; von hinten (oben) nach
// vorn (unten) gezeichnet, so liegen die unteren leicht über den oberen
const NUCLEONS: ReadonlyArray<readonly [number, number, boolean]> = [
  [18, 13.6, false],
  [30, 13.6, true],
  [12, 24, true],
  [24, 24, true],
  [36, 24, false],
  [18, 34.4, false],
  [30, 34.4, true],
]

// Pfeile der Elektronen als (x, oberes Ende, nach oben?): ↑↓ im s-Kästchen, je ↑ in den p-Kästchen
const ORBITAL_ARROWS: ReadonlyArray<readonly [number, number, boolean]> = [
  [7.9, 29.5, true],
  [12.1, 29.5, false],
  [23, 10.5, true],
  [32, 10.5, true],
  [41, 10.5, true],
]

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
