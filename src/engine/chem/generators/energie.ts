import type { GuidedStep } from '../../guided/types.ts'
import { formatLatex, roundSignificant } from '../../quantity/numberDe.ts'
import type { Rng } from '../../random/rng.ts'
import { type Rational, parseDecimal, rat, ratAdd, ratDiv, ratEq, ratMul, ratNeg, ratSign, ratSub, ratToNumber, toDecimalString } from '../../rational.ts'
import type { Level, TaskRef } from '../../tasks/taskNumber.ts'
import {
  THERMO_REACTIONS,
  type Term,
  type ThermoReaction,
  dfhOf,
  keysOf,
  reactionCe,
  reactionDH,
  reactionDS,
  sOf,
  sideSum,
  thermoByKey,
} from '../thermo.ts'
import { type ChemCalc, type ChemGenerator, type WrongValue, stepChoices, tolerantWrongs } from './shared.ts'

// Rechnungen zum Thema „Energie bei Reaktionen" (S7b, Plan M4 Thema 5.2), aus den Tabellenwerten in chem/thermo.ts:
// - Reaktionsenthalpie (Unterthema „reaktionsenthalpie"): Σ Produkte, Σ Edukte, ΔH, exotherm oder endotherm; in den Grundlagen
//   nur Bildungen aus den Elementen
// - Vorzeichen von ΔH und ΔS (Unterthema „entropie"): Phasenübergänge, ab Vertiefung auch Reaktionen mit Gasteilchen
// - freie Enthalpie (Unterthema „freie-enthalpie", ab Vertiefung): T in K, ΔS in kJ/K, ΔG = ΔH − T · ΔS, freiwillig?
// - freiwillig bei welcher Temperatur? (ab Vertiefung): aus den Vorzeichen von ΔH und ΔS
// - Grenztemperatur (Klausurniveau): ΔS aus der Tabelle, T = ΔH/ΔS, oberhalb oder unterhalb
// - K aus ΔG⁰ (Klausurniveau): T in K, ln K, K

const CARD = {
  bildung: 'en-bildungsenthalpie',
  reaktion: 'en-reaktionsenthalpie',
  vorzeichen: 'en-vorzeichen',
  entropie: 'en-entropie',
  gibbs: 'en-freie-enthalpie',
  grenze: 'en-grenztemperatur',
  k: 'en-freie-enthalpie-k',
}

const r = String.raw
const math = (latex: string) => `$${latex}$`
const textWrong = (rule: string, text: string): WrongValue => ({ rule, key: text, content: text })
const R_GAS = parseDecimal('8.314')!
const KELVIN = parseDecimal('273.15')!

// exakte Dezimalzahl mit Komma, z. B. „-890{,}2"
const dec = (x: Rational) => toDecimalString(x)!.replace(',', '{,}')
const kj = (x: Rational) => r`${dec(x)}\,\mathrm{kJ}`
const sig = (x: Rational) => formatLatex(x)
const eqSign = (x: Rational) => (ratEq(roundSignificant(x).value, x) ? '=' : r`\approx`)
const unit = (x: Rational, u: string) => r`${sig(x)}\,\mathrm{${u}}`

const ceOf = (key: string) => r`\ce{${key}}`

// Werte einer Reaktion als Text, z. B. „$\ce{CH4(g)}$: $-74{,}9$; …"; extra: zusätzliche Zeilen (Falle H₂O(g))
function valuesText(keys: readonly string[], value: (key: string) => Rational, extra: readonly string[] = []): string {
  return [...keys, ...extra]
    .filter((k) => !thermoByKey(k)!.element || value === sOf)
    .map((k) => `$${ceOf(k)}$: $${dec(value(k))}$`)
    .join('; ')
}

// --- Reaktionsenthalpie ---

// die Summe einer Seite mit Rechenweg, z. B. „1 · (−393,5) + 2 · (−285,8)"
const sumLine = (side: readonly Term[], value: (key: string) => Rational) =>
  side.map(([c, k]) => `${c} \\cdot (${dec(value(k))})`).join(' + ')

const hasWaterL = (side: readonly Term[]) => side.some(([, k]) => k === 'H2O(l)')
const hasCoef = (side: readonly Term[]) => side.some(([c, k]) => c > 1 && !thermoByKey(k)!.element)

function sumStep(id: 'produkte' | 'edukte', side: readonly Term[], rng: Rng, focus?: string): GuidedStep | null {
  const correct = sideSum(side, dfhOf)
  const wrong: WrongValue[] = []
  if (hasCoef(side)) wrong.push({ rule: 'chem-dh-coefficients', key: dec(sideSum(side, dfhOf, { noCoef: true })), content: math(kj(sideSum(side, dfhOf, { noCoef: true }))) })
  if (hasWaterL(side)) wrong.push({ rule: 'chem-dh-water-gas', key: dec(sideSum(side, dfhOf, { waterGas: true })), content: math(kj(sideSum(side, dfhOf, { waterGas: true }))) })
  const choices = stepChoices(rng, { key: dec(correct), content: math(kj(correct)) }, wrong, focus)
  if (choices.length === 0) return null
  const what = id === 'produkte' ? 'Produkte' : 'Edukte'
  const line = r`\sum \Delta_f H^{0}(\text{${what}}) = ${sumLine(side, dfhOf)} = ${kj(correct)}`
  return {
    id,
    title: `Summe der ${what}`,
    question: `Wie groß ist die Summe der Bildungsenthalpien der ${what}?`,
    choices,
    hint: 'Jeder Wert gilt für 1 mol; nimm ihn so oft, wie der Koeffizient sagt, und achte auf den Zustand. Elemente im Standardzustand zählen 0.',
    explanation: { detailed: `Koeffizient mal Tabellenwert, dann zusammengezählt: $${line}$.`, short: math(kj(correct)) },
    established: line,
    cards: [CARD.reaktion],
  }
}

