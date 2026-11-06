import { contains, key } from '../../expr/compare.ts'
import { type Env, evaluate } from '../../expr/evaluate.ts'
import { createRng } from '../../random/rng.ts'
import { variablesOf } from '../task.ts'
import { derive } from '../../derive/derive.ts'
import { type WrongAnswer, wrongAnswers } from '../../derive/errorRules.ts'
import { type Equation, type Expr, add, div, mul, neg, num } from '../../expr/types.ts'
import { isOne, ratNeg, ratSign } from '../../rational.ts'
import { type IntegralMistake, antiderivative, antiderivativeExpr, antiderivativeTerms, atBound, partialFractions } from './integrate.ts'
import { type ToolVar, bracketOf, integralOf, replaceTool, toolsIn } from './tool.ts'

// Werkzeug-Schritte der Stufe 5: Bevor umgestellt wird, wird das Werkzeug ausgerechnet, Schritt für
// Schritt und jeweils mit der ganzen Gleichung danach:
// - Ableitung: ableiten (Engine aus „Ableiten", zusammengefasst)
// - Integral: in Partialbrüche zerlegen (wenn nötig), Stammfunktion mit Grenzen, Grenzen einsetzen

export type ToolStepKind = 'derive' | 'partial' | 'antiderivative' | 'bounds'

export type ToolDraft = { readonly kind: ToolStepKind; readonly operand?: Expr; readonly after: Equation }

// Typischer Fehler in einem Werkzeug-Schritt: Id der Fehlerregel und Gleichung danach; beim Ableiten
// der Fehler aus „Ableiten" mit seiner Stelle (für den Text „Warum ist das falsch?")
export type ToolCandidate = { readonly id: string; readonly after: Equation; readonly derive?: WrongAnswer }

// Nächster Werkzeug-Schritt; null, wenn kein Werkzeug mehr dasteht oder es sich nicht ausrechnen lässt
export function nextToolStep(e: Equation): ToolDraft | null {
  const [tool] = toolsIn(e)
  if (!tool) return null
  return toolDraft(e, tool)
}

function toolDraft(e: Equation, tool: ToolVar): ToolDraft | null {
  const t = tool.tool
  switch (t.kind) {
    case 'derivative':
      return { kind: 'derive', operand: t.body, after: replaceTool(e, tool, derive(t.body, t.v).result) }
    case 'integral': {
      const decomposed = partialFractions(t.body, t.v)
      if (decomposed) return { kind: 'partial', operand: t.body, after: replaceTool(e, tool, integralOf(decomposed, t.lower, t.upper, t.v)) }
      const f = antiderivative(t.body, t.v)
      if (!f) return null
      return { kind: 'antiderivative', operand: t.body, after: replaceTool(e, tool, bracketOf(antiderivativeExpr(f, t.v), t.lower, t.upper, t.v)) }
    }
    case 'bracket':
      return { kind: 'bounds', operand: t.body, after: replaceTool(e, tool, boundsValue(t.body, t.v, t.lower, t.upper, null)) }
  }
}

// --- Grenzen einsetzen ---

export type BoundsMistake = 'eq-int-bounds-swapped' | 'eq-int-lower-forgotten'

// F = c · G mit c ohne v: -\frac{1}{3}\cos(3t) → c = -\frac{1}{3}, G = \cos(3t); \frac{t^2}{2} → \frac{1}{2}, t^2
function factorOf(f: Expr, v: string): { c: Expr | null; negative: boolean; g: Expr } {
  if (f.kind === 'neg') {
    const inner = factorOf(f.arg, v)
    return { ...inner, negative: !inner.negative }
  }
  if (f.kind === 'mul') {
    const free = f.factors.filter((x) => !contains(x, v))
    const withV = f.factors.filter((x) => contains(x, v))
    if (free.length > 0 && withV.length > 0) {
      const c = free.length === 1 ? free[0] : mul(...free)
      if (c.kind === 'num' && ratSign(c.value) < 0) return { c: num(ratNeg(c.value)), negative: true, g: withV.length === 1 ? withV[0] : mul(...withV) }
      return { c, negative: false, g: withV.length === 1 ? withV[0] : mul(...withV) }
    }
  }
  if (f.kind === 'div' && !contains(f.den, v) && contains(f.num, v)) {
    const inner = factorOf(f.num, v)
    const c = inner.c ? div(inner.c, f.den) : div(num(1), f.den)
    return { c, negative: inner.negative, g: inner.g }
  }
  return { c: null, negative: false, g: f }
}

const isZeroExpr = (e: Expr) => e.kind === 'num' && e.value.n === 0n
const termsOf = (e: Expr): readonly Expr[] => (e.kind === 'add' ? e.terms : [e])

function negatedTerm(e: Expr): Expr {
  if (e.kind === 'neg') return e.arg
  if (e.kind === 'num') return num(ratNeg(e.value))
  return neg(e)
}

