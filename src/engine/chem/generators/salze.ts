import type { GuidedStep } from '../../guided/types.ts'
import type { Rng } from '../../random/rng.ts'
import type { Level, TaskRef } from '../../tasks/taskNumber.ts'
import { ANIONS, CATIONS, type Ion, ROMAN, ionCe, isAllowedSalt, isSoluble, meltsAsIons, saltFormula, saltIndices, saltName } from '../ions.ts'
import { type ChemCalc, type ChemGenerator, type WrongValue, stepChoices } from './shared.ts'

// Rechnungen zum Thema „Ionenbindung und Salze" (Plan M4, Thema 3.1):
// - Formel aus dem Namen (Unterthema „formel"): Ionen mit Ladung → Formel mit den kleinsten ganzen Zahlen
// - Name aus der Formel (ab Vertiefung): bei Nebengruppen erst die Ladung des Kations, dann der Name
// - Zerfall in Ionen (Unterthema „zerfall"): in Wasser gelöst oder als Schmelze
// - Born-Haber-Kreisprozess (Unterthema „energie", Klausurniveau): Gitter- oder Bildungsenthalpie aus gegebenen Werten
// Die Aufgabe nennt die Salze „ionisch" wie die Klausur (docs/CHEMIE.md §5).

const CARD_FORMULA = 'ionen-formel'
const CARD_NAMES = 'ionen-namen'
const CARD_POLY = 'ionen-molekuelionen'
const CARD_DISSOCIATION = 'ionen-zerfall'
const CARD_BORN_HABER = 'ionen-born-haber'

const ce = (text: string) => String.raw`\ce{${text}}`
const math = (latex: string) => `$${latex}$`
const wrongOf = (rule: string, latex: string): WrongValue => ({ rule, key: latex, content: math(latex) })

export type Salt = { readonly cation: Ion; readonly anion: Ion }

const ionsUpTo = (list: readonly Ion[], level: Level) => list.filter((i) => i.level <= Math.min(level, 2))

// Salz der Stufe: Grundlagen nur einfache Ionen; Vertiefung mit Molekül-Ionen oder Nebengruppe; Klausurniveau alles
export function pickSalt(level: Level, rng: Rng, extra: (s: Salt) => boolean = () => true): Salt | null {
  const cation = rng.pick(ionsUpTo(CATIONS, level))
  const anions = ionsUpTo(ANIONS, level).filter((a) => isAllowedSalt(cation, a) && extra({ cation, anion: a }))
  if (anions.length === 0) return null
  const anion = rng.pick(anions)
  // Vertiefung: mindestens eines der beiden Ionen aus der Vertiefung (sonst wie Grundlagen)
  if (level === 2 && cation.level === 1 && anion.level === 1 && rng.chance(0.7)) return null
  return { cation, anion }
}

const formulaOf = (s: Salt) => saltFormula(s.cation, s.anion)
const nameOf = (s: Salt) => saltName(s.cation, s.anion)
const hasNumeral = (i: Ion) => i.name.endsWith(')')
const elementName = (i: Ion) => i.name.replace(/\(.*\)$/, '')

// --- Formel aus dem Namen ---

// Ladung eines einatomigen Anions, wenn man die Valenzelektronen statt der fehlenden Elektronen nimmt
const valenceCharge = (a: Ion) => -(8 + a.charge)

