import type { GuidedStep } from '../guided/types.ts'
import type { Rng } from '../random/rng.ts'
import { type Rational, isInteger, isZero, rat, ratAdd, ratDiv, ratEq, ratMul, ratNeg, ratSub } from '../rational.ts'
import type { Level } from '../tasks/taskNumber.ts'
import { normStep, termsLatex } from './crossTasks.ts'
import { type DrawPoint } from './figures.ts'
import { COORDS, at, isParallel, lineFigure, paramFormLatex, pickDir, pickPoint, sameLine } from './lineKit.ts'
import { type Built, type VectorKind, type Wrong, CARD, PARAMS, POINT_LETTERS, choiceStep, connectStep, math, nums, pointsDrawing, pythagorean, signShape } from './taskKit.ts'
import { type Vec, pointLatex, ratFactorLatex, ratLatex, vec, vecAdd, vecEq, vecIsZero, vecLatex, surdLatex, vecLength, vecScale, vecSub } from './vec.ts'

// Baustein „Geraden" der Tätigkeit „Geraden und Ebenen" (M7 Schritt 6): Parameterform aus zwei Punkten oder parallel zu
// einer Geraden, Punkt zu einem Parameterwert oder einer Koordinate, Punktprobe (liegt der Punkt auf der Geraden? liegen
// drei Punkte auf einer Geraden? mit Unbekannten in den Koordinaten), Spurpunkte (Schnitt mit den Achsen bzw. den
// Koordinatenebenen) und Punkte mit gegebenem Abstand auf der Geraden. Stufe 1 in der Ebene, ab Stufe 2 im Raum.

export const LINE_KINDS_BY_LEVEL: Readonly<Record<Level, readonly VectorKind[]>> = {
  1: ['lineThrough', 'linePoint', 'lineContains'],
  2: ['lineThrough', 'linePoint', 'lineContains', 'lineTrace'],
  3: ['lineThrough', 'linePoint', 'lineContains', 'lineTrace'],
  4: ['lineContains', 'lineTrace', 'lineDistance'],
  5: ['lineContains', 'lineTrace', 'lineDistance'],
}

// Antworten der Punktprobe (freier Modus: Auswahl, vectorFree.ts)
export const ON_LINE = ['auf der Geraden', 'nicht auf der Geraden'] as const
export const COLLINEAR = ['auf einer Geraden', 'nicht auf einer Geraden'] as const

// Lernkarten der Tätigkeit (lineCards.ts)
export const GL_CARD = {
  gerade: 'gl-gerade',
  punktprobe: 'gl-punktprobe',
  spur: 'gl-spurpunkte',
  ebene: 'gl-ebene',
  koordinaten: 'gl-koordinatenform',
  hesse: 'gl-hesse',
} as const

const LINE_NAMES = ['g', 'h'] as const
const fac = ratFactorLatex
const show = (r: Rational) => ratLatex(r)

// ------------------------------------------------------------------ Schritte

// Parameterform aufstellen: richtige Form und falsche (Wrong mit fertigem Inhalt)
// falsche Formen, die zufällig dieselbe Gerade beschreiben, fallen weg
type WrongLine = { readonly p: Vec; readonly v: Vec; readonly rule: string }
function formStep(rng: Rng, o: { readonly name: string; readonly p: Vec; readonly v: Vec; readonly t: string; readonly wrongs: readonly WrongLine[]; readonly hint: string; readonly why: string }): GuidedStep {
  const form = paramFormLatex(o.name, o.p, [[o.t, o.v]])
  const wrongs: Wrong[] = o.wrongs.filter((w) => !sameLine(o.p, o.v, w.p, w.v)).map((w) => ({ content: math(paramFormLatex(o.name, w.p, [[o.t, w.v]])), rule: w.rule }))
  return choiceStep(rng, {
    id: 'form',
    title: 'Parameterform',
    question: `Wie lautet eine Gleichung von $${o.name}$ in Parameterform?`,
    correct: math(form),
    wrongs,
    hint: o.hint,
    explanation: { detailed: `${o.why} Also $${form}$.`, short: `$${form}$.` },
    established: [form],
    cards: [GL_CARD.gerade],
  })
}

const lineEq = (target: Rational, p: Rational, v: Rational, t: string) => `${show(target)} = ${termsLatex([[p, ''], [v, t]])}`

type Slip = { readonly t: Rational; readonly rule: string }

