import type { FreeTask, FreeVerdict } from '../check/freeTask.ts'
import { variablesOf } from '../check/answer.ts'
import type { Explanation } from '../explain/texts.ts'
import { evaluate } from '../expr/evaluate.ts'
import type { Expr } from '../expr/types.ts'
import type { GuidedStep } from '../guided/types.ts'
import { parseLatex } from '../parse/latex.ts'
import type { TaskRef } from '../tasks/taskNumber.ts'
import { type DragStep, judgeDrag } from './drag.ts'
import { vectorErrorRule } from './errorRules.ts'
import { ANGLE_TYPES } from './dotTasks.ts'
import { ORIENTATIONS } from './spatTasks.ts'
import { INDEPENDENCE, SPAN_ANSWERS } from './basisTasks.ts'
import { COLLINEAR, ON_LINE } from './lineTasks.ts'
import { IN_PLANE } from './planeTasks.ts'
import { type VectorTask, buildVectorTask } from './vectorTasks.ts'

// Freier Modus der Tätigkeit „Vektoren" (M7 Schritt 1b): Das Ergebnis wird je Eintrag in ein eigenes Kästchen getippt
// (Vektor als Spalte, Punkt als Zeile, eine Zahl, zwei Lösungen in beliebiger Reihenfolge). Was gesucht ist, liest die
// Engine aus dem Ergebnis der Aufgabe (resultLatex, gebaut aus vec.ts), die typischen Fehler aus den falschen Antworten
// des Schritts, der dieses Ergebnis liefert. Jeder Eintrag wird einzeln geprüft und falsche werden markiert.

// Seit Schritt 2 (Skalarprodukt): choice ist eine Auswahl (spitz, rechtwinklig, stumpf; Wert = Nummer der Antwort),
// inequality eine Ungleichung wie t > 3/2 (Werte: +1 für >, −1 für <, dann die Grenze)
// Seit Schritt 6 (Geraden und Ebenen): param ist eine Parameterform (Stützvektor und ein oder zwei Richtungen, jede
// gleichwertige Form ist richtig), equation eine Koordinatenform a x + b y + c z = d (jedes Vielfache ist richtig, bei
// der Hesseschen Normalform mit exact nur genau diese)
export type EntryShape = 'vector' | 'point' | 'number' | 'solutions' | 'choice' | 'inequality' | 'param' | 'equation'

// Ein Teil des Ergebnisses: label ist LaTeX (vor den Kästchen: „\overrightarrow{AB} =", „Q", „\lvert \vec a \rvert =", „t");
// options: die Antworten einer Auswahl bzw. die Zeichen einer Ungleichung; suffix: LaTeX nach dem Kästchen (Grad)
export type ResultPart = {
  readonly shape: EntryShape
  readonly label: string
  readonly values: readonly number[]
  readonly options?: readonly string[]
  readonly suffix?: string
  // Parameterform: Namen der Parameter (ein Name: Gerade, zwei: Ebene)
  readonly params?: readonly string[]
  // Koordinatenform: nur genau diese Zahlen (Hessesche Normalform), nicht jedes Vielfache
  readonly exact?: boolean
}

export const RELATIONS = ['<', '>'] as const
// Auswahlen im Ergebnis: Antworten, Text vor den Knöpfen, die besondere Antwort (Wert 0) und die Fehler (besondere Antwort
// verwechselt, sonst die beiden anderen vertauscht)
// byChoice: Fehler je gewählter Antwort (statt nach special)
const CHOICE_SETS: readonly { readonly options: readonly string[]; readonly label: string; readonly special: number; readonly rules: readonly [string, string]; readonly byChoice?: readonly string[] }[] = [
  { options: ANGLE_TYPES, label: '', special: 1, rules: ['vec-angle-zero', 'vec-angle-sign'] },
  { options: ORIENTATIONS, label: 'Lage der drei Vektoren:', special: 2, rules: ['vec-spat-coplanar', 'vec-spat-orientation'] },
  // Linearkombination und Basis (Schritt 5): zwei Antworten, jede Verwechslung ist derselbe Fehler
  { options: INDEPENDENCE, label: 'Die Vektoren sind', special: 0, rules: ['vec-indep-swapped', 'vec-indep-swapped'] },
  // „im Spann“ gewählt, obwohl nicht: Probe vergessen; „nicht im Spann“, obwohl doch: im Spann übersehen
  { options: SPAN_ANSWERS, label: 'Der Vektor liegt', special: 0, rules: ['vec-lc-no-check', 'vec-lc-no-check'], byChoice: ['vec-lc-no-check', 'vec-lc-span-denied'] },
  // Geraden und Ebenen (Schritt 6): „drauf“ gewählt, obwohl nicht: nur eine Zeile geprüft bzw. Probe falsch gedeutet
  { options: ON_LINE, label: 'Der Punkt liegt', special: 0, rules: ['gl-check-one', 'gl-check-one'], byChoice: ['gl-check-one', 'gl-probe-misread'] },
  { options: COLLINEAR, label: 'Die drei Punkte liegen', special: 0, rules: ['gl-check-one', 'gl-check-one'], byChoice: ['gl-check-one', 'gl-probe-misread'] },
  { options: IN_PLANE, label: 'Der Punkt liegt', special: 0, rules: ['gl-probe-misread', 'gl-probe-misread'] },
]
const DEGREE = '^\\circ'
// Einheiten am Ende eines Ergebnisses (Kräfte, Schritt 3b): \,\text{N}, \,\text{Nm}, \,\text{J}, \,\text{m}
const UNIT = /\\,\\text\{(N|Nm|J|m)\}$/

