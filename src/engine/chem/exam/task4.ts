import type { ExamItem, ExamItemBuild, ExamOption, ExamPart, ExamTask } from '../../exam/types.ts'
import { roundSignificant } from '../../quantity/numberDe.ts'
import { type Rng, createRng } from '../../random/rng.ts'
import { type Rational, parseDecimal, rat, ratDiv, ratEq, ratMul, ratSub, ratAdd, ratToNumber } from '../../rational.ts'
import { type Equation, type Species, balance, coefficientsOf, equationLatex, isBalanced, withCoefficients } from '../equation.ts'
import { atomCounts, formulaLatex, hasBracket, parseFormula } from '../formula.ts'
import { type MassValues, atomicNumberSum, elementMolarMass, molarMass } from '../molarMass.ts'
import { CO2, FUELS, type Fuel, H2O, O2 } from '../reactions.ts'
import { partly } from '../generators/gleichungen.ts'
import { hydrateInfo, pickSolution } from '../generators/loesungen.ts'
import { usesExamNumbers } from '../generators/shared.ts'
import { NICE_N, eqSign, given, molarLatex, sig, valuesNote } from '../generators/stoffmenge.ts'

// „Klausuraufgabe 4 üben" (Plan M4, S4c; Bauplan Teil 1, Aufgabe 4 mit 14 Punkten): Verbrennung eines Alkans
// oder Alkohols. a) Gleichung (2), b) Molmassen der vier Stoffe (je 1), c) Masse eines Produkts (4: Stoffmenge
// des Brennstoffs 1, Stoffmenge des Produkts 1, Masse 2), d) Gasvolumen bei Normbedingungen oder eine
// Lösung ansetzen (4). Aufgabentexte in eigenen Worten, andere Stoffe und Zahlen als die Altklausuren.
// Folgefehler: Jede Rechnung rechnet mit den gewählten früheren Antworten weiter (exam/grade.ts). Die ganz
// richtige Antwort steht dann nicht zusätzlich zur Wahl: Sonst verrieten Zahl und Inhalt der Antworten, ob
// eine frühere Antwort falsch war (und durch Ausprobieren sogar die richtige).

export const TASK4_POINTS = 14
const VALUES: MassValues = 'rounded'
const VM = parseDecimal('22.4')!
const VM_25 = parseDecimal('24.5')!
const ML = rat(1, 1000)

const CARD_COMBUSTION = 'gleichungen-verbrennung'
const CARD_BALANCE = 'gleichungen-ausgleichen'
const CARD_MOLAR = 'stoffmenge-molmasse'
const CARD_NMM = 'stoffmenge-n-m-m'
const CARD_UMSATZ = 'stoffmenge-umsatz'
const CARD_VM = 'loesungen-molvolumen'
const CARD_ANSETZEN = 'loesungen-ansetzen'

const ce = (s: Species) => formulaLatex(s.formula)
const num = (c: ExamOption) => c.value as Rational
const unitLatex = (unit: string) => (r: Rational) => `${sig(r)}\\,\\mathrm{${unit}}`
const molar = (r: Rational) => molarLatex(r, VALUES)
// Einheiten neben dem Eingabefeld (S8c)
const U = { mol: String.raw`\mathrm{mol}`, g: String.raw`\mathrm{g}`, L: String.raw`\mathrm{L}` }

// ähnlicher Stoff, dessen Molmasse man versehentlich nimmt
const SIMILAR: Readonly<Record<string, string>> = { CO2: 'CO', H2O: 'H2O2', O2: 'O3' }

// --- Antworten mit Zahlen ---

const shown = (r: Rational) => roundSignificant(r).value
const apart = (a: Rational, b: Rational, share: number) => Math.abs(ratToNumber(shown(a)) / ratToNumber(shown(b)) - 1) >= share

