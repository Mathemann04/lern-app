import { explainFractionError, listing } from '../explain/fractionTexts.ts'
import { type Expr, mul } from '../expr/types.ts'
import { type FracWrong, fractionWrongAnswers } from '../fraction/errorRules.ts'
import { factoredPoly, reduceFrac } from '../fraction/factor.ts'
import { type Frac, fracDiv, fracEquals, fracNeg, isRootAtom, radicandLetters, rootForm, toFrac } from '../fraction/frac.ts'
import { atomsOf, constValue, isZeroPoly, polyContent, totalDegree } from '../fraction/poly.ts'
import { type FracSolution, rationalizedFrac, solveFraction } from '../fraction/solve.ts'
import { type FractionTask, partsOf, shownPoly } from '../fraction/task.ts'
import { parseLatex } from '../parse/latex.ts'
import { isInteger, ratAbs } from '../rational.ts'
import { generateFractionTask } from '../tasks/fractionTerms.ts'
import type { TaskRef } from '../tasks/taskNumber.ts'
import { variablesOf } from './answer.ts'
import type { FreeTask, FreeVerdict } from './freeTask.ts'

// Prüft ein frei eingegebenes Ergebnis einer Bruchaufgabe. Erst: Hat es denselben Wert (exakt, als
// Bruch aus Polynomen)? Dann: Ist es fertig? Fertig heißt (docs/PLAN-M2.md):
// - ein einziger Bruch, ein Minus davor ist erlaubt
// - kein Bruch im Zähler oder Nenner
// - Zähler und Nenner zusammengefasst: keine gleichartigen Summanden, keine Klammer in einer Summe
//   (ein Produkt aus Klammern wie (x − 1)(x + 1) ist erlaubt)
// - vollständig gekürzt: Das gekürzte Ergebnis P/Q ist bis auf eine Zahl eindeutig. Eine
//   gleichwertige Eingabe N/D ist also genau dann gekürzt, wenn D denselben Grad hat wie Q und die
//   Zahlen vor Zähler und Nenner keinen gemeinsamen Teiler haben.
// Ist der Wert ein anderer, wird mit den falschen Ergebnissen der typischen Fehler verglichen.

export type FractionCheckContext = {
  readonly task: FractionTask
  readonly solution: FracSolution
  // alle typischen Fehler, auch die nur für den freien Modus
  readonly wrongs: readonly FracWrong[]
  // Buchstaben, die in der Eingabe vorkommen dürfen
  readonly letters: readonly string[]
  // Bausteine wie e^x, ln x, sin x, cos x in der Aufgabe
  readonly blocks: boolean
  // √x in der Aufgabe: Die Eingabe wird in √x umgerechnet (x = (√x)²)
  readonly root: boolean
  // die Wurzeln der Aufgabe (R = √x, Ra = √a, Rx+h = √(x + h)), in die umgerechnet wird
  readonly roots: readonly string[]
}

// Warum ein gleichwertiges Ergebnis noch nicht fertig ist
export type Unfinished = 'several' | 'nested' | 'numerator' | 'denominator' | 'not-reduced' | 'product' | 'decimal' | 'conjugate'

export type FractionVerdict =
  | { readonly kind: 'unreadable'; readonly message: string }
  | { readonly kind: 'correct'; readonly answer: Expr }
  | { readonly kind: 'unfinished'; readonly answer: Expr; readonly reason: Unfinished }
  | { readonly kind: 'knownError'; readonly answer: Expr; readonly wrong: FracWrong }
  | { readonly kind: 'wrongSign'; readonly answer: Expr }
  | { readonly kind: 'wrongFactor'; readonly answer: Expr }
  | { readonly kind: 'wrong'; readonly answer: Expr }

// Buchstaben sind Kleinbuchstaben (außer e, der Eulerschen Zahl); Bausteine heißen E, L, S, C, R
const isLetter = (atom: string) => /^[a-z]$/.test(atom) && atom !== 'e'
const BLOCK_ATOMS = ['E', 'L', 'S', 'C']

export function prepareFractionCheck(task: FractionTask): FractionCheckContext {
  const solution = solveFraction(task)
  const atoms = [...new Set(partsOf(task).flatMap((p) => [...atomsOf(shownPoly(p.num)), ...atomsOf(shownPoly(p.den))]))]
  const blocks = atoms.some((a) => BLOCK_ATOMS.includes(a))
  const roots = atoms.filter(isRootAtom)
  const root = roots.length > 0
  // x und y zuerst, dann alphabetisch; bei √a auch a
  const rank = (l: string) => (l === 'x' ? 0 : l === 'y' ? 1 : 2)
  const letters = [...new Set([...atoms.filter(isLetter), ...roots.flatMap(radicandLetters), ...(blocks ? ['x'] : [])])].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
  return { task, solution, wrongs: fractionWrongAnswers(task, solution), letters, blocks, root, roots }
}

