import { type Element, ELEMENTS, elementByZ } from './elements.ts'

// Elektronenkonfiguration (Plan M4, Thema 1.2; docs/CHEMIE.md §3 und §6): Besetzung nach der
// Besetzungsreihenfolge (Energieleiter 1s 2s 2p 3s 3p 4s 3d 4p …), Ausnahmen aus dem Tabellenwerk, Ionen,
// Edelgaskern und Kästchenschreibweise. Reines Rechnen, keine Texte für Aufgaben.
//
// Quelle der Ausnahmen (abgerufen 11.11.2026): NIST Atomic Spectra Database, Grundzustände der Atome. In
// Aufgaben kommen nur Cr und Cu vor (ab Vertiefung); Pd und Ag nur als Wissensfrage; Nb, Mo, Ru, Rh, Pt und
// Au stehen nur als Daten hier.

// Unterschale: Hauptquantenzahl n und Nebenquantenzahl l (0 = s, 1 = p, 2 = d, 3 = f)
export type Subshell = { readonly n: number; readonly l: number }
// besetzte Unterschale
export type Occupied = Subshell & { readonly count: number }
// Konfiguration: besetzte Unterschalen in der Besetzungsreihenfolge
export type Config = readonly Occupied[]

export const LETTERS = ['s', 'p', 'd', 'f'] as const
export const subshellName = (s: Subshell) => `${s.n}${LETTERS[s.l]}`
// Plätze einer Unterschale: 2 · (2l + 1)
export const capacity = (l: number) => 2 * (2 * l + 1)
// Orbitale einer Unterschale: 2l + 1
export const orbitalsOf = (l: number) => 2 * l + 1

// Besetzungsreihenfolge bis 6p (reicht für alle Elemente der Tabelle, auch Pt, Au, Hg, Pb, Bi)
export const AUFBAU: readonly Subshell[] = [
  [1, 0],
  [2, 0],
  [2, 1],
  [3, 0],
  [3, 1],
  [4, 0],
  [3, 2],
  [4, 1],
  [5, 0],
  [4, 2],
  [5, 1],
  [6, 0],
  [4, 3],
  [5, 2],
  [6, 1],
].map(([n, l]) => ({ n, l }))

const orderIndex = (s: Subshell) => AUFBAU.findIndex((a) => a.n === s.n && a.l === s.l)
const sameShell = (a: Subshell, b: Subshell) => a.n === b.n && a.l === b.l

// Unterschalen nach einer Reihenfolge auffüllen; order: z. B. mit 3d vor 4s für den typischen Fehler
export function fill(electrons: number, order: readonly Subshell[] = AUFBAU): Config {
  const result: Occupied[] = []
  let left = electrons
  for (const s of order) {
    if (left <= 0) break
    const count = Math.min(left, capacity(s.l))
    result.push({ ...s, count })
    left -= count
  }
  if (left > 0) throw new Error(`Zu viele Elektronen: ${electrons}`)
  return sorted(result)
}

// in die Besetzungsreihenfolge bringen, leere Unterschalen weg
export const sorted = (config: readonly Occupied[]): Config => config.filter((o) => o.count > 0).sort((a, b) => orderIndex(a) - orderIndex(b))

// Ausnahmen: ein (bei Pd zwei) Elektron(en) aus dem äußersten s in die d-Unterschale darunter
export const EXCEPTIONS: Readonly<Record<string, number>> = { Cr: 1, Cu: 1, Nb: 1, Mo: 1, Ru: 1, Rh: 1, Pd: 2, Ag: 1, Pt: 1, Au: 1 }
// Ausnahmen, die in Aufgaben vorkommen dürfen (docs/CHEMIE.md §6)
export const TASK_EXCEPTIONS = ['Cr', 'Cu'] as const

// Konfiguration nach der Regel, ohne Ausnahme
export const regularConfig = (z: number): Config => fill(z)

// Grundzustand des Atoms (mit Ausnahmen)
export function atomConfig(z: number): Config {
  const el = elementByZ(z)
  const regular = fill(z)
  const moved = el ? EXCEPTIONS[el.symbol] : undefined
  if (!moved) return regular
  const s = regular.filter((o) => o.l === 0).at(-1)!
  return sorted(regular.map((o) => (sameShell(o, s) ? { ...o, count: o.count - moved } : o.l === 2 && o.n === s.n - 1 ? { ...o, count: o.count + moved } : o)))
}