// erwartete Antwort (mit den eigenen Werten) und bis zu drei falsche; falsche Werte wie bei den Rechnungen
// mindestens 6 % neben der erwarteten und der ganz richtigen und 3 % auseinander (docs/CHEMIE.md §7).
// exact: Werte nicht runden (Molmassen), Abstand trotzdem mit Toleranz. unit: Einheit für das Eintippen (S8c);
// dort zählen alle falschen Werte, nicht nur die angezeigten
function numberOptions(
  rng: Rng,
  expected: Rational,
  correct: Rational,
  wrong: readonly { rule: string; value: Rational }[],
  latex: (r: Rational) => string,
  unit: string,
  exact = false,
): Pick<ExamItemBuild, 'options' | 'expected' | 'correct' | 'numeric' | 'correctValue'> {
  const keep = (a: Rational) => (exact ? a : shown(a))
  const option = (value: Rational, errorRuleId?: string): ExamOption => ({ id: latex(value), content: `$${latex(value)}$`, value: keep(value), ...(errorRuleId ? { errorRuleId } : {}) })
  const options = [option(expected)]
  const far = (a: Rational, b: Rational, share: number) => (exact ? Math.abs(ratToNumber(a) / ratToNumber(b) - 1) >= share : apart(a, b, share))
  const kept: { rule: string; value: Rational }[] = []
  for (const w of rng.shuffle([...wrong])) {
    if (w.value.n <= 0n) continue
    if (!far(w.value, expected, 0.06) || !far(w.value, correct, 0.06)) continue
    if (!kept.every((k) => far(w.value, k.value, 0.03) && latex(w.value) !== latex(k.value))) continue
    kept.push(w)
  }
  options.push(...kept.slice(0, 4 - options.length).map((w) => option(w.value, w.rule)))
  return {
    options: rng.shuffle(options),
    expected: latex(expected),
    correct: latex(correct),
    numeric: { value: expected, unit, wrongs: kept },
    correctValue: correct,
  }
}

// --- Gleichung ---

// Koeffizienten [Brennstoff, O₂, CO₂, H₂O] ganzzahlig und gekürzt machen
function integerEquation(eq: Equation, coefficients: readonly Rational[]): Equation | null {
  if (coefficients.some((c) => c.n <= 0n)) return null
  const gcd = (a: bigint, b: bigint): bigint => (b === 0n ? a : gcd(b, a % b))
  const lcm = coefficients.reduce((l, c) => (l * c.d) / gcd(l, c.d), 1n)
  const ints = coefficients.map((c) => (c.n * lcm) / c.d)
  const g = ints.reduce((a, b) => gcd(a, b))
  return withCoefficients(eq, ints.map((x) => rat(x / g)))
}

function equationOptions(fuel: Fuel, correct: Equation, rng: Rng): ExamOption[] {
  const [a, o, c, h] = coefficientsOf(correct)
  const z = atomCounts(fuel.species.formula).get('O') ?? 0
  const oxygenIn = ratMul(a, rat(z))
  // Sauerstoff im Wasser vergessen: O₂ nur für das CO₂ (abzüglich O im Brennstoff)
  const waterOxygen = integerEquation(correct, [a, ratDiv(ratSub(ratMul(rat(2), c), oxygenIn), rat(2)), c, h])
  // Sauerstoffatome statt O₂-Moleküle gezählt
  const atoms = integerEquation(correct, [a, ratSub(ratAdd(ratMul(rat(2), c), h), oxygenIn), c, h])
  const wrong = [
    { rule: 'chem-balance-water-oxygen', eq: waterOxygen },
    { rule: 'chem-balance-oxygen', eq: atoms },
    { rule: 'chem-balance-partly-doubled', eq: partly(correct, rng) },
  ].filter((w): w is { rule: string; eq: Equation } => w.eq !== null && !isBalanced(w.eq))
  // ausgeglichen, aber nicht mit den kleinsten ganzen Zahlen: mit Bruch vor O₂ (Brennstoff 1) oder verdoppelt
  const half = ratEq(a, rat(1)) ? withCoefficients(correct, [a, o, c, h].map((x) => ratMul(x, rat(2)))) : withCoefficients(correct, [a, o, c, h].map((x) => ratDiv(x, a)))
  const option = (eq: Equation, extra: Partial<ExamOption> = {}): ExamOption => ({ id: equationLatex(eq), content: `$${equationLatex(eq)}$`, value: eq, ...extra })
  const halfReason = ratEq(a, rat(1)) ? 'ausgeglichen, aber nicht gekürzt' : 'ausgeglichen, aber mit Bruch statt ganzer Zahlen'
  const seen = new Set([equationLatex(correct), equationLatex(half)])
  const wrongOptions = rng
    .shuffle(wrong)
    .filter((w) => !seen.has(equationLatex(w.eq)) && seen.add(equationLatex(w.eq)))
    .slice(0, 2)
    .map((w) => option(w.eq, { errorRuleId: w.rule }))
  return rng.shuffle([option(correct), option(half, { share: { value: 0.5, reason: halfReason } }), ...wrongOptions])
}

