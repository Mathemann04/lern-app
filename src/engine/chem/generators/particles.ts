import type { Explanation } from '../../explain/texts.ts'
import type { GuidedStep } from '../../guided/types.ts'
import type { Rng } from '../../random/rng.ts'
import type { Level, TaskRef } from '../../tasks/taskNumber.ts'
import { ELEMENTS, type Element, elementByZ } from '../elements.ts'
import { type ChemCalc, type ChemGenerator, type WrongValue, exactNumeric, stepChoices } from './shared.ts'

// Rechnung „Protonen, Neutronen, Elektronen" (Plan M4, Thema 1.1): Aus einem Teil der Angaben zu einem
// Atom oder Ion (Element, Massenzahl, Protonen, Neutronen, Elektronen, Ladung) die übrigen bestimmen.
// - Grundlagen: ungeladene Atome, aus dem Kernsymbol oder aus einer Tabelle mit Lücken
// - Vertiefung: auch Ionen, Tabelle mit Lücken und Ladung
// - Klausurniveau: zwei Teilchen in einer Tabelle (wie Klausuraufgabe 1), oft Isotope oder Atom und Ion
// Je gefragter Angabe ein Schritt; die falschen Antworten rechnen typische Fehler weiter
// (chem/errorRules.ts). Jede Rechnung nennt die Ordnungszahl, mit der sie rechnet.

export type Particle = { readonly el: Element; readonly a: number; readonly q: number }
export type Field = 'element' | 'p' | 'n' | 'a' | 'e' | 'q'

// Was gegeben ist; gefragt sind die übrigen Angaben (Reihenfolge der Schritte: FIELDS)
type GivenSet = 'symbol' | 'particles' | 'element-a-e' | 'p-a-q' | 'element-n-q'
const GIVEN: Readonly<Record<GivenSet, readonly Field[]>> = {
  // Kernsymbol mit Massenzahl, Ordnungszahl und Ladung
  symbol: ['element', 'a', 'q'],
  'particles': ['p', 'n', 'e'],
  'element-a-e': ['element', 'a', 'e'],
  'p-a-q': ['p', 'a', 'q'],
  'element-n-q': ['element', 'n', 'q'],
}
const FIELDS: readonly Field[] = ['element', 'p', 'n', 'a', 'e', 'q']
const GIVEN_SETS = Object.keys(GIVEN) as GivenSet[]

const z = (t: Particle) => t.el.z
const neutrons = (t: Particle) => t.a - t.el.z
const electrons = (t: Particle) => t.el.z - t.q

// Was gefragt ist: alles, was nicht gegeben ist; ungeladene Atome der Grundlagen ohne Ladung
function askedFields(set: GivenSet, withCharge: boolean): Field[] {
  return FIELDS.filter((f) => !GIVEN[set].includes(f) && (withCharge || f !== 'q'))
}

// --- Schreibweise ---

// Ladung im Kernsymbol (mhchem): +, 2+, -, 3-
function chargeCe(q: number): string {
  if (q === 0) return ''
  const size = Math.abs(q) === 1 ? '' : String(Math.abs(q))
  const sign = q > 0 ? '+' : '-'
  return size ? `^{${size}${sign}}` : `^${sign}`
}

export const symbolLatex = (t: Particle) => String.raw`\ce{^{${t.a}}_{${z(t)}}${t.el.symbol}${chargeCe(t.q)}}`

// Ladung als Zahl mit Vorzeichen: +2, −1, 0
const chargeLatex = (q: number) => (q > 0 ? `{+${q}}` : q < 0 ? `{${q}}` : '0')
const chargeText = (q: number) => `$${chargeLatex(q)}$`
const elementText = (el: Element) => String.raw`$\ce{${el.symbol}}$ (${el.name}, $Z = ${el.z}$)`
const elementCell = (el: Element) => String.raw`\ce{${el.symbol}}\ (Z = ${el.z})`

const ROW_NAMES: Readonly<Record<Field, string>> = {
  element: String.raw`\text{Element}`,
  a: String.raw`\text{Massenzahl}`,
  p: String.raw`\text{Protonen}`,
  n: String.raw`\text{Neutronen}`,
  e: String.raw`\text{Elektronen}`,
  q: String.raw`\text{Ladung}`,
}
const TABLE_ROWS: readonly Field[] = ['element', 'a', 'p', 'n', 'e', 'q']

function cell(t: Particle, field: Field): string {
  switch (field) {
    case 'element':
      return elementCell(t.el)
    case 'p':
      return String(z(t))
    case 'n':
      return String(neutrons(t))
    case 'a':
      return String(t.a)
    case 'e':
      return String(electrons(t))
    case 'q':
      return chargeLatex(t.q)
  }
}

