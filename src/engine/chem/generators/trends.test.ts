import { describe, expect, it } from 'vitest'
import { createRng } from '../../random/rng.ts'
import { elementBySymbol } from '../elements.ts'
import { figureById } from '../figures.ts'
import { EN, FIRST_IE, ISOELECTRONIC, RADIUS, type Property, VALUES, allComparable, ascending, comparable } from '../trends.ts'
import { TRENDS_BANK } from '../bank/trends.ts'
import { compareTask, ionTask, lines, orderTask, pairs } from './trends.ts'

// Trends im Periodensystem (S6d): Messwerte gegen Stichproben einer zweiten Liste, jede erlaubte Reihe gegen die
// Tabelle, Paare aus docs/CHEMIE.md §6 nie gefragt, Katalogbeispiele der Rechenfehler

const el = (s: string) => elementBySymbol(s)!

// zweite, von Hand eingetragene Stichprobe (Cordero 2008, NIST, Pauling)
const SAMPLE: Readonly<Record<Property, Readonly<Record<string, number>>>> = {
  radius: { Li: 128, Na: 166, K: 203, Cl: 102, F: 57, Mg: 141, I: 139, Cs: 244 },
  ie: { Li: 520, Na: 496, K: 419, Cl: 1251, F: 1681, Mg: 738, Al: 578, N: 1402, O: 1314 },
  en: { F: 3.98, Cl: 3.16, Br: 2.96, I: 2.66, Li: 0.98, Cs: 0.79, O: 3.44, N: 3.04 },
}

describe('Messwerte der Trends', () => {
  it('stimmen mit der Stichprobe überein', () => {
    for (const prop of ['radius', 'ie', 'en'] as const) for (const [s, v] of Object.entries(SAMPLE[prop])) expect(VALUES[prop][s], `${prop} ${s}`).toBe(v)
  })

  it('jedes erlaubte Paar folgt der Regel und den Messwerten, nie über die Diagonale', () => {
    for (const prop of ['radius', 'ie', 'en'] as const)
      for (const [a, b] of pairs(prop)) {
        expect(comparable(prop, a, b), `${prop} ${a.symbol}-${b.symbol}`).toBe(true)
        // Regel und Messwerte stimmen überein, Unterschied mindestens 3 %
        const [va, vb] = [VALUES[prop][a.symbol], VALUES[prop][b.symbol]]
        expect(Math.abs(va - vb) / Math.min(va, vb), `${prop} ${a.symbol}-${b.symbol}`).toBeGreaterThanOrEqual(0.03)
      }
  })

  it('fragt die Paare aus docs/CHEMIE.md §6 nie', () => {
    const never: [Property, string, string][] = [
      ['ie', 'Mg', 'Al'], ['ie', 'N', 'O'], ['ie', 'Be', 'B'], ['ie', 'P', 'S'], ['ie', 'Al', 'Ga'], ['ie', 'Sn', 'Pb'], ['ie', 'Pb', 'Bi'], ['ie', 'C', 'Si'],
      ['en', 'K', 'Rb'], ['en', 'K', 'Cs'], ['en', 'Rb', 'Cs'], ['en', 'Ca', 'Sr'], ['en', 'Al', 'Ga'], ['en', 'C', 'Si'], ['en', 'B', 'Al'],
      ['radius', 'As', 'Se'], ['radius', 'Se', 'Br'], ['radius', 'Sn', 'Sb'], ['radius', 'Te', 'I'], ['radius', 'Pb', 'Bi'],
      // Diagonale
      ['radius', 'Na', 'Ca'], ['en', 'Li', 'Mg'],
    ]
    for (const [prop, a, b] of never) expect(comparable(prop, el(a), el(b)), `${prop} ${a}-${b}`).toBe(false)
    // jede Reihe besteht nur aus vergleichbaren Paaren
    for (const prop of ['radius', 'ie', 'en'] as const)
      for (const line of [...lines(prop, 3), ...lines(prop, 4)]) for (const [i, a] of line.entries()) for (const b of line.slice(i + 1)) expect(comparable(prop, a, b)).toBe(true)
  })

  it('erzeugt die Reihen der Übungsblätter nicht (Atomradius Na, Mg, Cl und Li, Na, K; Ionen wie Neon O, F, Na, Mg)', () => {
    const keys = lines('radius', 3).map((line) => line.map((e) => e.symbol).sort().join('-'))
    expect(keys).not.toContain('Cl-Mg-Na')
    expect(keys).not.toContain('K-Li-Na')
    expect(keys).toContain('Al-Na-P')
    for (let i = 0; i < 400; i++) expect(ionTask(3, createRng(`x${i}`), ref(3, i))?.substance).not.toBe('Mg-Na-F-O')
  })

  it('fragt die Richtung in eigenen Worten (nicht wie die Altklausur) und nennt die effektive Kernladung', () => {
    const calc = findTask((i) => compareTask('en', 1, createRng(`r${i}`), ref(1, i)), 'en-F-Li')
    const step = calc.task.steps.find((s) => s.id === 'richtung')! as unknown as { question: string; explanation: { detailed: string } }
    expect(step.question).toBe('Du gehst in einer Periode Feld für Feld nach rechts. Was geschieht mit der Elektronegativität?')
    expect(step.question).not.toMatch(/ändert|verändert/)
    expect(step.explanation.detailed).toMatch(/effektive Kernladung/)
  })

  it('Ionenradien: in jeder Reihe gleich viele Elektronen, mehr Protonen heißt kleiner', () => {
    for (const series of ISOELECTRONIC) {
      const n = new Set(series.ions.map((i) => el(i.symbol).z - i.charge))
      expect(n.size).toBe(1)
      const byZ = [...series.ions].sort((a, b) => el(a.symbol).z - el(b.symbol).z)
      for (let i = 1; i < byZ.length; i++) expect(byZ[i].radius).toBeLessThan(byZ[i - 1].radius)
    }
    expect(RADIUS.Na).toBe(166)
    expect(FIRST_IE.Cs).toBe(376)
    expect(EN.F).toBe(3.98)
  })
})

