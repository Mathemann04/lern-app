import type { Choice, GuidedStep } from '../../guided/types.ts'
import type { Rng } from '../../random/rng.ts'
import type { Level, TaskRef } from '../../tasks/taskNumber.ts'
import {
  AUFBAU,
  type BoxRow,
  type Config,
  LETTERS,
  MAIN_GROUP,
  NOBLE_GASES,
  type Subshell,
  TASK_EXCEPTIONS,
  atomConfig,
  boxFigureId,
  boxRows,
  boxRowsText,
  capacity,
  configKey,
  configLatex,
  coreOf,
  electronCount,
  fill,
  hundBoxes,
  ionConfig,
  mainGroupOf,
  occupiedLatex,
  orbitalsOf,
  outsideCore,
  pairedFirstBoxes,
  regularConfig,
  removeLast,
  sorted,
  subshellLatex,
  unpairedIn,
  unpairedOf,
  valenceConfig,
  valenceCount,
} from '../electrons.ts'
import { type Element, ELEMENTS, elementByZ } from '../elements.ts'
import { type ChemCalc, type ChemGenerator, type WrongValue, stepChoices } from './shared.ts'

// Rechnungen zum Thema „Elektronen" (Plan M4, Thema 1.2), alles aus electrons.ts gerechnet:
// - Konfiguration eines Atoms (Unterthema „besetzung"): Schreibweise wählen, ungepaarte Elektronen zählen
// - Kästchenbild wählen (Unterthema „besetzung"): Pauli, Hund, Reihenfolge, Ausnahmen Cr und Cu
// - Konfiguration eines Ions (Unterthema „ionen", ab Vertiefung): Elektronen zählen, Konfiguration, ungepaarte
// - Valenzelektronen und Valenzkonfiguration von Hauptgruppenelementen, Element aus der Valenzkonfiguration
//   (Unterthema „valenz")
// - Quantenzahlen (Unterthema „quantenzahlen"): Werte von l und m, Plätze je Schale und Unterschale, erlaubte Sätze
// Erzeugte Konfigurationen nur bis Kr (docs/CHEMIE.md §6); Ausnahmen in Aufgaben nur Cr und Cu ab Vertiefung.

const CARD_QN = 'el-quantenzahlen'
const CARD_ORBITALS = 'el-orbitale'
const CARD_PAULI = 'el-pauli'
const CARD_HUND = 'el-hund'
const CARD_ORDER = 'el-reihenfolge'
const CARD_EXCEPTIONS = 'el-ausnahmen'
const CARD_VALENCE = 'el-valenz'
const CARD_IONS = 'el-ionen'

const ce = (text: string) => String.raw`\ce{${text}}`
const math = (latex: string) => `$${latex}$`
const numberWrong = (rule: string, n: number): WrongValue => ({ rule, key: String(n), content: math(String(n)) })
const at = (z: number) => elementByZ(z)!
const elName = (el: Element) => `${el.name} ($${ce(el.symbol)}$)`

// Ladung für mhchem, z. B. „Fe^2+", „Cl^-"
export const ionCeText = (el: Element, q: number) => (q === 0 ? el.symbol : `${el.symbol}^${Math.abs(q) === 1 ? '' : Math.abs(q)}${q > 0 ? '+' : '-'}`)

// --- Konfigurationen als Antworten ---

// Kern einer falschen Konfiguration: derselbe wie bei der Lösung, wenn seine Unterschalen dort voll sind (damit
// der Kern die Antwort nicht verrät), sonst ihr eigener
type Core = ReturnType<typeof coreOf>
const fitsCore = (config: Config, core: Core) => !core || fill(core.z).every((g) => config.some((o) => o.n === g.n && o.l === g.l && o.count === g.count))
const configChoice = (config: Config, withCore: boolean, core?: Core) => ({
  key: configKey(config),
  content: math(withCore && core !== undefined && fitsCore(config, core) && electronCount(config) > (core?.z ?? 0) ? configLatex(config, true, core) : configLatex(config, withCore)),
})
const configWrong = (rule: string, config: Config, withCore: boolean, core?: Core): WrongValue => ({ rule, ...configChoice(config, withCore, core) })

// Besetzung mit 3d vor 4s (und 4d vor 5s): typischer Fehler
const D_FIRST: readonly Subshell[] = (() => {
  const order = [...AUFBAU]
  for (const [d, s] of [
    [3, 4],
    [4, 5],
  ]) {
    const i = order.findIndex((x) => x.n === s && x.l === 0)
    const j = order.findIndex((x) => x.n === d && x.l === 2)
    const [moved] = order.splice(j, 1)
    order.splice(i, 0, moved)
  }
  return order
})()
export const dFirstConfig = (z: number) => fill(z, D_FIRST)

// Pauli verletzt: ein Elektron der letzten Unterschale in die volle s- oder p-Unterschale davor (s³, p⁷)
export function overfilledConfig(config: Config): Config | null {
  const last = config.at(-1)!
  const prev = config.slice(0, -1).findLast((o) => o.l <= 1)
  if (!prev || prev.count !== capacity(prev.l)) return null
  return sorted(config.map((o) => (o === prev ? { ...o, count: o.count + 1 } : o === last ? { ...o, count: o.count - 1 } : o)))
}

// 3d übersprungen (Ga bis Kr wie Hauptgruppen der 3. Periode aufgefüllt): [Ar] 4s² 4p¹ für Ga
export function dSkippedConfig(config: Config): Config | null {
  if (!config.some((o) => o.n === 4 && o.l === 1)) return null
  return config.filter((o) => !(o.n === 3 && o.l === 2))
}

// Summe ungleich Z: letzte Unterschale ein Elektron mehr (oder weniger, wenn sie voll ist)
export function miscountedConfig(config: Config): Config {
  const last = config.at(-1)!
  const delta = last.count < capacity(last.l) ? 1 : -1
  return sorted(config.map((o) => (o === last ? { ...o, count: o.count + delta } : o)))
}

