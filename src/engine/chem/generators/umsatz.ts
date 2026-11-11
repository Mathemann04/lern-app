import type { GuidedStep } from '../../guided/types.ts'
import type { Rng } from '../../random/rng.ts'
import { type Rational, ratDiv, ratMul } from '../../rational.ts'
import type { Level, TaskRef } from '../../tasks/taskNumber.ts'
import { elementBySymbol } from '../elements.ts'
import { type Equation, type Species, balance, equationLatex } from '../equation.ts'
import { atomCounts, formulaLatex, parseFormula } from '../formula.ts'
import { type MassValues, elementMolarMass, molarMass } from '../molarMass.ts'
import { CO2, FUELS, H2O, O2, REACTIONS } from '../reactions.ts'
import { type Substance, SUBSTANCES } from '../substances.ts'
import { type ChemCalc, type ChemGenerator, stepChoices, tolerantNumeric, tolerantWrongs, usesExamNumbers } from './shared.ts'
import { NICE_N, eqSign, given, mLatex, molarLatex, molarSteps, nLatex, nStep, sig, valuesOf } from './stoffmenge.ts'

// Rechnung „Umsatz" (Plan M4, Thema 4.2, Klausur 4c) in drei Schritten: Stoffmenge des gegebenen Stoffs →
// Stoffmenge des gesuchten über das Verhältnis der Koeffizienten → Masse des gesuchten Stoffs.
// Gegeben ist meist ein Edukt; manchmal ist ein Produkt gegeben und der Bedarf an einem Edukt gesucht (so rechnet das
// Skript Stöchiometrie, Folie 12). Gleichgewichtsreaktionen (reactions.ts, equilibrium) laufen nie vollständig ab und
// kommen deshalb hier nicht vor (docs/CHEMIE.md §3 und §5).
// - Grundlagen: einfache Reaktionen und Verbrennungen, die Molmassen stehen in der Aufgabe
// - Vertiefung: auch größere Reaktionen, Molmassen mit dem PSE der App als eigene Schritte
// - Klausurniveau: Verbrennungen aller Alkane und Alkohole und größere Reaktionen, ganze Werte aus der
//   Aufgabe, Molmassen als eigene Schritte (wie Klausuraufgabe 4)
// Die Gleichung steht ausgeglichen in der Aufgabe (Ausgleichen übt das Thema „Reaktionsgleichungen").
// Folgeschritte rechnen mit dem angezeigten, gerundeten Zwischenwert weiter.

const CARD_UMSATZ = 'stoffmenge-umsatz'


// Name eines Stoffes, soweit bekannt (Stoffliste, Brennstoffe, Elemente); sonst nur die Formel
function nameOf(s: Species): string {
  const fromList = SUBSTANCES.find((x) => x.id === s.text)?.name ?? FUELS.find((f) => f.id === s.text)?.name
  if (fromList) return fromList
  const counts = atomCounts(s.formula)
  if (counts.size === 1) return elementBySymbol([...counts.keys()][0])!.name
  return ''
}

const asSubstance = (s: Species): Substance => ({ id: s.text, name: nameOf(s), kind: 'simple', formula: s.formula })
const withName = (s: Species) => (nameOf(s) ? `${nameOf(s)} $${formulaLatex(s.formula)}$` : `$${formulaLatex(s.formula)}$`)

// ähnlicher Stoff, dessen Molmasse man versehentlich nimmt (CO statt CO₂ …)
const SIMILAR: Readonly<Record<string, string>> = { CO2: 'CO', CO: 'CO2', SO3: 'SO2', SO2: 'SO3', H2O: 'H2O2', H2O2: 'H2O', NO2: 'NO', NO: 'NO2' }