type Calc = { substance: string; task: { steps: readonly { id: string; choices: readonly { errorRuleId?: string; content: string; correct: boolean }[] }[]; resultFigure?: string } }
const wrongIn = (calc: Calc | null, step: string, rule: string) => calc?.task.steps.find((s) => s.id === step)?.choices.find((c) => c.errorRuleId === rule)?.content
function findTask<T extends { substance: string }>(make: (i: number) => T | null, substance: string): T {
  for (let i = 0; i < 6000; i++) {
    const calc = make(i)
    if (calc?.substance === substance) return calc
  }
  throw new Error(`keine Aufgabe zu ${substance}`)
}
const ref = (level: 1 | 2 | 3, i: number) => ({ level, seed: 10000 + i })

describe('Rechenfehler Trends: Katalogbeispiele', () => {
  it('Vergleich: Cl größer als Na, K kleiner als Na, Na schwerer zu ionisieren als Cl, K schwerer als Na, Li elektronegativer als F, I elektronegativer als Cl', () => {
    const r1 = findTask((i) => compareTask('radius', 1, createRng(`a${i}`), ref(1, i)), 'radius-Cl-Na')
    expect(wrongIn(r1, 'vergleich', 'chem-tr-radius-period')).toContain(String.raw`\ce{Cl}`)
    expect(wrongIn(r1, 'richtung', 'chem-tr-constant')).toBe('Er bleibt etwa gleich.')
    const r2 = findTask((i) => compareTask('radius', 1, createRng(`b${i}`), ref(1, i)), 'radius-K-Na')
    expect(wrongIn(r2, 'vergleich', 'chem-tr-radius-group')).toContain(String.raw`\ce{Na}`)
    const i1 = findTask((i) => compareTask('ie', 1, createRng(`c${i}`), ref(1, i)), 'ie-Cl-Na')
    expect(wrongIn(i1, 'vergleich', 'chem-tr-ie-period')).toContain(String.raw`\ce{Na}`)
    const i2 = findTask((i) => compareTask('ie', 1, createRng(`d${i}`), ref(1, i)), 'ie-K-Na')
    expect(wrongIn(i2, 'vergleich', 'chem-tr-ie-group')).toContain(String.raw`\ce{K}`)
    const e1 = findTask((i) => compareTask('en', 1, createRng(`e${i}`), ref(1, i)), 'en-F-Li')
    expect(wrongIn(e1, 'vergleich', 'chem-tr-en-period')).toContain(String.raw`\ce{Li}`)
    const e2 = findTask((i) => compareTask('en', 1, createRng(`f${i}`), ref(1, i)), 'en-Cl-I')
    expect(wrongIn(e2, 'vergleich', 'chem-tr-en-group')).toContain(String.raw`\ce{I}`)
    expect(figureById(e2.task.resultFigure!)).toBeDefined()
  })

  it('Ordnen: Mg < Na < K als Fehler der Mitte, Ionen falsch herum und mit vertauschter Mitte', () => {
    const o = findTask((i) => orderTask('radius', 2, createRng(`o${i}`), ref(2, i)), 'radius-Na-K-Rb')
    expect(wrongIn(o, 'ordnung', 'chem-tr-order-middle')).toBe(String.raw`$\ce{K} < \ce{Na} < \ce{Rb}$`)
    expect(wrongIn(o, 'ordnung', 'chem-tr-radius-group')).toBe(String.raw`$\ce{Rb} < \ce{K} < \ce{Na}$`)
    const ion = findTask((i) => ionTask(2, createRng(`i${i}`), ref(2, i)), 'Mg-Na-F')
    expect(wrongIn(ion, 'ordnung', 'chem-tr-ion-reversed')).toBe(String.raw`$\ce{F^-} < \ce{Na^+} < \ce{Mg^2+}$`)
    expect(wrongIn(ion, 'regel', 'chem-tr-ion-same')).toMatch(/gleich groß/)
  })

  it('Bilder der Trends mit Pfeilen in Richtung der Zunahme', () => {
    const radius = figureById('pse-trend:radius:Na,Cl')!
    expect(radius.kind).toBe('pse')
    if (radius.kind === 'pse') {
      expect(radius.arrows).toMatchObject({ period: -1, group: 1 })
      expect(radius.marks).toEqual(['Na', 'Cl'])
    }
    const en = figureById('pse-trend:en')!
    if (en.kind === 'pse') expect(en.arrows).toMatchObject({ period: 1, group: -1 })
    expect(figureById('pse-trend:xyz')).toBeUndefined()
    expect(figureById('pse-trend:en:Fe')).toBeUndefined()
  })
})

