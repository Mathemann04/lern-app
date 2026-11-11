import type { Explanation } from '../../explain/texts.ts'
import type { GuidedStep } from '../../guided/types.ts'
import { formatLatex, roundSignificant } from '../../quantity/numberDe.ts'
import type { Rng } from '../../random/rng.ts'
import { type Rational, parseDecimal, rat, ratDiv, ratEq, ratMul, toDecimalString } from '../../rational.ts'
import type { Level, TaskRef } from '../../tasks/taskNumber.ts'
import { elementBySymbol } from '../elements.ts'
import { type CountMode, atomCounts, formulaLatex, hasBracket } from '../formula.ts'
import { type MassValues, atomicNumberSum, elementMolarMass, molarMass } from '../molarMass.ts'
import { type Substance, substancesOf } from '../substances.ts'
import { type ChemCalc, type ChemGenerator, type WrongValue, stepChoices, tolerantNumeric, tolerantWrongs, unitOf, usesExamNumbers } from './shared.ts'

// Rechnungen zum Thema „Stoffmenge und Umsatz" (Plan M4, Thema 4.2; Umsatz kommt mit S4):
// - Molmasse (Unterthema „molmasse"): Atome zählen → Molmasse als Summe. Grundlagen einfache Formeln
//   mit ganzen Werten aus der Aufgabe, Vertiefung Klammern und Kristallwasser mit dem PSE der App,
//   Klausurniveau Klammern und Kristallwasser mit ganzen Werten
// - Stoffmenge, Masse und Teilchenzahl (Unterthema „stoffmenge"): n = m : M, m = n · M, N = n · N_A,
//   ab Vertiefung mit der Molmasse als erstem Schritt, auf Klausurniveau auch Atome eines Elements
// Jede Aufgabe nennt die Werte, mit denen sie rechnet (Molmassen der Elemente, N_A).

// N_A = 6,022 · 10²³ 1/mol
const NA = rat(6022n * 10n ** 20n)
const NA_LATEX = String.raw`6{,}022 \cdot 10^{23}\,\mathrm{mol^{-1}}`

// --- Schreibweise ---

// Molmasse: aus dem PSE der App immer mit einer Nachkommastelle (18,0), aus der Aufgabe wie gegeben (18; 35,5)
function massLatex(r: Rational, values: MassValues): string {
  const text = toDecimalString(r)!
  const padded = values === 'pse' && !text.includes(',') ? `${text},0` : text
  return padded.replace(',', '{,}')
}
export const molarLatex = (r: Rational, values: MassValues) => String.raw`${massLatex(r, values)}\,\mathrm{g/mol}`
export const sig = (r: Rational) => formatLatex(r)
// „=" bei genauen Werten, sonst „≈"
export const eqSign = (r: Rational) => (ratEq(roundSignificant(r).value, r) ? '=' : String.raw`\approx`)
export const ce = (s: Substance) => formulaLatex(s.formula)

const UNITS = { m: String.raw`\,\mathrm{g}`, n: String.raw`\,\mathrm{mol}`, N: '' } as const

// Werte, mit denen die Aufgabe rechnet
export function valuesNote(s: Substance, values: MassValues): string {
  const list = [...atomCounts(s.formula).keys()].map((symbol) => `$M(\\ce{${symbol}}) = ${molarLatex(elementMolarMass(symbol, values), values)}$`)
  const joined = list.length === 1 ? list[0] : `${list.slice(0, -1).join(', ')} und ${list[list.length - 1]}`
  return values === 'pse' ? `Werte aus dem PSE: ${joined}.` : `Rechne mit ${joined}.`
}

// --- Molmasse als Schritte ---

const countText = (counts: Map<string, number>) => [...counts].map(([symbol, n]) => `$\\ce{${symbol}}$: ${n}`).join(', ')
const countLatex = (counts: Map<string, number>) => [...counts].map(([symbol, n]) => `\\ce{${symbol}}\\text{: } ${n}`).join(',\\ ')

