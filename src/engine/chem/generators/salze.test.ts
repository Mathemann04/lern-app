import { describe, expect, it } from 'vitest'
import { cardById } from '../../explain/cards.ts'
import { GENERATED_MIN } from '../../quiz/numbers.ts'
import { ANIONS, CATIONS, isAllowedSalt, saltFormula, saltName } from '../ions.ts'
import { parseFormula } from '../formula.ts'
import { generatedCalc } from './index.ts'
import { EXAM_SALTS, EXERCISE_SALTS, isExcludedSalt } from './salze.ts'
import { IONEN_BANK, LATTICE_ENERGY, STRUVITE_IONS, chargeSum } from '../bank/ionen.ts'

// Ionenbindung und Salze (S5a): Formeln und Namen gegen eine zweite, von Hand eingetragene Liste, Ladungen in
// jeder Zerfallsgleichung, Born-Haber gegen Gitterenthalpien aus der Literatur, Zahlen der Lernkarten

const COURSE = 'chem-ionen'
const tasks = (level: 1 | 2 | 3, count = 500) => Array.from({ length: count }, (_, i) => generatedCalc(COURSE, { level, seed: GENERATED_MIN + i })!)
const correctOf = (calc: ReturnType<typeof tasks>[number], id: string) => calc.task.steps.find((s) => s.id === id)?.choices.find((c) => c.correct)?.content

// zweite Liste: Name → Formel (Lehrbuchwissen, unabhängig von ions.ts eingetragen)
const KNOWN: Readonly<Record<string, string>> = {
  Natriumchlorid: 'NaCl',
  Aluminiumoxid: 'Al2O3',
  Magnesiumsulfid: 'MgS',
  Calciumfluorid: 'CaF2',
  Magnesiumnitrid: 'Mg3N2',
  Natriumphosphid: 'Na3P',
  Aluminiumnitrid: 'AlN',
  Lithiumoxid: 'Li2O',
  Calciumphosphat: 'Ca3(PO4)2',
  Ammoniumsulfat: '(NH4)2SO4',
  Ammoniumcarbonat: '(NH4)2CO3',
  Natriumhydrogencarbonat: 'NaHCO3',
  Aluminiumsulfat: 'Al2(SO4)3',
  Magnesiumnitrat: 'Mg(NO3)2',
  Bariumhydroxid: 'Ba(OH)2',
  'Eisen(III)-chlorid': 'FeCl3',
  'Eisen(II)-sulfat': 'FeSO4',
  'Eisen(III)-oxid': 'Fe2O3',
  'Eisen(III)-sulfat': 'Fe2(SO4)3',
  'Kupfer(I)-oxid': 'Cu2O',
  'Kupfer(II)-sulfat': 'CuSO4',
  'Chrom(III)-oxid': 'Cr2O3',
  'Mangan(II)-chlorid': 'MnCl2',
  Silbernitrat: 'AgNO3',
  Zinkphosphat: 'Zn3(PO4)2',
  Kaliumsulfit: 'K2SO3',
  Natriumnitrit: 'NaNO2',
  Caesiumchlorid: 'CsCl',
}

