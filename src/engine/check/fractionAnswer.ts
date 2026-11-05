import { explainFractionError, listing } from '../explain/fractionTexts.ts'
import { type Expr, mul } from '../expr/types.ts'
import { type FracWrong, fractionWrongAnswers } from '../fraction/errorRules.ts'
import { factoredPoly, factorize, reduceFrac } from '../fraction/factor.ts'
import { type Frac, fracDiv, fracEquals, fracNeg, isRootAtom, radicandLetters, reduceImag, rootForm, toFrac } from '../fraction/frac.ts'
import { hasImag, imagParts } from '../fraction/complex.ts'
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
// Partialbruchzerlegung: fertig ist eine Summe aus dem ganzen Teil und einfachen Brüchen, je Bruch
// eine Zahl im Zähler und ein Linearfaktor (oder sein Quadrat) im Nenner, keiner doppelt.
// Komplexe Zahlen: fertig ist a + bi (Realteil und Imaginärteil je gekürzt, jeder einmal) oder ein
// gekürzter Bruch \frac{p + qi}{r} mit reellem Nenner; kein i im Nenner, keine Potenz von i.

export type FractionCheckContext = {
  readonly task: FractionTask
  readonly solution: FracSolution
  // alle typischen Fehler, auch die nur für den freien Modus
  readonly wrongs: readonly FracWrong[]
  // Buchstaben, die in der Eingabe vorkommen dürfen
  readonly letters: readonly string[]
  // Bausteine wie e^x, ln x, sin x, cos x in der Aufgabe
  readonly blocks: boolean
  // komplexe Zahlen: i in der Aufgabe
  readonly imag: boolean
  // √x in der Aufgabe: Die Eingabe wird in √x umgerechnet (x = (√x)²)
  readonly root: boolean
  // die Wurzeln der Aufgabe (R = √x, Ra = √a, Rx+h = √(x + h)), in die umgerechnet wird
  readonly roots: readonly string[]
}

// Warum ein gleichwertiges Ergebnis noch nicht fertig ist
export type Unfinished =
  | 'several'
  | 'nested'
  | 'numerator'
  | 'denominator'
  | 'not-reduced'
  | 'product'
  | 'decimal'
  | 'conjugate'
  | 'partial'
  | 'partial-combine'
  | 'imag-den'
  | 'imag-power'
  | 'imag-combine'

export type FractionVerdict =
  | { readonly kind: 'unreadable'; readonly message: string }
  | { readonly kind: 'correct'; readonly answer: Expr }
  | { readonly kind: 'unfinished'; readonly answer: Expr; readonly reason: Unfinished }
  | { readonly kind: 'knownError'; readonly answer: Expr; readonly wrong: FracWrong }
  | { readonly kind: 'wrongSign'; readonly answer: Expr }
  | { readonly kind: 'wrongFactor'; readonly answer: Expr }
  | { readonly kind: 'wrong'; readonly answer: Expr }

// Buchstaben sind Kleinbuchstaben (außer e, der Eulerschen Zahl, und i); Bausteine heißen E, L, S, C, R
const isLetter = (atom: string) => /^[a-z]$/.test(atom) && atom !== 'e' && atom !== 'i'
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
  return { task, solution, wrongs: fractionWrongAnswers(task, solution), letters, blocks, imag: atoms.includes('i'), root, roots }
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
    const reason =
      context.task.kind === 'partial' ? partialUnfinished(answer) : context.task.kind === 'imaginary' ? imagUnfinished(answer) : unfinished(answer, value, context.solution, context.task)
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

// Partialbrüche: Summe aus dem ganzen Teil und einfachen Brüchen \frac{A}{(x - a)^k}
function partialUnfinished(answer: Expr): Unfinished | null {
  if (hasDecimal(answer)) return 'decimal'
  if (hasOpenProduct(answer)) return 'product'
  const summands = (e: Expr): Expr[] => (e.kind === 'add' ? e.terms.flatMap(summands) : e.kind === 'neg' ? summands(e.arg) : [e])
  const pieces = new Set<string>()
  const whole: Expr[] = []
  for (const s of summands(answer)) {
    const f = toFrac(s)
    if (!f) return 'partial'
    const den = constValue(f.den) === null ? factorize(f.den) : null
    if (!den) {
      if (hasBracketSum(s)) return 'partial-combine'
      whole.push(s)
      continue
    }
    // Zähler eine Zahl, Nenner eine Zahl mal eine Potenz eines Linearfaktors
    const [g] = den.factors
    if (constValue(f.num) === null || den.factors.length !== 1 || totalDegree(g.poly) !== 1) return 'partial'
    const key = `${g.poly.map((t) => `${t.coef.n}/${t.coef.d}${JSON.stringify(t.mono)}`).join(' ')}^${g.exp}`
    if (pieces.has(key)) return 'partial-combine'
    pieces.add(key)
  }
  // der ganze Teil zusammengefasst: keine zwei gleichartigen Summanden
  const like = whole.flatMap((e) => toFrac(e)?.num ?? []).map((term) => JSON.stringify(term.mono))
  return new Set(like).size < like.length ? 'partial-combine' : null
}

// --- Komplexe Zahlen ---

// Kommt i im Term vor?
function containsImag(e: Expr): boolean {
  if (e.kind === 'const') return e.name === 'i'
  switch (e.kind) {
    case 'add':
      return e.terms.some(containsImag)
    case 'mul':
      return e.factors.some(containsImag)
    case 'neg':
    case 'root':
    case 'fn':
      return containsImag(e.arg)
    case 'div':
      return containsImag(e.num) || containsImag(e.den)
    case 'pow':
      return containsImag(e.base) || containsImag(e.exp)
    case 'log':
      return containsImag(e.base) || containsImag(e.arg)
    default:
      return false
  }
}

