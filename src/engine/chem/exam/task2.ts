import type { ExamItem, ExamPart, ExamTask } from '../../exam/types.ts'
import { type Rng, createRng } from '../../random/rng.ts'
import { elementByZ } from '../elements.ts'
import { NOBLE_GASES } from '../electrons.ts'
import { ionTask, steckbriefTask } from '../generators/pse.ts'
import { orderTask } from '../generators/trends.ts'
import { type Place, mainGroupName, placeOf } from '../pse.ts'
import type { Property } from '../trends.ts'
import { type ExtraOption, withExtraOptions } from './extraOptions.ts'
import { fromStep } from './fromStep.ts'
import { knowledgeItem } from './knowledge.ts'

// „Klausuraufgabe 2 üben" (Plan M4, S6e; Bauplan Teil 1, Aufgabe 2 mit 6 Punkten): Periodensystem, gemischt wie in den
// Altklausuren.
// a) Steckbrief eines Elements, meist eines Hauptgruppenelements: Periode, Gruppe, Block (3),
// b) eine Wissensfrage, wechselnd: warum sich Elemente einer Gruppe ähneln, was die Periode angibt, Block der
//    Hauptgruppen, Richtung eines Trends (1),
// c) ein Trend (Richtung, dann eine Reihe ordnen) oder eine Ionenladung (zwei der drei Fragen: abgeben oder aufnehmen,
//    Ion, Edelgas) (2).
// Die Fragen kommen aus den Wissensfragen und Rechnungen der Themen „Aufbau des Periodensystems" und „Trends im
// Periodensystem", mit denselben falschen Antworten, Denk- und Rechenfehlern; wo eine Rechnung weniger als vier
// Antworten liefert, kommen sinnvolle weitere dazu (extraOptions.ts). Die Teile hängen nicht voneinander ab (keine
// Folgefehler); jede Frage zählt für sich.

export const TASK2_POINTS = 6

const PSE = 'chem-pse'
const TRENDS = 'chem-trends'
const PROPS: readonly Property[] = ['radius', 'ie', 'en']

// Anteil der Hauptgruppenelemente in Teil a (beide Altklausuren fragen nur Hauptgruppen)
export const MAIN_SHARE = 0.85

// Wissensfragen für Teil b je Art (Nummern der Sammlungen): Gruppe ähnlich, Periode, Block, Richtung eines Trends
export const KNOWLEDGE_QUESTIONS: Readonly<Record<'gruppe' | 'periode' | 'block' | 'trend', readonly { course: string; no: number }[]>> = {
  gruppe: [103, 104, 211].map((no) => ({ course: PSE, no })),
  periode: [102].map((no) => ({ course: PSE, no })),
  block: [114, 115].map((no) => ({ course: PSE, no })),
  trend: [101, 102, 115, 214].map((no) => ({ course: TRENDS, no })),
}

// --- a) Steckbrief ---

const PERIOD_WHY: ExtraOption['why'] = {
  detailed: 'Die Periode ist die Nummer der äußersten Schale, in der Elektronen sitzen; im Periodensystem ist das die Zeile.',
  short: 'Periode = äußerste besetzte Schale.',
}
const MAIN_GROUP_WHY: ExtraOption['why'] = {
  detailed: 'Bei Hauptgruppenelementen sagt die Zahl der Valenzelektronen die Hauptgruppe (Gruppen 1, 2 und 13 bis 18). Zähle die Elektronen der äußersten Schale.',
  short: 'Hauptgruppe = Zahl der Valenzelektronen.',
}
const SUB_GROUP_WHY: ExtraOption['why'] = {
  detailed: 'Bei Nebengruppenelementen zählt die Gruppennummer 3 bis 12 die s- und d-Elektronen der beiden äußersten Schalen zusammen.',
  short: 'Nebengruppe: s- und d-Elektronen außen zählen.',
}
const BLOCK_WHY: Readonly<Record<'s' | 'p' | 'd' | 'f', ExtraOption['why']>> = {
  s: {
    detailed: 'Zum s-Block gehören nur die I. und II. Hauptgruppe (Gruppen 1 und 2) und Helium; dort wird zuletzt eine s-Unterschale aufgefüllt.',
    short: 's-Block: Gruppen 1 und 2.',
  },
  p: {
    detailed: 'Zum p-Block gehören die III. bis VIII. Hauptgruppe (Gruppen 13 bis 18, ohne Helium); dort wird zuletzt eine p-Unterschale aufgefüllt.',
    short: 'p-Block: Gruppen 13 bis 18.',
  },
  d: {
    detailed: 'Zum d-Block gehören die Nebengruppen (Gruppen 3 bis 12); dort wird zuletzt eine d-Unterschale aufgefüllt.',
    short: 'd-Block: Gruppen 3 bis 12.',
  },
  f: {
    detailed: 'Zum f-Block gehören nur die Lanthanoide und Actinoide, die meist unter dem Periodensystem stehen; dort wird eine f-Unterschale aufgefüllt.',
    short: 'f-Block: Lanthanoide und Actinoide.',
  },
}
const MAIN_GROUPS = [1, 2, 13, 14, 15, 16, 17, 18]