// ------------------------------------------------------------------ Ergebnis lesen

// Wert einer Zahl in LaTeX (ohne Buchstaben), sonst null
function numberOf(latex: string): number | null {
  const parsed = parseLatex(latex.trim())
  if (!parsed.ok || variablesOf(parsed.expr).size > 0) return null
  const v = evaluate(parsed.expr, {})
  return Number.isFinite(v) ? v : null
}

// Trennt an einem Zeichen, das nicht in Klammern steht
function splitTop(text: string, sep: string): string[] {
  const out: string[] = []
  let depth = 0
  let start = 0
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (c === '{' || c === '(') depth++
    else if (c === '}' || c === ')') depth--
    else if (depth === 0 && text.startsWith(sep, i)) {
      out.push(text.slice(start, i))
      start = i + sep.length
      i += sep.length - 1
    }
  }
  out.push(text.slice(start))
  return out
}

const BEGIN = '\\begin{pmatrix}'
const END = '\\end{pmatrix}'

function readPart(text: string): ResultPart | null {
  const t = text.trim()
  // Art des Winkels: \text{spitz}; seit Schritt 4b auch die Lage dreier Vektoren: \text{Rechtssystem} (Text vor den
  // Knöpfen in label)
  // seit Schritt 5 auch mit Umlauten und Leerzeichen: \text{linear unabhängig}
  const word = /^\\text\{([^{}$]+)\}$/.exec(t)
  if (word) {
    for (const set of CHOICE_SETS) {
      const idx = set.options.indexOf(word[1])
      if (idx >= 0) return { shape: 'choice', label: set.label, values: [idx], options: set.options }
    }
    return null
  }
  // Ungleichung für einen Parameter: t > \frac{3}{2}
  const ineq = /^([a-z]|\\lambda) ([<>]) (.+)$/s.exec(t)
  if (ineq) {
    const v = numberOf(ineq[3])
    return v === null ? null : { shape: 'inequality', label: ineq[1], values: [ineq[2] === '>' ? 1 : -1, v], options: RELATIONS }
  }
  // Gerade oder Ebene (Schritt 6): g\colon \vec x = … (Parameterform) oder E\colon 2x - y + 3z = 6 (Koordinatenform)
  const named = /^([a-zA-Z])\\colon (.*)$/s.exec(t)
  if (named) return readForm(named[1], named[2])
  // Punkt: Q(1 \mid 2 \mid 3); seit Schritt 6 auch Spurpunkte S_x, S_{xy}
  const point = /^([A-Z](?:_\d|_[a-z]|_\{[a-z]+\})?)\((.*)\)$/s.exec(t)
  if (point) {
    const values = point[2].split('\\mid').map(numberOf)
    return values.every((v) => v !== null) ? { shape: 'point', label: point[1], values: values as number[] } : null
  }
  // „Name = Wert" oder nur der Wert (Antworten im geführten Modus)
  const sides = splitTop(t, ' = ')
  if (sides.length > 2) return null
  const [lhs, rhs] = sides.length === 2 ? sides.map((s) => s.trim()) : ['', t]
  const begin = rhs.indexOf(BEGIN)
  if (begin >= 0) {
    // Vektor, auch mit Faktor davor: \frac{1}{\sqrt{14}}\begin{pmatrix} … \end{pmatrix}
    const end = rhs.indexOf(END)
    if (end < 0 || rhs.slice(end + END.length).trim() !== '') return null
    const prefix = rhs.slice(0, begin).trim()
    const factor = prefix === '' ? 1 : numberOf(prefix)
    const entries = rhs.slice(begin + BEGIN.length, end).split('\\\\').map(numberOf)
    if (factor === null || !entries.every((v) => v !== null)) return null
    return { shape: 'vector', label: lhs ? `${lhs} =` : '', values: (entries as number[]).map((x) => factor * x) }
  }
  // zwei Lösungen: t_{1,2} = \pm 3
  if (rhs.startsWith('\\pm')) {
    const v = numberOf(rhs.slice(3))
    const base = /^(.+)_\{1,2\}$/.exec(lhs)
    return v === null || !base ? null : { shape: 'solutions', label: base[1], values: [-v, v] }
  }
  // Winkel in Grad: \varphi = 60^\circ; Zahl mit Einheit: F = 10\,\text{N}
  const degree = rhs.endsWith(DEGREE)
  const unit = UNIT.exec(rhs)
  const body = degree ? rhs.slice(0, -DEGREE.length) : unit ? rhs.slice(0, unit.index) : rhs
  const v = numberOf(body)
  const suffix = degree ? DEGREE : unit ? `\\text{${unit[1]}}` : undefined
  return v === null ? null : { shape: 'number', label: lhs ? `${lhs} =` : '', values: [v], ...(suffix ? { suffix } : {}) }
}