// Steht i im Nenner (auch als Hochzahl mit Minus)?
function imagInDen(e: Expr): boolean {
  switch (e.kind) {
    case 'div':
      return containsImag(e.den) || imagInDen(e.num)
    case 'pow': {
      const k = toFrac(e.exp)
      const negative = k !== null && k.num.length === 1 && k.num[0].coef.n < 0n
      return (negative && containsImag(e.base)) || imagInDen(e.base)
    }
    case 'add':
      return e.terms.some(imagInDen)
    case 'mul':
      return e.factors.some(imagInDen)
    case 'neg':
      return imagInDen(e.arg)
    default:
      return false
  }
}

// Ein Faktor ohne Summe, in dem i steckt: i, 2i, i²
const isBareImag = (e: Expr): boolean => containsImag(e) && !hasBracketSum(e)

// Noch eine Potenz von i (i², (2i)³) oder i mal i?
function hasImagPowerExpr(e: Expr): boolean {
  switch (e.kind) {
    case 'pow':
      return isBareImag(e.base) || hasImagPowerExpr(e.base)
    case 'mul':
      return factorsOf(e).filter(isBareImag).length >= 2 || e.factors.some(hasImagPowerExpr)
    case 'add':
      return e.terms.some(hasImagPowerExpr)
    case 'neg':
      return hasImagPowerExpr(e.arg)
    case 'div':
      return hasImagPowerExpr(e.num) || hasImagPowerExpr(e.den)
    default:
      return false
  }
}

// Eine Klammer mit i, die noch ausmultipliziert werden muss: (1 + i) \cdot 2, (2 - i)(3 - 4i)
function hasImagBracket(e: Expr): boolean {
  switch (e.kind) {
    case 'add':
      return containsImag(e)
    case 'mul':
      return e.factors.some(hasImagBracket)
    case 'neg':
      return hasImagBracket(e.arg)
    case 'div':
      return hasImagBracket(e.num) || hasImagBracket(e.den)
    case 'pow':
      return hasImagBracket(e.base)
    default:
      return false
  }
}

// Ein Bruch mit reellem Nenner ist gekürzt: Nenner vom kleinsten Grad, Zahlen ohne gemeinsamen Teiler
function isReducedFrac(f: Frac): boolean {
  const r = reduceFrac(f)
  if (totalDegree(f.den) > totalDegree(factoredPoly(r.den))) return false
  const [cn, cd] = [polyContent(f.num), polyContent(f.den)]
  if (!isInteger(cn) || !isInteger(cd)) return false
  let g = ratAbs(cn).n
  for (let b = ratAbs(cd).n; b !== 0n; ) [g, b] = [b, g % b]
  return g === 1n
}

function imagUnfinished(answer: Expr): Unfinished | null {
  if (hasDecimal(answer)) return 'decimal'
  if (hasImagPowerExpr(answer)) return 'imag-power'
  if (imagInDen(answer)) return 'imag-den'
  if (hasOpenProduct(answer)) return 'product'
  const summands = (e: Expr): Expr[] => (e.kind === 'add' ? e.terms.flatMap(summands) : e.kind === 'neg' ? summands(e.arg) : [e])
  const all = summands(answer)
  // ein Bruch \frac{p + qi}{r}: der Zähler darf eine Summe mit i sein
  const single = all.length === 1 && all[0].kind === 'div' ? all[0] : null
  if (single ? hasImagBracket(single.den) || (single.num.kind !== 'add' && hasImagBracket(single.num)) || (single.num.kind === 'add' && single.num.terms.some(hasImagBracket)) : all.some(hasImagBracket)) return 'imag-combine'
  let [real, imaginary] = [0, 0]
  for (const s of all) {
    const f = toFrac(s)
    if (!f) return 'imag-combine'
    const value = { num: reduceImag(f.num), den: reduceImag(f.den) }
    if (hasImag(value.den)) return 'imag-den'
    const { re, im } = imagParts(value.num)
    if (re.length > 0 && im.length > 0) {
      // ein Bruch \frac{p + qi}{r}: nur allein und mit zusammengefasstem Zähler
      const core = s.kind === 'neg' ? s.arg : s
      if (all.length > 1 || core.kind !== 'div' || !isCombined(core.num)) return 'imag-combine'
      real++
      imaginary++
    } else if (im.length > 0) imaginary++
    else real++
    if (!isReducedFrac(value)) return 'not-reduced'
  }
  return real > 1 || imaginary > 1 ? 'imag-combine' : null
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
  partial:
    'Noch nicht fertig: Zerlege in einfache Brüche. Je Faktor des Nenners ein Bruch mit einer Zahl im Zähler, ein doppelter Faktor auch mit seinem Quadrat, davor der ganze Teil aus der Polynomdivision.',
  'partial-combine': 'Fasse noch zusammen: Jeder Nenner kommt nur einmal vor, und der ganze Teil hat keine gleichartigen Summanden und keine Klammern.',
  'imag-den': 'Im Nenner steht noch $\\mathrm{i}$. Erweitere mit dem konjugiert Komplexen des Nenners, dann ist der Nenner reell.',
  'imag-power': 'Rechne die Potenzen von $\\mathrm{i}$ noch aus: $\\mathrm{i}^2 = -1$.',
  'imag-combine': 'Fasse noch zusammen: Schreibe das Ergebnis als $a + b\\,\\mathrm{i}$, mit einem Realteil und einem Imaginärteil.',
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
    keyboard: { kind: 'fraction', letters: context.letters, blocks: context.blocks, root: context.root, ...(context.imag ? { imag: true } : {}) },
    check: (latex) => fractionFreeVerdict(checkFractionAnswer(context, latex)),
  }
}
