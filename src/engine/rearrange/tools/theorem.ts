import { key, subterms } from '../../expr/compare.ts'
import { toLatex } from '../../expr/print.ts'
import { type Equation, type Expr, type FnName, type Tool, add, asRational, div, fn, mul, neg, num, pow } from '../../expr/types.ts'

// Additionstheoreme und doppelter Winkel (Stufe 5, Teil 8c) als Werkzeug. Im Rumpf steht die Funktion, wie sie in
// der Aufgabe geschrieben ist (\sin(x + a), \cos(x - a), \cos(2x)); gesetzt wird sie genau so (print.ts), ausgewertet
// wie die Funktion (evaluate.ts). Ausgerechnet wird sie in einem Schritt:
// - \sin(p \pm q) = \sin p \cdot \cos q \pm \cos p \cdot \sin q, \cos(p \pm q) = \cos p \cdot \cos q \mp \sin p \cdot \sin q,
//   \tan(p \pm q) = \frac{\tan p \pm \tan q}{1 \mp \tan p \cdot \tan q}
// - \sin(2p) = 2\sin p \cdot \cos p; \cos(2p) in der Form, nach der nur noch eine Funktion dasteht: 1 - 2\sin^2 p, wenn
//   sonst \sin p vorkommt, 2\cos^2 p - 1, wenn \cos p vorkommt (kommen beide vor, gibt es keinen Wert)
// Typische Fehler: gliedweise, Vorzeichen in der Mitte vertauscht, Sinus und Kosinus falsch gepaart; beim doppelten
// Winkel die 2 vor die Funktion gezogen, die 2 vergessen, Plus statt Minus, die beiden Formen verwechselt.

export type TheoremTool = Extract<Tool, { kind: 'theorem' }>

export type AdditionMistake = 'eq-add-termwise' | 'eq-add-sign' | 'eq-add-partner'
export type DoubleMistake = 'eq-double-factor' | 'eq-double-two' | 'eq-double-cos-plus' | 'eq-double-cos-sign'
export type TheoremMistake = AdditionMistake | DoubleMistake
export const ADDITION_MISTAKES: readonly AdditionMistake[] = ['eq-add-termwise', 'eq-add-sign', 'eq-add-partner']
export const DOUBLE_MISTAKES: readonly DoubleMistake[] = ['eq-double-factor', 'eq-double-two', 'eq-double-cos-plus', 'eq-double-cos-sign']

type TrigName = 'sin' | 'cos' | 'tan'
export type TheoremParts =
  | { readonly kind: 'addition'; readonly name: TrigName; readonly p: Expr; readonly q: Expr; readonly minus: boolean }
  | { readonly kind: 'double'; readonly name: TrigName; readonly p: Expr }

const TRIG: ReadonlySet<FnName> = new Set<FnName>(['sin', 'cos', 'tan'])

// Funktion und Winkel: \sin(x + a) → p = x, q = a; \cos(x - a) → mit Minus; \cos(2x) → doppelter Winkel von x
export function theoremParts(body: Expr): TheoremParts | null {
  if (body.kind !== 'fn' || !TRIG.has(body.name)) return null
  const name = body.name as TrigName
  const arg = body.arg
  if (arg.kind === 'add' && arg.terms.length === 2) {
    const [p, second] = arg.terms
    return second.kind === 'neg' ? { kind: 'addition', name, p, q: second.arg, minus: true } : { kind: 'addition', name, p, q: second, minus: false }
  }
  if (arg.kind === 'mul' && arg.factors.length === 2) {
    const k = asRational(arg.factors[0])
    if (k && k.n === 2n && k.d === 1n) return { kind: 'double', name, p: arg.factors[1] }
  }
  return null
}

const sin = (e: Expr) => fn('sin', e)
const cos = (e: Expr) => fn('cos', e)
const tan = (e: Expr) => fn('tan', e)
const sq = (e: Expr) => pow(e, num(2))
const signed = (minus: boolean, e: Expr) => (minus ? neg(e) : e)

// Form von \cos(2p): die Funktion von p, die sonst in der Gleichung steht (subterms geht nicht in Werkzeuge hinein);
// null, wenn beide oder keine dastehen
export function doubleCosForm(e: Equation, p: Expr): 'sin' | 'cos' | null {
  const names = new Set<string>()
  for (const s of [...subterms(e.lhs), ...subterms(e.rhs)]) if (s.kind === 'fn' && key(s.arg) === key(p) && (s.name === 'sin' || s.name === 'cos')) names.add(s.name)
  return names.size === 1 ? (names.has('sin') ? 'sin' : 'cos') : null
}