export function ionsStep(s: Salt, rng: Rng, focus?: string): GuidedStep | null {
  const pair = (c: string, a: string) => `$${ce(c)}$ und $${ce(a)}$`
  const correct = pair(ionCe(s.cation), ionCe(s.anion))
  const wrong: WrongValue[] = []
  if (!s.anion.polyatomic) {
    wrong.push({ rule: 'chem-salt-anion-positive', key: pair(ionCe(s.cation), ionCe(s.anion, -s.anion.charge)), content: pair(ionCe(s.cation), ionCe(s.anion, -s.anion.charge)) })
    const v = valenceCharge(s.anion)
    if (v !== s.anion.charge) wrong.push({ rule: 'chem-salt-anion-valence', key: pair(ionCe(s.cation), ionCe(s.anion, v)), content: pair(ionCe(s.cation), ionCe(s.anion, v)) })
  } else {
    const size = -s.anion.charge
    const other = -(size === 2 ? 1 : 2)
    wrong.push({ rule: 'chem-salt-polyatomic-charge', key: pair(ionCe(s.cation), ionCe(s.anion, other)), content: pair(ionCe(s.cation), ionCe(s.anion, other)) })
  }
  const choices = stepChoices(rng, { key: correct, content: correct }, wrong, focus)
  if (choices.length === 0) return null
  const why = s.anion.polyatomic
    ? `$${ce(ionCe(s.anion))}$ ist ein Molekül-Ion mit fester Ladung.`
    : `Das Nichtmetall nimmt so viele Elektronen auf, bis es acht Valenzelektronen hat: $${ce(ionCe(s.anion))}$.`
  const cationWhy = hasNumeral(s.cation) ? `Die römische Ziffer im Namen gibt die Ladung des Kations an: $${ce(ionCe(s.cation))}$.` : `Das Metall gibt seine Valenzelektronen ab: $${ce(ionCe(s.cation))}$.`
  return {
    id: 'ionen',
    title: 'Ionen',
    question: `Aus welchen Ionen ist ${nameOf(s)} aufgebaut?`,
    choices,
    hint: s.anion.polyatomic ? 'Molekül-Ionen haben eine feste Ladung, die man kennen muss.' : 'Nichtmetalle bilden Anionen: Wie viele Elektronen fehlen bis zur Edelgaskonfiguration?',
    explanation: { detailed: `${cationWhy} ${why}`, short: correct },
    established: `${ce(ionCe(s.cation))},\\ ${ce(ionCe(s.anion))}`,
    cards: [CARD_FORMULA, ...(s.anion.polyatomic || s.cation.polyatomic ? [CARD_POLY] : [])],
  }
}

export function formulaStep(s: Salt, rng: Rng, focus?: string): GuidedStep | null {
  const correct = ce(formulaOf(s))
  const { cation: x, anion: y } = saltIndices(s.cation, s.anion)
  const qa = s.cation.charge
  const qb = -s.anion.charge
  const candidates: { rule: string; formula: string }[] = [
    // über Kreuz ohne Kürzen
    { rule: 'chem-salt-not-reduced', formula: saltFormula(s.cation, s.anion, { cation: qb, anion: qa }) },
    // Indizes vertauscht: Ladung des Kations als Index des Kations
    { rule: 'chem-salt-indices-swapped', formula: saltFormula(s.cation, s.anion, { cation: y, anion: x }) },
    { rule: 'chem-salt-one-to-one', formula: saltFormula(s.cation, s.anion, { cation: 1, anion: 1 }) },
    { rule: 'chem-salt-bracket', formula: saltFormula(s.cation, s.anion, { cation: x, anion: y }, false) },
    ...(hasNumeral(s.cation) ? [{ rule: 'chem-salt-numeral-count', formula: saltFormula(s.cation, s.anion, { cation: qa, anion: 1 }) }] : []),
  ]
  const wrong = candidates.filter((c) => ce(c.formula) !== correct).map((c) => wrongOf(c.rule, ce(c.formula)))
  const choices = stepChoices(rng, { key: correct, content: math(correct) }, wrong, focus)
  if (choices.length === 0) return null
  const charges = `Ladungen $+${qa}$ und $-${qb}$`
  const line = x === 1 && y === 1 ? `${charges} gleichen sich schon 1 : 1 aus` : `${charges}: ${x} · ${qa} = ${y} · ${qb}`
  return {
    id: 'formel',
    title: 'Formel',
    question: `Wie lautet die Formel von ${nameOf(s)}?`,
    choices,
    hint: 'Das Salz ist nach außen neutral: Die positiven und negativen Ladungen müssen sich aufheben, mit den kleinsten ganzen Zahlen.',
    explanation: {
      detailed: `Die ${line}. ${s.anion.polyatomic && y > 1 ? 'Ein Molekül-Ion, das mehrmals vorkommt, steht in Klammern. ' : s.cation.polyatomic && x > 1 ? 'Das Molekül-Ion steht in Klammern, wenn es mehrmals vorkommt. ' : ''}Formel: $${correct}$.`,
      short: math(correct),
    },
    established: correct,
    cards: [CARD_FORMULA, ...(s.anion.polyatomic || s.cation.polyatomic ? [CARD_POLY] : [])],
  }
}