// Elektronen abgeben: zuerst aus der Schale mit dem größten n, darin aus dem größten l (bei Fe²⁺ also 4s vor 3d)
export function removeOuter(config: Config, k: number): Config {
  const result = config.map((o) => ({ ...o }))
  for (let i = 0; i < k; i++) {
    const target = result.filter((o) => o.count > 0).sort((a, b) => b.n - a.n || b.l - a.l)[0]
    if (!target) throw new Error('Keine Elektronen mehr')
    target.count--
  }
  return sorted(result)
}

// Elektronen abgeben in umgekehrter Besetzungsreihenfolge (typischer Fehler: bei Fe²⁺ erst 3d geleert)
export function removeLast(config: Config, k: number): Config {
  const result = config.map((o) => ({ ...o }))
  for (let i = 0; i < k; i++) {
    const target = result.filter((o) => o.count > 0).sort((a, b) => orderIndex(b) - orderIndex(a))[0]
    target.count--
  }
  return sorted(result)
}

// Konfiguration eines Teilchens mit Ladung q (Kationen geben die äußersten Elektronen ab, Anionen füllen weiter auf)
export function ionConfig(z: number, q: number): Config {
  if (q > 0) return removeOuter(atomConfig(z), q)
  if (q < 0) return fill(z - q)
  return atomConfig(z)
}

export const electronCount = (config: Config) => config.reduce((sum, o) => sum + o.count, 0)

// Edelgase für die Schreibweise mit Edelgaskern
export const NOBLE_GASES = [
  { symbol: 'He', z: 2 },
  { symbol: 'Ne', z: 10 },
  { symbol: 'Ar', z: 18 },
  { symbol: 'Kr', z: 36 },
  { symbol: 'Xe', z: 54 },
] as const

// Edelgaskern: das größte Edelgas mit weniger Elektronen als das Teilchen, dessen Unterschalen alle voll
// besetzt sind (bei Na⁺ mit 10 Elektronen also [He] 2s² 2p⁶); null, wenn keins passt
export function coreOf(config: Config): (typeof NOBLE_GASES)[number] | null {
  const total = electronCount(config)
  for (const gas of [...NOBLE_GASES].reverse()) {
    if (gas.z >= total) continue
    if (fill(gas.z).every((g) => config.some((o) => sameShell(o, g) && o.count === g.count))) return gas
  }
  return null
}

// Unterschalen außerhalb des Kerns (in der Besetzungsreihenfolge)
export function outsideCore(config: Config, core: { z: number } | null): Config {
  if (!core) return config
  const inner = fill(core.z)
  return config.filter((o) => !inner.some((g) => sameShell(o, g) && o.count === g.count))
}

// LaTeX einer Unterschale mit Hochzahl, z. B. „3\mathrm{d}^{6}"
export const occupiedLatex = (o: Occupied) => `${o.n}\\mathrm{${LETTERS[o.l]}}^{${o.count}}`
export const subshellLatex = (s: Subshell) => `${s.n}\\mathrm{${LETTERS[s.l]}}`

// Schreibweise: ausführlich (1s² 2s² 2p⁶ …) oder mit Edelgaskern ([Ar] 4s² 3d⁶); core: Kern, sonst der passende
export function configLatex(config: Config, withCore: boolean, core = withCore ? coreOf(config) : null): string {
  const parts = outsideCore(config, core).map(occupiedLatex)
  const head = core ? `[\\mathrm{${core.symbol}}]` : ''
  if (parts.length === 0) return head
  return [head, ...parts].filter(Boolean).join('\\,')
}

// Schlüssel zum Vergleichen (gleiche Besetzung, egal in welcher Reihenfolge geschrieben)
export const configKey = (config: Config) =>
  [...config]
    .filter((o) => o.count > 0)
    .sort((a, b) => a.n - b.n || a.l - b.l)
    .map((o) => `${o.n}${LETTERS[o.l]}${o.count}`)
    .join(' ')

// --- Kästchenschreibweise ---

// Inhalt eines Kästchens: leer, ↑, ↓, ↑↓ und (falsch, Pauli verletzt) ↑↑
export type Box = '0' | 'u' | 'd' | '2' | 'x'
export type BoxRow = { readonly shell: Subshell; readonly boxes: readonly Box[] }

// Hund'sche Regel: erst jedes Orbital einfach (alle Spins gleich), dann paaren
export function hundBoxes(l: number, count: number): Box[] {
  const k = orbitalsOf(l)
  return Array.from({ length: k }, (_, i) => (count >= k + i + 1 ? '2' : count > i ? 'u' : '0'))
}

