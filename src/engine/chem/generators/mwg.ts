import type { GuidedStep } from '../../guided/types.ts'
import { formatLatex, roundSignificant } from '../../quantity/numberDe.ts'
import type { Rng } from '../../random/rng.ts'
import { type Rational, ONE, parseDecimal, rat, ratAdd, ratDiv, ratEq, ratMul, ratPowInt, ratToNumber } from '../../rational.ts'
import type { Level, TaskRef } from '../../tasks/taskNumber.ts'
import {
  EQUILIBRIA,
  type EqSpecies,
  type Equilibrium,
  type Shift,
  concentrationShift,
  equilibriumCe,
  gasCount,
  opposite,
  pressureShift,
  speciesCount,
  temperatureShift,
} from '../equilibria.ts'
import { type ChemCalc, type ChemGenerator, type WrongValue, stepChoices, tolerantWrongs } from './shared.ts'

// Rechnungen zum Thema „Chemisches Gleichgewicht" (S7a, Plan M4 Thema 5.1), aus den Gasgleichgewichten in chem/equilibria.ts:
// - Massenwirkungsgesetz (Unterthema „mwg"): Zähler oder Nenner, dann der ganze Ausdruck für K_GG
// - K aus Konzentrationen (Unterthema „mwg", ab Vertiefung): Ausdruck, dann der Wert
// - Geschwindigkeit und K (Unterthema „geschwindigkeit", ab Vertiefung): v_hin einer einstufigen Reaktion, K = k_hin/k_rück
// - Le Chatelier (Unterthema „le-chatelier", ab Vertiefung): Druck, Temperatur oder Konzentration → Richtung
// - Ausbeute (Unterthema „le-chatelier", Klausurniveau): günstiger Druck, günstige Temperatur, beides zusammen

const CARD = {
  mwg: 'gg-mwg',
  kWert: 'gg-k-wert',
  rate: 'gg-geschwindigkeit',
  lc: 'gg-le-chatelier',
  lcPT: 'gg-druck-temperatur',
  exo: 'gg-exo-endo',
  cat: 'gg-katalysator',
}

const r = String.raw
const math = (latex: string) => `$${latex}$`
const ce = (x: string) => r`\ce{${x}}`
const K = r`K_{\mathrm{GG}}`
const textWrong = (rule: string, text: string): WrongValue => ({ rule, key: text, content: text })
const latexWrong = (rule: string, latex: string): WrongValue => ({ rule, key: latex, content: math(latex) })

// --- Massenwirkungsgesetz als Ausdruck ---

// richtig, Exponenten weggelassen, Koeffizient als Faktor, Summe statt Produkt
type Variant = 'right' | 'exponent' | 'factor' | 'sum'

const conc = (x: EqSpecies, exp: number) => (exp > 1 ? r`c^{${exp}}(${ce(x.ce)})` : r`c(${ce(x.ce)})`)

export function sideLatex(side: readonly EqSpecies[], variant: Variant): string {
  if (variant === 'exponent') return side.map((x) => conc(x, 1)).join(r` \cdot `)
  if (variant === 'factor') return side.map((x) => (x.coef > 1 ? r`${x.coef} \cdot ${conc(x, 1)}` : conc(x, 1))).join(r` \cdot `)
  return side.map((x) => conc(x, x.coef)).join(variant === 'sum' ? ' + ' : r` \cdot `)
}

// Hat der Fehler hier eine Wirkung?
const hasCoef = (side: readonly EqSpecies[]) => side.some((x) => x.coef > 1)
const applies = (side: readonly EqSpecies[], variant: Variant) => variant === 'right' || (variant === 'sum' ? side.length > 1 : hasCoef(side))

export const kLatex = (num: string, den: string) => r`${K} = \frac{${num}}{${den}}`
export const mwgLatex = (e: Equilibrium, variant: Variant = 'right') => kLatex(sideLatex(e.right, variant), sideLatex(e.left, variant))

const VARIANT_RULE: Readonly<Record<Exclude<Variant, 'right'>, string>> = { exponent: 'chem-mwg-exponent', factor: 'chem-mwg-factor', sum: 'chem-mwg-sum' }