function dhStep(x: ThermoReaction, rng: Rng, focus?: string): GuidedStep | null {
  const dh = reactionDH(x)
  const wrong: WrongValue[] = [{ rule: 'chem-dh-reversed', key: dec(ratNeg(dh)), content: math(kj(ratNeg(dh))) }]
  if (hasCoef(x.left) || hasCoef(x.right)) wrong.push({ rule: 'chem-dh-coefficients', key: dec(reactionDH(x, { noCoef: true })), content: math(kj(reactionDH(x, { noCoef: true }))) })
  if (hasWaterL(x.left) || hasWaterL(x.right)) wrong.push({ rule: 'chem-dh-water-gas', key: dec(reactionDH(x, { waterGas: true })), content: math(kj(reactionDH(x, { waterGas: true }))) })
  const choices = stepChoices(rng, { key: dec(dh), content: math(kj(dh)) }, wrong, focus)
  if (choices.length === 0) return null
  const p = sideSum(x.right, dfhOf)
  const e = sideSum(x.left, dfhOf)
  const line = r`\Delta H^{0} = ${dec(p)} - (${dec(e)}) = ${kj(dh)}`
  return {
    id: 'dh',
    title: 'Reaktionsenthalpie',
    question: 'Wie groß ist die Reaktionsenthalpie $\\Delta H^{0}$ für die Gleichung, wie sie dasteht?',
    choices,
    hint: 'Welche Summe kommt zuerst, welche wird abgezogen? Denk an „nachher minus vorher“.',
    explanation: { detailed: `Produkte minus Edukte: $${line}$.`, short: math(r`\Delta H^{0} = ${kj(dh)}`) },
    established: line,
    cards: [CARD.reaktion],
  }
}

const EXO = 'Exotherm: Bei der Reaktion wird Wärme frei.'
const ENDO = 'Endotherm: Die Reaktion nimmt Wärme auf.'

function signStep(dh: Rational, rng: Rng, focus?: string): GuidedStep {
  const exo = ratSign(dh) < 0
  const correct = exo ? EXO : ENDO
  return {
    id: 'vorzeichen',
    title: 'Exotherm oder endotherm?',
    question: `Was bedeutet $\\Delta H^{0} = ${kj(dh)}$?`,
    choices: stepChoices(rng, { key: correct, content: correct }, [textWrong('chem-dh-sign', exo ? ENDO : EXO)], focus),
    hint: 'Überlege, ob die Stoffe bei diesem Vorzeichen Energie gewinnen oder verlieren.',
    explanation: { detailed: `$\\Delta H^{0}$ ist ${exo ? 'negativ' : 'positiv'}. ${correct}`, short: correct },
    cards: [CARD.vorzeichen],
  }
}

const REACTION_LEVEL = (x: ThermoReaction, level: Level) => (level === 1 ? x.formation === true : true)

function dhTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  const pool = THERMO_REACTIONS.filter((x) => REACTION_LEVEL(x, level))
    .filter((x) => (focus === 'chem-dh-water-gas' ? hasWaterL(x.left) || hasWaterL(x.right) : focus === 'chem-dh-coefficients' ? hasCoef(x.left) || hasCoef(x.right) : true))
  const x = rng.pick(pool)
  const dh = reactionDH(x)
  const steps: GuidedStep[] = []
  const products = sumStep('produkte', x.right, rng, focus)
  if (!products) return null
  steps.push(products)
  // die Summe der Edukte als eigener Schritt nur, wo dabei ein typischer Fehler passieren kann
  const educts = x.formation ? null : sumStep('edukte', x.left, rng, focus)
  if (educts) steps.push(educts)
  const total = dhStep(x, rng, focus)
  if (!total) return null
  steps.push(total)
  if (level < 3) steps.push(signStep(dh, rng, focus))
  const keys = keysOf(x)
  const trap = keys.includes('H2O(l)') ? ['H2O(g)'] : []
  return {
    task: {
      ref,
      instruction: 'Berechne die Reaktionsenthalpie',
      functionLatex: reactionCe(x),
      note: `${x.title}. Standardbildungsenthalpien in kJ/mol: ${valuesText(keys, dfhOf, trap)}. Elemente im Standardzustand: $0$.`,
      steps,
      cards: [CARD.reaktion, ...(level < 3 ? [CARD.vorzeichen] : [])],
      resultLatex: r`\Delta H^{0} = ${kj(dh)}`,
      resultNote: ratSign(dh) < 0 ? 'Die Reaktion ist exotherm.' : 'Die Reaktion ist endotherm.',
    },
    form: `dh:${level}`,
    substance: x.id,
  }
}

// --- Vorzeichen von ΔH und ΔS ---