// Aluminiumoxid und Magnesiumchlorid mit Ionen und Formel bildeten Klausuraufgabe 3a fast genau nach (§9)
export const EXAM_SALTS = ['Al2O3', 'MgCl2']

function formulaTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  const s = pickSalt(level, rng)
  if (!s || EXAM_SALTS.includes(formulaOf(s))) return null
  const first = ionsStep(s, rng, focus)
  const second = formulaStep(s, rng, focus)
  if (!first || !second) return null
  return {
    task: {
      ref,
      instruction: 'Stelle die Formel des Salzes auf',
      note: `${nameOf(s)} ist ein ionisch aufgebautes Salz.`,
      steps: [first, second],
      cards: [CARD_FORMULA, ...(s.anion.polyatomic || s.cation.polyatomic ? [CARD_POLY] : [])],
      resultLatex: ce(formulaOf(s)),
    },
    form: `formel:${level}:${s.anion.polyatomic || s.cation.polyatomic ? 'molekuelion' : 'einfach'}:${hasNumeral(s.cation) ? 'ziffer' : 'ohne'}`,
    substance: formulaOf(s),
  }
}

// --- Name aus der Formel ---

// Anion-Namen, die man leicht verwechselt (Endung -id, -it, -at; mit oder ohne Wasserstoff)
const NAME_MIXUPS: Readonly<Record<string, readonly string[]>> = {
  S: ['sulfit', 'sulfat'],
  SO3: ['sulfid', 'sulfat'],
  SO4: ['sulfid', 'sulfit'],
  N: ['nitrit', 'nitrat'],
  NO2: ['nitrid', 'nitrat'],
  NO3: ['nitrid', 'nitrit'],
  P: ['phosphat'],
  PO4: ['phosphid'],
  CO3: ['hydrogencarbonat'],
  HCO3: ['carbonat'],
  O: ['hydroxid'],
  OH: ['oxid'],
  Cl: ['chlorat'],
  Br: ['bromat'],
  I: ['iodat'],
}

function nameTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  const s = pickSalt(level, rng, ({ anion }) => NAME_MIXUPS[anion.id] !== undefined)
  if (!s) return null
  const formula = ce(formulaOf(s))
  const { cation: x, anion: y } = saltIndices(s.cation, s.anion)
  const steps: GuidedStep[] = []
  const numeral = hasNumeral(s.cation)
  if (numeral) {
    const q = s.cation.charge
    const chargeLatex = (n: number) => `+${n}`
    const wrong = [
      // Index des Kations als Ladung
      { rule: 'chem-salt-charge-from-index', value: x },
    ]
      .filter((w) => w.value !== q && w.value > 0)
      .map((w) => wrongOf(w.rule, chargeLatex(w.value)))
    const choices = stepChoices(rng, { key: chargeLatex(q), content: math(chargeLatex(q)) }, wrong, focus)
    if (choices.length === 0) return null
    steps.push({
      id: 'ladung',
      title: 'Ladung des Kations',
      question: `Welche Ladung hat das ${elementName(s.cation)}-Ion in $${formula}$?`,
      choices,
      hint: `Das Salz ist neutral. Welche Ladung hat das Anion, und wie viele davon stehen in der Formel?`,
      explanation: {
        detailed: `$${y}$ Anionen $${ce(ionCe(s.anion))}$ tragen zusammen die Ladung $-${y * -s.anion.charge}$. Sie verteilt sich auf $${x}$ Kation${x === 1 ? '' : 'en'}: jedes trägt $+${q}$.`,
        short: math(`${ce(ionCe(s.cation))}`),
      },
      established: ce(ionCe(s.cation)),
      cards: [CARD_NAMES],
    })
  }
  const name = nameOf(s)
  const wrongNames: WrongValue[] = [
    ...(NAME_MIXUPS[s.anion.id] ?? []).map((other) => ({ rule: 'chem-salt-anion-name', key: saltName(s.cation, s.anion, s.cation.name).replace(new RegExp(`${s.anion.name}$`), other), content: '' })),
    ...(numeral
      ? [
          ...(x !== s.cation.charge ? [{ rule: 'chem-salt-numeral-index', key: saltName(s.cation, s.anion, `${elementName(s.cation)}(${ROMAN[x]})`), content: '' }] : []),
          { rule: 'chem-salt-numeral-missing', key: saltName(s.cation, s.anion, elementName(s.cation)), content: '' },
        ]
      : []),
  ].map((w) => ({ ...w, content: w.key }))
  const nameChoices = stepChoices(rng, { key: name, content: name }, wrongNames.filter((w) => w.key !== name), focus)
  if (nameChoices.length === 0) return null
  steps.push({
    id: 'name',
    title: 'Name',
    question: `Wie heißt das Salz $${formula}$?`,
    choices: nameChoices,
    hint: numeral ? 'Name des Metalls, die Ladung als römische Ziffer in Klammern, dann der Name des Anions.' : 'Name des Kations, dann der Name des Anions mit der richtigen Endung.',
    explanation: {
      detailed: `Kation $${ce(ionCe(s.cation))}$: ${s.cation.name}; Anion $${ce(ionCe(s.anion))}$: ${s.anion.name}. Zusammen: ${name}.`,
      short: name,
    },
    established: String.raw`\text{${name}}`,
    cards: [CARD_NAMES, ...(s.anion.polyatomic || s.cation.polyatomic ? [CARD_POLY] : [])],
  })
  return {
    task: {
      ref,
      instruction: 'Benenne das Salz',
      functionLatex: formula,
      note: 'Das Salz ist ionisch aufgebaut.',
      steps,
      cards: [CARD_NAMES],
      resultText: `$${formula}$: ${name}`,
    },
    form: `name:${level}:${numeral ? 'ziffer' : 'ohne'}:${s.anion.polyatomic ? 'molekuelion' : 'einfach'}`,
    substance: formulaOf(s),
  }
}

// --- Zerfall in Ionen ---

function dissociationTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  const melt = rng.chance(level === 1 ? 0.2 : 0.35)
  const s = pickSalt(level, rng, (x) => (melt ? meltsAsIons(x.cation, x.anion) : isSoluble(x.cation, x.anion)))
  if (!s) return null
  const { cation: x, anion: y } = saltIndices(s.cation, s.anion)
  const state = (t: string) => (melt ? '' : t)
  const term = (n: number, i: Ion, charge = i.charge, formulaWithCount?: string) =>
    `${n === 1 ? '' : `${n} `}${formulaWithCount ? `${formulaWithCount}^${Math.abs(charge) === 1 ? '' : Math.abs(charge)}${charge > 0 ? '+' : '-'}` : ionCe(i, charge)}${state('(aq)')}`
  const left = `${formulaOf(s)}${state('(s)')}`
  const eq = (c: string, a: string) => ce(`${left} -> ${c} + ${a}`)
  const correct = eq(term(x, s.cation), term(y, s.anion))
  const wrong: WrongValue[] = [
    wrongOf('chem-dissociation-coefficients', eq(term(1, s.cation), term(1, s.anion))),
    // Index bleibt am Ion hängen (Al₂³⁺); das Molekül-Ion behält seinen Koeffizienten
    ...(x > 1 && !s.cation.polyatomic ? [wrongOf('chem-dissociation-index-ion', eq(term(1, s.cation, s.cation.charge, `${s.cation.formula}${x}`), term(y, s.anion)))] : []),
    ...(y > 1 && !s.anion.polyatomic ? [wrongOf('chem-dissociation-index-ion', eq(term(x, s.cation), term(1, s.anion, s.anion.charge, `${s.anion.formula}${y}`)))] : []),
    // Anion mit der Ladung des Kations: die Ladungen gehen nicht auf
    ...(s.cation.charge !== -s.anion.charge ? [wrongOf('chem-dissociation-charge', eq(term(x, s.cation), term(y, s.anion, -s.cation.charge)))] : []),
    // ohne Ladungen, als ob Atome entstünden
    wrongOf('chem-dissociation-atoms', ce(`${left} -> ${x === 1 ? '' : `${x} `}${s.cation.formula} + ${y === 1 ? '' : `${y} `}${s.anion.formula}`)),
  ].filter((w) => w.key !== correct)
  const choices = stepChoices(rng, { key: correct, content: math(correct) }, wrong, focus)
  if (choices.length === 0) return null
  const step: GuidedStep = {
    id: 'zerfall',
    title: 'Zerfall in Ionen',
    question: melt ? 'Welche Ionen liegen in der Schmelze vor?' : 'Wie lautet die Gleichung für das Lösen in Wasser?',
    choices,
    hint: 'Jedes Ion wird einzeln frei, mit seiner Ladung. Wie viele von jeder Sorte stecken in einer Formeleinheit?',
    explanation: {
      detailed: `Eine Formeleinheit $${ce(formulaOf(s))}$ enthält ${x} ${x === 1 ? 'Kation' : 'Kationen'} $${ce(ionCe(s.cation))}$ und ${y} ${y === 1 ? 'Anion' : 'Anionen'} $${ce(ionCe(s.anion))}$; ${melt ? 'in der Schmelze bewegen sie sich frei' : 'in Wasser werden sie einzeln von Wassermolekülen umhüllt'}: $${correct}$.`,
      short: math(correct),
    },
    established: correct,
    cards: [CARD_DISSOCIATION],
  }
  return {
    task: {
      ref,
      instruction: melt ? 'Das Salz wird geschmolzen' : 'Das Salz wird in Wasser gelöst',
      functionLatex: ce(formulaOf(s)),
      note: `${nameOf(s)}, ionisch aufgebaut.${melt ? '' : ' Schreibe die Zustände dazu: (s) fest, (aq) in Wasser gelöst.'}`,
      steps: [step],
      cards: [CARD_DISSOCIATION],
      resultLatex: correct,
    },
    form: `zerfall:${level}:${melt ? 'schmelze' : 'wasser'}:${x}-${y}`,
    substance: formulaOf(s),
  }
}

// --- Born-Haber ---

// Werte in kJ/mol (NIST Chemistry WebBook und CRC Handbook, abgerufen 11.11.2026, auf ganze Zahlen
// gerundet): Sublimation des Metalls (Atomisierung), erste Ionisierungsenergie, Elektronenaffinität,
// Bildungsenthalpie des Salzes. Bindungsenergien von F2 und Cl2 als übliche Lehrbuchwerte 158 und 242
// (Tabelle 158,7 und 242,6), damit die halbe Bindungsenergie ganzzahlig bleibt. Nur Fluoride und Chloride der Alkalimetalle (kein Verdampfungsschritt
// fehlt, docs/CHEMIE.md §6).
const METALS = [
  { id: 'Li', name: 'Lithium', sublimation: 159, ionization: 520 },
  { id: 'Na', name: 'Natrium', sublimation: 107, ionization: 496 },
  { id: 'K', name: 'Kalium', sublimation: 89, ionization: 419 },
  { id: 'Rb', name: 'Rubidium', sublimation: 81, ionization: 403 },
  { id: 'Cs', name: 'Caesium', sublimation: 76, ionization: 376 },
]
const HALOGENS = [
  { id: 'F', name: 'Fluor', bond: 158, affinity: -328 },
  { id: 'Cl', name: 'Chlor', bond: 242, affinity: -349 },
]
const FORMATION: Readonly<Record<string, number>> = { LiF: -616, LiCl: -409, NaF: -577, NaCl: -411, KF: -567, KCl: -437, RbF: -558, RbCl: -435, CsF: -553, CsCl: -443 }

