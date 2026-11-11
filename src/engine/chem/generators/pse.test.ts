import { describe, expect, it } from 'vitest'
import { cardById } from '../../explain/cards.ts'
import { createRng } from '../../random/rng.ts'
import { PSE_BANK } from '../bank/pse.ts'
import { elementBySymbol } from '../elements.ts'
import { IONIZATION, jumpAfter, placeOf } from '../pse.ts'
import { ION_ELEMENTS, ieTask, ionTask, reverseTask, steckbriefTask } from './pse.ts'

// Rechnungen „Aufbau des Periodensystems" (S6c): Katalogbeispiele der Rechenfehler, Ionen und Zahlen der Fragen und Karten

type Calc = { substance: string; task: { steps: readonly { id: string; choices: readonly { errorRuleId?: string; content: string; correct: boolean }[] }[] } }
const wrongIn = (calc: Calc | null, step: string, rule: string) => calc?.task.steps.find((s) => s.id === step)?.choices.find((c) => c.errorRuleId === rule)?.content
const rightIn = (calc: Calc, step: string) => calc.task.steps.find((s) => s.id === step)!.choices.find((c) => c.correct)!.content

function findTask<T extends { substance: string }>(make: (i: number) => T | null, substance: string): T {
  for (let i = 0; i < 4000; i++) {
    const calc = make(i)
    if (calc?.substance === substance) return calc
  }
  throw new Error(`keine Aufgabe zu ${substance}`)
}
const ref = (level: 1 | 2 | 3, i: number) => ({ level, seed: 10000 + i })

describe('Rechenfehler Periodensystem: Katalogbeispiele', () => {
  it('Steckbrief: S in der 6. und 2. Periode, als III. Hauptgruppe, P in Gruppe 5, Fe als VIII. und II. Hauptgruppe, Fe und K im falschen Block', () => {
    const s = findTask((i) => steckbriefTask(1, createRng(`s${i}`), ref(1, i)), 'S')
    expect(wrongIn(s, 'periode', 'chem-pse-period-valence')).toBe('$6$')
    expect(wrongIn(s, 'periode', 'chem-pse-period-shells')).toBe('$2$')
    expect(wrongIn(s, 'gruppe', 'chem-pse-group-period')).toBe('III. Hauptgruppe (Gruppe 13)')
    const p = findTask((i) => steckbriefTask(1, createRng(`p${i}`), ref(1, i)), 'P')
    expect(wrongIn(p, 'gruppe', 'chem-pse-group-number-valence')).toBe('Nebengruppe (Gruppe 5)')
    const fe = findTask((i) => steckbriefTask(2, createRng(`f${i}`), ref(2, i), 'chem-pse-transition-main'), 'Fe')
    expect(rightIn(fe, 'gruppe')).toBe('Nebengruppe (Gruppe 8)')
    expect(wrongIn(fe, 'gruppe', 'chem-pse-transition-main')).toBe('VIII. Hauptgruppe (Gruppe 18)')
    expect(wrongIn(fe, 'gruppe', 'chem-pse-transition-s')).toBe('II. Hauptgruppe (Gruppe 2)')
    expect(wrongIn(fe, 'block', 'chem-pse-block-outer-s')).toBe('s-Block')
    const k = findTask((i) => steckbriefTask(2, createRng(`k${i}`), ref(2, i), 'chem-pse-block-period4'), 'K')
    expect(wrongIn(k, 'block', 'chem-pse-block-period4')).toBe('d-Block')
  })

  it('Element aus dem Steckbrief: 3. Periode und 5 Valenzelektronen als In und N, 4. Periode als V', () => {
    const p = findTask((i) => reverseTask(2, createRng(`r${i}`), ref(2, i)), 'P')
    expect(wrongIn(p, 'element', 'chem-pse-rev-swapped')).toContain(String.raw`\ce{In}`)
    expect(wrongIn(p, 'element', 'chem-pse-rev-period-shift')).toContain(String.raw`\ce{N}`)
    const as = findTask((i) => reverseTask(2, createRng(`a${i}`), ref(2, i), 'chem-pse-rev-group-number'), 'As')
    expect(wrongIn(as, 'element', 'chem-pse-rev-group-number')).toContain(String.raw`\ce{V}`)
  })

  it('Ionen: Na nimmt 7 auf, O gibt 6 ab, Na⁻, Al¹³⁺, P⁵⁺, Na⁷⁻, Na⁺ wie Argon, Cl⁻ wie Neon', () => {
    const na = findTask((i) => ionTask(2, createRng(`n${i}`), ref(2, i)), 'Na')
    expect(wrongIn(na, 'weg', 'chem-pse-ion-take')).toBe('Es nimmt 7 Elektronen auf.')
    expect(wrongIn(na, 'ladung', 'chem-pse-charge-sign')).toBe(String.raw`$\ce{Na^-}$`)
    expect(wrongIn(na, 'ladung', 'chem-pse-charge-octet')).toBe(String.raw`$\ce{Na^7-}$`)
    expect(wrongIn(na, 'edelgas', 'chem-pse-noble-own-period')).toBe('Argon')
    const o = findTask((i) => ionTask(2, createRng(`o${i}`), ref(2, i)), 'O')
    expect(wrongIn(o, 'weg', 'chem-pse-ion-give')).toBe('Es gibt 6 Elektronen ab.')
    const al = findTask((i) => ionTask(2, createRng(`l${i}`), ref(2, i), 'chem-pse-charge-group-number'), 'Al')
    expect(wrongIn(al, 'ladung', 'chem-pse-charge-group-number')).toBe(String.raw`$\ce{Al^13+}$`)
    const ph = findTask((i) => ionTask(2, createRng(`h${i}`), ref(2, i)), 'P')
    expect(wrongIn(ph, 'ladung', 'chem-pse-charge-valence')).toBe(String.raw`$\ce{P^5+}$`)
    const cl = findTask((i) => ionTask(2, createRng(`c${i}`), ref(2, i)), 'Cl')
    expect(wrongIn(cl, 'edelgas', 'chem-pse-noble-previous')).toBe('Neon')
    // jedes Ion hat danach so viele Elektronen wie ein Edelgas
    for (const el of ION_ELEMENTS) expect([2, 10, 18, 36, 54], el.symbol).toContain(el.z - el.ions[0])
  })

  it('Ionisierung: Mg mit Sprung I₃/I₄ und III. Hauptgruppe, Al mit Sprung I₁/I₂, Na mit IV. Hauptgruppe', () => {
    const mg = findTask((i) => ieTask(2, createRng(`m${i}`), ref(2, i)), 'Mg')
    expect(wrongIn(mg, 'sprung', 'chem-pse-ie-largest')).toBe(String.raw`$\text{zwischen } I_{3} \text{ und } I_{4}$`)
    expect(wrongIn(mg, 'gruppe', 'chem-pse-ie-count-after')).toBe('III. Hauptgruppe (Gruppe 13)')
    const al = findTask((i) => ieTask(2, createRng(`a${i}`), ref(2, i)), 'Al')
    expect(wrongIn(al, 'sprung', 'chem-pse-ie-first')).toBe(String.raw`$\text{zwischen } I_{1} \text{ und } I_{2}$`)
    const na = findTask((i) => ieTask(2, createRng(`b${i}`), ref(2, i)), 'Na')
    expect(wrongIn(na, 'gruppe', 'chem-pse-ie-count-all')).toBe('IV. Hauptgruppe (Gruppe 14)')
  })
})