// Zählweisen typischer Fehler (nur, wo sie in der Formel etwas ändern)
function countErrors(s: Substance): { rule: string; mode: CountMode }[] {
  return [
    { rule: 'chem-molar-index', mode: { ignoreIndices: true } },
    ...(hasBracket(s.formula) ? [{ rule: 'chem-molar-bracket', mode: { bracketOnLast: true } }] : []),
    ...(s.formula.adducts.length > 0 ? [{ rule: 'chem-molar-hydrate', mode: { withoutAdducts: true } }] : []),
  ]
}

const CARD_MOLAR = 'stoffmenge-molmasse'
const CARD_FORMULA = 'stoffmenge-formeln'
const CARD_NMM = 'stoffmenge-n-m-m'
const CARD_MOL = 'stoffmenge-mol'
const CARD_ATOMS = 'stoffmenge-atome'

// Schritte „Atome zählen" (nur, wenn ein Fehler dort etwas ändert) und „Molmasse"; dazu die Molmasse.
// coefficient: Koeffizient des Stoffs in der Gleichung der Aufgabe (Fehler „Koeffizient mitgerechnet")
export function molarSteps(s: Substance, values: MassValues, rng: Rng, focus?: string, coefficient?: Rational): { steps: GuidedStep[]; mass: Rational } | null {
  const counts = atomCounts(s.formula)
  const mass = molarMass(s.formula, values)
  const steps: GuidedStep[] = []
  const formulaCard = hasBracket(s.formula) || s.formula.adducts.length > 0 ? [CARD_FORMULA] : []

  const countWrong: WrongValue[] = countErrors(s).map(({ rule, mode }) => {
    const text = countText(atomCounts(s.formula, mode))
    return { rule, key: text, content: text }
  })
  const countChoices = stepChoices(rng, { key: countText(counts), content: countText(counts) }, countWrong, focus)
  if (countChoices.length > 0) {
    steps.push({
      id: 'atome',
      title: 'Atome zählen',
      question: `Wie viele Atome jedes Elements stecken in $${ce(s)}$?`,
      choices: countChoices,
      hint: [
        'Ein Index gilt für das Elementsymbol direkt davor.',
        hasBracket(s.formula) ? 'Steht er hinter einer Klammer, gilt er für alles in der Klammer.' : '',
        s.formula.adducts.length > 0 ? 'Das Kristallwasser hinter dem Malpunkt zählt mit.' : '',
      ]
        .filter(Boolean)
        .join(' '),
      explanation: {
        detailed: `In $${ce(s)}$ stecken ${countText(counts)}. Jeder Index zählt das Atom (oder die Klammer) davor, eine Zahl vor $\\ce{H2O}$ im Kristallwasser gilt für das ganze Wassermolekül.`,
        short: `${countText(counts)}.`,
      },
      established: countLatex(counts),
      cards: [CARD_FORMULA],
    })
  }

  const terms = [...counts].map(([symbol, n]) => `${n === 1 ? '' : `${n} \\cdot `}${massLatex(elementMolarMass(symbol, values), values)}`)
  const sumLatex = `M(${ce(s)}) = ${terms.join(' + ')} = ${molarLatex(mass, values)}`
  const massWrong = tolerantWrongs(
    mass,
    [
      ...countErrors(s).map(({ rule, mode }) => ({ rule, value: molarMass(s.formula, values, mode) })),
      { rule: 'chem-molar-atomic-number', value: atomicNumberSum(s.formula) },
      ...(coefficient && coefficient.d === 1n && coefficient.n > 1n ? [{ rule: 'chem-molar-coefficient', value: ratMul(mass, coefficient) }] : []),
    ],
    (r) => molarLatex(r, values),
  )
  const massChoices = stepChoices(rng, { key: molarLatex(mass, values), content: `$${molarLatex(mass, values)}$` }, massWrong, focus)
  if (massChoices.length === 0) return null
  steps.push({
    id: 'molmasse',
    title: 'Molmasse',
    question: `Wie groß ist die molare Masse $M(${ce(s)})$?`,
    choices: massChoices,
    numeric: tolerantNumeric(mass, massWrong, String.raw`\mathrm{g/mol}`),
    hint: 'Nimm die Molmasse jedes Elements so oft, wie das Atom in der Formel vorkommt, und zähle alles zusammen.',
    explanation: {
      detailed: `Die molare Masse ist die Summe der Molmassen aller Atome der Formel: $${sumLatex}$.`,
      short: `$${sumLatex}$`,
    },
    established: sumLatex,
    cards: [CARD_MOLAR, ...formulaCard],
  })
  return { steps, mass }
}