// Eine Zeile der Parameterform nach dem Parameter auflösen: target = p + t · v
function solveStep(
  rng: Rng,
  o: { readonly id: string; readonly title: string; readonly question: string; readonly t: string; readonly target: Rational; readonly p: Rational; readonly v: Rational; readonly lead: string; readonly card: string; readonly extra?: readonly Slip[] },
): { readonly step: GuidedStep; readonly t: Rational; readonly slips: readonly Slip[] } {
  const t0 = ratDiv(ratSub(o.target, o.p), o.v)
  const slips: Slip[] = [
    { t: ratDiv(ratAdd(o.target, o.p), o.v), rule: 'gl-solve-sign' },
    { t: ratMul(ratSub(o.target, o.p), o.v), rule: 'gl-solve-multiply' },
    { t: ratDiv(ratSub(o.p, o.target), o.v), rule: 'gl-solve-sign' },
    ...(o.extra ?? []),
  ].filter((s) => !ratEq(s.t, t0))
  const eq = lineEq(o.target, o.p, o.v, o.t)
  // Faktor 1 oder −1: ohne Bruch
  const diff = `${show(o.target)} - ${fac(o.p)}`
  const calc = ratEq(o.v, rat(1))
    ? `${o.t} = ${diff} = ${show(t0)}`
    : ratEq(o.v, rat(-1))
      ? `${o.t} = -(${diff}) = ${show(t0)}`
      : `${o.t} = \\frac{${diff}}{${show(o.v)}} = ${show(t0)}`
  const step = choiceStep(rng, {
    id: o.id,
    title: o.title,
    question: o.question,
    correct: math(`${o.t} = ${show(t0)}`),
    wrongs: slips.map((s) => ({ content: math(`${o.t} = ${show(s.t)}`), rule: s.rule })),
    hint: `${o.lead} Bring die Zahl auf die andere Seite und teile durch den Faktor vor $${o.t}$.`,
    explanation: { detailed: `${o.lead} $${eq}$, also $${calc}$.`, short: `$${eq} \\;\\Rightarrow\\; ${calc}$.` },
    established: [eq, `${o.t} = ${show(t0)}`],
    cards: [o.card],
  })
  return { step, t: t0, slips }
}

// Punkt der Geraden zum Parameter t (mit falschen Punkten aus den Fehlern beim Auflösen)
function pointStep(rng: Rng, o: { readonly id?: string; readonly Q: string; readonly p: Vec; readonly v: Vec; readonly t: Rational; readonly tName: string; readonly slips: readonly Slip[]; readonly question?: string; readonly card: string }): GuidedStep {
  const q = at(o.p, o.v, o.t)
  const wrongs: Wrong[] = o.slips.map((s) => ({ content: math(pointLatex(o.Q, at(o.p, o.v, s.t))), rule: s.rule }))
  if (!ratEq(o.t, rat(1))) wrongs.push({ content: math(pointLatex(o.Q, vecAdd(o.p, o.v))), rule: 'gl-param-forgotten' })
  wrongs.push({ content: math(pointLatex(o.Q, vecAdd(vecScale(o.t, o.p), o.v))), rule: 'gl-param-on-support' })
  const calc = `${vecLatex(o.p)} + ${fac(o.t)} \\cdot ${vecLatex(o.v)} = ${vecLatex(q)}`
  return choiceStep(rng, {
    id: o.id ?? 'punkt',
    title: 'Punkt',
    question: o.question ?? `Welcher Punkt gehört zu $${o.tName} = ${show(o.t)}$?`,
    correct: math(pointLatex(o.Q, q)),
    wrongs,
    hint: `Setz $${o.tName} = ${show(o.t)}$ in die Parameterform ein: Stützvektor plus $${show(o.t)}$-mal Richtungsvektor.`,
    explanation: { detailed: `Einsetzen: $${calc}$, also $${pointLatex(o.Q, q)}$.`, short: `$${calc}$.` },
    established: [pointLatex(o.Q, q)],
    cards: [o.card],
  })
}

// Werte jeder Zeile beim Einsetzen eines Punkts: t_j = (P_j − p_j) / v_j (v ohne Nullen)
const rowTs = (P: Vec, p: Vec, v: Vec) => P.map((x, j) => ratDiv(ratSub(x, p[j]), v[j]))
const rowsLatex = (ts: readonly Rational[], t: string) => ts.map((x, j) => `$${COORDS[j]}$: $${t} = ${show(x)}$`).join(', ')

// Entscheidung der Punktprobe: Antworten mit Begründung
function decideStep(rng: Rng, o: { readonly P: string; readonly ts: readonly Rational[]; readonly i0: number; readonly t: string; readonly question: string; readonly subject: string }): { readonly step: GuidedStep; readonly on: boolean } {
  const t0 = o.ts[o.i0]
  const j = o.ts.findIndex((x) => !ratEq(x, t0))
  const on = j < 0
  const all = rowsLatex(o.ts, o.t)
  const correct = on ? `Ja: Jede Zeile liefert $${o.t} = ${show(t0)}$.` : `Nein: Die Zeile für $${COORDS[j]}$ liefert $${o.t} = ${show(o.ts[j])}$, nicht $${o.t} = ${show(t0)}$.`
  const wrongs: Wrong[] = on
    ? [
        { content: `Nein: Die Zeilen liefern verschiedene Werte für $${o.t}$.`, rule: 'gl-probe-misread' },
        { content: `Nein: $${o.P}$ ist nicht der Stützpunkt der Geraden.`, rule: 'gl-only-support' },
      ]
    : [
        { content: `Ja: Die Zeile für $${COORDS[o.i0]}$ liefert $${o.t} = ${show(t0)}$.`, rule: 'gl-check-one' },
        { content: `Ja: Die Zeile für $${COORDS[j]}$ liefert $${o.t} = ${show(o.ts[j])}$.`, rule: 'gl-check-one' },
      ]
  const step = choiceStep(rng, {
    id: 'probe',
    title: 'Punktprobe',
    question: o.question,
    correct,
    wrongs,
    hint: `Rechne in jeder Zeile $${o.t}$ aus. Nur wenn alle Zeilen denselben Wert liefern, liegt ${o.subject}.`,
    explanation: {
      detailed: `Jede Zeile nach $${o.t}$ aufgelöst: ${all}. ${on ? `Alle gleich, also liegt ${o.subject}.` : `Nicht alle gleich: Kein $${o.t}$ erfüllt alle Zeilen zugleich, also liegt ${o.subject.replace(/^(.*?) (auf)/, '$1 nicht $2')}.`}`,
      short: `${all}: ${on ? 'alle gleich' : 'nicht alle gleich'}.`,
    },
    cards: [GL_CARD.punktprobe],
  })
  return { step, on }
}