export function checkFractionAnswer(context: FractionCheckContext, latex: string): FractionVerdict {
  const parsed = parseLatex(latex)
  if (!parsed.ok) return { kind: 'unreadable', message: parsed.message }
  const answer = parsed.expr

  const allowed = context.letters.length > 0 ? context.letters : ['x']
  const unknown = [...variablesOf(answer)].filter((name) => !allowed.includes(name))
  if (unknown.length > 0) {
    const name = unknown[0]
    const capital = allowed.find((l) => l.toUpperCase() === name)
    if (capital) return { kind: 'unreadable', message: `Schreibe $${capital}$ bitte klein.` }
    if (context.letters.length === 0) return { kind: 'unreadable', message: `In der Aufgabe kommen nur Zahlen vor. Was soll $${name}$ bedeuten?` }
    const which = listing(context.letters.map((l) => `$${l}$`))
    return { kind: 'unreadable', message: `In der Aufgabe ${context.letters.length === 1 ? 'kommt nur' : 'kommen nur'} ${which} vor. Was soll $${name}$ bedeuten?` }
  }

  const parsedValue = toFrac(answer)
  // etwas, das die Bruch-Engine nicht kennt (z. B. eine dritte Wurzel), oder geteilt durch null
  if (!parsedValue || isZeroPoly(parsedValue.den)) return { kind: 'wrong', answer }
  const value = context.root ? rootForm(parsedValue, context.roots) : parsedValue

  const correct = context.solution.value
  if (fracEquals(value, correct)) {
    const reason = unfinished(answer, value, context.solution, context.task)
    return reason ? { kind: 'unfinished', answer, reason } : { kind: 'correct', answer }
  }
  const wrong = context.wrongs.find((w) => w.value && fracEquals(value, w.value))
  if (wrong) return { kind: 'knownError', answer, wrong }
  if (fracEquals(value, fracNeg(correct))) return { kind: 'wrongSign', answer }
  if (constantRatio(value, correct)) return { kind: 'wrongFactor', answer }
  return { kind: 'wrong', answer }
}

// value = c · correct mit einer Zahl c?
function constantRatio(value: Frac, correct: Frac): boolean {
  const r = reduceFrac(fracDiv(value, correct))
  return constValue(r.num) !== null && r.den.factors.length === 0
}

// --- Ist ein gleichwertiges Ergebnis fertig? ---

// Kommt die Art im Term vor? Hochzahlen zählen nur mit exponents (x^{\frac{1}{2}} ist kein Bruch)
function containsKind(e: Expr, kind: Expr['kind'], exponents = true): boolean {
  if (e.kind === kind) return true
  const inner = (x: Expr) => containsKind(x, kind, exponents)
  switch (e.kind) {
    case 'add':
      return e.terms.some(inner)
    case 'mul':
      return e.factors.some(inner)
    case 'neg':
    case 'root':
    case 'fn':
      return inner(e.arg)
    case 'div':
      return inner(e.num) || inner(e.den)
    case 'pow':
      return inner(e.base) || (exponents && inner(e.exp))
    case 'log':
      return inner(e.base) || inner(e.arg)
    default:
      return false
  }
}

const hasFraction = (e: Expr) => containsKind(e, 'div', false)

// Zähler und Nenner der Eingabe als Terme; sonst, warum es kein einzelner Bruch ist
function parts(answer: Expr): { num: Expr; den: Expr | null } | Unfinished {
  let core = answer
  while (core.kind === 'neg') core = core.arg
  if (core.kind === 'div') return hasFraction(core.num) || hasFraction(core.den) ? 'nested' : { num: core.num, den: core.den }
  if (!hasFraction(core)) return { num: core, den: null }
  // Bruch mal Term ohne Bruch, z. B. \frac{1}{2}x: wie ein Bruch
  if (core.kind === 'mul') {
    const fractions = core.factors.filter((f) => f.kind === 'div')
    const rest = core.factors.filter((f) => f.kind !== 'div')
    if (fractions.length === 1 && !rest.some(hasFraction)) {
      const [f] = fractions
      if (f.kind === 'div' && !hasFraction(f.num) && !hasFraction(f.den)) return { num: mul(f.num, ...rest), den: f.den }
    }
  }
  return 'several'
}