// --- Stoffmenge, Masse, Teilchenzahl als Schritte ---

type Quantity = { readonly value: Rational; readonly latex: string }

export function amountStep(id: string, correct: Quantity, wrong: { rule: string; value: Rational }[], unit: string, parts: Omit<GuidedStep, 'id' | 'choices'>, rng: Rng, focus?: string): GuidedStep | null {
  const latex = (r: Rational) => `${sig(r)}${unit}`
  const wrongValues = tolerantWrongs(correct.value, wrong, latex)
  const choices = stepChoices(rng, { key: latex(correct.value), content: `$${latex(correct.value)}$` }, wrongValues, focus)
  return choices.length === 0 ? null : { id, choices, numeric: tolerantNumeric(correct.value, wrongValues, unitOf(unit)), ...parts }
}

// gerundet wie in einer Aufgabe (drei gültige Ziffern); auch Zwischenwerte: Ein Folgeschritt rechnet mit der
// angezeigten Zahl weiter, wie man es in der Klausur tut, damit jede gezeigte Rechnung für sich stimmt
export const given = (r: Rational) => roundSignificant(r).value

// „schöne" Stoffmengen in mol, aus denen die gegebenen Werte entstehen
export const NICE_N = ['0.05', '0.1', '0.15', '0.2', '0.25', '0.3', '0.4', '0.5', '0.75', '1.5', '2', '2.5', '3', '4'].map((t) => parseDecimal(t)!)

type Subtype = 'n-from-m' | 'm-from-n' | 'N-from-n' | 'N-from-m' | 'm-from-N' | 'atoms-from-m'
const SUBTYPES: Readonly<Record<1 | 2 | 3, readonly Subtype[]>> = {
  1: ['n-from-m', 'm-from-n', 'N-from-n'],
  2: ['n-from-m', 'm-from-n', 'N-from-m'],
  3: ['N-from-m', 'm-from-N', 'atoms-from-m'],
}

export const nLatex = (s: Substance) => `n(${ce(s)})`
export const mLatex = (s: Substance) => `m(${ce(s)})`

export function nStep(s: Substance, m: Rational, mass: Rational, values: MassValues, rng: Rng, focus?: string): { step: GuidedStep; n: Rational } | null {
  const n = ratDiv(m, mass)
  const line = `${nLatex(s)} = \\frac{m}{M} = \\frac{${sig(m)}\\,\\mathrm{g}}{${molarLatex(mass, values)}} ${eqSign(n)} ${sig(n)}\\,\\mathrm{mol}`
  const step = amountStep(
    'stoffmenge',
    { value: n, latex: sig(n) },
    [
      { rule: 'chem-n-times', value: ratMul(m, mass) },
      { rule: 'chem-n-inverted', value: ratDiv(mass, m) },
    ],
    UNITS.n,
    {
      title: 'Stoffmenge',
      question: `Wie groß ist die Stoffmenge $${nLatex(s)}$?`,
      hint: 'Welche Einheit muss herauskommen? Gramm geteilt durch Gramm je Mol ergibt Mol.',
      explanation: explain(`Die Stoffmenge ist die Masse geteilt durch die molare Masse: $${line}$.`, `$${line}$`),
      established: line,
      cards: [CARD_NMM],
    },
    rng,
    focus,
  )
  return step && { step, n }
}