// --- Kästchen ---

// gezeigte Unterschalen: alle außerhalb des Kerns; bei K und Ca auch das leere 3d (für den Fehler 3d vor 4s)
function shellsFor(config: Config, core: { z: number } | null, extra: readonly Subshell[] = []): Subshell[] {
  const shown: Subshell[] = outsideCore(config, core).map(({ n, l }) => ({ n, l }))
  for (const s of extra) if (!shown.some((x) => x.n === s.n && x.l === s.l)) shown.push(s)
  return sorted(shown.map((s) => ({ ...s, count: 1 }))).map(({ n, l }) => ({ n, l }))
}

const rowsOf = (config: Config, shells: readonly Subshell[]) => boxRows(config, shells)

// Hund verletzt: in der letzten teilweise besetzten Zeile erst paaren
function pairedFirstRows(rows: readonly BoxRow[], config: Config): BoxRow[] | null {
  const i = rows.findLastIndex((r) => r.boxes.some((b) => b === 'u'))
  if (i < 0) return null
  const count = config.find((o) => o.n === rows[i].shell.n && o.l === rows[i].shell.l)!.count
  const boxes = pairedFirstBoxes(rows[i].shell.l, count)
  if (boxes.join('') === rows[i].boxes.join('')) return null
  return rows.map((r, k) => (k === i ? { ...r, boxes } : r))
}

// Hund verletzt: einzelne Elektronen mit entgegengesetztem Spin
function antiparallelRows(rows: readonly BoxRow[]): BoxRow[] | null {
  const i = rows.findLastIndex((r) => r.boxes.filter((b) => b === 'u').length >= 2)
  if (i < 0) return null
  const second = rows[i].boxes.indexOf('u', rows[i].boxes.indexOf('u') + 1)
  return rows.map((r, k) => (k === i ? { ...r, boxes: r.boxes.map((b, j) => (j === second ? 'd' : b)) } : r))
}

// Pauli verletzt: in der letzten Zeile mit einem Paar zeigen beide Spins in dieselbe Richtung
function parallelPairRows(rows: readonly BoxRow[]): BoxRow[] | null {
  const i = rows.findLastIndex((r) => r.boxes.includes('2'))
  if (i < 0) return null
  const first = rows[i].boxes.indexOf('2')
  return rows.map((r, k) => (k === i ? { ...r, boxes: r.boxes.map((b, j) => (j === first ? 'x' : b)) } : r))
}

const boxWrong = (rule: string, core: string, rows: readonly BoxRow[] | null): WrongValue[] => (rows ? [{ rule, key: boxFigureId(core, rows), content: boxRowsText(core, rows) }] : [])

// Antworten als Bild: Inhalt ist die Beschreibung, das Bild die Id
const withFigures = (choices: Choice[], ids: ReadonlyMap<string, string>): Choice[] => choices.map((c) => ({ ...c, figure: ids.get(c.content) }))

// --- ungepaarte Elektronen ---

const pairedFirstUnpaired = (config: Config) => config.reduce((sum, o) => sum + unpairedIn(pairedFirstBoxes(o.l, o.count)), 0)

function unpairedStep(config: Config, label: string, rng: Rng, focus?: string): GuidedStep | null {
  const correct = unpairedOf(config)
  const last = config.at(-1)!
  const choices = stepChoices(
    rng,
    { key: String(correct), content: math(String(correct)) },
    [numberWrong('chem-el-unpaired-paired-first', pairedFirstUnpaired(config)), numberWrong('chem-el-unpaired-all', last.count)],
    focus,
  )
  if (choices.length === 0) return null
  const partial = config.filter((o) => o.count < capacity(o.l))
  return {
    id: 'ungepaart',
    title: 'Ungepaarte Elektronen',
    question: `Wie viele ungepaarte Elektronen hat ${label} im Grundzustand?`,
    choices,
    hint: 'Volle Unterschalen haben nur Paare. In einer teilweise besetzten Unterschale bekommt nach Hund erst jedes Orbital ein Elektron, bevor sich Paare bilden.',
    explanation: {
      detailed:
        partial.length === 0
          ? 'Alle besetzten Unterschalen sind voll; jedes Orbital hat ein Paar. Es gibt keine ungepaarten Elektronen.'
          : `${partial.map((o) => `$${occupiedLatex(o)}$: ${orbitalsOf(o.l)} ${orbitalsOf(o.l) === 1 ? 'Orbital' : 'Orbitale'} für ${o.count} ${o.count === 1 ? 'Elektron' : 'Elektronen'}, ${unpairedIn(hundBoxes(o.l, o.count))} ungepaart`).join('; ')}. Die übrigen Unterschalen sind voll.`,
      short: math(String(correct)),
    },
    established: `${correct}\\ \\text{ungepaart}`,
    cards: [CARD_HUND],
  }
}

// --- Konfiguration eines Atoms ---

function atomPool(level: Level): number[] {
  const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i)
  if (level === 1) return range(1, 18)
  // ohne Ausnahmen außer Cr und Cu (in diesem Bereich gibt es keine anderen)
  return range(level === 2 ? 3 : 11, 36)
}

function pickAtom(level: Level, rng: Rng, focus?: string): number {
  if (focus === 'chem-el-exception' && level >= 2) return rng.pick([24, 29])
  if (focus === 'chem-el-3d-first' && level >= 2) return rng.int(19, 28)
  if (focus === 'chem-el-d-skipped' && level >= 2) return rng.int(31, 36)
  const pool = atomPool(level)
  // ab Vertiefung meist die 4. Periode (dort liegen 4s und 3d)
  if (level >= 2 && rng.next() < 0.6) return rng.pick(pool.filter((z) => z >= 19))
  return rng.pick(pool)
}

function configTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  const z = pickAtom(level, rng, focus)
  const el = at(z)
  const config = atomConfig(z)
  const withCore = level >= 2
  const exception = (TASK_EXCEPTIONS as readonly string[]).includes(el.symbol)
  const over = overfilledConfig(config)
  const core = coreOf(config)
  const skipped = dSkippedConfig(config)
  const wrong: WrongValue[] = [
    ...(z >= 19 ? [configWrong('chem-el-3d-first', dFirstConfig(z), withCore, core)] : []),
    ...(over ? [configWrong('chem-el-overfilled', over, withCore, core)] : []),
    configWrong('chem-el-count', miscountedConfig(config), withCore, core),
    ...(skipped ? [configWrong('chem-el-d-skipped', skipped, withCore, core)] : []),
    ...(exception ? [configWrong('chem-el-exception', regularConfig(z), withCore, core)] : []),
  ]
  const choices = stepChoices(rng, configChoice(config, withCore), wrong, focus)
  if (choices.length === 0) return null
  const correct = configLatex(config, withCore)
  const steps: GuidedStep[] = [
    {
      id: 'konfiguration',
      title: 'Elektronenkonfiguration',
      question: `Wie lautet die Elektronenkonfiguration von ${elName(el)}?`,
      choices,
      hint: `${el.name} hat ${z} ${z === 1 ? 'Elektron' : 'Elektronen'}. Fülle die Unterschalen in der Reihenfolge 1s, 2s, 2p, 3s, 3p, 4s, 3d, 4p: s fasst 2, p 6, d 10 Elektronen.${exception ? ' Achte auf halb oder ganz volle d-Unterschalen.' : ''}`,
      explanation: {
        detailed: exception
          ? `Nach der Reihenfolge wäre es $${configLatex(regularConfig(z), withCore)}$. ${el.name} ist eine Ausnahme: Ein Elektron wechselt von 4s nach 3d, weil eine ${el.symbol === 'Cr' ? 'halb' : 'ganz'} volle d-Unterschale besonders günstig ist. Also $${correct}$.`
          : `${z} Elektronen verteilen sich in der Besetzungsreihenfolge auf die Unterschalen, jede bis zu ihrer Grenze (s 2, p 6, d 10): $${correct}$.${withCore && coreOf(config) ? ` Die inneren Elektronen fasst $[\\mathrm{${coreOf(config)!.symbol}}]$ zusammen.` : ''}`,
        short: math(correct),
      },
      established: correct,
      cards: [exception ? CARD_EXCEPTIONS : CARD_ORDER],
    },
  ]
  const unpaired = level <= 2 || z >= 19 ? unpairedStep(config, elName(el), rng, focus) : null
  if (unpaired) steps.push(unpaired)
  const figureCore = level === 1 ? null : core
  const extra = z === 19 || z === 20 ? [{ n: 3, l: 2 }] : []
  return {
    task: {
      ref,
      instruction: 'Bestimme die Elektronenkonfiguration',
      note: `Element: ${elName(el)}, Ordnungszahl $Z = ${z}$.${withCore ? ' Schreibweise mit Edelgaskern.' : ''}`,
      steps,
      cards: [CARD_ORDER],
      resultText: `${elName(el)}: $${correct}$`,
      resultFigure: boxFigureId(figureCore?.symbol ?? '', rowsOf(config, shellsFor(config, figureCore, extra))),
    },
    form: `konfiguration:${level}:${exception ? 'ausnahme' : config.at(-1)!.l}`,
    substance: el.symbol,
  }
}

// --- Kästchenbild wählen ---

function boxTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  const z = pickAtom(level, rng, focus)
  if (z === 1) return null
  const el = at(z)
  const config = atomConfig(z)
  // Edelgaskern erst ab Vertiefung (docs/CHEMIE.md §3)
  const core = level === 1 ? null : coreOf(config)
  const coreName = core?.symbol ?? ''
  const extra: Subshell[] = z === 19 || z === 20 ? [{ n: 3, l: 2 }] : []
  const shells = shellsFor(config, core, extra)
  const rows = rowsOf(config, shells)
  const exception = level >= 2 && (TASK_EXCEPTIONS as readonly string[]).includes(el.symbol)
  const regularRows = exception ? rowsOf(regularConfig(z), shellsFor(regularConfig(z), core, shells)) : null
  const dFirst = z >= 19 && z <= 28 ? rowsOf(dFirstConfig(z), shells) : null
  const wrong = [
    ...boxWrong('chem-el-hund', coreName, pairedFirstRows(rows, config)),
    ...boxWrong('chem-el-hund-spin', coreName, antiparallelRows(rows)),
    ...boxWrong('chem-el-pauli', coreName, parallelPairRows(rows)),
    ...boxWrong('chem-el-3d-first', coreName, dFirst),
    ...boxWrong('chem-el-exception', coreName, regularRows),
  ]
  const id = boxFigureId(coreName, rows)
  const ids = new Map([[boxRowsText(coreName, rows), id], ...wrong.map((w) => [w.content, w.key] as const)])
  const plain = stepChoices(rng, { key: id, content: boxRowsText(coreName, rows) }, wrong, focus)
  // mindestens zwei falsche Bilder, sonst ist die Wahl zu leicht
  if (plain.length < 3) return null
  const choices = withFigures(plain, ids)
  return {
    task: {
      ref,
      instruction: 'Wähle das richtige Kästchenbild',
      note: `Element: ${elName(el)}, Ordnungszahl $Z = ${z}$.${core ? ` Die inneren Elektronen $[\\mathrm{${core.symbol}}]$ sind nicht gezeichnet.` : ''} Jedes Kästchen ist ein Orbital, jeder Pfeil ein Elektron mit seinem Spin.`,
      steps: [
        {
          id: 'kaestchen',
          title: 'Kästchenschreibweise',
          question: `Welches Bild zeigt den Grundzustand von ${elName(el)}?`,
          choices,
          hint: 'Prüfe drei Regeln: Ein Orbital fasst höchstens zwei Elektronen mit entgegengesetztem Spin (Pauli). Gleichwertige Orbitale werden erst einzeln mit gleichem Spin besetzt (Hund). 4s kommt vor 3d.',
          explanation: {
            detailed: `${el.name}: $${configLatex(config, core !== null)}$. ${exception ? `Eine ${el.symbol === 'Cr' ? 'halb' : 'ganz'} volle d-Unterschale ist günstiger; deshalb steht in 4s nur ein Elektron. ` : ''}In jedem Orbital höchstens ein Paar mit entgegengesetztem Spin; in einer teilweise besetzten Unterschale zuerst je ein Elektron pro Orbital, alle mit gleichem Spin.`,
            short: 'Pauli, Hund und die Reihenfolge sind erfüllt.',
          },
          cards: [CARD_HUND, CARD_PAULI],
        },
      ],
      cards: [CARD_HUND],
      resultText: `${elName(el)}: $${configLatex(config, core !== null)}$`,
      resultFigure: id,
    },
    form: `kaestchen:${level}:${exception ? 'ausnahme' : config.at(-1)!.l}`,
    substance: el.symbol,
  }
}

