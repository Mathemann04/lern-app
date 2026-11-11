import type { GuidedStep } from '../../guided/types.ts'
import type { Rng } from '../../random/rng.ts'
import type { Level, TaskRef } from '../../tasks/taskNumber.ts'
import { PAULING, deltaEn } from '../electronegativity.ts'
import { atomCounts, parseFormula } from '../formula.ts'
import { BOIL_GROUPS, type BoilRule, FORCE_NAME, type Force, ZMK_SUBSTANCES, type ZmkSubstance, forceOf, molarMassOf, orderByBoil, orderByRule, zmkById } from '../zmk.ts'
import { type ChemCalc, type ChemGenerator, type WrongValue, stepChoices } from './shared.ts'

// Rechnungen zum Thema „Zwischenmolekulare Kräfte" (Plan M4, Thema 3.3), aus den Stoffdaten (chem/zmk.ts):
// - Stärkste Kraft (Unterthema „kraefte"): Wasserstoffbrücken möglich? → stärkste Kraft → (Klausurniveau) was beim Sieden überwunden wird
// - Siedepunkte ordnen (Unterthema „siedepunkte", ab Vertiefung): Reihenfolge → was sie entscheidet
// - Lösen (Unterthema „loesen", ab Vertiefung): in Wasser oder in Hexan?

const CARD_FORCES = 'zmk-kraefte'
const CARD_HBOND = 'zmk-wasserstoffbruecken'
const CARD_BOIL = 'zmk-siedepunkte'
const CARD_SOLVE = 'zmk-loesen'

const ce = (text: string) => String.raw`\ce{${text}}`
const textWrong = (rule: string, text: string): WrongValue => ({ rule, key: text, content: text })
const nameOf = (x: ZmkSubstance) => `$${ce(x.id)}$ (${x.name})`

// Stoffe, deren stärkste Kraft die App nicht fragt (Polarität nicht gefragt, CHEMIE.md §6)
// Iodwasserstoff: ΔEN 0,46 liegt zu nah an 0,5 (CHEMIE.md §5)
export const UNCLEAR = new Set(['H2S', 'HI'])
// Edelgase sind einzelne Atome: keine Atombindungen, nichts zum „Zerfallen“
const isAtom = (x: ZmkSubstance) => /^[A-Z][a-z]?$/.test(x.id)

// polare Bindungen im Molekül (nach Pauling), auch wenn das Molekül unpolar ist (CCl₄)
function hasPolarBonds(x: ZmkSubstance): boolean {
  const els = [...atomCounts(parseFormula(x.id)).keys()].filter((el) => PAULING[el] !== undefined)
  return els.some((a) => els.some((b) => a !== b && deltaEn(a, b) >= 50))
}

// --- Stärkste Kraft ---

const HB = {
  yes: 'Ja: Ein H-Atom sitzt direkt an N, O oder F, und dort sitzen auch freie Elektronenpaare.',
  noH: 'Nein: Kein H-Atom sitzt direkt an N, O oder F.',
  anyH: 'Ja: Das Molekül enthält H-Atome.',
  other: 'Ja: Das H-Atom sitzt an einem elektronegativen Atom wie Cl, Br, I oder S.',
  waterOnly: 'Nein: Wasserstoffbrücken gibt es nur zwischen Wassermolekülen.',
}