// ------------------------------------------------------------------ Hilfen

function names(rng: Rng) {
  const [A, B] = rng.pick(POINT_LETTERS)
  const t = rng.pick(PARAMS)
  return { A, B, t, g: rng.pick(LINE_NAMES) }
}

const tClass = (t: Rational) => (isInteger(t) ? (Number(t.n) < 0 ? 'neg' : 'pos') : 'frac')
// Den Hinweis „Zum Drehen im Bild ziehen“ setzt das Bild selbst
const caption = (_dim: number, text: string) => text

// ------------------------------------------------------------------ Arten

// Gerade durch zwei Punkte (Stufe 1 in der Ebene, 2 im Raum) oder durch einen Punkt parallel zu einer Geraden (Stufe 3)
function buildLineThrough(rng: Rng, level: Level): Built {
  for (;;) {
    const dim = level === 1 ? 2 : 3
    const { A, B, t, g } = names(rng)
    if (level === 3 && rng.chance(0.5)) {
      // parallel: h ist gegeben, g geht durch P mit derselben Richtung
      const h = g === 'g' ? 'h' : 'g'
      const s = t === 's' ? 'r' : 's'
      const q = pickPoint(rng, 3, 4)
      const w = pickDir(rng, 3, 4, 1)
      const P = pickPoint(rng, 3, 5)
      if (isParallel(vecSub(P, q), w) || isParallel(P, w) || isParallel(q, w)) continue
      const wrongs: WrongLine[] = [
        { p: q, v: w, rule: 'gl-other-support' },
        { p: P, v: q, rule: 'gl-support-as-direction' },
        { p: w, v: P, rule: 'gl-support-swapped' },
      ]
      const step = formStep(rng, {
        name: g,
        p: P,
        v: w,
        t,
        wrongs,
        hint: `Parallele Geraden haben dieselbe Richtung. Stützpunkt ist der gegebene Punkt $${A}$.`,
        why: `Stützvektor: der Ortsvektor von $${A}$. Richtungsvektor: der von $${h}$, denn parallele Geraden haben dieselbe Richtung.`,
      })
      if (step.choices.length < 4) continue
      const drawing = lineFigure({ name: g, p: P, v: w, pName: A, play: true, caption: caption(3, `$${g}$ geht durch $${A}$ und hat dieselbe Richtung wie $${h}$ (grau).`) })
      const hSeg = lineFigure({ name: h, p: q, v: w, caption: '' }).segments[0]
      return {
        kind: 'lineThrough',
        instruction: `Stelle eine Gleichung der Geraden $${g}$ durch $${A}$ parallel zu $${h}$ in Parameterform auf.`,
        functionLatex: `${paramFormLatex(h, q, [[s, w]])},\\; ${pointLatex(A, P)}`,
        steps: [step],
        cards: [GL_CARD.gerade],
        resultLatex: paramFormLatex(g, P, [[t, w]]),
        resultDrawing: { ...drawing, segments: [{ ...hSeg, color: 'muted', label: h }, ...drawing.segments] },
        form: `lineThrough|parallel|${A}|${t}|${g}|${signShape(P, w, q)}`,
        data: { p: nums(P), v: nums(w), P: nums(P), q: nums(q), w: nums(w) },
        answer: [...nums(P), ...nums(w)],
      }
    }
    const a = pickPoint(rng, dim, 5)
    const b = pickPoint(rng, dim, 5)
    const d = vecSub(b, a)
    // A, B und der Ursprung nicht auf einer Geraden: sonst wären falsche Formen zufällig richtig
    if (vecIsZero(d) || isParallel(a, b) || vecIsZero(a)) continue
    const step1 = connectStep(rng, A, B, a, b, pointsDrawing(dim as 2 | 3, [{ name: A, at: a }, { name: B, at: b }], caption(dim, `Die Punkte $${A}$ und $${B}$.`)))
    const AB = `\\overrightarrow{${A}${B}}`
    const wrongs: WrongLine[] = [
      { p: d, v: a, rule: 'gl-support-swapped' },
      { p: a, v: b, rule: 'gl-position-direction' },
      { p: a, v: vecAdd(a, b), rule: 'vec-added-points' },
    ]
    const step2 = formStep(rng, {
      name: g,
      p: a,
      v: d,
      t,
      wrongs,
      hint: `Stützvektor ist der Ortsvektor eines Punkts der Geraden, Richtungsvektor der Pfeil $${AB}$ von $${A}$ nach $${B}$.`,
      why: `Stützvektor: der Ortsvektor von $${A}$. Richtungsvektor: $${AB}$.`,
    })
    if (step1.choices.length < 3 || step2.choices.length < 4) continue
    const drawing = lineFigure({ name: g, p: a, v: d, pName: A, points: [{ at: nums(b), label: B }], play: true, caption: caption(dim, `Vom Ursprung zu $${A}$ (Stützvektor), dann immer weiter in Richtung $${AB}$.`) })
    return {
      kind: 'lineThrough',
      instruction: `Stelle eine Gleichung der Geraden $${g}$ durch $${A}$ und $${B}$ in Parameterform auf.`,
      functionLatex: `${pointLatex(A, a)},\\; ${pointLatex(B, b)}`,
      steps: [step1, step2],
      cards: [GL_CARD.gerade, CARD.verbindung],
      resultLatex: paramFormLatex(g, a, [[t, d]]),
      resultDrawing: drawing,
      form: `lineThrough|points|${dim}|${A}|${t}|${g}|${signShape(a, d)}`,
      data: { p: nums(a), v: nums(d), A: nums(a), B: nums(b) },
      answer: [...nums(a), ...nums(d)],
    }
  }
}