function mStep(s: Substance, n: Rational, mass: Rational, values: MassValues, rng: Rng, focus?: string): GuidedStep | null {
  const m = ratMul(n, mass)
  const line = `${mLatex(s)} = n \\cdot M = ${sig(n)}\\,\\mathrm{mol} \\cdot ${molarLatex(mass, values)} ${eqSign(m)} ${sig(m)}\\,\\mathrm{g}`
  return amountStep(
    'masse',
    { value: m, latex: sig(m) },
    [
      { rule: 'chem-m-divided', value: ratDiv(n, mass) },
      { rule: 'chem-m-divided', value: ratDiv(mass, n) },
    ],
    UNITS.m,
    {
      title: 'Masse',
      question: `Wie groß ist die Masse $${mLatex(s)}$?`,
      hint: 'Mol mal Gramm je Mol ergibt Gramm.',
      explanation: explain(`Die Masse ist die Stoffmenge mal die molare Masse: $${line}$.`, `$${line}$`),
      established: line,
      cards: [CARD_NMM],
    },
    rng,
    focus,
  )
}

function particleStep(s: Substance, n: Rational, rng: Rng, focus?: string): { step: GuidedStep; count: Rational } | null {
  const count = ratMul(n, NA)
  const line = `N = n \\cdot N_A = ${sig(n)}\\,\\mathrm{mol} \\cdot ${NA_LATEX} ${eqSign(count)} ${sig(count)}`
  const step = amountStep(
    'teilchen',
    { value: count, latex: sig(count) },
    [
      { rule: 'chem-particles-divided', value: ratDiv(n, NA) },
      { rule: 'chem-particles-divided', value: ratDiv(NA, n) },
    ],
    UNITS.N,
    {
      title: 'Teilchenzahl',
      question: `Wie viele Moleküle bzw. Formeleinheiten $${ce(s)}$ sind das?`,
      hint: 'Ein Mol enthält $N_A$ Teilchen. Sind es mehr oder weniger Teilchen als Mol?',
      explanation: explain(`Jedes Mol enthält $N_A = ${NA_LATEX}$ Teilchen: $${line}$.`, `$${line}$`),
      established: line,
      cards: [CARD_MOL],
    },
    rng,
    focus,
  )
  return step && { step, count }
}

function nFromParticlesStep(s: Substance, count: Rational, rng: Rng, focus?: string): { step: GuidedStep; n: Rational } | null {
  const n = ratDiv(count, NA)
  const line = `${nLatex(s)} = \\frac{N}{N_A} = \\frac{${sig(count)}}{${NA_LATEX}} ${eqSign(n)} ${sig(n)}\\,\\mathrm{mol}`
  const step = amountStep(
    'stoffmenge',
    { value: n, latex: sig(n) },
    [
      { rule: 'chem-particles-divided', value: ratMul(count, NA) },
      { rule: 'chem-particles-divided', value: ratDiv(NA, count) },
    ],
    UNITS.n,
    {
      title: 'Stoffmenge',
      question: `Wie groß ist die Stoffmenge $${nLatex(s)}$?`,
      hint: 'Wie viele Teilchen stecken in einem Mol?',
      explanation: explain(`Die Stoffmenge zählt die Teilchen in Mol: $${line}$.`, `$${line}$`),
      established: line,
      cards: [CARD_MOL],
    },
    rng,
    focus,
  )
  return step && { step, n }
}

function atomStep(s: Substance, symbol: string, index: number, molecules: Rational, rng: Rng, focus?: string): GuidedStep | null {
  const atoms = ratMul(molecules, rat(index))
  const name = elementBySymbol(symbol)!.name
  const line = `N(\\ce{${symbol}}) = ${index} \\cdot ${sig(molecules)} ${eqSign(atoms)} ${sig(atoms)}`
  return amountStep(
    'atome-element',
    { value: atoms, latex: sig(atoms) },
    [{ rule: 'chem-atoms-molecules', value: molecules }],
    UNITS.N,
    {
      title: `${name}atome`,
      question: `Wie viele ${name}atome sind das?`,
      hint: `Wie viele ${name}atome stecken in einem einzigen Teilchen $${ce(s)}$?`,
      explanation: explain(`Jedes Teilchen $${ce(s)}$ enthält ${index} ${name}atome: $${line}$.`, `$${line}$`),
      established: line,
      cards: [CARD_ATOMS],
    },
    rng,
    focus,
  )
}

