import { describe, expect, it } from 'vitest'
import { cardsInTopic } from '../../explain/cards.ts'
import { createRng } from '../../random/rng.ts'
import { ELEKTRONEN_BANK, cfg } from '../bank/elektronen.ts'
import { atomConfig, configKey, configLatex, ionConfig, parseBoxFigureId, unpairedIn } from '../electrons.ts'
import { elementBySymbol } from '../elements.ts'
import { figureById } from '../figures.ts'
import { allowedTask, boxTask, configTask, dFirstConfig, dSkippedConfig, elementTask, ionTask, miscountedConfig, overfilledConfig, shellTask, subshellTask, valenceTask, withInner } from './elektronen.ts'

// Rechnungen „Elektronen" (S6a): Katalogbeispiele der Rechenfehler, Inhalte der Fragen und Karten gegen die Engine

const z = (symbol: string) => elementBySymbol(symbol)!.z
type Calc = { substance: string; task: { steps: readonly { id: string; choices: readonly { errorRuleId?: string; content: string; correct: boolean; figure?: string }[] }[] } }

const wrongIn = (calc: Calc | null, step: string, rule: string) => calc?.task.steps.find((s) => s.id === step)?.choices.find((c) => c.errorRuleId === rule)
const rightIn = (calc: Calc, step: string) => calc.task.steps.find((s) => s.id === step)!.choices.find((c) => c.correct)!

// erste Aufgabe einer Rechenart zu einem Stoff
function findTask<T extends { substance: string }>(make: (i: number) => T | null, substance: string): T {
  for (let i = 0; i < 4000; i++) {
    const calc = make(i)
    if (calc?.substance === substance) return calc
  }
  throw new Error(`keine Aufgabe zu ${substance}`)
}
const ref = (level: 1 | 2 | 3, i: number) => ({ level, seed: 10000 + i })