// ganzer Ausdruck für K_GG mit Zähler und Nenner vertauscht, Exponenten, Faktor, Summe
export function expressionStep(e: Equilibrium, rng: Rng, focus?: string): GuidedStep | null {
  const correct = mwgLatex(e)
  const wrong: WrongValue[] = [latexWrong('chem-mwg-swapped', kLatex(sideLatex(e.left, 'right'), sideLatex(e.right, 'right')))]
  for (const variant of ['exponent', 'factor', 'sum'] as const) {
    if (!applies(e.left, variant) && !applies(e.right, variant)) continue
    const side = (s: readonly EqSpecies[]) => sideLatex(s, applies(s, variant) ? variant : 'right')
    wrong.push(latexWrong(VARIANT_RULE[variant], kLatex(side(e.right), side(e.left))))
  }
  const choices = stepChoices(rng, { key: correct, content: math(correct) }, wrong, focus)
  if (choices.length === 0) return null
  return {
    id: 'ausdruck',
    title: 'Massenwirkungsgesetz',
    question: `Welcher Ausdruck ist das Massenwirkungsgesetz für diese Reaktion?`,
    choices,
    hint: 'Welche Stoffe entstehen bei der Hinreaktion, welche werden verbraucht? Und wie gehen die Koeffizienten ein?',
    explanation: {
      detailed: `Im Zähler stehen die Produkte, im Nenner die Edukte; die Konzentrationen einer Seite werden multipliziert, jede hoch ihrem Koeffizienten: $${correct}$.`,
      short: math(correct),
    },
    established: correct,
    cards: [CARD.mwg],
  }
}

// nur Zähler (Produkte) oder nur Nenner (Edukte)
function sideStep(e: Equilibrium, top: boolean, rng: Rng, focus?: string): GuidedStep | null {
  const side = top ? e.right : e.left
  const other = top ? e.left : e.right
  const correct = sideLatex(side, 'right')
  const wrong: WrongValue[] = [latexWrong('chem-mwg-swapped', sideLatex(other, 'right'))]
  for (const variant of ['exponent', 'factor', 'sum'] as const) if (applies(side, variant)) wrong.push(latexWrong(VARIANT_RULE[variant], sideLatex(side, variant)))
  const choices = stepChoices(rng, { key: correct, content: math(correct) }, wrong, focus)
  if (choices.length === 0) return null
  const where = top ? 'im Zähler' : 'im Nenner'
  return {
    id: top ? 'zaehler' : 'nenner',
    title: top ? 'Zähler' : 'Nenner',
    question: `Was steht ${where} von $${K}$?`,
    choices,
    hint: top ? 'Welche Stoffe entstehen bei der Hinreaktion? Ihre Koeffizienten gehören auch dazu.' : 'Welche Stoffe werden bei der Hinreaktion verbraucht? Ihre Koeffizienten gehören auch dazu.',
    explanation: {
      detailed: `${top ? 'Im Zähler stehen die Produkte (rechts vom Doppelpfeil)' : 'Im Nenner stehen die Edukte (links vom Doppelpfeil)'}, multipliziert und jede Konzentration hoch ihrem Koeffizienten: $${correct}$.`,
      short: math(correct),
    },
    cards: [CARD.mwg],
  }
}

const allGasNote = (e: Equilibrium) => `${e.process ? `${e.process}; alle` : 'Alle'} Stoffe sind gasförmig.`

function mwgTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  const pool = EQUILIBRIA.filter((e) =>
    focus === 'chem-mwg-exponent' || focus === 'chem-mwg-factor' ? hasCoef(e.left) || hasCoef(e.right) : focus === 'chem-mwg-sum' ? e.left.length > 1 || e.right.length > 1 : true,
  )
  const e = rng.pick(pool)
  const top = rng.chance(0.5)
  const first = sideStep(e, top, rng, focus)
  const second = expressionStep(e, rng, focus)
  if (!first || !second) return null
  return {
    task: {
      ref,
      instruction: 'Stelle das Massenwirkungsgesetz auf',
      functionLatex: equilibriumCe(e),
      note: allGasNote(e),
      steps: [first, second],
      cards: [CARD.mwg],
      resultLatex: mwgLatex(e),
    },
    form: `mwg:${level}:${top ? 'z' : 'n'}`,
    substance: e.id,
  }
}

// --- K aus Konzentrationen ---

const NICE_C = ['0.1', '0.2', '0.25', '0.4', '0.5', '0.8', '1', '1.2', '1.5', '2', '2.5', '3'].map((x) => parseDecimal(x)!)

const powR = (x: Rational, k: number) => ratPowInt(x, BigInt(k))!
const product = (xs: readonly Rational[]) => xs.reduce((a, b) => ratMul(a, b), ONE)
const sum = (xs: readonly Rational[]) => xs.reduce((a, b) => ratAdd(a, b), rat(0))