// --- Konfiguration eines Ions ---

type Ion = { readonly el: Element; readonly q: number }
// Ionen der Elementtabelle von Li bis Kr (ohne Wasserstoff: H⁺ hat kein Elektron, H⁻ keine Schreibweise mit Kern)
export const ION_POOL: readonly Ion[] = ELEMENTS.filter((el) => el.z >= 3 && el.z <= 36).flatMap((el) => el.ions.map((q) => ({ el, q })))
const isTransition = (ion: Ion) => mainGroupOf(ion.el) === null

function pickIon(level: Level, rng: Rng, focus?: string): Ion {
  if (focus === 'chem-el-ion-3d') return rng.pick(ION_POOL.filter((i) => i.q > 0 && isTransition(i)))
  const transition = ION_POOL.filter(isTransition)
  return rng.next() < (level === 3 ? 0.6 : 0.4) ? rng.pick(transition) : rng.pick(ION_POOL.filter((i) => !isTransition(i)))
}

function ionTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  const { el, q } = pickIon(level, rng, focus)
  const z = el.z
  const config = ionConfig(z, q)
  const label = math(ce(ionCeText(el, q)))
  const n = z - q
  const first = stepChoices(rng, { key: String(n), content: math(String(n)) }, [numberWrong('chem-el-charge-ignored', z), numberWrong('chem-el-charge-sign', z + q)], focus)
  // gleich viele Elektronen wie ein Edelgas; Kationen dann kurz mit dessen Symbol (Ca²⁺ als [Ar]), Anionen mit dem
  // Kern des Atoms (Cl⁻ als [Ne] 3s² 3p⁶), damit man sieht, wie p aufgefüllt wird
  const noble = NOBLE_GASES.find((g) => g.z === n)
  const nobleGas = q > 0 ? noble : undefined
  const ionCore = nobleGas ?? coreOf(config)
  const wrongConfigs: WrongValue[] = [
    configWrong('chem-el-charge-ignored', atomConfig(z), true, ionCore),
    configWrong('chem-el-charge-sign', ionConfig(z, -q), true, ionCore),
    ...(q > 0 ? [configWrong('chem-el-ion-3d', removeLast(atomConfig(z), q), true, ionCore)] : []),
  ]
  const correct = nobleGas ? `[\\mathrm{${nobleGas.symbol}}]` : configLatex(config, true)
  const second = stepChoices(rng, { key: configKey(config), content: math(correct) }, wrongConfigs, focus)
  if (first.length === 0 || second.length === 0) return null
  const atomLatex = configLatex(atomConfig(z), true)
  const fromOuter = q > 0 && isTransition({ el, q })
  const steps: GuidedStep[] = [
    {
      id: 'elektronen',
      title: 'Elektronen zählen',
      question: `Wie viele Elektronen hat ${label}?`,
      choices: first,
      hint: `Das Atom hat ${z} Elektronen. Eine positive Ladung heißt: Elektronen abgegeben; eine negative: Elektronen aufgenommen.`,
      explanation: { detailed: `$${z} ${q > 0 ? '-' : '+'} ${Math.abs(q)} = ${n}$ Elektronen.`, short: math(String(n)) },
      established: `${n}\\ \\text{Elektronen}`,
      cards: [CARD_IONS],
    },
    {
      id: 'konfiguration',
      title: 'Konfiguration des Ions',
      question: `Wie lautet die Elektronenkonfiguration von ${label}?`,
      choices: second,
      hint: q > 0 ? 'Ein Kation gibt die Elektronen der äußersten Schale ab, also die mit dem größten n, nicht unbedingt die zuletzt besetzten.' : 'Ein Anion nimmt Elektronen auf; sie kommen in die nächsten freien Plätze der Reihenfolge.',
      explanation: {
        detailed: fromOuter
          ? `Das Atom: $${atomLatex}$. Abgegeben werden zuerst die Elektronen aus 4s (größtes n), erst danach aus 3d: $${correct}$.`
          : `Das Atom: $${atomLatex}$. ${q > 0 ? `Es gibt ${q} ${q === 1 ? 'Elektron' : 'Elektronen'} aus der äußersten Schale ab` : `Es nimmt ${-q} ${q === -1 ? 'Elektron' : 'Elektronen'} auf`}: $${nobleGas ? configLatex(config, false) : correct}$.${noble ? ` Das ist die Konfiguration des Edelgases ${elementByZ(n)!.name}${nobleGas ? `, kurz $${correct}$` : ''}.` : ''}`,
        short: math(correct),
      },
      established: correct,
      cards: [CARD_IONS],
    },
  ]
  const unpaired = unpairedStep(config, label, rng, focus)
  if (unpaired && fromOuter) steps.push(unpaired)
  const core = coreOf(config)
  const atomCore = coreOf(atomConfig(z))
  // leeres 4s bei Kationen der Nebengruppen zeigen
  const shells = shellsFor(config, core, fromOuter && atomCore?.symbol === core?.symbol ? outsideCore(atomConfig(z), atomCore) : [])
  return {
    task: {
      ref,
      instruction: 'Bestimme die Elektronenkonfiguration des Ions',
      note: `Ion: ${label} (${el.name}, Ordnungszahl $Z = ${z}$). Schreibweise mit Edelgaskern.`,
      steps,
      cards: [CARD_IONS],
      resultText: `${label}: $${correct}$`,
      resultFigure: boxFigureId(core?.symbol ?? '', rowsOf(config, shells)),
    },
    form: `ion:${level}:${fromOuter ? 'nebengruppe' : q > 0 ? 'kation' : 'anion'}`,
    substance: `${el.symbol}${q}`,
  }
}

