import type { GuidedStep } from '../../guided/types.ts'
import type { Rng } from '../../random/rng.ts'
import { ONE, type Rational, rat, ratDiv, ratMul, ratSub, ratAdd } from '../../rational.ts'
import type { Level, TaskRef } from '../../tasks/taskNumber.ts'
import {
  type Equation,
  type Species,
  balance,
  coefficientCe,
  coefficientsOf,
  equationLatex,
  isBalanced,
  sideCounts,
  skeleton,
  termsLatex,
  withCoefficients,
} from '../equation.ts'
import { type Formula, atomCounts, formulaCe } from '../formula.ts'
import { CO, CO2, FUELS, type Fuel, H2O, O2, REACTIONS } from '../reactions.ts'
import { elementBySymbol } from '../elements.ts'
import { type ChemCalc, type ChemGenerator, type WrongValue, stepChoices } from './shared.ts'

// Rechnung „Ausgleichen" (Plan M4, Thema 4.1). Die Engine gleicht über die Atombilanz aus
// (equation.ts); jede falsche Antwort ist eine Gleichung, die ein typischer Fehler ergibt, und nie eine
// richtig ausgeglichene Gleichung derselben Reaktion (auch nicht mit Vielfachen oder Brüchen).
// - Grundlagen und Vertiefung: Welche Gleichung gleicht die Reaktion richtig aus? Dann die Probe: Wie viele
//   Atome eines Elements stehen auf jeder Seite?
// - Verbrennungen (in den Grundlagen Methan, Propan und Ethanol ohne Bruch, ab Vertiefung weitere Alkane und
//   Alkohole, auf Klausurniveau bis Decan und Pentanol): Kohlenstoff und Wasserstoff → Sauerstoff → ganzzahlig machen, wie in der Klausur.

const CARD_BALANCE = 'gleichungen-ausgleichen'
const CARD_READ = 'gleichungen-lesen'
const CARD_DIATOMIC = 'gleichungen-zweiatomig'
const CARD_COMBUSTION = 'gleichungen-verbrennung'

const DIATOMIC = new Set(['H2', 'O2', 'N2', 'F2', 'Cl2', 'Br2', 'I2'])

const eqWrong = (rule: string, eq: Equation): WrongValue => ({ rule, key: equationLatex(eq), content: `$${equationLatex(eq)}$` })
const eqCorrect = (eq: Equation) => ({ key: equationLatex(eq), content: `$${equationLatex(eq)}$` })

// Ist die Gleichung ein Vielfaches der richtigen (gleiche Stoffe, Koeffizienten im selben Verhältnis)?
function isMultiple(eq: Equation, correct: Equation): boolean {
  const a = coefficientsOf(eq)
  const b = coefficientsOf(correct)
  if (a.length !== b.length || equationLatex(skeleton(eq.reactants.map((t) => t.species), eq.products.map((t) => t.species))) !== equationLatex(skeleton(correct.reactants.map((t) => t.species), correct.products.map((t) => t.species)))) return false
  const ratio = ratDiv(a[0], b[0])
  return a.every((x, i) => {
    const r = ratDiv(x, b[i])
    return r.n === ratio.n && r.d === ratio.d
  })
}

// --- Fehler beim Ausgleichen ---

// Formel mit geändertem Index eines Elements (nur Formeln ohne Klammern)
function changeIndex(formula: Formula, symbol: string, delta: number): Formula | null {
  if (formula.adducts.length > 0 || formula.units.some((u) => u.kind === 'group')) return null
  let done = false
  const units = formula.units.map((u) => {
    if (done || u.kind !== 'element' || u.symbol !== symbol) return u
    done = true
    return { ...u, count: u.count + delta }
  })
  return done && units.every((u) => u.count > 0) ? { units, adducts: [] } : null
}