// Wert einer Seite in einer Variante des Fehlers
function sideValue(side: readonly EqSpecies[], c: ReadonlyMap<string, Rational>, variant: Variant): Rational {
  const v = (x: EqSpecies) => c.get(x.ce)!
  if (variant === 'exponent') return product(side.map(v))
  if (variant === 'factor') return product(side.map((x) => ratMul(rat(x.coef), v(x))))
  if (variant === 'sum') return sum(side.map((x) => powR(v(x), x.coef)))
  return product(side.map((x) => powR(v(x), x.coef)))
}

const sig = (x: Rational) => formatLatex(x)
const eqSign = (x: Rational) => (ratEq(roundSignificant(x).value, x) ? '=' : r`\approx`)
// eingesetzte Zahlen einer Seite, z. B. „(0{,}5)^{2} \cdot 0{,}2"
const numbersOf = (side: readonly EqSpecies[], c: ReadonlyMap<string, Rational>) =>
  side.map((x) => (x.coef > 1 ? r`(${sig(c.get(x.ce)!)})^{${x.coef}}` : sig(c.get(x.ce)!))).join(r` \cdot `)

function kValueTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  const e = rng.pick(EQUILIBRIA)
  const c = new Map([...e.left, ...e.right].map((x) => [x.ce, rng.pick(NICE_C)]))
  const kOf = (variant: Variant) => ratDiv(sideValue(e.right, c, applies(e.right, variant) ? variant : 'right'), sideValue(e.left, c, applies(e.left, variant) ? variant : 'right'))
  const value = kOf('right')
  const size = ratToNumber(value)
  if (size < 1e-4 || size > 1e5) return null
  const first = expressionStep(e, rng, focus)
  if (!first) return null
  const wrong: { rule: string; value: Rational }[] = [{ rule: 'chem-mwg-swapped', value: ratDiv(ONE, value) }]
  for (const variant of ['exponent', 'factor', 'sum'] as const) if (applies(e.left, variant) || applies(e.right, variant)) wrong.push({ rule: VARIANT_RULE[variant], value: kOf(variant) })
  const choices = stepChoices(rng, { key: sig(value), content: math(sig(value)) }, tolerantWrongs(value, wrong, sig), focus)
  if (choices.length === 0) return null
  const line = r`${K} = \frac{${numbersOf(e.right, c)}}{${numbersOf(e.left, c)}} ${eqSign(value)} ${sig(value)}`
  const given = [...e.left, ...e.right].map((x) => r`c(${ce(x.ce)}) = ${sig(c.get(x.ce)!)}\,\mathrm{mol/L}`)
  return {
    task: {
      ref,
      instruction: 'Berechne die Gleichgewichtskonstante',
      functionLatex: r`\begin{gathered} ${equilibriumCe(e)} \\ ${given.join(r` \quad `)} \end{gathered}`,
      note: `${allGasNote(e)} Die Konzentrationen gelten im Gleichgewicht. Gib $${K}$ ohne Einheit an.`,
      steps: [
        first,
        {
          id: 'wert',
          title: 'Wert von K',
          question: `Wie groß ist $${K}$?`,
          choices,
          hint: 'Setze die Konzentrationen in den Ausdruck ein; vergiss die Exponenten nicht.',
          explanation: { detailed: `Eingesetzt: $${line}$.`, short: math(r`${K} ${eqSign(value)} ${sig(value)}`) },
          established: line,
          cards: [CARD.kWert],
        },
      ],
      cards: [CARD.mwg, CARD.kWert],
      resultLatex: r`${K} ${eqSign(value)} ${sig(value)}`,
      resultNote: size > 1 ? 'Im Gleichgewicht überwiegen die Produkte.' : 'Im Gleichgewicht überwiegen die Edukte.',
    },
    form: `k-wert:${level}`,
    substance: e.id,
  }
}

// --- Geschwindigkeit und K ---

// einstufige Reaktionen mit Buchstaben (die Aufgabe nimmt an, dass sie in einem Schritt ablaufen)
const g = (coef: number, ce: string): EqSpecies => ({ ce, name: ce, coef })
export const GENERIC: readonly { readonly left: readonly EqSpecies[]; readonly right: readonly EqSpecies[] }[] = [
  { left: [g(1, 'A'), g(1, 'B')], right: [g(1, 'C')] },
  { left: [g(2, 'A')], right: [g(1, 'B')] },
  { left: [g(1, 'A'), g(2, 'B')], right: [g(2, 'C')] },
  { left: [g(1, 'A')], right: [g(2, 'B')] },
  { left: [g(1, 'A'), g(1, 'B')], right: [g(1, 'C'), g(1, 'D')] },
  { left: [g(2, 'A'), g(1, 'B')], right: [g(2, 'C')] },
  { left: [g(1, 'A'), g(1, 'B')], right: [g(2, 'C')] },
  { left: [g(2, 'A')], right: [g(1, 'B'), g(1, 'C')] },
]