// Punkt auf der Geraden: zu einem Parameterwert (Stufe 1 und 2) oder mit gegebener Koordinate (Stufe 2 und 3)
function buildLinePoint(rng: Rng, level: Level): Built {
  for (;;) {
    const dim = level === 1 || (level === 2 && rng.chance(0.5)) ? 2 : 3
    const byCoord = level === 3 || (level === 2 && dim === 2)
    const { t, g } = names(rng)
    const Q = rng.pick(['Q', 'R', 'S'])
    const p = pickPoint(rng, dim, 4)
    const v = pickDir(rng, dim, 4, dim === 3 ? 1 : 0)
    const k = rat(rng.pick([-3, -2, -1, 2, 3]))
    const lineLatex = paramFormLatex(g, p, [[t, v]])
    const drawingOf = (q: Vec) =>
      lineFigure({ name: g, p, v, points: [{ at: nums(q), label: Q, color: 'r', phase: 4 }], ts: [Number(k.n)], play: true, caption: caption(dim, `$${Q}$ liegt auf $${g}$ bei $${t} = ${show(k)}$.`) })
    if (!byCoord) {
      if (vecEq(p, v) || vecIsZero(p)) continue
      const step = pointStep(rng, { Q, p, v, t: k, tName: t, slips: [{ t: ratNeg(k), rule: 'vec-sign-slip' }], card: GL_CARD.gerade })
      if (step.choices.length < 4) continue
      const q = at(p, v, k)
      return {
        kind: 'linePoint',
        instruction: `Welcher Punkt $${Q}$ der Geraden $${g}$ gehört zum Parameterwert $${t} = ${show(k)}$?`,
        functionLatex: lineLatex,
        steps: [step],
        cards: [GL_CARD.gerade],
        resultLatex: pointLatex(Q, q),
        resultDrawing: drawingOf(q),
        form: `linePoint|value|${dim}|${tClass(k)}|${t}|${g}|${signShape(p, v)}`,
        data: { p: nums(p), v: nums(v), k: [Number(k.n)] },
        answer: nums(q),
      }
    }
    // gegebene Koordinate: in einer Zeile mit Faktor ungleich 0 auflösen
    const i = rng.int(0, dim - 1)
    if (isZero(v[i])) continue
    const q = at(p, v, k)
    const solved = solveStep(rng, {
      id: 'parameter',
      title: 'Parameter',
      question: `Für welches $${t}$ hat der Punkt die Koordinate $${COORDS[i]} = ${show(q[i])}$?`,
      t,
      target: q[i],
      p: p[i],
      v: v[i],
      lead: `Die Zeile für $${COORDS[i]}$ lautet`,
      card: GL_CARD.gerade,
    })
    const step2 = pointStep(rng, { Q, p, v, t: k, tName: t, slips: [{ t: ratNeg(k), rule: 'vec-sign-slip' }], card: GL_CARD.gerade })
    if (solved.step.choices.length < 3 || step2.choices.length < 3) continue
    return {
      kind: 'linePoint',
      instruction: `Welcher Punkt $${Q}$ der Geraden $${g}$ hat die Koordinate $${COORDS[i]} = ${show(q[i])}$?`,
      functionLatex: lineLatex,
      steps: [solved.step, step2],
      cards: [GL_CARD.gerade],
      resultLatex: pointLatex(Q, q),
      resultDrawing: drawingOf(q),
      form: `linePoint|coord|${dim}|${i}|${tClass(k)}|${t}|${g}|${signShape(p, v)}`,
      data: { p: nums(p), v: nums(v), k: [Number(k.n)] },
      answer: nums(q),
    }
  }
}

