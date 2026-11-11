import type { Choice, GuidedStep } from '../../guided/types.ts'
import type { Rng } from '../../random/rng.ts'
import type { Level, TaskRef } from '../../tasks/taskNumber.ts'
import { elementBySymbol } from '../elements.ts'
import { bondTypeAskable, bondTypeOf, deltaEn, enHundredths, enLatex, type BondType } from '../electronegativity.ts'
import { chemErrorRule } from '../errorRules.ts'
import { shapeId } from '../figures.ts'
import { LEWIS_VARIANTS, type LewisVariant, lewisFigure } from '../lewis.ts'
import { MOL_COMPOUNDS, type MolCompound, OTHER_NAMES, PREFIXES, compoundFormula, compoundName } from '../molNames.ts'
import {
  MOLECULES,
  type Molecule,
  VALENCE,
  angleOf,
  arrangementOf,
  bondingPairs,
  bondsOf,
  countsOf,
  freePairs,
  lonePairsOf,
  partnersOf,
  shapeOf,
  typeLatex,
  valenceElectrons,
  vseprOf,
} from '../molecules.ts'
import { type ChemCalc, type ChemGenerator, type WrongValue, MAX_WRONG, stepChoices } from './shared.ts'

// Rechnungen zum Thema „Moleküle" (Plan M4, Thema 3.2), alles aus den Moleküldaten (chem/molecules.ts):
// - Lewis-Formel (Unterthema „lewis"): Valenzelektronen → Elektronenpaare → bindende und freie → richtige Formel als Bild
// - Gestalt (Unterthema „gestalt"): Bindungspartner → freie Paare am Zentralatom → Typ AXₙEₘ → Gestalt → Winkel
// - Polarität (Unterthema „polaritaet", ab Vertiefung): ΔEN mit Werten aus der Aufgabe → Bindungsart → Teilladungen → Dipol
// - Namen (Unterthema „namen", ab Vertiefung): Name aus der Formel oder Formel aus dem Namen, mit Vorsilben

const CARD_PAIR = 'mol-paarbindung'
const CARD_LEWIS = 'mol-lewis'
const CARD_MULTIPLE = 'mol-mehrfach'
const CARD_SHAPE = 'mol-gestalt'
const CARD_LONE = 'mol-freie-paare'
const CARD_EN = 'mol-en'
const CARD_PARTIAL = 'mol-teilladung'
const CARD_DIPOLE = 'mol-dipol'
const CARD_NAMES = 'mol-namen'

const ce = (text: string) => String.raw`\ce{${text}}`
const math = (latex: string) => `$${latex}$`
const numberWrong = (rule: string, n: number): WrongValue => ({ rule, key: String(n), content: math(String(n)) })
const textWrong = (rule: string, text: string): WrongValue => ({ rule, key: text, content: text })

const hasMultiple = (mol: Molecule) => mol.bonds.some(([, , o]) => o > 1)
const sextetNote = (mol: Molecule) => (mol.sextet ? ' Bor ist eine Ausnahme von der Oktettregel: Es hat in diesem Molekül nur sechs Elektronen um sich.' : '')
const titleOf = (mol: Molecule) => `$${ce(mol.id)}$${mol.name ? ` (${mol.name})` : ''}`

// Moleküle der Stufe: Grundlagen nur aus Grundlagen; in der Vertiefung meist neue; Klausurniveau alle
function pickMolecule(level: Level, rng: Rng, ok: (m: Molecule) => boolean): Molecule | null {
  const all = MOLECULES.filter((m) => m.level <= level && ok(m))
  if (all.length === 0) return null
  const fresh = all.filter((m) => m.level === level)
  // in der Vertiefung öfter die neuen Moleküle (Mehrfachbindungen), wenn es genug davon gibt
  return level === 2 && fresh.length >= 10 && rng.chance(0.45) ? rng.pick(fresh) : rng.pick(all)
}

// --- Lewis-Formel ---

// Valenzelektronen als Summe, z. B. „5 + 3 · 1 = 8"
function valenceSum(mol: Molecule): string {
  const terms = [...countsOf(mol)].map(([el, n]) => (n === 1 ? `${VALENCE[el]}` : `${n} \\cdot ${VALENCE[el]}`))
  return `${terms.join(' + ')} = ${valenceElectrons(mol)}`
}

function valenceStep(mol: Molecule, rng: Rng, focus?: string): GuidedStep | null {
  const total = valenceElectrons(mol)
  const counts = [...countsOf(mol)]
  const wrong = [
    ...(counts.some(([, n]) => n > 1) ? [numberWrong('chem-lewis-index-ignored', counts.reduce((s, [el]) => s + VALENCE[el], 0))] : []),
    numberWrong('chem-lewis-all-electrons', mol.atoms.reduce((s, a) => s + elementBySymbol(a.el)!.z, 0)),
    numberWrong('chem-lewis-octet-count', mol.atoms.reduce((s, a) => s + (a.el === 'H' ? 2 : 8), 0)),
  ]
  const choices = stepChoices(rng, { key: String(total), content: math(String(total)) }, wrong, focus)
  if (choices.length === 0) return null
  const each = counts.map(([el]) => `$${ce(el)}$ hat ${VALENCE[el]}`).join(', ')
  return {
    id: 'valenz',
    title: 'Valenzelektronen',
    question: `Wie viele Valenzelektronen hat $${ce(mol.id)}$ insgesamt?`,
    choices,
    hint: 'Jedes Atom bringt so viele Valenzelektronen mit, wie die Nummer seiner Hauptgruppe sagt. Zähle jedes Atom der Formel einzeln.',
    explanation: { detailed: `${each} Valenzelektronen. Zusammen: $${valenceSum(mol)}$.`, short: math(valenceSum(mol)) },
    established: String.raw`${valenceElectrons(mol)}\ \text{Valenzelektronen}`,
    cards: [CARD_LEWIS],
  }
}

