// TEMPORÄR (unabhängige Prüfung): kleiner eigener LaTeX-Rechner für Zahlen, Vektoren und Matrizen
export type Val = { r: number; c: number; a: number[][] } // 1x1 als Skalar
export type Env = Record<string, number | Val>

const S = (x: number): Val => ({ r: 1, c: 1, a: [[x]] })
const isS = (v: Val) => v.r === 1 && v.c === 1
class Fail extends Error {}
export const usedVars = new Set<string>()

function tokenize(src: string): string[] {
  const out: string[] = []
  let i = 0
  while (i < src.length) {
    const ch = src[i]
    if (/\s/.test(ch)) { i++; continue }
    if (ch === '\\') {
      const m = /^\\([a-zA-Z]+|.)/.exec(src.slice(i))!
      out.push(m[0])
      i += m[0].length
      continue
    }
    const num = /^(\d+(?:\{,\}\d+|\.\d+)?)/.exec(src.slice(i))
    if (num) { out.push(num[0].replace('{,}', '.')); i += num[0].length; continue }
    out.push(ch)
    i++
  }
  return out.filter((t) => !['\\,', '\\;', '\\!', '\\ ', '\\left', '\\right', '\\big', '\\Big', '\\displaystyle', '\\limits', '\\mathrm', '\\quad', '\\qquad'].includes(t))
}

const FN: Record<string, (x: number) => number> = {
  '\\sin': Math.sin, '\\cos': Math.cos, '\\tan': Math.tan, '\\arccos': Math.acos, '\\arcsin': Math.asin, '\\arctan': Math.atan, '\\ln': Math.log,
}
const GREEK = ['\\lambda', '\\mu', '\\alpha', '\\beta', '\\gamma', '\\varphi', '\\phi', '\\theta', '\\sigma', '\\tau', '\\nu', '\\rho', '\\kappa', '\\delta', '\\omega', '\\psi']