// Eine Summe außerhalb einer Wurzel (√(x + h) zählt nicht)
function hasBracketSum(e: Expr): boolean {
  switch (e.kind) {
    case 'add':
      return true
    case 'mul':
      return e.factors.some(hasBracketSum)
    case 'neg':
    case 'fn':
      return hasBracketSum(e.arg)
    case 'div':
      return hasBracketSum(e.num) || hasBracketSum(e.den)
    case 'pow':
      return hasBracketSum(e.base) || hasBracketSum(e.exp)
    case 'log':
      return hasBracketSum(e.base) || hasBracketSum(e.arg)
    default:
      return false
  }
}

// Eine Summe ist zusammengefasst, wenn keiner ihrer Summanden eine Klammer mit Summe enthält und
// keine zwei gleichartig sind (3x + 2x, 4 + 1). In Produkten zählt jede Klammer für sich.
function isCombined(e: Expr): boolean {
  let core = e
  while (core.kind === 'neg') core = core.arg
  if (core.kind === 'add') {
    if (core.terms.some(hasBracketSum)) return false
    const seen = new Set<string>()
    for (const t of core.terms) {
      const f = toFrac(t)
      if (!f || f.num.length !== 1 || constValue(f.den) === null) continue
      const like = JSON.stringify(f.num[0].mono)
      if (seen.has(like)) return false
      seen.add(like)
    }
    return true
  }
  if (core.kind === 'mul') return core.factors.every(isCombined)
  if (core.kind === 'pow') return isCombined(core.base)
  return true
}

// Faktoren eines Produkts, verschachtelte Produkte aufgelöst
const factorsOf = (e: Expr): Expr[] => (e.kind === 'mul' ? e.factors.flatMap(factorsOf) : [e])

// Steht noch ein Produkt zum Ausrechnen da? Zwei Zahlen (3 · 4) oder zweimal derselbe Buchstabe
// (a · a²) in einem Produkt
function hasOpenProduct(e: Expr): boolean {
  if (e.kind === 'mul') {
    const factors = factorsOf(e)
    // Zahlen, auch ein Bruch mit einer Zahl oben (\frac{1}{6b} \cdot 5 ist noch \frac{5}{6b})
    if (factors.filter((f) => f.kind === 'num' || (f.kind === 'div' && f.num.kind === 'num')).length >= 2) return true
    // Bruch mal Zahl: \frac{s}{(r + s)^2} \cdot 2 ist noch \frac{2s}{(r + s)^2}
    if (factors.some((f) => f.kind === 'div') && factors.some((f) => f.kind === 'num')) return true
    const letters = factors.map((f) => (f.kind === 'var' ? f.name : f.kind === 'pow' && f.base.kind === 'var' ? f.base.name : null)).filter((l) => l !== null)
    if (new Set(letters).size < letters.length) return true
    return factors.some(hasOpenProduct)
  }
  switch (e.kind) {
    case 'add':
      return e.terms.some(hasOpenProduct)
    case 'neg':
      return hasOpenProduct(e.arg)
    case 'div':
      return hasOpenProduct(e.num) || hasOpenProduct(e.den)
    case 'pow':
      return hasOpenProduct(e.base)
    default:
      return false
  }
}

// Steht eine Wurzel im Term (√x oder x^{1/2})?
function hasRoot(e: Expr): boolean {
  if (containsKind(e, 'root')) return true
  const f = toFrac(e)
  return f !== null && [...f.num, ...f.den].some((t) => t.mono.some(([a, k]) => isRootAtom(a) && k % 2 === 1))
}

// Kommt eine Dezimalzahl vor (0,75)?
function hasDecimal(e: Expr): boolean {
  if (e.kind === 'num') return e.value.d !== 1n
  switch (e.kind) {
    case 'add':
      return e.terms.some(hasDecimal)
    case 'mul':
      return e.factors.some(hasDecimal)
    case 'neg':
      return hasDecimal(e.arg)
    case 'div':
      return hasDecimal(e.num) || hasDecimal(e.den)
    case 'pow':
      return hasDecimal(e.base)
    default:
      return false
  }
}