function hbondStep(x: ZmkSubstance, rng: Rng, focus?: string): GuidedStep | null {
  if (!x.hasH) return null
  const correct = x.hBond ? HB.yes : HB.noH
  const wrong: WrongValue[] = x.hBond
    ? [textWrong('chem-zmk-hbond-missed', HB.noH), ...(x.id !== 'H2O' ? [textWrong('chem-zmk-hbond-missed', HB.waterOnly)] : [])]
    : [textWrong('chem-zmk-any-h', HB.anyH), ...(x.hOnOther ? [textWrong('chem-zmk-h-other', HB.other)] : [])]
  const choices = stepChoices(rng, { key: correct, content: correct }, wrong, focus)
  if (choices.length === 0) return null
  return {
    id: 'bruecken',
    title: 'Wasserstoffbrücken',
    question: `Bilden Moleküle von ${nameOf(x)} untereinander Wasserstoffbrücken?`,
    choices,
    hint: 'Wasserstoffbrücken brauchen ein H-Atom, das direkt an einem sehr elektronegativen, kleinen Atom sitzt. Welche drei Atome sind das?',
    explanation: {
      detailed: x.hBond
        ? `Im Molekül sitzt ein H-Atom direkt an N, O oder F. Es trägt eine deutliche positive Teilladung und wird vom freien Paar eines N-, O- oder F-Atoms im Nachbarmolekül angezogen.`
        : `Wasserstoffbrücken entstehen nur, wenn H direkt an N, O oder F gebunden ist. ${x.hOnOther ? 'Chlor, Brom, Iod und Schwefel reichen dafür nicht.' : 'Hier sitzen die H-Atome an anderen Atomen.'}`,
      short: x.hBond ? 'Ja: H an N, O oder F.' : 'Nein: kein H an N, O oder F.',
    },
    cards: [CARD_HBOND],
  }
}

const INTRA = 'die Atombindungen innerhalb der Moleküle'

function forceStep(x: ZmkSubstance, rng: Rng, focus?: string): GuidedStep | null {
  const force = forceOf(x)
  const wrong: WrongValue[] = []
  const other = (f: Force, rule: string) => wrong.push(textWrong(rule, FORCE_NAME[f]))
  if (force === 'van-der-waals') {
    if (hasPolarBonds(x)) other('dipol-dipol', 'chem-zmk-polar-bond')
    if (x.hasH) other('wasserstoffbruecken', 'chem-zmk-any-h')
  } else if (force === 'dipol-dipol') {
    other('van-der-waals', 'chem-zmk-polar-ignored')
    if (x.hOnOther) other('wasserstoffbruecken', 'chem-zmk-h-other')
    else if (x.hasH) other('wasserstoffbruecken', 'chem-zmk-any-h')
  } else {
    other('dipol-dipol', 'chem-zmk-hbond-missed')
    other('van-der-waals', 'chem-zmk-polar-ignored')
  }
  if (!isAtom(x)) wrong.push(textWrong('chem-zmk-intra', INTRA))
  const correct = FORCE_NAME[force]
  const choices = stepChoices(rng, { key: correct, content: correct }, wrong, focus)
  if (choices.length === 0) return null
  const why: Record<Force, string> = {
    'van-der-waals': `${hasPolarBonds(x) ? 'Die Bindungen sind zwar polar, das Molekül als Ganzes aber nicht. ' : ''}Ohne Dipol und ohne Wasserstoffbrücken bleiben nur Van-der-Waals-Kräfte; sie wirken zwischen allen Teilchen.`,
    'dipol-dipol': 'Das Molekül ist polar (ein Dipol), aber kein H-Atom sitzt an N, O oder F. Die positiven und negativen Enden der Nachbarmoleküle ziehen sich an: Dipol-Dipol-Kräfte.',
    wasserstoffbruecken: 'Ein H-Atom sitzt direkt an N, O oder F: Zwischen den Molekülen bilden sich Wasserstoffbrücken, die stärkste der drei Kräfte. Van-der-Waals-Kräfte wirken zusätzlich.',
  }
  return {
    id: 'kraft',
    title: 'Stärkste Kraft',
    question: `Welche ist die stärkste zwischenmolekulare Kraft zwischen Teilchen von ${nameOf(x)}?`,
    choices,
    hint: 'Prüfe der Reihe nach: Sitzt H direkt an N, O oder F? Wenn nicht: Ist das Molekül polar? Wenn nicht: Was wirkt zwischen allen Teilchen?',
    explanation: { detailed: why[force], short: correct },
    cards: force === 'wasserstoffbruecken' ? [CARD_FORCES, CARD_HBOND] : [CARD_FORCES],
  }
}