// Punktprobe: liegt P auf g (Stufe 1 Ebene, 2 Raum), liegen drei Punkte auf einer Geraden (Stufe 3), Unbekannte in den
// Koordinaten (Stufe 4 mit gegebener Geraden, Stufe 5 mit der Geraden durch zwei Punkte)
function buildLineContains(rng: Rng, level: Level): Built {
  for (;;) {
    const dim = level === 1 ? 2 : 3
    const { A, B, t, g } = names(rng)
    const collinear = level === 5 || (level === 3 && rng.chance(0.6))
    const unknowns = level >= 4
    const C = collinear ? rng.pick(['C', 'D', 'E'].filter((x) => x !== A && x !== B)) : rng.pick(['P', 'Q', 'R'].filter((x) => x !== A && x !== B))
    // Gerade: gegeben (p, v) oder durch A und B
    let a: Vec
    let v: Vec
    if (collinear) {
      a = pickPoint(rng, dim, 4)
      v = vecSub(pickPoint(rng, dim, 4), a)
    } else {
      a = pickPoint(rng, dim, 4)
      v = pickDir(rng, dim, 3, 0)
    }
    if (v.some(isZero) && !unknowns) continue
    if (vecIsZero(v)) continue
    const b = vecAdd(a, v)
    const k = rat(rng.pick([-2, -1, 2, 3]))
    let P = at(a, v, k)
    const steps: GuidedStep[] = []
    const cards: string[] = [GL_CARD.punktprobe]
    if (collinear) {
      const s1 = connectStep(rng, A, B, a, b)
      if (s1.choices.length < 3) continue
      steps.push(s1)
      cards.push(GL_CARD.gerade)
    }
    const lineLatex = paramFormLatex(g, a, [[t, v]])
    const lineText = collinear ? `der Geraden durch $${A}$ und $${B}$, $${lineLatex}$,` : `$${g}$`
    if (unknowns) {
      // zwei Koordinaten unbekannt, eine gegeben (dort Faktor ungleich 0)
      const j = rng.pick([0, 1, 2].filter((x) => !isZero(v[x])))
      const [i, l] = [0, 1, 2].filter((x) => x !== j)
      const [u, w] = rng.pick([
        ['a', 'b'],
        ['u', 'w'],
        ['p', 'q'],
      ] as const)
      const entries = P.map((x, idx) => (idx === i ? u : idx === l ? w : show(x)))
      const solved = solveStep(rng, {
        id: 'parameter',
        title: 'Parameter',
        question: `Aus welcher Zeile folgt $${t}$, und welcher Wert?`,
        t,
        target: P[j],
        p: a[j],
        v: v[j],
        lead: `Nur in der Zeile für $${COORDS[j]}$ ist alles bekannt:`,
        card: GL_CARD.punktprobe,
      })
      const val = (x: Vec) => `${u} = ${show(x[i])},\\; ${w} = ${show(x[l])}`
      const wrongs: Wrong[] = [{ content: math(val(at(a, v, ratNeg(k)))), rule: 'vec-sign-slip' }]
      wrongs.push({ content: math(val(vecAdd(a, v))), rule: 'gl-param-forgotten' }, { content: math(val(vecAdd(vecScale(k, a), v))), rule: 'gl-param-on-support' })
      const calc = `${vecLatex(a)} + ${fac(k)} \\cdot ${vecLatex(v)} = ${vecLatex(P)}`
      const s2 = choiceStep(rng, {
        id: 'werte',
        title: 'Unbekannte',
        question: `Welche Werte haben $${u}$ und $${w}$?`,
        correct: math(val(P)),
        wrongs,
        hint: `Setz $${t} = ${show(k)}$ in die übrigen Zeilen ein.`,
        explanation: { detailed: `Mit $${t} = ${show(k)}$: $${calc}$, also $${val(P)}$.`, short: `$${calc}$.` },
        established: [val(P)],
        cards: [GL_CARD.punktprobe],
      })
      if (solved.step.choices.length < 3 || s2.choices.length < 4) continue
      steps.push(solved.step, s2)
      const Platex = `${C}(${entries.join(' \\mid ')})`
      const drawing = lineFigure({ name: g, p: a, v, pName: collinear ? A : undefined, points: [...(collinear ? [{ at: nums(b), label: B }] : []), { at: nums(P), label: C, color: 'r' as const, phase: 4 }], ts: [Number(k.n)], play: true, caption: caption(3, `$${C}$ liegt auf ${collinear ? `der Geraden durch $${A}$ und $${B}$` : `$${g}$`}.`) })
      return {
        kind: 'lineContains',
        instruction: collinear
          ? `Für welche Werte von $${u}$ und $${w}$ liegen $${A}$, $${B}$ und $${Platex}$ auf einer Geraden?`
          : `Für welche Werte von $${u}$ und $${w}$ liegt $${Platex}$ auf $${g}$?`,
        functionLatex: collinear ? `${pointLatex(A, a)},\\; ${pointLatex(B, b)},\\; ${Platex}` : `${lineLatex},\\; ${Platex}`,
        steps,
        cards,
        resultLatex: val(P),
        resultDrawing: drawing,
        form: `lineContains|unknowns|${collinear ? 'col' : 'given'}|${j}|${u}|${t}|${tClass(k)}|${signShape(a, v)}`,
        data: { p: nums(a), v: nums(v), known: [j, Number(P[j].n) / Number(P[j].d)], idx: [i, l] },
        answer: [Number(P[i].n) / Number(P[i].d), Number(P[l].n) / Number(P[l].d)],
      }
    }
    // Punktprobe: bei der Hälfte liegt der Punkt nicht drauf (eine andere Zeile um 1 bis 2 verschoben)
    const on = rng.chance(0.5)
    const i0 = 0
    if (!on) {
      const j = rng.int(1, dim - 1)
      P = P.map((x, idx) => (idx === j ? ratAdd(x, rat(rng.pick([-2, -1, 1, 2]))) : x))
    }
    const ts = rowTs(P, a, v)
    const solved = solveStep(rng, {
      id: 'parameter',
      title: 'Erste Zeile',
      question: `Welches $${t}$ liefert die Zeile für $${COORDS[i0]}$?`,
      t,
      target: P[i0],
      p: a[i0],
      v: v[i0],
      lead: `Setz $${C}$ ein. Die Zeile für $${COORDS[i0]}$ lautet`,
      card: GL_CARD.punktprobe,
    })
    const subject = collinear ? `$${C}$ auf der Geraden durch $${A}$ und $${B}$` : `$${C}$ auf $${g}$`
    const decided = decideStep(rng, { P: C, ts, i0, t, subject, question: collinear ? `Liegen $${A}$, $${B}$ und $${C}$ auf einer Geraden?` : `Liegt $${C}$ auf $${g}$?` })
    if (solved.step.choices.length < 3 || decided.step.choices.length < 3) continue
    steps.push(solved.step, decided.step)
    const answers = collinear ? COLLINEAR : ON_LINE
    const word = answers[on ? 0 : 1]
    const points: DrawPoint[] = [...(collinear ? [{ at: nums(b), label: B }] : []), { at: nums(P), label: C, color: on ? 'r' : 'c', phase: 4 }]
    const drawing = lineFigure({ name: g, p: a, v, pName: collinear ? A : undefined, points, ts: [Number(k.n)], play: true, caption: caption(dim, `$${C}$ liegt ${on ? '' : 'nicht '}auf ${collinear ? `der Geraden durch $${A}$ und $${B}$` : `$${g}$`}.`) })
    return {
      kind: 'lineContains',
      instruction: collinear ? `Liegen $${A}$, $${B}$ und $${C}$ auf einer Geraden?` : `Liegt $${C}$ auf ${lineText}?`,
      functionLatex: collinear ? `${pointLatex(A, a)},\\; ${pointLatex(B, b)},\\; ${pointLatex(C, P)}` : `${lineLatex},\\; ${pointLatex(C, P)}`,
      steps,
      cards,
      resultLatex: `\\text{${word}}`,
      resultDrawing: drawing,
      form: `lineContains|${collinear ? 'col' : 'probe'}|${dim}|${on ? 'on' : 'off'}|${t}|${C}|${tClass(k)}|${signShape(a, v)}`,
      data: { p: nums(a), v: nums(v), P: nums(P) },
      answer: [on ? 0 : 1],
    }
  }
}