const coefficientOf = (eq: Equation, s: Species) => [...eq.reactants, ...eq.products].find((t) => t.species.text === s.text)!.coefficient

// --- Molmassen ---

function molarOptions(s: Species, rng: Rng, coefficient: Rational): Pick<ExamItemBuild, 'options' | 'expected' | 'correct'> {
  const mass = molarMass(s.formula, VALUES)
  const wrong = [
    { rule: 'chem-molar-index', value: molarMass(s.formula, VALUES, { ignoreIndices: true }) },
    ...(hasBracket(s.formula) ? [{ rule: 'chem-molar-bracket', value: molarMass(s.formula, VALUES, { bracketOnLast: true }) }] : []),
    ...(s.formula.adducts.length > 0 ? [{ rule: 'chem-molar-hydrate', value: molarMass(s.formula, VALUES, { withoutAdducts: true }) }] : []),
    { rule: 'chem-molar-atomic-number', value: atomicNumberSum(s.formula) },
    // Koeffizient aus der Gleichung mitgerechnet
    ...(coefficient.d === 1n && coefficient.n > 1n ? [{ rule: 'chem-molar-coefficient', value: ratMul(mass, coefficient) }] : []),
  ]
  return numberOptions(rng, mass, mass, wrong, molar, String.raw`\mathrm{g/mol}`, true)
}

function molarExplanation(s: Species): ExamItemBuild['explanation'] {
  const counts = atomCounts(s.formula)
  const mass = molarMass(s.formula, VALUES)
  const terms = [...counts].map(([symbol, n]) => `${n === 1 ? '' : `${n} \\cdot `}${toText(elementMolarMass(symbol, VALUES))}`)
  const line = `M(${ce(s)}) = ${terms.join(' + ')} = ${molar(mass)}`
  return { detailed: `Summe der Molmassen aller Atome der Formel: $${line}$.`, short: `$${line}$` }
}
const toText = (r: Rational) => sig(r)

// --- Bausteine der Fragen ---

const item = (spec: ExamItem): ExamItem => spec

// Zufall je Frage, abhängig von den gewählten Antworten davor (gleiche Antworten → gleiche Auswahl)
const rngFor = (seed: string, id: string, keys: readonly string[]) => createRng(`${seed}:${id}:${keys.join('|')}`)

const explainLine = (text: string, line: string) => ({ detailed: `${text} $${line}$.`, short: `$${line}$` })

// --- Aufgabe ---

type Setup = {
  readonly fuel: Fuel
  readonly equation: Equation
  readonly mFuel: Rational
  // gesucht in c: Produkt; in d: Gas (O₂ verbraucht oder CO₂ entsteht) oder eine Lösung
  readonly target: Species
  readonly gas: Species | null
  readonly solution: ReturnType<typeof pickSolution>
}

function setup(rng: Rng): Setup | null {
  const fuel = rng.pick(FUELS)
  const equation = balance([fuel.species, O2], [CO2, H2O])!
  const massFuel = molarMass(fuel.species.formula, VALUES)
  const mFuel = given(ratMul(rng.pick(NICE_N), massFuel))
  if (usesExamNumbers(`m(${ce(fuel.species)}) = ${sig(mFuel)}\\,\\mathrm{g}`)) return null
  const target = rng.pick([CO2, H2O, CO2])
  if (rng.chance(0.5)) {
    const gas = target.text === 'CO2' ? O2 : rng.pick([O2, CO2])
    return { fuel, equation, mFuel, target, gas, solution: null }
  }
  const solution = pickSolution(rng)
  return solution ? { fuel, equation, mFuel, target, gas: null, solution } : null
}