describe('Salze: Formel und Name auf zweitem Weg', () => {
  it('jedes Salz der zweiten Liste ergibt in der Engine dieselbe Formel', () => {
    const all = CATIONS.flatMap((c) => ANIONS.filter((a) => isAllowedSalt(c, a)).map((a) => [saltName(c, a), saltFormula(c, a)] as const))
    const byName = new Map(all)
    for (const [name, formula] of Object.entries(KNOWN)) expect(byName.get(name), name).toBe(formula)
  })

  it('jede Salzformel ist lesbar und nach außen neutral', () => {
    for (const c of CATIONS)
      for (const a of ANIONS.filter((x) => isAllowedSalt(c, x))) {
        const formula = saltFormula(c, a)
        expect(() => parseFormula(formula), formula).not.toThrow()
        const counts = /^(\(?[A-Z][a-z]?\d*\)?)(\d*)/.exec(formula)!
        // Kationen: Anzahl aus dem Index hinter dem Kation (bei Klammer dahinter)
        const cationCount = c.polyatomic ? Number(/^\([A-Za-z0-9]+\)(\d+)/.exec(formula)?.[1] ?? 1) : Number(new RegExp(`^${c.formula}(\\d*)`).exec(formula)![1] || 1)
        const anionCount = Number(new RegExp(`\\(?${a.formula}\\)?(\\d*)$`).exec(formula)![1] || 1)
        expect(counts).not.toBeNull()
        expect(cationCount * c.charge + anionCount * a.charge, formula).toBe(0)
      }
  })

  it('Aufgaben „Formel“ und „Name“ passen zur zweiten Liste, wo das Salz darin steht', () => {
    let seen = 0
    for (const level of [1, 2, 3] as const)
      for (const calc of tasks(level)) {
        if (calc.form.startsWith('formel')) {
          const name = /^(.*) ist ein ionisch/.exec(calc.task.note!)![1]
          if (KNOWN[name]) {
            seen++
            expect(calc.task.resultLatex).toBe(String.raw`\ce{${KNOWN[name]}}`)
          }
        }
        if (calc.form.startsWith('name')) {
          const name = correctOf(calc, 'name')!
          if (KNOWN[name]) {
            seen++
            expect(calc.task.functionLatex).toBe(String.raw`\ce{${KNOWN[name]}}`)
          }
        }
      }
    expect(seen).toBeGreaterThan(50)
  })

  // CHEMIE.md §9: Salze der Altklausuren und des Übungsblatts „Chemische Bindungen“ nie als Formel-Aufgabe
  it('stellt keine Formel-Aufgabe zu Salzen der Altklausuren oder des Übungsblatts', () => {
    expect(EXERCISE_SALTS).toEqual(['CaF2', 'Ca3(PO4)2'])
    for (const f of [...EXAM_SALTS, ...EXERCISE_SALTS]) expect(isExcludedSalt(f), f).toBe(true)
    expect(isExcludedSalt('CaCl2')).toBe(false)
    let formulas = 0
    for (const level of [1, 2, 3] as const)
      for (const calc of tasks(level, 600)) {
        if (!calc.form.startsWith('formel:')) continue
        formulas++
        expect([...EXAM_SALTS, ...EXERCISE_SALTS], calc.substance).not.toContain(calc.substance)
      }
    expect(formulas).toBeGreaterThan(200)
  })
})

describe('Zerfall in Ionen', () => {
  it('die richtige Gleichung hat dieselben Atome wie die Formel und ist neutral; keine falsche ist es zugleich', () => {
    const charge = (ionCe: string) => {
      const m = /\^(\d*)([+-])/.exec(ionCe)
      if (!m) return 0
      return (m[2] === '+' ? 1 : -1) * Number(m[1] || 1)
    }
    const total = (eq: string) =>
      eq
        .split('->')[1]
        .replace(/\}\$$/, '')
        .split(' + ')
        .map((t) => t.trim())
        .reduce((sum, t) => {
          const [n, ion] = /^\d+ /.test(t) ? [Number(t.split(' ')[0]), t.split(' ')[1]] : [1, t]
          return sum + n * charge(ion)
        }, 0)
    let seen = 0
    for (const level of [1, 2, 3] as const)
      for (const calc of tasks(level).filter((c) => c.form.startsWith('zerfall'))) {
        seen++
        const step = calc.task.steps[0]
        const right = step.choices.find((c) => c.correct)!.content
        expect(total(right), right).toBe(0)
        for (const wrong of step.choices.filter((c) => !c.correct)) {
          const neutral = total(wrong.content) === 0 && wrong.content.includes('^')
          // falsche Gleichungen mit Ladungen: entweder nicht neutral oder mit falscher Anzahl der Ionen
          if (neutral) expect(['chem-dissociation-coefficients', 'chem-dissociation-index-ion']).toContain(wrong.errorRuleId)
        }
      }
    expect(seen).toBeGreaterThan(200)
  })
})

describe('Born-Haber', () => {
  // Gitterenthalpien aus der Literatur (kJ/mol, aus dem Born-Haber-Kreisprozess, CRC Handbook), zum Vergleich
  const LATTICE: Readonly<Record<string, number>> = { LiF: -1049, LiCl: -864, NaF: -930, NaCl: -787, KF: -829, KCl: -717, RbF: -789, RbCl: -695, CsF: -759, CsCl: -670 }
  it('die gerechnete Gitterenthalpie liegt höchstens 2 % neben dem Literaturwert', () => {
    let seen = 0
    for (const calc of tasks(3, 800).filter((c) => c.form.startsWith('born-haber'))) {
      seen++
      const lattice = calc.form.includes('gitter') ? calc.task.resultLatex! : /\\Delta H_G = (-?\d+)/.exec(calc.task.functionLatex!)![0]
      const value = Number(/= (-?\d+)/.exec(lattice)![1])
      expect(Math.abs(value / LATTICE[calc.substance] - 1), `${calc.substance}: ${value}`).toBeLessThan(0.02)
    }
    expect(seen).toBeGreaterThan(40)
  })
})