function unfinished(answer: Expr, value: Frac, solution: FracSolution, task: FractionTask): Unfinished | null {
  if (hasDecimal(answer)) return 'decimal'
  if (hasOpenProduct(answer)) return 'product'
  const shape = parts(answer)
  if (typeof shape === 'string') return shape
  if (!isCombined(shape.num)) return 'numerator'
  if (shape.den && !isCombined(shape.den)) return 'denominator'
  // Wurzel beseitigen: Im Nenner steht keine Wurzel mehr (bzw. beim Differenzenquotienten ist h gekürzt)
  const conjugate = task.rule?.kind === 'conjugate' ? task.rule.target : null
  if (conjugate === 'den' && shape.den && hasRoot(shape.den)) return 'conjugate'
  const target = conjugate === 'den' ? rationalizedFrac(solution.reduced) : null
  // Gekürzt: Nenner vom selben Grad wie im gekürzten Ergebnis, Zahlen ohne gemeinsamen Teiler
  if (totalDegree(value.den) > (target ? totalDegree(target.den) : totalDegree(factoredPoly(solution.reduced.den)))) return conjugate === 'num' ? 'conjugate' : 'not-reduced'
  const [cn, cd] = [polyContent(value.num), polyContent(value.den)]
  if (!isInteger(cn) || !isInteger(cd)) return 'not-reduced'
  let g = ratAbs(cn).n
  for (let b = ratAbs(cd).n; b !== 0n; ) [g, b] = [b, g % b]
  return g === 1n ? null : 'not-reduced'
}

// --- Für die Oberfläche ---

export const UNFINISHED_TEXTS: Readonly<Record<Unfinished, string>> = {
  several: 'Fasse noch zu einem einzigen Bruch zusammen.',
  nested: 'Im Bruch steht noch ein Bruch. Löse den Doppelbruch auf.',
  numerator: 'Fasse den Zähler noch zusammen: Klammern ausmultiplizieren und gleichartige Summanden zusammenrechnen.',
  denominator: 'Fasse den Nenner noch zusammen: Klammern in einer Summe ausmultiplizieren und gleichartige Summanden zusammenrechnen. Als Produkt wie $(x - 1)(x + 1)$ darf er stehen bleiben.',
  'not-reduced': 'Noch nicht vollständig gekürzt. Zerlege Zähler und Nenner in Faktoren und kürze, was oben und unten steht.',
  product: 'Rechne das Produkt noch aus: Zahlen malnehmen und gleiche Buchstaben zusammenfassen, z. B. $3 \\cdot 4a \\cdot a = 12a^2$.',
  decimal: 'Schreibe das Ergebnis als Bruch, ohne Dezimalzahl.',
  conjugate:
    'Noch nicht fertig: Erweitere mit dem Gegenstück der Summe mit Wurzel (dieselben Teile, anderes Vorzeichen). Mit der dritten binomischen Formel verschwindet die Wurzel aus dem Nenner, beim Differenzenquotienten kürzt sich danach $h$.',
}

export function fractionFreeVerdict(v: FractionVerdict): FreeVerdict {
  switch (v.kind) {
    case 'unreadable':
      return { kind: 'unreadable', title: 'Das kann ich noch nicht lesen.', message: v.message }
    case 'correct':
      return { kind: 'correct', title: 'Richtig!' }
    case 'unfinished':
      return { kind: 'unfinished', title: 'Richtig gerechnet, aber noch nicht fertig.', message: UNFINISHED_TEXTS[v.reason] }
    case 'knownError':
      return { kind: 'wrong', title: 'Nicht ganz.', error: { id: v.wrong.rule.id, name: v.wrong.rule.name, why: explainFractionError(v.wrong.rule.id) } }
    case 'wrongSign':
      return { kind: 'wrong', title: 'Fast!', message: 'Bis auf das Vorzeichen stimmt es. Prüfe, wo ein Minus hingehört.' }
    case 'wrongFactor':
      return { kind: 'wrong', title: 'Fast!', message: 'Bis auf einen Zahlenfaktor stimmt es. Prüfe die Zahlen.' }
    case 'wrong':
      return {
        kind: 'wrong',
        title: 'Das stimmt noch nicht.',
        message: 'Rechne noch einmal nach. Wenn du nicht weiterkommst, helfen dir der Tipp, der Lösungsweg oder der geführte Modus.',
      }
  }
}

export function prepareFractionFree(ref: TaskRef): FreeTask {
  const context = prepareFractionCheck(generateFractionTask(ref).task)
  return {
    answerLabel: '=',
    inputLabel: 'Dein Ergebnis',
    keyboard: { kind: 'fraction', letters: context.letters, blocks: context.blocks, root: context.root },
    check: (latex) => fractionFreeVerdict(checkFractionAnswer(context, latex)),
  }
}