function pairsStep(mol: Molecule, rng: Rng, focus?: string): GuidedStep | null {
  const total = valenceElectrons(mol)
  const pairs = total / 2
  const wrong = [numberWrong('chem-lewis-pairs-not-halved', total), numberWrong('chem-lewis-bonds-only', mol.bonds.length)]
  const choices = stepChoices(rng, { key: String(pairs), content: math(String(pairs)) }, wrong, focus)
  if (choices.length === 0) return null
  return {
    id: 'paare',
    title: 'Elektronenpaare',
    question: `Wie viele Elektronenpaare sind das?`,
    choices,
    hint: 'Ein Paar besteht aus zwei Elektronen; gezählt werden bindende und freie Paare zusammen.',
    explanation: { detailed: `$${total} : 2 = ${pairs}$ Elektronenpaare, bindende und freie zusammen.`, short: math(`${total} : 2 = ${pairs}`) },
    established: String.raw`${pairs}\ \text{Elektronenpaare}`,
    cards: [CARD_LEWIS],
  }
}

const splitText = (bonding: number, free: number) => `${bonding} bindende und ${free} ${free === 1 ? 'freies' : 'freie'} Paar${free === 1 ? '' : 'e'}`

// Bindende und freie Paare am Zentralatom, wie in der Vorlesung gezählt (Doppelbindung = zwei bindende Paare).
// Typischer Fehler: die Paare des ganzen Moleküls (auch die freien Paare der äußeren Atome) gezählt.
function splitStep(mol: Molecule, rng: Rng, focus?: string): GuidedStep | null {
  if (mol.central === undefined) return null
  const c = mol.central
  const el = mol.atoms[c].el
  const bonding = bondsOf(mol, c)
  const free = lonePairsOf(mol, c)
  const partners = partnersOf(mol, c)
  const correct = splitText(bonding, free)
  const wholeBonding = bondingPairs(mol)
  const wholeFree = freePairs(mol)
  const wrong = [
    ...(wholeBonding !== bonding || wholeFree !== free ? [textWrong('chem-lewis-free-whole-molecule', splitText(wholeBonding, wholeFree))] : []),
    // Mehrfachbindung als ein Paar, die übrigen Paare bis zum Oktett als freie
    ...(partners !== bonding ? [textWrong('chem-lewis-multiple-as-one', splitText(partners, bonding + free - partners))] : []),
    ...(free > 0 ? [textWrong('chem-lewis-pairs-missing', splitText(bonding, 0))] : []),
    textWrong('chem-lewis-octet-exceeded', splitText(bonding, free + 1)),
  ]
  const choices = stepChoices(rng, { key: correct, content: correct }, wrong, focus)
  if (choices.length === 0) return null
  const around = bonding + free
  return {
    id: 'verteilung',
    title: 'Paare am Zentralatom',
    question: `Wie viele bindende und wie viele freie Elektronenpaare sitzen in der Lewis-Formel von $${ce(mol.id)}$ am Zentralatom $${ce(el)}$?`,
    choices,
    hint: `Zähle nur am $${ce(el)}$: Jeder Strich zu einem Partner ist ein bindendes Paar, eine Doppelbindung sind zwei. Die freien Paare der äußeren Atome zählen nicht mit.`,
    explanation: {
      detailed: `Am $${ce(el)}$ sitzen ${bonding} bindende Paare${partners !== bonding ? ` zu ${partners} Partnern (Mehrfachbindungen zählen mit jedem ihrer Paare)` : ''} und ${free} ${free === 1 ? 'freies Paar' : 'freie Paare'}, zusammen ${around} Paare${around === 4 ? ': sein Oktett' : ''}.${sextetNote(mol)}${wholeFree !== free ? ` Die übrigen freien Paare sitzen an den äußeren Atomen; im ganzen Molekül sind es ${wholeFree}.` : ''}`,
      short: correct,
    },
    established: String.raw`\ce{${el}}\text{: }${bonding}\ \text{bindende},\ ${free}\ \text{freie Paare}`,
    cards: hasMultiple(mol) ? [CARD_LEWIS, CARD_MULTIPLE] : [CARD_LEWIS],
  }
}

