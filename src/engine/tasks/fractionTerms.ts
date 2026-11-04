import { reduceFrac } from '../fraction/factor.ts'
import type { Frac } from '../fraction/frac.ts'
import {
  type Poly,
  atomsOf,
  polyAdd,
  polyAtom,
  polyConst,
  polyMul,
  polyScale,
  totalDegree,
} from '../fraction/poly.ts'
import {
  type BlockRule,
  type FractionShape,
  type FractionTask,
  type Part,
  type Signed,
  binomialShown,
  expanded,
  minus,
  part,
  plus,
  taskFrac,
} from '../fraction/task.ts'
import { type Rng, createRng } from '../random/rng.ts'
import { LEVEL1_KIT, bigReduce, buildFromKit, buildLevel3, buildLevel4, level2Kit as level2Kit_, monomialReduce } from './fractionKit.ts'
import { rat } from '../rational.ts'
import type { Level, TaskRef } from './taskNumber.ts'

// Vorlagen für Bruchaufgaben je Stufe (siehe docs/PLAN-M2.md, „Stufen"). Jede Vorlage baut aus
// Zufallszahlen eine Aufgabe; Lösung und Rechenweg berechnet die Bruch-Engine.

export type FractionTemplate = {
  readonly id: string
  readonly level: Level
  readonly label: string
  build(rng: Rng): FractionTask
}

export type GeneratedFractionTask = {
  readonly ref: TaskRef
  readonly template: FractionTemplate
  readonly task: FractionTask
}

// --- kleine Bausteine ---

const c = (n: number) => polyConst(n)
// a·t + b
const lin = (a: number, b: number, atom = 'x'): Poly => polyAdd(polyScale(polyAtom(atom), rat(a)), c(b))
// k · Atome mit Hochzahlen, z. B. mono(6, ['x', 2], ['y', 1]) = 6x²y
const mono = (k: number, ...atoms: Array<readonly [string, number]>): Poly =>
  atoms.reduce((p, [atom, e]) => (e > 0 ? polyMul(p, polyAtom(atom, e)) : p), c(k))

const numberPart = (n: number, d = 1): Part => part(expanded(c(n)), expanded(c(d)))
const polyPart = (n: Poly, d: Poly = c(1)): Part => part(expanded(n), expanded(d))

const signed = (sign: 1 | -1, p: Part): Signed => (sign > 0 ? plus(p) : minus(p))
const anySign = (rng: Rng): 1 | -1 => (rng.chance(0.5) ? 1 : -1)
const nonZero = (rng: Rng, max: number) => (rng.chance(0.5) ? 1 : -1) * rng.int(1, max)

const shape = (s: FractionShape, hints: readonly Poly[] = [], rule?: BlockRule): FractionTask => ({ ...s, hints, ...(rule ? { rule } : {}) }) as FractionTask

// --- Stufen 1 und 2: Baukasten (M2b, tasks/fractionKit.ts) ---

const level1Kit: FractionTemplate = {
  id: 'baukasten-zahlen',
  level: 1,
  label: 'Baukasten: bis zu vier Zahlenbrüche, Punkt vor Strich, Klammern, Dezimalzahlen',
  build: (rng) => (rng.chance(0.025) ? bigReduce(rng) : buildFromKit(rng, LEVEL1_KIT, 1)),
}

const level2Kit: FractionTemplate = {
  id: 'baukasten-buchstaben',
  level: 2,
  label: 'Baukasten: Brüche mit Buchstaben in Produkten',
  build: (rng) => (rng.chance(0.06) ? monomialReduce(rng) : buildFromKit(rng, level2Kit_(rng), 2)),
}

const LETTER_PAIRS = [
  ['x', 'y'],
  ['a', 'b'],
] as const

// --- Stufen 3 und 4: Baukasten mit Summen (M2b, tasks/fractionKit.ts) ---

const level3Kit: FractionTemplate = {
  id: 'baukasten-summen',
  level: 3,
  label: 'Baukasten: Summen in Zähler und Nenner, ausklammern, binomische Formeln, vertauschte Differenzen',
  build: buildLevel3,
}

