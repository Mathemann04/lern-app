import type { Explanation } from '../explain/texts.ts'
import type { DrawColor } from './figures.ts'

// Zieh-Aufgaben (M7 Schritt 2b, docs/PLAN-M7.md, „Pfeil ziehen"): Die Spitze eines Pfeils oder ein Punkt wird in der
// Ebene gezogen und rastet auf ganzen Zahlen ein (oder auf ganzen Werten eines Parameters entlang einer Geraden). Die
// Engine prüft die Stelle p gegen Bedingungen und erkennt typische Fehler. Alles reine Daten, damit dieselbe Nummer
// dieselbe Aufgabe baut; die Prüfung rechnet mit ganzen Zahlen, also exakt.

export type Relation = '=' | '<' | '>'

// Bedingung an die Stelle p (Spitze oder Punkt):
// - quadratic: lin · p + quad · |p|² + c0 rel target. side ist die linke Seite in Formeln (z. B. \vec a \cdot \vec b);
//   dotWith: Die Seite ist das Skalarprodukt dieses Vektors mit p − from, die Rückmeldung zeigt die Rechnung;
//   lengthOf: Die Seite ist |p − from|², die Rückmeldung zeigt die Quadrate
// - angle: Der Winkel zwischen p − from und with ist deg Grad
export type DragCondition =
  | {
      readonly kind: 'quadratic'
      readonly lin: readonly number[]
      readonly quad: number
      readonly c0: number
      readonly rel: Relation
      readonly target: number
      readonly side: string
      readonly dotWith?: readonly number[]
      readonly lengthOf?: true
    }
  | { readonly kind: 'angle'; readonly with: readonly number[]; readonly deg: number; readonly side: string }

// Typischer Fehler: greift, wenn die Aufgabe nicht erfüllt ist, aber alle seine Bedingungen
export type DragTrap = { readonly conditions: readonly DragCondition[]; readonly rule: string }

// Parameter entlang einer Geraden: p = base + t · dir mit ganzem t von tmin bis tmax
export type DragLine = { readonly base: readonly number[]; readonly dir: readonly number[]; readonly param: string; readonly tmin: number; readonly tmax: number }

export type DragFrame = { readonly xmin: number; readonly xmax: number; readonly ymin: number; readonly ymax: number }

export type DragStep = {
  // arrow: Pfeil von from zur Stelle; point: Punkt an der Stelle, mit Strecken zu links
  readonly mode: 'arrow' | 'point'
  // Name (LaTeX), z. B. \vec b oder C
  readonly name: string
  readonly color: DrawColor
  readonly from: readonly number[]
  readonly links?: readonly (readonly number[])[]
  // Beim Ziehen mitlaufend: Winkelbogen zwischen diesem Vektor und p − from (Stufe 1 und 2)
  readonly liveAngle?: readonly number[]
  // Beim Ziehen mitlaufend: Pfeil of + p − from (Summe) und Strecke von p zu dessen Spitze (Differenz), Stufe 5
  readonly liveSum?: readonly number[]
  readonly liveDiff?: readonly number[]
  readonly start: readonly number[]
  readonly frame: DragFrame
  readonly line?: DragLine
  readonly conditions: readonly DragCondition[]
  // Stellen, an denen die Aufgabe nicht sinnvoll ist (z. B. Nullvektor): Hinweis, kein Fehler
  readonly forbidden: readonly { readonly at: readonly number[]; readonly note: string }[]
  readonly traps: readonly DragTrap[]
  // eine richtige Stelle (für „Lösung zeigen")
  readonly solution: readonly number[]
  // „Warum ist das falsch?" je typischem Fehler
  readonly whys: Readonly<Record<string, Explanation>>
}

export type DragVerdict =
  | { readonly kind: 'correct'; readonly lines: readonly DragLineReport[] }
  | { readonly kind: 'error'; readonly rule: string; readonly lines: readonly DragLineReport[] }
  | { readonly kind: 'wrong'; readonly lines: readonly DragLineReport[] }
  | { readonly kind: 'invalid'; readonly note: string }

// Eine Zeile der Rückmeldung: Rechnung mit der gezogenen Stelle (LaTeX) und ob die Bedingung stimmt
export type DragLineReport = { readonly latex: string; readonly ok: boolean }

const dot = (a: readonly number[], b: readonly number[]) => a.reduce((s, x, i) => s + x * b[i], 0)
const sub = (a: readonly number[], b: readonly number[]) => a.map((x, i) => x - b[i])
const same = (a: readonly number[], b: readonly number[]) => a.every((x, i) => x === b[i])
const num = (x: number) => (x < 0 ? `-${Math.abs(x)}` : String(x))
const factor = (x: number) => (x < 0 ? `(${num(x)})` : num(x))

export const sideValue = (c: Extract<DragCondition, { kind: 'quadratic' }>, p: readonly number[]) => dot(c.lin, p) + c.quad * dot(p, p) + c.c0