function lewisChoiceStep(mol: Molecule, rng: Rng, focus?: string): GuidedStep | null {
  const correct = lewisFigure(mol)!
  const wrong = (Object.keys(LEWIS_VARIANTS) as LewisVariant[])
    .map((v) => ({ v, fig: lewisFigure(mol, v) }))
    .filter((w) => w.fig !== null)
    .map((w) => ({ rule: LEWIS_VARIANTS[w.v], fig: w.fig! }))
  if (wrong.length < 2) return null
  const forced = wrong.filter((w) => w.rule === focus)
  const others = rng.shuffle(wrong.filter((w) => !forced.includes(w))).slice(0, MAX_WRONG - forced.length)
  const choices: Choice[] = rng.shuffle([
    { id: 'richtig', content: correct.description, correct: true, figure: correct.id },
    ...[...forced, ...others].map((w, i) => ({
      id: `falsch-${i + 1}`,
      content: w.fig.description,
      correct: false,
      errorRuleId: w.rule,
      whyWrong: chemErrorRule(w.rule).why,
      figure: w.fig.id,
    })),
  ])
  return {
    id: 'formel',
    title: 'Lewis-Formel',
    question: `Welche Lewis-Formel von $${ce(mol.id)}$ ist richtig?`,
    choices,
    hint: `Prüfe zwei Dinge: Stimmt die Zahl der Paare, und hat jedes Atom ein Oktett (Wasserstoff zwei Elektronen)?${sextetNote(mol)}`,
    explanation: {
      detailed: `Die richtige Formel verteilt genau die ${valenceElectrons(mol)} Valenzelektronen, und jedes Atom hat sein Oktett, Wasserstoff zwei Elektronen.${sextetNote(mol)}`,
      short: 'Richtige Zahl der Elektronen, Oktett an jedem Atom.',
    },
    cards: hasMultiple(mol) ? [CARD_LEWIS, CARD_MULTIPLE] : [CARD_LEWIS],
  }
}

function lewisTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  const mol = pickMolecule(level, rng, (m) => !m.expanded && m.id !== 'H2' && (level > 1 || !hasMultiple(m)))
  if (!mol) return null
  const steps = [valenceStep(mol, rng, focus), pairsStep(mol, rng, focus), ...(level >= 2 ? [splitStep(mol, rng, focus)] : []), lewisChoiceStep(mol, rng, focus)]
  if (steps[0] === null || steps[1] === null || steps[steps.length - 1] === null) return null
  const kept = steps.filter((s): s is GuidedStep => s !== null)
  return {
    task: {
      ref,
      instruction: 'Stelle die Lewis-Formel auf',
      note: `Molekül: ${titleOf(mol)}.${sextetNote(mol)}`,
      steps: kept,
      cards: hasMultiple(mol) ? [CARD_LEWIS, CARD_MULTIPLE, CARD_PAIR] : [CARD_LEWIS, CARD_PAIR],
      resultText: `$${ce(mol.id)}$: ${valenceElectrons(mol) / 2} Elektronenpaare, davon ${splitText(bondingPairs(mol), freePairs(mol))}${mol.central !== undefined ? `; am Zentralatom $${ce(centralEl(mol))}$ ${splitText(bondsOf(mol, mol.central), lonePairsOf(mol, mol.central))}` : ''}`,
      resultFigure: lewisFigure(mol)!.id,
    },
    form: `lewis:${level}:${kept.length}`,
    substance: mol.id,
  }
}

// --- Gestalt ---

// Summe der Bindungsordnungen am Zentralatom (Doppelbindung doppelt gezählt)
const orderSum = (mol: Molecule) => bondsOf(mol, mol.central!)
const validType = (x: number, e: number) => x >= 2 && x + e <= 4
const centralEl = (mol: Molecule) => mol.atoms[mol.central!].el
// alle Partner am Zentralatom gleich, mit derselben Bindungsordnung
const sameLigands = (mol: Molecule) => {
  const at = mol.bonds.filter(([a, b]) => a === mol.central || b === mol.central).map(([a, b, o]) => `${mol.atoms[a === mol.central ? b : a].el}${o}`)
  return new Set(at).size === 1
}

function partnerStep(mol: Molecule, rng: Rng, focus?: string): GuidedStep | null {
  const { x, e } = vseprOf(mol)
  const wrong = [
    numberWrong('chem-vsepr-double-counted', orderSum(mol)),
    ...(e > 0 ? [numberWrong('chem-vsepr-pairs-as-partners', x + e)] : []),
    numberWrong('chem-vsepr-all-atoms', mol.atoms.length),
  ]
  const choices = stepChoices(rng, { key: String(x), content: math(String(x)) }, wrong, focus)
  if (choices.length === 0) return null
  return {
    id: 'partner',
    title: 'Bindungspartner',
    question: `Mit wie vielen Atomen ist das Zentralatom $${ce(centralEl(mol))}$ verbunden?`,
    choices,
    hint: 'Zähle die Atome, die direkt am Zentralatom hängen. Eine Doppel- oder Dreifachbindung führt zu einem einzigen Partner.',
    explanation: { detailed: `Am $${ce(centralEl(mol))}$ hängen ${x} Atome${hasMultiple(mol) ? '; die Mehrfachbindung zählt als ein Partner' : ''}.`, short: math(`X = ${x}`) },
    established: `X = ${x}`,
    cards: [CARD_SHAPE],
  }
}