const sideCe = (side: readonly EqSpecies[]) => side.map((x) => `${x.coef > 1 ? `${x.coef} ` : ''}${x.ce}`).join(' + ')
const VHIN = r`v_{\text{hin}}`
const KHIN = r`k_{\text{hin}}`
const KRUECK = r`k_{\text{rück}}`

const K_VALUES = ['2', '4', '5', '8', '20', '25', '40', '50', '0.5', '0.4', '0.25', '0.2', '0.05', '0.04'].map((x) => parseDecimal(x)!)
const K_BACK = ['1.5', '2', '2.5', '3', '4', '5', '6', '8'].map((x) => parseDecimal(x)!)

function rateTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  const index = rng.int(0, GENERIC.length - 1)
  const reaction = GENERIC[index]
  const rate = (side: readonly EqSpecies[], variant: Variant) => {
    if (variant === 'sum') return r`${KHIN} \cdot (${sideLatex(side, 'sum')})`
    return r`${KHIN} \cdot ${sideLatex(side, variant)}`
  }
  const correctRate = r`${VHIN} = ${rate(reaction.left, 'right')}`
  const rateWrong: WrongValue[] = [latexWrong('chem-rate-products', r`${VHIN} = ${rate(reaction.right, 'right')}`)]
  for (const variant of ['exponent', 'factor', 'sum'] as const) if (applies(reaction.left, variant)) rateWrong.push(latexWrong(VARIANT_RULE[variant], r`${VHIN} = ${rate(reaction.left, variant)}`))
  const first = stepChoices(rng, { key: correctRate, content: math(correctRate) }, rateWrong, focus)

  const kValue = rng.pick(K_VALUES)
  const kBack = ratMul(rng.pick(K_BACK), rat(1n, 10n ** BigInt(rng.int(1, 5))))
  const kForward = ratMul(kValue, kBack)
  if (!ratEq(roundSignificant(kForward).value, kForward)) return null
  const second = stepChoices(
    rng,
    { key: sig(kValue), content: math(sig(kValue)) },
    tolerantWrongs(
      kValue,
      [
        { rule: 'chem-k-rates', value: ratDiv(ONE, kValue) },
        { rule: 'chem-k-product', value: ratMul(kForward, kBack) },
      ],
      sig,
    ),
    focus,
  )
  if (first.length === 0 || second.length === 0) return null
  const line = r`${K} = \frac{${KHIN}}{${KRUECK}} = \frac{${sig(kForward)}}{${sig(kBack)}} = ${sig(kValue)}`
  return {
    task: {
      ref,
      instruction: 'Bestimme die Gleichgewichtskonstante aus den Geschwindigkeitskonstanten',
      functionLatex: r`\begin{gathered} \ce{${sideCe(reaction.left)} <=> ${sideCe(reaction.right)}} \\ ${KHIN} = ${sig(kForward)} \quad ${KRUECK} = ${sig(kBack)} \end{gathered}`,
      note: 'Nimm an, dass Hin- und Rückreaktion jeweils in einem einzigen Schritt ablaufen. Einheiten sind weggelassen.',
      steps: [
        {
          id: 'v-hin',
          title: 'Geschwindigkeit der Hinreaktion',
          question: `Wie hängt die Geschwindigkeit $${VHIN}$ der Hinreaktion von den Konzentrationen ab?`,
          choices: first,
          hint: 'Welche Teilchen müssen bei der Hinreaktion zusammenstoßen, und wie viele von jeder Sorte?',
          explanation: {
            detailed: `Bei einer Reaktion in einem Schritt hängt die Geschwindigkeit von den Konzentrationen der Edukte ab, jede hoch ihrem Koeffizienten: $${correctRate}$.`,
            short: math(correctRate),
          },
          established: correctRate,
          cards: [CARD.rate],
        },
        {
          id: 'k',
          title: 'Gleichgewichtskonstante',
          question: `Wie groß ist $${K}$?`,
          choices: second,
          hint: `Im Gleichgewicht gilt $${VHIN} = v_{\\text{rück}}$. Stelle so um, dass links nur noch die Konstanten stehen.`,
          explanation: {
            detailed: `Aus $${VHIN} = v_{\\text{rück}}$ folgt, dass $${K}$ der Quotient aus der Konstante der Hinreaktion und der der Rückreaktion ist: $${line}$.`,
            short: math(r`${K} = ${sig(kValue)}`),
          },
          established: line,
          cards: [CARD.rate],
        },
      ],
      cards: [CARD.rate],
      resultLatex: r`${K} = ${sig(kValue)}`,
    },
    form: `k-raten:${level}:${index}`,
    substance: `generisch-${index}`,
  }
}