const level4Kit: FractionTemplate = {
  id: 'baukasten-zerlegen',
  level: 4,
  label: 'Baukasten: zerlegen (Zahl vorn, zwei Buchstaben, in Gruppen), drei Nenner, Doppelbrüche, Bausteine',
  build: buildLevel4,
}

// --- Stufe 5: Profi ---

const level5TwoLetters: FractionTemplate = {
  id: 'zwei-variablen',
  level: 5,
  label: 'Zwei Variablen wie beim Differenzenquotienten',
  build(rng) {
    const h = polyAtom('h')
    const xh = polyAdd(polyAtom('x'), h)
    const variant = rng.int(1, 3)
    if (variant === 1) {
      // \frac{\frac{1}{x + h} - \frac{1}{x}}{h}
      const k = rng.int(1, 5)
      return shape({ kind: 'complex', top: [plus(polyPart(c(k), xh)), minus(polyPart(c(k), polyAtom('x')))], bottom: [plus(polyPart(h))] }, [xh])
    }
    if (variant === 2) {
      // \frac{\frac{x}{x + h} - 1}{h} bzw. \frac{1 - \frac{x}{x + h}}{h}
      const k = rng.int(1, 3)
      const fraction = polyPart(polyScale(polyAtom('x'), rat(k)), xh)
      const top = rng.chance(0.5) ? [plus(fraction), minus(numberPart(k))] : [plus(numberPart(k)), minus(fraction)]
      return shape({ kind: 'complex', top, bottom: [plus(polyPart(h))] }, [xh])
    }
    // \frac{(x + h)^2 - x^2}{h} bzw. mit a und b
    const [s, t] = rng.pick([
      ['x', 'h'],
      ['a', 'b'],
    ] as const)
    // (x + 2h)² − x² geteilt durch h (mit Minus in der Klammer würde die Zerlegung unhandlich)
    const k = rng.int(1, 3)
    const base = polyAdd(polyAtom(s), polyScale(polyAtom(t), rat(k)))
    return shape({ kind: 'reduce', part: part(binomialShown(base, polyAtom(s, 2)), expanded(polyAtom(t))) })
  },
}

const level5Mixed: FractionTemplate = {
  id: 'mehrere-rechenarten',
  level: 5,
  label: 'Mehrere Rechenarten in einer Aufgabe',
  build(rng) {
    const p = rng.int(1, 5)
    const [plusP, minusP] = [lin(1, p), lin(1, -p)]
    const square = polyMul(plusP, minusP)
    const k = rng.int(1, 3)
    switch (rng.int(1, 3)) {
      case 1:
        // \left(1 + \frac{2}{x - 2}\right) \cdot \frac{x^2 - 4}{3x}
        return shape(
          { kind: 'mixed', op: 'mul', left: [plus(numberPart(1)), plus(polyPart(c(p), minusP))], right: [plus(polyPart(square, mono(k, ['x', 1])))] },
          [plusP, minusP],
        )
      case 2: {
        // \left(\frac{a}{b} - \frac{b}{a}\right) : \frac{a - b}{ab}
        const [s, t] = rng.pick(LETTER_PAIRS)
        const [u, v] = [polyAtom(s), polyAtom(t)]
        const diff = polyAdd(u, polyScale(v, rat(-1)))
        return shape(
          { kind: 'mixed', op: 'div', left: [plus(polyPart(u, v)), minus(polyPart(v, u))], right: [plus(polyPart(diff, polyMul(u, v)))] },
          [diff, polyAdd(u, v)],
        )
      }
      default:
        // \left(1 - \frac{3}{x}\right) : \frac{x^2 - 9}{2x^2}
        return shape(
          { kind: 'mixed', op: 'div', left: [plus(numberPart(1)), minus(polyPart(c(p), polyAtom('x')))], right: [plus(polyPart(square, mono(k, ['x', 2])))] },
          [plusP, minusP],
        )
    }
  },
}

