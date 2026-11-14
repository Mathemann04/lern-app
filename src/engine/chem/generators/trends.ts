import type { GuidedStep } from '../../guided/types.ts'
import type { Rng } from '../../random/rng.ts'
import type { Level, TaskRef } from '../../tasks/taskNumber.ts'
import type { Element } from '../elements.ts'
import { elementBySymbol } from '../elements.ts'
import { placeOf } from '../pse.ts'
import { ISOELECTRONIC, type IonRadius, type Property, RULE, TREND_ELEMENTS, VALUES, allComparable, ascending, comparable } from '../trends.ts'
import { type ChemCalc, type ChemGenerator, type WrongValue, stepChoices } from './shared.ts'

// Rechnungen zum Thema „Trends im Periodensystem" (Plan M4, Thema 2.2). Geordnet wird nur, wo Regel und Messwerte
// übereinstimmen (chem/trends.ts):
// - Vergleich zweier Elemente (Unterthema nach Größe): Richtung des Trends, dann welches den größeren Wert hat
// - Reihe ordnen (ab Vertiefung): drei (Klausurniveau vier) Elemente einer Periode oder Gruppe nach steigendem Wert
// - Ionenradien (Unterthema „ionenradien", ab Vertiefung): Teilchen mit gleicher Elektronenzahl nach Größe ordnen

const CARD: Readonly<Record<Property, string>> = { radius: 'tr-atomradius', ie: 'tr-ionisierung', en: 'tr-elektronegativitaet' }
const CARD_IONS = 'tr-ionenradien'
const PART: Readonly<Record<Property, string>> = { radius: 'atomradius', ie: 'ionisierung', en: 'elektronegativitaet' }

const ce = (text: string) => String.raw`\ce{${text}}`
const elName = (el: Element) => `${el.name} ($${ce(el.symbol)}$)`
const textWrong = (rule: string, text: string): WrongValue => ({ rule, key: text, content: text })

// Name mit Artikel: „der Atomradius", „die Ionisierungsenergie"; im Dativ „dem Atomradius"
const NAME: Readonly<Record<Property, { readonly the: string; readonly dative: string; readonly larger: string; readonly unit: string }>> = {
  radius: { the: 'der Atomradius', dative: 'dem Atomradius', larger: 'den größeren Atomradius', unit: 'pm' },
  ie: { the: 'die erste Ionisierungsenergie', dative: 'der ersten Ionisierungsenergie', larger: 'die größere erste Ionisierungsenergie', unit: 'kJ/mol' },
  en: { the: 'die Elektronegativität', dative: 'der Elektronegativität', larger: 'die größere Elektronegativität', unit: '' },
}
const capital = (s: string) => s[0].toUpperCase() + s.slice(1)

// Begründung je Eigenschaft und Richtung; effektive Kernladung = was die äußeren Elektronen von der Kernladung spüren,
// nachdem die inneren einen Teil abgeschirmt haben
const REASON: Readonly<Record<Property, { readonly period: string; readonly group: string }>> = {
  radius: {
    period: 'In einer Periode bleibt die Zahl der Schalen gleich, die Kernladung wächst, und die inneren Elektronen schirmen kaum mehr ab. Die effektive Kernladung steigt und zieht die Elektronen stärker an; die Atome werden nach rechts kleiner.',
    group: 'In einer Gruppe kommt nach unten jedes Mal eine Schale dazu. Die äußeren Elektronen sind weiter vom Kern entfernt und von den inneren abgeschirmt; die Atome werden größer.',
  },
  ie: {
    period: 'In einer Periode wächst die Kernladung bei gleicher Zahl von Schalen; die effektive Kernladung, die die Valenzelektronen spüren, steigt. Sie werden fester gehalten; nach rechts braucht man mehr Energie.',
    group: 'In einer Gruppe sitzen die Valenzelektronen nach unten immer weiter außen und sind stärker abgeschirmt. Sie lassen sich leichter entfernen.',
  },
  en: {
    period: 'In einer Periode wächst die Kernladung bei gleicher Zahl von Schalen; die effektive Kernladung steigt. Das Atom zieht Bindungselektronen nach rechts stärker an.',
    group: 'In einer Gruppe sind die Valenzelektronen nach unten weiter vom Kern entfernt und stärker abgeschirmt. Das Atom zieht Bindungselektronen schwächer an.',
  },
}

