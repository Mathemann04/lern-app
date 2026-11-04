import { reduceFrac } from '../fraction/factor.ts'
import type { Frac } from '../fraction/frac.ts'
import {
  type Poly,
  atomsOf,
  polyAdd,
  polyAtom,
  polyConst,
  polyMul,
  polyPow,
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
import { LEVEL1_KIT, bigReduce, buildFromKit, level2Kit as level2Kit_, monomialReduce } from './fractionKit.ts'
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
  build: (rng) => (rng.chance(0.08) ? bigReduce(rng) : buildFromKit(rng, LEVEL1_KIT, 1)),
}

const level2Kit: FractionTemplate = {
  id: 'baukasten-buchstaben',
  level: 2,
  label: 'Baukasten: Brüche mit Buchstaben in Produkten',
  build: (rng) => (rng.chance(0.1) ? monomialReduce(rng) : buildFromKit(rng, level2Kit_(rng), 2)),
}

const LETTER_PAIRS = [
  ['x', 'y'],
  ['a', 'b'],
] as const

// --- Stufe 3: Summen in Zähler und Nenner ---

const level3Reduce: FractionTemplate = {
  id: 'summen-kuerzen',
  level: 3,
  label: 'Ausklammern und binomische Formeln, dann kürzen',
  build(rng) {
    const p = rng.int(1, 6)
    const k = rng.int(2, 5)
    const s = rng.chance(0.5) ? 1 : -1
    const plusP = lin(1, p)
    const minusP = lin(1, -p)
    const hints = [plusP, minusP]
    const squares = polyMul(plusP, minusP)
    switch (rng.int(1, 5)) {
      case 1:
        // \frac{x^2 - 9}{2x + 6}
        return shape({ kind: 'reduce', part: polyPart(squares, polyScale(lin(1, s * p), rat(k))) }, hints)
      case 2:
        // \frac{x^2 + 6x + 9}{x^2 - 9}
        return shape({ kind: 'reduce', part: polyPart(polyPow(lin(1, s * p), 2), squares) }, hints)
      case 3:
        // \frac{3x + 9}{x^2 + 6x + 9}
        return shape({ kind: 'reduce', part: polyPart(polyScale(lin(1, s * p), rat(k)), polyPow(lin(1, s * p), 2)) }, hints)
      case 4: {
        // \frac{3x^2 + 6x}{3x} bzw. mit einer Zahl im Nenner
        const r = rng.pick([1, 2, 3])
        return shape({ kind: 'reduce', part: polyPart(polyMul(mono(k, ['x', 1]), lin(1, s * p)), mono(k * r, ['x', 1])) }, hints)
      }
      default:
        // \frac{3 - x}{x^2 - 9}: vertauschte Differenz
        return shape({ kind: 'reduce', part: part(expanded(lin(-1, p), true), expanded(squares)) }, hints)
    }
  },
}

const level3Sum: FractionTemplate = {
  id: 'summen-im-nenner',
  level: 3,
  label: 'Brüche mit Nennern wie $x + 1$ und $x - 1$',
  build(rng) {
    const sign = anySign(rng)
    const p = nonZero(rng, 5)
    let q = nonZero(rng, 5)
    while (q === p) q = nonZero(rng, 5)
    switch (rng.int(1, 4)) {
      case 1:
        return shape({ kind: 'sum', terms: [plus(polyPart(c(rng.int(1, 5)), lin(1, p))), signed(sign, polyPart(c(rng.int(1, 5)), lin(1, q)))] }, [lin(1, p), lin(1, q)])
      case 2:
        return shape({ kind: 'sum', terms: [plus(polyPart(c(rng.int(1, 5)), lin(1, 0))), signed(sign, polyPart(c(rng.int(1, 5)), lin(1, p)))] }, [lin(1, p)])
      case 3:
        return shape({ kind: 'sum', terms: [plus(numberPart(rng.int(1, 3))), signed(sign, polyPart(c(rng.int(1, 5)), lin(1, p)))] }, [lin(1, p)])
      default: {
        // gleicher Nenner, Summen im Zähler: \frac{2x + 1}{x + 3} - \frac{x - 2}{x + 3}
        const den = lin(1, p)
        return shape({ kind: 'sum', terms: [plus(polyPart(lin(rng.int(2, 4), nonZero(rng, 5)), den)), minus(polyPart(lin(1, nonZero(rng, 5)), den))] }, [den])
      }
    }
  },
}

// --- Stufe 4: Uni-Niveau ---

// Zwei verschiedene ganze Zahlen ≠ 0 zwischen −6 und 6, nicht Gegenzahlen voneinander
function twoRoots(rng: Rng): [number, number] {
  for (;;) {
    const a = nonZero(rng, 6)
    const b = nonZero(rng, 6)
    if (a !== b && a !== -b) return [a, b]
  }
}

const level4Reduce: FractionTemplate = {
  id: 'quadratisch-kuerzen',
  level: 4,
  label: '$x^2 + px + q$ zerlegen und kürzen',
  build(rng) {
    const [r1, r2] = twoRoots(rng)
    let r3 = nonZero(rng, 6)
    while (r3 === r2 || r3 === r1) r3 = nonZero(rng, 6)
    const [f1, f2, f3] = [lin(1, r1), lin(1, r2), lin(1, r3)]
    const hints = [f1, f2, f3]
    switch (rng.int(1, 3)) {
      case 1:
        // \frac{x^2 - x - 6}{x^2 - 9}
        return shape({ kind: 'reduce', part: polyPart(polyMul(f1, f2), polyMul(f1, f3)) }, hints)
      case 2: {
        // \frac{x^2 - x - 6}{2x - 6}
        const k = rng.int(2, 4)
        return shape({ kind: 'reduce', part: polyPart(polyMul(f1, f2), polyScale(f1, rat(k))) }, hints)
      }
      default: {
        // \frac{x^3 - 4x}{x^2 + 2x}
        const p = Math.abs(r1)
        return shape({ kind: 'reduce', part: polyPart(polyMul(polyAtom('x'), polyMul(lin(1, p), lin(1, -p))), polyMul(polyAtom('x'), lin(1, rng.chance(0.5) ? p : -p))) }, [lin(1, p), lin(1, -p)])
      }
    }
  },
}