const level5Nested: FractionTemplate = {
  id: 'verschachtelt',
  level: 5,
  label: 'Verschachtelte Doppelbrüche',
  build(rng) {
    const p = rng.int(1, 4)
    const one = numberPart(1)
    const hints = [lin(1, p), lin(2, p)]
    const inner = { side: 'bottom', sign: 1, top: [plus(one)], bottom: [plus(one), plus(polyPart(c(p), polyAtom('x')))] } as const
    switch (rng.int(1, 3)) {
      case 1:
        // \frac{1}{1 + \frac{1}{1 + \frac{2}{x}}}
        return shape({ kind: 'nested', top: [plus(numberPart(rng.int(1, 3)))], bottom: [plus(one)], inner }, hints)
      case 2:
        // \frac{x}{1 - \frac{1}{1 + \frac{2}{x}}}
        return shape({ kind: 'nested', top: [plus(polyPart(polyAtom('x')))], bottom: [plus(one)], inner: { ...inner, sign: -1 } }, hints)
      default:
        // \frac{2}{x - \frac{x}{1 + \frac{2}{x}}}
        return shape(
          { kind: 'nested', top: [plus(numberPart(p))], bottom: [plus(polyPart(polyAtom('x')))], inner: { ...inner, sign: -1, top: [plus(polyPart(polyAtom('x')))] } },
          hints,
        )
    }
  },
}

const R = polyAtom('R')

const level5Roots: FractionTemplate = {
  id: 'wurzeln',
  level: 5,
  label: 'Wurzeln: $(\\sqrt{x})^2 = x$',
  build(rng) {
    const a = rng.int(1, 5)
    const [plusA, minusA] = [lin(1, a, 'R'), lin(1, -a, 'R')]
    const hints = [plusA, minusA]
    // x − a² (mit x = (√x)²)
    const difference = polyMul(plusA, minusA)
    switch (rng.int(1, 4)) {
      case 1:
        // \frac{x - 9}{\sqrt{x} - 3}
        return shape({ kind: 'reduce', part: polyPart(difference, rng.chance(0.5) ? minusA : plusA) }, hints)
      case 2:
        // \frac{\sqrt{x} + 3}{x - 9}
        return shape({ kind: 'reduce', part: polyPart(rng.chance(0.5) ? minusA : plusA, difference) }, hints)
      case 3:
        // \frac{(\sqrt{x} + 3)^2 - 9}{\sqrt{x}}
        return shape({ kind: 'reduce', part: part(binomialShown(rng.chance(0.5) ? plusA : minusA, c(a * a)), expanded(R)) }, hints)
      default:
        // \frac{1}{\sqrt{x} - 3} + \frac{1}{\sqrt{x} + 3}: Nenner (\sqrt{x} - 3)(\sqrt{x} + 3) = x - 9
        return shape({ kind: 'sum', terms: [plus(polyPart(c(1), minusA)), signed(anySign(rng), polyPart(c(1), plusA))] }, hints, { kind: 'root' })
    }
  },
}

// 1 − sin x, 1 + sin x (mit der 1 vorn geschrieben)
const unitLinear = (b: string, sign: 1 | -1): Poly => polyAdd(c(1), polyScale(polyAtom(b), rat(sign)))

const level5Trig: FractionTemplate = {
  id: 'winkelfunktionen',
  level: 5,
  label: 'Winkelfunktionen: $\\sin^2 x + \\cos^2 x = 1$',
  build(rng) {
    const b = rng.pick(['S', 'C'] as const)
    const other = b === 'S' ? 'C' : 'S'
    const B = polyAtom(b)
    const O = polyAtom(other)
    const hints = [unitLinear(b, 1), unitLinear(b, -1)]
    switch (rng.int(1, 5)) {
      case 1: {
        // \frac{1}{1 - \sin x} + \frac{1}{1 + \sin x} = \frac{2}{\cos^2 x}
        const k = rng.int(1, 3)
        return shape(
          { kind: 'sum', terms: [plus(part(expanded(c(k)), expanded(unitLinear(b, -1), true))), signed(anySign(rng), part(expanded(c(k)), expanded(unitLinear(b, 1), true)))] },
          hints,
          { kind: 'trig', prefer: other, target: 'den' },
        )
      }
      case 2:
        // \frac{\sin x}{\cos x} + \frac{\cos x}{\sin x} = \frac{1}{\sin x \cos x}
        return shape({ kind: 'sum', terms: [plus(polyPart(B, O)), plus(polyPart(O, B))] }, [], { kind: 'trig', prefer: 'S', target: 'num' })
      case 3:
        // \frac{1}{\cos^2 x} - 1 = \tan^2 x
        return shape({ kind: 'sum', terms: [plus(polyPart(c(1), polyAtom(b, 2))), minus(numberPart(1))] }, [], { kind: 'trig', prefer: other, target: 'num' })
      case 4:
        // \frac{\frac{1}{\cos x} - \cos x}{\sin x} = \tan x
        return shape({ kind: 'complex', top: [plus(polyPart(c(1), B)), minus(polyPart(B))], bottom: [plus(polyPart(O))] }, [], { kind: 'trig', prefer: other, target: 'num' })
      default:
        if (rng.chance(0.5)) {
          // \frac{\sin^2 x}{1 - \cos x} = 1 + \cos x
          return shape({ kind: 'reduce', part: part(expanded(polyAtom(other, 2)), expanded(unitLinear(b, anySign(rng)), true)) }, hints, { kind: 'trig', prefer: b, target: 'num' })
        }
        // \frac{1 - \cos^2 x}{\sin x} = \sin x bzw. \frac{1 - \cos^2 x}{\sin x \cos x} = \tan x
        return shape(
          { kind: 'reduce', part: part(expanded(polyAdd(c(1), polyScale(polyAtom(b, 2), rat(-1))), true), expanded(rng.chance(0.5) ? O : polyMul(O, B))) },
          [],
          { kind: 'trig', prefer: other, target: 'num' },
        )
    }
  },
}