describe('Fragen und Karten zum Periodensystem passen zur Engine', () => {
  it('Ionisierungsenergien in Fragen und Karten wie in der Tabelle', () => {
    const text = PSE_BANK.questions.map((q) => q.prompt + q.explanation.detailed).join(' ') + JSON.stringify(cardById('pse-ionisierung'))
    for (const [symbol, values] of Object.entries({ Na: [496, 4562], Mg: [738, 1451, 7733], Al: [578, 1817, 2745, 11577], Ca: [590, 1145, 4912, 6491] }))
      for (const [i, value] of values.entries()) {
        expect(IONIZATION[symbol][i], symbol).toBe(value)
        expect(text, `${symbol} ${value}`).toContain(String(value))
      }
    // Sprünge der Fragen
    expect(jumpAfter(IONIZATION.Ca)).toBe(2)
    expect(jumpAfter(IONIZATION.Al)).toBe(3)
    // Plätze der Fragen
    expect(placeOf(elementBySymbol('Fe')!)).toMatchObject({ period: 4, group: 8, block: 'd' })
    expect(placeOf(elementBySymbol('Rb')!)).toMatchObject({ period: 5, group: 1 })
    expect(placeOf(elementBySymbol('P')!).group).toBe(15)
  })
})

describe('Nur erlaubte Elemente in Aufgaben', () => {
  it('keine Ausnahmen der Besetzung außer Cr und Cu (docs/CHEMIE.md §6)', () => {
    for (let i = 0; i < 400; i++) {
      const calc = steckbriefTask(3, createRng(`x${i}`), ref(3, i))
      expect(['Nb', 'Mo', 'Ru', 'Rh', 'Pd', 'Ag', 'Pt', 'Au']).not.toContain(calc?.substance)
    }
  })
})