const rightOf = (item: ExamItem) => {
  const none = () => {
    throw new Error('ohne Abhängigkeiten')
  }
  const build = item.build(none, none)
  return build.options.find((o) => o.id === build.correct)!.content
}

// weitere Gruppen: Nachbarn der richtigen (Hauptgruppen unter sich, Nebengruppen unter sich)
function groupExtras(group: number, main: boolean): ExtraOption[] {
  if (main) {
    const i = MAIN_GROUPS.indexOf(group)
    return [i + 1, i - 1, i + 2, i - 2].filter((j) => j >= 0 && j < MAIN_GROUPS.length).map((j) => ({ content: mainGroupName(MAIN_GROUPS[j]), why: MAIN_GROUP_WHY }))
  }
  return [group + 1, group - 1, group + 2, group - 2].filter((g) => g >= 3 && g <= 12).map((g) => ({ content: `Nebengruppe (Gruppe ${g})`, why: SUB_GROUP_WHY }))
}

function placePart(seed: string, rng: Rng): { part: ExamPart; place: Place } | null {
  const wantMain = rng.chance(MAIN_SHARE)
  for (let i = 0; i < 60; i++) {
    const calc = steckbriefTask(2, createRng(`${seed}:platz:${i}`), { level: 2, seed: 10000 })
    if (!calc || calc.task.steps.length !== 3) continue
    const z = Number(/Z = (\d+)/.exec(calc.task.note!)?.[1])
    const el = elementByZ(z)
    if (!el) continue
    const place = placeOf(el)
    if (place.main !== wantMain && i < 50) continue
    const [period, group, block] = calc.task.steps
    const periodItem = fromStep(period, 'periode', 'Periode', 1)
    const groupItem = fromStep(group, 'gruppe', 'Gruppe', 1)
    const blockItem = fromStep(block, 'block', 'Block', 1)
    // Block: alle vier zur Auswahl, im selben Wortlaut wie die richtige Antwort
    const blockRight = rightOf(blockItem)
    const blocks = (['s', 'p', 'd', 'f'] as const).map((b) => ({ content: blockRight.replace(/^[spdf]/, b), why: BLOCK_WHY[b] }))
    const periods = [place.period + 1, place.period - 1, place.period + 2, place.period - 2].filter((p) => p >= 1 && p <= 7)
    const part: ExamPart = {
      id: 'a',
      prompt: calc.task.note!,
      points: 3,
      items: [
        withExtraOptions(periodItem, periods.map((p) => ({ content: `$${p}$`, why: PERIOD_WHY })), rng),
        withExtraOptions(groupItem, groupExtras(place.group, place.main), rng),
        withExtraOptions(blockItem, blocks, rng),
      ],
    }
    return { part, place }
  }
  return null
}

// --- b) Wissensfrage ---

// Fragen, die die Antwort von Teil a verraten würden: Block der I. und II. Hauptgruppe (114) bei einem Element im s-Block,
// Platz der Nebengruppen (115) bei einem Nebengruppenelement, Alkalimetalle (104) und Halogene (211) bei einem Element
// dieser Gruppe
const reveals = ({ course, no }: { course: string; no: number }, place: Place) =>
  course === PSE && ((no === 114 && place.block === 's') || (no === 115 && !place.main) || (no === 104 && place.group === 1) || (no === 211 && place.group === 17))

function knowledgePart(rng: Rng, withTrend: boolean, place: Place): ExamPart {
  const pool = (kind: keyof typeof KNOWLEDGE_QUESTIONS) => KNOWLEDGE_QUESTIONS[kind].filter((q) => !reveals(q, place))
  const kinds = (Object.keys(KNOWLEDGE_QUESTIONS) as (keyof typeof KNOWLEDGE_QUESTIONS)[]).filter((k) => (withTrend || k !== 'trend') && pool(k).length > 0)
  const kind = rng.pick(kinds)
  const { course, no } = rng.pick(pool(kind))
  return {
    id: 'b',
    prompt: kind === 'trend' ? 'Trends im Periodensystem.' : 'Aufbau des Periodensystems.',
    points: 1,
    items: [knowledgeItem(course, no, 'wissen', 1, rng)],
  }
}

// --- c) Trend oder Ionenladung ---

const WAY_WHY: ExtraOption['why'] = {
  detailed: 'Atome mit wenigen Valenzelektronen (eins bis drei) geben alle ab; Atome mit vielen (fünf bis sieben) nehmen so viele auf, bis es acht sind. Beides führt zur Edelgaskonfiguration.',
  short: 'Wenige Valenzelektronen: abgeben; viele: bis acht auffüllen.',
}
const CHARGE_WHY: ExtraOption['why'] = {
  detailed: 'Die Ladung des Ions ist die Zahl der abgegebenen Elektronen (positiv) oder der aufgenommenen (negativ). Abgegeben oder aufgenommen wird, bis die Edelgaskonfiguration erreicht ist.',
  short: 'Ladung = abgegebene (+) oder aufgenommene (−) Elektronen.',
}
const NOBLE_WHY: ExtraOption['why'] = {
  detailed: 'Ein Ion hat die Konfiguration des Edelgases mit gleich vielen Elektronen. Zähle die Elektronen des Ions: Ordnungszahl minus Ladung.',
  short: 'Elektronen des Ions zählen: Z minus Ladung.',
}