// Werte aller Elemente beider Stoffe
function valuesNote(list: readonly Species[], values: MassValues): string {
  const symbols = [...new Set(list.flatMap((s) => [...atomCounts(s.formula).keys()]))]
  const parts = symbols.map((symbol) => `$M(\\ce{${symbol}}) = ${molarLatex(elementMolarMass(symbol, values), values)}$`)
  const joined = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} und ${parts[parts.length - 1]}`
  return values === 'pse' ? `Werte aus dem PSE: ${joined}.` : `Rechne mit ${joined}.`
}

type Choice = { readonly equation: Equation; readonly given: Species; readonly target: Species; readonly id: string }

// Anteil der Aufgaben, in denen ein Produkt gegeben und der Bedarf an einem Edukt gesucht ist
const FROM_PRODUCT = 0.3
// Reaktionen, die vollständig ablaufen (ohne Gleichgewichte)
export const UMSATZ_REACTIONS = REACTIONS.filter((r) => !r.equilibrium)

function pickReaction(level: Level, rng: Rng): Choice | null {
  const combustion = level === 3 ? rng.chance(0.7) : rng.chance(0.35)
  const fromProduct = rng.chance(FROM_PRODUCT)
  if (combustion) {
    const fuel = rng.pick(FUELS.filter((f) => f.levels.includes(level as 1 | 2 | 3)))
    const equation = balance([fuel.species, O2], [CO2, H2O])!
    // gegeben ein Produkt: Wie viel Brennstoff oder Sauerstoff ist dafür nötig?
    if (fromProduct) return { equation, given: rng.pick([CO2, H2O]), target: rng.pick([fuel.species, fuel.species, O2]), id: `verbrennung-${fuel.id}` }
    // gesucht: meist ein Produkt, manchmal der Bedarf an Sauerstoff
    const target = rng.pick([CO2, H2O, CO2, O2])
    return { equation, given: fuel.species, target, id: `verbrennung-${fuel.id}` }
  }
  const pool = UMSATZ_REACTIONS.filter((r) => r.levels.some((l) => l <= level))
  const reaction = rng.pick(pool)
  const equation = balance(reaction.reactants, reaction.products)!
  if (fromProduct) return { equation, given: rng.pick(reaction.products), target: rng.pick(reaction.reactants), id: reaction.id }
  const givenSpecies = rng.pick(reaction.reactants)
  const others = [...reaction.reactants, ...reaction.products].filter((s) => s !== givenSpecies)
  return { equation, given: givenSpecies, target: rng.pick(others), id: reaction.id }
}

const coefficientOf = (eq: Equation, s: Species) => [...eq.reactants, ...eq.products].find((t) => t.species === s)!.coefficient

function generate(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  const picked = pickReaction(level, rng)
  if (!picked) return null
  const { equation, target } = picked
  const g = picked.given
  const values = valuesOf(level)
  const massG = molarMass(g.formula, values)
  const massT = molarMass(target.formula, values)
  const nuG = coefficientOf(equation, g)
  const nuT = coefficientOf(equation, target)
  const mGiven = given(ratMul(rng.pick(NICE_N), massG))
  if (usesExamNumbers(`${mLatex(asSubstance(g))} = ${sig(mGiven)}\\,\\mathrm{g}`)) return null
  const sg = asSubstance(g)
  const st = asSubstance(target)
  const steps: GuidedStep[] = []

  // 1. Molmasse und Stoffmenge des gegebenen Stoffs
  const withMolar = level >= 2
  if (withMolar) {
    const molar = molarSteps(sg, values, rng, focus, nuG)
    if (!molar) return null
    steps.push(...molar.steps.filter((s) => s.id === 'molmasse').map((s) => ({ ...s, id: 'molmasse-gegeben' })))
  }
  const first = nStep(sg, mGiven, massG, values, rng, focus)
  if (!first) return null
  steps.push({ ...first.step, id: 'stoffmenge-gegeben' })
  const nG = given(first.n)

  // 2. Verhältnis der Koeffizienten
  const nT = ratMul(nG, ratDiv(nuT, nuG))
  const ratioLine = `${nLatex(st)} = ${nLatex(sg)} \\cdot \\frac{${nuT.n}}{${nuG.n}} = ${sig(nG)}\\,\\mathrm{mol} \\cdot \\frac{${nuT.n}}{${nuG.n}} ${eqSign(nT)} ${sig(nT)}\\,\\mathrm{mol}`
  const molLatex = (r: Rational) => `${sig(r)}\\,\\mathrm{mol}`
  const ratioWrong = tolerantWrongs(
      nT,
      [
        { rule: 'chem-ratio-one', value: nG },
        { rule: 'chem-ratio-swapped', value: ratMul(nG, ratDiv(nuG, nuT)) },
        { rule: 'chem-ratio-product-only', value: ratMul(nG, nuT) },
        // Koeffizient eines anderen Stoffs der Gleichung erwischt (wichtig, wenn das Verhältnis 1 : 1 ist)
        ...[...equation.reactants, ...equation.products]
          .filter((t) => t.species !== g && t.species !== target)
          .map((t) => ({ rule: 'chem-ratio-other-coefficient', value: ratMul(nG, ratDiv(t.coefficient, nuG)) })),
      ],
      molLatex,
    )
  const ratioChoices = stepChoices(rng, { key: molLatex(nT), content: `$${molLatex(nT)}$` }, ratioWrong, focus)
  if (ratioChoices.length === 0) return null
  steps.push({
    id: 'verhaeltnis',
    title: 'Verhältnis',
    question: `Wie groß ist die Stoffmenge $${nLatex(st)}$?`,
    choices: ratioChoices,
    numeric: tolerantNumeric(nT, ratioWrong, String.raw`\mathrm{mol}`),
    hint: 'Die Koeffizienten der Gleichung sagen, wie viele Teilchen der beiden Stoffe zusammengehören.',
    explanation: {
      detailed: `Laut Gleichung gehören zu ${nuG.n} Teilchen $${formulaLatex(g.formula)}$ genau ${nuT.n} Teilchen $${formulaLatex(target.formula)}$; dasselbe Verhältnis gilt für die Stoffmengen: $${ratioLine}$.`,
      short: `$${ratioLine}$`,
    },
    established: ratioLine,
    cards: [CARD_UMSATZ],
  })
  const nTShown = given(nT)

  // 3. Molmasse und Masse des gesuchten Stoffs
  if (withMolar) {
    const molar = molarSteps(st, values, rng, focus, nuT)
    if (!molar) return null
    steps.push(...molar.steps.filter((s) => s.id === 'molmasse').map((s) => ({ ...s, id: 'molmasse-gesucht' })))
  }
  const mT = ratMul(nTShown, massT)
  const gLatex = (r: Rational) => `${sig(r)}\\,\\mathrm{g}`
  const similar = SIMILAR[target.text]
  const massLine = `${mLatex(st)} = n \\cdot M = ${sig(nTShown)}\\,\\mathrm{mol} \\cdot ${molarLatex(massT, values)} ${eqSign(mT)} ${sig(mT)}\\,\\mathrm{g}`
  const massWrong = tolerantWrongs(
    mT,
    [
      { rule: 'chem-m-divided', value: ratDiv(nTShown, massT) },
      { rule: 'chem-ratio-wrong-molar-mass', value: ratMul(nTShown, massG) },
      ...(similar ? [{ rule: 'chem-similar-molar-mass', value: ratMul(nTShown, molarMass(parseFormula(similar), values)) }] : []),
    ],
    gLatex,
  )
  const massChoices = stepChoices(rng, { key: gLatex(mT), content: `$${gLatex(mT)}$` }, massWrong, focus)
  if (massChoices.length === 0) return null
  steps.push({
    id: 'masse-gesucht',
    title: 'Masse',
    question: `Wie groß ist die Masse $${mLatex(st)}$?`,
    choices: massChoices,
    numeric: tolerantNumeric(mT, massWrong, String.raw`\mathrm{g}`),
    hint: 'Welche Molmasse gehört zu dem Stoff, nach dem gefragt ist?',
    explanation: { detailed: `Stoffmenge mal molare Masse des gesuchten Stoffs: $${massLine}$.`, short: `$${massLine}$` },
    established: massLine,
    cards: [CARD_UMSATZ],
  })

  const molarNote = withMolar
    ? valuesNote([g, target], values)
    : `$M(${formulaLatex(g.formula)}) = ${molarLatex(massG, values)}$, $M(${formulaLatex(target.formula)}) = ${molarLatex(massT, values)}$.`
  const isTargetReactant = equation.reactants.some((t) => t.species === target)
  const isGivenProduct = equation.products.some((t) => t.species === g)
  const what = isGivenProduct
    ? `Es soll ${withName(g)} entstehen; gesucht ist, wie viel ${withName(target)} dafür nötig ist.`
    : `Gegeben ist ${withName(g)}, gesucht ${withName(target)}.`
  return {
    task: {
      ref,
      instruction: isTargetReactant ? 'Berechne, wie viel gebraucht wird' : 'Berechne, wie viel entsteht',
      functionLatex: String.raw`\begin{gathered} ${equationLatex(equation)} \\ ${mLatex(sg)} = ${sig(mGiven)}\,\mathrm{g} \qquad ${mLatex(st)} = \,? \end{gathered}`,
      note: `${what} ${molarNote}`,
      steps,
      cards: [CARD_UMSATZ, ...new Set(steps.flatMap((s) => s.cards))].filter((c, i, all) => all.indexOf(c) === i),
      resultLatex: `${mLatex(st)} ${eqSign(mT)} ${sig(mT)}\\,\\mathrm{g}`,
    },
    form: `umsatz:${level}:${isGivenProduct ? 'aus-produkt' : isTargetReactant ? 'bedarf' : 'produkt'}`,
    substance: `${picked.id}:${target.text}`,
  }
}

export const UMSATZ_GENERATORS: readonly ChemGenerator[] = [
  {
    kind: 'umsatz',
    free: true,
    part: 'umsatz',
    weights: { 1: 0.3, 2: 0.35, 3: 0.45 },
    errors: ['chem-molar-index', 'chem-molar-atomic-number', 'chem-molar-coefficient', 'chem-n-times', 'chem-n-inverted', 'chem-ratio-one', 'chem-ratio-swapped', 'chem-ratio-product-only', 'chem-ratio-other-coefficient', 'chem-m-divided', 'chem-ratio-wrong-molar-mass', 'chem-similar-molar-mass'],
    generate,
  },
]