const SPECIES_ORDER = (fuel: Fuel) => [fuel.species, O2, CO2, H2O]
const molarId = (s: Species) => `molmasse-${s.text}`

export function buildTask4(seed: number): ExamTask {
  for (let attempt = 0; attempt < 50; attempt++) {
    const s = setup(createRng(`klausur4:${seed}:${attempt}`))
    if (s) return task4(`klausur4:${seed}:${attempt}`, s)
  }
  throw new Error(`Klausuraufgabe 4: keine Aufgabe zu ${seed}`)
}

function task4(seed: string, setupData: Setup): ExamTask {
  const { fuel, equation, mFuel, target, gas, solution } = setupData
  const f = fuel.species
  const eqOf = (o: ExamOption) => o.value as Equation
  const ratio = (eq: Equation, to: Species) => ratDiv(coefficientOf(eq, to), coefficientOf(eq, f))

  // a) Gleichung
  const partA: ExamPart = {
    id: 'a',
    prompt: `Stelle die Gleichung der vollständigen Verbrennung von ${fuel.name} $${ce(f)}$ auf, mit den kleinsten ganzen Zahlen.`,
    points: 2,
    items: [
      item({
        id: 'gleichung',
        title: 'Gleichung',
        question: 'Welche Gleichung ist richtig?',
        points: 2,
        dependsOn: [],
        // in der Klausur selbst aufgestellt: erst auf Papier lösen, dann die Antworten zeigen
        paperFirst: true,
        cards: [CARD_COMBUSTION, CARD_BALANCE],
        build: () => {
          const options = equationOptions(fuel, equation, rngFor(seed, 'gleichung', []))
          const key = equationLatex(equation)
          return {
            options,
            expected: key,
            correct: key,
            explanation: explainLine('Zuerst Kohlenstoff und Wasserstoff ausgleichen, dann den Sauerstoff; steht vor $\\ce{O2}$ ein Bruch, alles verdoppeln:', key),
          }
        },
      }),
    ],
  }

  // b) Molmassen der vier Stoffe (mit dem Koeffizienten der richtigen Gleichung als möglichem Fehler)
  const partB: ExamPart = {
    id: 'b',
    prompt: 'Berechne die molaren Massen aller vier Stoffe der Gleichung.',
    points: 4,
    items: SPECIES_ORDER(fuel).map((sp) =>
      item({
        id: molarId(sp),
        title: 'Molmasse',
        question: `Wie groß ist $M(${ce(sp)})$?`,
        points: 1,
        dependsOn: [],
        cards: [CARD_MOLAR],
        build: () => ({ ...molarOptions(sp, rngFor(seed, molarId(sp), []), coefficientOf(equation, sp)), explanation: molarExplanation(sp) }),
      }),
    ),
  }

  // c) Masse eines Produkts
  const nFuelLine = (mass: Rational, n: Rational) => `n(${ce(f)}) = \\frac{m}{M} = \\frac{${sig(mFuel)}\\,\\mathrm{g}}{${molar(mass)}} ${eqSign(n)} ${sig(n)}\\,\\mathrm{mol}`
  const nTargetValue = (eq: Equation, nF: Rational, to: Species) => ratMul(nF, ratio(eq, to))
  const nTargetLine = (eq: Equation, nF: Rational, to: Species) => {
    const n = nTargetValue(eq, nF, to)
    return `n(${ce(to)}) = ${sig(nF)}\\,\\mathrm{mol} \\cdot \\frac{${sig(coefficientOf(eq, to))}}{${sig(coefficientOf(eq, f))}} ${eqSign(n)} ${sig(n)}\\,\\mathrm{mol}`
  }
  const ratioWrongs = (eq: Equation, nF: Rational, to: Species) => [
    { rule: 'chem-ratio-one', value: nF },
    { rule: 'chem-ratio-swapped', value: ratMul(nF, ratDiv(coefficientOf(eq, f), coefficientOf(eq, to))) },
    { rule: 'chem-ratio-product-only', value: ratMul(nF, coefficientOf(eq, to)) },
    ...SPECIES_ORDER(fuel)
      .filter((x) => x.text !== f.text && x.text !== to.text)
      .map((x) => ({ rule: 'chem-ratio-other-coefficient', value: ratMul(nF, ratDiv(coefficientOf(eq, x), coefficientOf(eq, f))) })),
  ]
  const nFuelItem = item({
    id: 'stoffmenge-brennstoff',
    title: 'Stoffmenge',
    question: `Wie groß ist die Stoffmenge $n(${ce(f)})$?`,
    points: 1,
    dependsOn: [molarId(f)],
    cards: [CARD_NMM],
    build: (chosen, truth) => {
      const mU = num(chosen(molarId(f)))
      const mT = num(truth(molarId(f)))
      const expected = ratDiv(mFuel, mU)
      const rng = rngFor(seed, 'stoffmenge-brennstoff', [chosen(molarId(f)).id])
      const wrong = [
        { rule: 'chem-n-times', value: ratMul(mFuel, mU) },
        { rule: 'chem-n-inverted', value: ratDiv(mU, mFuel) },
      ]
      return { ...numberOptions(rng, expected, ratDiv(mFuel, mT), wrong, unitLatex('mol'), U.mol), explanation: explainLine('Masse geteilt durch molare Masse:', nFuelLine(mU, expected)) }
    },
  })
  const nTargetItem = (id: string, to: Species, points: number) =>
    item({
      id,
      title: 'Verhältnis',
      question: `Wie groß ist die Stoffmenge $n(${ce(to)})$?`,
      points,
      dependsOn: ['gleichung', 'stoffmenge-brennstoff'],
      cards: [CARD_UMSATZ],
      build: (chosen, truth) => {
        const eqU = eqOf(chosen('gleichung'))
        const nU = num(chosen('stoffmenge-brennstoff'))
        const expected = nTargetValue(eqU, nU, to)
        const correct = nTargetValue(eqOf(truth('gleichung')), num(truth('stoffmenge-brennstoff')), to)
        const rng = rngFor(seed, id, [chosen('gleichung').id, chosen('stoffmenge-brennstoff').id])
        return {
          ...numberOptions(rng, expected, correct, ratioWrongs(eqU, nU, to), unitLatex('mol'), U.mol),
          explanation: explainLine('Die Koeffizienten der Gleichung geben das Verhältnis der Stoffmengen an:', nTargetLine(eqU, nU, to)),
        }
      },
    })
  const similar = SIMILAR[target.text]
  const massTargetItem = item({
    id: 'masse-produkt',
    title: 'Masse',
    question: `Wie viel Gramm $${ce(target)}$ entstehen?`,
    points: 2,
    dependsOn: ['stoffmenge-produkt', molarId(target), molarId(f)],
    final: true,
    cards: [CARD_UMSATZ, CARD_NMM],
    build: (chosen, truth) => {
      const nU = num(chosen('stoffmenge-produkt'))
      const mU = num(chosen(molarId(target)))
      const expected = ratMul(nU, mU)
      const correct = ratMul(num(truth('stoffmenge-produkt')), num(truth(molarId(target))))
      const rng = rngFor(seed, 'masse-produkt', [chosen('stoffmenge-produkt').id, chosen(molarId(target)).id, chosen(molarId(f)).id])
      const wrong = [
        { rule: 'chem-m-divided', value: ratDiv(nU, mU) },
        { rule: 'chem-ratio-wrong-molar-mass', value: ratMul(nU, num(chosen(molarId(f)))) },
        ...(similar ? [{ rule: 'chem-similar-molar-mass', value: ratMul(nU, molarMass(parseFormula(similar), VALUES)) }] : []),
      ]
      const line = `m(${ce(target)}) = n \\cdot M = ${sig(nU)}\\,\\mathrm{mol} \\cdot ${molar(mU)} ${eqSign(expected)} ${sig(expected)}\\,\\mathrm{g}`
      return { ...numberOptions(rng, expected, correct, wrong, unitLatex('g'), U.g), explanation: explainLine('Stoffmenge mal molare Masse des gesuchten Stoffs:', line) }
    },
  })
  const partC: ExamPart = {
    id: 'c',
    prompt: `Es verbrennen $${sig(mFuel)}\\,\\mathrm{g}$ ${fuel.name}. Wie viel Gramm $${ce(target)}$ entstehen?`,
    points: 4,
    items: [nFuelItem, nTargetItem('stoffmenge-produkt', target, 1), massTargetItem],
  }

  // d) Gasvolumen bei Normbedingungen oder Lösung ansetzen
  const partD: ExamPart = gas ? gasPart(seed, gas, nTargetItem) : solutionPart(seed, solution!)

  const elements = ['C', 'H', 'O'].map((symbol) => `$M(\\ce{${symbol}}) = ${molar(elementMolarMass(symbol, VALUES))}$`)
  return {
    title: 'Klausuraufgabe 4: Stöchiometrie',
    intro: `${fuel.name} $${ce(f)}$ verbrennt vollständig mit Sauerstoff zu Kohlenstoffdioxid und Wasser.`,
    givenLatex: `m(${ce(f)}) = ${sig(mFuel)}\\,\\mathrm{g}`,
    note: `Rechne mit ${elements[0]}, ${elements[1]} und ${elements[2]}. Runde Zwischenergebnisse auf drei gültige Ziffern.`,
    parts: [partA, partB, partC, partD],
  }
}