// --- Le Chatelier ---

const DIR: Readonly<Record<Shift, string>> = {
  right: 'Das Gleichgewicht verschiebt sich zu den Produkten (nach rechts).',
  left: 'Das Gleichgewicht verschiebt sich zu den Edukten (nach links).',
  none: 'Die Lage des Gleichgewichts ändert sich nicht.',
}
const DIR_SHORT: Readonly<Record<Shift, string>> = { right: 'zu den Produkten', left: 'zu den Edukten', none: 'keine Verschiebung' }

// Druck lässt sich fragen, wenn sich die Gasteilchen unterscheiden oder das Zählen der Stoffe einen Fehler ergibt
export const pressureAskable = (e: Equilibrium) => gasCount(e.left) !== gasCount(e.right) || speciesCount(e.left) !== speciesCount(e.right)

export const dHLatex = (e: Equilibrium) => r`\Delta H = ${e.dH! > 0 ? '+' : '-'}${Math.abs(e.dH!)}\,\mathrm{kJ}`

// Richtung als Auswahl; wrong: Regel → falsche Richtung (die erste Regel mit derselben Richtung gewinnt)
function directionStep(id: string, question: string, correct: Shift, wrong: readonly [string, Shift][], hint: string, why: string, cards: readonly string[], rng: Rng, focus?: string): GuidedStep | null {
  const choices = stepChoices(
    rng,
    { key: correct, content: DIR[correct] },
    wrong.map(([rule, d]) => ({ rule, key: d, content: DIR[d] })),
    focus,
  )
  if (choices.length === 0) return null
  return { id, title: 'Richtung', question, choices, hint, explanation: { detailed: `${why} ${DIR[correct]}`, short: DIR[correct] }, cards: [...cards] }
}

function countStep(e: Equilibrium, rng: Rng, focus?: string): GuidedStep | null {
  const text = (l: number, rr: number) => `links $${l}$, rechts $${rr}$`
  const correct = text(gasCount(e.left), gasCount(e.right))
  const choices = stepChoices(rng, { key: correct, content: correct }, [textWrong('chem-lc-count', text(speciesCount(e.left), speciesCount(e.right)))], focus)
  if (choices.length === 0) return null
  return {
    id: 'teilchen',
    title: 'Gasteilchen zählen',
    question: 'Wie viele Gasteilchen stehen laut Gleichung links und rechts vom Doppelpfeil?',
    choices,
    hint: 'Zähle für jede Seite die Koeffizienten der gasförmigen Stoffe zusammen.',
    explanation: { detailed: `Die Koeffizienten zusammengezählt: ${correct}.`, short: correct },
    cards: [CARD.lcPT],
  }
}

const EXO = 'Die Hinreaktion ist exotherm: Sie gibt Wärme ab.'
const ENDO = 'Die Hinreaktion ist endotherm: Sie nimmt Wärme auf.'

function enthalpyStep(e: Equilibrium, rng: Rng, focus?: string): GuidedStep {
  const exo = e.dH! < 0
  const correct = exo ? EXO : ENDO
  return {
    id: 'enthalpie',
    title: 'Exotherm oder endotherm?',
    question: `Was sagt $${dHLatex(e)}$ über die Hinreaktion?`,
    choices: stepChoices(rng, { key: correct, content: correct }, [textWrong('chem-lc-exo-endo', exo ? ENDO : EXO)], focus),
    hint: 'Ein negatives $\\Delta H$ heißt: Das System verliert Energie an die Umgebung.',
    explanation: { detailed: `$\\Delta H$ ist ${exo ? 'negativ' : 'positiv'}. ${correct}`, short: correct },
    cards: [CARD.exo],
  }
}

type Intervention = 'p-up' | 'p-down' | 't-up' | 't-down' | 'c-add' | 'c-remove'

const FOCUS_INTERVENTIONS: Readonly<Record<string, readonly Intervention[]>> = {
  'chem-lc-pressure': ['p-up', 'p-down'],
  'chem-lc-count': ['p-up', 'p-down'],
  'chem-lc-heat': ['t-up', 't-down'],
  'chem-lc-exo-endo': ['t-up', 't-down'],
  'chem-lc-conc': ['c-add', 'c-remove'],
}

function leChatelierTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  const kinds: readonly Intervention[] = FOCUS_INTERVENTIONS[focus ?? ''] ?? ['p-up', 'p-down', 't-up', 't-down', 'c-add', 'c-remove']
  const kind = rng.pick(kinds)
  const pool = EQUILIBRIA.filter((e) => (kind.startsWith('p') ? pressureAskable(e) : kind.startsWith('t') ? e.dH !== null : true))
  const e = rng.pick(pool)
  const steps: GuidedStep[] = []
  let change: string
  let finalShift: Shift
  let substance = e.id
  if (kind === 'p-up' || kind === 'p-down') {
    const up = kind === 'p-up'
    change = up ? 'Der Druck wird erhöht (das Volumen wird kleiner).' : 'Der Druck wird gesenkt (das Volumen wird größer).'
    const shift = pressureShift(e, up)
    finalShift = shift
    const count = countStep(e, rng, focus)
    if (count) steps.push(count)
    const wrong: [string, Shift][] = shift === 'none' ? [] : [['chem-lc-pressure', opposite(shift)]]
    wrong.push(['chem-lc-count', pressureShift(e, up, speciesCount)])
    if (shift !== 'none') wrong.push(['chem-lc-no-shift', 'none'])
    const why =
      shift === 'none'
        ? 'Links und rechts stehen gleich viele Gasteilchen; keine Richtung kann den Druck ändern.'
        : `${up ? 'Höherer Druck begünstigt die Seite mit weniger' : 'Niedrigerer Druck begünstigt die Seite mit mehr'} Gasteilchen.`
    const dir = directionStep('richtung', 'Wie reagiert das Gleichgewicht?', shift, wrong, 'Welche Seite hat weniger Gasteilchen? Bei welcher Änderung hilft das, den Zwang zu verkleinern?', why, [CARD.lcPT], rng, focus)
    if (!dir) return null
    steps.push(dir)
  } else if (kind === 't-up' || kind === 't-down') {
    const up = kind === 't-up'
    change = up ? 'Die Temperatur wird erhöht.' : 'Die Temperatur wird gesenkt.'
    const shift = temperatureShift(e, up)
    finalShift = shift
    steps.push(enthalpyStep(e, rng, focus))
    const heat: Shift = up ? 'right' : 'left'
    const dir = directionStep(
      'richtung',
      'Wie reagiert das Gleichgewicht?',
      shift,
      [
        ['chem-lc-heat', heat],
        ['chem-lc-exo-endo', opposite(shift)],
        ['chem-lc-no-shift', 'none'],
      ],
      'Welche Richtung nimmt Wärme auf, welche gibt Wärme ab?',
      `${up ? 'Erwärmen begünstigt die Richtung, die Wärme aufnimmt' : 'Abkühlen begünstigt die Richtung, die Wärme abgibt'}; hier ist das die ${shift === 'right' ? 'Hinreaktion' : 'Rückreaktion'}.`,
      [CARD.lcPT],
      rng,
      focus,
    )
    if (!dir) return null
    steps.push(dir)
  } else {
    const add = kind === 'c-add'
    const x = rng.pick([...e.left, ...e.right])
    substance = `${e.id}:${x.ce}`
    change = add ? `Es wird zusätzlich ${x.name} $${ce(x.ce)}$ eingeleitet.` : `${x.name} $${ce(x.ce)}$ wird laufend aus dem Gemisch entfernt.`
    const shift = concentrationShift(e, x.ce, add)
    finalShift = shift
    const used = 'Es verbraucht diesen Stoff verstärkt.'
    const formed = 'Es bildet diesen Stoff verstärkt nach.'
    const nothing = 'Nichts; der Stoff gehört nicht zum Gleichgewicht.'
    const right = add ? used : formed
    steps.push({
      id: 'zwang',
      title: 'Zwang',
      question: `Wie antwortet das Gleichgewicht darauf, dass $${ce(x.ce)}$ ${add ? 'dazukommt' : 'fehlt'}?`,
      choices: stepChoices(rng, { key: right, content: right }, [textWrong('chem-lc-conc', add ? formed : used), textWrong('chem-lc-no-shift', nothing)], focus),
      hint: 'Das Gleichgewicht weicht einem Zwang so aus, dass er kleiner wird.',
      explanation: { detailed: add ? 'Ein zugegebener Stoff wird verstärkt verbraucht, damit seine Konzentration wieder sinkt.' : 'Ein entfernter Stoff wird verstärkt nachgebildet.', short: right },
      cards: [CARD.lc],
    })
    const onLeft = e.left.includes(x)
    const dir = directionStep(
      'richtung',
      'In welche Richtung verschiebt sich das Gleichgewicht?',
      shift,
      [
        ['chem-lc-conc', opposite(shift)],
        ['chem-lc-no-shift', 'none'],
      ],
      `Auf welcher Seite steht $${ce(x.ce)}$?`,
      `$${ce(x.ce)}$ ist ein ${onLeft ? 'Edukt' : 'Produkt'}; ${add ? 'verbraucht wird es' : 'nachgebildet wird es'} durch die ${shift === 'right' ? 'Hinreaktion' : 'Rückreaktion'}.`,
      [CARD.lc],
      rng,
      focus,
    )
    if (!dir) return null
    steps.push(dir)
  }
  if (steps.some((s) => s.choices.length === 0)) return null
  const showDH = e.dH !== null && kind.startsWith('t')
  return {
    task: {
      ref,
      instruction: 'Wende das Prinzip von Le Chatelier an',
      functionLatex: showDH ? r`\begin{gathered} ${equilibriumCe(e)} \\ ${dHLatex(e)} \end{gathered}` : equilibriumCe(e),
      note: `${allGasNote(e)} ${change}`,
      steps,
      cards: [...new Set(steps.flatMap((s) => s.cards))],
      resultText: `${change.replace(/\.$/, '')}: ${DIR_SHORT[finalShift]}.`,
    },
    form: `le-chatelier:${level}:${kind}`,
    substance,
  }
}

