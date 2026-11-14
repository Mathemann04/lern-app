// TEMPORÄR: unabhängige Prüfung (wird gelöscht)
import { it } from 'vitest'
import { writeFileSync } from 'node:fs'
import { LEVELS, blockSeed } from '../tasks/taskNumber.ts'
import { buildVectorTask, type VectorTask } from './vectorTasks.ts'
import type { VectorDrawing } from './figures.ts'
import { type Val, type Env, sameVal, splitTop, tryEval, varsOf } from './tmpReviewEval.ts'

const BLOCKS = ['rechnen', 'skalar', 'projektion', 'kraefte', 'kreuz', 'spat', 'basis', 'gerade', 'ebene', 'lage', 'abstand', 'schnittwinkel', 'matrix', 'determinante', 'gauss', 'einsetzen', 'cramer', 'lgsparam', 'inverse', 'matgleichung']
const N = Number(process.env.REVIEW_N ?? 30)
const OFFSET = Number(process.env.REVIEW_OFFSET ?? 700)

const SEPS = [',\\;', '\\quad', '\\qquad', '\\Rightarrow', '\\Leftrightarrow', '\\iff', '\\implies', '\\text', '\\colon', '\\in ', '\\le', '\\ge', '\\neq', '\\ne', '\\approx', '\\to', '\\pm', '\\leftrightarrow', '<', '>', ';', '=']
const mathSegs = (s: string) => [...s.matchAll(/\$([^$]+)\$/g)].map((m) => m[1])
const simpleVar = (v: string) => /^([a-z]|\\[a-z]+)(_\{?[0-9a-z]+\}?)?$/.test(v) && !v.startsWith('\\vec') && !v.startsWith('\\overrightarrow')

function rnd(i: number, k: number) {
  return -1.7 + ((i * 7919 + k * 104729) % 1000) / 293
}
let GIVEN: Env = {}
const givenName = (v: string) => v in GIVEN || /^\\overrightarrow\{(\S+) (\S+)\}$/.test(v) && (() => { const m = /^\\overrightarrow\{(\S+) (\S+)\}$/.exec(v)!; return `pt:${m[1]}` in GIVEN && `pt:${m[2]}` in GIVEN })()
function givenEnv(latexes: string[]): Env {
  const env: Env = {}
  for (const l of latexes)
    for (const piece of splitTop(l, [',\\;', '\\quad', '\\text'])) {
      const chain = splitTop(piece.piece, ['='])
      if (chain.length === 2) {
        const vs = varsOf(chain[0].piece)!
        const last = chain[1].piece.trim()
        if (vs.length === 1 && /^\\begin\{pmatrix\}.*\\end\{pmatrix\}$/s.test(last) && !/\\begin\{pmatrix\}.*\\begin/s.test(last)) {
          const name = vs[0]
          const v = tryEval(last, {})
          const chk = tryEval(chain[0].piece, { [name]: 7 }); if (v && chk && chk.r === 1 && chk.c === 1 && chk.a[0][0] === 7) env[name] = v
        }
      }
      for (const m of piece.piece.matchAll(/(?:^|[\s,])([A-Z])\s*\(([^()]*\\mid[^()]*)\)/g)) {
        const coords = m[2].split('\\mid').map((x) => tryEval(x, {}))
        if (coords.every((c) => c && c.r === 1 && c.c === 1)) env[`pt:${m[1]}`] = { r: coords.length, c: 1, a: coords.map((c) => [c!.a[0][0]]) }
      }
    }
  return env
}
function envFor(vars: string[], k: number): Env {
  const e: Env = {}
  vars.forEach((v, i) => (e[v] = rnd(i + 1, k)))
  return e
}

// zwei Stücke gleich? 'yes' | 'no' | 'skip'
function compare(x: string, y: string, approx: boolean, chainLen = 3, useGiven = true): 'yes' | 'no' | 'skip' {
  const deg = /\\circ/.test(x + y)
  const G = useGiven ? GIVEN : {}
  const own = (v: string) => !(useGiven && givenName(v))
  const vx = varsOf(x)!.filter(own)
  const vy = varsOf(y)!.filter(own)
  if (vx.join() !== vy.join()) return 'skip'
  if (!vx.every(simpleVar)) return 'skip'
  if (vx.length > 0 && chainLen <= 2) return 'skip'
  const envs = vx.length === 0 ? [G] : [1, 2, 3].map((k) => ({ ...G, ...envFor(vx, k) }))
  for (const env of envs) {
    const a = tryEval(x, env, deg)
    const b = tryEval(y, env, deg)
    if (!a || !b) return 'skip'
    if (approx) {
      if (a.r !== b.r || a.c !== b.c) return 'no'
      const dec = /\{,\}(\d+)/.exec(y)?.[1].length ?? /\{,\}(\d+)/.exec(x)?.[1].length ?? 0
      const tol = 0.5 * 10 ** -dec * 1.001 + 1e-9
      if (!a.a.every((r, i) => r.every((v, j) => Math.abs(v - b.a[i][j]) <= tol))) return 'no'
    } else if (!sameVal(a, b, 1e-7)) return 'no'
  }
  return 'yes'
}

