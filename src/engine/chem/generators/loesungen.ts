import type { GuidedStep } from '../../guided/types.ts'
import type { Rng } from '../../random/rng.ts'
import { type Rational, parseDecimal, rat, ratAdd, ratDiv, ratEq, ratMul, ratToNumber, toDecimalString } from '../../rational.ts'
import type { Level, TaskRef } from '../../tasks/taskNumber.ts'
import { type Species, balance, equationLatex, species } from '../equation.ts'
import { type Formula, atomCounts, formulaLatex, parseFormula } from '../formula.ts'
import { type MassValues, atomicNumberSum, elementMolarMass, molarMass } from '../molarMass.ts'
import { FUELS, CO2, H2O, O2 } from '../reactions.ts'
import { SUBSTANCES, type Substance, substanceById } from '../substances.ts'
import { type ChemCalc, type ChemGenerator, stepChoices, tolerantNumeric, tolerantWrongs, usesExamNumbers, usesExamSolution } from './shared.ts'
import { eqSign, given, molarLatex, nLatex, nStep, sig } from './stoffmenge.ts'

// Rechnungen zum Thema „Gase und Lösungen" (Plan M4, Thema 4.3). Exakt mit Brüchen gerechnet, angezeigt mit
// drei gültigen Ziffern; Folgeschritte rechnen mit dem angezeigten Zwischenwert. Jede Aufgabe nennt ihre Werte.
// - Unterthema „konzentration": c = n/V, n = c · V, Lösung ansetzen m = c · V · M
// - Unterthema „anteile": Massenanteil, Massenkonzentration, ppm/ppb, Vol-%
// - Unterthema „gase": molares Volumen bei Normbedingungen, ideales Gasgesetz, Gasvolumen aus einer Reaktion

const d = (text: string) => parseDecimal(text)!
const VM = d('22.4')
const R = d('8.314')
const KELVIN = d('273.15')
const ML = rat(1, 1000)

const unit = (r: Rational, u: string) => `${sig(r)}\\,\\mathrm{${u}}`
// genau angezeigt (ohne Runden), große Zahlen mit schmalem Abstand: 101300 → „101\,300"
function exact(r: Rational): string {
  const text = toDecimalString(r)!
  const [whole, frac] = text.split(',')
  const grouped = whole.length > 4 ? whole.replace(/\B(?=(\d{3})+$)/g, '\\,') : whole
  return frac === undefined ? grouped : `${grouped}{,}${frac}`
}
const CARD = {
  konz: 'loesungen-konzentration',
  ansetzen: 'loesungen-ansetzen',
  anteil: 'loesungen-massenanteil',
  beta: 'loesungen-massenkonzentration',
  ppm: 'loesungen-ppm',
  vol: 'loesungen-volumenanteil',
  vm: 'loesungen-molvolumen',
  gas: 'loesungen-gasgesetz',
}

// Ein Rechenschritt mit Toleranz-Fehlern
type StepSpec = {
  id: string
  title: string
  question: string
  correct: Rational
  wrong: { rule: string; value: Rational }[]
  unit: string
  hint: string
  line: string
  why: string
  card: string
}
function calcStep(spec: StepSpec, rng: Rng, focus?: string): GuidedStep | null {
  const latex = (r: Rational) => unit(r, spec.unit)
  const wrong = tolerantWrongs(spec.correct, spec.wrong.filter((w) => w.value.n > 0n), latex)
  const choices = stepChoices(rng, { key: latex(spec.correct), content: `$${latex(spec.correct)}$` }, wrong, focus)
  if (choices.length === 0) return null
  return {
    id: spec.id,
    title: spec.title,
    question: spec.question,
    choices,
    numeric: tolerantNumeric(spec.correct, wrong, `\\mathrm{${spec.unit}}`),
    hint: spec.hint,
    explanation: { detailed: `${spec.why} $${spec.line}$.`, short: `$${spec.line}$` },
    established: spec.line,
    cards: [spec.card],
  }
}

// --- Stoffe ---

const SOLUTE_IDS = ['NaCl', 'KCl', 'NaOH', 'KOH', 'CaCl2', 'MgCl2', 'Na2CO3', 'NaHCO3', 'Na2SO4', 'CuSO4', 'KNO3', 'AgNO3', 'KMnO4', 'NH4Cl', 'C6H12O6', 'HCl', 'H2SO4', 'HNO3', 'H3PO4', 'H2O2', 'CH3OH', 'C2H5OH']
const SOLUTE_HARD_IDS = ['Ca(NO3)2', 'Mg(NO3)2', 'Al2(SO4)3', '(NH4)2SO4', 'CuSO4*5H2O', 'MgSO4*7H2O', 'FeSO4*7H2O', 'Na2CO3*10H2O', 'CoCl2*6H2O', 'CaCl2*2H2O']
// Abgewogen werden nur Feststoffe (Salze, Hydroxide, Glucose, Hydrate). Gase und Flüssigkeiten (Chlorwasserstoff,
// Säuren, Wasserstoffperoxid, Alkohole) kommen nur in Aufgaben vor, in denen nichts abgewogen wird.
const NOT_WEIGHED = new Set(['HCl', 'H2SO4', 'HNO3', 'H3PO4', 'H2O2', 'CH3OH', 'C2H5OH'])
export const WEIGH_IDS: readonly string[] = [...SOLUTE_IDS, ...SOLUTE_HARD_IDS].filter((id) => !NOT_WEIGHED.has(id))
const WEIGH_EASY_IDS = SOLUTE_IDS.filter((id) => !NOT_WEIGHED.has(id))
const GAS_IDS = ['H2', 'O2', 'N2', 'Cl2', 'CO2', 'CO', 'NH3', 'CH4', 'C2H6', 'C3H8', 'C4H10', 'SO2', 'N2O', 'HCl']
const solutes = (ids: readonly string[]) => ids.map((id) => substanceById(id)!)
// Gase: aus der Stoffliste und die Edelgase
const NOBLE: readonly Substance[] = [
  { id: 'He', name: 'Helium', kind: 'simple', formula: parseFormula('He') },
  { id: 'Ne', name: 'Neon', kind: 'simple', formula: parseFormula('Ne') },
  { id: 'Ar', name: 'Argon', kind: 'simple', formula: parseFormula('Ar') },
]
const GASES: readonly Substance[] = [...solutes(GAS_IDS), ...NOBLE]
const ce = (s: Substance | Species) => formulaLatex(s.formula)
const named = (s: Substance) => `${s.name} $${ce(s)}$`