// typischer Fehler: erst paaren, dann das nächste Orbital
export function pairedFirstBoxes(l: number, count: number): Box[] {
  const k = orbitalsOf(l)
  return Array.from({ length: k }, (_, i) => (count >= 2 * i + 2 ? '2' : count === 2 * i + 1 ? 'u' : '0'))
}

// ungepaarte Elektronen in einer Zeile von Kästchen
export const unpairedIn = (boxes: readonly Box[]) => boxes.filter((b) => b === 'u' || b === 'd').length
export const unpairedOf = (config: Config) => config.reduce((sum, o) => sum + unpairedIn(hundBoxes(o.l, o.count)), 0)

// Kästchen für eine Konfiguration: Unterschalen shells (gezeigt auch, wenn leer), nach Hund besetzt
export const boxRows = (config: Config, shells: readonly Subshell[]): BoxRow[] =>
  shells.map((shell) => ({ shell, boxes: hundBoxes(shell.l, config.find((o) => sameShell(o, shell))?.count ?? 0) }))

// Id des Bildes: „kaestchen:Ar/4s=2 3d=2uuuu" (Kern leer für ohne Kern)
export const boxFigureId = (core: string, rows: readonly BoxRow[]) => `kaestchen:${core}/${rows.map((r) => `${subshellName(r.shell)}=${r.boxes.join('')}`).join(' ')}`

export function parseBoxFigureId(id: string): { core: string; rows: BoxRow[] } | null {
  const match = /^kaestchen:([A-Za-z]*)\/(.+)$/.exec(id)
  if (!match) return null
  const rows: BoxRow[] = []
  for (const part of match[2].split(' ')) {
    const m = /^(\d)([spdf])=([0ud2x]+)$/.exec(part)
    if (!m) return null
    const l = LETTERS.indexOf(m[2] as (typeof LETTERS)[number])
    if (m[3].length !== orbitalsOf(l)) return null
    rows.push({ shell: { n: Number(m[1]), l }, boxes: [...m[3]] as Box[] })
  }
  return { core: match[1], rows }
}

// Beschreibung in Worten (für Vorlesehilfen und als Text der Antwort)
const BOX_WORDS: Readonly<Record<Box, string>> = { '0': 'leer', u: '↑', d: '↓', '2': '↑↓', x: '↑↑' }
export const boxRowsText = (core: string, rows: readonly BoxRow[]) =>
  `${core ? `[${core}] ` : ''}${rows.map((r) => `${subshellName(r.shell)}: ${r.boxes.map((b) => BOX_WORDS[b]).join(' ')}`).join('; ')}`

// --- Valenzelektronen (Hauptgruppen) ---

// Hauptgruppe (1, 2, 13 bis 18) und Periode eines Elements; null bei Nebengruppen
export function mainGroupOf(el: Element): { group: number; period: number } | null {
  const config = atomConfig(el.z)
  const period = Math.max(...config.map((o) => o.n))
  const outer = config.filter((o) => o.n === period && o.l <= 1)
  const lastShell = config.at(-1)!
  // Nebengruppen: die zuletzt besetzte Unterschale ist d oder f (Zn, Cd, Hg zählen als Nebengruppe 12)
  if (lastShell.l >= 2 || (EXCEPTIONS[el.symbol] ?? 0) > 0) return null
  if (el.z === 2) return { group: 18, period: 1 }
  const s = outer.find((o) => o.l === 0)?.count ?? 0
  const p = outer.find((o) => o.l === 1)?.count ?? 0
  return { group: p === 0 ? s : 10 + s + p, period }
}

// Valenzelektronen eines Hauptgruppenelements (He: 2, sonst Gruppe 1, 2 bzw. Gruppe − 10)
export const valenceCount = (group: number) => (group <= 2 ? group : group - 10)

// Valenzkonfiguration eines Hauptgruppenelements: ns und np der äußersten Schale
export function valenceConfig(el: Element): Config {
  const mg = mainGroupOf(el)
  if (!mg) throw new Error(`${el.symbol} ist kein Hauptgruppenelement`)
  return atomConfig(el.z).filter((o) => o.n === mg.period && o.l <= 1)
}

// Hauptgruppenelemente der Tabelle (ohne H und He)
export const MAIN_GROUP: readonly Element[] = ELEMENTS.filter((el) => el.z > 2 && mainGroupOf(el) !== null)