const level5Exp: FractionTemplate = {
  id: 'e-funktion',
  level: 5,
  label: 'e-Funktion: $\\frac{e^{2x}}{e^x} = e^x$',
  build(rng) {
    const k = nonZero(rng, 5)
    const E = polyAtom('E')
    // \frac{e^{2x} - 3e^x}{e^x} bzw. \frac{e^{3x} + 2e^{2x}}{2e^x}
    if (rng.chance(0.5)) return shape({ kind: 'reduce', part: polyPart(polyAdd(polyAtom('E', 2), polyScale(E, rat(k))), E) })
    const m = rng.int(2, 3)
    return shape({ kind: 'reduce', part: polyPart(polyAdd(polyAtom('E', 3), polyScale(polyAtom('E', 2), rat(k))), polyScale(E, rat(m))) })
  },
}

export const FRACTION_TEMPLATES: readonly FractionTemplate[] = [
  level1Kit,
  level2Kit,
  level3Kit,
  level4Kit,
  level5TwoLetters,
  level5Mixed,
  level5Nested,
  level5Roots,
  level5Trig,
  level5Exp,
]

export function fractionTemplatesForLevel(level: Level): FractionTemplate[] {
  return FRACTION_TEMPLATES.filter((t) => t.level === level)
}

// Eine Aufgabe ist brauchbar, wenn ihr Ergebnis nicht 0 ist, ab Stufe 2 noch einen Buchstaben
// enthält und die Zahlen klein bleiben
function isGood(task: FractionTask, level: Level): boolean {
  let value: Frac
  try {
    value = taskFrac(task)
  } catch {
    return false
  }
  if (value.num.length === 0) return false
  const reduced = reduceFrac(value, task.hints)
  if (level >= 2 && atomsOf(reduced.num).length === 0 && reduced.den.factors.length === 0) return false
  const big = [...reduced.num, ...reduced.den.factors.flatMap((f) => f.poly)].some((t) => Math.abs(Number(t.coef.n)) > 200)
  return !big && Number(reduced.den.coef.n) <= 200 && totalDegree(reduced.num) <= 4
}

export const isFractionLevelAvailable = (level: Level) => fractionTemplatesForLevel(level).length > 0

// Erzeugt die Aufgabe zu einer Aufgaben-Nummer. Gleiche Nummer → gleiche Aufgabe.
export function generateFractionTask(ref: TaskRef): GeneratedFractionTask {
  const rng = createRng(`brueche:${ref.level}:${ref.seed}`)
  const templates = fractionTemplatesForLevel(ref.level)
  if (templates.length === 0) throw new Error(`Für Stufe ${ref.level} gibt es noch keine Bruchaufgaben`)
  for (;;) {
    const template = rng.pick(templates)
    const task = template.build(rng)
    if (isGood(task, ref.level)) return { ref, template, task }
  }
}
