import { type Derivation, derive } from '../derive/derive.ts'
import { type WrongAnswer, wrongAnswers } from '../derive/errorRules.ts'
import { key } from '../expr/compare.ts'
import { type Env, evaluate } from '../expr/evaluate.ts'
import { normalize } from '../expr/normalize.ts'
import { samplePoints } from '../expr/sample.ts'
import { type Expr, neg } from '../expr/types.ts'
import { parseLatex } from '../parse/latex.ts'
import { createRng } from '../random/rng.ts'

// Prüft eine frei eingegebene Ableitung: Ist sie gleichwertig zur Lösung (in jeder
// richtigen Form)? Wenn nicht: Passt sie zu einem typischen Fehler aus den Fehlerregeln?
// Gleichwertig heißt: gleiche Normalform, sonst gleiche Werte an vielen Stellen im
// Definitionsbereich der Aufgabe.

export type AnswerContext = {
  readonly task: Expr
  readonly derivation: Derivation
  readonly wrongAnswers: readonly WrongAnswer[]
  readonly points: readonly Env[]
}

export type Verdict =
  | { readonly kind: 'unreadable'; readonly message: string }
  | { readonly kind: 'correct'; readonly answer: Expr }
  // passt zu einem typischen Fehler
  | { readonly kind: 'knownError'; readonly answer: Expr; readonly wrong: WrongAnswer }
  // die Funktion selbst statt ihrer Ableitung
  | { readonly kind: 'functionItself'; readonly answer: Expr }
  // richtig bis auf das Vorzeichen bzw. einen Zahlenfaktor
  | { readonly kind: 'wrongSign'; readonly answer: Expr }
  | { readonly kind: 'wrongFactor'; readonly answer: Expr }
  | { readonly kind: 'wrong'; readonly answer: Expr }

const POINT_COUNT = 40
// Mindestzahl verglichener Stellen für „richtig"; für typische Fehler mit kleinerem
// Definitionsbereich (z. B. 1/\sqrt{1 - x^2}) reichen weniger
const MIN_COMPARED_CORRECT = 8
const MIN_COMPARED_ERROR = 3
const RELATIVE_TOLERANCE = 1e-7
// Nur aussagekräftige Werte vergleichen (wie in numeric.ts)
const SMALLEST_INFORMATIVE = 1e-6
const LARGEST_INFORMATIVE = 1e12

export function prepareAnswerCheck(task: Expr): AnswerContext {
  const derivation = derive(task)
  return {
    task,
    derivation,
    wrongAnswers: wrongAnswers(task, derivation),
    points: samplePoints([task, derivation.result], createRng(`prüfen:${key(task)}`), POINT_COUNT),
  }
}

const close = (a: number, b: number) => Math.abs(a - b) <= RELATIVE_TOLERANCE * Math.max(Math.abs(a), Math.abs(b))

// Hat candidate an allen aussagekräftigen Stellen denselben Wert wie reference?
// Wo reference definiert ist, muss auch candidate definiert sein. Die Normalform allein
// reicht nicht: Sie darf den Definitionsbereich vergrößern (\sqrt{x} \cdot \sqrt{x} → x).
export function sameFunction(reference: Expr, candidate: Expr, points: readonly Env[], minCompared = MIN_COMPARED_CORRECT): boolean {
  let compared = 0
  let differs = false
  for (const point of points) {
    const a = evaluate(reference, point)
    const size = Math.abs(a)
    if (Number.isNaN(a) || size < SMALLEST_INFORMATIVE || size > LARGEST_INFORMATIVE) continue
    const b = evaluate(candidate, point)
    if (Number.isNaN(b)) return false
    compared++
    if (!close(a, b)) differs = true
  }
  if (!differs && compared >= minCompared) return true
  // Gleiche Normalform: gleichwertig, auch wenn Rundungsfehler oder zu wenige Stellen die Zahlen stören
  return key(normalize(reference)) === key(normalize(candidate))
}

// candidate = c · reference mit fester Zahl c? Liefert c oder null.
function constantRatio(reference: Expr, candidate: Expr, points: readonly Env[]): number | null {
  let ratio: number | null = null
  let compared = 0
  for (const point of points) {
    const a = evaluate(reference, point)
    const size = Math.abs(a)
    if (Number.isNaN(a) || size < SMALLEST_INFORMATIVE || size > LARGEST_INFORMATIVE) continue
    const b = evaluate(candidate, point)
    if (!Number.isFinite(b)) return null
    const r = b / a
    if (ratio === null) ratio = r
    else if (!close(ratio, r)) return null
    compared++
  }
  return compared >= MIN_COMPARED_CORRECT ? ratio : null
}

function variablesOf(e: Expr, found = new Set<string>()): Set<string> {
  switch (e.kind) {
    case 'var':
      found.add(e.name)
      break
    case 'add':
      e.terms.forEach((t) => variablesOf(t, found))
      break
    case 'mul':
      e.factors.forEach((f) => variablesOf(f, found))
      break
    case 'neg':
    case 'root':
    case 'fn':
      variablesOf(e.arg, found)
      break
    case 'div':
      variablesOf(e.num, found)
      variablesOf(e.den, found)
      break
    case 'pow':
      variablesOf(e.base, found)
      variablesOf(e.exp, found)
      break
    case 'log':
      variablesOf(e.base, found)
      variablesOf(e.arg, found)
      break
  }
  return found
}

export function checkAnswer(context: AnswerContext, latex: string): Verdict {
  const parsed = parseLatex(latex)
  if (!parsed.ok) return { kind: 'unreadable', message: parsed.message }
  const answer = parsed.expr

  const unknown = [...variablesOf(answer)].filter((name) => name !== 'x')
  if (unknown.length > 0) {
    const name = unknown[0]
    return {
      kind: 'unreadable',
      message: name === 'X' ? 'Schreibe $x$ bitte klein.' : `In der Ableitung kommt nur $x$ vor. Was soll $${name}$ bedeuten?`,
    }
  }

  const { task, derivation, points } = context
  const correct = derivation.result
  if (sameFunction(correct, answer, points)) return { kind: 'correct', answer }
  for (const wrong of context.wrongAnswers) {
    if (sameFunction(wrong.result, answer, points, MIN_COMPARED_ERROR)) return { kind: 'knownError', answer, wrong }
  }
  if (sameFunction(task, answer, points)) return { kind: 'functionItself', answer }
  if (sameFunction(neg(correct), answer, points)) return { kind: 'wrongSign', answer }
  const ratio = constantRatio(correct, answer, points)
  if (ratio !== null && ratio !== 0) return { kind: 'wrongFactor', answer }
  return { kind: 'wrong', answer }
}