export const explain = (detailed: string, short: string): Explanation => ({ detailed, short })

// --- Erzeuger ---

export const valuesOf = (level: Level): MassValues => (level === 2 ? 'pse' : 'rounded')

function substancesFor(level: Level, molarOnly: boolean): readonly Substance[] {
  if (level === 1) return substancesOf('simple')
  if (level === 2) return molarOnly ? substancesOf('bracket', 'hydrate', 'simple') : substancesOf('simple', 'bracket', 'hydrate')
  // Klausurniveau: Molmasse nur mit Klammern und Kristallwasser, Stoffmenge mit allen Stoffen (wie in der Klausur)
  return molarOnly ? substancesOf('bracket', 'hydrate') : substancesOf('simple', 'bracket', 'hydrate')
}

function molarTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  const pool = substancesFor(level, true)
  // Vertiefung: zu drei Vierteln Klammern und Kristallwasser
  const s = level === 2 && rng.chance(0.75) ? rng.pick(pool.filter((x) => x.kind !== 'simple')) : rng.pick(pool)
  const values = valuesOf(level)
  const result = molarSteps(s, values, rng, focus)
  if (!result) return null
  const steps = result.steps
  return {
    task: {
      ref,
      instruction: 'Berechne die molare Masse',
      functionLatex: ce(s),
      note: `${s.name}. ${valuesNote(s, values)}`,
      steps,
      cards: [...new Set(steps.flatMap((x) => x.cards))],
      resultLatex: `M(${ce(s)}) = ${molarLatex(result.mass, values)}`,
    },
    form: `molmasse:${level}:${s.kind}`,
    substance: s.id,
  }
}

function amountTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  const subtype = rng.pick(SUBTYPES[level as 1 | 2 | 3])
  let pool = substancesFor(level, false)
  // Atome eines Elements: nur Elemente mit Index größer 1, sonst wäre der Fehler keiner
  const multi = (x: Substance) => [...atomCounts(x.formula)].filter(([, n]) => n > 1)
  if (subtype === 'atoms-from-m') pool = pool.filter((x) => multi(x).length > 0)
  const s = rng.pick(pool)
  const values = valuesOf(level)
  const mass = molarMass(s.formula, values)
  const nNice = rng.pick(NICE_N)
  const steps: GuidedStep[] = []
  // Grundlagen: Molmasse steht in der Aufgabe; sonst ist sie der erste Rechenschritt
  const withMolarStep = level >= 2 && subtype !== 'N-from-n'
  if (withMolarStep) {
    const molar = molarSteps(s, values, rng, focus)
    if (!molar) return null
    // nur der Schritt „Molmasse" (das Zählen der Atome übt die Rechnung „Molmasse")
    steps.push(...molar.steps.filter((x) => x.id === 'molmasse'))
  }

  let instruction: string
  let givenLatex: string
  let resultLatex: string
  switch (subtype) {
    case 'n-from-m': {
      const m = given(ratMul(nNice, mass))
      const r = nStep(s, m, mass, values, rng, focus)
      if (!r) return null
      steps.push(r.step)
      instruction = 'Berechne die Stoffmenge'
      givenLatex = `${mLatex(s)} = ${sig(m)}\\,\\mathrm{g}`
      resultLatex = `${nLatex(s)} ${eqSign(r.n)} ${sig(r.n)}\\,\\mathrm{mol}`
      break
    }
    case 'm-from-n': {
      const step = mStep(s, nNice, mass, values, rng, focus)
      if (!step) return null
      steps.push(step)
      const m = ratMul(nNice, mass)
      instruction = 'Berechne die Masse'
      givenLatex = `${nLatex(s)} = ${sig(nNice)}\\,\\mathrm{mol}`
      resultLatex = `${mLatex(s)} ${eqSign(m)} ${sig(m)}\\,\\mathrm{g}`
      break
    }
    case 'N-from-n': {
      const r = particleStep(s, nNice, rng, focus)
      if (!r) return null
      steps.push(r.step)
      instruction = 'Berechne die Zahl der Teilchen'
      givenLatex = `${nLatex(s)} = ${sig(nNice)}\\,\\mathrm{mol}`
      resultLatex = `N ${eqSign(r.count)} ${sig(r.count)}`
      break
    }
    case 'N-from-m': {
      const m = given(ratMul(nNice, mass))
      const a = nStep(s, m, mass, values, rng, focus)
      if (!a) return null
      const b = particleStep(s, given(a.n), rng, focus)
      if (!b) return null
      steps.push(a.step, b.step)
      instruction = 'Berechne die Zahl der Teilchen'
      givenLatex = `${mLatex(s)} = ${sig(m)}\\,\\mathrm{g}`
      resultLatex = `N ${eqSign(b.count)} ${sig(b.count)}`
      break
    }
    case 'm-from-N': {
      const count = given(ratMul(nNice, NA))
      const a = nFromParticlesStep(s, count, rng, focus)
      if (!a) return null
      const step = mStep(s, given(a.n), mass, values, rng, focus)
      if (!step) return null
      steps.push(a.step, step)
      const m = ratMul(given(a.n), mass)
      instruction = 'Berechne die Masse'
      givenLatex = `N(${ce(s)}) = ${sig(count)}`
      resultLatex = `${mLatex(s)} ${eqSign(m)} ${sig(m)}\\,\\mathrm{g}`
      break
    }
    case 'atoms-from-m': {
      const [symbol, index] = rng.pick(multi(s))
      const m = given(ratMul(nNice, mass))
      const a = nStep(s, m, mass, values, rng, focus)
      if (!a) return null
      const b = particleStep(s, given(a.n), rng, focus)
      if (!b) return null
      const c = atomStep(s, symbol, index, given(b.count), rng, focus)
      if (!c) return null
      steps.push(a.step, b.step, c)
      const atoms = ratMul(given(b.count), rat(index))
      instruction = `Wie viele ${elementBySymbol(symbol)!.name}atome sind enthalten?`
      givenLatex = `${mLatex(s)} = ${sig(m)}\\,\\mathrm{g}`
      resultLatex = `N(\\ce{${symbol}}) ${eqSign(atoms)} ${sig(atoms)}`
      break
    }
  }

  if (usesExamNumbers(givenLatex)) return null
  const needsNA = subtype !== 'n-from-m' && subtype !== 'm-from-n'
  const massNote = withMolarStep ? valuesNote(s, values) : `$M(${ce(s)}) = ${molarLatex(mass, values)}$.`
  return {
    task: {
      ref,
      instruction,
      functionLatex: givenLatex,
      note: `${s.name}. ${subtype === 'N-from-n' ? '' : `${massNote} `}${needsNA ? `$N_A = ${NA_LATEX}$.` : ''}`.trim(),
      steps,
      cards: [...new Set(steps.flatMap((x) => x.cards))],
      resultLatex,
    },
    form: `stoffmenge:${level}:${subtype}`,
    substance: s.id,
  }
}

export const MOLAR_ERRORS = ['chem-molar-index', 'chem-molar-bracket', 'chem-molar-hydrate', 'chem-molar-atomic-number']

export const STOFFMENGE_GENERATORS: readonly ChemGenerator[] = [
  {
    kind: 'molmasse',
    free: true,
    part: 'molmasse',
    weights: { 1: 0.45, 2: 0.4, 3: 0.3 },
    errors: MOLAR_ERRORS,
    generate: molarTask,
  },
  {
    kind: 'stoffmenge',
    free: true,
    part: 'stoffmenge',
    weights: { 1: 0.55, 2: 0.6, 3: 0.7 },
    errors: [...MOLAR_ERRORS, 'chem-n-times', 'chem-n-inverted', 'chem-m-divided', 'chem-particles-divided', 'chem-atoms-molecules'],
    generate: amountTask,
  },
]