// Werte der Elemente einer Formel
function valuesNote(formula: Formula, values: MassValues): string {
  const parts = [...atomCounts(formula).keys()].map((symbol) => `$M(\\ce{${symbol}}) = ${molarLatex(elementMolarMass(symbol, values), values)}$`)
  const joined = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} und ${parts[parts.length - 1]}`
  return values === 'pse' ? `Werte aus dem PSE: ${joined}.` : `Rechne mit ${joined}.`
}

// Hydrat: Die Konzentration gilt für das wasserfreie Salz (wie in der Frage lo-k-kristallwasser); abgewogen wird das
// Hydrat, und jede seiner Formeleinheiten bringt eine Formeleinheit Salz mit (gleiche Stoffmenge)
export type HydrateInfo = { readonly salt: Substance; readonly word: string }
export function hydrateInfo(s: Substance): HydrateInfo | null {
  if (s.formula.adducts.length === 0) return null
  const word = /-([A-Za-z]*hydrat)/.exec(s.name)?.[1] ?? 'Hydrat'
  const name = s.name.replace(/-[A-Za-z]*hydrat.*$/, '')
  return { salt: { id: s.id.split('*')[0], name, kind: 'simple', formula: { units: s.formula.units, adducts: [] } }, word }
}

// „Molmasse unvollständig": ohne die Wasserstoffatome bzw. nur das erste Element
function incompleteMass(formula: Formula, values: MassValues): Rational {
  const counts = atomCounts(formula)
  const symbols = counts.has('H') ? [...counts.keys()].filter((s) => s !== 'H') : [[...counts.keys()][0]]
  return symbols.reduce((sum, s) => ratAdd(sum, ratMul(rat(counts.get(s)!), elementMolarMass(s, values))), rat(0))
}

const NICE_C = ['0.05', '0.1', '0.2', '0.25', '0.5', '1', '2'].map(d)
const NICE_N = ['0.1', '0.2', '0.25', '0.5', '0.75', '1.5', '2', '3'].map(d)
const SMALL_N = ['0.01', '0.02', '0.05'].map(d)

// Löslichkeit in Gramm je 100 g Wasser bei 20 °C (gerundet, frei zugängliche Tabellen; bei Hydraten das
// wasserfreie Salz), Infinity: mit Wasser mischbar. Aufgaben bleiben unter 80 % der Sättigung; für c wird die
// Dichte der Lösung mit 1 g/mL angesetzt, das unterschätzt die echte Sättigungskonzentration (sicher).
const SOLUBILITY: Readonly<Record<string, number>> = {
  NaCl: 35.9, KCl: 34.2, NaOH: 109, KOH: 112, CaCl2: 74.5, MgCl2: 54.6, Na2CO3: 21.5, NaHCO3: 9.6, Na2SO4: 19.5,
  CuSO4: 20, KNO3: 31.6, AgNO3: 216, KMnO4: 6.4, NH4Cl: 37.2, C6H12O6: 91, HCl: 72, H2SO4: Infinity, HNO3: Infinity,
  H3PO4: Infinity, H2O2: Infinity, CH3OH: Infinity, C2H5OH: Infinity,
  'Ca(NO3)2': 121, 'Mg(NO3)2': 69.5, 'Al2(SO4)3': 36.4, '(NH4)2SO4': 75.4, 'CuSO4*5H2O': 20, 'MgSO4*7H2O': 35.1,
  'FeSO4*7H2O': 26, 'Na2CO3*10H2O': 21.5, 'CoCl2*6H2O': 52.9, 'CaCl2*2H2O': 74.5,
}
// größter Massenanteil (als Bruchteil) bei Sättigung
function saturation(s: Substance): number {
  const sol = SOLUBILITY[s.id]
  if (sol === undefined) throw new Error(`Löslichkeit fehlt: ${s.id}`)
  return sol === Infinity ? 1 : sol / (100 + sol)
}
// Grenzen für Aufgaben: c in mol/L (höchstens 5), w in %, β in g/L
const maxC = (s: Substance) => Math.min(5, (800 * saturation(s)) / ratToNumber(molarMass(s.formula, 'pse', { withoutAdducts: true })))
const maxW = (s: Substance) => 80 * saturation(s)
const maxBeta = (s: Substance) => 800 * saturation(s)
const within = (r: Rational, limit: number) => ratToNumber(r) <= limit + 1e-9
const VOLUMES_ML = [50, 100, 150, 200, 250, 500, 750, 1000]

// Lösung ansetzen für Klausuraufgabe 4 (chem/exam/task4.ts): Stoff, Konzentration und Volumen wie auf
// Klausurniveau, unter der Löslichkeit, nie wie in den Altklausuren; null: neu ziehen
// (nur Feststoffe, die man abwiegen kann)
export function pickSolution(rng: Rng): { substance: Substance; c: Rational; vMl: number } | null {
  const s = rng.pick(solutes(WEIGH_IDS))
  const vMl = rng.pick(VOLUMES_ML)
  const c = rng.pick(NICE_C.filter((x) => within(x, maxC(s))))
  return usesExamSolution(s.id, c, vMl) ? null : { substance: s, c, vMl }
}

// --- Konzentration ---

function concTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  const s = rng.pick(solutes(SOLUTE_IDS))
  const vMl = rng.pick(VOLUMES_ML)
  const v = ratMul(rat(vMl), ML)
  const askC = rng.chance(0.5)
  if (askC) {
    const ns = [...SMALL_N, ...NICE_N].filter((x) => within(ratDiv(x, v), maxC(s)))
    if (ns.length === 0) return null
    const n = rng.pick(ns)
    const c = ratDiv(n, v)
    if (usesExamSolution(s.id, c, vMl)) return null
    const step = calcStep(
      {
        id: 'konzentration',
        title: 'Konzentration',
        question: `Wie groß ist die Konzentration $c(${ce(s)})$?`,
        correct: c,
        wrong: [
          { rule: 'chem-ml-not-l', value: ratDiv(n, rat(vMl)) },
          { rule: 'chem-c-inverted', value: ratDiv(v, n) },
        ],
        unit: 'mol/L',
        hint: 'Gesucht ist die molare Konzentration (Stoffmengenkonzentration). In welcher Einheit muss das Volumen stehen, damit mol/L herauskommt?',
        line: `c = \\frac{n}{V} = \\frac{${unit(n, 'mol')}}{${unit(v, 'L')}} ${eqSign(c)} ${unit(c, 'mol/L')}`,
        why: 'Konzentration ist Stoffmenge je Liter Lösung:',
        card: CARD.konz,
      },
      rng,
      focus,
    )
    if (!step) return null
    return finish(ref, 'Berechne die Konzentration', `${nLatex(s as Substance)} = ${unit(n, 'mol')} \\qquad V = ${vMl}\\,\\mathrm{mL}`, `${named(s)} in Wasser gelöst.`, [step], `c ${eqSign(c)} ${unit(c, 'mol/L')}`, `konzentration:${level}:c`, s.id)
  }
  const cs = NICE_C.filter((x) => within(x, maxC(s)))
  const c = rng.pick(cs)
  if (usesExamSolution(s.id, c, vMl)) return null
  const n = ratMul(c, v)
  const step = calcStep(
    {
      id: 'stoffmenge',
      title: 'Stoffmenge',
      question: `Wie viel $${ce(s)}$ ist gelöst?`,
      correct: n,
      wrong: [
        { rule: 'chem-ml-not-l', value: ratMul(c, rat(vMl)) },
        { rule: 'chem-c-inverted', value: ratDiv(c, v) },
      ],
      unit: 'mol',
      hint: 'Stelle c = n/V nach n um. In welcher Einheit steht das Volumen?',
      line: `n = c \\cdot V = ${unit(c, 'mol/L')} \\cdot ${unit(v, 'L')} ${eqSign(n)} ${unit(n, 'mol')}`,
      why: 'Stoffmenge ist Konzentration mal Volumen in Litern:',
      card: CARD.konz,
    },
    rng,
    focus,
  )
  if (!step) return null
  return finish(ref, 'Berechne die Stoffmenge', `c = ${unit(c, 'mol/L')} \\qquad V = ${vMl}\\,\\mathrm{mL}`, `Lösung von ${named(s)}.`, [step], `n ${eqSign(n)} ${unit(n, 'mol')}`, `konzentration:${level}:n`, s.id)
}

// Lösung ansetzen: n = c · V, M, m = n · M
function prepareTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  const values: MassValues = level === 2 ? 'pse' : 'rounded'
  const s = rng.pick(solutes(level === 3 ? [...WEIGH_EASY_IDS, ...SOLUTE_HARD_IDS, ...SOLUTE_HARD_IDS] : WEIGH_EASY_IDS))
  const vMl = rng.pick(VOLUMES_ML)
  const v = ratMul(rat(vMl), ML)
  const c = rng.pick(NICE_C.filter((x) => within(x, maxC(s))))
  if (usesExamSolution(s.id, c, vMl)) return null
  const n = ratMul(c, v)
  // bei Hydraten gilt c für das wasserfreie Salz
  const hydrate = hydrateInfo(s)
  const dissolved = hydrate ? hydrate.salt : s
  const steps: GuidedStep[] = []
  const nStepped = calcStep(
    {
      id: 'stoffmenge',
      title: 'Stoffmenge',
      question: `Welche Stoffmenge $${ce(dissolved)}$ wird gebraucht?`,
      correct: n,
      wrong: [
        { rule: 'chem-ml-not-l', value: ratMul(c, rat(vMl)) },
        { rule: 'chem-c-inverted', value: ratDiv(c, v) },
      ],
      unit: 'mol',
      hint: 'Wie viel Mol sind in dem Volumen bei dieser Konzentration? Achte auf die Einheit des Volumens.',
      line: `n = c \\cdot V = ${unit(c, 'mol/L')} \\cdot ${unit(v, 'L')} ${eqSign(n)} ${unit(n, 'mol')}`,
      why: 'Zuerst die Stoffmenge:',
      card: CARD.ansetzen,
    },
    rng,
    focus,
  )
  if (!nStepped) return null
  steps.push(nStepped)
  const nShown = given(n)
  const mass = molarMass(s.formula, values)
  const mLatex = (r: Rational) => molarText(r, values)
  const mStepM = calcStepExact(
    {
      id: 'molmasse',
      title: 'Molmasse',
      question: `Wie groß ist die molare Masse $M(${ce(s)})$?`,
      correct: mass,
      // „Molmasse unvollständig" liegt bei NaOH, KOH oder NaHCO₃ zu nah an der Lösung und fällt dann weg (tolerantWrongs);
      // dafür bleiben Index vergessen und Ordnungszahlen
      wrong: [
        { rule: 'chem-molar-incomplete', value: incompleteMass(s.formula, values) },
        ...(hydrate ? [{ rule: 'chem-molar-hydrate', value: molarMass(s.formula, values, { withoutAdducts: true }) }] : []),
        { rule: 'chem-molar-index', value: molarMass(s.formula, values, { ignoreIndices: true }) },
        { rule: 'chem-molar-atomic-number', value: atomicNumberSum(s.formula) },
      ],
      latex: mLatex,
      hint: hydrate ? 'Abgewogen wird das Hydrat: Zähle jedes Atom der Formel, auch das Kristallwasser.' : 'Zähle jedes Atom der Formel, auch Wasserstoff.',
      line: `M(${ce(s)}) = ${molarText(mass, values)}`,
      why: 'Die molare Masse der ganzen Formel:',
      card: CARD.ansetzen,
    },
    rng,
    focus,
  )
  if (!mStepM) return null
  steps.push(mStepM)
  const m = ratMul(nShown, mass)
  const mStep = calcStep(
    {
      id: 'masse',
      title: 'Masse',
      question: hydrate ? `Wie viel ${hydrate.word} $${ce(s)}$ muss abgewogen werden?` : `Wie viel $${ce(s)}$ muss abgewogen werden?`,
      correct: m,
      wrong: [
        { rule: 'chem-m-divided', value: ratDiv(nShown, mass) },
        { rule: 'chem-molar-incomplete', value: ratMul(nShown, incompleteMass(s.formula, values)) },
        ...(hydrate ? [{ rule: 'chem-molar-hydrate', value: ratMul(nShown, molarMass(s.formula, values, { withoutAdducts: true })) }] : []),
      ],
      unit: 'g',
      hint: 'Mol mal Gramm je Mol ergibt Gramm.',
      line: `m = n \\cdot M = ${unit(nShown, 'mol')} \\cdot ${molarText(mass, values)} ${eqSign(m)} ${unit(m, 'g')}`,
      why: hydrate
        ? `Jede Formeleinheit ${hydrate.word} bringt eine Formeleinheit $${ce(dissolved)}$ mit; man wiegt also so viel Mol Hydrat ab, wie Salz gebraucht wird:`
        : 'Masse ist Stoffmenge mal molare Masse:',
      card: CARD.ansetzen,
    },
    rng,
    focus,
  )
  if (!mStep) return null
  steps.push(mStep)
  return finish(
    ref,
    'Wie viel muss für die Lösung abgewogen werden?',
    `V = ${vMl}\\,\\mathrm{mL} \\qquad c(${ce(dissolved)}) = ${unit(c, 'mol/L')}`,
    hydrate
      ? `Lösung von ${named(dissolved)}; abgewogen wird das ${hydrate.word} $${ce(s)}$, gelöst und im Maßkolben aufgefüllt. ${valuesNote(s.formula, values)}`
      : `${named(s)}, abgewogen, gelöst und im Maßkolben aufgefüllt. ${valuesNote(s.formula, values)}`,
    steps,
    `m ${eqSign(m)} ${unit(m, 'g')}`,
    `ansetzen:${level}:${s.kind}`,
    s.id,
  )
}

// Molmasse mit einer Nachkommastelle (PSE) bzw. wie gegeben
function molarText(r: Rational, values: MassValues): string {
  return molarLatex(r, values)
}

// Schritt mit genauen Werten (Molmassen): Toleranz wie sonst, Schreibweise eigen
function calcStepExact(spec: Omit<StepSpec, 'unit'> & { latex: (r: Rational) => string }, rng: Rng, focus?: string): GuidedStep | null {
  const wrong = tolerantWrongs(spec.correct, spec.wrong, spec.latex)
  const choices = stepChoices(rng, { key: spec.latex(spec.correct), content: `$${spec.latex(spec.correct)}$` }, wrong, focus)
  if (choices.length === 0) return null
  return {
    id: spec.id,
    title: spec.title,
    question: spec.question,
    choices,
    // bisher nur Molmassen
    numeric: tolerantNumeric(spec.correct, wrong, String.raw`\mathrm{g/mol}`),
    hint: spec.hint,
    explanation: { detailed: `${spec.why} $${spec.line}$.`, short: `$${spec.line}$` },
    established: spec.line,
    cards: [spec.card],
  }
}

// --- Anteile ---

function fractionTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  const s = rng.pick(solutes(SOLUTE_IDS))
  if (rng.chance(0.4)) {
    // Masse des gelösten Stoffs in einer Lösung mit gegebenem Massenanteil
    const w = rng.pick(['0.5', '1', '2', '5', '10', '15', '20', '25'].map(d).filter((x) => within(x, maxW(s))))
    const total = rng.pick([50, 100, 200, 250, 400, 500, 1000].map((x) => rat(x)))
    const ms = ratMul(ratDiv(w, rat(100)), total)
    const back = calcStep(
      {
        id: 'masse',
        title: 'Masse',
        question: `Wie viel $${ce(s)}$ enthält die Lösung?`,
        correct: ms,
        wrong: [{ rule: 'chem-vol-percent', value: ratMul(w, total) }],
        unit: 'g',
        hint: 'Was bedeutet „Prozent“ als Zahl?',
        line: `m = \\frac{${sig(w)}}{100} \\cdot ${unit(total, 'g')} ${eqSign(ms)} ${unit(ms, 'g')}`,
        why: 'Massenanteil durch 100, mal die Masse der Lösung:',
        card: CARD.anteil,
      },
      rng,
      focus,
    )
    if (!back) return null
    return finish(ref, 'Berechne die Masse des gelösten Stoffs', `m(\\text{Lösung}) = ${unit(total, 'g')} \\qquad w = ${unit(w, '\\%')}`, `Lösung von ${named(s)} in Wasser.`, [back], `m ${eqSign(ms)} ${unit(ms, 'g')}`, `anteil:${level}:w-masse`, s.id)
  }
  const pairs = [2, 4, 5, 8, 10, 12, 15, 20, 25, 30].flatMap((a) =>
    [45, 60, 75, 90, 100, 120, 150, 180, 200, 250].map((b) => [rat(a), rat(b)] as const).filter(([x, y]) => within(ratMul(ratDiv(x, ratAdd(x, y)), rat(100)), maxW(s))),
  )
  const [ms, mw] = rng.pick(pairs)
  const total = ratAdd(ms, mw)
  const w = ratMul(ratDiv(ms, total), rat(100))
  const step = calcStep(
    {
      id: 'massenanteil',
      title: 'Massenanteil',
      question: 'Wie groß ist der Massenanteil des gelösten Stoffs?',
      correct: w,
      wrong: [
        { rule: 'chem-fraction-solvent', value: ratMul(ratDiv(ms, mw), rat(100)) },
        { rule: 'chem-percent-not-times', value: ratDiv(ms, total) },
      ],
      unit: '\\%',
      hint: 'Worauf bezieht sich der Anteil: auf das Wasser oder auf die ganze Lösung?',
      line: `w = \\frac{${unit(ms, 'g')}}{${unit(ms, 'g')} + ${unit(mw, 'g')}} \\cdot 100\\,\\% ${eqSign(w)} ${unit(w, '\\%')}`,
      why: 'Gelöster Stoff geteilt durch die Masse der ganzen Lösung, mal 100 %:',
      card: CARD.anteil,
    },
    rng,
    focus,
  )
  if (!step) return null
  return finish(ref, 'Berechne den Massenanteil', `m(${ce(s)}) = ${unit(ms, 'g')} \\qquad m(\\ce{H2O}) = ${unit(mw, 'g')}`, `${named(s)} wird in Wasser gelöst.`, [step], `w ${eqSign(w)} ${unit(w, '\\%')}`, `anteil:${level}:w`, s.id)
}

function betaTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  const s = rng.pick(solutes(SOLUTE_IDS))
  const pairs = ['0.5', '1', '2', '2.5', '4', '5', '7.5', '10', '12', '20'].flatMap((a) =>
    VOLUMES_ML.map((b) => [d(a), b] as const).filter(([x, y]) => within(ratDiv(x, ratMul(rat(y), ML)), maxBeta(s))),
  )
  const [m, vMl] = rng.pick(pairs)
  const v = ratMul(rat(vMl), ML)
  const beta = ratDiv(m, v)
  const step = calcStep(
    {
      id: 'massenkonzentration',
      title: 'Massenkonzentration',
      question: 'Wie groß ist die Massenkonzentration?',
      correct: beta,
      wrong: [
        { rule: 'chem-ml-not-l', value: ratDiv(m, rat(vMl)) },
        { rule: 'chem-mass-conc-inverted', value: ratDiv(v, m) },
      ],
      unit: 'g/L',
      hint: String.raw`Masse je Volumen, und das Volumen in Litern. Im Skript hat die Massenkonzentration das Zeichen $\rho$.`,
      line: `\\beta = \\frac{m}{V} = \\frac{${unit(m, 'g')}}{${unit(v, 'L')}} ${eqSign(beta)} ${unit(beta, 'g/L')}`,
      why: 'Massenkonzentration ist Masse des gelösten Stoffs je Liter Lösung:',
      card: CARD.beta,
    },
    rng,
    focus,
  )
  if (!step) return null
  return finish(ref, 'Berechne die Massenkonzentration', `m(${ce(s)}) = ${unit(m, 'g')} \\qquad V = ${vMl}\\,\\mathrm{mL}`, `${named(s)}, gelöst und aufgefüllt auf das angegebene Volumen.`, [step], `\\beta ${eqSign(beta)} ${unit(beta, 'g/L')}`, `anteil:${level}:beta`, s.id)
}

// Spurenstoffe mit Werten in üblicher Größenordnung (unter oder nahe an gängigen Grenzwerten)
const TRACES: readonly { id: string; text: string; unit: 'ppm' | 'ppb'; values: readonly string[] }[] = [
  { id: 'nitrat', text: 'Nitrat im Grundwasser', unit: 'ppm', values: ['5', '10', '20', '25', '40', '50'] },
  { id: 'kupfer', text: 'Kupfer im Leitungswasser', unit: 'ppm', values: ['0.1', '0.2', '0.5', '1', '1.5'] },
  { id: 'cadmium', text: 'Cadmium im Boden', unit: 'ppm', values: ['0.2', '0.4', '0.5', '1', '1.5'] },
  { id: 'fluorid', text: 'Fluorid im Mineralwasser', unit: 'ppm', values: ['0.2', '0.5', '1', '1.5'] },
  { id: 'blei', text: 'Blei im Trinkwasser', unit: 'ppb', values: ['1', '2', '5', '8', '10'] },
  { id: 'quecksilber', text: 'Quecksilber in Fisch', unit: 'ppb', values: ['50', '100', '200', '300', '500'] },
  { id: 'arsen', text: 'Arsen im Reis', unit: 'ppb', values: ['20', '50', '100', '150', '200'] },
  { id: 'uran', text: 'Uran im Trinkwasser', unit: 'ppb', values: ['0.5', '1', '2', '5', '10'] },
]

function ppmTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  const trace = rng.pick(TRACES)
  const kg = rng.pick([1, 2, 4, 5, 10, 20, 50].map((x) => rat(x)))
  const ppb = trace.unit === 'ppb'
  const value = d(rng.pick(trace.values))
  const unitName = ppb ? 'ppb' : 'ppm'
  const small = ppb ? '\\mu g' : 'mg'
  const factor = ppb ? rat(1, 10 ** 9) : rat(1, 10 ** 6)
  const other = ppb ? rat(1, 10 ** 6) : rat(1, 10 ** 9)
  if (rng.chance(0.5)) {
    // Anteil aus Masse: x mg (µg) in y kg
    const amount = ratMul(value, kg)
    const step = calcStep(
      {
        id: 'anteil',
        title: unitName,
        question: `Wie groß ist der Anteil in ${unitName}?`,
        correct: value,
        wrong: [
          { rule: 'chem-ppb', value: ratMul(value, ratDiv(factor, other)) },
          { rule: 'chem-ppb', value: ratMul(value, ratDiv(other, factor)) },
        ],
        unit: unitName,
        hint: `Wie viel ${ppb ? 'Mikrogramm' : 'Milligramm'} kommen auf ein Kilogramm?`,
        line: `\\frac{${unit(amount, small)}}{${unit(kg, 'kg')}} = ${unit(value, `${small}/kg`)} ${eqSign(value)} ${unit(value, unitName)}`,
        why: `1 ${unitName} heißt 1 $\\mathrm{${small}}$ je Kilogramm:`,
        card: CARD.ppm,
      },
      rng,
      focus,
    )
    if (!step) return null
    return finish(ref, `Gib den Anteil in ${unitName} an`, `${unit(amount, small)}\\ \\text{in}\\ ${unit(kg, 'kg')}`, `${trace.text}.`, [step], `${unit(value, unitName)}`, `ppm:${level}:anteil-${unitName}`, trace.id)
  }
  // Masse aus Anteil
  const amount = ratMul(value, kg)
  const step = calcStep(
    {
      id: 'masse',
      title: 'Masse',
      question: `Wie viel ${ppb ? 'Mikrogramm' : 'Milligramm'} sind das?`,
      correct: amount,
      wrong: [
        { rule: 'chem-ppb', value: ratMul(amount, ratDiv(factor, other)) },
        { rule: 'chem-ppb', value: ratMul(amount, ratDiv(other, factor)) },
      ],
      unit: small,
      hint: `Was bedeutet 1 ${unitName}, bezogen auf ein Kilogramm?`,
      line: `m = ${unit(value, `${small}/kg`)} \\cdot ${unit(kg, 'kg')} ${eqSign(amount)} ${unit(amount, small)}`,
      why: `1 ${unitName} sind 1 $\\mathrm{${small}}$ je Kilogramm:`,
      card: CARD.ppm,
    },
    rng,
    focus,
  )
  if (!step) return null
  return finish(ref, 'Berechne die Masse', `${unit(value, unitName)}\\ \\text{in}\\ ${unit(kg, 'kg')}`, `${trace.text}.`, [step], `m ${eqSign(amount)} ${unit(amount, small)}`, `ppm:${level}:masse-${unitName}`, trace.id)
}

const DRINKS = [
  { id: 'bier', text: 'Bier', pct: ['4.8', '5', '5.2'], liters: ['0.33', '0.5'] },
  { id: 'wein', text: 'Wein', pct: ['11', '12', '13.5'], liters: ['0.75', '0.2', '1'] },
  { id: 'likoer', text: 'Likör', pct: ['20', '25', '30'], liters: ['0.5', '0.7'] },
  { id: 'schnaps', text: 'Schnaps', pct: ['38', '40', '42'], liters: ['0.02', '0.7', '1'] },
  { id: 'desinfektion', text: 'Desinfektionsmittel', pct: ['70', '80'], liters: ['0.1', '0.5', '1'] },
  { id: 'sekt', text: 'Sekt', pct: ['11', '12.5'], liters: ['0.75', '0.2'] },
  { id: 'apfelwein', text: 'Apfelwein', pct: ['5.5', '6'], liters: ['0.5', '1'] },
  { id: 'rum', text: 'Rum', pct: ['37.5', '40'], liters: ['0.7', '0.04'] },
  { id: 'radler', text: 'Radler', pct: ['2.5'], liters: ['0.33', '0.5'] },
]

function volTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  const drink = rng.pick(DRINKS)
  const pct = d(rng.pick(drink.pct))
  const total = d(rng.pick(drink.liters))
  const vs = ratMul(ratDiv(pct, rat(100)), total)
  if (rng.chance(0.4)) {
    // Volumenanteil aus den Volumina
    const vsMl = ratMul(vs, rat(1000))
    const back = calcStep(
      {
        id: 'volumenanteil',
        title: 'Volumenanteil',
        question: 'Wie groß ist der Volumenanteil an Ethanol?',
        correct: pct,
        wrong: [
          { rule: 'chem-percent-not-times', value: ratDiv(pct, rat(100)) },
          { rule: 'chem-ml-not-l', value: ratDiv(ratMul(vsMl, rat(100)), total) },
        ],
        unit: 'Vol\\text{-}\\%',
        hint: 'Beide Volumina in derselben Einheit, dann der Anteil mal 100 %.',
        line: `\\varphi = \\frac{${exact(vs)}\\,\\mathrm{L}}{${unit(total, 'L')}} \\cdot 100\\,\\% ${eqSign(pct)} ${unit(pct, 'Vol\\text{-}\\%')}`,
        why: 'Volumen des Ethanols geteilt durch das Gesamtvolumen, mal 100 %:',
        card: CARD.vol,
      },
      rng,
      focus,
    )
    if (!back) return null
    return finish(ref, 'Berechne den Volumenanteil', `${exact(vsMl)}\\,\\mathrm{mL}\\ \\text{Ethanol in}\\ ${unit(total, 'L')}`, `${drink.text}.`, [back], `\\varphi ${eqSign(pct)} ${unit(pct, 'Vol\\text{-}\\%')}`, `anteil:${level}:vol-anteil`, drink.id)
  }
  const step = calcStep(
    {
      id: 'volumen',
      title: 'Volumen',
      question: 'Wie viel Ethanol ist enthalten?',
      correct: vs,
      wrong: [{ rule: 'chem-vol-percent', value: ratMul(pct, total) }],
      unit: 'L',
      hint: 'Was bedeutet „Prozent“ als Zahl?',
      line: `V = \\frac{${sig(pct)}}{100} \\cdot ${unit(total, 'L')} ${eqSign(vs)} ${unit(vs, 'L')}`,
      why: 'Der Volumenanteil durch 100, mal das Gesamtvolumen:',
      card: CARD.vol,
    },
    rng,
    focus,
  )
  if (!step) return null
  return finish(ref, 'Berechne das Volumen Ethanol', `${unit(total, 'L')}\\ \\text{mit}\\ ${sig(pct)}\\,\\mathrm{Vol}\\text{-}\\%`, `${drink.text} mit dem angegebenen Ethanolgehalt.`, [step], `V ${eqSign(vs)} ${unit(vs, 'L')}`, `anteil:${level}:vol`, drink.id)
}

// --- Gase ---

function vmTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  // Butan siedet knapp unter 0 °C: bei Normbedingungen nicht verlässlich gasförmig
  const gas = rng.pick(GASES.filter((g) => g.id !== 'C4H10'))
  if (rng.chance(0.35)) {
    // aus der Masse: n = m/M, dann V = n · V_m
    const values: MassValues = level === 2 ? 'pse' : 'rounded'
    const mass = molarMass(gas.formula, values)
    const m = given(ratMul(rng.pick(NICE_N), mass))
    if (usesExamNumbers(`m(${ce(gas)}) = ${unit(m, 'g')}`)) return null
    const first = nStep(gas, m, mass, values, rng, focus)
    if (!first) return null
    const nShown = given(first.n)
    const vol = ratMul(nShown, VM)
    const second = calcStep(
      {
        id: 'volumen',
        title: 'Volumen',
        question: 'Welches Volumen nimmt das Gas ein?',
        correct: vol,
        wrong: [{ rule: 'chem-vm-inverted', value: ratDiv(nShown, VM) }],
        unit: 'L',
        hint: 'Wie viel Platz nimmt ein Mol eines Gases bei Normbedingungen (im Skript: Normalbedingungen) ein?',
        line: `V = n \\cdot V_m = ${unit(nShown, 'mol')} \\cdot 22{,}4\\,\\mathrm{L/mol} ${eqSign(vol)} ${unit(vol, 'L')}`,
        why: 'Stoffmenge mal molares Volumen:',
        card: CARD.vm,
      },
      rng,
      focus,
    )
    if (!second) return null
    return finish(
      ref,
      'Berechne das Volumen',
      `m(${ce(gas)}) = ${unit(m, 'g')}`,
      `${named(gas)} bei Normbedingungen ($0\\,^{\\circ}\\mathrm{C}$, $1013\\,\\mathrm{hPa}$), $V_m = 22{,}4\\,\\mathrm{L/mol}$. ${valuesNote(gas.formula, values)}`,
      [{ ...first.step, id: 'stoffmenge' }, second],
      `V ${eqSign(vol)} ${unit(vol, 'L')}`,
      `gase:${level}:vm-masse`,
      gas.id,
    )
  }
  const askV = rng.chance(0.6)
  const n = rng.pick(NICE_N)
  const v = ratMul(n, VM)
  const step = askV
    ? calcStep(
        {
          id: 'volumen',
          title: 'Volumen',
          question: `Welches Volumen nimmt das Gas ein?`,
          correct: v,
          wrong: [{ rule: 'chem-vm-inverted', value: ratDiv(n, VM) }],
          unit: 'L',
          hint: 'Wie viel Platz nimmt ein Mol eines Gases bei Normbedingungen (im Skript: Normalbedingungen) ein?',
          line: `V = n \\cdot V_m = ${unit(n, 'mol')} \\cdot 22{,}4\\,\\mathrm{L/mol} ${eqSign(v)} ${unit(v, 'L')}`,
          why: String.raw`Bei Normbedingungen nimmt jedes Mol eines Gases $22{,}4\,\mathrm{L}$ ein:`,
          card: CARD.vm,
        },
        rng,
        focus,
      )
    : calcStep(
        {
          id: 'stoffmenge',
          title: 'Stoffmenge',
          question: 'Wie viel Mol Gas sind das?',
          correct: n,
          wrong: [{ rule: 'chem-vm-inverted', value: ratMul(v, VM) }],
          unit: 'mol',
          hint: String.raw`Wie viele Mol passen in das Volumen, wenn ein Mol $22{,}4\,\mathrm{L}$ einnimmt?`,
          line: `n = \\frac{V}{V_m} = \\frac{${unit(v, 'L')}}{22{,}4\\,\\mathrm{L/mol}} ${eqSign(n)} ${unit(n, 'mol')}`,
          why: 'Volumen geteilt durch das molare Volumen:',
          card: CARD.vm,
        },
        rng,
        focus,
      )
  if (!step) return null
  return finish(
    ref,
    askV ? 'Berechne das Volumen' : 'Berechne die Stoffmenge',
    askV ? `${nLatex(gas)} = ${unit(n, 'mol')}` : `V(${ce(gas)}) = ${unit(v, 'L')}`,
    `${named(gas)} bei Normbedingungen ($0\\,^{\\circ}\\mathrm{C}$, $1013\\,\\mathrm{hPa}$), $V_m = 22{,}4\\,\\mathrm{L/mol}$.`,
    [step],
    askV ? `V ${eqSign(v)} ${unit(v, 'L')}` : `n ${eqSign(n)} ${unit(n, 'mol')}`,
    `gase:${level}:vm-${askV ? 'v' : 'n'}`,
    gas.id,
  )
}

// Gasgesetz: V = nRT/p, Temperatur in °C, Druck in hPa oder bar
// Gase, die sich unter Druck verflüssigen: höchster Druck in bar, deutlich unter dem Dampfdruck bei 15 °C
// (NH₃ etwa 7 bar, Cl₂ 6 bar, SO₂ 2,8 bar, Propan 7 bar, Butan 1,8 bar)
const MAX_BAR: Readonly<Record<string, number>> = { NH3: 3, Cl2: 3, SO2: 1.5, C3H8: 3, C4H10: 1.05 }
function gasLawTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  const gas = rng.pick(GASES)
  const n = rng.pick(NICE_N)
  const celsius = rng.pick([15, 20, 25, 37, 50, 80, 100, 150, 200])
  const bars = ['1.5', '2', '3', '5', '10'].filter((x) => Number(x) <= (MAX_BAR[gas.id] ?? Infinity))
  const inBar = bars.length > 0 && rng.chance(0.5)
  const pGiven = inBar ? d(rng.pick(bars)) : rat(rng.pick([950, 1000, 1013, 1050]))
  const pPa = ratMul(pGiven, rat(inBar ? 100000 : 100))
  const t = ratAdd(rat(celsius), KELVIN)
  const vOf = (tt: Rational, pp: Rational) => ratMul(ratDiv(ratMul(ratMul(n, R), tt), pp), rat(1000))
  const v = vOf(t, pPa)
  const pUnit = inBar ? 'bar' : 'hPa'
  const step = calcStep(
    {
      id: 'volumen',
      title: 'Volumen',
      question: 'Welches Volumen nimmt das Gas ein?',
      correct: v,
      wrong: [
        { rule: 'chem-celsius', value: vOf(rat(celsius), pPa) },
        { rule: 'chem-hpa', value: vOf(t, pGiven) },
        { rule: 'chem-vm-conditions', value: ratMul(n, VM) },
      ],
      unit: 'L',
      hint: 'Rechne erst alles in SI-Einheiten um: Kelvin, Pascal, Kubikmeter.',
      line: `V = \\frac{n R T}{p} = \\frac{${unit(n, 'mol')} \\cdot 8{,}314\\,\\mathrm{\\tfrac{J}{mol \\cdot K}} \\cdot ${exact(t)}\\,\\mathrm{K}}{${exact(pPa)}\\,\\mathrm{Pa}} \\cdot 1000\\,\\tfrac{\\mathrm{L}}{\\mathrm{m^3}} ${eqSign(v)} ${unit(v, 'L')}`,
      why: `Temperatur in Kelvin ($${celsius} + 273{,}15$), Druck in Pascal, Ergebnis in $\\mathrm{m^3}$, dann in Liter:`,
      card: CARD.gas,
    },
    rng,
    focus,
  )
  if (!step) return null
  return finish(
    ref,
    'Berechne das Volumen mit dem Gasgesetz',
    `${nLatex(gas)} = ${unit(n, 'mol')} \\qquad \\vartheta = ${celsius}\\,^{\\circ}\\mathrm{C} \\qquad p = ${exact(pGiven)}\\,\\mathrm{${pUnit}}`,
    `${named(gas)}, ideales Gas. Rechne mit $R = 8{,}314\\,\\mathrm{J/(mol \\cdot K)}$.`,
    [step],
    `V ${eqSign(v)} ${unit(v, 'L')}`,
    `gase:${level}:gesetz-${pUnit}`,
    gas.id,
  )
}

// Gasvolumen aus einer Reaktion bei Normbedingungen (Klausurniveau)
const GAS_REACTIONS: readonly { id: string; text: string; reactants: string[]; products: string[]; given: string; gas: string }[] = [
  { id: 'kalk', text: 'Kalk wird gebrannt', reactants: ['CaCO3'], products: ['CaO', 'CO2'], given: 'CaCO3', gas: 'CO2' },
  { id: 'chlorat', text: 'Kaliumchlorat zerfällt beim Erhitzen', reactants: ['KClO3'], products: ['KCl', 'O2'], given: 'KClO3', gas: 'O2' },
  { id: 'zink', text: 'Zink löst sich in Salzsäure', reactants: ['Zn', 'HCl'], products: ['ZnCl2', 'H2'], given: 'Zn', gas: 'H2' },
  { id: 'magnesium', text: 'Magnesium löst sich in Salzsäure', reactants: ['Mg', 'HCl'], products: ['MgCl2', 'H2'], given: 'Mg', gas: 'H2' },
  { id: 'peroxid', text: 'Wasserstoffperoxid zerfällt', reactants: ['H2O2'], products: ['H2O', 'O2'], given: 'H2O2', gas: 'O2' },
  { id: 'natron', text: 'Natron zerfällt beim Backen', reactants: ['NaHCO3'], products: ['Na2CO3', 'H2O', 'CO2'], given: 'NaHCO3', gas: 'CO2' },
  { id: 'aluminium', text: 'Aluminium löst sich in Salzsäure', reactants: ['Al', 'HCl'], products: ['AlCl3', 'H2'], given: 'Al', gas: 'H2' },
]

function gasReactionTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  const useFuel = rng.chance(0.4)
  const r = useFuel ? null : rng.pick(GAS_REACTIONS)
  const fuel = useFuel ? rng.pick(FUELS.filter((f) => f.levels.includes(3))) : null
  const eq = fuel ? balance([fuel.species, O2], [CO2, H2O])! : balance(r!.reactants.map(species), r!.products.map(species))!
  const givenSp = fuel ? fuel.species : eq.reactants.find((t) => t.species.text === r!.given)!.species
  const gasSp = fuel ? CO2 : eq.products.find((t) => t.species.text === r!.gas)!.species
  const nuG = [...eq.reactants, ...eq.products].find((t) => t.species === givenSp)!.coefficient
  const nuT = [...eq.reactants, ...eq.products].find((t) => t.species === gasSp)!.coefficient
  const values: MassValues = 'rounded'
  const sg: Substance = { id: givenSp.text, name: fuel?.name ?? SUBSTANCES.find((x) => x.id === givenSp.text)?.name ?? '', kind: 'simple', formula: givenSp.formula }
  const massG = molarMass(givenSp.formula, values)
  const mGiven = given(ratMul(rng.pick(NICE_N), massG))
  if (usesExamNumbers(`m(${ce(givenSp)}) = ${unit(mGiven, 'g')}`)) return null
  const first = nStep(sg, mGiven, massG, values, rng, focus)
  if (!first) return null
  const nG = given(first.n)
  const nT = ratMul(nG, ratDiv(nuT, nuG))
  const ratio = calcStep(
    {
      id: 'verhaeltnis',
      title: 'Verhältnis',
      question: `Wie viel Mol $${ce(gasSp)}$ entstehen?`,
      correct: nT,
      wrong: [
        { rule: 'chem-ratio-one', value: nG },
        { rule: 'chem-ratio-swapped', value: ratMul(nG, ratDiv(nuG, nuT)) },
        ...[...eq.reactants, ...eq.products]
          .filter((t) => t.species !== givenSp && t.species !== gasSp)
          .map((t) => ({ rule: 'chem-ratio-other-coefficient', value: ratMul(nG, ratDiv(t.coefficient, nuG)) })),
      ],
      unit: 'mol',
      hint: 'Die Koeffizienten der Gleichung geben das Verhältnis der Stoffmengen an.',
      line: `n(${ce(gasSp)}) = ${unit(nG, 'mol')} \\cdot \\frac{${nuT.n}}{${nuG.n}} ${eqSign(nT)} ${unit(nT, 'mol')}`,
      why: 'Verhältnis der Koeffizienten:',
      card: 'stoffmenge-umsatz',
    },
    rng,
    focus,
  )
  // Verhältnis 1 : 1 ohne andere Koeffizienten (Kalk brennen): kein eigener Schritt, n bleibt gleich
  if (!ratio && !ratEq(nuT, nuG)) return null
  const nTShown = given(nT)
  const v = ratMul(nTShown, VM)
  const vStep = calcStep(
    {
      id: 'volumen',
      title: 'Volumen',
      question: `Welches Volumen $${ce(gasSp)}$ entsteht bei Normbedingungen?`,
      correct: v,
      wrong: [
        { rule: 'chem-vm-inverted', value: ratDiv(nTShown, VM) },
        { rule: 'chem-vm-conditions', value: ratMul(nTShown, d('24.5')) },
      ],
      unit: 'L',
      hint: String.raw`Welches Volumen hat ein Mol Gas bei $0\,^{\circ}\mathrm{C}$ und $1013\,\mathrm{hPa}$?`,
      line: `V = n \\cdot V_m = ${unit(nTShown, 'mol')} \\cdot 22{,}4\\,\\mathrm{L/mol} ${eqSign(v)} ${unit(v, 'L')}`,
      why: 'Stoffmenge mal molares Volumen:',
      card: CARD.vm,
    },
    rng,
    focus,
  )
  if (!vStep) return null
  return finish(
    ref,
    'Welches Gasvolumen entsteht?',
    String.raw`\begin{gathered} ${equationLatex(eq)} \\ m(${ce(givenSp)}) = ${unit(mGiven, 'g')} \end{gathered}`,
    `${fuel ? `${fuel.name} verbrennt vollständig` : r!.text}; das Gas entsteht bei Normbedingungen ($0\\,^{\\circ}\\mathrm{C}$, $1013\\,\\mathrm{hPa}$, $V_m = 22{,}4\\,\\mathrm{L/mol}$). ${valuesNote(givenSp.formula, values)}`,
    [{ ...first.step, id: 'stoffmenge-gegeben' }, ...(ratio ? [ratio] : []), vStep],
    `V(${ce(gasSp)}) ${eqSign(v)} ${unit(v, 'L')}`,
    `gase:${level}:reaktion`,
    fuel ? fuel.id : r!.id,
  )
}

// Angaben nebeneinander (mit \qquad getrennt) stehen untereinander, damit sie auch am Handy lesbar bleiben
function stacked(latex: string): string {
  const parts = latex.split(' \\qquad ')
  return parts.length === 1 ? latex : String.raw`\begin{gathered} ${parts.join(' \\\\ ')} \end{gathered}`
}

function finish(ref: TaskRef, instruction: string, functionLatex: string, note: string, steps: GuidedStep[], resultLatex: string, form: string, substance: string): ChemCalc {
  return {
    task: { ref, instruction, functionLatex: stacked(functionLatex), note, steps, cards: [...new Set(steps.flatMap((s) => s.cards))], resultLatex },
    form,
    substance,
  }
}

// --- Erzeuger je Unterthema ---

function konzentration(level: Level, rng: Rng, ref: TaskRef, focus?: string) {
  return level === 1 || rng.chance(0.25) ? concTask(level, rng, ref, focus) : prepareTask(level, rng, ref, focus)
}

function anteile(level: Level, rng: Rng, ref: TaskRef, focus?: string) {
  if (level === 1) return fractionTask(level, rng, ref, focus)
  const kind = rng.pick(['w', 'beta', 'ppm', 'vol'])
  if (kind === 'w') return fractionTask(level, rng, ref, focus)
  if (kind === 'beta') return betaTask(level, rng, ref, focus)
  if (kind === 'ppm') return ppmTask(level, rng, ref, focus)
  return volTask(level, rng, ref, focus)
}

function gase(level: Level, rng: Rng, ref: TaskRef, focus?: string) {
  if (level === 1) return vmTask(level, rng, ref, focus)
  if (level === 2) return rng.chance(0.3) ? vmTask(level, rng, ref, focus) : gasLawTask(level, rng, ref, focus)
  return rng.chance(0.5) ? gasReactionTask(level, rng, ref, focus) : gasLawTask(level, rng, ref, focus)
}

export const LOESUNGEN_GENERATORS: readonly ChemGenerator[] = [
  {
    kind: 'konzentration',
    free: true,
    part: 'konzentration',
    weights: { 1: 0.35, 2: 0.35, 3: 0.35 },
    errors: ['chem-ml-not-l', 'chem-c-inverted', 'chem-molar-incomplete', 'chem-molar-hydrate', 'chem-molar-index', 'chem-molar-atomic-number', 'chem-m-divided'],
    generate: konzentration,
  },
  {
    kind: 'anteile',
    free: true,
    part: 'anteile',
    weights: { 1: 0.3, 2: 0.35, 3: 0.3 },
    errors: ['chem-fraction-solvent', 'chem-vol-percent', 'chem-percent-not-times', 'chem-ml-not-l', 'chem-mass-conc-inverted', 'chem-ppb'],
    generate: anteile,
  },
  {
    kind: 'gase',
    free: true,
    part: 'gase',
    weights: { 1: 0.35, 2: 0.3, 3: 0.35 },
    errors: ['chem-vm-inverted', 'chem-vm-conditions', 'chem-celsius', 'chem-hpa', 'chem-ratio-one', 'chem-ratio-swapped', 'chem-ratio-other-coefficient', 'chem-n-times', 'chem-n-inverted'],
    generate: gase,
  },
]