const COLUMN = /^\s*(?:\+\s*([a-z]|\\[a-z]+)\s*)?\\begin\{pmatrix\}(.*?)\\end\{pmatrix\}/s

// Gleichung einer Geraden oder Ebene: Parameterform mit Spalten oder Koordinatenform in x, y, z
function readForm(name: string, body: string): ResultPart | null {
  const sides = splitTop(body, ' = ')
  if (sides.length !== 2) return null
  const [lhs, rhs] = sides.map((s) => s.trim())
  if (lhs === '\\vec x') {
    const values: number[] = []
    const params: string[] = []
    let rest = rhs
    while (rest.trim() !== '') {
      const col = COLUMN.exec(rest)
      // erste Spalte ohne Parameter, jede weitere mit
      if (!col || (values.length === 0) !== !col[1]) return null
      if (values.length > 0) params.push(col[1])
      const entries = col[2].split('\\\\').map(numberOf)
      if (!entries.every((v) => v !== null)) return null
      values.push(...(entries as number[]))
      rest = rest.slice(col[0].length)
    }
    return params.length === 0 ? null : { shape: 'param', label: `${name}\\colon \\vec x =`, values, params }
  }
  const parsed = parseLatex(`${lhs} - (${rhs})`)
  if (!parsed.ok || [...variablesOf(parsed.expr)].some((v) => !['x', 'y', 'z'].includes(v))) return null
  const f = (x: number, y: number, z: number) => evaluate(parsed.expr, { x, y, z })
  const c = f(0, 0, 0)
  const values = [f(1, 0, 0) - c, f(0, 1, 0) - c, f(0, 0, 1) - c, -c]
  return values.every(Number.isFinite) ? { shape: 'equation', label: `${name}\\colon`, values } : null
}

// Ergebnis (LaTeX, auch zwischen $…$) als Teile; t_1 = …, t_2 = … werden zu einem Teil mit zwei Lösungen. null: nicht lesbar
export function readResult(latex: string): ResultPart[] | null {
  const body = latex.trim().replace(/^\$/, '').replace(/\$$/, '')
  const parts: ResultPart[] = []
  for (const piece of splitTop(body, ',\\;')) {
    const part = readPart(piece)
    if (!part) return null
    const prev = parts.at(-1)
    const index = /^(.+)_([12]) =$/.exec(part.label)
    if (part.shape === 'number' && index) {
      // t_1 beginnt zwei Lösungen, t_2 schließt sie ab
      if (index[2] === '1') parts.push({ shape: 'solutions', label: index[1], values: part.values })
      else if (prev?.shape === 'solutions' && prev.label === index[1] && prev.values.length === 1)
        parts[parts.length - 1] = { ...prev, values: [...prev.values, ...part.values] }
      else return null
      continue
    }
    parts.push(part)
  }
  return parts.every((p) => p.shape !== 'solutions' || p.values.length === 2) ? parts : null
}

// ------------------------------------------------------------------ Vergleichen

const close = (a: number, b: number) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b))

// Geraden und Ebenen (Schritt 6): parallel (alle 2 × 2-Unterdeterminanten 0, relativ zur Größe), Kreuzprodukt
const sizeOf = (v: readonly number[]) => Math.max(1e-300, ...v.map(Math.abs))
const isNull = (v: readonly number[]) => v.every((x) => Math.abs(x) < 1e-12)
function parallelN(u: readonly number[], v: readonly number[]): boolean {
  const s = sizeOf(u) * sizeOf(v)
  for (let i = 0; i < u.length; i++) for (let j = i + 1; j < u.length; j++) if (Math.abs(u[i] * v[j] - u[j] * v[i]) > 1e-9 * s) return false
  return true
}
const crossN = (a: readonly number[], b: readonly number[]) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const dotN = (a: readonly number[], b: readonly number[]) => a.reduce((s, x, i) => s + x * b[i], 0)
const subN = (a: readonly number[], b: readonly number[]) => a.map((x, i) => x - b[i])