// --- Valenzelektronen ---

const valenceLatex = (config: Config) => config.map(occupiedLatex).join('\\,')
const valenceWrong = (rule: string, config: Config): WrongValue => ({ rule, key: configKey(config), content: math(valenceLatex(config)) })
const shifted = (config: Config, dn: number): Config => config.map((o) => ({ ...o, n: o.n + dn }))

// erzeugte Konfigurationen nur bis Kr (docs/CHEMIE.md §6), auch Valenzkonfigurationen
function valencePool(level: Level): Element[] {
  return MAIN_GROUP.filter((el) => mainGroupOf(el)!.period <= (level === 1 ? 3 : 4))
}

// typischer Fehler: innere Elektronen mitgezählt (in der 4. Periode und darunter das volle d, sonst die Schale darunter)
export function withInner(el: Element): Config {
  const { group, period } = mainGroupOf(el)!
  const val = valenceConfig(el)
  const inner: Config = group >= 13 && period >= 4 ? [{ n: period - 1, l: 2, count: 10 }] : period === 2 ? [{ n: 1, l: 0, count: 2 }] : [{ n: period - 1, l: 0, count: 2 }, { n: period - 1, l: 1, count: 6 }]
  return sorted([...inner, ...val])
}

// typischer Fehler: Valenzkonfiguration des Ions statt des Atoms (nur Ionen mit Edelgaskonfiguration, also
// nicht Ga³⁺, Sn²⁺ und Ähnliche, deren äußerste Schale auch d-Elektronen hat)
export function ionValence(el: Element): Config | null {
  const q = el.ions[0]
  if (q === undefined) return null
  const { group, period } = mainGroupOf(el)!
  if (q > 0 && group >= 13 && period >= 4) return null
  const config = ionConfig(el.z, q)
  const n = Math.max(...config.map((o) => o.n))
  return config.filter((o) => o.n === n && o.l <= 1)
}

function valenceTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  let pool = valencePool(level)
  if (focus === 'chem-val-group-number' || focus === 'chem-val-s-missing') pool = pool.filter((el) => mainGroupOf(el)!.group >= 13 && mainGroupOf(el)!.group <= 16)
  if (focus === 'chem-val-ion') pool = pool.filter((el) => el.ions.length > 0)
  const el = rng.pick(pool)
  const { group, period } = mainGroupOf(el)!
  const count = valenceCount(group)
  const first = stepChoices(
    rng,
    { key: String(count), content: math(String(count)) },
    [...(group >= 13 ? [numberWrong('chem-val-group-number', group)] : []), numberWrong('chem-val-period', period), numberWrong('chem-val-all-electrons', el.z)],
    focus,
  )
  const val = valenceConfig(el)
  const ion = ionValence(el)
  const second = stepChoices(
    rng,
    { key: configKey(val), content: math(valenceLatex(val)) },
    [
      valenceWrong('chem-val-wrong-shell', shifted(val, 1)),
      valenceWrong('chem-val-core', withInner(el)),
      ...(ion ? [valenceWrong('chem-val-ion', ion)] : []),
      ...(group >= 13 && group <= 16 ? [valenceWrong('chem-val-s-missing', [{ n: period, l: 1, count }])] : []),
    ],
    focus,
  )
  if (first.length === 0 || second.length === 0) return null
  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'][count - 1]
  const result = valenceLatex(val)
  return {
    task: {
      ref,
      instruction: 'Bestimme die Valenzelektronen',
      note: `Element: ${elName(el)}, Ordnungszahl $Z = ${el.z}$, ${period}. Periode, ${roman}. Hauptgruppe (Gruppe ${group}).`,
      steps: [
        {
          id: 'anzahl',
          title: 'Zahl der Valenzelektronen',
          question: `Wie viele Valenzelektronen hat ein ${el.name}-Atom?`,
          choices: first,
          hint: 'Bei Hauptgruppenelementen sagt die römische Nummer der Hauptgruppe, wie viele Elektronen in der äußersten Schale sind.',
          explanation: {
            detailed: `${el.name} steht in der ${roman}. Hauptgruppe: ${count} Valenzelektronen.${group >= 13 ? ` In der Zählung 1 bis 18 liegen die zehn Nebengruppen dazwischen; für die Gruppen 13 bis 18 zieht man deshalb zehn ab: $${group} - 10 = ${count}$.` : ''}`,
            short: math(String(count)),
          },
          established: `${count}\\ \\text{Valenzelektronen}`,
          cards: [CARD_VALENCE],
        },
        {
          id: 'valenzkonfiguration',
          title: 'Valenzkonfiguration',
          question: `Wie lautet die Valenzkonfiguration von ${elName(el)}?`,
          choices: second,
          hint: `Die Valenzelektronen sitzen in der äußersten Schale; ihre Nummer ist die Periode. Bei Hauptgruppen zählen nur s und p dieser Schale.`,
          explanation: {
            detailed: `${period}. Periode: äußerste Schale $n = ${period}$. Die ${count} Valenzelektronen verteilen sich auf ${period}s (höchstens 2) und ${period}p: $${result}$.`,
            short: math(result),
          },
          established: result,
          cards: [CARD_VALENCE],
        },
      ],
      cards: [CARD_VALENCE],
      resultText: `${elName(el)}: ${count} ${count === 1 ? 'Valenzelektron' : 'Valenzelektronen'}, $${result}$`,
    },
    form: `valenz:${level}:${group}`,
    substance: el.symbol,
  }
}