// Tabelle mit Lücken (?) für ein oder zwei Teilchen
function tableLatex(items: readonly { t: Particle; given: readonly Field[] }[], withCharge: boolean): string {
  const rows = TABLE_ROWS.filter((f) => withCharge || f !== 'q')
  const header = items.length > 1 ? String.raw`& ${items.map((_, i) => String.raw`\textbf{${i + 1}}`).join(' & ')} \\ \hline ` : ''
  const body = rows.map((f) => `${ROW_NAMES[f]} & ${items.map(({ t, given }) => (given.includes(f) ? cell(t, f) : String.raw`\text{?}`)).join(' & ')}`)
  return String.raw`\begin{array}{l|${items.map(() => 'c').join('')}} ${header}${body.join(String.raw` \\ `)} \end{array}`
}

// --- Falsche Antworten ---

// Was der Lernende schon vor sich hat: die gegebenen Angaben und die schon bestimmten
export type Known = ReadonlySet<Field>

const countWrong = (rule: string, value: number): WrongValue | null => (value >= 0 && Number.isInteger(value) ? { rule, key: String(value), content: `$${value}$` } : null)
const chargeWrong = (rule: string, value: number): WrongValue => ({ rule, key: String(value), content: chargeText(value) })
function elementWrong(rule: string, zValue: number): WrongValue | null {
  const el = elementByZ(zValue)
  return el && zValue > 0 ? { rule, key: String(zValue), content: elementText(el) } : null
}

// Falsche Werte eines Schritts, wichtigste zuerst (known: gegebene und schon bestimmte Angaben)
export function wrongValues(t: Particle, field: Field, known: Known): WrongValue[] {
  const Z = z(t)
  const N = neutrons(t)
  const E = electrons(t)
  const ion = t.q !== 0
  const list: (WrongValue | null)[] = []
  switch (field) {
    case 'element':
      if (known.has('a')) list.push(elementWrong('chem-element-from-mass', t.a))
      else list.push(elementWrong('chem-element-from-mass', Z + N))
      if (known.has('e') && ion) list.push(elementWrong('chem-electrons-as-protons', E))
      if (known.has('n') || known.has('a')) list.push(elementWrong('chem-protons-neutrons-swapped', N))
      break
    case 'p':
      if (known.has('a')) list.push(countWrong('chem-element-from-mass', t.a))
      if (known.has('n') || known.has('a')) list.push(countWrong('chem-protons-neutrons-swapped', N))
      if (known.has('e') && ion) list.push(countWrong('chem-electrons-as-protons', E))
      break
    case 'n':
      list.push(countWrong('chem-neutrons-mass-number', t.a))
      list.push(countWrong('chem-protons-neutrons-swapped', Z))
      if (known.has('e') && ion) list.push(countWrong('chem-electrons-as-protons', t.a - E))
      break
    case 'a':
      list.push(countWrong('chem-neutrons-mass-number', N))
      list.push(countWrong('chem-mass-number-electrons', t.a + E))
      if (known.has('e') && ion) list.push(countWrong('chem-electrons-as-protons', E + N))
      break
    case 'e':
      if (ion) {
        list.push(countWrong('chem-ion-charge-ignored', Z))
        list.push(countWrong('chem-ion-charge-sign', Z + t.q))
      }
      if (known.has('a')) list.push(countWrong('chem-element-from-mass', t.a - t.q))
      if (known.has('n') || known.has('a')) list.push(countWrong('chem-protons-neutrons-swapped', N - t.q))
      break
    case 'q':
      if (ion) {
        list.push(chargeWrong('chem-ion-charge-sign', -t.q))
        list.push(chargeWrong('chem-ion-charge-ignored', 0))
      }
      if (known.has('a')) list.push(chargeWrong('chem-element-from-mass', t.a - E))
      if (known.has('n')) list.push(chargeWrong('chem-protons-neutrons-swapped', N - E))
      break
  }
  return list.filter((w): w is WrongValue => w !== null)
}

const correctOf = (t: Particle, field: Field): { key: string; content: string } => {
  switch (field) {
    case 'element':
      return { key: String(z(t)), content: elementText(t.el) }
    case 'q':
      return { key: String(t.q), content: chargeText(t.q) }
    default:
      return { key: cell(t, field), content: `$${cell(t, field)}$` }
  }
}

// --- Texte je Schritt ---

const minus = (q: number) => (q < 0 ? `(${q})` : String(q))