export function evalLatex(src: string, env: Env, degrees = false): Val {
  const t = tokenize(src)
  let p = 0
  const peek = () => t[p]
  const eat = (x?: string) => {
    const tok = t[p++]
    if (x !== undefined && tok !== x) throw new Fail(`erwartet ${x}, nicht ${tok}`)
    return tok
  }
  const group = (): Val => {
    if (peek() === '{') { eat('{'); const v = expr(); eat('}'); return v }
    return atom()
  }
  const rawGroup = (): string => {
    if (peek() !== '{') return eat()
    eat('{')
    let depth = 1
    const parts: string[] = []
    while (depth > 0) {
      const tok = eat()
      if (tok === undefined) throw new Fail('ende')
      if (tok === '{') depth++
      if (tok === '}') depth--
      if (depth > 0) parts.push(tok)
    }
    return parts.join(' ')
  }
  const add = (x: Val, y: Val, s: number): Val => {
    if (x.r !== y.r || x.c !== y.c) throw new Fail('form +')
    return { r: x.r, c: x.c, a: x.a.map((row, i) => row.map((v, j) => v + s * y.a[i][j])) }
  }
  const mul = (x: Val, y: Val, dot: boolean): Val => {
    if (isS(x)) return { ...y, a: y.a.map((r) => r.map((v) => x.a[0][0] * v)) }
    if (isS(y)) return { ...x, a: x.a.map((r) => r.map((v) => y.a[0][0] * v)) }
    if (dot && x.c === 1 && y.c === 1 && x.r === y.r) return S(x.a.reduce((s, r, i) => s + r[0] * y.a[i][0], 0))
    if (x.c !== y.r) throw new Fail('form ·')
    return { r: x.r, c: y.c, a: x.a.map((row) => y.a[0].map((_, j) => row.reduce((s, v, k) => s + v * y.a[k][j], 0))) }
  }
  const det = (a: number[][]): number => {
    const n = a.length
    if (n === 1) return a[0][0]
    let s = 0
    for (let j = 0; j < n; j++) s += (j % 2 ? -1 : 1) * a[0][j] * det(a.slice(1).map((r) => r.filter((_, k) => k !== j)))
    return s
  }
  const inv = (x: Val): Val => {
    if (isS(x)) return S(1 / x.a[0][0])
    const n = x.r
    const M = x.a.map((r, i) => [...r, ...r.map((_, j) => (i === j ? 1 : 0))])
    for (let c = 0; c < n; c++) {
      let q = c
      for (let i = c + 1; i < n; i++) if (Math.abs(M[i][c]) > Math.abs(M[q][c])) q = i
      if (Math.abs(M[q][c]) < 1e-12) throw new Fail('singulär')
      ;[M[q], M[c]] = [M[c], M[q]]
      const piv = M[c][c]
      M[c] = M[c].map((v) => v / piv)
      for (let i = 0; i < n; i++) if (i !== c) { const f = M[i][c]; M[i] = M[i].map((v, k) => v - f * M[c][k]) }
    }
    return { r: n, c: n, a: M.map((r) => r.slice(n)) }
  }
  const matrixEnv = (): Val => {
    const rows: Val[][] = [[]]
    for (;;) {
      if (peek() === '\\end') break
      rows[rows.length - 1].push(expr())
      if (peek() === '&') { eat(); continue }
      if (peek() === '\\\\') { eat(); rows.push([]); continue }
    }
    eat('\\end'); rawGroup()
    const rr = rows.filter((r) => r.length > 0)
    if (!rr.every((r) => r.every(isS)) || !rr.every((r) => r.length === rr[0].length)) throw new Fail('matrix')
    return { r: rr.length, c: rr[0].length, a: rr.map((r) => r.map((v) => v.a[0][0])) }
  }
  const startsFactor = (tok: string | undefined) =>
    tok !== undefined &&
    (/^[0-9a-zA-Z]/.test(tok) || tok === '(' || tok === '\\frac' || tok === '\\dfrac' || tok === '\\tfrac' || tok === '\\sqrt' || tok === '\\begin' || tok === '\\lvert' || tok === '\\vec' || tok === '\\pi' || GREEK.includes(tok) || tok in FN || tok === '\\det' || tok === '\\overrightarrow')
  function expr(): Val {
    let v: Val
    if (peek() === '-') { eat(); v = mul(S(-1), term(), false) }
    else if (peek() === '+') { eat(); v = term() }
    else v = term()
    while (peek() === '+' || peek() === '-') {
      const s = eat() === '+' ? 1 : -1
      v = add(v, term(), s)
    }
    return v
  }
  function term(): Val {
    let v = unary()
    for (;;) {
      const tok = peek()
      if (tok === '\\cdot') { eat(); v = mul(v, unary(), true); continue }
      if (tok === '\\times') {
        eat()
        const w = unary()
        if (isS(v) && isS(w)) v = mul(v, w, false)
        else if (v.r === 3 && w.r === 3 && v.c === 1 && w.c === 1) {
          const [a, b] = [v.a.map((r) => r[0]), w.a.map((r) => r[0])]
          v = { r: 3, c: 1, a: [[a[1] * b[2] - a[2] * b[1]], [a[2] * b[0] - a[0] * b[2]], [a[0] * b[1] - a[1] * b[0]]] }
        } else throw new Fail('×')
        continue
      }
      if (tok === '/') { eat(); const w = unary(); if (!isS(w)) throw new Fail('/'); v = mul(v, S(1 / w.a[0][0]), false); continue }
      if (startsFactor(tok)) { v = mul(v, power(), false); continue }
      return v
    }
  }
  function unary(): Val {
    if (peek() === '-') { eat(); return mul(S(-1), unary(), false) }
    return power()
  }
  function power(): Val {
    let v = atom()
    for (;;) {
      if (peek() === '^') {
        eat()
        if (peek() === '{' && (t[p + 1] === '\\mathsf' || t[p + 1] === 'T') ) {
          const g = rawGroup()
          if (g.includes('T')) { v = { r: v.c, c: v.r, a: v.a[0].map((_, j) => v.a.map((r) => r[j])) }; continue }
          throw new Fail('^')
        }
        if (peek() === 'T') { eat(); v = { r: v.c, c: v.r, a: v.a[0].map((_, j) => v.a.map((r) => r[j])) }; continue }
        if (peek() === '\\circ') { eat(); if (!degrees) throw new Fail('°'); continue }
        if (peek() === '{' && t[p + 1] === '\\circ') { rawGroup(); if (!degrees) throw new Fail('°'); continue }
        const e = group()
        if (!isS(e)) throw new Fail('^M')
        const k = e.a[0][0]
        if (isS(v)) v = S(Math.pow(v.a[0][0], k))
        else if (k === -1) v = inv(v)
        else if (Number.isInteger(k) && k > 0) { let r = v; for (let i = 1; i < k; i++) r = mul(r, v, false); v = r }
        else throw new Fail('pow')
        continue
      }
      return v
    }
  }
  function atom(): Val {
    const tok = eat()
    if (tok === undefined) throw new Fail('leer')
    if (/^\d/.test(tok)) return S(Number(tok))
    if (tok === '{') { const v = expr(); eat('}'); return v }
    if (tok === '(' || tok === '[') { const v = expr(); eat(tok === '(' ? ')' : ']'); return v }
    if (tok === '\\frac' || tok === '\\dfrac' || tok === '\\tfrac') {
      const a = group(); const b = group()
      if (!isS(b)) throw new Fail('frac')
      return mul(a, S(1 / b.a[0][0]), false)
    }
    if (tok === '\\sqrt') {
      let n = 2
      if (peek() === '[') { eat('['); n = Number(eat()); eat(']') }
      const a = group()
      if (!isS(a)) throw new Fail('sqrt')
      const x = a.a[0][0]
      if (x < 0 && n % 2 === 0) throw new Fail('sqrt<0')
      return S(Math.sign(x) * Math.pow(Math.abs(x), 1 / n))
    }
    if (tok === '\\begin') {
      const env = rawGroup()
      if (env === 'pmatrix' || env === 'bmatrix') return matrixEnv()
      if (env === 'vmatrix') { const m = matrixEnv(); if (m.r !== m.c) throw new Fail('det'); return S(det(m.a)) }
      throw new Fail(`env ${env}`)
    }
    if (tok === '\\det') { const m = power(); if (m.r !== m.c) throw new Fail('det'); return S(isS(m) ? m.a[0][0] : det(m.a)) }
    if (tok === '\\lvert' || tok === '|') {
      const v = expr(); eat(tok === '|' ? '|' : '\\rvert')
      if (isS(v)) return S(Math.abs(v.a[0][0]))
      if (v.c === 1) return S(Math.sqrt(v.a.reduce((s, r) => s + r[0] * r[0], 0)))
      throw new Fail('|M|')
    }
    if (tok === '\\pi') return S(degrees ? 180 : Math.PI)
    if (tok in FN) {
      const a = peek() === '(' || peek() === '{' ? group() : power()
      if (!isS(a)) throw new Fail('fn')
      let x = a.a[0][0]
      const f = FN[tok]
      if (['\\sin', '\\cos', '\\tan'].includes(tok) && degrees) x = (x * Math.PI) / 180
      let y = f(x)
      if (['\\arccos', '\\arcsin', '\\arctan'].includes(tok) && degrees) y = (y * 180) / Math.PI
      return S(y)
    }
    let name: string | null = null
    if (/^[a-zA-Z]$/.test(tok)) name = tok
    else if (GREEK.includes(tok)) name = tok
    else if (tok === '\\vec' || tok === '\\overrightarrow') name = `${tok}{${rawGroup()}}`
    if (name === null) throw new Fail(`token ${tok}`)
    if (peek() === '_') { eat(); name += `_${rawGroup()}` }
    if (peek() === "'") { eat(); name += "'" }
    usedVars.add(name)
    if (!(name in env)) {
      const m = /^\\overrightarrow\{(\S+) (\S+)\}$/.exec(name)
      if (m && `pt:${m[1]}` in env && `pt:${m[2]}` in env) {
        const P = env[`pt:${m[1]}`] as Val, Q = env[`pt:${m[2]}`] as Val
        return add(Q, P, -1)
      }
      throw new Fail(`var ${name}`)
    }
    const val = env[name]
    return typeof val === 'number' ? S(val) : val
  }
  const v = expr()
  if (p !== t.length) throw new Fail(`rest ${t.slice(p).join(' ')}`)
  return v
}