function lonePairStep(mol: Molecule, rng: Rng, focus?: string): GuidedStep | null {
  const { e } = vseprOf(mol)
  const v = VALENCE[centralEl(mol)]
  const used = orderSum(mol)
  const wrong = [
    ...(e > 0 ? [numberWrong('chem-vsepr-lone-pairs-forgotten', 0)] : []),
    numberWrong('chem-vsepr-pairs-not-halved', v - used),
    numberWrong('chem-vsepr-valence-as-pairs', v),
    numberWrong('chem-vsepr-all-lone-pairs', freePairs(mol)),
  ]
  const choices = stepChoices(rng, { key: String(e), content: math(String(e)) }, wrong, focus)
  if (choices.length === 0) return null
  return {
    id: 'freie-paare',
    title: 'Freie Paare am Zentralatom',
    question: `Wie viele freie Elektronenpaare hat das Zentralatom $${ce(centralEl(mol))}$?`,
    choices,
    hint: 'Nur die Paare am Zentralatom zählen. Von seinen Valenzelektronen stecken einige in Bindungen; aus den übrigen werden Paare.',
    explanation: {
      detailed: `$${ce(centralEl(mol))}$ hat ${v} Valenzelektronen, ${used} davon stecken in Bindungen. Übrig: $${v} - ${used} = ${v - used}$ Elektronen, also ${e} freie${e === 1 ? 's' : ''} Paar${e === 1 ? '' : 'e'}.`,
      short: math(`E = ${e}`),
    },
    established: `E = ${e}`,
    cards: [CARD_SHAPE],
  }
}

function typeStep(mol: Molecule, rng: Rng, focus?: string): GuidedStep | null {
  const { x, e } = vseprOf(mol)
  const t = (a: number, b: number) => typeLatex(a, b)
  const wrong = [
    ...(e > 0 ? [{ rule: 'chem-vsepr-lone-pairs-forgotten', key: t(x, 0), content: math(t(x, 0)) }] : []),
    ...(orderSum(mol) !== x ? [{ rule: 'chem-vsepr-double-counted', key: t(orderSum(mol), e), content: math(t(orderSum(mol), e)) }] : []),
    ...(e > 0 ? [{ rule: 'chem-vsepr-pairs-not-halved', key: t(x, 2 * e), content: math(t(x, 2 * e)) }] : []),
    { rule: 'chem-vsepr-all-atoms', key: t(mol.atoms.length, e), content: math(t(mol.atoms.length, e)) },
  ]
  const choices = stepChoices(rng, { key: t(x, e), content: math(t(x, e)) }, wrong, focus)
  if (choices.length === 0) return null
  return {
    id: 'typ',
    title: 'Typ des Moleküls',
    question: 'Welcher Typ $\\mathrm{AX_nE_m}$ ist das?',
    choices,
    hint: 'A ist das Zentralatom, X steht für jeden Bindungspartner, E für jedes freie Paar am Zentralatom.',
    explanation: { detailed: `${x} Bindungspartner und ${e} ${e === 1 ? 'freies Paar' : 'freie Paare'}: Typ $${t(x, e)}$.`, short: math(t(x, e)) },
    established: t(x, e),
    cards: [CARD_SHAPE],
  }
}

function shapeStep(mol: Molecule, rng: Rng, focus?: string): GuidedStep | null {
  const { x, e, shape } = vseprOf(mol)
  const wrong: WrongValue[] = [
    ...(e > 0 ? [textWrong('chem-vsepr-arrangement', arrangementOf(x, e)), textWrong('chem-vsepr-lone-pairs-forgotten', shapeOf(x, 0))] : []),
    ...(orderSum(mol) !== x && validType(orderSum(mol), e) ? [textWrong('chem-vsepr-double-counted', shapeOf(orderSum(mol), e))] : []),
    ...(validType(x, e + 1) ? [textWrong('chem-vsepr-extra-pair', shapeOf(x, e + 1))] : []),
    ...(x === 4 && e === 0 ? [textWrong('chem-vsepr-flat', 'quadratisch-planar')] : []),
  ]
  const choices = stepChoices(rng, { key: shape, content: shape }, wrong, focus)
  if (choices.length === 0) return null
  return {
    id: 'gestalt',
    title: 'Gestalt',
    question: `Welche Gestalt hat das Molekül $${ce(mol.id)}$?`,
    choices,
    hint: 'Alle Elektronenpaare um das Zentralatom stoßen sich ab und gehen so weit wie möglich auseinander. Die Gestalt beschreibt dann nur, wo die Atome sitzen.',
    explanation: {
      detailed: `Typ $${typeLatex(x, e)}$: Um das Zentralatom liegen ${x} Bindungen${e > 0 ? ` und ${e} ${e === 1 ? 'freies Paar' : 'freie Paare'}` : ''}${hasMultiple(mol) ? ' (eine Mehrfachbindung zählt wie eine Bindung)' : ''}; sie ordnen sich ${arrangementOf(x, e)} an.${e > 0 ? ` ${e === 1 ? 'Ein Platz ist' : `${e} Plätze sind`} von freien Paaren besetzt; die Atome allein bilden ${shape === 'gewinkelt' ? 'ein gewinkeltes' : 'eine'} ${shape === 'gewinkelt' ? 'Molekül' : `${shape}e Form`}.` : ''}`,
      short: shape,
    },
    established: String.raw`\text{${shape}}`,
    cards: e > 0 ? [CARD_SHAPE, CARD_LONE] : [CARD_SHAPE],
  }
}