// --- Ausbeute ---

const P = { high: 'ein hoher Druck', low: 'ein niedriger Druck', none: 'Der Druck spielt keine Rolle.' }
const T = { high: 'eine hohe Temperatur', low: 'eine niedrige Temperatur', none: 'Die Temperatur spielt keine Rolle.' }
const pOf = (d: Shift) => (d === 'right' ? 'high' : d === 'left' ? 'low' : 'none')
const flip = (x: 'high' | 'low') => (x === 'high' ? 'low' : 'high')
const COMBO_P = { high: 'hoher Druck', low: 'niedriger Druck' }
const COMBO_T = { high: 'hohe Temperatur', low: 'niedrige Temperatur' }
const combo = (p: 'high' | 'low' | 'none', t: 'high' | 'low') => (p === 'none' ? `${COMBO_T[t].replace(/^./, (c) => c.toUpperCase())}; der Druck spielt keine Rolle.` : `${COMBO_P[p].replace(/^./, (c) => c.toUpperCase())} und ${COMBO_T[t]}`)
const CATALYST = 'Ein Katalysator, denn er verschiebt das Gleichgewicht zu den Produkten.'

function yieldTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  const e = rng.pick(EQUILIBRIA.filter((x) => x.dH !== null && pressureAskable(x)))
  const x = rng.pick(e.right)
  // Druck: hoch, wenn höherer Druck die Produkte begünstigt
  const p = pOf(pressureShift(e, true))
  const pCount = pOf(pressureShift(e, true, speciesCount))
  const pWrong: WrongValue[] = [
    ...(p !== 'none' ? [textWrong('chem-lc-pressure', P[flip(p)])] : []),
    textWrong('chem-lc-count', P[pCount]),
    ...(p !== 'none' ? [textWrong('chem-lc-no-shift', P.none)] : []),
  ]
  const pChoices = stepChoices(rng, { key: P[p], content: P[p] }, pWrong, focus)
  // Temperatur: hoch, wenn Erwärmen die Produkte begünstigt
  const t: 'high' | 'low' = temperatureShift(e, true) === 'right' ? 'high' : 'low'
  const tWrong: WrongValue[] = [textWrong('chem-lc-heat', T.high), textWrong('chem-lc-exo-endo', T[flip(t)]), textWrong('chem-lc-no-shift', T.none)]
  const tChoices = stepChoices(rng, { key: T[t], content: T[t] }, tWrong, focus)
  const best = combo(p, t)
  const comboWrong: WrongValue[] = [
    ...(p !== 'none' ? [textWrong('chem-lc-pressure', combo(flip(p), t))] : []),
    textWrong(t === 'low' ? 'chem-lc-heat' : 'chem-lc-exo-endo', combo(p, flip(t))),
    textWrong('chem-lc-catalyst', CATALYST),
  ]
  const comboChoices = stepChoices(rng, { key: best, content: best }, comboWrong, focus)
  if (pChoices.length === 0 || tChoices.length === 0 || comboChoices.length === 0) return null
  const what = `${x.name} $${ce(x.ce)}$`
  return {
    task: {
      ref,
      instruction: 'Finde die Bedingungen für eine große Ausbeute',
      functionLatex: r`\begin{gathered} ${equilibriumCe(e)} \\ ${dHLatex(e)} \end{gathered}`,
      note: `${allGasNote(e)} Gesucht ist möglichst viel ${what} im Gleichgewicht; wie schnell es sich einstellt, zählt hier nicht.`,
      steps: [
        {
          id: 'druck',
          title: 'Druck',
          question: `Welcher Druck begünstigt die Bildung von $${ce(x.ce)}$?`,
          choices: pChoices,
          hint: 'Vergleiche die Zahl der Gasteilchen links und rechts (mit Koeffizienten).',
          explanation: {
            detailed:
              p === 'none'
                ? `Links und rechts stehen je $${gasCount(e.left)}$ Gasteilchen; der Druck verschiebt das Gleichgewicht nicht.`
                : `Links stehen $${gasCount(e.left)}$, rechts $${gasCount(e.right)}$ Gasteilchen. ${p === 'high' ? 'Hoher Druck begünstigt die Seite mit weniger Teilchen, hier die Produkte.' : 'Niedriger Druck begünstigt die Seite mit mehr Teilchen, hier die Produkte.'}`,
            short: P[p],
          },
          cards: [CARD.lcPT],
        },
        {
          id: 'temperatur',
          title: 'Temperatur',
          question: `Welche Temperatur begünstigt die Bildung von $${ce(x.ce)}$?`,
          choices: tChoices,
          hint: 'Ist die Hinreaktion exotherm oder endotherm?',
          explanation: {
            detailed: `Die Hinreaktion ist ${e.dH! < 0 ? 'exotherm' : 'endotherm'} ($${dHLatex(e)}$). ${t === 'low' ? 'Abkühlen begünstigt die Richtung, die Wärme abgibt, hier die Hinreaktion.' : 'Erwärmen begünstigt die Richtung, die Wärme aufnimmt, hier die Hinreaktion.'}`,
            short: T[t],
          },
          cards: [CARD.lcPT, CARD.exo],
        },
        {
          id: 'massnahmen',
          title: 'Beides zusammen',
          question: `Mit welchen Bedingungen entsteht im Gleichgewicht am meisten $${ce(x.ce)}$?`,
          choices: comboChoices,
          hint: 'Setze die beiden Antworten zusammen. Was kann ein Katalysator, was kann er nicht?',
          explanation: { detailed: `${best}. Ein Katalysator beschleunigt nur die Einstellung des Gleichgewichts, an der Ausbeute ändert er nichts.`, short: best },
          cards: [CARD.lcPT, CARD.cat],
        },
      ],
      cards: [CARD.lcPT, CARD.exo, CARD.cat],
      resultText: `Große Ausbeute an ${what}: ${best.replace(/^./, (c) => c.toLowerCase()).replace(/\.$/, '')}.`,
    },
    form: `ausbeute:${level}`,
    substance: `${e.id}:${x.ce}`,
  }
}

