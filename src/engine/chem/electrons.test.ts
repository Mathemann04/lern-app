import { describe, expect, it } from 'vitest'
import { ELEMENTS, elementBySymbol } from './elements.ts'
import {
  AUFBAU,
  MAIN_GROUP,
  atomConfig,
  boxFigureId,
  boxRows,
  configKey,
  configLatex,
  electronCount,
  hundBoxes,
  ionConfig,
  mainGroupOf,
  pairedFirstBoxes,
  parseBoxFigureId,
  unpairedOf,
  valenceConfig,
} from './electrons.ts'

// Elektronenkonfiguration (S6a): Ergebnisse gegen eine zweite, unabhängig eingetragene Liste (Grundzustände
// nach dem NIST-Tabellenwerk, Edelgaskern ausgeschrieben)

const NIST: Readonly<Record<string, string>> = {
  H: '1s1',
  He: '1s2',
  Li: '1s2 2s1',
  C: '1s2 2s2 2p2',
  N: '1s2 2s2 2p3',
  O: '1s2 2s2 2p4',
  Ne: '1s2 2s2 2p6',
  Na: '1s2 2s2 2p6 3s1',
  P: '1s2 2s2 2p6 3s2 3p3',
  Ar: '1s2 2s2 2p6 3s2 3p6',
  K: '1s2 2s2 2p6 3s2 3p6 4s1',
  Sc: '1s2 2s2 2p6 3s2 3p6 3d1 4s2',
  Cr: '1s2 2s2 2p6 3s2 3p6 3d5 4s1',
  Mn: '1s2 2s2 2p6 3s2 3p6 3d5 4s2',
  Fe: '1s2 2s2 2p6 3s2 3p6 3d6 4s2',
  Cu: '1s2 2s2 2p6 3s2 3p6 3d10 4s1',
  Zn: '1s2 2s2 2p6 3s2 3p6 3d10 4s2',
  Ga: '1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p1',
  Se: '1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p4',
  Kr: '1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p6',
  Mo: '1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p6 4d5 5s1',
  Pd: '1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p6 4d10',
  Ag: '1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p6 4d10 5s1',
  Sn: '1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p6 4d10 5s2 5p2',
  Ba: '1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p6 4d10 5s2 5p6 6s2',
  Au: '1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p6 4d10 4f14 5s2 5p6 5d10 6s1',
  Pb: '1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p6 4d10 4f14 5s2 5p6 5d10 6s2 6p2',
}
// Ionen (Lehrbuchwerte)
const IONS: readonly [string, number, string][] = [
  ['Fe', 2, '1s2 2s2 2p6 3s2 3p6 3d6'],
  ['Fe', 3, '1s2 2s2 2p6 3s2 3p6 3d5'],
  ['Cu', 1, '1s2 2s2 2p6 3s2 3p6 3d10'],
  ['Cu', 2, '1s2 2s2 2p6 3s2 3p6 3d9'],
  ['Cr', 3, '1s2 2s2 2p6 3s2 3p6 3d3'],
  ['Zn', 2, '1s2 2s2 2p6 3s2 3p6 3d10'],
  ['Na', 1, '1s2 2s2 2p6'],
  ['O', -2, '1s2 2s2 2p6'],
  ['Cl', -1, '1s2 2s2 2p6 3s2 3p6'],
  ['Sn', 2, '1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p6 4d10 5s2'],
]

const sortKey = (text: string) =>
  text
    .split(' ')
    .sort((a, b) => Number(a[0]) - Number(b[0]) || 'spdf'.indexOf(a[1]) - 'spdf'.indexOf(b[1]))
    .join(' ')