function angleStep(mol: Molecule, rng: Rng, focus?: string): GuidedStep | null {
  const { x, e } = vseprOf(mol)
  const correct = angleOf(x, e)!
  const wrongAngle = (rule: string, a: number, b: number): WrongValue[] => {
    const text = validType(a, b) ? angleOf(a, b) : null
    return text ? [textWrong(rule, text)] : []
  }
  const ideal = angleOf(x + e, 0)!
  const wrong = [
    ...(e > 0 ? [textWrong('chem-vsepr-angle-ideal', ideal), ...wrongAngle('chem-vsepr-lone-pairs-forgotten', x, 0)] : []),
    ...wrongAngle('chem-vsepr-extra-pair', x, e + 1),
    ...(orderSum(mol) !== x ? wrongAngle('chem-vsepr-double-counted', orderSum(mol), e) : []),
    ...(x === 4 && e === 0 ? [textWrong('chem-vsepr-flat', '$90^\\circ$')] : []),
  ]
  const choices = stepChoices(rng, { key: correct, content: correct }, wrong, focus)
  if (choices.length === 0) return null
  return {
    id: 'winkel',
    title: 'Bindungswinkel',
    question: `Wie groß ist der Bindungswinkel in $${ce(mol.id)}$?`,
    choices,
    hint: 'Der Winkel folgt aus der Anordnung aller Paare. Freie Paare brauchen mehr Platz und drücken die Bindungen etwas zusammen.',
    explanation: {
      detailed: `Bei ${x + e} Richtungen um das Zentralatom (Bindungen und freie Paare zusammen) beträgt der ideale Winkel ${ideal}.${e > 0 ? ' Freie Paare brauchen mehr Platz als bindende und drücken die Bindungen zusammen: Der Winkel ist etwas kleiner.' : ''}`,
      short: correct,
    },
    cards: e > 0 ? [CARD_LONE] : [CARD_SHAPE],
  }
}

function shapeTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  const mol = pickMolecule(level, rng, (m) => m.central !== undefined && validType(vseprOf(m).x, vseprOf(m).e))
  if (!mol) return null
  const { x, e, shape } = vseprOf(mol)
  // Winkel nur bei gleichen Partnern mit gleicher Bindung: sonst weicht er vom idealen Wert ab (COCl₂ etwa 112°)
  const built = [partnerStep(mol, rng, focus), lonePairStep(mol, rng, focus), ...(level >= 2 ? [typeStep(mol, rng, focus)] : []), shapeStep(mol, rng, focus), ...(level >= 2 && sameLigands(mol) ? [angleStep(mol, rng, focus)] : [])]
  if (built.some((s) => s === null)) return null
  const steps = built as GuidedStep[]
  // Die Lewis-Formel steht bis zur Vertiefung als Bild dabei; im Klausurniveau muss man sie selbst kennen
  const figure = level <= 2 && !mol.expanded ? lewisFigure(mol)!.id : undefined
  if (figure) steps[0] = { ...steps[0], figure }
  return {
    task: {
      ref,
      instruction: 'Bestimme die Gestalt des Moleküls',
      note: `Molekül: ${titleOf(mol)}, Zentralatom $${ce(centralEl(mol))}$.${figure ? ' Die Lewis-Formel steht unter der ersten Frage.' : ''}${mol.expanded ? ` $${ce(centralEl(mol))}$ hat hier mehr als acht Elektronen um sich; für die Gestalt zählen trotzdem nur Partner und freie Paare.` : ''}`,
      steps,
      cards: e > 0 ? [CARD_SHAPE, CARD_LONE] : [CARD_SHAPE],
      resultText: `$${ce(mol.id)}$ ist ${shape} (Typ $${typeLatex(x, e)}$)`,
      resultFigure: shapeId(mol),
    },
    form: `gestalt:${level}`,
    substance: mol.id,
  }
}

// --- Polarität ---

const BOND_TYPE_TEXT: Readonly<Record<BondType, string>> = {
  unpolar: '(nahezu) unpolare Atombindung',
  polar: 'polare Atombindung',
  ionisch: 'Ionenbindung',
}

// Bindungen zwischen verschiedenen Elementen, nach denen die App fragen darf (CHEMIE.md §5)
function askableBonds(mol: Molecule): [string, string][] {
  const seen = new Set<string>()
  const list: [string, string][] = []
  for (const [a, b] of mol.bonds) {
    // Reihenfolge wie in der Summenformel, z. B. N–F, H–Br
    const pair = [mol.atoms[a].el, mol.atoms[b].el].sort((p, q) => formulaOrder(mol, p) - formulaOrder(mol, q)) as [string, string]
    const key = pair.join('-')
    if (pair[0] === pair[1] || seen.has(key)) continue
    seen.add(key)
    if (bondTypeAskable(...pair) && bondTypeOf(deltaEn(...pair)) !== 'ionisch') list.push(pair)
  }
  return list
}

const formulaOrder = (mol: Molecule, el: string) => mol.id.search(new RegExp(`${el}(?![a-z])`))

const bondCe = (a: string, b: string) => `$${ce(`${a}-${b}`)}$`