describe('Rechenfehler Elektronen: Katalogbeispiele', () => {
  it('Konfiguration: K mit 3d¹, Na mit 2p⁷, P mit 3p⁴, Ga ohne 3d, Cr nach der Reihenfolge', () => {
    expect(configLatex(dFirstConfig(z('K')), true)).toBe(String.raw`[\mathrm{Ar}]\,3\mathrm{d}^{1}`)
    expect(configLatex(overfilledConfig(atomConfig(z('Na')))!, false)).toBe(String.raw`1\mathrm{s}^{2}\,2\mathrm{s}^{2}\,2\mathrm{p}^{7}`)
    expect(configLatex(miscountedConfig(atomConfig(z('P'))), true)).toBe(String.raw`[\mathrm{Ne}]\,3\mathrm{s}^{2}\,3\mathrm{p}^{4}`)
    expect(configLatex(dSkippedConfig(atomConfig(z('Ga')))!, true)).toBe(String.raw`[\mathrm{Ar}]\,4\mathrm{s}^{2}\,4\mathrm{p}^{1}`)
    const cr = findTask((i) => configTask(2, createRng(`cr${i}`), ref(2, i), 'chem-el-exception'), 'Cr')
    expect(wrongIn(cr, 'konfiguration', 'chem-el-exception')?.content).toBe(String.raw`$[\mathrm{Ar}]\,4\mathrm{s}^{2}\,3\mathrm{d}^{4}$`)
    expect(rightIn(cr, 'konfiguration').content).toBe(String.raw`$[\mathrm{Ar}]\,4\mathrm{s}^{1}\,3\mathrm{d}^{5}$`)
    const k = findTask((i) => configTask(2, createRng(`k${i}`), ref(2, i), 'chem-el-3d-first'), 'K')
    expect(wrongIn(k, 'konfiguration', 'chem-el-3d-first')?.content).toBe(String.raw`$[\mathrm{Ar}]\,3\mathrm{d}^{1}$`)
  })

  it('Ionen: Fe²⁺ mit 26 Elektronen und [Ar] 4s² 3d⁴, O²⁻ mit 6 Elektronen', () => {
    const fe = findTask((i) => ionTask(3, createRng(`fe${i}`), ref(3, i), 'chem-el-ion-3d'), 'Fe2')
    expect(wrongIn(fe, 'elektronen', 'chem-el-charge-ignored')?.content).toBe('$26$')
    expect(wrongIn(fe, 'konfiguration', 'chem-el-ion-3d')?.content).toBe(String.raw`$[\mathrm{Ar}]\,4\mathrm{s}^{2}\,3\mathrm{d}^{4}$`)
    expect(rightIn(fe, 'konfiguration').content).toBe(String.raw`$[\mathrm{Ar}]\,3\mathrm{d}^{6}$`)
    const o = findTask((i) => ionTask(2, createRng(`o${i}`), ref(2, i)), 'O-2')
    expect(wrongIn(o, 'elektronen', 'chem-el-charge-sign')?.content).toBe('$6$')
    // Kationen mit Edelgaskonfiguration kurz geschrieben, Anionen mit dem Kern des Atoms
    const ca = findTask((i) => ionTask(3, createRng(`ca${i}`), ref(3, i)), 'Ca2')
    expect(rightIn(ca, 'konfiguration').content).toBe(String.raw`$[\mathrm{Ar}]$`)
    expect(rightIn(o, 'konfiguration').content).toBe(String.raw`$[\mathrm{He}]\,2\mathrm{s}^{2}\,2\mathrm{p}^{6}$`)
  })

  it('Kästchen: N mit ↑↓ ↑ und ↑ ↓ ↑, He mit ↑↑', () => {
    const n = findTask((i) => boxTask(1, createRng(`n${i}`), ref(1, i), 'chem-el-hund'), 'N')
    expect(wrongIn(n, 'kaestchen', 'chem-el-hund')?.figure).toBe('kaestchen:/1s=2 2s=2 2p=2u0')
    const n2 = findTask((i) => boxTask(1, createRng(`s${i}`), ref(1, i), 'chem-el-hund-spin'), 'N')
    expect(wrongIn(n2, 'kaestchen', 'chem-el-hund-spin')?.figure).toBe('kaestchen:/1s=2 2s=2 2p=udu')
    const o = findTask((i) => boxTask(1, createRng(`p${i}`), ref(1, i), 'chem-el-pauli'), 'O')
    expect(wrongIn(o, 'kaestchen', 'chem-el-pauli')?.figure).toBe('kaestchen:/1s=2 2s=2 2p=xuu')
    // jede Antwort ist ein Bild, das sich zeichnen lässt
    for (const c of n.task.steps[0].choices) expect(figureById(c.figure!), c.content).toBeDefined()
  })

  it('Ungepaarte Elektronen: O mit 0 (erst gepaart) und 4 (alle der letzten Unterschale)', () => {
    const o = findTask((i) => configTask(1, createRng(`u${i}`), ref(1, i), 'chem-el-unpaired-paired-first'), 'O')
    expect(rightIn(o, 'ungepaart').content).toBe('$2$')
    expect(wrongIn(o, 'ungepaart', 'chem-el-unpaired-paired-first')?.content).toBe('$0$')
    expect(wrongIn(o, 'ungepaart', 'chem-el-unpaired-all')?.content).toBe('$4$')
  })

  it('Valenz: Al mit 13, S mit 3, Se mit 34, S als 4s² 4p⁴, 3s² 3p⁶ und 3p⁶, Se mit 3d¹⁰', () => {
    const al = findTask((i) => valenceTask(1, createRng(`al${i}`), ref(1, i), 'chem-val-group-number'), 'Al')
    expect(wrongIn(al, 'anzahl', 'chem-val-group-number')?.content).toBe('$13$')
    const s = findTask((i) => valenceTask(1, createRng(`s${i}`), ref(1, i), 'chem-val-ion'), 'S')
    expect(wrongIn(s, 'anzahl', 'chem-val-period')?.content).toBe('$3$')
    const se = findTask((i) => valenceTask(2, createRng(`se${i}`), ref(2, i), 'chem-val-all-electrons'), 'Se')
    expect(wrongIn(se, 'anzahl', 'chem-val-all-electrons')?.content).toBe('$34$')
    expect(wrongIn(s, 'valenzkonfiguration', 'chem-val-wrong-shell')?.content).toBe(String.raw`$4\mathrm{s}^{2}\,4\mathrm{p}^{4}$`)
    expect(wrongIn(s, 'valenzkonfiguration', 'chem-val-ion')?.content).toBe(String.raw`$3\mathrm{s}^{2}\,3\mathrm{p}^{6}$`)
    const s2 = findTask((i) => valenceTask(1, createRng(`t${i}`), ref(1, i), 'chem-val-s-missing'), 'S')
    expect(wrongIn(s2, 'valenzkonfiguration', 'chem-val-s-missing')?.content).toBe(String.raw`$3\mathrm{p}^{6}$`)
    expect(configKey(withInner(elementBySymbol('Se')!))).toBe('3d10 4s2 4p4')
  })

  it('Element aus der Valenzkonfiguration: 4s² 4p³ als P, B und Ga', () => {
    const as = findTask((i) => elementTask(3, createRng(`as${i}`), ref(3, i), 'chem-val-rev-p-only'), 'As')
    expect(wrongIn(as, 'element', 'chem-val-rev-period')?.content).toContain(String.raw`\ce{P}`)
    expect(wrongIn(as, 'element', 'chem-val-rev-z')?.content).toContain(String.raw`\ce{B}`)
    expect(wrongIn(as, 'element', 'chem-val-rev-p-only')?.content).toContain(String.raw`\ce{Ga}`)
  })

  it('Quantenzahlen: n = 3 mit l bis 3, ab 1, 6, 9 und 8 Elektronen; 3d mit l = 3, m ab 0, 5 und 18', () => {
    const n3 = findTask((i) => shellTask(1, createRng(`n${i}`), ref(1, i)), 'n3')
    expect(wrongIn(n3, 'l-werte', 'chem-qn-l-to-n')?.content).toBe(String.raw`$l = 0,\ 1,\ 2,\ 3$`)
    expect(wrongIn(n3, 'l-werte', 'chem-qn-l-from-1')?.content).toBe(String.raw`$l = 1,\ 2,\ 3$`)
    expect(wrongIn(n3, 'elektronen', 'chem-qn-2n')?.content).toBe('$6$')
    expect(wrongIn(n3, 'elektronen', 'chem-qn-n-squared')?.content).toBe('$9$')
    expect(wrongIn(n3, 'elektronen', 'chem-qn-octet')?.content).toBe('$8$')
    const d = findTask((i) => subshellTask(2, createRng(`d${i}`), ref(2, i)), '3d')
    expect(wrongIn(d, 'l', 'chem-qn-letter-shift')?.content).toBe('$l = 3$')
    expect(wrongIn(d, 'm', 'chem-qn-m-positive')?.content).toBe(String.raw`$m = 0,\ 1,\ 2$`)
    expect(wrongIn(d, 'plaetze', 'chem-qn-one-per-orbital')?.content).toBe('$5$')
    expect(wrongIn(d, 'plaetze', 'chem-qn-subshell-as-shell')?.content).toBe('$18$')
    const p = findTask((i) => subshellTask(2, createRng(`p${i}`), ref(2, i)), '4p')
    expect(wrongIn(p, 'l', 'chem-qn-l-is-n')?.content).toBe('$l = 4$')
    const p1 = findTask((i) => subshellTask(2, createRng(`q${i}`), ref(2, i)), '3p')
    expect(wrongIn(p1, 'm', 'chem-qn-m-beyond-l')?.content).toBe(String.raw`$m = -2,\ -1,\ 0,\ 1,\ 2$`)
  })

  it('Erlaubte Sätze: genau einer erfüllt alle Regeln, die anderen verletzen je eine', () => {
    const parse = (latex: string) => {
      const m = /n = (\d),\\ l = (\d),\\ m = (-?\d),\\ s = (.+)\$$/.exec(latex)!
      return { n: Number(m[1]), l: Number(m[2]), m: Number(m[3]), s: m[4] }
    }
    const ok = (q: ReturnType<typeof parse>) => q.n >= 1 && q.l >= 0 && q.l < q.n && Math.abs(q.m) <= q.l && /^[+-]\\tfrac\{1\}\{2\}$/.test(q.s)
    for (let i = 0; i < 200; i++) {
      const calc = allowedTask(3, createRng(`e${i}`), ref(3, i))
      if (!calc) continue
      for (const c of calc.task.steps[0].choices) expect(ok(parse(c.content)), c.content).toBe(c.correct)
    }
    const d = findTask((i) => allowedTask(3, createRng(`f${i}`), ref(3, i), 'chem-qn-m-as-l'), '3d0')
    expect(wrongIn(d, 'orbital', 'chem-qn-m-as-l')?.content).toBe(String.raw`$3\mathrm{s}$`)
    expect(wrongIn(d, 'orbital', 'chem-qn-letter-shift')?.content).toBe(String.raw`$3\mathrm{p}$`)
  })
})