const BOIL_TEXT = {
  inter: 'nur die Kräfte zwischen den Molekülen; die Moleküle selbst bleiben ganz',
  intra: 'die Atombindungen in den Molekülen; die Moleküle zerfallen in Atome',
  both: 'die Kräfte zwischen den Molekülen und die Atombindungen in ihnen',
}

function evaporateStep(x: ZmkSubstance, rng: Rng, focus?: string): GuidedStep | null {
  const choices = stepChoices(rng, { key: BOIL_TEXT.inter, content: BOIL_TEXT.inter }, [textWrong('chem-zmk-intra', BOIL_TEXT.intra), textWrong('chem-zmk-intra', BOIL_TEXT.both)], focus)
  return {
    id: 'sieden',
    title: 'Sieden',
    question: `Was wird überwunden, wenn ${nameOf(x)} siedet?`,
    choices,
    hint: 'Was ist im Dampf anders als in der Flüssigkeit: die Teilchen selbst oder nur ihr Abstand?',
    explanation: {
      detailed: 'Beim Sieden lösen sich die Moleküle voneinander; im Dampf sind es dieselben Moleküle wie in der Flüssigkeit. Überwunden werden nur die zwischenmolekularen Kräfte, die Atombindungen bleiben.',
      short: 'Nur die zwischenmolekularen Kräfte.',
    },
    cards: [CARD_FORCES],
  }
}

function forceTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  const pool = ZMK_SUBSTANCES.filter((x) => x.level <= level && !UNCLEAR.has(x.id))
  const x = rng.pick(pool)
  const first = hbondStep(x, rng, focus)
  const second = forceStep(x, rng, focus)
  if (!second) return null
  const steps = [...(first ? [first] : []), second, ...(level === 3 && !isAtom(x) ? [evaporateStep(x, rng, focus)!] : [])]
  return {
    task: {
      ref,
      instruction: 'Bestimme die zwischenmolekularen Kräfte',
      note: `Stoff: ${nameOf(x)}.`,
      steps,
      cards: [CARD_FORCES, CARD_HBOND],
      resultText: `Zwischen Teilchen von ${nameOf(x)} wirken als stärkste Kraft ${FORCE_NAME[forceOf(x)]}.`,
    },
    form: `kraft:${level}:${steps.length}`,
    substance: x.id,
  }
}

// --- Siedepunkte ordnen ---

// Regel für eine Auswahl: alle gleiche Kraft → Größe; alle verschieden → Art der Kraft; sonst beides
// Ähnliche Molmasse: höchstens 25 % Unterschied zwischen der kleinsten und der größten
export const similarMasses = (ids: readonly string[]) => {
  const masses = ids.map((id) => molarMassOf(zmkById(id)))
  return Math.max(...masses) / Math.min(...masses) <= 1.25
}

export function ruleOf(ids: readonly string[]): BoilRule {
  const forces = new Set(ids.map((id) => forceOf(zmkById(id))))
  if (forces.size === 1) return 'mass'
  if (forces.size === ids.length && similarMasses(ids)) return 'force'
  return 'force-then-mass'
}

// Auswahl aus einer Gruppe, die eine Regel erklärt und mindestens 10 K Abstand hat; null sonst
export function pickBoilSet(level: Level, rng: Rng): string[] | null {
  const group = rng.pick(BOIL_GROUPS.filter((g) => g.level <= level))
  const size = Math.min(group.ids.length, rng.chance(0.6) ? 3 : 2)
  const ids = rng.shuffle([...group.ids]).slice(0, size)
  const boils = ids.map((id) => zmkById(id).boil).sort((a, b) => a - b)
  if (boils.some((b, i) => i > 0 && b - boils[i - 1] < 10)) return null
  const rule = ruleOf(ids)
  if (orderByRule(ids, rule).join() !== orderByBoil(ids).join()) return null
  return ids
}

const orderText = (ids: readonly string[]) => ids.map((id) => `$${ce(id)}$`).join(' < ')

