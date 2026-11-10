import { elementBySymbol } from './elements.ts'

// Summenformeln lesen (Plan M4, Teil B „Chemie-Engine", formula.ts): „H2SO4", „Ca(OH)2",
// „(NH4)2SO4", „CuSO4*5H2O" (Kristallwasser mit Stern). Ausgabe als mhchem-Formel und als Zahl der
// Atome je Element, auch so, wie typische Fehler zählen (Index vergessen, Klammer nicht malgenommen,
// Kristallwasser vergessen). Ladungen und Zustände kommen mit S3b (Reaktionsgleichungen).

export type Unit =
  | { readonly kind: 'element'; readonly symbol: string; readonly count: number }
  | { readonly kind: 'group'; readonly units: readonly Unit[]; readonly count: number }

export type Formula = {
  // Formel ohne Kristallwasser
  readonly units: readonly Unit[]
  // Kristallwasser (bzw. allgemein Teile hinter „·"), je mit Anzahl davor
  readonly adducts: readonly { readonly count: number; readonly units: readonly Unit[] }[]
}

export class FormulaError extends Error {}

// Liest eine Formel; wirft FormulaError mit verständlicher Meldung
export function parseFormula(text: string): Formula {
  const source = text.replace(/\s+/g, '')
  let pos = 0

  const number = (): number | null => {
    const match = /^\d+/.exec(source.slice(pos))
    if (!match) return null
    pos += match[0].length
    return Number(match[0])
  }

  const units = (closing: string | null): Unit[] => {
    const list: Unit[] = []
    while (pos < source.length) {
      const c = source[pos]
      if (c === ')' || c === '*') break
      if (c === '(') {
        pos++
        const inner = units(')')
        if (source[pos] !== ')') throw new FormulaError('Zu jeder öffnenden Klammer gehört eine schließende.')
        pos++
        if (inner.length === 0) throw new FormulaError('In einer Klammer muss etwas stehen.')
        list.push({ kind: 'group', units: inner, count: number() ?? 1 })
        continue
      }
      const match = /^[A-Z][a-z]?/.exec(source.slice(pos))
      if (!match) throw new FormulaError(/^[a-z]/.test(c) ? 'Elementsymbole beginnen mit einem Großbuchstaben.' : `Das Zeichen „${c}" gehört nicht in eine Summenformel.`)
      if (!elementBySymbol(match[0])) throw new FormulaError(`Das Element „${match[0]}" gibt es nicht.`)
      pos += match[0].length
      const count = number() ?? 1
      if (count === 0) throw new FormulaError('Ein Index ist nie 0.')
      list.push({ kind: 'element', symbol: match[0], count })
    }
    if (closing === null && source[pos] === ')') throw new FormulaError('Zu jeder schließenden Klammer gehört eine öffnende.')
    return list
  }

  const main = units(null)
  if (main.length === 0) throw new FormulaError('Die Formel ist leer.')
  const adducts: { count: number; units: Unit[] }[] = []
  while (source[pos] === '*') {
    pos++
    const count = number() ?? 1
    const part = units(null)
    if (part.length === 0) throw new FormulaError('Hinter dem Malpunkt fehlt ein Stoff.')
    adducts.push({ count, units: part })
  }
  if (pos < source.length) throw new FormulaError(`Das Zeichen „${source[pos]}" gehört nicht in eine Summenformel.`)
  return { units: main, adducts }
}

// Wie gezählt wird; ohne Angabe richtig
export type CountMode = {
  // jeden Index als 1 lesen (auch an Klammern): „Index vergessen", „Atom statt Molekül"
  readonly ignoreIndices?: boolean
  // Index hinter einer Klammer nur auf das letzte Atom darin beziehen: „Klammer nicht malgenommen"
  readonly bracketOnLast?: boolean
  // Kristallwasser weglassen
  readonly withoutAdducts?: boolean
}

// Atome je Element in der Reihenfolge des ersten Auftretens
export function atomCounts(formula: Formula, mode: CountMode = {}): Map<string, number> {
  const counts = new Map<string, number>()
  const add = (symbol: string, n: number) => counts.set(symbol, (counts.get(symbol) ?? 0) + n)
  const walk = (list: readonly Unit[], factor: number) => {
    for (const unit of list) {
      const count = mode.ignoreIndices ? 1 : unit.count
      if (unit.kind === 'element') add(unit.symbol, factor * count)
      else if (mode.bracketOnLast && !mode.ignoreIndices) {
        // die Klammer einmal, nur das letzte Element darin mit dem Index
        walk(unit.units.slice(0, -1), factor)
        walk(
          unit.units.slice(-1).map((u) => ({ ...u, count: u.count * count })),
          factor,
        )
      } else walk(unit.units, factor * count)
    }
  }
  walk(formula.units, 1)
  if (!mode.withoutAdducts) for (const adduct of formula.adducts) walk(adduct.units, mode.ignoreIndices ? 1 : adduct.count)
  return counts
}

// mhchem-Inhalt (ohne \ce{…}): Ca(OH)2, CuSO4 * 5 H2O
function ceUnits(list: readonly Unit[]): string {
  return list.map((u) => (u.kind === 'element' ? u.symbol : `(${ceUnits(u.units)})`) + (u.count === 1 ? '' : String(u.count))).join('')
}

export function formulaCe(formula: Formula): string {
  const main = ceUnits(formula.units)
  const adducts = formula.adducts.map((a) => ` * ${a.count === 1 ? '' : `${a.count} `}${ceUnits(a.units)}`).join('')
  return main + adducts
}

// Formel als LaTeX für Texte: $\ce{…}$ ohne Dollarzeichen
export const formulaLatex = (formula: Formula) => String.raw`\ce{${formulaCe(formula)}}`

// Hat die Formel eine Klammer mit Index größer 1?
export const hasBracket = (formula: Formula): boolean => {
  const any = (list: readonly Unit[]): boolean => list.some((u) => u.kind === 'group' && (u.count > 1 || any(u.units)))
  return any(formula.units) || formula.adducts.some((a) => any(a.units))
}