describe('Fragen und Karten zu Elektronen passen zur Engine', () => {
  // Konfigurationen in Fragen: richtige Antwort wie die Engine
  const CONFIG_QUESTIONS: Readonly<Record<string, [string, number]>> = {
    'el-g-sauerstoff': ['O', 0],
    'el-v-chrom': ['Cr', 0],
    'el-v-fe2': ['Fe', 2],
    'el-v-kalium': ['K', 0],
    'el-v-schwefel-anion': ['S', -2],
    'el-k-cu2': ['Cu', 2],
    'el-k-palladium': ['Pd', 0],
    'el-k-silber': ['Ag', 0],
  }
  it('richtige Konfigurationen in Fragen', () => {
    for (const [id, [symbol, q]] of Object.entries(CONFIG_QUESTIONS)) {
      const question = ELEKTRONEN_BANK.questions.find((x) => x.id === id)!
      const config = ionConfig(z(symbol), q)
      const expected = [configLatex(config, false), configLatex(config, true)].map((x) => `$${x}$`)
      expect(expected, id).toContain(question.correct.text)
      // falsche Konfigurationen sind nie gleich der richtigen
      for (const option of question.wrong) if (option.text.startsWith('$')) expect(option.text, id).not.toBe(question.correct.text)
    }
    expect(cfg('[Ar] 4s2 3d6')).toBe(String.raw`$[\mathrm{Ar}]\,4\mathrm{s}^{2}\,3\mathrm{d}^{6}$`)
  })

  it('Kästchenbilder der Fragen und Karten passen zur Lösung', () => {
    const unpaired = (id: string) => parseBoxFigureId(id)!.rows.reduce((sum, r) => sum + unpairedIn(r.boxes), 0)
    const byId = (id: string) => ELEKTRONEN_BANK.questions.find((x) => x.id === id)!
    expect(unpaired(byId('el-g-stickstoff').figure!)).toBe(Number(byId('el-g-stickstoff').correct.text))
    expect(unpaired(byId('el-v-eisen-ungepaart').figure!)).toBe(Number(byId('el-v-eisen-ungepaart').correct.text))
    // das richtige Bild von Chrom ist die Engine-Besetzung, die Bilder zu Hund und Pauli sind es nicht
    expect(byId('el-k-bild-chrom').figure).toBe('kaestchen:Ar/4s=u 3d=uuuuu')
    for (const card of cardsInTopic('chem-elektronen')) for (const f of card.figures ?? []) expect(figureById(f), f).toBeDefined()
    // Zahlen der Karten
    expect(configLatex(atomConfig(z('S')), true)).toBe(String.raw`[\mathrm{Ne}]\,3\mathrm{s}^{2}\,3\mathrm{p}^{4}`)
    expect(configLatex(ionConfig(z('Fe'), 3), true)).toBe(String.raw`[\mathrm{Ar}]\,3\mathrm{d}^{5}`)
  })
})