function gasPart(seed: string, gas: Species, nTargetItem: (id: string, to: Species, points: number) => ExamItem): ExamPart {
  const consumed = gas.text === 'O2'
  const verb = consumed ? 'wird verbraucht' : 'entsteht'
  const volumeItem = item({
    id: 'volumen-gas',
    title: 'Volumen',
    question: `Welches Volumen $${ce(gas)}$ ${verb}?`,
    points: 2,
    dependsOn: ['stoffmenge-gas'],
    final: true,
    cards: [CARD_VM],
    build: (chosen, truth) => {
      const nU = num(chosen('stoffmenge-gas'))
      const expected = ratMul(nU, VM)
      const rng = rngFor(seed, 'volumen-gas', [chosen('stoffmenge-gas').id])
      const wrong = [
        { rule: 'chem-vm-inverted', value: ratDiv(nU, VM) },
        { rule: 'chem-vm-conditions', value: ratMul(nU, VM_25) },
      ]
      const line = `V = n \\cdot V_m = ${sig(nU)}\\,\\mathrm{mol} \\cdot 22{,}4\\,\\mathrm{L/mol} ${eqSign(expected)} ${sig(expected)}\\,\\mathrm{L}`
      return { ...numberOptions(rng, expected, ratMul(num(truth('stoffmenge-gas')), VM), wrong, unitLatex('L'), U.L), explanation: explainLine('Stoffmenge mal molares Volumen:', line) }
    },
  })
  return {
    id: 'd',
    prompt: `Welches Volumen $${ce(gas)}$ ${consumed ? 'wird' : 'entsteht'} dabei bei Normbedingungen ($0\\,^{\\circ}\\mathrm{C}$, $1013\\,\\mathrm{hPa}$, $V_m = 22{,}4\\,\\mathrm{L/mol}$)${consumed ? ' verbraucht' : ''}?`,
    points: 4,
    items: [nTargetItem('stoffmenge-gas', gas, 2), volumeItem],
  }
}