export { mwgTask, kValueTask, rateTask, leChatelierTask, yieldTask }

export const MWG_GENERATORS: readonly ChemGenerator[] = [
  {
    kind: 'mwg',
    part: 'mwg',
    weights: { 1: 1, 2: 0.25, 3: 0.2 },
    errors: ['chem-mwg-exponent', 'chem-mwg-swapped', 'chem-mwg-factor', 'chem-mwg-sum'],
    generate: mwgTask,
  },
  {
    kind: 'k-wert',
    part: 'mwg',
    weights: { 2: 0.25, 3: 0.2 },
    errors: ['chem-mwg-exponent', 'chem-mwg-swapped', 'chem-mwg-factor', 'chem-mwg-sum'],
    generate: kValueTask,
  },
  {
    kind: 'k-raten',
    part: 'geschwindigkeit',
    weights: { 2: 0.2, 3: 0.15 },
    errors: ['chem-rate-products', 'chem-mwg-exponent', 'chem-mwg-factor', 'chem-mwg-sum', 'chem-k-rates', 'chem-k-product'],
    generate: rateTask,
  },
  {
    kind: 'le-chatelier',
    part: 'le-chatelier',
    weights: { 2: 0.3, 3: 0.25 },
    errors: ['chem-lc-pressure', 'chem-lc-count', 'chem-lc-no-shift', 'chem-lc-heat', 'chem-lc-exo-endo', 'chem-lc-conc'],
    generate: leChatelierTask,
  },
  {
    kind: 'ausbeute',
    part: 'le-chatelier',
    weights: { 3: 0.2 },
    errors: ['chem-lc-pressure', 'chem-lc-count', 'chem-lc-no-shift', 'chem-lc-heat', 'chem-lc-exo-endo', 'chem-lc-catalyst'],
    generate: yieldTask,
  },
]