function deltaStep(mol: Molecule, a: string, b: string, rng: Rng, focus?: string): GuidedStep | null {
  const d = deltaEn(a, b)
  const counts = countsOf(mol)
  const latex = (h: number) => enLatex(h)
  const ea = enHundredths(a)
  const eb = enHundredths(b)
  // ΔEN mit dem größeren Index malgenommen (Katalog: O–H in H₂O 2,48 statt 1,24)
  const scaled = d * Math.max(counts.get(a) ?? 1, counts.get(b) ?? 1)
  const wrong = [
    { rule: 'chem-en-added', key: latex(ea + eb), content: math(latex(ea + eb)) },
    ...(scaled !== d ? [{ rule: 'chem-en-index', key: latex(scaled), content: math(latex(scaled)) }] : []),
  ]
  const choices = stepChoices(rng, { key: latex(d), content: math(latex(d)) }, wrong, focus)
  if (choices.length === 0) return null
  const [hi, lo] = ea >= eb ? [a, b] : [b, a]
  return {
    id: 'delta',
    title: 'Unterschied der Elektronegativität',
    question: `Wie groß ist $\\Delta \\mathrm{EN}$ der Bindung ${bondCe(a, b)}?`,
    choices,
    hint: 'Ziehe den kleineren Wert vom größeren ab. Es zählt nur die eine Bindung zwischen zwei Atomen.',
    explanation: {
      detailed: `$\\Delta \\mathrm{EN} = ${latex(enHundredths(hi))} - ${latex(enHundredths(lo))} = ${latex(d)}$. Wie oft ein Element in der Formel steht, spielt für eine einzelne Bindung keine Rolle.`,
      short: math(`\\Delta \\mathrm{EN} = ${latex(d)}`),
    },
    established: `\\Delta \\mathrm{EN} = ${latex(d)}`,
    cards: [CARD_EN],
  }
}

function bondTypeStep(a: string, b: string, rng: Rng, focus?: string): GuidedStep | null {
  const d = deltaEn(a, b)
  const type = bondTypeOf(d)
  const wrong = (Object.keys(BOND_TYPE_TEXT) as BondType[]).filter((t) => t !== type).map((t) => textWrong('chem-en-bond-type', BOND_TYPE_TEXT[t]))
  const choices = stepChoices(rng, { key: BOND_TYPE_TEXT[type], content: BOND_TYPE_TEXT[type] }, wrong, focus)
  return {
    id: 'art',
    title: 'Bindungsart',
    question: `Welche Art von Bindung ist ${bondCe(a, b)} mit $\\Delta \\mathrm{EN} = ${enLatex(d)}$?`,
    choices,
    hint: 'Grenzen: unter 0,5 (nahezu) unpolar, von 0,5 bis 1,8 polar, darüber Ionenbindung.',
    explanation: {
      detailed: `$\\Delta \\mathrm{EN} = ${enLatex(d)}$ liegt ${type === 'unpolar' ? 'unter 0,5' : 'zwischen 0,5 und 1,8'}: ${BOND_TYPE_TEXT[type]}. Die Grenzen sind fließend; sie geben nur eine Richtschnur.`,
      short: BOND_TYPE_TEXT[type],
    },
    cards: [CARD_EN],
  }
}

function partialStep(a: string, b: string, rng: Rng, focus?: string): GuidedStep | null {
  const [neg, pos] = enHundredths(a) > enHundredths(b) ? [a, b] : [b, a]
  const text = (minus: string, plus: string) => `$\\delta-$ am $${ce(minus)}$, $\\delta+$ am $${ce(plus)}$`
  const correct = text(neg, pos)
  const choices = stepChoices(rng, { key: correct, content: correct }, [textWrong('chem-en-partial-swapped', text(pos, neg))], focus)
  return {
    id: 'teilladung',
    title: 'Teilladungen',
    question: `Wo sitzen die Teilladungen in der Bindung ${bondCe(a, b)}?`,
    choices,
    hint: 'Das elektronegativere Atom zieht das bindende Paar zu sich.',
    explanation: {
      detailed: `$${ce(neg)}$ ist elektronegativer und zieht das bindende Paar zu sich: Dort entsteht eine negative Teilladung $\\delta-$, am $${ce(pos)}$ eine positive $\\delta+$.`,
      short: correct,
    },
    cards: [CARD_PARTIAL],
  }
}

// Aussagen zum Dipol (Antwort mit Begründung)
const DIPOLE_TEXT = {
  yes: 'Ja: Es hat polare Bindungen, und wegen der Gestalt fallen die Ladungsschwerpunkte nicht zusammen.',
  yesBond: 'Ja: Es hat polare Bindungen, und das allein macht es schon zum Dipol.',
  noSym: 'Nein: Die Bindungen sind polar, aber wegen der symmetrischen Gestalt fallen die Ladungsschwerpunkte zusammen.',
  noBond: 'Nein: Alle Bindungen sind (nahezu) unpolar.',
}

const hasPolarBond = (mol: Molecule) => mol.bonds.some(([a, b]) => bondTypeOf(deltaEn(mol.atoms[a].el, mol.atoms[b].el)) !== 'unpolar')