type Phase = 's' | 'l' | 'g'
const ORDER: Readonly<Record<Phase, number>> = { s: 0, l: 1, g: 2 }
const PROCESSES = {
  schmelzen: { from: 's', to: 'l', verb: 'schmilzt' },
  erstarren: { from: 'l', to: 's', verb: 'erstarrt' },
  verdampfen: { from: 'l', to: 'g', verb: 'verdampft' },
  kondensieren: { from: 'g', to: 'l', verb: 'kondensiert' },
  sublimieren: { from: 's', to: 'g', verb: 'sublimiert (geht direkt vom festen in den gasförmigen Zustand über)' },
  resublimieren: { from: 'g', to: 's', verb: 'resublimiert (geht direkt vom gasförmigen in den festen Zustand über)' },
} as const satisfies Readonly<Record<string, { from: Phase; to: Phase; verb: string }>>
type Process = keyof typeof PROCESSES

const PHASE_SUBSTANCES: readonly { name: string; ce: string; processes: readonly Process[] }[] = [
  { name: 'Wasser', ce: 'H2O', processes: ['schmelzen', 'erstarren', 'verdampfen', 'kondensieren'] },
  { name: 'Ethanol', ce: 'C2H5OH', processes: ['verdampfen', 'kondensieren'] },
  { name: 'Iod', ce: 'I2', processes: ['sublimieren', 'resublimieren'] },
  { name: 'Kohlenstoffdioxid', ce: 'CO2', processes: ['sublimieren', 'resublimieren'] },
  { name: 'Brom', ce: 'Br2', processes: ['verdampfen', 'kondensieren'] },
  { name: 'Eisen', ce: 'Fe', processes: ['schmelzen', 'erstarren'] },
  { name: 'Natriumchlorid', ce: 'NaCl', processes: ['schmelzen', 'erstarren'] },
  { name: 'Quecksilber', ce: 'Hg', processes: ['verdampfen', 'erstarren'] },
  { name: 'Ammoniak', ce: 'NH3', processes: ['verdampfen', 'kondensieren'] },
  { name: 'Zinn', ce: 'Sn', processes: ['schmelzen', 'erstarren'] },
]

const DH_UP = 'Wärme wird aufgenommen: $\\Delta H > 0$.'
const DH_DOWN = 'Wärme wird abgegeben: $\\Delta H < 0$.'
const DS_UP = 'Die Unordnung nimmt zu: $\\Delta S > 0$.'
const DS_DOWN = 'Die Unordnung nimmt ab: $\\Delta S < 0$.'

function dsStep(up: boolean, why: string, rng: Rng, focus?: string): GuidedStep {
  const correct = up ? DS_UP : DS_DOWN
  return {
    id: 'ds',
    title: 'Entropie',
    question: 'Wie ändert sich die Entropie?',
    choices: stepChoices(rng, { key: correct, content: correct }, [textWrong('chem-ds-sign', up ? DS_DOWN : DS_UP)], focus),
    hint: 'Die Entropie ist ein Maß für die Unordnung. Sind die Teilchen danach freier beweglich, oder gibt es mehr Gasteilchen?',
    explanation: { detailed: `${why} ${correct}`, short: correct },
    cards: [CARD.entropie],
  }
}

function phaseTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc {
  const sub = rng.pick(PHASE_SUBSTANCES)
  const proc = rng.pick(sub.processes)
  const { from, to, verb } = PROCESSES[proc]
  const up = ORDER[to] > ORDER[from]
  const dhCorrect = up ? DH_UP : DH_DOWN
  return {
    task: {
      ref,
      instruction: 'Bestimme die Vorzeichen von $\\Delta H$ und $\\Delta S$',
      note: `${sub.name} $\\ce{${sub.ce}}$ ${verb}.`,
      steps: [
        {
          id: 'dh',
          title: 'Enthalpie',
          question: 'Wird dabei Wärme aufgenommen oder abgegeben?',
          choices: stepChoices(rng, { key: dhCorrect, content: dhCorrect }, [textWrong('chem-dh-phase', up ? DH_DOWN : DH_UP)], focus),
          hint: 'Muss man Energie zuführen, um die Teilchen voneinander zu lösen, oder werden beim Zusammenrücken Kräfte wirksam?',
          explanation: {
            detailed: up
              ? 'Um die Teilchen voneinander zu lösen, müssen Anziehungskräfte überwunden werden; dafür braucht es Wärme. '.concat(dhCorrect)
              : 'Rücken die Teilchen zusammen, werden Anziehungskräfte wirksam und Wärme wird frei. '.concat(dhCorrect),
            short: dhCorrect,
          },
          cards: [CARD.vorzeichen],
        },
        dsStep(up, up ? 'Die Teilchen sind danach freier beweglich.' : 'Die Teilchen sind danach weniger beweglich und geordneter.', rng, focus),
      ],
      cards: [CARD.vorzeichen, CARD.entropie],
      resultLatex: up ? r`\Delta H > 0, \quad \Delta S > 0` : r`\Delta H < 0, \quad \Delta S < 0`,
    },
    form: `phase:${level}:${proc}`,
    substance: `${sub.ce}:${proc}`,
  }
}

// Gasteilchen einer Seite laut Gleichung bzw. (Fehler) als Zahl der gasförmigen Stoffe
const gasMol = (side: readonly Term[], noCoef = false) => side.filter(([, k]) => k.endsWith('(g)')).reduce((s, [c]) => s + (noCoef ? 1 : c), 0)

// Reaktionen, bei denen die Zahl der Gasteilchen das Vorzeichen von ΔS bestimmt (Tabellenwerte stimmen damit überein)
export const GAS_DS_REACTIONS = THERMO_REACTIONS.filter((x) => {
  const dn = gasMol(x.right) - gasMol(x.left)
  return dn !== 0 && Math.sign(dn) === ratSign(reactionDS(x))
})

function gasDsTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  const x = rng.pick(GAS_DS_REACTIONS)
  const l = gasMol(x.left)
  const rr = gasMol(x.right)
  const text = (a: number, b: number) => `links $${a}$ mol, rechts $${b}$ mol Gas`
  const correct = text(l, rr)
  const count = stepChoices(rng, { key: correct, content: correct }, [textWrong('chem-ds-count', text(gasMol(x.left, true), gasMol(x.right, true)))], focus)
  const up = rr > l
  const steps: GuidedStep[] = []
  if (count.length > 0) {
    steps.push({
      id: 'gas',
      title: 'Gasteilchen zählen',
      question: 'Wie viel Gas steht laut Gleichung links und rechts?',
      choices: count,
      hint: 'Zähle die Koeffizienten der gasförmigen Stoffe (g) zusammen; Feststoffe und Flüssigkeiten zählen nicht.',
      explanation: { detailed: `Nur die Stoffe mit (g), mit ihren Koeffizienten: ${correct}.`, short: correct },
      cards: [CARD.entropie],
    })
  }
  steps.push(dsStep(up, up ? 'Es entsteht mehr Gas; Gasteilchen sind besonders frei beweglich.' : 'Es wird Gas verbraucht; die Teilchen werden weniger beweglich.', rng, focus))
  return {
    task: {
      ref,
      instruction: 'Schätze das Vorzeichen von $\\Delta S$ ab',
      functionLatex: reactionCe(x),
      note: `${x.title}.`,
      steps,
      cards: [CARD.entropie],
      resultLatex: up ? r`\Delta S > 0` : r`\Delta S < 0`,
      resultNote: `Aus der Tabelle: $\\Delta S^{0} = ${dec(reactionDS(x))}\\,\\mathrm{J/K}$.`,
    },
    form: `gas-ds:${level}`,
    substance: x.id,
  }
}

function entropyTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  if (focus === 'chem-ds-count' || (level > 1 && focus !== 'chem-dh-phase' && rng.chance(0.6))) return gasDsTask(level, rng, ref, focus)
  return phaseTask(level, rng, ref, focus)
}

// --- freie Enthalpie ---

// Reaktionen mit Flüssigkeiten oder leicht schmelzenden Feststoffen (Natrium, Iod, Schwefel, Glucose) nur bei 25 °C; die übrigen
// bis 600 °C, wo keiner ihrer Stoffe den Zustand wechselt
const hasLiquid = (x: ThermoReaction) => keysOf(x).some((k) => k.endsWith('(l)'))
// Calciumhydroxid gibt oberhalb von etwa 500 °C Wasser ab
const LOW_MELTING = new Set(['Na(s)', 'I2(s)', 'S(s)', 'C6H12O6(s)', 'Ca(OH)2(s)'])
const onlyAt25 = (x: ThermoReaction) => hasLiquid(x) || keysOf(x).some((k) => LOW_MELTING.has(k))
const TEMPERATURES = [25, 100, 200, 300, 400, 500, 600]

const EXERGON = 'Sie läuft freiwillig ab, $\\Delta G < 0$ (exergonisch).'
const ENDERGON = 'Sie läuft nicht freiwillig ab, $\\Delta G > 0$ (endergonisch).'
const BY_DH = { exo: 'Sie läuft freiwillig ab, weil sie exotherm ist.', endo: 'Sie läuft nicht freiwillig ab, weil sie endotherm ist.' }

const kelvinLatex = (theta: number) => r`T = ${theta} + 273{,}15 = ${dec(ratAdd(rat(theta), KELVIN))}\,\mathrm{K}`

function kelvinStep(theta: number, rng: Rng, focus?: string): GuidedStep {
  const t = ratAdd(rat(theta), KELVIN)
  return {
    id: 'kelvin',
    title: 'Temperatur in Kelvin',
    question: `Welche Temperatur setzt du für ${theta} °C ein?`,
    choices: stepChoices(rng, { key: dec(t), content: math(r`${dec(t)}\,\mathrm{K}`) }, [{ rule: 'chem-dg-celsius', key: String(theta), content: math(r`${theta}\,\mathrm{K}`) }], focus),
    hint: 'In thermodynamischen Formeln steht die absolute Temperatur.',
    explanation: { detailed: `$${kelvinLatex(theta)}$.`, short: math(r`${dec(t)}\,\mathrm{K}`) },
    established: kelvinLatex(theta),
    cards: [CARD.gibbs],
  }
}

function gibbsTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  const x = rng.pick(THERMO_REACTIONS)
  const theta = onlyAt25(x) ? 25 : rng.pick(TEMPERATURES)
  const dh = reactionDH(x)
  const dsJ = reactionDS(x)
  const ds = ratDiv(dsJ, rat(1000))
  const t = ratAdd(rat(theta), KELVIN)
  const dg = ratSub(dh, ratMul(t, ds))
  // nahe 0 wäre das Urteil heikel (gerundete Tabellenwerte)
  if (Math.abs(ratToNumber(dg)) < 5) return null
  const kjU = (v: Rational) => unit(v, 'kJ')
  const gStep = stepChoices(
    rng,
    { key: kjU(dg), content: math(kjU(dg)) },
    tolerantWrongs(
      dg,
      [
        { rule: 'chem-dg-celsius', value: ratSub(dh, ratMul(rat(theta), ds)) },
        { rule: 'chem-dg-units', value: ratSub(dh, ratMul(t, dsJ)) },
        { rule: 'chem-dg-sign', value: ratAdd(dh, ratMul(t, ds)) },
      ].filter((w) => ratSign(w.value) !== 0),
      kjU,
    ),
    focus,
  )
  const exergonic = ratSign(dg) < 0
  const verdict = exergonic ? EXERGON : ENDERGON
  const byDh = ratSign(dh) < 0 ? BY_DH.exo : BY_DH.endo
  const verdictChoices = stepChoices(
    rng,
    { key: verdict, content: verdict },
    [textWrong('chem-dg-exergonic', exergonic ? ENDERGON : EXERGON), ...((ratSign(dh) < 0) !== exergonic ? [textWrong('chem-dg-enthalpy-only', byDh)] : [])],
    focus,
  )
  const dsKjStep = stepChoices(
    rng,
    { key: dec(ds), content: math(r`${dec(ds)}\,\mathrm{kJ/K}`) },
    [{ rule: 'chem-dg-units', key: dec(dsJ), content: math(r`${dec(dsJ)}\,\mathrm{kJ/K}`) }],
    focus,
  )
  if (gStep.length === 0) return null
  const line = r`\Delta G = ${kj(dh)} - ${dec(t)}\,\mathrm{K} \cdot (${dec(ds)}\,\mathrm{kJ/K}) ${eqSign(dg)} ${kjU(dg)}`
  return {
    task: {
      ref,
      instruction: 'Berechne die freie Enthalpie',
      functionLatex: r`\begin{gathered} ${reactionCe(x)} \\ \Delta H^{0} = ${kj(dh)} \quad \Delta S^{0} = ${dec(dsJ)}\,\mathrm{J/K} \quad \vartheta = ${theta}\,^{\circ}\mathrm{C} \end{gathered}`,
      note: `${x.title}. Nimm $\\Delta H$ und $\\Delta S$ als unabhängig von der Temperatur an; die Werte gelten für die Gleichung, wie sie dasteht.`,
      steps: [
        kelvinStep(theta, rng, focus),
        {
          id: 'ds-kj',
          title: 'Einheiten angleichen',
          question: '$\\Delta H$ steht in kJ. Wie lautet $\\Delta S$ in kJ/K?',
          choices: dsKjStep,
          hint: '$1\\,\\mathrm{kJ} = 1000\\,\\mathrm{J}$.',
          explanation: { detailed: `$\\Delta S = ${dec(dsJ)}\\,\\mathrm{J/K} = ${dec(ds)}\\,\\mathrm{kJ/K}$.`, short: math(r`${dec(ds)}\,\mathrm{kJ/K}`) },
          cards: [CARD.gibbs],
        },
        {
          id: 'dg',
          title: 'Freie Enthalpie',
          question: `Wie groß ist $\\Delta G$ bei ${theta} °C?`,
          choices: gStep,
          hint: 'Setze in die Gibbs-Helmholtz-Gleichung ein; achte auf Vorzeichen und Einheiten.',
          explanation: { detailed: `$\\Delta G = \\Delta H - T \\cdot \\Delta S$: $${line}$.`, short: math(r`\Delta G ${eqSign(dg)} ${kjU(dg)}`) },
          established: line,
          cards: [CARD.gibbs],
        },
        {
          id: 'freiwillig',
          title: 'Freiwillig?',
          question: `Läuft die Reaktion bei ${theta} °C freiwillig ab?`,
          choices: verdictChoices,
          hint: 'Entscheidend ist das Vorzeichen von $\\Delta G$.',
          explanation: { detailed: `$\\Delta G$ ist ${exergonic ? 'negativ' : 'positiv'}. ${verdict}`, short: verdict },
          cards: [CARD.gibbs],
        },
      ],
      cards: [CARD.gibbs],
      resultLatex: r`\Delta G ${eqSign(dg)} ${kjU(dg)}`,
      resultNote: exergonic ? 'Die Reaktion läuft bei dieser Temperatur freiwillig ab.' : 'Die Reaktion läuft bei dieser Temperatur nicht freiwillig ab.',
    },
    form: `gibbs:${level}:${exergonic ? 'ex' : 'en'}`,
    substance: x.id,
  }
}

// --- freiwillig bei welcher Temperatur? ---

type Range = 'always' | 'never' | 'high' | 'low'
const RANGE_TEXT: Readonly<Record<Range, string>> = {
  always: 'bei jeder Temperatur',
  never: 'bei keiner Temperatur',
  high: 'nur oberhalb einer bestimmten Temperatur',
  low: 'nur unterhalb einer bestimmten Temperatur',
}
// Wo ist f(T) = a + T · b negativ? (bei T nahe 0 entscheidet a, bei großem T entscheidet b)
function rangeOf(a: number, b: number): Range {
  const low = a < 0
  const high = b < 0
  return low && high ? 'always' : !low && !high ? 'never' : low ? 'low' : 'high'
}
export const spontaneousRange = (dh: number, ds: number): Range => rangeOf(dh, -ds)

function rangeWrongs(dh: number, ds: number): WrongValue[] {
  return [
    textWrong('chem-dg-enthalpy-only', RANGE_TEXT[dh < 0 ? 'always' : 'never']),
    // ΔH + T · ΔS
    textWrong('chem-dg-sign', RANGE_TEXT[rangeOf(dh, ds)]),
    // ΔG > 0 für freiwillig gehalten
    textWrong('chem-dg-exergonic', RANGE_TEXT[rangeOf(-dh, ds)]),
  ]
}