function angleOf(c: Extract<DragCondition, { kind: 'angle' }>, v: readonly number[]): number | null {
  const n = Math.hypot(...v) * Math.hypot(...c.with)
  if (n === 0) return null
  return (Math.acos(Math.max(-1, Math.min(1, dot(v, c.with) / n))) * 180) / Math.PI
}

export function holds(c: DragCondition, p: readonly number[], from: readonly number[]): boolean {
  if (c.kind === 'angle') {
    const v = sub(p, from)
    // exakt mit ganzen Zahlen: cos² φ · |v|² |w|² = (v · w)², dazu das Vorzeichen
    const d = dot(v, c.with)
    const n2 = dot(v, v) * dot(c.with, c.with)
    if (n2 === 0) return false
    const cos = Math.cos((c.deg * Math.PI) / 180)
    if (Math.abs(cos) < 1e-12) return d === 0
    if (Math.sign(d) !== Math.sign(cos)) return false
    // cos² ist bei den Winkeln der Aufgaben 1/4, 1/2 oder 3/4: 4 d² = k · n2
    const k = Math.round(4 * cos * cos)
    return 4 * d * d === k * n2
  }
  const s = sideValue(c, p)
  return c.rel === '=' ? s === c.target : c.rel === '<' ? s < c.target : s > c.target
}

// Rechnung der Rückmeldung mit der gezogenen Stelle
export function reportLine(c: DragCondition, p: readonly number[], from: readonly number[]): DragLineReport {
  const ok = holds(c, p, from)
  const v = sub(p, from)
  if (c.kind === 'angle') {
    const phi = angleOf(c, v)
    const shown = phi === null ? '' : Math.abs(phi - Math.round(phi)) < 1e-9 ? `= ${Math.round(phi)}^\\circ` : `\\approx ${(Math.round(phi * 10) / 10).toString().replace('.', '{,}')}^\\circ`
    return { latex: `${c.side} ${shown}`, ok }
  }
  const s = sideValue(c, p)
  let middle = ''
  if (c.dotWith) middle = ` = ${c.dotWith.map((x, i) => `${factor(x)} \\cdot ${factor(v[i])}`).join(' + ')}`
  else if (c.lengthOf) middle = ` = ${v.map((x) => `${factor(x)}^2`).join(' + ')}`
  // Wert, dahinter der Vergleich mit dem Ziel (nichts, wenn der Wert das Ziel ist)
  const tail = s === c.target ? '' : c.rel === '=' ? ` \\neq ${num(c.target)}` : ` ${s < c.target ? '<' : '>'} ${num(c.target)}`
  return { latex: `${c.side}${middle} = ${num(s)}${tail}`, ok }
}

export function judgeDrag(step: DragStep, p: readonly number[]): DragVerdict {
  const blocked = step.forbidden.find((f) => same(f.at, p))
  if (blocked) return { kind: 'invalid', note: blocked.note }
  const lines = step.conditions.map((c) => reportLine(c, p, step.from))
  if (lines.every((l) => l.ok)) return { kind: 'correct', lines }
  const trap = step.traps.find((t) => t.conditions.every((c) => holds(c, p, step.from)))
  return trap ? { kind: 'error', rule: trap.rule, lines } : { kind: 'wrong', lines }
}

// Alle Stellen, an die man ziehen kann (Gitter im Rahmen bzw. alle ganzen t)
export function dragPositions(step: DragStep): (readonly number[])[] {
  if (step.line) {
    const { base, dir, tmin, tmax } = step.line
    return Array.from({ length: tmax - tmin + 1 }, (_, i) => base.map((x, k) => x + (tmin + i) * dir[k]))
  }
  const out: number[][] = []
  for (let x = step.frame.xmin; x <= step.frame.xmax; x++) for (let y = step.frame.ymin; y <= step.frame.ymax; y++) out.push([x, y])
  return out
}

export const dragSolutions = (step: DragStep) => dragPositions(step).filter((p) => judgeDrag(step, p).kind === 'correct')

// Parameter t einer Stelle auf der Geraden
export const paramOf = (line: DragLine, p: readonly number[]) => dot(sub(p, line.base), line.dir) / dot(line.dir, line.dir)

// Nächste erlaubte Stelle zu einem Punkt der Ebene (Finger oder Maus): runden und im Rahmen halten
export function snapDrag(step: DragStep, world: readonly number[]): readonly number[] {
  if (step.line) {
    const { base, dir, tmin, tmax } = step.line
    const t = Math.max(tmin, Math.min(tmax, Math.round(paramOf(step.line, world))))
    return base.map((x, k) => x + t * dir[k])
  }
  const { xmin, xmax, ymin, ymax } = step.frame
  return [Math.max(xmin, Math.min(xmax, Math.round(world[0]))), Math.max(ymin, Math.min(ymax, Math.round(world[1])))]
}