const REASON: Readonly<Record<BoilRule, string>> = {
  mass: 'Alle haben dieselbe Art von stärkster Kraft; größere Moleküle haben stärkere Van-der-Waals-Kräfte.',
  force: 'Die Molmassen sind ähnlich; es entscheidet die Art der stärksten Kraft.',
  'force-then-mass': 'Zuerst die Wasserstoffbrücken, die viel stärker sind; bei gleicher Art der Kraft dann die Größe der Moleküle.',
}
const REASON_INTRA = 'Die Zahl der Atombindungen im Molekül, denn sie müssen beim Sieden aufbrechen.'

function boilTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  const ids = pickBoilSet(level, rng)
  if (!ids) return null
  const subs = ids.map(zmkById)
  const correct = orderByBoil(ids)
  const rule = ruleOf(ids)
  const byMass = [...subs].sort((a, b) => molarMassOf(a) - molarMassOf(b)).map((x) => x.id)
  const wrong = [
    textWrong('chem-zmk-mass-only', orderText(byMass)),
    textWrong('chem-zmk-reversed', orderText([...correct].reverse())),
  ].filter((w) => w.key !== orderText(correct))
  const choices = stepChoices(rng, { key: orderText(correct), content: orderText(correct) }, wrong, focus)
  if (choices.length === 0) return null
  const masses = subs.map((x) => `$M(${ce(x.id)}) = ${String(Math.round(molarMassOf(x) * 10) / 10).replace('.', '{,}')}\\,\\mathrm{g/mol}$`).join(', ')
  const forces = subs.map((x) => `$${ce(x.id)}$: ${UNCLEAR.has(x.id) ? 'keine Wasserstoffbrücken' : FORCE_NAME[forceOf(x)]}`).join('; ')
  const steps: GuidedStep[] = [
    {
      id: 'reihenfolge',
      title: 'Siedepunkte ordnen',
      question: 'Wie ordnen sich die Siedepunkte, vom niedrigsten zum höchsten?',
      choices,
      hint: 'Erst die Art der stärksten Kraft vergleichen; ist sie gleich, entscheidet die Größe der Moleküle.',
      explanation: { detailed: `Stärkste Kräfte: ${forces}. ${REASON[rule]}`, short: orderText(correct) },
      established: correct.map((id) => ce(id)).join(' < '),
      cards: [CARD_BOIL],
    },
  ]
  if (level === 3) {
    const reasonWrong: WrongValue[] = [
      ...(rule !== 'mass' ? [textWrong('chem-zmk-mass-only', REASON.mass)] : [textWrong('chem-zmk-size-ignored', REASON.force)]),
      textWrong('chem-zmk-intra', REASON_INTRA),
    ]
    const reasonChoices = stepChoices(rng, { key: REASON[rule], content: REASON[rule] }, reasonWrong, focus)
    steps.push({
      id: 'grund',
      title: 'Begründung',
      question: 'Was entscheidet hier über die Reihenfolge?',
      choices: reasonChoices,
      hint: 'Vergleiche die Art der stärksten Kraft und die Molmassen.',
      explanation: { detailed: `Stärkste Kräfte: ${forces}. Molmassen: ${masses}.`, short: REASON[rule] },
      cards: [CARD_BOIL],
    })
  }
  return {
    task: {
      ref,
      instruction: 'Ordne nach dem Siedepunkt',
      note: `Stoffe: ${subs.map(nameOf).join(', ')}.${level === 2 ? ` Molmassen: ${masses}.` : ''}`,
      steps,
      cards: [CARD_BOIL, CARD_FORCES],
      resultText: `Siedepunkte bei Normaldruck: ${correct.map((id) => `$${ce(id)}$ $${zmkById(id).boil}\\,^\\circ\\mathrm{C}$`).join(', ')}`,
    },
    form: `sieden:${level}:${rule}:${ids.length}`,
    substance: [...ids].sort().join('-'),
  }
}

// --- Lösen ---