const RANGE_REACTIONS = THERMO_REACTIONS.filter((x) => ratSign(reactionDS(x)) !== 0)

function rangeTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  // erst den Fall wählen, dann die Reaktion: sonst wären fast alle exotherm
  const want = rng.pick<Range>(['always', 'never', 'high', 'low'])
  const pool = RANGE_REACTIONS.filter((x) => spontaneousRange(ratToNumber(reactionDH(x)), ratToNumber(reactionDS(x))) === want)
  const x = rng.pick(pool.length > 0 ? pool : RANGE_REACTIONS)
  const dh = ratToNumber(reactionDH(x))
  const ds = ratToNumber(reactionDS(x))
  const range = spontaneousRange(dh, ds)
  const correct = RANGE_TEXT[range]
  const choices = stepChoices(rng, { key: correct, content: correct }, rangeWrongs(dh, ds), focus)
  if (choices.length === 0) return null
  const why: Readonly<Record<Range, string>> = {
    always: '$\\Delta H < 0$ und $-T \\cdot \\Delta S < 0$: Beide Beiträge machen $\\Delta G$ negativ, bei jeder Temperatur.',
    never: '$\\Delta H > 0$ und $-T \\cdot \\Delta S > 0$: Beide Beiträge machen $\\Delta G$ positiv, bei jeder Temperatur.',
    high: '$\\Delta H > 0$, aber $-T \\cdot \\Delta S < 0$: Erst bei hoher Temperatur überwiegt der Entropie-Beitrag und $\\Delta G$ wird negativ.',
    low: '$\\Delta H < 0$, aber $-T \\cdot \\Delta S > 0$: Nur bei niedriger Temperatur überwiegt $\\Delta H$ und $\\Delta G$ bleibt negativ.',
  }
  return {
    task: {
      ref,
      instruction: 'Entscheide, wann die Reaktion freiwillig abläuft',
      functionLatex: r`\begin{gathered} ${reactionCe(x)} \\ \Delta H^{0} = ${kj(reactionDH(x))} \quad \Delta S^{0} = ${dec(reactionDS(x))}\,\mathrm{J/K} \end{gathered}`,
      note: `${x.title}. Nimm $\\Delta H$ und $\\Delta S$ als unabhängig von der Temperatur an.`,
      steps: [
        {
          id: 'bereich',
          title: 'Freiwillig?',
          question: 'Bei welchen Temperaturen läuft die Reaktion freiwillig ab?',
          choices,
          hint: 'Betrachte $\\Delta G = \\Delta H - T \\cdot \\Delta S$ bei sehr niedriger und bei sehr hoher Temperatur.',
          explanation: { detailed: why[range], short: correct },
          cards: [CARD.gibbs],
        },
      ],
      cards: [CARD.gibbs],
      resultText: `Freiwillig ${correct}.`,
    },
    form: `bereich:${level}:${range}`,
    substance: x.id,
  }
}

// --- Grenztemperatur ---

// gleiche Vorzeichen von ΔH und ΔS, ohne Flüssigkeiten, Grenztemperatur zwischen 250 und 2000 K
export const LIMIT_REACTIONS = THERMO_REACTIONS.filter((x) => {
  const dh = ratToNumber(reactionDH(x))
  const ds = ratToNumber(reactionDS(x))
  const t = (1000 * dh) / ds
  return !onlyAt25(x) && Math.sign(dh) === Math.sign(ds) && t > 250 && t < 2000
})

function limitTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  const x = rng.pick(LIMIT_REACTIONS)
  const dh = reactionDH(x)
  const ds = reactionDS(x)
  const keys = keysOf(x)
  // ΔS aus der Tabelle
  const elementsZero = (k: string) => (thermoByKey(k)!.element ? rat(0) : sOf(k))
  const dsWrong: WrongValue[] = [
    { rule: 'chem-dh-reversed', key: dec(ratNeg(ds)), content: math(r`${dec(ratNeg(ds))}\,\mathrm{J/K}`) },
    ...(hasCoefAny(x) ? [{ rule: 'chem-dh-coefficients', key: dec(reactionDS(x, { noCoef: true })), content: math(r`${dec(reactionDS(x, { noCoef: true }))}\,\mathrm{J/K}`) }] : []),
    ...(keys.some((k) => thermoByKey(k)!.element)
      ? [(() => {
          const v = ratSub(sideSum(x.right, elementsZero), sideSum(x.left, elementsZero))
          return { rule: 'chem-ds-element-zero', key: dec(v), content: math(r`${dec(v)}\,\mathrm{J/K}`) }
        })()]
      : []),
  ]
  const dsChoices = stepChoices(rng, { key: dec(ds), content: math(r`${dec(ds)}\,\mathrm{J/K}`) }, dsWrong, focus)
  const t = ratDiv(ratMul(dh, rat(1000)), ds)
  const tChoices = stepChoices(
    rng,
    { key: unit(t, 'K'), content: math(unit(t, 'K')) },
    tolerantWrongs(
      t,
      [
        { rule: 'chem-dg-units', value: ratDiv(dh, ds) },
        { rule: 'chem-dg-kelvin-twice', value: ratSub(t, KELVIN) },
      ],
      (v) => unit(v, 'K'),
    ),
    focus,
  )
  const above = ratSign(dh) > 0
  const tText = unit(t, 'K')
  const text = (up: boolean) => (up ? `Oberhalb von etwa $${tText}$ läuft sie freiwillig ab.` : `Unterhalb von etwa $${tText}$ läuft sie freiwillig ab.`)
  const correct = text(above)
  const rangeChoices = stepChoices(
    rng,
    { key: correct, content: correct },
    [
      textWrong('chem-dg-sign', text(!above)),
      textWrong('chem-dg-enthalpy-only', above ? 'Bei keiner Temperatur, weil sie endotherm ist.' : 'Bei jeder Temperatur, weil sie exotherm ist.'),
    ],
    focus,
  )
  if (dsChoices.length === 0 || tChoices.length === 0 || rangeChoices.length === 0) return null
  const dsLine = r`\Delta S^{0} = ${sumLine(x.right, sOf)} - (${sumLine(x.left, sOf)}) = ${dec(ds)}\,\mathrm{J/K}`
  const tLine = r`T = \frac{\Delta H}{\Delta S} = \frac{${dec(ratMul(dh, rat(1000)))}\,\mathrm{J}}{${dec(ds)}\,\mathrm{J/K}} ${eqSign(t)} ${unit(t, 'K')}`
  return {
    task: {
      ref,
      instruction: 'Bestimme, ab welcher Temperatur sich das Vorzeichen von $\\Delta G$ ändert',
      functionLatex: r`\begin{gathered} ${reactionCe(x)} \\ \Delta H^{0} = ${kj(dh)} \end{gathered}`,
      note: `${x.title}. Standardentropien in J/(mol · K): ${valuesText(keys, sOf)}. Nimm $\\Delta H$ und $\\Delta S$ als unabhängig von der Temperatur an.`,
      steps: [
        {
          id: 'ds',
          title: 'Reaktionsentropie',
          question: 'Wie groß ist $\\Delta S^{0}$ für die Gleichung, wie sie dasteht?',
          choices: dsChoices,
          hint: 'Wie bei der Enthalpie: Produkte minus Edukte, jeder Wert mal Koeffizient. Achtung: Auch Elemente haben eine Entropie.',
          explanation: { detailed: `$${dsLine}$.`, short: math(r`\Delta S^{0} = ${dec(ds)}\,\mathrm{J/K}`) },
          established: dsLine,
          cards: [CARD.entropie],
        },
        {
          id: 'grenze',
          title: 'Grenztemperatur',
          question: 'Bei welcher Temperatur ist $\\Delta G = 0$?',
          choices: tChoices,
          hint: 'Setze $\\Delta G = 0$ in die Gibbs-Helmholtz-Gleichung und stelle nach $T$ um; gleiche vorher die Einheiten an.',
          explanation: { detailed: `$0 = \\Delta H - T \\cdot \\Delta S$, also $${tLine}$.`, short: math(unit(t, 'K')) },
          established: tLine,
          cards: [CARD.grenze],
        },
        {
          id: 'bereich',
          title: 'Ober- oder unterhalb?',
          question: 'In welchem Bereich läuft die Reaktion freiwillig ab?',
          choices: rangeChoices,
          hint: 'Wie verhält sich $\\Delta G$ bei sehr hoher Temperatur, wenn $T \\cdot \\Delta S$ überwiegt?',
          explanation: {
            detailed: above
              ? 'Beide Werte sind positiv: Bei hoher Temperatur überwiegt $T \\cdot \\Delta S$, und $\\Delta G$ wird negativ. '.concat(correct)
              : 'Beide Werte sind negativ: Bei niedriger Temperatur überwiegt $\\Delta H$, und $\\Delta G$ ist negativ. '.concat(correct),
            short: correct,
          },
          cards: [CARD.grenze],
        },
      ],
      cards: [CARD.entropie, CARD.grenze],
      resultLatex: r`T ${eqSign(t)} ${unit(t, 'K')}`,
      resultNote: correct,
    },
    form: `grenze:${level}:${above ? 'hoch' : 'tief'}`,
    substance: x.id,
  }
}

const hasCoefAny = (x: ThermoReaction) => [...x.left, ...x.right].some(([c]) => c > 1)

// --- K aus ΔG⁰ ---

// Kommazahl mit 7 gültigen Ziffern als exakter Bruch (Gleitkommarechnung für ln und e)
function ratOf(x: number): Rational {
  const [m, e] = x.toExponential(6).split('e')
  const mantissa = parseDecimal(m)!
  const exp = Number(e)
  return exp >= 0 ? ratMul(mantissa, rat(10n ** BigInt(exp))) : ratDiv(mantissa, rat(10n ** BigInt(-exp)))
}

const DG_VALUES = ['-25', '-20', '-17.1', '-14', '-11.4', '-8', '-5.7', '-3', '3', '5.7', '8', '11.4', '14', '17.1', '20']

function kTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  const dgText = rng.pick(DG_VALUES)
  const dg = parseDecimal(dgText)!
  const theta = 25
  const t = ratAdd(rat(theta), KELVIN)
  const rt = ratToNumber(ratMul(R_GAS, t))
  const lnK = (-ratToNumber(dg) * 1000) / rt
  const lnRight = ratOf(lnK)
  const lnWrong = [
    { rule: 'chem-dg-units', value: ratOf(-ratToNumber(dg) / rt) },
    { rule: 'chem-dg-sign', value: ratOf(-lnK) },
    { rule: 'chem-dg-celsius', value: ratOf((-ratToNumber(dg) * 1000) / (8.314 * theta)) },
  ]
  const lnChoices = stepChoices(rng, { key: sig(lnRight), content: math(sig(lnRight)) }, tolerantWrongs(lnRight, lnWrong, sig), focus)
  const kValue = ratOf(Math.exp(lnK))
  const kChoices = stepChoices(
    rng,
    { key: sig(kValue), content: math(sig(kValue)) },
    tolerantWrongs(
      kValue,
      [
        { rule: 'chem-dg-lg', value: ratOf(10 ** lnK) },
        { rule: 'chem-dg-sign', value: ratOf(Math.exp(-lnK)) },
      ],
      sig,
    ),
    focus,
  )
  if (lnChoices.length === 0 || kChoices.length === 0) return null
  const dgLatex = r`\Delta G^{0} = ${dec(dg)}\,\mathrm{kJ/mol}`
  const lnLine = r`\ln K = -\frac{\Delta G^{0}}{R \cdot T} = -\frac{${dec(ratMul(dg, rat(1000)))}\,\mathrm{J/mol}}{8{,}314\,\mathrm{J/(mol \cdot K)} \cdot ${dec(t)}\,\mathrm{K}} \approx ${sig(lnRight)}`
  const kLine = r`K = e^{${sig(lnRight)}} \approx ${sig(kValue)}`
  const favoured = ratSign(dg) < 0
  return {
    task: {
      ref,
      instruction: 'Berechne die Gleichgewichtskonstante aus der freien Standardenthalpie',
      functionLatex: r`${dgLatex} \qquad \vartheta = ${theta}\,^{\circ}\mathrm{C}`,
      note: 'Rechne mit $\\Delta G^{0} = -R \\cdot T \\cdot \\ln K$ und $R = 8{,}314\\,\\mathrm{J/(mol \\cdot K)}$. $K$ ohne Einheit.',
      steps: [
        kelvinStep(theta, rng, focus),
        {
          id: 'ln',
          title: 'ln K',
          question: 'Wie groß ist $\\ln K$?',
          choices: lnChoices,
          hint: 'Stelle nach $\\ln K$ um; $\\Delta G^{0}$ muss dafür in J/mol stehen, weil $R$ in J angegeben ist.',
          explanation: { detailed: `$${lnLine}$.`, short: math(r`\ln K \approx ${sig(lnRight)}`) },
          established: lnLine,
          cards: [CARD.k],
        },
        {
          id: 'k',
          title: 'K',
          question: 'Wie groß ist $K$?',
          choices: kChoices,
          hint: 'Welche Funktion macht den natürlichen Logarithmus rückgängig?',
          explanation: { detailed: `$${kLine}$. ${favoured ? 'Weil $\\Delta G^{0} < 0$ ist, ist $K > 1$: Die Produkte überwiegen.' : 'Weil $\\Delta G^{0} > 0$ ist, ist $K < 1$: Die Edukte überwiegen.'}`, short: math(r`K \approx ${sig(kValue)}`) },
          established: kLine,
          cards: [CARD.k],
        },
      ],
      cards: [CARD.k],
      resultLatex: r`K \approx ${sig(kValue)}`,
    },
    form: `dg-k:${level}:${favoured ? 'neg' : 'pos'}`,
    substance: `dg${dgText}`,
  }
}

export { dhTask, phaseTask, gasDsTask, gibbsTask, rangeTask, limitTask, kTask }

export const ENERGIE_GENERATORS: readonly ChemGenerator[] = [
  {
    kind: 'reaktionsenthalpie',
    part: 'reaktionsenthalpie',
    weights: { 1: 0.55, 2: 0.3, 3: 0.25 },
    errors: ['chem-dh-reversed', 'chem-dh-coefficients', 'chem-dh-water-gas', 'chem-dh-sign'],
    generate: dhTask,
  },
  {
    kind: 'entropie',
    part: 'entropie',
    weights: { 1: 0.45, 2: 0.2, 3: 0.1 },
    errors: ['chem-dh-phase', 'chem-ds-sign', 'chem-ds-count'],
    generate: entropyTask,
  },
  {
    kind: 'gibbs',
    part: 'freie-enthalpie',
    weights: { 2: 0.3, 3: 0.15 },
    errors: ['chem-dg-celsius', 'chem-dg-units', 'chem-dg-sign', 'chem-dg-exergonic', 'chem-dg-enthalpy-only'],
    generate: gibbsTask,
  },
  {
    kind: 'bereich',
    part: 'freie-enthalpie',
    weights: { 2: 0.2, 3: 0.15 },
    errors: ['chem-dg-enthalpy-only', 'chem-dg-sign', 'chem-dg-exergonic'],
    generate: rangeTask,
  },
  {
    kind: 'grenztemperatur',
    part: 'freie-enthalpie',
    weights: { 3: 0.2 },
    errors: ['chem-dh-reversed', 'chem-dh-coefficients', 'chem-ds-element-zero', 'chem-dg-units', 'chem-dg-kelvin-twice', 'chem-dg-sign', 'chem-dg-enthalpy-only'],
    generate: limitTask,
  },
  {
    kind: 'dg-k',
    part: 'freie-enthalpie',
    weights: { 3: 0.15 },
    errors: ['chem-dg-celsius', 'chem-dg-units', 'chem-dg-sign', 'chem-dg-lg'],
    generate: kTask,
  },
]