// Variablen eines Stücks (ohne Auswertung): einfache Buchstaben und griechische
export function varsOf(src: string): string[] | null {
  usedVars.clear()
  const env = new Proxy({}, { has: () => true, get: () => 0.37 }) as Env
  try { evalLatex(src, env, true) } catch { /* auch bei Fehler die gesammelten */ }
  return [...usedVars].sort()
}

export function tryEval(src: string, env: Env, degrees = false): Val | null {
  try {
    const v = evalLatex(src, env, degrees)
    return v.a.every((r) => r.every(Number.isFinite)) ? v : null
  } catch (e) {
    if (e instanceof Fail) return null
    return null
  }
}

export function sameVal(x: Val, y: Val, tol = 1e-9): boolean {
  return x.r === y.r && x.c === y.c && x.a.every((r, i) => r.every((v, j) => Math.abs(v - y.a[i][j]) <= tol * Math.max(1, Math.abs(v), Math.abs(y.a[i][j]))))
}

// an der obersten Ebene trennen (nicht in {}, nicht in \begin…\end, nicht in \left( … \right))
export function splitTop(src: string, seps: string[]): { piece: string; sep: string }[] {
  const out: { piece: string; sep: string }[] = []
  let depth = 0
  let env = 0
  let cur = ''
  let lastSep = ''
  for (let i = 0; i < src.length; ) {
    if (src.startsWith('\\begin', i)) env++
    if (src.startsWith('\\end', i)) env--
    const ch = src[i]
    if (ch === '\\' && /^\\[{}]/.test(src.slice(i))) { cur += src.slice(i, i + 2); i += 2; continue }
    if (ch === '{' || ch === '(') depth++
    if (ch === '}' || ch === ')') depth--
    if (depth === 0 && env === 0) {
      const sep = seps.find((s) => src.startsWith(s, i) && !(/^\\[a-zA-Z]/.test(s) && /[a-zA-Z]/.test(src[i + s.length] ?? '')))
      if (sep) { out.push({ piece: cur, sep: lastSep }); lastSep = sep; cur = ''; i += sep.length; continue }
    }
    cur += ch
    i++
  }
  out.push({ piece: cur, sep: lastSep })
  return out
}