// Spalten einer Parameterform: Stützvektor, dann die Richtungen
function columns(part: ResultPart, values: readonly number[]): number[][] {
  const k = (part.params?.length ?? 0) + 1
  const dim = values.length / k
  return Array.from({ length: k }, (_, c) => values.slice(c * dim, (c + 1) * dim))
}

// Welche Spalten einer Parameterform passen nicht zur gesuchten Geraden bzw. Ebene: [Stützvektor falsch, Richtungen falsch]
function formFaults(part: ResultPart, a: readonly number[]): readonly [boolean, boolean] {
  const [p, ...dirs] = columns(part, a)
  const [q, ...want] = columns(part, part.values)
  if (dirs.length === 1) {
    const dirOk = !isNull(dirs[0]) && parallelN(dirs[0], want[0])
    return [!parallelN(subN(p, q), want[0]), !dirOk]
  }
  const n = crossN(want[0], want[1])
  const scale = sizeOf(n)
  const inPlane = (v: readonly number[]) => Math.abs(dotN(n, v)) <= 1e-9 * scale * sizeOf(v)
  const dirOk = dirs.every((v) => !isNull(v) && inPlane(v)) && !isNull(crossN(dirs[0], dirs[1])) && parallelN(crossN(dirs[0], dirs[1]), n)
  return [!inPlane(subN(p, q)), !dirOk]
}

// Koordinatenform: gleiches Vielfaches (Faktor ungleich 0), bei exact genau gleich
const proportional = (a: readonly number[], b: readonly number[]) => !isNull(a.slice(0, -1)) && parallelN(a, b)

function sameValues(part: Pick<ResultPart, 'shape' | 'params' | 'exact' | 'values'>, a: readonly number[], b: readonly number[]): boolean {
  if (a.length !== b.length) return false
  if (part.shape === 'param') {
    const target: ResultPart = { ...part, label: '', values: b }
    // falsche Antwort ohne echte Gerade bzw. Ebene (Richtung 0, Richtungen parallel): Mit ihr ist nichts gleich
    const [, ...dirs] = columns(target, b)
    if (dirs.length === 1 ? isNull(dirs[0]) : isNull(crossN(dirs[0], dirs[1]))) return false
    const [p, d] = formFaults(target, a)
    return !p && !d
  }
  if (part.shape === 'equation' && !part.exact) return proportional(a, b)
  if (part.shape !== 'solutions') return a.every((x, i) => close(x, b[i]))
  const sa = [...a].sort((x, y) => x - y)
  const sb = [...b].sort((x, y) => x - y)
  return sa.every((x, i) => close(x, sb[i]))
}

// b ist der gesuchte Teil (bestimmt, was als gleich gilt)
const samePart = (a: ResultPart, b: ResultPart) => a.shape === b.shape && (a.params?.length ?? 0) === (b.params?.length ?? 0) && sameValues(b, a.values, b.values)

// Typischer Fehler zu einem Teil des Ergebnisses: falsche Antwort aus dem Schritt, der diesen Teil liefert
export type PartWrong = { readonly values: readonly number[]; readonly rule: string; readonly why: Explanation }

function wrongsFor(steps: readonly GuidedStep[], part: ResultPart): PartWrong[] {
  const out: PartWrong[] = []
  for (const step of steps) {
    const correct = step.choices.find((c) => c.correct)
    const parts = correct && readResult(correct.content)
    const at = parts ? parts.findIndex((p) => samePart(p, part)) : -1
    if (!parts || at < 0) continue
    for (const choice of step.choices) {
      if (choice.correct || !choice.errorRuleId) continue
      const wrong = readResult(choice.content)
      // eine falsche Antwort mit gleich vielen Teilen; der Teil an derselben Stelle in derselben Form
      const p = wrong && wrong.length === parts.length ? wrong[at] : undefined
      if (p && p.shape === part.shape && p.values.length === part.values.length && !samePart(p, part))
        out.push({ values: p.values, rule: choice.errorRuleId, why: choice.whyWrong ?? vectorErrorRule(choice.errorRuleId).why })
    }
  }
  return out
}

// ------------------------------------------------------------------ fertig?

const gcd = (a: bigint, b: bigint): bigint => (b === 0n ? (a < 0n ? -a : a) : gcd(b, a % b))