function dipoleStep(mol: Molecule, rng: Rng, focus?: string): GuidedStep | null {
  if (mol.dipole === null) return null
  const polar = hasPolarBond(mol)
  const key = mol.dipole ? 'yes' : polar ? 'noSym' : 'noBond'
  // falsche Aussagen je Fall mit ihrem Fehler
  const wrongRules: Partial<Record<keyof typeof DIPOLE_TEXT, string>> = mol.dipole
    ? // bei zwei Atomen reicht die polare Bindung wirklich; dort keine Antwort „das allein reicht“
      { ...(mol.atoms.length > 2 ? { yesBond: 'chem-dipole-polar-bond' } : {}), noSym: 'chem-dipole-symmetry-assumed', noBond: 'chem-dipole-unpolar-claimed' }
    : polar
      ? { yes: 'chem-dipole-polar-bond', yesBond: 'chem-dipole-polar-bond', noBond: 'chem-dipole-unpolar-claimed' }
      : { yes: 'chem-dipole-unpolar-bonds', noSym: 'chem-en-bond-type' }
  const wrong = (Object.keys(wrongRules) as (keyof typeof DIPOLE_TEXT)[]).map((k) => textWrong(wrongRules[k]!, DIPOLE_TEXT[k]))
  const choices = stepChoices(rng, { key: DIPOLE_TEXT[key], content: DIPOLE_TEXT[key] }, wrong, focus)
  if (choices.length === 0) return null
  const strong = mol.bonds.some(([a, b]) => bondTypeOf(deltaEn(mol.atoms[a].el, mol.atoms[b].el)) === 'ionisch')
  const shape = mol.central !== undefined ? vseprOf(mol).shape : mol.atoms.length === 2 ? 'linear' : null
  return {
    id: 'dipol',
    title: 'Polares Molekül',
    question: `Ist $${ce(mol.id)}$ ein polares Molekül (ein Dipol)?`,
    choices,
    hint: 'Zwei Fragen: Gibt es polare Bindungen? Und heben sich ihre Wirkungen wegen einer symmetrischen Gestalt auf?',
    explanation: {
      detailed: `${polar ? (strong ? 'Das Molekül hat stark polare Bindungen; zwischen zwei Nichtmetallen bleiben sie Atombindungen, auch wenn $\\Delta \\mathrm{EN}$ knapp über 1,8 liegt.' : 'Das Molekül hat polare Bindungen.') : 'Die Bindungen sind (nahezu) unpolar.'}${shape ? ` Gestalt: ${shape}.` : ''} ${DIPOLE_TEXT[key]}`,
      short: DIPOLE_TEXT[key].split(':')[0],
    },
    cards: [CARD_DIPOLE],
  }
}

function polarityTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  // Moleküle, deren Polarität nicht gefragt wird (CHEMIE.md §6), kommen hier gar nicht vor
  const mol = pickMolecule(level, rng, (m) => m.dipole !== null && askableBonds(m).length > 0)
  if (!mol) return null
  const [a, b] = rng.pick(askableBonds(mol))
  const type = bondTypeOf(deltaEn(a, b))
  const askDipole = level === 3 || rng.chance(0.4)
  const dipole = askDipole ? dipoleStep(mol, rng, focus) : null
  const first = deltaStep(mol, a, b, rng, focus)
  const second = bondTypeStep(a, b, rng, focus)
  if (!first || !second) return null
  const steps = [first, second, ...(type === 'polar' ? [partialStep(a, b, rng, focus)!] : []), ...(dipole ? [dipole] : [])]
  const values = [...new Set(mol.atoms.map((x) => x.el))].map((el) => `$\\mathrm{EN}(${ce(el)}) = ${enLatex(enHundredths(el))}$`).join(', ')
  return {
    task: {
      ref,
      instruction: 'Bestimme die Polarität',
      note: `Molekül: ${titleOf(mol)}. Rechne mit ${values} (Pauling).`,
      steps,
      cards: [CARD_EN, ...(type === 'polar' ? [CARD_PARTIAL] : []), ...(dipole ? [CARD_DIPOLE] : [])],
      resultText: `${bondCe(a, b)}: ${BOND_TYPE_TEXT[type]} mit $\\Delta \\mathrm{EN} = ${enLatex(deltaEn(a, b))}$${dipole ? `. $${ce(mol.id)}$ ist ${mol.dipole ? 'ein polares Molekül (Dipol)' : 'unpolar (kein Dipol)'}` : ''}`,
      ...(dipole && mol.central !== undefined ? { resultFigure: shapeId(mol) } : {}),
    },
    form: `polar:${level}:${a}-${b}:${dipole ? 'dipol' : 'bindung'}`,
    substance: mol.id,
  }
}

// --- Namen ---

function nameTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  const list = MOL_COMPOUNDS.filter((m) => m.level <= level)
  const compound: MolCompound = rng.pick(list)
  const parts = compound.parts
  const [, x, , y] = parts
  const formula = compoundFormula(parts)
  const name = compoundName(parts)
  const other = OTHER_NAMES[formula]
  const otherNote = other ? ` Üblich ist auch der Name ${other}.` : ''
  const toName = rng.chance(0.5)
  const swapped = [parts[0], y, parts[2], x] as const
  if (toName) {
    const wrong: WrongValue[] = [
      textWrong('chem-molname-no-prefix', compoundName(parts, { first: null, second: null })),
      textWrong('chem-molname-swapped', compoundName(parts, { first: y, second: x })),
      ...(x > 1 ? [textWrong('chem-molname-first-prefix', compoundName(parts, { first: null, second: y }))] : []),
    ]
    const choices = stepChoices(rng, { key: name, content: name }, wrong, focus)
    if (choices.length === 0) return null
    return {
      task: {
        ref,
        instruction: 'Benenne die Molekülverbindung',
        steps: [
          {
            id: 'name',
            title: 'Name',
            question: `Wie heißt $${ce(formula)}$?`,
            choices,
            hint: 'Vorsilben zählen die Atome: mono, di, tri, tetra, penta, hexa … Am ersten Element fällt „mono" weg, am zweiten nicht.',
            explanation: {
              detailed: `${x > 1 ? `${x} Atome des ersten Elements: „${PREFIX_HINT(x)}". ` : 'Ein Atom des ersten Elements: ohne Vorsilbe. '}${y} Atom${y === 1 ? '' : 'e'} des zweiten: „${PREFIX_HINT(y)}". Name: ${name}.${otherNote}`,
              short: name,
            },
            cards: [CARD_NAMES],
          },
        ],
        cards: [CARD_NAMES],
        resultText: `$${ce(formula)}$: ${name}${other ? ` (auch ${other})` : ''}`,
      },
      form: `name:${level}:formel-zu-name`,
      substance: formula,
    }
  }
  const asFormula = (p: readonly [string, number, string, number]) => ce(compoundFormula(p))
  const wrong: WrongValue[] = [
    { rule: 'chem-molname-no-prefix', key: asFormula([parts[0], 1, parts[2], 1]), content: math(asFormula([parts[0], 1, parts[2], 1])) },
    { rule: 'chem-molname-swapped', key: asFormula(swapped), content: math(asFormula(swapped)) },
    ...(x > 1 ? [{ rule: 'chem-molname-first-prefix', key: asFormula([parts[0], 1, parts[2], y]), content: math(asFormula([parts[0], 1, parts[2], y])) }] : []),
  ]
  const choices = stepChoices(rng, { key: ce(formula), content: math(ce(formula)) }, wrong, focus)
  if (choices.length === 0) return null
  return {
    task: {
      ref,
      instruction: 'Stelle die Formel auf',
      steps: [
        {
          id: 'formel',
          title: 'Formel',
          question: `Welche Formel hat ${name}?`,
          choices,
          hint: 'Jede Vorsilbe gehört zu dem Element direkt dahinter und gibt die Zahl seiner Atome an. Ohne Vorsilbe steht ein Atom.',
          explanation: {
            detailed: `${x > 1 ? `„${PREFIX_HINT(x)}" vor dem ersten Element: ${x} Atome.` : 'Keine Vorsilbe vor dem ersten Element: ein Atom.'} „${PREFIX_HINT(y)}" vor dem zweiten: ${y} Atom${y === 1 ? '' : 'e'}. Formel: $${ce(formula)}$.${otherNote}`,
            short: math(ce(formula)),
          },
          cards: [CARD_NAMES],
        },
      ],
      cards: [CARD_NAMES],
      resultLatex: ce(formula),
    },
    form: `name:${level}:name-zu-formel`,
    substance: formula,
  }
}

const PREFIX_HINT = (n: number) => PREFIXES[n] ?? String(n)

// Schritte einzeln, für die Katalogbeispiele in errorRules.test.ts
export const MOLECULE_STEPS = { valenceStep, pairsStep, splitStep, lewisChoiceStep, partnerStep, lonePairStep, typeStep, shapeStep, angleStep, deltaStep, bondTypeStep, partialStep, dipoleStep }
export { nameTask }

export const MOLEKUELE_GENERATORS: readonly ChemGenerator[] = [
  {
    kind: 'lewis',
    part: 'lewis',
    weights: { 1: 0.5, 2: 0.3, 3: 0.25 },
    errors: [
      'chem-lewis-index-ignored',
      'chem-lewis-all-electrons',
      'chem-lewis-octet-count',
      'chem-lewis-pairs-not-halved',
      'chem-lewis-bonds-only',
      'chem-lewis-multiple-as-one',
      'chem-lewis-free-whole-molecule',
      ...Object.values(LEWIS_VARIANTS),
    ],
    generate: lewisTask,
  },
  {
    kind: 'gestalt',
    part: 'gestalt',
    weights: { 1: 0.5, 2: 0.3, 3: 0.3 },
    errors: [
      'chem-vsepr-double-counted',
      'chem-vsepr-pairs-as-partners',
      'chem-vsepr-all-atoms',
      'chem-vsepr-lone-pairs-forgotten',
      'chem-vsepr-pairs-not-halved',
      'chem-vsepr-valence-as-pairs',
      'chem-vsepr-all-lone-pairs',
      'chem-vsepr-arrangement',
      'chem-vsepr-extra-pair',
      'chem-vsepr-flat',
      'chem-vsepr-angle-ideal',
    ],
    generate: shapeTask,
  },
  {
    kind: 'polaritaet',
    part: 'polaritaet',
    weights: { 2: 0.22, 3: 0.25 },
    errors: ['chem-en-added', 'chem-en-index', 'chem-en-bond-type', 'chem-en-partial-swapped', 'chem-dipole-polar-bond', 'chem-dipole-unpolar-bonds', 'chem-dipole-symmetry-assumed', 'chem-dipole-unpolar-claimed'],
    generate: polarityTask,
  },
  {
    kind: 'molname',
    part: 'namen',
    weights: { 2: 0.18, 3: 0.2 },
    errors: ['chem-molname-no-prefix', 'chem-molname-swapped', 'chem-molname-first-prefix'],
    generate: nameTask,
  },
]