function solutionPart(seed: string, sol: NonNullable<ReturnType<typeof pickSolution>>): ExamPart {
  const { substance, c, vMl } = sol
  const sp: Species = { text: substance.id, formula: substance.formula }
  // Hydrat: c gilt für das wasserfreie Salz, abgewogen wird das Hydrat (gleiche Stoffmenge)
  const hydrate = hydrateInfo(substance)
  const dissolved: Species = hydrate ? { text: hydrate.salt.id, formula: hydrate.salt.formula } : sp
  const v = ratMul(rat(vMl), ML)
  const n = ratMul(c, v)
  const nItem = item({
    id: 'stoffmenge-loesung',
    title: 'Stoffmenge',
    question: `Welche Stoffmenge $${ce(dissolved)}$ wird gebraucht?`,
    points: 1,
    dependsOn: [],
    cards: [CARD_ANSETZEN],
    build: () => {
      const wrong = [
        { rule: 'chem-ml-not-l', value: ratMul(c, rat(vMl)) },
        { rule: 'chem-c-inverted', value: ratDiv(c, v) },
      ]
      const line = `n = c \\cdot V = ${sig(c)}\\,\\mathrm{mol/L} \\cdot ${sig(v)}\\,\\mathrm{L} ${eqSign(n)} ${sig(n)}\\,\\mathrm{mol}`
      return { ...numberOptions(rngFor(seed, 'stoffmenge-loesung', []), n, n, wrong, unitLatex('mol'), U.mol), explanation: explainLine('Konzentration mal Volumen in Litern:', line) }
    },
  })
  const mItem = item({
    id: 'molmasse-loesung',
    title: 'Molmasse',
    question: `Wie groß ist $M(${ce(sp)})$?`,
    points: 1,
    dependsOn: [],
    cards: [CARD_MOLAR],
    build: () => ({ ...molarOptions(sp, rngFor(seed, 'molmasse-loesung', []), rat(1)), explanation: molarExplanation(sp) }),
  })
  const massItem = item({
    id: 'masse-loesung',
    title: 'Masse',
    question: hydrate ? `Wie viel Gramm ${hydrate.word} $${ce(sp)}$ musst du abwiegen?` : `Wie viel Gramm $${ce(sp)}$ musst du abwiegen?`,
    points: 2,
    dependsOn: ['stoffmenge-loesung', 'molmasse-loesung'],
    final: true,
    cards: [CARD_ANSETZEN],
    build: (chosen, truth) => {
      const nU = num(chosen('stoffmenge-loesung'))
      const mU = num(chosen('molmasse-loesung'))
      const expected = ratMul(nU, mU)
      const rng = rngFor(seed, 'masse-loesung', [chosen('stoffmenge-loesung').id, chosen('molmasse-loesung').id])
      const wrong = [
        { rule: 'chem-m-divided', value: ratDiv(nU, mU) },
        { rule: 'chem-m-divided', value: ratDiv(mU, nU) },
      ]
      const line = `m = n \\cdot M = ${sig(nU)}\\,\\mathrm{mol} \\cdot ${molar(mU)} ${eqSign(expected)} ${sig(expected)}\\,\\mathrm{g}`
      return {
        ...numberOptions(rng, expected, ratMul(num(truth('stoffmenge-loesung')), num(truth('molmasse-loesung'))), wrong, unitLatex('g'), U.g),
        explanation: explainLine('Stoffmenge mal molare Masse:', line),
      }
    },
  })
  return {
    id: 'd',
    prompt: hydrate
      ? `Für einen Versuch sollen im Maßkolben $${vMl}\\,\\mathrm{mL}$ einer Lösung von ${hydrate.salt.name} mit $c(${ce(dissolved)}) = ${sig(c)}\\,\\mathrm{mol/L}$ angesetzt werden. Vorrätig ist nur das ${hydrate.word} $${ce(sp)}$. Wie viel davon musst du abwiegen? ${valuesNote(substance, VALUES)}`
      : `Für einen Versuch sollen im Maßkolben $${vMl}\\,\\mathrm{mL}$ einer Lösung von ${substance.name} $${ce(sp)}$ mit $c = ${sig(c)}\\,\\mathrm{mol/L}$ angesetzt werden. Wie viel musst du abwiegen? ${valuesNote(substance, VALUES)}`,
    points: 4,
    items: [nItem, mItem, massItem],
  }
}