function chainProblems(latex: string): string[] {
  const out: string[] = []
  const parts = splitTop(latex, SEPS)
  for (let i = 1; i < parts.length; i++) {
    const sep = parts[i].sep
    if (sep !== '=' && sep !== '\\approx') continue
    const r = compare(parts[i - 1].piece, parts[i].piece, sep === '\\approx', parts.length)
    if (r === 'no') out.push(`${parts[i - 1].piece.trim()}  ${sep}  ${parts[i].piece.trim()}`)
  }
  return out
}

// Wert einer Antwort: Gerüst + Stücke
type Sig = { skel: string; pieces: string[][] }
function sig(content: string): Sig {
  return { skel: content.replace(/\$[^$]+\$/g, '$M$'), pieces: mathSegs(content).map((m) => splitTop(m, SEPS).map((p) => p.sep + '\u0000' + p.piece.trim())) }
}
function sameChoice(a: string, b: string): boolean {
  const x = sig(a)
  const y = sig(b)
  if (x.skel !== y.skel || x.pieces.length !== y.pieces.length) return false
  if (x.pieces.length === 0) return a === b
  return x.pieces.every((pa, i) => {
    const pb = y.pieces[i]
    if (pa.length !== pb.length) return false
    return pa.every((p, j) => {
      const [sa, ta] = p.split('\u0000')
      const [sb, tb] = pb[j].split('\u0000')
      if (sa !== sb) return false
      if (ta === tb) return true
      return compare(ta, tb, false, 3, false) === 'yes'
    })
  })
}

// Gerade/Ebene: "name\colon \vec x = p + t u (+ s v)" oder "name\colon ax + by + cz = d"
type Geo = { kind: 'param'; p: number[]; dirs: number[][] } | { kind: 'coord'; c: number[] }
function geoOf(content: string): Geo | null {
  const segs = mathSegs(content)
  if (segs.length !== 1) return null
  const m = /^\s*[A-Za-z](?:_\{?\d\}?)?\s*\\colon\s*(.*)$/s.exec(segs[0])
  if (!m) return null
  const sides = splitTop(m[1], ['='])
  if (sides.length !== 2) return null
  const [lhs, rhs] = sides.map((s) => s.piece.trim())
  if (lhs === '\\vec x') {
    const vs = varsOf(rhs)!.filter((v) => v !== '')
    if (vs.length < 1 || vs.length > 2 || !vs.every(simpleVar)) return null
    const at = (vals: number[]) => tryEval(rhs, Object.fromEntries(vs.map((v, i) => [v, vals[i]])))
    const p0 = at(vs.map(() => 0))
    if (!p0) return null
    const p = p0.a.map((r) => r[0])
    const dirs = vs.map((_, i) => at(vs.map((__, j) => (i === j ? 1 : 0)))!.a.map((r, k) => r[0] - p[k]))
    return { kind: 'param', p, dirs }
  }
  const f = (x: number, y: number, z: number) => {
    const a = tryEval(lhs, { x, y, z })
    const b = tryEval(rhs, { x, y, z })
    return a && b ? a.a[0][0] - b.a[0][0] : NaN
  }
  const c0 = f(0, 0, 0)
  const c = [f(1, 0, 0) - c0, f(0, 1, 0) - c0, f(0, 0, 1) - c0, -c0]
  return c.every(Number.isFinite) ? { kind: 'coord', c } : null
}
const crossN = (a: number[], b: number[]) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const dotN = (a: number[], b: number[]) => a.reduce((s, x, i) => s + x * b[i], 0)
const normN = (a: number[]) => Math.sqrt(dotN(a, a))
const par = (a: number[], b: number[]) => {
  for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) if (Math.abs(a[i] * b[j] - a[j] * b[i]) > 1e-9 * (1 + normN(a) * normN(b))) return false
  return normN(a) > 1e-12 && normN(b) > 1e-12
}
function sameGeo(a: Geo, b: Geo): boolean {
  if (a.kind === 'coord' && b.kind === 'coord') return par(a.c, b.c)
  if (a.kind === 'param' && b.kind === 'param') {
    if (a.dirs.length !== b.dirs.length || a.p.length !== b.p.length) return false
    const diff = a.p.map((x, i) => x - b.p[i])
    if (a.dirs.length === 1) return par(a.dirs[0], b.dirs[0]) && (normN(diff) < 1e-9 || par(diff, a.dirs[0]))
    const n = crossN(a.dirs[0], a.dirs[1])
    if (normN(n) < 1e-12 || normN(crossN(b.dirs[0], b.dirs[1])) < 1e-12) return false
    return par(n, crossN(b.dirs[0], b.dirs[1])) && Math.abs(dotN(n, diff)) < 1e-9 * (1 + normN(n) * normN(diff))
  }
  // Ebene param vs coord
  const P = a.kind === 'param' ? a : (b as Extract<Geo, { kind: 'param' }>)
  const C = a.kind === 'coord' ? a : (b as Extract<Geo, { kind: 'coord' }>)
  if (P.dirs.length !== 2 || P.p.length !== 3) return false
  const n = C.c.slice(0, 3)
  return P.dirs.every((d) => Math.abs(dotN(n, d)) < 1e-9) && Math.abs(dotN(n, P.p) - C.c[3]) < 1e-9 && normN(crossN(P.dirs[0], P.dirs[1])) > 1e-9
}