// G(oben) - G(unten) als Summe; die 0 fällt weg
function difference(top: Expr, bottom: Expr): Expr {
  const terms = [...termsOf(top), ...(isZeroExpr(bottom) ? [] : termsOf(bottom).map(negatedTerm))].filter((x) => !isZeroExpr(x))
  return terms.length === 0 ? num(0) : terms.length === 1 ? terms[0] : add(...terms)
}

// F(oben) - F(unten), mit dem Faktor vorn: \frac{1}{b}\left(\ln x - \ln(x + b) - \ln a + \ln(a + b)\right);
// mistake: Grenzen vertauscht bzw. die untere Grenze vergessen (null, wenn F(unten) = 0)
export function boundsValue(f: Expr, v: string, lower: Expr, upper: Expr, mistake: BoundsMistake | null): Expr {
  const { c, negative, g } = factorOf(f, v)
  const top = atBound(g, v, upper)
  const bottom = atBound(g, v, lower)
  // mit Minus vorn: -c(G(oben) - G(unten)) = c(G(unten) - G(oben))
  const swapped = negative !== (mistake === 'eq-int-bounds-swapped')
  const d = mistake === 'eq-int-lower-forgotten' ? (negative ? negatedTerm(top) : top) : swapped ? difference(bottom, top) : difference(top, bottom)
  if (!c || (c.kind === 'num' && isOne(c.value))) return d
  // Faktor \frac{1}{3} als Nenner: \frac{e^{3x} - 1}{3}, \frac{\ln x - \ln(x + b) - \ln a + \ln(a + b)}{b}
  if (c.kind === 'div') return div(c.num.kind === 'num' && isOne(c.num.value) ? d : mul(c.num, d), c.den)
  if (c.kind === 'num' && c.value.d !== 1n) return div(c.value.n === 1n ? d : mul(num(c.value.n), d), num(c.value.d))
  return mul(c, d)
}

const lowerIsZero = (f: Expr, v: string, lower: Expr) => isZeroExpr(atBound(factorOf(f, v).g, v, lower))

// --- Typische Fehler der Werkzeug-Schritte ---

// Stellen mit positiven Werten für alle Buchstaben, an denen die Terme definiert sind
function positiveEnvs(exprs: readonly Expr[], seed: string, count = 40): Env[] {
  const rng = createRng(seed)
  const letters = variablesOf(...exprs)
  const out: Env[] = []
  for (let attempt = 0; attempt < count * 20 && out.length < count; attempt++) {
    const env: Record<string, number> = {}
    for (const name of letters) env[name] = 0.3 * (8 / 0.3) ** rng.next()
    if (exprs.every((e) => Number.isFinite(evaluate(e, env)))) out.push(env)
  }
  return out
}

const INTEGRAL_MISTAKES: readonly IntegralMistake[] = ['eq-int-inner-factor', 'eq-int-derived', 'eq-int-power', 'eq-int-sign']

// Falsche Gleichungen nach einem Werkzeug-Schritt (before: Gleichung davor)
export function toolMistakes(kind: ToolStepKind, before: Equation): ToolCandidate[] {
  const [tool] = toolsIn(before)
  if (!tool) return []
  const t = tool.tool
  const out: ToolCandidate[] = []
  if (kind === 'derive' && t.kind === 'derivative') {
    const correct = derive(t.body, t.v)
    for (const w of wrongAnswers(t.body, correct, positiveEnvs([t.body, correct.result], `ableiten:${key(t.body)}`))) {
      out.push({ id: w.errorRule.id, after: replaceTool(before, tool, w.result), derive: w })
    }
  }
  if (kind === 'partial' && t.kind === 'integral') {
    const wrong = partialFractions(t.body, t.v, true)
    if (wrong) out.push({ id: 'eq-partial-factor', after: replaceTool(before, tool, integralOf(wrong, t.lower, t.upper, t.v)) })
  }
  if (kind === 'antiderivative' && t.kind === 'integral') {
    const count = antiderivativeTerms(t.body, t.v)
    for (const id of INTEGRAL_MISTAKES) {
      for (let index = 0; index < count; index++) {
        const f = antiderivative(t.body, t.v, { id, index })
        if (f) out.push({ id, after: replaceTool(before, tool, bracketOf(antiderivativeExpr(f, t.v), t.lower, t.upper, t.v)) })
      }
    }
  }
  if (kind === 'bounds' && t.kind === 'bracket') {
    out.push({ id: 'eq-int-bounds-swapped', after: replaceTool(before, tool, boundsValue(t.body, t.v, t.lower, t.upper, 'eq-int-bounds-swapped')) })
    if (!lowerIsZero(t.body, t.v, t.lower)) {
      out.push({ id: 'eq-int-lower-forgotten', after: replaceTool(before, tool, boundsValue(t.body, t.v, t.lower, t.upper, 'eq-int-lower-forgotten')) })
    }
  }
  return out
}