// --- Element aus der Valenzkonfiguration ---

const byGroupPeriod = (group: number, period: number) => MAIN_GROUP.find((el) => mainGroupOf(el)!.group === group && mainGroupOf(el)!.period === period)
const groupOfCount = (count: number) => (count <= 2 ? count : count + 10)

function elementTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  const pool = valencePool(level).filter((el) => mainGroupOf(el)!.period >= 3)
  const el = rng.pick(focus === 'chem-val-rev-p-only' ? pool.filter((x) => mainGroupOf(x)!.group >= 13) : pool)
  const { group, period } = mainGroupOf(el)!
  const val = valenceConfig(el)
  const count = valenceCount(group)
  const p = val.find((o) => o.l === 1)?.count ?? 0
  const option = (x: Element) => elName(x)
  const wrongEls: [string, Element | undefined][] = [
    ['chem-val-rev-period', byGroupPeriod(group, period - 1)],
    ['chem-val-rev-z', elementByZ(count)],
    ['chem-val-rev-p-only', p > 0 && p < count ? byGroupPeriod(groupOfCount(p), period) : undefined],
  ]
  const choices = stepChoices(
    rng,
    { key: el.symbol, content: option(el) },
    wrongEls.flatMap(([rule, x]) => (x ? [{ rule, key: x.symbol, content: option(x) }] : [])),
    focus,
  )
  if (choices.length === 0) return null
  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'][count - 1]
  const given = valenceLatex(val)
  return {
    task: {
      ref,
      instruction: 'Bestimme das Element',
      note: `Ein Hauptgruppenelement hat die Valenzkonfiguration $${given}$.`,
      steps: [
        {
          id: 'element',
          title: 'Element bestimmen',
          question: `Welches Element hat die Valenzkonfiguration $${given}$?`,
          choices,
          hint: 'Die Nummer der Schale ist die Periode. Die Zahl aller Valenzelektronen (s und p zusammen) ist die Nummer der Hauptgruppe.',
          explanation: {
            detailed: `Äußerste Schale $n = ${period}$: ${period}. Periode. ${count} Valenzelektronen: ${roman}. Hauptgruppe. Dort steht ${el.name}.`,
            short: elName(el),
          },
          cards: [CARD_VALENCE],
        },
      ],
      cards: [CARD_VALENCE],
      resultText: `$${given}$: ${elName(el)}`,
    },
    form: `element:${level}:${group}`,
    substance: el.symbol,
  }
}

// --- Quantenzahlen ---

const list = (values: readonly number[]) => values.map((v) => String(v)).join(',\\ ')
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i)
const lValues = (values: readonly number[]): WrongValue['content'] => math(`l = ${list(values)}`)
const lWrong = (rule: string, values: readonly number[]): WrongValue => ({ rule, key: values.join(','), content: lValues(values) })

function shellTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  const n = rng.int(level === 1 ? 2 : 3, 4)
  const first = stepChoices(rng, { key: range(0, n - 1).join(','), content: lValues(range(0, n - 1)) }, [lWrong('chem-qn-l-to-n', range(0, n)), lWrong('chem-qn-l-from-1', range(1, n))], focus)
  const max = 2 * n * n
  const second = stepChoices(rng, { key: String(max), content: math(String(max)) }, [numberWrong('chem-qn-2n', 2 * n), numberWrong('chem-qn-n-squared', n * n), numberWrong('chem-qn-octet', 8)], focus)
  if (first.length === 0 || second.length === 0) return null
  const subshells = range(0, n - 1)
    .map((l) => `${n}${LETTERS[l]}`)
    .join(', ')
  return {
    task: {
      ref,
      instruction: 'Bestimme Unterschalen und Plätze einer Schale',
      note: `Schale mit der Hauptquantenzahl $n = ${n}$.`,
      steps: [
        {
          id: 'l-werte',
          title: 'Nebenquantenzahl',
          question: `Welche Werte kann die Nebenquantenzahl $l$ für $n = ${n}$ annehmen?`,
          choices: first,
          hint: 'Die Nebenquantenzahl beginnt bei 0 und bleibt kleiner als n.',
          explanation: { detailed: `$l$ läuft von $0$ bis $n - 1 = ${n - 1}$. Das sind ${n} Unterschalen: ${subshells}.`, short: lValues(range(0, n - 1)) },
          established: `l = ${list(range(0, n - 1))}`,
          cards: [CARD_QN],
        },
        {
          id: 'elektronen',
          title: 'Plätze der Schale',
          question: `Wie viele Elektronen fasst die Schale $n = ${n}$ höchstens?`,
          choices: second,
          hint: 'Die Schale hat n² Orbitale, und jedes Orbital fasst zwei Elektronen.',
          explanation: { detailed: `$${n}^2 = ${n * n}$ Orbitale mit je 2 Elektronen: $2n^2 = ${max}$.`, short: math(String(max)) },
          established: `${max}\\ \\text{Elektronen}`,
          cards: [CARD_ORBITALS],
        },
      ],
      cards: [CARD_QN],
      resultText: `Schale $n = ${n}$: Unterschalen ${subshells}, höchstens ${max} Elektronen`,
    },
    form: `schale:${level}:${n}`,
    substance: `n${n}`,
  }
}