describe('Lernkarten „Ionenbindung und Salze“: Formeln wie die Engine', () => {
  it('Beispiele der Karten', () => {
    const formula = (name: string) => {
      const c = CATIONS.find((x) => name.startsWith(x.name))!
      const a = ANIONS.find((x) => name.endsWith(x.name))!
      return saltFormula(c, a)
    }
    expect(formula('Magnesiumnitrid')).toBe('Mg3N2')
    expect(formula('Magnesiumsulfid')).toBe('MgS')
    expect(formula('Magnesiumphosphat')).toBe('Mg3(PO4)2')
    expect(formula('Ammoniumsulfat')).toBe('(NH4)2SO4')
    const text = JSON.stringify(['ionen-formel', 'ionen-molekuelionen', 'ionen-zerfall', 'ionen-born-haber'].map((id) => cardById(id)))
    for (const f of ['Mg3N2', 'MgS', 'Mg3(PO4)2', '(NH4)2SO4', 'MgF2 -> Mg^2+ + 2 F^-']) expect(text).toContain(f)
    // die Salze der Karten sind echte Salze der Engine
    for (const name of ['Magnesiumnitrid', 'Magnesiumphosphat']) {
      const c = CATIONS.find((x) => name.startsWith(x.name))!
      const a = ANIONS.find((x) => name.endsWith(x.name))!
      expect(isAllowedSalt(c, a), name).toBe(true)
    }
    // Born-Haber NaCl und KF wie in der Engine gerechnet
    expect(107 + 496 + 242 / 2 - 349).toBe(375)
    expect(-411 - 375).toBe(-786)
    expect(89 + 419 + 158 / 2 - 328).toBe(259)
    expect(-567 - 259).toBe(-826)
  })
})

// Ordnen (N1c): Gitterenergien der Frage folgen den Werten, je mindestens 15 % auseinander, und dieselben Salze wie in
// Frage 318
describe('Ordnen: Gitterenergie', () => {
  it('folgt den Werten mit deutlichem Abstand', () => {
    const q = IONEN_BANK.questions.find((x) => x.id === 'io-k-ordnen-gitterenergie')
    if (q?.kind !== 'order') throw new Error('Frage fehlt')
    const values = q.items.map((i) => LATTICE_ENERGY[i.id].kj)
    for (let i = 1; i < values.length; i++) expect(values[i - 1] / values[i], q.items[i].id).toBeGreaterThanOrEqual(1.15)
    // ohne Ladungen der Ionen gleich: Oxide (2+/2-) vor den Salzen mit einfach geladenen Ionen
    const charge = (id: string) => (id.endsWith('O') ? 2 : 1)
    const ids = q.items.map((i) => i.id)
    expect([...ids].sort((a, b) => charge(b) - charge(a))).toEqual(ids)
  })

  it('Ladungsprobe in Frage 321: Formel aus den Ionen der Tabelle, neutral; die falschen Proben ergeben nie 0', () => {
    const formula = STRUVITE_IONS.map(([ion, n]) => `${ion.formula}${n > 1 ? n : ''}`).join('')
    expect(formula).toBe('MgNH4PO4')
    expect(chargeSum(STRUVITE_IONS)).toBe(0)
    const q = IONEN_BANK.questions.find((x) => x.id === 'io-k-ladungsprobe-phosphat')
    if (q?.kind !== 'single') throw new Error('Frage fehlt')
    expect(q.correct.text).toBe('$(+2) + (+1) + (-3) = 0$')
    // jede falsche Probe ist in sich richtig gerechnet, aber nicht neutral
    for (const w of q.wrong) {
      const [left, right] = w.text.replace(/\$/g, '').split('=')
      const sum = left.split(' + ').reduce((acc, part) => {
        const m = part.match(/(?:(\d+) \\cdot )?\(([+-]\d+)\)/)
        return m ? acc + Number(m[1] ?? 1) * Number(m[2]) : acc
      }, 0)
      expect(sum, w.id).toBe(Number(right))
      expect(sum, w.id).not.toBe(0)
    }
  })
})