function squareFree(n: bigint): boolean {
  for (let p = 2n; p * p <= n; p++) if (n % (p * p) === 0n) return false
  return true
}

const posInt = (e: Expr): bigint | null => (e.kind === 'num' && !e.decimal && e.value.d === 1n && e.value.n > 0n ? e.value.n : null)

// Ganze Zahl k > 0 oder Wurzel √r bzw. k√r mit quadratfreiem r > 1: { k, rad } (rad = 1: ohne Wurzel)
function atom(e: Expr): { readonly k: bigint; readonly rad: bigint } | null {
  const n = posInt(e)
  if (n !== null) return { k: n, rad: 1n }
  const radOf = (r: Expr) => {
    if (r.kind !== 'root' || r.index !== 2) return null
    const rad = posInt(r.arg)
    return rad !== null && rad > 1n && squareFree(rad) ? rad : null
  }
  const rad = radOf(e)
  if (rad !== null) return { k: 1n, rad }
  if (e.kind === 'mul' && e.factors.length === 2) {
    const k = posInt(e.factors[0])
    const r = radOf(e.factors[1])
    if (k !== null && k > 1n && r !== null) return { k, rad: r }
  }
  return null
}

// Fertig ist eine ganze Zahl, eine Dezimalzahl, k√r (r quadratfrei) oder ein gekürzter Bruch daraus mit höchstens einer
// Wurzel, jeweils mit Minus davor; mit der Wurzel im Nenner wie \frac{3}{\sqrt{14}} nur, wenn sich nichts mehr kürzen lässt.
// Nicht fertig: Rechnungen wie 3 - 1, \frac{4}{2}, \sqrt{8}, \frac{\sqrt{2}}{\sqrt{3}}, \frac{2}{\sqrt{2}} (= \sqrt{2})
export function isFinishedNumber(e: Expr): boolean {
  if (e.kind === 'num') return e.decimal === true || e.value.d === 1n
  if (e.kind === 'neg') return e.arg.kind !== 'neg' && isFinishedNumber(e.arg)
  if (e.kind === 'div') {
    const top = e.num.kind === 'neg' ? e.num.arg : e.num
    const n = atom(top)
    const d = atom(e.den)
    if (!n || !d || (n.rad > 1n && d.rad > 1n) || (d.rad === 1n && d.k === 1n)) return false
    // \frac{n}{m\sqrt{r}} = \frac{n\sqrt{r}}{m r}: kürzbar, wenn n mit m oder r einen Teiler gemeinsam hat
    return gcd(n.k, d.k * d.rad) === 1n
  }
  return atom(e) !== null
}

// ------------------------------------------------------------------ Prüfen

// Eingabe je Teil und Eintrag (LaTeX; leer = nichts eingetragen)
export type EntryInput = readonly (readonly string[])[]

type Read = { readonly value: number | null; readonly expr: Expr | null; readonly problem: string | null }

function readEntry(raw: string): Read {
  // ein Gradzeichen oder eine Einheit am Ende darf stehen (die Einheit steht schon hinter dem Kästchen)
  const latex = raw
    .trim()
    .replace(/(\^\{?\\circ\}?|°|\\degree)$/, '')
    .replace(/(\\[,;: ]|\s)*(\\(text|mathrm)\{\s*(N|Nm|J|m)\s*\}|N\s?m|N|J|m)$/, '')
    .trim()
  if (latex === '') return { value: null, expr: null, problem: 'empty' }
  const parsed = parseLatex(latex)
  if (!parsed.ok) return { value: null, expr: null, problem: parsed.message }
  const name = variablesOf(parsed.expr).values().next().value
  if (name !== undefined) return { value: null, expr: null, problem: `Gesucht ist eine Zahl. Was soll $${name}$ bedeuten?` }
  const value = evaluate(parsed.expr, {})
  if (!Number.isFinite(value)) return { value: null, expr: null, problem: 'Diese Zahl ist nicht definiert.' }
  return { value, expr: parsed.expr, problem: null }
}

export type VectorCheck = { readonly parts: readonly ResultPart[]; readonly wrongs: readonly (readonly PartWrong[])[] }

// Art des Winkels falsch gewählt: spitz und stumpf verwechselt oder senkrecht falsch erkannt; Lage dreier Vektoren
// (Schritt 4b): Rechts- und Linkssystem verwechselt oder komplanar falsch erkannt
function choiceWrongs(part: ResultPart): PartWrong[] {
  const idx = part.values[0]
  const set = CHOICE_SETS.find((x) => x.options === part.options) ?? CHOICE_SETS[0]
  return set.options.flatMap((_, j) => {
    if (j === idx) return []
    const rule = vectorErrorRule(set.byChoice?.[j] ?? (j === set.special || idx === set.special ? set.rules[0] : set.rules[1]))
    return [{ values: [j], rule: rule.id, why: rule.why }]
  })
}