describe('Elektronenkonfiguration', () => {
  it('passt zur zweiten Liste (Atome mit Ausnahmen)', () => {
    for (const [symbol, text] of Object.entries(NIST)) expect(configKey(atomConfig(elementBySymbol(symbol)!.z)), symbol).toBe(sortKey(text))
  })

  it('passt zur zweiten Liste (Ionen: Kationen geben zuerst 4s ab)', () => {
    for (const [symbol, q, text] of IONS) expect(configKey(ionConfig(elementBySymbol(symbol)!.z, q)), `${symbol} ${q}`).toBe(sortKey(text))
  })

  it('hat für jedes Element so viele Elektronen wie Protonen, keine Unterschale überfüllt', () => {
    for (const el of ELEMENTS) {
      const config = atomConfig(el.z)
      expect(electronCount(config), el.symbol).toBe(el.z)
      for (const o of config) expect(o.count, el.symbol).toBeLessThanOrEqual(2 * (2 * o.l + 1))
      for (const q of el.ions) if (el.z - q > 0) expect(electronCount(ionConfig(el.z, q)), `${el.symbol}${q}`).toBe(el.z - q)
    }
  })

  it('schreibt in der Besetzungsreihenfolge, mit Edelgaskern', () => {
    const fe = elementBySymbol('Fe')!.z
    expect(configLatex(atomConfig(fe), true)).toBe(String.raw`[\mathrm{Ar}]\,4\mathrm{s}^{2}\,3\mathrm{d}^{6}`)
    expect(configLatex(atomConfig(8), false)).toBe(String.raw`1\mathrm{s}^{2}\,2\mathrm{s}^{2}\,2\mathrm{p}^{4}`)
    expect(configLatex(ionConfig(fe, 2), true)).toBe(String.raw`[\mathrm{Ar}]\,3\mathrm{d}^{6}`)
    expect(configLatex(ionConfig(11, 1), true)).toBe(String.raw`[\mathrm{He}]\,2\mathrm{s}^{2}\,2\mathrm{p}^{6}`)
    expect(configLatex(atomConfig(24), true)).toBe(String.raw`[\mathrm{Ar}]\,4\mathrm{s}^{1}\,3\mathrm{d}^{5}`)
    expect(configLatex(atomConfig(18), true)).toBe(String.raw`[\mathrm{Ne}]\,3\mathrm{s}^{2}\,3\mathrm{p}^{6}`)
  })

  it('zählt ungepaarte Elektronen nach Hund (Lehrbuchwerte)', () => {
    const unpaired: Readonly<Record<string, number>> = { H: 1, He: 0, C: 2, N: 3, O: 2, F: 1, Ne: 0, Cr: 6, Mn: 5, Fe: 4, Cu: 1, Zn: 0 }
    for (const [symbol, n] of Object.entries(unpaired)) expect(unpairedOf(atomConfig(elementBySymbol(symbol)!.z)), symbol).toBe(n)
    expect(hundBoxes(1, 4)).toEqual(['2', 'u', 'u'])
    expect(pairedFirstBoxes(1, 4)).toEqual(['2', '2', '0'])
    expect(hundBoxes(2, 6)).toEqual(['2', 'u', 'u', 'u', 'u'])
  })

  it('liest die Id des Kästchenbilds zurück', () => {
    const rows = boxRows(atomConfig(26), [
      { n: 4, l: 0 },
      { n: 3, l: 2 },
    ])
    const id = boxFigureId('Ar', rows)
    expect(id).toBe('kaestchen:Ar/4s=2 3d=2uuuu')
    expect(parseBoxFigureId(id)).toEqual({ core: 'Ar', rows })
    expect(parseBoxFigureId('kaestchen:/2p=2u')).toBeNull()
  })

  it('kennt Hauptgruppe, Periode und Valenzkonfiguration', () => {
    const groups: Readonly<Record<string, [number, number]>> = { Li: [1, 2], Mg: [2, 3], Al: [13, 3], S: [16, 3], Ga: [13, 4], Se: [16, 4], Kr: [18, 4], Sn: [14, 5], Cs: [1, 6], Ba: [2, 6], Pb: [14, 6], Bi: [15, 6] }
    for (const [symbol, [group, period]] of Object.entries(groups)) expect(mainGroupOf(elementBySymbol(symbol)!), symbol).toEqual({ group, period })
    for (const symbol of ['Fe', 'Zn', 'Cu', 'Ag', 'Hg', 'Pt', 'Sc']) expect(mainGroupOf(elementBySymbol(symbol)!), symbol).toBeNull()
    expect(configKey(valenceConfig(elementBySymbol('Se')!))).toBe('4s2 4p4')
    expect(MAIN_GROUP.map((el) => el.symbol)).toContain('Bi')
    expect(MAIN_GROUP.map((el) => el.symbol)).not.toContain('He')
  })
})

// Ordnen (N1c): die Unterschalen der Ordnen-Frage folgen der Besetzungsreihenfolge, 4s vor 3d, nur bis 4p (bis Kr)
describe('Ordnen-Frage zur Besetzung', () => {
  it('folgt AUFBAU', async () => {
    const { ELEKTRONEN_BANK } = await import('./bank/elektronen.ts')
    const q = ELEKTRONEN_BANK.questions.find((x) => x.id === 'el-v-ordnen-besetzung')
    if (q?.kind !== 'order') throw new Error('Frage fehlt')
    const ids = q.items.map((i) => i.id)
    const index = (id: string) => AUFBAU.findIndex((s) => `${s.n}${'spdf'[s.l]}` === id)
    expect(ids.map(index)).toEqual([...ids.map(index)].sort((a, b) => a - b))
    expect(ids.map(index).every((i) => i >= 0)).toBe(true)
    expect(ids.indexOf('4s')).toBeLessThan(ids.indexOf('3d'))
    expect(ids.at(-1)).toBe('4p')
  })
})