// Chlor- und Fluorwasserstoff nicht: Sie lösen sich vor allem, weil sie mit Wasser reagieren (Säure-Base)
const IN_WATER = ['CH3OH', 'C2H5OH', 'NH3', 'C3H7OH']
const IN_HEXANE = ['I2', 'Br2', 'CCl4', 'C8H18', 'C7H16', 'CH4']

const SOLVE = {
  water: 'in Wasser, weil beide polar sind',
  hexane: 'in Hexan, weil beide unpolar sind',
  waterBond: 'in Wasser, weil es polare Bindungen hat',
  hexaneOpp: 'in Hexan, weil sich Gegensätze anziehen',
  waterOpp: 'in Wasser, weil sich Gegensätze anziehen',
}

function solveTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  const water = rng.chance(0.5)
  const x = zmkById(rng.pick(water ? IN_WATER : IN_HEXANE))
  if (x.level > level) return null
  const correct = water ? SOLVE.water : SOLVE.hexane
  const wrong: WrongValue[] = water
    ? [textWrong('chem-zmk-like-reversed', SOLVE.hexaneOpp)]
    : [textWrong('chem-zmk-like-reversed', SOLVE.waterOpp), ...(hasPolarBonds(x) ? [textWrong('chem-zmk-polar-bond', SOLVE.waterBond)] : [])]
  const choices = stepChoices(rng, { key: correct, content: correct }, wrong, focus)
  if (choices.length === 0) return null
  return {
    task: {
      ref,
      instruction: 'Entscheide, worin sich der Stoff besser löst',
      note: `Wasser ist polar und bildet Wasserstoffbrücken; Hexan $${ce('C6H14')}$ ist unpolar.`,
      steps: [
        {
          id: 'loesen',
          title: 'Gleiches löst sich in Gleichem',
          question: `Worin löst sich ${nameOf(x)} besser: in Wasser oder in Hexan?`,
          choices,
          hint: 'Ist der Stoff polar oder unpolar? Welches Lösemittel passt dazu?',
          explanation: {
            detailed: water
              ? `${nameOf(x)} ist polar${x.hBond ? ' und bildet Wasserstoffbrücken' : ''}, wie Wasser. Zwischen Wasser und dem Stoff wirken starke Kräfte; deshalb mischen sie sich.`
              : `${nameOf(x)} ist unpolar${hasPolarBonds(x) ? ' (die polaren Bindungen heben sich auf)' : ''}, wie Hexan. Wassermoleküle halten über Wasserstoffbrücken lieber untereinander zusammen; unpolare Stoffe mischen sich mit unpolaren.`,
            short: correct,
          },
          cards: [CARD_SOLVE],
        },
      ],
      cards: [CARD_SOLVE],
      resultText: `${nameOf(x)} löst sich besser ${water ? 'in Wasser' : 'in Hexan'}: Gleiches löst sich in Gleichem.`,
    },
    form: `loesen:${level}:${water ? 'wasser' : 'hexan'}`,
    substance: x.id,
  }
}

export const ZMK_STEPS = { hbondStep, forceStep, evaporateStep }
export { boilTask, solveTask }

export const ZMK_GENERATORS: readonly ChemGenerator[] = [
  {
    kind: 'zmk-kraft',
    part: 'kraefte',
    weights: { 1: 1, 2: 0.45, 3: 0.35 },
    errors: ['chem-zmk-any-h', 'chem-zmk-h-other', 'chem-zmk-hbond-missed', 'chem-zmk-polar-bond', 'chem-zmk-polar-ignored', 'chem-zmk-intra'],
    generate: forceTask,
  },
  {
    kind: 'zmk-sieden',
    part: 'siedepunkte',
    weights: { 2: 0.35, 3: 0.45 },
    errors: ['chem-zmk-mass-only', 'chem-zmk-reversed', 'chem-zmk-size-ignored', 'chem-zmk-intra'],
    generate: boilTask,
  },
  {
    kind: 'zmk-loesen',
    part: 'loesen',
    weights: { 2: 0.2, 3: 0.2 },
    errors: ['chem-zmk-like-reversed', 'chem-zmk-polar-bond'],
    generate: solveTask,
  },
]