export function prepareVectorCheck(task: VectorTask): VectorCheck {
  const read = readResult(task.resultLatex!)
  if (!read) throw new Error(`Ergebnis nicht lesbar: ${task.resultLatex}`)
  // Hessesche Normalform (Schritt 6): nur genau diese Koordinatenform
  const parts = task.kind === 'planeHesse' ? read.map((p) => (p.shape === 'equation' ? { ...p, exact: true } : p)) : read
  return { parts, wrongs: parts.map((p) => (p.shape === 'choice' ? choiceWrongs(p) : wrongsFor(task.steps, p))) }
}

// Auswahl und Zeichen einer Ungleichung sind keine Zahlen: Wert = Nummer der Antwort bzw. +1 für >, −1 für <
const isSymbol = (part: ResultPart, entry: number) => part.shape === 'choice' || (part.shape === 'inequality' && entry === 0)
function readSymbol(text: string, part: ResultPart): Read {
  if (text === '') return { value: null, expr: null, problem: 'empty' }
  const idx = (part.options ?? []).indexOf(text)
  if (idx < 0) return { value: null, expr: null, problem: 'Wähle eine der Antworten.' }
  return { value: part.shape === 'inequality' ? (text === '>' ? 1 : -1) : idx, expr: null, problem: null }
}

const noMarks = (input: EntryInput) => input.map((row) => row.map(() => false))

// Zwei Vektoren als Lösungen (Kreuzprodukt, Schritt 4a: \vec n_1 und \vec n_2 = −\vec n_1): Stelle i des ersten Teils
const vectorPair = (check: VectorCheck): number =>
  check.parts.findIndex((p, i) => {
    const q = check.parts[i + 1]
    // seit Schritt 6 auch zwei Punkte Q_1 und Q_2
    const m1 = /^(.+)_1( =)?$/.exec(p.label)
    return (p.shape === 'vector' || p.shape === 'point') && q?.shape === p.shape && !!m1 && q.label === `${m1[1]}_2${m1[2] ?? ''}`
  })

const swapRows = <T,>(rows: readonly (readonly T[])[], i: number): (readonly T[])[] => rows.map((row, j) => (j === i ? rows[i + 1] : j === i + 1 ? rows[i] : row))

// Die beiden Lösungen dürfen in beliebiger Reihenfolge stehen; nur eine eingetragen: zweite Lösung vergessen
export function checkVectorEntries(check: VectorCheck, input: EntryInput): FreeVerdict {
  const i = vectorPair(check)
  if (i < 0 || input.length !== check.parts.length) return checkEntriesInOrder(check, input)
  const valuesOf = (row: readonly string[]) => row.map((x) => readEntry(x).value)
  const hits = (row: readonly string[], part: ResultPart) => valuesOf(row).filter((v, j) => v !== null && close(v, part.values[j])).length
  const [a, b] = [check.parts[i], check.parts[i + 1]]
  const empty = (row: readonly string[]) => row.every((x) => x.trim() === '')
  for (const [k, other] of [[i, i + 1], [i + 1, i]] as const) {
    if (!empty(input[k]) || empty(input[other])) continue
    if (hits(input[other], a) === a.values.length || hits(input[other], b) === b.values.length) {
      const rule = vectorErrorRule('vec-one-solution')
      return { kind: 'wrong', title: 'Nicht ganz.', error: { id: rule.id, name: rule.name, why: rule.why }, marks: input.map((row, j) => row.map(() => j === k)) }
    }
  }
  if (hits(input[i], b) + hits(input[i + 1], a) <= hits(input[i], a) + hits(input[i + 1], b)) return checkEntriesInOrder(check, input)
  const verdict = checkEntriesInOrder(check, swapRows(input, i))
  return verdict.marks ? { ...verdict, marks: swapRows(verdict.marks, i) } : verdict
}