const level4Sum: FractionTemplate = {
  id: 'hauptnenner-zerlegen',
  level: 4,
  label: 'Hauptnenner aus zerlegten Nennern',
  build(rng) {
    const p = rng.int(1, 5)
    const sign = anySign(rng)
    const [plusP, minusP] = [lin(1, p), lin(1, -p)]
    const hints = [plusP, minusP]
    if (rng.chance(0.5)) {
      // \frac{x}{x^2 - 1} - \frac{1}{x + 1}
      const top = rng.chance(0.5) ? lin(1, 0) : c(rng.int(1, 5))
      return shape({ kind: 'sum', terms: [plus(polyPart(top, polyMul(plusP, minusP))), signed(sign, polyPart(c(rng.int(1, 4)), rng.chance(0.5) ? plusP : minusP))] }, hints)
    }
    // \frac{3}{x^2 + 2x} - \frac{1}{x}
    const shifted = rng.chance(0.5) ? plusP : minusP
    return shape({ kind: 'sum', terms: [plus(polyPart(c(rng.int(1, 5)), polyMul(polyAtom('x'), shifted))), signed(sign, polyPart(c(rng.int(1, 4)), polyAtom('x')))] }, hints)
  },
}

const level4Complex: FractionTemplate = {
  id: 'doppelbruch',
  level: 4,
  label: 'Doppelbrüche',
  build(rng) {
    const p = rng.int(1, 4)
    const hints = [lin(1, p), lin(1, -p)]
    const one = numberPart(1)
    const over = (n: Poly, d: Poly) => polyPart(n, d)
    switch (rng.int(1, 4)) {
      case 1:
        // \frac{1 + \frac{2}{x}}{1 - \frac{4}{x^2}}
        return shape({ kind: 'complex', top: [plus(one), plus(over(c(p), polyAtom('x')))], bottom: [plus(one), minus(over(c(p * p), polyAtom('x', 2)))] }, hints)
      case 2:
        // \frac{1 - \frac{2}{x}}{x - 2}
        return shape({ kind: 'complex', top: [plus(one), minus(over(c(p), polyAtom('x')))], bottom: [plus(polyPart(lin(1, -p)))] }, hints)
      case 3:
        // \frac{x - \frac{4}{x}}{1 + \frac{2}{x}}
        return shape({ kind: 'complex', top: [plus(polyPart(polyAtom('x'))), minus(over(c(p * p), polyAtom('x')))], bottom: [plus(one), plus(over(c(p), polyAtom('x')))] }, hints)
      default:
        // \frac{\frac{1}{x} + \frac{1}{2}}{x + 2}
        return shape({ kind: 'complex', top: [plus(over(c(1), polyAtom('x'))), plus(numberPart(1, p + 1))], bottom: [plus(polyPart(lin(1, p + 1)))] }, [lin(1, p + 1)])
    }
  },
}

// Bausteine statt x: e^x, ln x, sin x, cos x
const BLOCKS = ['E', 'L', 'S', 'C'] as const

const level4Blocks: FractionTemplate = {
  id: 'bausteine',
  level: 4,
  label: 'Bausteine wie $e^x$, $\\ln x$, $\\sin x$ statt $x$',
  build(rng) {
    const b = rng.pick(BLOCKS)
    // bei sin und cos nicht 1: 1 − sin² x wäre schon eine Regel der Winkelfunktionen
    const p = b === 'S' || b === 'C' ? rng.int(2, 4) : rng.int(1, 4)
    const [plusP, minusP] = [lin(1, p, b), lin(1, -p, b)]
    const hints = [plusP, minusP]
    const sign = anySign(rng)
    switch (rng.int(1, 4)) {
      case 1:
        // \frac{e^{2x} - 4}{e^x + 2}
        return shape({ kind: 'reduce', part: polyPart(polyMul(plusP, minusP), rng.chance(0.5) ? plusP : minusP) }, hints)
      case 2: {
        // \frac{3\sin x + 6}{\sin^2 x - 4}
        const k = rng.int(2, 4)
        return shape({ kind: 'reduce', part: polyPart(polyScale(plusP, rat(k)), polyMul(plusP, minusP)) }, hints)
      }
      case 3:
        // \frac{2}{\sin x} - \frac{1}{\sin^2 x}
        return shape({ kind: 'sum', terms: [plus(polyPart(c(rng.int(1, 4)), polyAtom(b))), signed(sign, polyPart(c(rng.int(1, 4)), polyAtom(b, 2)))] }, hints)
      default:
        // \frac{1}{e^x - 2} + \frac{1}{e^x + 2}
        return shape({ kind: 'sum', terms: [plus(polyPart(c(rng.int(1, 3)), minusP)), signed(sign, polyPart(c(rng.int(1, 3)), plusP))] }, hints)
    }
  },
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
  level3Reduce,
  level3Sum,
  level4Reduce,
  level4Sum,
  level4Complex,
  level4Blocks,
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