// Name eines Spurpunkts: in der Ebene nach der Achse (S_x liegt auf der x-Achse, dort ist y = 0), im Raum nach der
// Koordinatenebene (S_{xy} liegt in der x-y-Ebene, dort ist z = 0)
const traceName = (dim: number, zero: number) => (dim === 2 ? `S_${COORDS[1 - zero]}` : `S_{${COORDS.filter((_, i) => i !== zero).join('')}}`)
const traceWhere = (dim: number, zero: number, article: 'die' | 'der' = 'die') =>
  dim === 2 ? `${article} $${COORDS[1 - zero]}$-Achse` : `${article} $${COORDS.filter((_, i) => i !== zero).join('\\text{-}')}$-Ebene`
// „Auf der x-Achse“, „In der x-y-Ebene“
const traceAt = (dim: number, zero: number) => `${dim === 2 ? 'Auf' : 'In'} ${traceWhere(dim, zero, 'der')}`

// Spurpunkte: Schnitt mit den Achsen (Stufe 2, Ebene), mit zwei Koordinatenebenen (Stufe 3), allen drei (Stufe 4, auch
// Brüche), zwei und ihr Abstand (Stufe 5)
function buildLineTrace(rng: Rng, level: Level): Built {
  for (;;) {
    const dim = level === 2 ? 2 : 3
    const { t, g } = names(rng)
    const zeros = dim === 2 ? [1, 0] : level === 4 ? [2, 1, 0] : rng.shuffle([0, 1, 2]).slice(0, 2).sort((x, y) => y - x)
    const v = pickDir(rng, dim, 3, 0)
    if (v.some(isZero)) continue
    // Stufe 2 und 3: ganze Parameterwerte (p_i = −t_i · v_i), sonst beliebige Stützpunkte
    let p: Vec
    if (level <= 3) {
      const tv = rng.shuffle([-3, -2, -1, 1, 2, 3])
      p = vec(...Array.from({ length: dim }, (_, i) => (zeros.includes(i) ? -tv[zeros.indexOf(i)] * Number(v[i].n) : rng.int(-4, 4))))
    } else p = pickPoint(rng, dim, 5)
    if (zeros.some((i) => isZero(p[i]))) continue
    const tsOf = zeros.map((i) => ratDiv(ratNeg(p[i]), v[i]))
    const pts = tsOf.map((tt) => at(p, v, tt))
    if (pts.some((x, i) => pts.some((y, j) => j > i && vecEq(x, y)))) continue
    if (level >= 4 && pts.every((x) => x.every(isInteger))) continue
    const steps: GuidedStep[] = []
    let short = false
    zeros.forEach((zi, n) => {
      const other = zeros.find((x) => x !== zi) ?? [0, 1, 2].find((x) => x !== zi && x < dim)!
      const slips: Slip[] = [
        { t: ratDiv(ratNeg(p[other]), v[other]), rule: 'gl-trace-wrong-coord' },
        { t: ratDiv(p[zi], v[zi]), rule: 'gl-solve-sign' },
        { t: ratMul(ratNeg(p[zi]), v[zi]), rule: 'gl-solve-multiply' },
      ].filter((s) => !ratEq(s.t, tsOf[n]))
      const S = traceName(dim, zi)
      const eq = `${termsLatex([[p[zi], ''], [v[zi], t]])} = 0`
      const step = choiceStep(rng, {
        id: `spur-${n + 1}`,
        title: `Spurpunkt ${n + 1}`,
        question: `Wo ${dim === 2 ? 'schneidet' : 'durchstößt'} $${g}$ ${traceWhere(dim, zi)}?`,
        correct: math(pointLatex(S, pts[n])),
        wrongs: slips.map((s) => ({ content: math(pointLatex(S, at(p, v, s.t))), rule: s.rule })),
        hint: `${traceAt(dim, zi)} ist $${COORDS[zi]} = 0$. Setz die Zeile für $${COORDS[zi]}$ gleich $0$, löse nach $${t}$ auf und setz $${t}$ ein.`,
        explanation: {
          detailed: `${traceAt(dim, zi)} ist $${COORDS[zi]} = 0$: $${eq}$, also $${t} = ${show(tsOf[n])}$. Einsetzen: $${vecLatex(p)} + ${fac(tsOf[n])} \\cdot ${vecLatex(v)} = ${vecLatex(pts[n])}$.`,
          short: `$${eq} \\;\\Rightarrow\\; ${t} = ${show(tsOf[n])}$, $${pointLatex(S, pts[n])}$.`,
        },
        established: [`${t} = ${show(tsOf[n])}`, pointLatex(S, pts[n])],
        cards: [GL_CARD.spur],
      })
      if (step.choices.length < 3) short = true
      steps.push(step)
    })
    if (short) continue
    const names2 = zeros.map((zi) => traceName(dim, zi))
    let result = zeros.map((_, n) => pointLatex(names2[n], pts[n])).join(',\\; ')
    const answer = pts.flatMap(nums)
    let dist: number | undefined
    if (level === 5) {
      const diff = vecSub(pts[1], pts[0])
      const ls = normStep(rng, 'd', diff, 'abstand', GL_CARD.spur)
      if (ls.choices.length < 3) continue
      steps.push({ ...ls, question: `Wie weit liegen $${names2[0]}$ und $${names2[1]}$ auseinander?` })
      const L = vecLength(diff)
      result += `,\\; d = ${surdLatex(L)}`
      dist = (Number(L.coef.n) / Number(L.coef.d)) * Math.sqrt(Number(L.rad))
      answer.push(dist)
    }
    const drawing = lineFigure({
      name: g,
      p,
      v,
      points: pts.map((x, n) => ({ at: nums(x), label: names2[n], color: 'r' as const, phase: 4 + n })),
      ts: tsOf.map((x) => Number(x.n) / Number(x.d)),
      play: true,
      caption: caption(dim, dim === 2 ? `$${g}$ schneidet beide Achsen.` : `Wo $${g}$ eine Koordinatenebene durchstößt, ist eine Koordinate $0$.`),
    })
    const what = dim === 2 ? 'die Schnittpunkte von $' + g + '$ mit den Achsen' : zeros.length === 3 ? `die Spurpunkte von $${g}$` : `die Spurpunkte von $${g}$ mit ${traceWhere(3, zeros[0], 'der')} und ${traceWhere(3, zeros[1], 'der')}`
    return {
      kind: 'lineTrace',
      instruction: `Bestimme ${what}${level === 5 ? ' und ihren Abstand' : ''}.`,
      functionLatex: paramFormLatex(g, p, [[t, v]]),
      steps,
      cards: [GL_CARD.spur],
      resultLatex: result,
      resultDrawing: drawing,
      form: `lineTrace|${dim}|${zeros.join('')}|${tsOf.map(tClass).join(',')}|${t}|${g}|${signShape(p, v)}`,
      data: { p: nums(p), v: nums(v), zeros },
      answer,
    }
  }
}