function checkEntriesInOrder(check: VectorCheck, input: EntryInput): FreeVerdict {
  const reads = input.map((row, i) => row.map((x, j) => (check.parts[i] && isSymbol(check.parts[i], j) ? readSymbol(x, check.parts[i]) : readEntry(x))))
  const flat = reads.flat()
  if (flat.every((r) => r.problem === 'empty')) return { kind: 'unreadable', title: 'Noch nichts eingetragen.', message: 'Trage in jedes Kästchen eine Zahl ein.', marks: noMarks(input) }

  // zwei Lösungen, nur eine eingetragen und die stimmt: zweite Lösung vergessen
  for (const [i, part] of check.parts.entries()) {
    const row = reads[i]
    const filled = row.filter((r) => r.value !== null)
    if (part.shape === 'solutions' && filled.length === 1 && row.some((r) => r.problem === 'empty') && part.values.some((v) => close(v, filled[0].value!))) {
      const rule = vectorErrorRule('vec-one-solution')
      return { kind: 'wrong', title: 'Nicht ganz.', error: { id: rule.id, name: rule.name, why: rule.why }, marks: input.map((r, j) => r.map((x) => j === i && x.trim() === '')) }
    }
  }

  const unread = flat.find((r) => r.problem !== null && r.problem !== 'empty')
  if (flat.some((r) => r.problem !== null)) {
    const marks = reads.map((row) => row.map((r) => r.problem !== null))
    if (unread) return { kind: 'unreadable', title: 'Das kann ich noch nicht lesen.', message: unread.problem!, marks }
    const message = reads.some((row, i) => row.some((r, j) => r.problem !== null && isSymbol(check.parts[i], j))) ? 'Fülle jedes markierte Feld aus.' : 'Trage in jedes markierte Kästchen eine Zahl ein.'
    return { kind: 'unreadable', title: 'Es fehlt noch etwas.', message, marks }
  }

  const values = reads.map((row) => row.map((r) => r.value!))
  // falsche Einträge je Teil; bei zwei Lösungen jede Zahl, die keine Lösung ist (oder doppelt)
  const marks = check.parts.map((part, i) => {
    if (part.shape === 'param') {
      // falsche Spalten markieren: Stützvektor nicht auf der Geraden bzw. Ebene, Richtungen falsch
      const [p, d] = formFaults(part, values[i])
      const dim = part.values.length / ((part.params?.length ?? 0) + 1)
      return values[i].map((_, j) => (j < dim ? p : d))
    }
    if (part.shape === 'equation') {
      if (sameValues(part, values[i], part.values)) return values[i].map(() => false)
      // Zahlen vor x, y, z passen (Vielfaches): nur die rechte Seite markieren
      const coefOk = !part.exact && !isNull(values[i].slice(0, 3)) && parallelN(values[i].slice(0, 3), part.values.slice(0, 3))
      return values[i].map((_, j) => (coefOk ? j === 3 : true))
    }
    if (part.shape !== 'solutions') return values[i].map((v, j) => !close(v, part.values[j]))
    const left = [...part.values]
    return values[i].map((v) => {
      const at = left.findIndex((x) => close(x, v))
      if (at < 0) return true
      left.splice(at, 1)
      return false
    })
  })
  const wrongParts = marks.map((row) => row.some(Boolean))
  if (!wrongParts.some(Boolean)) {
    // richtig: alle Einträge ausgerechnet?
    const open = reads.map((row) => row.map((r) => r.expr !== null && !isFinishedNumber(r.expr)))
    if (open.flat().some(Boolean)) {
      return {
        kind: 'unfinished',
        title: 'Richtig gerechnet, aber noch nicht fertig.',
        message: 'Rechne die markierten Einträge ganz aus: zusammenfassen, Brüche kürzen und aus Wurzeln herausziehen, was geht, z. B. $\\sqrt{8} = 2\\sqrt{2}$.',
        marks: open,
      }
    }
    return { kind: 'correct', title: 'Richtig!' }
  }

  // ungefähr richtig, aber gerundet: genau angeben
  const rounded = reads.some((row, i) =>
    row.some((r, j) => {
      if (!marks[i][j] || r.expr?.kind !== 'num' || !r.expr.decimal) return false
      // bei zwei Lösungen irgendeine, sonst der Eintrag an derselben Stelle
      const part = check.parts[i]
      const targets = part.shape === 'solutions' ? part.values : [part.values[j]]
      return targets.some((x) => Math.abs(x - r.value!) <= 0.01 * Math.max(1, Math.abs(x)))
    }),
  )
  // Richtung einer Kraft (α ab der x-Achse, Schritt 3b) mit demselben Pfeil, aber nicht zwischen 0° und 360°
  // (z. B. −30° statt 330°); nur, wenn sonst alles stimmt
  const wrongCount = marks.flat().filter(Boolean).length
  const turned =
    wrongCount === 1 &&
    reads.some((row, i) =>
      row.some((r, j) => {
        const part = check.parts[i]
        if (!marks[i][j] || part.suffix !== DEGREE || !part.label.startsWith('\\alpha') || r.value === null) return false
        const diff = (r.value - part.values[j]) / 360
        return Math.abs(diff - Math.round(diff)) < 1e-9
      }),
    )
  if (turned)
    return { kind: 'unfinished', title: 'Fast: Richtung stimmt.', message: 'Gib den Winkel zwischen $0^\\circ$ und $360^\\circ$ an, gegen den Uhrzeigersinn ab der positiven $x$-Achse gemessen.', marks }

  if (rounded)
    return { kind: 'unfinished', title: 'Fast: Das ist gerundet.', message: 'Gib den Wert genau an, als Bruch oder mit Wurzel, z. B. $\\frac{1}{3}$ statt $0{,}33$.', marks }

  // typischer Fehler: ein falscher Teil (der erste, zu dem einer passt) ist eine falsche Antwort seines Schritts
  const match = check.parts
    .map((part, i) => (wrongParts[i] ? check.wrongs[i].find((w) => sameValues(part, values[i], w.values)) : undefined))
    .find((w) => w !== undefined)
  if (match) {
    const rule = vectorErrorRule(match.rule)
    return { kind: 'wrong', title: 'Nicht ganz.', error: { id: rule.id, name: rule.name, why: match.why }, marks }
  }
  // Hessesche Normalform (Schritt 6), wenn keine falsche Antwort des Schritts passt: dieselbe Ebene, aber nicht normiert (Faktor nicht ±1) oder nur rechts negativ (−1)
  const hesse = check.parts.findIndex((part, i) => wrongParts[i] && part.shape === 'equation' && part.exact && proportional(values[i], part.values))
  if (hesse >= 0) {
    const part = check.parts[hesse]
    const at = part.values.findIndex((x) => Math.abs(x) > 1e-12)
    const k = values[hesse][at] / part.values[at]
    const rule = vectorErrorRule(close(k, -1) ? 'gl-hesse-d-sign' : 'gl-hesse-not-normed')
    return { kind: 'wrong', title: 'Nicht ganz.', error: { id: rule.id, name: rule.name, why: rule.why }, marks }
  }

  const count = marks.flat().filter(Boolean).length
  const total = marks.flat().length
  const message =
    total === 1
      ? 'Rechne noch einmal nach. Wenn du nicht weiterkommst, helfen dir der Tipp, der Lösungsweg oder der geführte Modus.'
      : `${count === 1 ? 'Ein Eintrag stimmt' : `${count} Einträge stimmen`} noch nicht, ${count === 1 ? 'er ist' : 'sie sind'} markiert. Rechne ${count === 1 ? 'ihn' : 'sie'} noch einmal nach.`
  return { kind: 'wrong', title: 'Das stimmt noch nicht.', message, marks }
}