const mValues = (l: number) => range(-l, l)
const mContent = (values: readonly number[]) => math(`m = ${list(values)}`)
const mWrong = (rule: string, values: readonly number[]): WrongValue => ({ rule, key: values.join(','), content: mContent(values) })

function subshellTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  const n = rng.int(level === 1 ? 2 : 3, level === 3 ? 5 : 4)
  const l = rng.int(level === 1 ? 0 : 1, Math.min(n - 1, 3))
  const s: Subshell = { n, l }
  const name = subshellLatex(s)
  const steps: GuidedStep[] = []
  const lChoices = stepChoices(rng, { key: String(l), content: math(`l = ${l}`) }, [{ rule: 'chem-qn-letter-shift', key: String(l + 1), content: math(`l = ${l + 1}`) }, { rule: 'chem-qn-l-is-n', key: String(n), content: math(`l = ${n}`) }], focus)
  if (lChoices.length === 0) return null
  steps.push({
    id: 'l',
    title: 'Nebenquantenzahl',
    question: `Welche Nebenquantenzahl $l$ gehört zur Unterschale $${name}$?`,
    choices: lChoices,
    hint: 'Die Buchstaben stehen der Reihe nach für l = 0, 1, 2, 3: s, p, d, f.',
    explanation: { detailed: `Der Buchstabe $\\mathrm{${LETTERS[l]}}$ steht für $l = ${l}$; die Zahl davor ist $n = ${n}$.`, short: math(`l = ${l}`) },
    established: `l = ${l}`,
    cards: [CARD_QN],
  })
  if (level >= 2) {
    const m = stepChoices(rng, { key: mValues(l).join(','), content: mContent(mValues(l)) }, [mWrong('chem-qn-m-positive', range(0, l)), mWrong('chem-qn-m-beyond-l', range(-l - 1, l + 1))], focus)
    if (m.length === 0) return null
    steps.push({
      id: 'm',
      title: 'Magnetquantenzahl',
      question: `Welche Werte hat die Magnetquantenzahl $m$ in der Unterschale $${name}$?`,
      choices: m,
      hint: 'm läuft von −l bis +l, die 0 eingeschlossen. Jeder Wert ist ein Orbital.',
      explanation: { detailed: `$m$ läuft von $-${l}$ bis $+${l}$: ${orbitalsOf(l)} Werte, also ${orbitalsOf(l)} ${orbitalsOf(l) === 1 ? 'Orbital' : 'Orbitale'}.`, short: mContent(mValues(l)) },
      established: `m = ${list(mValues(l))}`,
      cards: [CARD_QN],
    })
  }
  const places = capacity(l)
  const third = stepChoices(rng, { key: String(places), content: math(String(places)) }, [numberWrong('chem-qn-one-per-orbital', orbitalsOf(l)), numberWrong('chem-qn-subshell-as-shell', 2 * n * n)], focus)
  if (third.length === 0) return null
  steps.push({
    id: 'plaetze',
    title: 'Plätze der Unterschale',
    question: `Wie viele Elektronen fasst die Unterschale $${name}$ höchstens?`,
    choices: third,
    hint: 'Jedes Orbital der Unterschale fasst zwei Elektronen mit entgegengesetztem Spin.',
    explanation: { detailed: `${orbitalsOf(l)} ${orbitalsOf(l) === 1 ? 'Orbital' : 'Orbitale'} mit je 2 Elektronen: $2 \\cdot (2l + 1) = ${places}$.`, short: math(String(places)) },
    established: `${places}\\ \\text{Elektronen}`,
    cards: [CARD_ORBITALS],
  })
  return {
    task: {
      ref,
      instruction: 'Bestimme die Quantenzahlen einer Unterschale',
      note: `Unterschale $${name}$.`,
      steps,
      cards: [CARD_QN],
      resultText: `$${name}$: $l = ${l}$, ${orbitalsOf(l)} ${orbitalsOf(l) === 1 ? 'Orbital' : 'Orbitale'}, höchstens ${places} Elektronen`,
    },
    form: `unterschale:${level}:${l}`,
    substance: `${n}${LETTERS[l]}`,
  }
}

// Satz aus vier Quantenzahlen
type QnSet = { readonly n: number; readonly l: number; readonly m: number; readonly s: string }
const SPIN_UP = String.raw`+\tfrac{1}{2}`
const SPIN_DOWN = String.raw`-\tfrac{1}{2}`
const qnLatex = (q: QnSet) => `n = ${q.n},\\ l = ${q.l},\\ m = ${q.m},\\ s = ${q.s}`

function allowedTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  const n = rng.int(2, 4)
  const l = rng.int(1, Math.min(n - 1, 3))
  const m = rng.int(-l, l)
  const spin = rng.pick([SPIN_UP, SPIN_DOWN])
  const valid: QnSet = { n, l, m, s: spin }
  // falsche Sätze mit ähnlichen Zahlen, je eine Regel verletzt
  const n2 = rng.int(1, 4)
  const l2 = rng.int(0, Math.min(n2 - 1, 3))
  const wrongSets: [string, QnSet][] = [
    ['chem-qn-l-to-n', { n: n2, l: n2, m: rng.int(-Math.min(n2, 1), Math.min(n2, 1)), s: rng.pick([SPIN_UP, SPIN_DOWN]) }],
    ['chem-qn-m-beyond-l', { n: n2, l: l2, m: rng.pick([-1, 1]) * (l2 + 1), s: rng.pick([SPIN_UP, SPIN_DOWN]) }],
    ['chem-qn-spin', { n: n2, l: l2, m: rng.int(-l2, l2), s: rng.pick(['1', '0', '-1']) }],
  ]
  const first = stepChoices(
    rng,
    { key: qnLatex(valid), content: math(qnLatex(valid)) },
    wrongSets.map(([rule, q]) => ({ rule, key: qnLatex(q), content: math(qnLatex(q)) })),
    focus,
  )
  const orbital = (k: number) => math(subshellLatex({ n, l: k }))
  const second = stepChoices(
    rng,
    { key: String(l), content: orbital(l) },
    [{ rule: 'chem-qn-letter-shift', key: String(l - 1), content: orbital(l - 1) }, ...(Math.abs(m) < n && Math.abs(m) <= 3 ? [{ rule: 'chem-qn-m-as-l', key: String(Math.abs(m)), content: orbital(Math.abs(m)) }] : [])],
    focus,
  )
  if (first.length === 0 || second.length === 0) return null
  return {
    task: {
      ref,
      instruction: 'Prüfe Sätze von Quantenzahlen',
      note: 'Ein Elektron wird durch vier Quantenzahlen beschrieben: $n$, $l$, $m$ und den Spin $s$.',
      steps: [
        {
          id: 'erlaubt',
          title: 'Erlaubter Satz',
          question: 'Welcher Satz von Quantenzahlen ist erlaubt?',
          choices: first,
          hint: 'Prüfe der Reihe nach: l von 0 bis n − 1, m von −l bis +l, s nur +½ oder −½.',
          explanation: { detailed: `$l = ${l}$ ist kleiner als $n = ${n}$, $m = ${m}$ liegt zwischen $-${l}$ und $+${l}$, und der Spin ist $${spin}$. Alle Regeln sind erfüllt.`, short: math(qnLatex(valid)) },
          established: qnLatex(valid),
          cards: [CARD_QN],
        },
        {
          id: 'orbital',
          title: 'Unterschale',
          question: 'In welcher Unterschale sitzt das Elektron mit diesem erlaubten Satz?',
          choices: second,
          hint: 'n gibt die Zahl, l den Buchstaben: l = 0 ist s, 1 ist p, 2 ist d, 3 ist f. m sagt nur, welches Orbital der Unterschale.',
          explanation: { detailed: `$n = ${n}$ und $l = ${l}$ ergeben $${subshellLatex({ n, l })}$. Die Magnetquantenzahl $m = ${m}$ wählt eines ihrer ${orbitalsOf(l)} Orbitale.`, short: orbital(l) },
          cards: [CARD_QN],
        },
      ],
      cards: [CARD_QN],
      resultText: `$${qnLatex(valid)}$: ein Elektron in $${subshellLatex({ n, l })}$`,
    },
    form: `erlaubt:${level}:${l}`,
    substance: `${n}${LETTERS[l]}${m}`,
  }
}

export { configTask, boxTask, ionTask, valenceTask, elementTask, shellTask, subshellTask, allowedTask }

// Rechenfehler je Rechenart (für gezieltes Üben)
export const ELEKTRONEN_GENERATORS: readonly ChemGenerator[] = [
  {
    kind: 'konfiguration',
    part: 'besetzung',
    weights: { 1: 1, 2: 1, 3: 0.7 },
    errors: ['chem-el-3d-first', 'chem-el-overfilled', 'chem-el-count', 'chem-el-d-skipped', 'chem-el-exception', 'chem-el-unpaired-paired-first', 'chem-el-unpaired-all'],
    generate: configTask,
  },
  {
    kind: 'kaestchen',
    part: 'besetzung',
    weights: { 1: 0.8, 2: 0.7, 3: 0.5 },
    errors: ['chem-el-hund', 'chem-el-hund-spin', 'chem-el-pauli', 'chem-el-3d-first', 'chem-el-exception'],
    generate: boxTask,
  },
  {
    kind: 'ion-konfiguration',
    part: 'ionen',
    weights: { 2: 0.7, 3: 1 },
    errors: ['chem-el-charge-ignored', 'chem-el-charge-sign', 'chem-el-ion-3d', 'chem-el-unpaired-paired-first', 'chem-el-unpaired-all'],
    generate: ionTask,
  },
  {
    kind: 'valenz',
    part: 'valenz',
    weights: { 1: 0.8, 2: 0.6, 3: 0.4 },
    errors: ['chem-val-group-number', 'chem-val-period', 'chem-val-all-electrons', 'chem-val-wrong-shell', 'chem-val-core', 'chem-val-ion', 'chem-val-s-missing'],
    generate: valenceTask,
  },
  {
    kind: 'element-aus-valenz',
    part: 'valenz',
    weights: { 2: 0.3, 3: 0.5 },
    errors: ['chem-val-rev-period', 'chem-val-rev-z', 'chem-val-rev-p-only'],
    generate: elementTask,
  },
  {
    kind: 'schale',
    part: 'quantenzahlen',
    weights: { 1: 0.5, 2: 0.3 },
    errors: ['chem-qn-l-to-n', 'chem-qn-l-from-1', 'chem-qn-2n', 'chem-qn-n-squared', 'chem-qn-octet'],
    generate: shellTask,
  },
  {
    kind: 'unterschale',
    part: 'quantenzahlen',
    weights: { 1: 0.5, 2: 0.5, 3: 0.3 },
    errors: ['chem-qn-letter-shift', 'chem-qn-l-is-n', 'chem-qn-m-positive', 'chem-qn-m-beyond-l', 'chem-qn-one-per-orbital', 'chem-qn-subshell-as-shell'],
    generate: subshellTask,
  },
  {
    kind: 'quantenzahlen-erlaubt',
    part: 'quantenzahlen',
    weights: { 2: 0.3, 3: 0.6 },
    errors: ['chem-qn-l-to-n', 'chem-qn-m-beyond-l', 'chem-qn-spin', 'chem-qn-letter-shift', 'chem-qn-m-as-l'],
    generate: allowedTask,
  },
]