const kj = (n: number) => `${n < 0 ? '-' : ''}${Math.abs(n)}\\,\\mathrm{kJ/mol}`
const signed = (n: number) => (n < 0 ? `(${n})` : `${n}`)

function bornHaberTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  const m = rng.pick(METALS)
  const x = rng.pick(HALOGENS)
  const salt = `${m.id}${x.id}`
  const hf = FORMATION[salt]
  const half = x.bond / 2
  const sum = m.sublimation + m.ionization + half + x.affinity
  const lattice = hf - sum
  // gesucht: Gitterenthalpie (aus der Bildungsenthalpie) oder Bildungsenthalpie (aus der Gitterenthalpie)
  const askLattice = rng.chance(0.6)
  const sumWrong = [
    { rule: 'chem-bh-ea-sign', value: m.sublimation + m.ionization + half - x.affinity },
    { rule: 'chem-bh-full-bond', value: m.sublimation + m.ionization + x.bond + x.affinity },
    { rule: 'chem-bh-step-missing', value: m.ionization + half + x.affinity },
  ].filter((w) => w.value !== sum)
  const first = stepChoices(rng, { key: kj(sum), content: math(kj(sum)) }, sumWrong.map((w) => wrongOf(w.rule, kj(w.value))), focus)
  const sumLine = `${m.sublimation} + ${m.ionization} + \\tfrac{1}{2} \\cdot ${x.bond} + ${signed(x.affinity)} = ${sum}`
  const target = askLattice ? lattice : hf
  const targetWrong = askLattice
    ? [
        { rule: 'chem-bh-subtracted-wrong', value: sum - hf },
        { rule: 'chem-bh-added', value: hf + sum },
      ]
    : [
        { rule: 'chem-bh-lattice-sign', value: sum - lattice },
        { rule: 'chem-bh-ions-subtracted', value: lattice - sum },
      ]
  const second = stepChoices(rng, { key: kj(target), content: math(kj(target)) }, targetWrong.filter((w) => w.value !== target).map((w) => wrongOf(w.rule, kj(w.value))), focus)
  if (first.length === 0 || second.length === 0) return null
  const ionGas = `${m.id}^+(g) + ${x.id}^-(g)`
  const given = askLattice ? `\\Delta H_f = ${kj(hf)}` : `\\Delta H_G = ${kj(lattice)}`
  const symbol = askLattice ? '\\Delta H_G' : '\\Delta H_f'
  return {
    task: {
      ref,
      instruction: askLattice ? 'Berechne die Gitterenthalpie mit dem Born-Haber-Kreisprozess' : 'Berechne die Bildungsenthalpie mit dem Born-Haber-Kreisprozess',
      functionLatex: String.raw`\begin{gathered} ${ce(`${m.id}(s) + 1/2 ${x.id}2(g) -> ${salt}(s)`)} \\ ${given} \end{gathered}`,
      note: `${m.name} reagiert mit ${x.name} zum ionisch aufgebauten Salz. Gegeben (in kJ/mol): Sublimation von ${m.name} $${m.sublimation}$, Ionisierungsenergie $${m.ionization}$, Bindungsenergie von $${ce(`${x.id}2`)}$ $${x.bond}$, Elektronenaffinität von ${x.name} $${x.affinity}$.`,
      steps: [
        {
          id: 'ionen-im-gas',
          title: 'Weg zu den Ionen',
          question: `Wie viel Energie braucht der Weg von den Elementen zu den Ionen $${ce(ionGas)}$?`,
          choices: first,
          hint: 'Metall verdampfen, ionisieren; Halogen-Moleküle spalten (wie viele braucht man?), Elektronen anlagern. Achte auf die Vorzeichen.',
          explanation: {
            detailed: `Sublimation, Ionisierung, halbe Bindungsenergie (es wird nur ein Halogen-Atom gebraucht) und Elektronenaffinität: $${sumLine}\\,\\mathrm{kJ/mol}$.`,
            short: math(`${sumLine}\\,\\mathrm{kJ/mol}`),
          },
          established: `\\Delta H_{\\text{Ionen}} = ${kj(sum)}`,
          cards: [CARD_BORN_HABER],
        },
        {
          id: askLattice ? 'gitterenthalpie' : 'bildungsenthalpie',
          title: askLattice ? 'Gitterenthalpie' : 'Bildungsenthalpie',
          question: askLattice ? 'Wie groß ist die Gitterenthalpie?' : 'Wie groß ist die Bildungsenthalpie?',
          choices: second,
          hint: 'Beide Wege von den Elementen zum Salz liefern dieselbe Energie: direkt über die Bildungsenthalpie oder über die Ionen und das Gitter.',
          explanation: askLattice
            ? {
                detailed: `Bildungsenthalpie = Weg zu den Ionen + Gitterenthalpie, also $\\Delta H_G = ${hf} - ${signed(sum)} = ${lattice}\\,\\mathrm{kJ/mol}$. Sie ist negativ: Beim Aufbau des Gitters wird Energie frei.`,
                short: math(`\\Delta H_G = ${kj(lattice)}`),
              }
            : {
                detailed: `Bildungsenthalpie = Weg zu den Ionen + Gitterenthalpie: $\\Delta H_f = ${sum} + ${signed(lattice)} = ${hf}\\,\\mathrm{kJ/mol}$.`,
                short: math(`\\Delta H_f = ${kj(hf)}`),
              },
          established: `${symbol} = ${kj(target)}`,
          cards: [CARD_BORN_HABER],
        },
      ],
      cards: [CARD_BORN_HABER],
      resultLatex: `${symbol} = ${kj(target)}`,
    },
    form: `born-haber:${level}:${askLattice ? 'gitter' : 'bildung'}`,
    substance: salt,
  }
}