// Wert des Werkzeugs mit einem typischen Fehler; null, wenn der Rumpf keine passende Form hat oder der Fehler hier
// nicht passt. e: die ganze Gleichung (sie entscheidet die Form von \cos(2p))
export function theoremValue(t: TheoremTool, mistake: TheoremMistake | null, e: Equation): Expr | null {
  const parts = theoremParts(t.body)
  if (!parts) return null
  if (parts.kind === 'addition') {
    if (mistake !== null && !(ADDITION_MISTAKES as readonly string[]).includes(mistake)) return null
    const { name, p, q, minus } = parts
    if (mistake === 'eq-add-termwise') return add(fn(name, p), signed(minus, fn(name, q)))
    const flip = mistake === 'eq-add-sign'
    const partner = mistake === 'eq-add-partner'
    switch (name) {
      case 'sin':
        // Sinus: gemischte Produkte, das Vorzeichen der Klammer bleibt
        return partner ? add(mul(sin(p), sin(q)), signed(minus, mul(cos(p), cos(q)))) : add(mul(sin(p), cos(q)), signed(minus !== flip, mul(cos(p), sin(q))))
      case 'cos':
        // Kosinus: gleiche Produkte, das Vorzeichen wechselt
        return partner ? add(mul(cos(p), sin(q)), signed(!minus, mul(sin(p), cos(q)))) : add(mul(cos(p), cos(q)), signed(minus === flip, mul(sin(p), sin(q))))
      case 'tan':
        if (partner) return null
        return div(add(tan(p), signed(minus, tan(q))), add(num(1), signed(minus === flip, mul(tan(p), tan(q)))))
    }
  }
  if (mistake !== null && !(DOUBLE_MISTAKES as readonly string[]).includes(mistake)) return null
  const { name, p } = parts
  if (mistake === 'eq-double-factor') return mul(num(2), fn(name, p))
  if (name === 'sin') return mistake === null ? mul(num(2), sin(p), cos(p)) : mistake === 'eq-double-two' ? mul(sin(p), cos(p)) : null
  if (name === 'tan') return mistake === null ? div(mul(num(2), tan(p)), add(num(1), neg(sq(tan(p))))) : null
  if (mistake === 'eq-double-cos-plus') return add(sq(cos(p)), sq(sin(p)))
  const form = doubleCosForm(e, p)
  if (form === null) return null
  // die 2 vergessen: 1 - \sin^2 p statt 1 - 2\sin^2 p
  const factor = (x: Expr) => (mistake === 'eq-double-two' ? x : mul(num(2), x))
  const swapped = mistake === 'eq-double-cos-sign'
  if (form === 'sin') return swapped ? add(mul(num(2), sq(sin(p))), neg(num(1))) : add(num(1), neg(factor(sq(sin(p)))))
  return swapped ? add(num(1), neg(mul(num(2), sq(cos(p))))) : add(factor(sq(cos(p))), neg(num(1)))
}

// --- Für Erklärung, Frage und Tipp ---

const RULES = {
  sinPlus: '\\sin(\\alpha + \\beta) = \\sin\\alpha \\cdot \\cos\\beta + \\cos\\alpha \\cdot \\sin\\beta',
  sinMinus: '\\sin(\\alpha - \\beta) = \\sin\\alpha \\cdot \\cos\\beta - \\cos\\alpha \\cdot \\sin\\beta',
  cosPlus: '\\cos(\\alpha + \\beta) = \\cos\\alpha \\cdot \\cos\\beta - \\sin\\alpha \\cdot \\sin\\beta',
  cosMinus: '\\cos(\\alpha - \\beta) = \\cos\\alpha \\cdot \\cos\\beta + \\sin\\alpha \\cdot \\sin\\beta',
  tanPlus: '\\tan(\\alpha + \\beta) = \\frac{\\tan\\alpha + \\tan\\beta}{1 - \\tan\\alpha \\cdot \\tan\\beta}',
  tanMinus: '\\tan(\\alpha - \\beta) = \\frac{\\tan\\alpha - \\tan\\beta}{1 + \\tan\\alpha \\cdot \\tan\\beta}',
} as const

// Was die Erklärung braucht: die Regel mit \alpha und \beta, was \alpha und \beta hier sind; beim doppelten Winkel die
// Form von \cos(2\alpha) und die Funktion, die sonst dasteht (als LaTeX)
export type TheoremWork =
  | { readonly kind: 'addition'; readonly name: TrigName; readonly rule: string; readonly alpha: string; readonly beta: string; readonly term: string }
  | { readonly kind: 'double'; readonly name: TrigName; readonly alpha: string; readonly term: string; readonly form: 'sin' | 'cos' | null; readonly other: string | null }

export function theoremWork(t: TheoremTool, e: Equation): TheoremWork | null {
  const parts = theoremParts(t.body)
  if (!parts) return null
  const term = toLatex(t.body)
  if (parts.kind === 'addition') {
    const rule = RULES[`${parts.name}${parts.minus ? 'Minus' : 'Plus'}`]
    return { kind: 'addition', name: parts.name, rule, alpha: toLatex(parts.p), beta: toLatex(parts.q), term }
  }
  const form = parts.name === 'cos' ? doubleCosForm(e, parts.p) : null
  return { kind: 'double', name: parts.name, alpha: toLatex(parts.p), term, form, other: form && toLatex(fn(form, parts.p)) }
}