// Punkte auf der Geraden mit gegebenem Abstand vom Stützpunkt (zwei Lösungen): Stufe 4 mit gegebener Geraden, Stufe 5
// mit der Geraden durch zwei Punkte
function buildLineDistance(rng: Rng, level: Level): Built {
  for (;;) {
    const { A, B, t, g } = names(rng)
    const { v, length } = pythagorean(rng, 3)
    const a = pickPoint(rng, 3, 4)
    const b = vecAdd(a, v)
    const L = rng.chance(0.6) ? length * rng.int(1, 2) : rng.pick([2, 3, 4, 5, 6, 8, 9, 10].filter((x) => x % length !== 0))
    const k = ratDiv(rat(L), rat(length))
    const steps: GuidedStep[] = []
    const P = level === 5 ? A : rng.pick(['P', 'A', 'B'])
    if (level === 5) {
      const s1 = connectStep(rng, A, B, a, b)
      if (s1.choices.length < 3) continue
      steps.push(s1)
    }
    const dirName = level === 5 ? `\\overrightarrow{${A}${B}}` : '\\vec v'
    const lenName = `\\lvert ${dirName} \\rvert`
    const s2 = normStep(rng, lenName, v, 'laenge', GL_CARD.gerade)
    const tPm = `${t}_{1,2} = \\pm ${show(k)}`
    const s3 = choiceStep(rng, {
      id: 'parameter',
      title: 'Parameter',
      question: `Für welche Werte von $${t}$ hat der Punkt von $${P}$ den Abstand $${L}$?`,
      correct: math(tPm),
      wrongs: [
        { content: math(`${t}_{1,2} = \\pm ${L}`), rule: 'gl-distance-not-normed' },
        { content: math(`${t} = ${show(k)}`), rule: 'vec-one-solution' },
        { content: math(`${t}_{1,2} = \\pm ${show(ratDiv(rat(L), rat(length * length)))}`), rule: 'vec-length-no-root' },
      ],
      hint: `Ein Schritt $${t} = 1$ ist $${lenName} = ${length}$ lang. Für den Abstand $${L}$ brauchst du $${t} = \\pm \\frac{${L}}{${length}}$: in beide Richtungen.`,
      explanation: {
        detailed: `Der Punkt zu $${t}$ hat von $${P}$ den Abstand $\\lvert ${t} \\rvert \\cdot ${lenName} = \\lvert ${t} \\rvert \\cdot ${length}$. Aus $\\lvert ${t} \\rvert \\cdot ${length} = ${L}$ folgt $${tPm}$.`,
        short: `$\\lvert ${t} \\rvert \\cdot ${length} = ${L} \\;\\Rightarrow\\; ${tPm}$.`,
      },
      established: [tPm],
      cards: [GL_CARD.gerade],
    })
    const q1 = at(a, v, ratNeg(k))
    const q2 = at(a, v, k)
    const pair = (x: Vec, y: Vec) => `Q_1(${x.map(show).join(' \\mid ')}),\\; Q_2(${y.map(show).join(' \\mid ')})`
    const sol = pair(q1, q2)
    const s4 = choiceStep(rng, {
      id: 'punkte',
      title: 'Punkte',
      question: 'Welche Punkte sind das?',
      correct: math(sol),
      wrongs: [
        { content: math(pair(at(a, v, rat(-L)), at(a, v, rat(L)))), rule: 'gl-distance-not-normed' },
        {
          content: math(pair(vecScale(ratNeg(k), v), vecScale(k, v))),
          rule: 'vec-foot-no-start',
          why: {
            detailed: `Die Punkte der Geraden sind Stützvektor **plus** $${t}$-mal Richtungsvektor. Nur $\\pm ${show(k)} \\cdot ${dirName}$ führt vom Ursprung weg, nicht von $${P}$: Du musst beim Stützpunkt starten.`,
            short: `Stützvektor plus $${t}$-mal Richtung, nicht nur die Richtung.`,
          },
        },
        { content: math(pair(vecAdd(vecScale(ratNeg(k), a), v), vecAdd(vecScale(k, a), v))), rule: 'gl-param-on-support' },
      ],
      hint: `Setz beide Werte von $${t}$ in die Parameterform ein.`,
      explanation: {
        detailed: `$${vecLatex(a)} \\mp ${show(k)} \\cdot ${vecLatex(v)}$ ergibt $${sol}$.`,
        short: `$${sol}$.`,
      },
      established: [sol],
      cards: [GL_CARD.gerade],
    })
    if ([s2, s3, s4].some((s) => s.choices.length < 4)) continue
    steps.push(s2, s3, s4)
    if (vecEq(vecScale(ratNeg(k), v), q1)) continue
    const drawing = lineFigure({
      name: g,
      p: a,
      v,
      pName: P,
      points: [
        { at: nums(q1), label: 'Q_1', color: 'r', phase: 4 },
        { at: nums(q2), label: 'Q_2', color: 'c', phase: 5 },
      ],
      ts: [-Number(k.n) / Number(k.d), Number(k.n) / Number(k.d)],
      play: true,
      caption: caption(3, `Von $${P}$ aus in beide Richtungen den Abstand $${L}$.`),
    })
    const lineLatex = paramFormLatex(g, a, [[t, v]])
    return {
      kind: 'lineDistance',
      instruction:
        level === 5
          ? `Welche Punkte $Q$ auf der Geraden durch $${A}$ und $${B}$ haben von $${A}$ den Abstand $${L}$?`
          : `Der Stützpunkt von $${g}$ heißt $${P}$. Welche Punkte $Q$ auf $${g}$ haben von $${P}$ den Abstand $${L}$?`,
      functionLatex: level === 5 ? `${pointLatex(A, a)},\\; ${pointLatex(B, b)}` : lineLatex,
      steps,
      cards: [GL_CARD.gerade],
      resultLatex: sol,
      resultDrawing: drawing,
      form: `lineDistance|${level}|${isInteger(k) ? 'int' : 'frac'}|${P}|${t}|${g}|${signShape(a, v)}`,
      data: { p: nums(a), v: nums(v), L: [L] },
      answer: [...nums(q1), ...nums(q2)],
    }
  }
}

export const LINE_BUILDERS = {
  lineThrough: buildLineThrough,
  linePoint: buildLinePoint,
  lineContains: buildLineContains,
  lineTrace: buildLineTrace,
  lineDistance: buildLineDistance,
} as const satisfies Partial<Record<VectorKind, (rng: Rng, level: Level) => Built>>