const ruleId = (prop: Property, dir: 'period' | 'group') => `chem-tr-${prop}-${dir}`

const valueText = (prop: Property, el: Element) => {
  const v = VALUES[prop][el.symbol]
  return prop === 'en' ? String(v.toFixed(2)).replace('.', '{,}') : `${v}\\,\\mathrm{${NAME[prop].unit === 'pm' ? 'pm' : 'kJ/mol'}}`
}
const measured = (prop: Property, els: readonly Element[]) =>
  `Messwerte (${prop === 'radius' ? 'Kovalenzradien' : prop === 'ie' ? 'erste Ionisierungsenergie' : 'nach Pauling'}): ${els.map((el) => `$${ce(el.symbol)}$ $${valueText(prop, el)}$`).join(', ')}.`

// Schritt „Richtung des Trends"
function directionStep(prop: Property, dir: 'period' | 'group', rng: Rng, focus?: string): GuidedStep | null {
  // eigene Worte (docs/CHEMIE.md §9): nicht wie die Frage einer Altklausur „Wie verändert sich … innerhalb einer Periode?"
  const walk = dir === 'period' ? 'Du gehst in einer Periode Feld für Feld nach rechts.' : 'Du gehst in einer Hauptgruppe Zeile für Zeile nach unten.'
  const up = RULE[prop][dir] === 1
  const larger = 'Sie wird größer.'
  const smaller = 'Sie wird kleiner.'
  const correct = up ? larger : smaller
  const fix = (s: string) => (prop === 'radius' ? s.replace('Sie', 'Er') : s)
  const choices = stepChoices(
    rng,
    { key: correct, content: fix(correct) },
    [textWrong(ruleId(prop, dir), fix(up ? smaller : larger)), textWrong('chem-tr-constant', fix('Sie bleibt etwa gleich.'))],
    focus,
  )
  if (choices.length === 0) return null
  return {
    id: 'richtung',
    title: 'Richtung des Trends',
    question: `${walk} Was geschieht mit ${NAME[prop].dative}?`,
    choices,
    hint: dir === 'period' ? 'In einer Periode bleibt die Zahl der Schalen gleich. Was ändert sich von Element zu Element?' : 'In einer Gruppe kommt nach unten jedes Mal eine Schale dazu.',
    explanation: { detailed: REASON[prop][dir], short: fix(correct) },
    cards: [CARD[prop]],
  }
}

// Paare und Reihen, die gefragt werden dürfen
function pairs(prop: Property): [Element, Element][] {
  const els = TREND_ELEMENTS.filter((el) => VALUES[prop][el.symbol] !== undefined)
  return els.flatMap((a, i) => els.slice(i + 1).filter((b) => comparable(prop, a, b)).map((b) => [a, b] as [Element, Element]))
}

// Reihen aus den Übungsblättern der Vorlesung erzeugt die App nicht (docs/CHEMIE.md §9: keine Kombinationen aus
// Klausuren und Übungsblättern); verglichen als sortierte Symbole
const EXERCISE_LINES: Readonly<Record<Property, readonly string[]>> = { radius: ['Cl-Mg-Na', 'K-Li-Na'], ie: [], en: [] }
const EXERCISE_IONS: readonly string[] = ['F-Mg-Na-O']
const setKey = (symbols: readonly string[]) => [...symbols].sort().join('-')