// --- Erzeuger je Unterthema ---

function formel(level: Level, rng: Rng, ref: TaskRef, focus?: string) {
  return rng.chance(level === 1 ? 0.3 : 0.4) ? nameTask(level, rng, ref, focus) : formulaTask(level, rng, ref, focus)
}

export const SALZE_GENERATORS: readonly ChemGenerator[] = [
  {
    kind: 'salzformel',
    part: 'formel',
    weights: { 1: 0.6, 2: 0.55, 3: 0.45 },
    errors: [
      'chem-salt-anion-positive',
      'chem-salt-anion-valence',
      'chem-salt-polyatomic-charge',
      'chem-salt-not-reduced',
      'chem-salt-indices-swapped',
      'chem-salt-one-to-one',
      'chem-salt-bracket',
      'chem-salt-numeral-count',
      'chem-salt-charge-from-index',
      'chem-salt-anion-name',
      'chem-salt-numeral-index',
      'chem-salt-numeral-missing',
    ],
    generate: formel,
  },
  {
    kind: 'zerfall',
    part: 'zerfall',
    weights: { 1: 0.4, 2: 0.45, 3: 0.35 },
    errors: ['chem-dissociation-coefficients', 'chem-dissociation-index-ion', 'chem-dissociation-charge', 'chem-dissociation-atoms'],
    generate: dissociationTask,
  },
  {
    kind: 'born-haber',
    part: 'energie',
    weights: { 3: 0.14 },
    errors: ['chem-bh-ea-sign', 'chem-bh-full-bond', 'chem-bh-step-missing', 'chem-bh-subtracted-wrong', 'chem-bh-added', 'chem-bh-lattice-sign', 'chem-bh-ions-subtracted'],
    generate: bornHaberTask,
  },
]