// Namen und Werte aus Formeln: Vektoren "NAME = pmatrix" (letztes Stück der Kette), Punkte "NAME(x \mid y)"
function definitions(lines: string[]) {
  const vecs = new Map<string, number[]>()
  const pts = new Map<string, number[]>()
  for (const l of lines) {
    for (const piece of splitTop(l, [',\\;', '\\quad', '\\text'])) {
      const chain = splitTop(piece.piece, ['='])
      if (chain.length >= 2) {
        const name = chain[0].piece.trim()
        const last = chain[chain.length - 1].piece.trim()
        if (/^\\begin\{pmatrix\}[^&]*\\end\{pmatrix\}$/s.test(last)) {
          const v = tryEval(last, {})
          if (v && v.c === 1) vecs.set(name, v.a.map((r) => r[0]))
        }
      }
      for (const m of piece.piece.matchAll(/(?:^|[\s,])([A-Z](?:'|_\{?[0-9a-z]+\}?)?)\s*\(([^()]*\\mid[^()]*)\)/g)) {
        const coords = m[2].split('\\mid').map((s) => tryEval(s, {}))
        if (coords.every((c) => c && c.r === 1 && c.c === 1)) pts.set(m[1], coords.map((c) => c!.a[0][0]))
      }
    }
  }
  return { vecs, pts }
}

function drawingProblems(d: VectorDrawing | undefined, defs: ReturnType<typeof definitions>, where: string): string[] {
  if (!d) return []
  const out: string[] = []
  const all = [d, ...(d.slider ? [] : [])]
  for (const dr of all) {
    for (const a of dr.arrows) {
      for (const x of [...a.from, ...a.to]) if (!Number.isFinite(x)) out.push(`${where}: Pfeil nicht endlich`)
      if (!a.label) continue
      const v = defs.vecs.get(a.label)
      if (!v || v.length !== a.to.length) continue
      const dv = a.to.map((x, i) => x - a.from[i])
      const ok = normN(v) < 1e-12 ? normN(dv) < 1e-9 : par(dv, v) && dotN(dv, v) > 0
      if (!ok) out.push(`${where}: Pfeil ${a.label} = (${dv.map((x) => +x.toFixed(4))}) passt nicht zu (${v.map((x) => +x.toFixed(4))})`)
    }
    for (const p of dr.points) {
      for (const x of p.at) if (!Number.isFinite(x)) out.push(`${where}: Punkt nicht endlich`)
      if (!p.label) continue
      const v = defs.pts.get(p.label)
      if (!v || v.length !== p.at.length) continue
      if (!v.every((x, i) => Math.abs(x - p.at[i]) < 1e-6)) out.push(`${where}: Punkt ${p.label} bei (${p.at.map((x) => +x.toFixed(4))}) statt (${v.map((x) => +x.toFixed(4))})`)
    }
  }
  return out
}

it('unabhängige Prüfung', () => {
  const report: string[] = []
  let count = 0
  const stats: Record<string, number> = {}
  for (const block of BLOCKS)
    for (const level of LEVELS)
      for (let s = OFFSET + 1; s <= OFFSET + N; s++) {
        let task: VectorTask
        const id = `${block}.${level}-${s}`
        try {
          task = buildVectorTask({ level, seed: blockSeed(block, s) })
        } catch (e) {
          report.push(`${id}: FEHLER beim Bauen ${(e as Error).message}`)
          continue
        }
        count++
        const tag = `${id} [${task.kind}]`
        GIVEN = givenEnv([task.functionLatex ?? '', ...mathSegs(task.instruction ?? '')])
        stats.given = (stats.given ?? 0) + Object.keys(GIVEN).length
        const lines: string[] = []
        const est = (st: { established?: string | readonly string[] }) => (st.established === undefined ? [] : typeof st.established === 'string' ? [st.established] : [...st.established])
        lines.push(task.functionLatex ?? '')
        if (task.resultLatex) lines.push(task.resultLatex)
        for (const st of task.steps) {
          const L = [...est(st), ...mathSegs(st.explanation.detailed), ...mathSegs(st.explanation.short)]
          const correct = st.choices.filter((c) => c.correct)
          if (!st.multi && correct.length !== 1 && st.choices.length > 0) report.push(`${tag} Schritt ${st.id}: ${correct.length} richtige`)
          for (const c of correct) L.push(...mathSegs(c.content))
          for (const l of L) for (const p of chainProblems(l)) report.push(`${tag} Schritt ${st.id}: Kette falsch: ${p}`)
          lines.push(...est(st))
          for (const c of correct) lines.push(...mathSegs(c.content))
          // falsch gleich richtig?
          if (!st.multi && correct.length === 1) {
            const cc = correct[0]
            const g = geoOf(cc.content)
            for (const w of st.choices) {
              if (w.correct) continue
              stats.pairs = (stats.pairs ?? 0) + 1
              if (sameChoice(cc.content, w.content)) report.push(`${tag} Schritt ${st.id}: falsche Antwort gleichwertig (${w.errorRuleId}): ${w.content}  ~  ${cc.content}`)
              const gw = geoOf(w.content)
              if (g && gw) {
                stats.geo = (stats.geo ?? 0) + 1
                if (sameGeo(g, gw)) report.push(`${tag} Schritt ${st.id}: falsche Form beschreibt dieselbe Gerade/Ebene (${w.errorRuleId}): ${w.content}  ~  ${cc.content}`)
              }
            }
          }
        }
        if (task.resultLatex) for (const p of chainProblems(task.resultLatex)) report.push(`${tag} Ergebnis: Kette falsch: ${p}`)
        for (const p of chainProblems(task.functionLatex ?? '')) report.push(`${tag} Gegeben: Kette falsch: ${p}`)
        // Bilder
        const defs = definitions(lines)
        const dps = [
          ...drawingProblems(task.resultDrawing, defs, 'Ergebnisbild'),
          ...task.steps.flatMap((st) => [
            ...drawingProblems(st.drawing, defs, `Bild ${st.id}`),
            ...drawingProblems(st.solvedDrawing, defs, `Bild nachher ${st.id}`),
            ...st.choices.filter((c) => c.correct).flatMap((c) => drawingProblems(c.drawing, defs, `Bild-Antwort ${st.id}`)),
          ]),
        ]
        for (const p of dps) report.push(`${tag} ${p}`)
        // Ergebnis gegen answer: alle Zahlen des Ergebnisses
        if (task.resultLatex && !task.dragOnly) {
          const vals: number[] = []
          let ok = true
          for (const part of splitTop(task.resultLatex, [',\\;'])) {
            const chain = splitTop(part.piece, ['=', '\\approx'])
            const last = chain[chain.length - 1].piece.replace(/\\,\\text\{[^}]*\}|\^\\circ|\^\{\\circ\}/g, '').trim()
            const v = tryEval(last, {}, true)
            if (!v) { ok = false; break }
            vals.push(...v.a.flat())
          }
          if (ok && vals.length === task.answer.length) {
            stats.resultChecked = (stats.resultChecked ?? 0) + 1
            if (!vals.every((x, i) => Math.abs(x - task.answer[i]) < 1e-6 * Math.max(1, Math.abs(x)) || Math.abs(x - task.answer[i]) < 0.006))
              report.push(`${tag} Ergebnis ${task.resultLatex} passt nicht zu answer ${task.answer}`)
          }
        }
      }
  report.unshift(`Aufgaben: ${count}, ${JSON.stringify(stats)}`)
  writeFileSync(process.env.REVIEW_OUT ?? '/tmp/claude-0/-home-user-lern-app/f773bc0f-caa1-53b4-8370-bf7f4e916c20/scratchpad/report.txt', report.join('\n'))
}, 600_000)