function lines(prop: Property, size: number): Element[][] {
  const els = TREND_ELEMENTS.filter((el) => VALUES[prop][el.symbol] !== undefined)
  const result: Element[][] = []
  const groups = [...new Set(els.map((el) => `g${placeOf(el).group}`)), ...new Set(els.map((el) => `p${placeOf(el).period}`))]
  for (const key of groups) {
    const line = els.filter((el) => (key[0] === 'g' ? `g${placeOf(el).group}` : `p${placeOf(el).period}`) === key)
    // alle Teilmengen der Größe size, deren Paare alle vergleichbar sind
    const pick = (start: number, chosen: Element[]) => {
      if (chosen.length === size) {
        if (allComparable(prop, chosen) && !EXERCISE_LINES[prop].includes(setKey(chosen.map((el) => el.symbol)))) result.push([...chosen])
        return
      }
      for (let i = start; i < line.length; i++) pick(i + 1, [...chosen, line[i]])
    }
    pick(0, [])
  }
  return result
}

const PROPS: readonly Property[] = ['radius', 'ie', 'en']
const INSTRUCTION: Readonly<Record<Property, string>> = { radius: 'Vergleiche die Atomradien', ie: 'Vergleiche die Ionisierungsenergien', en: 'Vergleiche die Elektronegativitäten' }
// Auswahl beim gezielten Üben einschränken, aber nie auf null
const narrow = <T>(pool: readonly T[], keep: (x: T) => boolean): T[] => (pool.some(keep) ? pool.filter(keep) : [...pool])

function compareTask(prop: Property, level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  let pool = pairs(prop)
  if (focus === ruleId(prop, 'group')) pool = narrow(pool, ([a, b]) => placeOf(a).group === placeOf(b).group)
  if (focus === ruleId(prop, 'period')) pool = narrow(pool, ([a, b]) => placeOf(a).period === placeOf(b).period)
  const [a, b] = rng.shuffle(rng.pick(pool))
  const dir = placeOf(a).period === placeOf(b).period ? 'period' : 'group'
  const larger = VALUES[prop][a.symbol] > VALUES[prop][b.symbol] ? a : b
  const smaller = larger === a ? b : a
  const first = directionStep(prop, dir, rng, focus)
  const second = stepChoices(rng, { key: larger.symbol, content: elName(larger) }, [{ rule: ruleId(prop, dir), key: smaller.symbol, content: elName(smaller) }], focus)
  if (!first || second.length === 0) return null
  const steps: GuidedStep[] = [
    first,
    {
      id: 'vergleich',
      title: 'Vergleich',
      question: `Welches Atom hat ${NAME[prop].larger}: ${elName(a)} oder ${elName(b)}?`,
      choices: second,
      hint: dir === 'period' ? 'Die beiden stehen in derselben Periode. Wer steht weiter rechts?' : 'Die beiden stehen in derselben Hauptgruppe. Wer steht weiter unten?',
      explanation: { detailed: `${REASON[prop][dir]} ${measured(prop, [a, b])}`, short: elName(larger) },
      cards: [CARD[prop]],
    },
  ]
  return {
    task: {
      ref,
      instruction: INSTRUCTION[prop],
      note: `${elName(a)} und ${elName(b)} stehen in derselben ${dir === 'period' ? `Periode (${placeOf(a).period}.)` : 'Hauptgruppe'}.`,
      steps,
      cards: [CARD[prop]],
      resultText: `${capital(NAME[prop].the)}: ${elName(larger)} > ${elName(smaller)}`,
      resultFigure: `pse-trend:${prop}:${a.symbol},${b.symbol}`,
    },
    form: `vergleich:${level}:${prop}:${dir}`,
    substance: `${prop}-${[a.symbol, b.symbol].sort().join('-')}`,
  }
}

// --- Reihe ordnen ---

const orderText = (els: readonly Element[]) => `$${els.map((el) => ce(el.symbol)).join(' < ')}$`