// Ordnen (N1c): Fragen der Sammlung, deren Glieder Elementsymbole sind, folgen der Tabelle, und je zwei sind nach den
// Regeln vergleichbar (CHEMIE.md §6)
describe('Ordnen-Fragen zum Atomradius', () => {
  it('folgen den Messwerten und sind alle vergleichbar', () => {
    for (const q of TRENDS_BANK.questions) {
      if (q.kind !== 'order' || !q.fact.startsWith('order-radius')) continue
      const els = q.items.map((i) => elementBySymbol(i.id)!)
      expect(allComparable('radius', els), q.id).toBe(true)
      expect(els.map((e) => e.symbol), q.id).toEqual(ascending('radius', els).reverse().map((e) => e.symbol))
    }
  })
})

describe('Ordnen-Fragen zu Elektronegativität und Ionenradien', () => {
  it('folgen den Messwerten, mit genug Abstand und vergleichbar', () => {
    for (const q of TRENDS_BANK.questions) {
      if (q.kind !== 'order') continue
      if (q.fact.startsWith('order-en')) {
        const els = q.items.map((i) => elementBySymbol(i.id)!)
        expect(allComparable('en', els), q.id).toBe(true)
        expect(els.map((e) => e.symbol), q.id).toEqual(ascending('en', els).reverse().map((e) => e.symbol))
      }
      if (q.fact.startsWith('order-iso')) {
        const series = ISOELECTRONIC.find((s) => q.fact.endsWith(`-${s.like.toLowerCase()}`))!
        const radius = (id: string) => series.ions.find((i) => `${i.symbol}${i.charge > 0 ? '+' : '-'}${Math.abs(i.charge)}` === id)!.radius
        const radii = q.items.map((i) => radius(i.id))
        for (let k = 1; k < radii.length; k++) expect(radii[k - 1] / radii[k], q.id).toBeGreaterThanOrEqual(1.03)
      }
    }
  })
})