const transferText = (k: number, give: boolean) => `Es ${give ? 'gibt' : 'nimmt'} ${k} ${k === 1 ? 'Elektron' : 'Elektronen'} ${give ? 'ab' : 'auf'}.`
const ionContent = (symbol: string, q: number) => `$\\ce{${symbol}^${Math.abs(q) === 1 ? '' : Math.abs(q)}${q > 0 ? '+' : '-'}}$`

function ionPart(seed: string, rng: Rng): ExamPart | null {
  const calc = ionTask(2, createRng(`${seed}:ion`), { level: 2, seed: 10000 })
  if (!calc || calc.task.steps.length !== 3) return null
  const [way, charge, noble] = calc.task.steps
  const ion = /^\$\\ce\{([A-Z][a-z]?)\^(\d*)([+-])\}\$$/.exec(charge.choices.find((c) => c.correct)!.content)
  if (!ion) return null
  const [, symbol, size, sign] = ion
  const q = (size === '' ? 1 : Number(size)) * (sign === '+' ? 1 : -1)
  const k = Math.abs(q)
  const ways = [transferText(k, q > 0), transferText(k, q < 0), transferText(8 - k, q > 0), transferText(8 - k, q < 0)]
  const charges = [q + 1, q - 1, q + 2, q - 2, -q].filter((x) => x !== 0 && Math.abs(x) <= 4)
  const nobleRight = noble.choices.find((c) => c.correct)!.content
  const nobleNames = NOBLE_GASES.map((g) => elementByZ(g.z)!.name)
  const at = nobleNames.indexOf(nobleRight)
  const nobles = [at + 1, at - 1, at + 2, at - 2, at - 3].filter((j) => j >= 0 && j < nobleNames.length).map((j) => nobleNames[j])
  const elName = calc.task.note!.replace(/^Element: /, '').replace(/, [IVX]+\. Hauptgruppe.*$/, '')
  const items = [
    withExtraOptions(fromStep(way, 'weg', 'Abgeben oder aufnehmen', 1), ways.map((w) => ({ content: w, why: WAY_WHY })), rng),
    withExtraOptions(fromStep(charge, 'ladung', 'Ion', 1), charges.map((x) => ({ content: ionContent(symbol, x), why: CHARGE_WHY })), rng),
    // die Frage nennt das Ion nicht (es wäre die Antwort der Frage davor)
    withExtraOptions(
      fromStep(noble, 'edelgas', 'Edelgaskonfiguration', 1, false, `Die Konfiguration welches Edelgases erreicht ${elName} als Ion?`),
      nobles.map((name) => ({ content: name, why: NOBLE_WHY })),
      rng,
    ),
  ]
  // zwei der drei Fragen, in ihrer Reihenfolge
  const drop = rng.int(0, 2)
  return { id: 'c', prompt: `Ionenbildung. ${calc.task.note!}`, points: 2, items: items.filter((_, i) => i !== drop) }
}

function trendPart(seed: string, rng: Rng): ExamPart | null {
  const calc = orderTask(rng.pick(PROPS), 2, createRng(`${seed}:trend`), { level: 2, seed: 10000 })
  if (!calc || calc.task.steps.length !== 2) return null
  const [direction, order] = calc.task.steps
  return {
    id: 'c',
    prompt: `Trends im Periodensystem. ${calc.task.note!}`,
    points: 2,
    items: [fromStep(direction, 'richtung', 'Richtung des Trends', 1), fromStep(order, 'ordnung', 'Reihe ordnen', 1)],
  }
}

export function buildTask2(seed: number): ExamTask {
  for (let attempt = 0; attempt < 50; attempt++) {
    const key = `aufgabe2:${seed}:${attempt}`
    const rng = createRng(key)
    const place = placePart(key, rng)
    const trend = rng.chance(0.5)
    const c = trend ? trendPart(key, rng) : ionPart(key, rng)
    if (!place || !c) continue
    // eine Wissensfrage zur Richtung eines Trends nur, wenn Teil c keinen Trend fragt
    const b = knowledgePart(rng, !trend, place.place)
    return {
      title: 'Aufgabe 2: Periodensystem',
      intro: 'Beantworte die Fragen zum Platz eines Elements im Periodensystem, zum Aufbau des Periodensystems und zu einem Trend oder einer Ionenladung.',
      givenLatex: '',
      note: 'Bei jeder Frage ist genau eine Antwort richtig.',
      parts: [place.part, b, c],
    }
  }
  throw new Error(`Keine Klausuraufgabe 2 zu Nummer ${seed}`)
}