function orderTask(prop: Property, level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  const size = level >= 3 && rng.chance(0.6) ? 4 : 3
  let pool = lines(prop, size)
  if (pool.length === 0) pool = lines(prop, 3)
  if (focus === ruleId(prop, 'group')) pool = narrow(pool, (l) => placeOf(l[0]).group === placeOf(l[1]).group)
  if (focus === ruleId(prop, 'period')) pool = narrow(pool, (l) => placeOf(l[0]).period === placeOf(l[1]).period)
  if (pool.length === 0) return null
  const line = rng.shuffle(rng.pick(pool))
  const dir = placeOf(line[0]).period === placeOf(line[1]).period ? 'period' : 'group'
  const up = ascending(prop, line)
  const reversed = [...up].reverse()
  const middle = [up[0], ...up.slice(1, -1).reverse(), up[up.length - 1]]
  const swapped = up.length === 3 ? [up[1], up[0], up[2]] : middle
  const wrong: WrongValue[] = [
    { rule: ruleId(prop, dir), key: reversed.map((e) => e.symbol).join(), content: orderText(reversed) },
    { rule: 'chem-tr-order-middle', key: swapped.map((e) => e.symbol).join(), content: orderText(swapped) },
  ]
  const choices = stepChoices(rng, { key: up.map((e) => e.symbol).join(), content: orderText(up) }, wrong, focus)
  const first = level === 2 ? directionStep(prop, dir, rng, focus) : null
  if (choices.length === 0 || (level === 2 && !first)) return null
  const steps: GuidedStep[] = [
    ...(first ? [first] : []),
    {
      id: 'ordnung',
      title: 'Reihe ordnen',
      question: `Ordne nach steigender ${prop === 'radius' ? 'Größe der Atome' : prop === 'ie' ? 'erster Ionisierungsenergie' : 'Elektronegativität'}: ${line.map(elName).join(', ')}.`,
      choices,
      hint: dir === 'period' ? 'Alle stehen in derselben Periode. Ordne sie zuerst nach ihrer Gruppe.' : 'Alle stehen in derselben Hauptgruppe. Ordne sie zuerst nach ihrer Periode.',
      explanation: { detailed: `${REASON[prop][dir]} ${measured(prop, up)}`, short: orderText(up) },
      cards: [CARD[prop]],
    },
  ]
  return {
    task: {
      ref,
      instruction: 'Ordne die Elemente',
      note: `Alle Elemente stehen in derselben ${dir === 'period' ? 'Periode' : 'Hauptgruppe'}.`,
      steps,
      cards: [CARD[prop]],
      resultText: `${capital(NAME[prop].the)} steigt: ${orderText(up)}`,
      resultFigure: `pse-trend:${prop}:${up.map((e) => e.symbol).join(',')}`,
    },
    form: `ordnen:${level}:${prop}:${dir}`,
    substance: `${prop}-${up.map((e) => e.symbol).join('-')}`,
  }
}

// --- Ionenradien ---

const ionCe = (ion: IonRadius) => ce(`${ion.symbol}^${Math.abs(ion.charge) === 1 ? '' : Math.abs(ion.charge)}${ion.charge > 0 ? '+' : '-'}`)
const ionsText = (ions: readonly IonRadius[]) => `$${ions.map((i) => ionCe(i)).join(' < ')}$`

const ION_RULE = {
  correct: 'Alle haben gleich viele Elektronen; je mehr Protonen im Kern, desto stärker werden sie angezogen und desto kleiner das Teilchen.',
  reversed: 'Alle haben gleich viele Elektronen; je mehr Protonen im Kern, desto mehr Platz braucht der Kern und desto größer ist das Teilchen.',
  same: 'Alle haben gleich viele Elektronen und sind deshalb gleich groß; die Zahl der Protonen spielt keine Rolle.',
}

function ionTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  const series = rng.pick(ISOELECTRONIC)
  // vier Ionen nur aus der Reihe wie Neon (bei Argon liegen S²⁻ und Cl⁻ zu nah beieinander)
  const size = level >= 3 && series.like === 'Ne' ? 4 : 3
  const ions = rng.shuffle(rng.shuffle(series.ions).slice(0, size))
  if (EXERCISE_IONS.includes(setKey(ions.map((i) => i.symbol)))) return null
  const up = [...ions].sort((a, b) => a.radius - b.radius)
  // Abstand der Radien mindestens 3 %
  if (up.some((x, i) => i > 0 && (x.radius - up[i - 1].radius) / up[i - 1].radius < 0.03)) return null
  const reversed = [...up].reverse()
  const swapped = up.length === 3 ? [up[1], up[0], up[2]] : [up[0], up[2], up[1], up[3]]
  const first = stepChoices(
    rng,
    { key: 'richtig', content: ION_RULE.correct },
    [textWrong('chem-tr-ion-reversed', ION_RULE.reversed), textWrong('chem-tr-ion-same', ION_RULE.same)],
    focus,
  )
  const second = stepChoices(
    rng,
    { key: up.map((i) => i.symbol).join(), content: ionsText(up) },
    [
      { rule: 'chem-tr-ion-reversed', key: reversed.map((i) => i.symbol).join(), content: ionsText(reversed) },
      { rule: 'chem-tr-order-middle', key: swapped.map((i) => i.symbol).join(), content: ionsText(swapped) },
    ],
    focus,
  )
  if (first.length === 0 || second.length === 0) return null
  const z = (i: IonRadius) => elementBySymbol(i.symbol)!.z
  const electrons = z(ions[0]) - ions[0].charge
  return {
    task: {
      ref,
      instruction: 'Ordne die Ionen nach ihrer Größe',
      note: `Teilchen: ${ions.map((i) => `$${ionCe(i)}$`).join(', ')}.`,
      steps: [
        {
          id: 'regel',
          title: 'Was bestimmt die Größe?',
          question: 'Was bestimmt die Größe dieser Teilchen?',
          choices: first,
          hint: 'Zähle bei jedem Teilchen die Elektronen und die Protonen.',
          explanation: {
            detailed: `Alle haben ${electrons} Elektronen, so viele wie ${elementBySymbol(series.like)!.name}. Die Protonenzahlen sind verschieden (${ions.map((i) => `$${ionCe(i)}$: ${z(i)}`).join(', ')}): Mehr Protonen ziehen dieselben Elektronen stärker an.`,
            short: 'Mehr Protonen, kleineres Teilchen.',
          },
          cards: [CARD_IONS],
        },
        {
          id: 'ordnung',
          title: 'Ionen ordnen',
          question: 'Ordne nach steigendem Radius.',
          choices: second,
          hint: 'Das Teilchen mit den meisten Protonen ist am kleinsten.',
          explanation: { detailed: `Ionenradien nach Shannon: ${up.map((i) => `$${ionCe(i)}$ $${i.radius}\\,\\mathrm{pm}$`).join(', ')}.`, short: ionsText(up) },
          cards: [CARD_IONS],
        },
      ],
      cards: [CARD_IONS],
      resultText: `Radius steigt: ${ionsText(up)}`,
    },
    form: `ionenradien:${level}:${series.like}:${size}`,
    substance: up.map((i) => i.symbol).join('-'),
  }
}

export { compareTask, orderTask, ionTask, pairs, lines }

export const TREND_GENERATORS: readonly ChemGenerator[] = PROPS.flatMap((prop): ChemGenerator[] => [
  {
    kind: `vergleich-${prop}`,
    part: PART[prop],
    weights: { 1: 1, 2: 0.4 },
    errors: [ruleId(prop, 'period'), ruleId(prop, 'group'), 'chem-tr-constant'],
    generate: (level, rng, ref, focus) => compareTask(prop, level, rng, ref, focus),
  },
  {
    kind: `ordnen-${prop}`,
    part: PART[prop],
    weights: { 2: 0.6, 3: 1 },
    errors: [ruleId(prop, 'period'), ruleId(prop, 'group'), 'chem-tr-constant', 'chem-tr-order-middle'],
    generate: (level, rng, ref, focus) => orderTask(prop, level, rng, ref, focus),
  },
]).concat([
  {
    kind: 'ionenradien',
    part: 'ionenradien',
    weights: { 2: 0.5, 3: 0.6 },
    errors: ['chem-tr-ion-reversed', 'chem-tr-ion-same', 'chem-tr-order-middle'],
    generate: ionTask,
  },
])
