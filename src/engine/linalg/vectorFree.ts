import type { FreeTask, FreeVerdict } from '../check/freeTask.ts'
import { variablesOf } from '../check/answer.ts'
import type { Explanation } from '../explain/texts.ts'
import { evaluate } from '../expr/evaluate.ts'
import type { Expr } from '../expr/types.ts'
import type { GuidedStep } from '../guided/types.ts'
import { parseLatex } from '../parse/latex.ts'
import type { TaskRef } from '../tasks/taskNumber.ts'
import { vectorErrorRule } from './errorRules.ts'
import { ANGLE_TYPES } from './dotTasks.ts'
import { type VectorTask, buildVectorTask } from './vectorTasks.ts'

// Freier Modus der Tätigkeit „Vektoren" (M7 Schritt 1b): Das Ergebnis wird je Eintrag in ein eigenes Kästchen getippt
// (Vektor als Spalte, Punkt als Zeile, eine Zahl, zwei Lösungen in beliebiger Reihenfolge). Was gesucht ist, liest die
// Engine aus dem Ergebnis der Aufgabe (resultLatex, gebaut aus vec.ts), die typischen Fehler aus den falschen Antworten
// des Schritts, der dieses Ergebnis liefert. Jeder Eintrag wird einzeln geprüft und falsche werden markiert.

// Seit Schritt 2 (Skalarprodukt): choice ist eine Auswahl (spitz, rechtwinklig, stumpf; Wert = Nummer der Antwort),
// inequality eine Ungleichung wie t > 3/2 (Werte: +1 für >, −1 für <, dann die Grenze)
export type EntryShape = 'vector' | 'point' | 'number' | 'solutions' | 'choice' | 'inequality'

// Ein Teil des Ergebnisses: label ist LaTeX (vor den Kästchen: „\overrightarrow{AB} =", „Q", „\lvert \vec a \rvert =", „t");
// options: die Antworten einer Auswahl bzw. die Zeichen einer Ungleichung; suffix: LaTeX nach dem Kästchen (Grad)
export type ResultPart = {
  readonly shape: EntryShape
  readonly label: string
  readonly values: readonly number[]
  readonly options?: readonly string[]
  readonly suffix?: string
}

export const RELATIONS = ['<', '>'] as const
const DEGREE = '^\\circ'

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
  // Art des Winkels: \text{spitz}
  const word = /^\\text\{(\w+)\}$/.exec(t)
  if (word) {
    const idx = ANGLE_TYPES.indexOf(word[1] as (typeof ANGLE_TYPES)[number])
    return idx < 0 ? null : { shape: 'choice', label: '', values: [idx], options: ANGLE_TYPES }
  }
  // Ungleichung für einen Parameter: t > \frac{3}{2}
  const ineq = /^([a-z]|\\lambda) ([<>]) (.+)$/s.exec(t)
  if (ineq) {
    const v = numberOf(ineq[3])
    return v === null ? null : { shape: 'inequality', label: ineq[1], values: [ineq[2] === '>' ? 1 : -1, v], options: RELATIONS }
  }
  // Punkt: Q(1 \mid 2 \mid 3)
  const point = /^([A-Z](?:_\d)?)\((.*)\)$/s.exec(t)
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
  // Winkel in Grad: \varphi = 60^\circ
  const degree = rhs.endsWith(DEGREE)
  const v = numberOf(degree ? rhs.slice(0, -DEGREE.length) : rhs)
  return v === null ? null : { shape: 'number', label: lhs ? `${lhs} =` : '', values: [v], ...(degree ? { suffix: DEGREE } : {}) }
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

function sameValues(shape: EntryShape, a: readonly number[], b: readonly number[]): boolean {
  if (a.length !== b.length) return false
  if (shape !== 'solutions') return a.every((x, i) => close(x, b[i]))
  const sa = [...a].sort((x, y) => x - y)
  const sb = [...b].sort((x, y) => x - y)
  return sa.every((x, i) => close(x, sb[i]))
}

const samePart = (a: ResultPart, b: ResultPart) => a.shape === b.shape && sameValues(a.shape, a.values, b.values)

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
  // ein Gradzeichen am Ende darf stehen (die Einheit steht schon hinter dem Kästchen)
  const latex = raw.trim().replace(/(\^\{?\\circ\}?|°|\\degree)$/, '').trim()
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

// Art des Winkels falsch gewählt: spitz und stumpf verwechselt oder senkrecht falsch erkannt
function choiceWrongs(part: ResultPart): PartWrong[] {
  const idx = part.values[0]
  return ANGLE_TYPES.flatMap((_, j) => {
    if (j === idx) return []
    const rule = vectorErrorRule(j === 1 || idx === 1 ? 'vec-angle-zero' : 'vec-angle-sign')
    return [{ values: [j], rule: rule.id, why: rule.why }]
  })
}

export function prepareVectorCheck(task: VectorTask): VectorCheck {
  const parts = readResult(task.resultLatex!)
  if (!parts) throw new Error(`Ergebnis nicht lesbar: ${task.resultLatex}`)
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

export function checkVectorEntries(check: VectorCheck, input: EntryInput): FreeVerdict {
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
  if (rounded)
    return { kind: 'unfinished', title: 'Fast: Das ist gerundet.', message: 'Gib den Wert genau an, als Bruch oder mit Wurzel, z. B. $\\frac{1}{3}$ statt $0{,}33$.', marks }

  // typischer Fehler: ein falscher Teil (der erste, zu dem einer passt) ist eine falsche Antwort seines Schritts
  const match = check.parts
    .map((part, i) => (wrongParts[i] ? check.wrongs[i].find((w) => sameValues(part.shape, values[i], w.values)) : undefined))
    .find((w) => w !== undefined)
  if (match) {
    const rule = vectorErrorRule(match.rule)
    return { kind: 'wrong', title: 'Nicht ganz.', error: { id: rule.id, name: rule.name, why: match.why }, marks }
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

export function prepareVectorFreeTask(ref: TaskRef): FreeTask {
  const task = buildVectorTask(ref)
  const check = prepareVectorCheck(task)
  return {
    answerLabel: '',
    inputLabel: 'Dein Ergebnis',
    // Wurzel-Taste immer: Sonst verriete die Tastatur, ob das Ergebnis eine Wurzel hat
    keyboard: { kind: 'vector' },
    entries: check.parts.map((p) => ({ shape: p.shape, label: p.label, count: p.values.length, ...(p.options ? { options: p.options } : {}), ...(p.suffix ? { suffix: p.suffix } : {}) })),
    checkEntries: (input) => checkVectorEntries(check, input),
    check: (latex) => checkVectorEntries(check, [[latex]]),
  }
}