// ------------------------------------------------------------------ Anschluss

// Zieh-Aufgabe ohne eindeutiges Ergebnis (Schritt 2b): die gezogene Stelle prüfen wie im geführten Modus
export function checkVectorDrag(drag: DragStep, at: readonly number[]): FreeVerdict {
  const v = judgeDrag(drag, at)
  if (v.kind === 'invalid') return { kind: 'unreadable', title: 'So geht es nicht.', message: v.note }
  const lines = v.lines.map((l) => `$${l.latex}$ ${l.ok ? '✓' : '✗'}`).join('\n')
  if (v.kind === 'correct') return { kind: 'correct', title: 'Richtig!', message: lines }
  if (v.kind === 'error') {
    const rule = vectorErrorRule(v.rule)
    return { kind: 'wrong', title: 'Nicht ganz.', message: lines, error: { id: rule.id, name: rule.name, why: drag.whys[v.rule] ?? rule.why } }
  }
  return { kind: 'wrong', title: 'Das stimmt noch nicht.', message: lines }
}

export function prepareVectorFreeTask(ref: TaskRef): FreeTask {
  const task = buildVectorTask(ref)
  const drag = task.steps[0]?.drag
  if (task.dragOnly && drag)
    return {
      answerLabel: '',
      inputLabel: 'Deine Stelle',
      keyboard: { kind: 'vector' },
      drag,
      checkDrag: (at) => checkVectorDrag(drag, at),
      check: () => ({ kind: 'unreadable', title: 'Zieh im Bild.' }),
    }
  const check = prepareVectorCheck(task)
  return {
    answerLabel: '',
    inputLabel: 'Dein Ergebnis',
    // Wurzel-Taste immer: Sonst verriete die Tastatur, ob das Ergebnis eine Wurzel hat
    keyboard: { kind: 'vector' },
    entries: check.parts.map((p) => ({
      shape: p.shape,
      label: p.label,
      count: p.values.length,
      ...(p.options ? { options: p.options } : {}),
      ...(p.suffix ? { suffix: p.suffix } : {}),
      ...(p.params ? { params: p.params } : {}),
    })),
    checkEntries: (input) => checkVectorEntries(check, input),
    check: (latex) => checkVectorEntries(check, [[latex]]),
  }
}