function established(t: Particle, field: Field): string {
  const Z = z(t)
  switch (field) {
    case 'element':
      return String.raw`Z = ${Z} \;\Rightarrow\; \ce{${t.el.symbol}}`
    case 'p':
      return String.raw`\text{Protonen} = Z = ${Z}`
    case 'n':
      return String.raw`N = A - Z = ${t.a} - ${Z} = ${neutrons(t)}`
    case 'a':
      return String.raw`A = Z + N = ${Z} + ${neutrons(t)} = ${t.a}`
    case 'e':
      return t.q === 0 ? String.raw`\text{Elektronen} = Z = ${Z}` : String.raw`\text{Elektronen} = Z - q = ${Z} - ${minus(t.q)} = ${electrons(t)}`
    case 'q':
      return String.raw`q = Z - \text{Elektronen} = ${Z} - ${electrons(t)} = ${chargeLatex(t.q)}`
  }
}

const TITLES: Readonly<Record<Field, string>> = {
  element: 'Element',
  p: 'Protonen',
  n: 'Neutronen',
  a: 'Massenzahl',
  e: 'Elektronen',
  q: 'Ladung',
}

const QUESTIONS: Readonly<Record<Field, string>> = {
  element: 'Um welches Element handelt es sich?',
  p: 'Wie viele Protonen hat das Teilchen?',
  n: 'Wie viele Neutronen hat das Teilchen?',
  a: 'Wie groß ist die Massenzahl?',
  e: 'Wie viele Elektronen hat das Teilchen?',
  q: 'Welche Ladung hat das Teilchen?',
}

function hint(t: Particle, field: Field): string {
  switch (field) {
    case 'element':
      return 'Welche Zahl legt fest, um welches Element es sich handelt?'
    case 'p':
      return 'Die Protonenzahl gehört fest zum Element.'
    case 'n':
      return 'Die Massenzahl zählt alle Teilchen im Kern.'
    case 'a':
      return 'Welche Teilchen sitzen im Kern?'
    case 'e':
      return t.q === 0 ? 'Ein ungeladenes Atom hat gleich viele positive wie negative Teilchen.' : 'Ein Elektron ist negativ geladen. Was bedeutet das Vorzeichen der Ladung für die Zahl der Elektronen?'
    case 'q':
      return 'Vergleiche die Zahl der positiven und der negativen Teilchen.'
  }
}

function explanation(t: Particle, field: Field): Explanation {
  const Z = z(t)
  const N = neutrons(t)
  const E = electrons(t)
  const name = `$\\ce{${t.el.symbol}}$ (${t.el.name})`
  switch (field) {
    case 'element':
      return {
        detailed: `Das Element legt allein die Protonenzahl fest, die Ordnungszahl. $${Z}$ Protonen heißt $Z = ${Z}$: ${name}. Massenzahl, Neutronen und Elektronen verraten das Element nicht.`,
        short: `$${Z}$ Protonen: $Z = ${Z}$, also ${name}.`,
      }
    case 'p':
      return {
        detailed: `Die Zahl der Protonen ist die Ordnungszahl: ${name} hat $Z = ${Z}$, also $${Z}$ Protonen, in jedem Isotop und in jedem Ion.`,
        short: `Protonen $=$ Ordnungszahl $= ${Z}$.`,
      }
    case 'n':
      return {
        detailed: `Die Massenzahl $A = ${t.a}$ zählt Protonen und Neutronen zusammen. Ohne die $${Z}$ Protonen bleiben $N = A - Z = ${t.a} - ${Z} = ${N}$ Neutronen.`,
        short: `$N = A - Z = ${t.a} - ${Z} = ${N}$.`,
      }
    case 'a':
      return {
        detailed: `Die Massenzahl zählt die Teilchen im Kern: $A = Z + N = ${Z} + ${N} = ${t.a}$. Elektronen zählen nicht mit.`,
        short: `$A = Z + N = ${Z} + ${N} = ${t.a}$.`,
      }
    case 'e':
      if (t.q === 0) {
        return {
          detailed: `Das Teilchen ist ungeladen, also gibt es so viele Elektronen wie Protonen: $${E}$.`,
          short: `Ungeladen: Elektronen $=$ Protonen $= ${E}$.`,
        }
      }
      return {
        detailed:
          t.q > 0
            ? `Die Ladung $${chargeLatex(t.q)}$ heißt: Das Teilchen hat $${t.q}$ ${t.q === 1 ? 'Elektron' : 'Elektronen'} abgegeben. Elektronen $= Z - q = ${Z} - ${t.q} = ${E}$.`
            : `Die Ladung $${chargeLatex(t.q)}$ heißt: Das Teilchen hat $${-t.q}$ ${t.q === -1 ? 'Elektron' : 'Elektronen'} aufgenommen. Elektronen $= Z - q = ${Z} - (${t.q}) = ${E}$.`,
        short: `Elektronen $= Z - q = ${Z} - ${minus(t.q)} = ${E}$.`,
      }
    case 'q':
      return {
        detailed:
          t.q === 0
            ? `Gleich viele Protonen und Elektronen ($${Z}$): Die Ladungen gleichen sich aus, das Teilchen ist ungeladen.`
            : `$${Z}$ positive Protonen und $${E}$ negative Elektronen: $q = ${Z} - ${E} = ${chargeLatex(t.q)}$. ${t.q > 0 ? 'Es fehlen Elektronen, das Ion ist positiv.' : 'Es sind Elektronen zu viel, das Ion ist negativ.'}`,
        short: `$q = Z - \\text{Elektronen} = ${Z} - ${E} = ${chargeLatex(t.q)}$.`,
      }
  }
}