// „Index statt Koeffizient geändert": alle Koeffizienten 1, Indizes so verändert, dass die Atome passen
export function indexChanged(reaction: { reactants: readonly Species[]; products: readonly Species[] }): Equation | null {
  const reactants = [...reaction.reactants]
  const products = [...reaction.products]
  const symbols = [...new Set([...reactants, ...products].flatMap((s) => [...atomCounts(s.formula).keys()]))]
  let changed = false
  for (const symbol of symbols) {
    const left = reactants.reduce((n, s) => n + (atomCounts(s.formula).get(symbol) ?? 0), 0)
    const right = products.reduce((n, s) => n + (atomCounts(s.formula).get(symbol) ?? 0), 0)
    if (left === right) continue
    // auf der Seite mit weniger Atomen die erste Verbindung (kein reines Element) mit dem Element ändern
    const side = left < right ? reactants : products
    const index = side.findIndex((s) => atomCounts(s.formula).has(symbol) && atomCounts(s.formula).size > 1)
    if (index === -1) return null
    const formula = changeIndex(side[index].formula, symbol, Math.abs(left - right))
    if (!formula) return null
    side[index] = { text: formulaCe(formula).replace(/\s/g, ''), formula }
    changed = true
  }
  const eq = skeleton(reactants, products)
  return changed && isBalanced(eq) ? eq : null
}

// „Einzelatom statt X₂": ein zweiatomiges Element als einzelnes Atom, damit ausgeglichen
export function singleAtom(reaction: { reactants: readonly Species[]; products: readonly Species[] }, rng: Rng): Equation | null {
  const candidates = [...reaction.reactants, ...reaction.products].filter((s) => DIATOMIC.has(s.text))
  if (candidates.length === 0) return null
  const target = rng.pick(candidates)
  const symbol = target.text.replace(/2$/, '')
  const single: Species = { text: symbol, formula: { units: [{ kind: 'element', symbol, count: 1 }], adducts: [] } }
  const swap = (list: readonly Species[]) => list.map((s) => (s === target ? single : s))
  return balance(swap(reaction.reactants), swap(reaction.products))
}

// „Nur teilweise ausgeglichen": ein Koeffizient größer 1 wieder auf 1 (das Element davor stimmt nicht mehr)
export function partly(correct: Equation, rng: Rng): Equation | null {
  const coefficients = coefficientsOf(correct)
  const options = coefficients.map((c, i) => ({ c, i })).filter(({ c }) => c.n > 1n)
  if (options.length === 0) return null
  const { i } = rng.pick(options)
  const eq = withCoefficients(correct, coefficients.map((c, j) => (j === i ? ONE : c)))
  return isBalanced(eq) ? null : eq
}

// Probe: Atome eines Elements auf der linken Seite, richtig und wie Zählfehler zählen
export function probeStep(eq: Equation, rng: Rng, focus?: string): GuidedStep | null {
  const left = sideCounts(eq.reactants)
  // das Element mit den meisten Atomen (bei Gleichstand das erste)
  const [symbol, count] = [...left].reduce((best, entry) => (entry[1].n > best[1].n ? entry : best))
  const name = elementBySymbol(symbol)!.name
  const noCoefficient = eq.reactants.reduce((n, t) => n + (atomCounts(t.species.formula).get(symbol) ?? 0), 0)
  const noIndex = eq.reactants.filter((t) => atomCounts(t.species.formula).has(symbol)).reduce((n, t) => ratAdd(n, t.coefficient), rat(0))
  const wrong: WrongValue[] = [
    { rule: 'chem-balance-count-coefficient', key: String(noCoefficient), content: `$${noCoefficient}$` },
    { rule: 'chem-balance-count-index', key: `${noIndex.n}`, content: `$${noIndex.n}$` },
  ]
  const choices = stepChoices(rng, { key: `${count.n}`, content: `$${count.n}$` }, wrong, focus)
  if (choices.length === 0) return null
  const terms = eq.reactants
    .filter((t) => atomCounts(t.species.formula).has(symbol))
    .map((t) => `${t.coefficient.n} \\cdot ${atomCounts(t.species.formula).get(symbol)}`)
  return {
    id: 'probe',
    title: 'Probe',
    question: `Wie viele ${name}atome stehen in der ausgeglichenen Gleichung auf der linken Seite?`,
    choices,
    hint: 'Koeffizient mal Index, für jeden Stoff mit diesem Element, dann zusammenzählen.',
    explanation: {
      detailed: `Für jeden Stoff gilt: Koeffizient mal Index. Links: $${terms.join(' + ')} = ${count.n}$. Rechts kommt genauso viel heraus, die Gleichung ist ausgeglichen.`,
      short: `$${terms.join(' + ')} = ${count.n}$`,
    },
    established: `\\text{${name}: links } ${count.n} = \\text{rechts } ${count.n}`,
    cards: [CARD_READ],
  }
}

function simpleTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  const reaction = rng.pick(REACTIONS.filter((x) => x.levels.includes(level as 1 | 2 | 3)))
  const correct = balance(reaction.reactants, reaction.products)!
  const candidates = [
    { rule: 'chem-balance-index', eq: indexChanged(reaction) },
    { rule: 'chem-balance-single-atom', eq: singleAtom(reaction, rng) },
    { rule: 'chem-balance-partly-doubled', eq: partly(correct, rng) },
  ]
  const wrong = candidates.filter((c): c is { rule: string; eq: Equation } => c.eq !== null && !isMultiple(c.eq, correct)).map((c) => eqWrong(c.rule, c.eq))
  const choices = stepChoices(rng, eqCorrect(correct), wrong, focus)
  if (choices.length === 0) return null
  const hasDiatomic = [...reaction.reactants, ...reaction.products].some((s) => DIATOMIC.has(s.text))
  const steps: GuidedStep[] = [
    {
      id: 'ausgleichen',
      title: 'Ausgleichen',
      question: 'Welche Gleichung gleicht die Reaktion oben richtig aus, ohne die Formeln zu ändern?',
      choices,
      hint: 'Nur die Zahlen vor den Formeln dürfen sich ändern, die Formeln selbst nie. Links und rechts müssen von jedem Element gleich viele Atome stehen.',
      explanation: {
        detailed: `Mit den Koeffizienten $${equationLatex(correct)}$ stimmt die Atombilanz für jedes Element, und es sind die kleinsten ganzen Zahlen. Die Formeln der Stoffe bleiben dabei unverändert.`,
        short: `$${equationLatex(correct)}$`,
      },
      established: equationLatex(correct),
      cards: [CARD_BALANCE, ...(hasDiatomic ? [CARD_DIATOMIC] : [])],
    },
  ]
  const probe = probeStep(correct, rng, focus)
  if (probe) steps.push(probe)
  return {
    task: {
      ref,
      instruction: 'Gleiche die Reaktionsgleichung aus',
      functionLatex: equationLatex(skeleton(reaction.reactants, reaction.products)),
      note: `${reaction.name}.`,
      steps,
      cards: [...new Set(steps.flatMap((s) => s.cards))],
      resultLatex: equationLatex(correct),
    },
    form: `gleichung:${level}:${reaction.reactants.length + reaction.products.length}`,
    substance: reaction.id,
  }
}

// --- Verbrennung CₓHᵧO_z + O₂ → CO₂ + H₂O ---

function combustionTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  const fuel: Fuel = rng.pick(FUELS.filter((f) => f.levels.includes(level as 1 | 2 | 3)))
  const counts = atomCounts(fuel.species.formula)
  const x = counts.get('C')!
  const y = counts.get('H')!
  const z = counts.get('O') ?? 0
  const a = rat(x)
  const b = rat(y, 2)
  // O₂ für (2a + b − z) Sauerstoffatome
  const oxygenFor = (atoms: Rational) => ratDiv(atoms, rat(2))
  const o = oxygenFor(ratSub(ratAdd(ratMul(rat(2), a), b), rat(z)))
  const half: Equation = {
    reactants: [
      { species: fuel.species, coefficient: ONE },
      { species: O2, coefficient: o },
    ],
    products: [
      { species: CO2, coefficient: a },
      { species: H2O, coefficient: b },
    ],
  }
  const correct = balance([fuel.species, O2], [CO2, H2O])!
  const steps: GuidedStep[] = []
  const skeletonEq = skeleton([fuel.species, O2], [CO2, H2O])

  // 1. Kohlenstoff und Wasserstoff
  const productsLatex = (ca: Rational, cb: Rational) =>
    termsLatex([
      { species: CO2, coefficient: ca },
      { species: H2O, coefficient: cb },
    ])
  const chChoices = stepChoices(
    rng,
    { key: productsLatex(a, b), content: `$${productsLatex(a, b)}$` },
    [
      { rule: 'chem-balance-count-index', key: productsLatex(a, rat(y)), content: `$${productsLatex(a, rat(y))}$` },
      { rule: 'chem-balance-partly-doubled', key: productsLatex(ONE, b), content: `$${productsLatex(ONE, b)}$` },
    ],
    focus,
  )
  if (chChoices.length === 0) return null
  steps.push({
    id: 'kohlenstoff-wasserstoff',
    title: 'Kohlenstoff und Wasserstoff',
    question: `Wie viel $\\ce{CO2}$ und $\\ce{H2O}$ entsteht aus einem Molekül $\\ce{${formulaCe(fuel.species.formula)}}$?`,
    choices: chChoices,
    hint: String.raw`Jedes C-Atom landet in einem $\ce{CO2}$, je zwei H-Atome in einem $\ce{H2O}$.`,
    explanation: {
      detailed: `$\\ce{${formulaCe(fuel.species.formula)}}$ hat ${x} Kohlenstoff- und ${y} Wasserstoffatome. Jedes C-Atom braucht ein $\\ce{CO2}$, je zwei H-Atome ein $\\ce{H2O}$: $${productsLatex(a, b)}$.`,
      short: `$${productsLatex(a, b)}$`,
    },
    established: `\\ce{${formulaCe(fuel.species.formula)}} + {?}\\,\\ce{O2} \\rightarrow ${productsLatex(a, b)}`,
    cards: [CARD_COMBUSTION],
  })

  // 2. Sauerstoff
  const o2Latex = (c: Rational) => String.raw`\ce{${coefficientCe(c)}O2}`
  const oxygenRight = ratAdd(ratMul(rat(2), a), b)
  const oChoices = stepChoices(
    rng,
    { key: o2Latex(o), content: `$${o2Latex(o)}$` },
    [
      { rule: 'chem-balance-water-oxygen', key: o2Latex(oxygenFor(ratSub(ratMul(rat(2), a), rat(z)))), content: `$${o2Latex(oxygenFor(ratSub(ratMul(rat(2), a), rat(z))))}$` },
      { rule: 'chem-balance-oxygen', key: o2Latex(ratSub(oxygenRight, rat(z))), content: `$${o2Latex(ratSub(oxygenRight, rat(z)))}$` },
      ...(z > 0 ? [{ rule: 'chem-balance-oxygen', key: o2Latex(oxygenFor(oxygenRight)), content: `$${o2Latex(oxygenFor(oxygenRight))}$` }] : []),
    ].filter((w) => !w.key.includes('-') && !w.key.includes('{0 ')),
    focus,
  )
  if (oChoices.length === 0) return null
  steps.push({
    id: 'sauerstoff',
    title: 'Sauerstoff',
    question: 'Wie viel Sauerstoff wird gebraucht?',
    choices: oChoices,
    hint: String.raw`Zähle die Sauerstoffatome rechts, in $\ce{CO2}$ und in $\ce{H2O}$. Jedes $\ce{O2}$ bringt zwei davon mit.`,
    explanation: {
      detailed: `Rechts stehen $2 \\cdot ${x} + ${b.n} = ${oxygenRight.n}$ Sauerstoffatome${z > 0 ? `, ${z} davon bringt der Brennstoff selbst mit` : ''}. Jedes $\\ce{O2}$ liefert zwei: $${o2Latex(o)}$.`,
      short: `$${equationLatex(half)}$`,
    },
    established: equationLatex(half),
    cards: [CARD_COMBUSTION],
  })

  // 3. Ganzzahlig machen bzw. die ganze Gleichung
  const fractional = o.d !== 1n
  const coCorrect = balance([fuel.species, O2], [CO, H2O])
  const doubled = coefficientsOf(correct)
  const partlyDoubled = fractional ? withCoefficients(correct, doubled.map((c, i) => (i === 2 ? a : c))) : withCoefficients(correct, doubled.map((c, i) => (i === 2 ? ONE : c)))
  const waterOxygen = withCoefficients(correct, doubled.map((c, i) => (i === 1 ? ratMul(c, ratDiv(oxygenFor(ratSub(ratMul(rat(2), a), rat(z))), o)) : c)))
  const finalWrong = [
    { rule: 'chem-balance-partly-doubled', eq: partlyDoubled },
    ...(coCorrect ? [{ rule: 'chem-balance-co', eq: coCorrect }] : []),
    { rule: 'chem-balance-water-oxygen', eq: waterOxygen },
  ]
    .filter((w) => !isBalanced(w.eq) || w.rule === 'chem-balance-co')
    .filter((w) => !isMultiple(w.eq, correct) && coefficientsOf(w.eq).every((c) => c.n > 0n && c.d === 1n))
    .map((w) => eqWrong(w.rule, w.eq))
  const finalChoices = stepChoices(rng, eqCorrect(correct), finalWrong, focus)
  if (finalChoices.length === 0) return null
  steps.push({
    id: 'ganzzahlig',
    title: fractional ? 'Ganzzahlig machen' : 'Gleichung',
    question: fractional ? 'Vor $\\ce{O2}$ steht ein Bruch. Wie lautet die Gleichung mit ganzen Zahlen?' : 'Wie lautet die ausgeglichene Gleichung?',
    choices: finalChoices,
    hint: fractional ? 'Nimm jeden Koeffizienten der Gleichung mit derselben Zahl mal.' : 'Prüfe zum Schluss jedes Element: C, H und O.',
    explanation: {
      detailed: fractional
        ? `Alle Koeffizienten werden mit 2 malgenommen, auch die von $\\ce{CO2}$ und $\\ce{H2O}$: $${equationLatex(correct)}$.`
        : `Die Koeffizienten aus den Schritten davor sind schon ganze Zahlen: $${equationLatex(correct)}$.`,
      short: `$${equationLatex(correct)}$`,
    },
    established: equationLatex(correct),
    cards: [CARD_COMBUSTION, CARD_BALANCE],
  })

  return {
    task: {
      ref,
      instruction: 'Stelle die Gleichung der vollständigen Verbrennung auf',
      functionLatex: equationLatex(skeletonEq),
      note: `${fuel.name} verbrennt vollständig zu Kohlenstoffdioxid und Wasser.`,
      steps,
      cards: [CARD_COMBUSTION, CARD_BALANCE],
      resultLatex: equationLatex(correct),
    },
    form: `verbrennung:${level}:${z > 0 ? 'alkohol' : 'alkan'}`,
    substance: fuel.id,
  }
}

export const GLEICHUNGEN_GENERATORS: readonly ChemGenerator[] = [
  {
    kind: 'ausgleichen',
    part: 'ausgleichen',
    weights: { 1: 0.8, 2: 0.6 },
    errors: ['chem-balance-index', 'chem-balance-single-atom', 'chem-balance-partly-doubled', 'chem-balance-count-coefficient', 'chem-balance-count-index'],
    generate: simpleTask,
  },
  {
    kind: 'verbrennung',
    part: 'verbrennung',
    weights: { 1: 0.2, 2: 0.4, 3: 1 },
    errors: ['chem-balance-count-index', 'chem-balance-partly-doubled', 'chem-balance-water-oxygen', 'chem-balance-oxygen', 'chem-balance-co'],
    generate: combustionTask,
  },
]