const cardOf = (t: Particle, field: Field) => ((field === 'e' || field === 'q') && t.q !== 0 ? 'atombau-ionen' : 'atombau-kernsymbol')

// „1 Proton", „2 Protonen"
const count = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 'en'}`
const resultLine = (t: Particle) => `$${symbolLatex(t)}$: ${count(z(t), 'Proton')}, ${count(neutrons(t), 'Neutron')}, ${count(electrons(t), 'Elektron')}`

// Schritte zu einem Teilchen; null, wenn ein Schritt keine falsche Antwort hätte (der Aufrufer zieht neu)
function stepsOf(t: Particle, set: GivenSet, withCharge: boolean, rng: Rng, prefix: string, focus?: string): GuidedStep[] | null {
  const known = new Set<Field>(GIVEN[set])
  if (!withCharge) known.add('q')
  const steps: GuidedStep[] = []
  for (const field of askedFields(set, withCharge)) {
    const correct = correctOf(t, field)
    const wrong = wrongValues(t, field, known)
    const choices = stepChoices(rng, correct, wrong, focus)
    if (choices.length === 0) return null
    const card = cardOf(t, field)
    steps.push({
      id: `${prefix ? `${prefix}-` : ''}${field}`,
      title: prefix ? `Teilchen ${prefix}: ${TITLES[field]}` : TITLES[field],
      question: prefix ? `Teilchen ${prefix}: ${QUESTIONS[field]}` : QUESTIONS[field],
      choices,
      // frei (S8b): Zahlen genau; das Element bleibt eine Auswahl
      ...(field === 'element' ? {} : { numeric: exactNumeric(correct.key, wrong, '', field === 'q' ? 'Ladung als Zahl mit Vorzeichen, z. B. $-2$; ungeladen $0$.' : undefined) }),
      hint: hint(t, field),
      explanation: explanation(t, field),
      established: prefix ? String.raw`\text{(${prefix}) } ${established(t, field)}` : established(t, field),
      cards: [card],
    })
    known.add(field)
  }
  return steps
}

// --- Zufall ---

// Elemente mit Isotopen (ohne Technetium); für Ionen nur solche mit typischer Ladung
const WITH_ISOTOPES = ELEMENTS.filter((el) => el.isotopes.length > 0)
const WITH_IONS = WITH_ISOTOPES.filter((el) => el.ions.length > 0)

// Teilchen der Altklausuren und des Übungsblatts (docs/CHEMIE.md §9): als Kernsymbol, in der Tabelle und im Paar
// nie erzeugen (Symbol, Massenzahl, Ladung)
export const EXAM_PARTICLES: readonly (readonly [string, number, number])[] = [
  ['Fe', 56, 0],
  ['Cl', 35, 0],
  ['Na', 23, 0],
  ['Cl', 35, -1],
]
export const isExamParticle = (t: Particle) => EXAM_PARTICLES.some(([symbol, a, q]) => t.el.symbol === symbol && t.a === a && t.q === q)

// Massenzahl und Ladung, die für dieses Element erlaubt sind (ohne die Teilchen der Altklausuren)
function allowedOf(el: Element, ion: boolean): Particle[] {
  return el.isotopes.flatMap((a) => (ion ? el.ions : [0]).map((q) => ({ el, a, q }))).filter((t) => !isExamParticle(t))
}

// null, wenn das Element so kein erlaubtes Teilchen hat (Natrium hat nur ²³Na; der Aufrufer zieht neu)
function randomParticle(rng: Rng, ion: boolean, el = rng.pick(ion ? WITH_IONS : WITH_ISOTOPES)): Particle | null {
  const allowed = allowedOf(el, ion)
  return allowed.length > 0 ? rng.pick(allowed) : null
}

// Kurzform eines Teilchens in der Form: atom oder ion
const chargeKind = (t: Particle) => (t.q === 0 ? 'atom' : 'ion')

function singleTask(level: Level, rng: Rng, ref: TaskRef, ion: boolean, focus?: string): ChemCalc | null {
  const t = randomParticle(rng, ion)
  if (!t) return null
  const withCharge = level >= 2
  // Grundlagen: nur Angaben ohne Ladung; „Element, Neutronen, Ladung" und „Protonen, Massenzahl,
  // Ladung" dort ohne Ladung
  const set = rng.pick(GIVEN_SETS)
  const steps = stepsOf(t, set, withCharge, rng, '', focus)
  if (!steps) return null
  const given = GIVEN[set]
  const isSymbol = set === 'symbol'
  return {
    task: {
      ref,
      instruction: isSymbol ? 'Bestimme Protonen, Neutronen und Elektronen' : 'Ergänze die fehlenden Angaben',
      note: withCharge ? undefined : 'Das Atom ist ungeladen.',
      functionLatex: isSymbol ? symbolLatex(t) : tableLatex([{ t, given }], withCharge),
      steps,
      cards: [...new Set(steps.flatMap((s) => s.cards))],
      resultText: resultLine(t),
    },
    form: `pne:${level}:${set}:${chargeKind(t)}`,
    substance: t.el.symbol,
  }
}

// Klausurniveau: zwei Teilchen in einer Tabelle, mit verschiedenen Angaben; zur Hälfte zwei Teilchen
// desselben Elements (Isotope oder Atom und Ion)
function pairTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  const first = randomParticle(rng, rng.chance(0.7))
  if (!first) return null
  const sameElement = rng.chance(0.5)
  const second = sameElement ? randomParticle(rng, first.el.ions.length > 0 && rng.chance(0.5), first.el) : randomParticle(rng, rng.chance(0.5))
  if (!second) return null
  if (second.el === first.el && second.a === first.a && second.q === first.q) return null
  const [set1, set2] = rng.shuffle(GIVEN_SETS.filter((s) => s !== 'symbol'))
  const steps1 = stepsOf(first, set1, true, rng, '1', focus)
  const steps2 = stepsOf(second, set2, true, rng, '2', focus)
  if (!steps1 || !steps2) return null
  const steps = [...steps1, ...steps2]
  const cards = [...new Set([...steps.flatMap((s) => s.cards), ...(sameElement ? ['atombau-isotope'] : [])])]
  return {
    task: {
      ref,
      instruction: 'Ergänze die fehlenden Angaben für beide Teilchen',
      functionLatex: tableLatex(
        [
          { t: first, given: GIVEN[set1] },
          { t: second, given: GIVEN[set2] },
        ],
        true,
      ),
      steps,
      cards,
      resultText: `${resultLine(first)}\n${resultLine(second)}`,
    },
    form: `pne:${level}:${set1}-${chargeKind(first)}:${set2}-${chargeKind(second)}:${sameElement ? 'gleich' : 'verschieden'}`,
    substance: sameElement ? first.el.symbol : `${first.el.symbol}-${second.el.symbol}`,
  }
}

const PARTICLE_ERRORS = [
  'chem-neutrons-mass-number',
  'chem-protons-neutrons-swapped',
  'chem-element-from-mass',
  'chem-mass-number-electrons',
]
const ION_ERRORS = ['chem-ion-charge-ignored', 'chem-ion-charge-sign', 'chem-electrons-as-protons']

export const PARTICLE_GENERATORS: readonly ChemGenerator[] = [
  {
    kind: 'pne-atom',
    free: true,
    part: 'teilchen',
    weights: { 1: 1, 2: 0.3 },
    errors: PARTICLE_ERRORS,
    generate: (level, rng, ref, focus) => singleTask(level, rng, ref, false, focus),
  },
  {
    kind: 'pne-ion',
    free: true,
    part: 'isotope-ionen',
    weights: { 2: 0.4 },
    errors: [...PARTICLE_ERRORS, ...ION_ERRORS],
    generate: (level, rng, ref, focus) => singleTask(level, rng, ref, true, focus),
  },
  {
    kind: 'pne-pair',
    free: true,
    part: 'isotope-ionen',
    weights: { 3: 1 },
    errors: [...PARTICLE_ERRORS, ...ION_ERRORS],
    generate: pairTask,
  },
]
