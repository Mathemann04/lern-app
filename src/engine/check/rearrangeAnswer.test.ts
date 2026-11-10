import { describe, expect, it } from 'vitest'
import { toLatex } from '../expr/print.ts'
import { type Expr, eq } from '../expr/types.ts'
import { parseLatex } from '../parse/latex.ts'
import type { RearrangeTask } from '../rearrange/task.ts'
import { generateRearrangeTask } from '../tasks/rearrangeTerms.ts'
import { type RearrangeVerdict, checkRearrangeAnswer, prepareRearrangeCheck, prepareRearrangeFree, rearrangeFreeVerdict } from './rearrangeAnswer.ts'

const p = (latex: string): Expr => {
  const r = parseLatex(latex)
  if (!r.ok) throw new Error(r.message)
  return r.expr
}

const task = (lhs: string, rhs: string, target = 'x', conditions: RearrangeTask['conditions'] = []): RearrangeTask => ({ equation: eq(p(lhs), p(rhs)), target, conditions })
const check = (t: RearrangeTask, input: string) => checkRearrangeAnswer(prepareRearrangeCheck(t), input)
// erkannte typische Fehler: einer, oder alle, zu denen das Ergebnis passt (Stufe 5)
const ruleIds = (v: RearrangeVerdict) => (v.kind === 'knownError' ? [v.wrong.rule.id] : v.kind === 'knownErrors' ? v.wrongs.map((w) => w.rule.id) : [])

describe('Umstellen frei: richtige und fertige Ergebnisse', () => {
  const t = task('y', '\\frac{3(x-a)}{b}+c')

  it('nimmt das Ergebnis mit und ohne „x =" an, auch andersherum', () => {
    expect(check(t, '\\frac{by-bc+3a}{3}')).toEqual({ kind: 'correct' })
    expect(check(t, 'x=\\frac{by-bc+3a}{3}')).toEqual({ kind: 'correct' })
    expect(check(t, '\\frac{3a+by-bc}{3}=x')).toEqual({ kind: 'correct' })
    expect(check(t, '\\frac{b(y-c)+3a}{3}')).toEqual({ kind: 'unfinished', reason: 'numerator' })
    expect(check(t, '\\frac{1}{3}(by-bc+3a)')).toEqual({ kind: 'correct' })
  })

  it('gleichwertige Formen mit anderen Vorzeichen zählen', () => {
    const both = task('ax+b', 'cx+d')
    expect(check(both, '\\frac{d-b}{a-c}')).toEqual({ kind: 'correct' })
    expect(check(both, '\\frac{b-d}{c-a}')).toEqual({ kind: 'correct' })
    expect(check(both, '-\\frac{b-d}{a-c}')).toEqual({ kind: 'correct' })
  })

  it('ausgeklammerte Buchstaben sind erlaubt', () => {
    const t3 = task('\\frac{x-3a}{x-a}', 'b')
    expect(check(t3, '\\frac{a(b-3)}{b-1}')).toEqual({ kind: 'correct' })
    expect(check(t3, '\\frac{ab-3a}{b-1}')).toEqual({ kind: 'correct' })
  })

  it('Wurzeln: ein Bruch unter der Wurzel oder im Quadrat zählt wie ein Bruch', () => {
    const circle = task('y', '2\\sqrt{a^2-x^2}')
    expect(check(circle, '\\frac{\\sqrt{4a^2-y^2}}{2}')).toEqual({ kind: 'correct' })
    expect(check(circle, '\\sqrt{\\frac{4a^2-y^2}{4}}')).toEqual({ kind: 'correct' })
    expect(check(circle, '\\sqrt{a^2-\\frac{y^2}{4}}')).toEqual({ kind: 'unfinished', reason: 'several' })
    const diff = task('y', '\\sqrt{x+a}-\\sqrt{x}')
    expect(check(diff, '\\frac{(a-y^2)^2}{4y^2}')).toEqual({ kind: 'correct' })
    expect(check(diff, '\\left(\\frac{a-y^2}{2y}\\right)^2')).toEqual({ kind: 'correct' })
  })
})

describe('Umstellen frei: noch nicht fertig', () => {
  const t = task('y', '\\frac{3(x-a)}{b}+c')

  it('mehrere Brüche, Doppelbruch, nicht gekürzt', () => {
    expect(check(t, '\\frac{b(y-c)}{3}+a')).toEqual({ kind: 'unfinished', reason: 'several' })
    expect(check(t, '\\frac{by-bc}{3}+a')).toEqual({ kind: 'unfinished', reason: 'several' })
    expect(check(t, '\\frac{2by-2bc+6a}{6}')).toEqual({ kind: 'unfinished', reason: 'not-reduced' })
    expect(check(t, '\\frac{\\frac{b(y-c)}{3}+a}{1}')).toEqual({ kind: 'unfinished', reason: 'nested' })
    expect(check(t, '\\frac{by-bc+2a+a}{3}')).toEqual({ kind: 'unfinished', reason: 'numerator' })
  })

  it('x noch auf beiden Seiten oder nicht allein: richtig umgeformt, aber nicht aufgelöst', () => {
    const both = task('a(x+b)', 'c(x-d)')
    expect(check(both, '\\frac{cx-cd-ab}{a}')).toEqual({ kind: 'unfinished', reason: 'not-isolated' })
    expect(check(both, 'x(c-a)=ab+cd')).toEqual({ kind: 'unfinished', reason: 'not-isolated' })
    // gilt immer, sagt nichts über x; gilt nicht für die Lösung
    expect(check(both, 'x')).toEqual({ kind: 'wrong' })
    expect(check(both, '2x')).toEqual({ kind: 'wrong' })
    expect(check(both, 'x(c-a)=ab-cd')).toEqual({ kind: 'wrong' })
  })
})

describe('Umstellen frei: Fehler', () => {
  it('erkennt typische Fehler', () => {
    const both = task('a(x+b)', 'c(x-d)')
    const v = check(both, '\\frac{c-a}{ab+cd}')
    expect(v.kind).toBe('knownError')
    if (v.kind === 'knownError') expect(v.wrong.rule.id).toBe('eq-fraction-flipped')
    const circle = task('y', '2\\sqrt{a^2-x^2}')
    const root = check(circle, 'a-\\frac{y}{2}')
    expect(root.kind === 'knownError' && root.wrong.rule.id).toBe('eq-root-termwise')
  })

  it('erkennt die Fehler aus dem Baukasten: Ausklammern, Minus vor der Klammer, Malnehmen', () => {
    const id = (t: RearrangeTask, input: string) => {
      const v = check(t, input)
      return v.kind === 'knownError' ? v.wrong.rule.id : v.kind
    }
    expect(id(task('ax-bx', 'c'), '\\frac{c}{a+b}')).toBe('eq-factor-sign')
    expect(id(task('a-c(x-d)', 'x'), '\\frac{a-cd}{c+1}')).toBe('eq-minus-bracket')
    expect(id(task('\\frac{x}{a}', 'c-b'), 'ac-b')).toBe('eq-multiply-one-term')
  })

  it('falsches Vorzeichen', () => {
    expect(check(task('ax+b', 'cx+d'), '\\frac{d-b}{c-a}')).toEqual({ kind: 'wrongSign' })
  })

  it('unlesbar: fremde Buchstaben, Großbuchstaben, zwei Gleichheitszeichen', () => {
    const t = task('y', 'm(x-a)+b', 'm')
    expect(check(t, 'z')).toEqual({ kind: 'unreadable', message: 'In der Aufgabe kommen nur $a$, $b$, $m$, $x$ und $y$ vor. Was soll $z$ bedeuten?' })
    expect(check(t, '\\frac{Y-b}{x-a}')).toEqual({ kind: 'unreadable', message: 'Schreibe $y$ bitte klein.' })
    expect(check(t, 'm=1=1').kind).toBe('unreadable')
    expect(check(t, 'm=').kind).toBe('unreadable')
  })

  it('Texte für die Oberfläche', () => {
    expect(rearrangeFreeVerdict({ kind: 'unfinished', reason: 'not-isolated' }, 'x').message).toContain('$x$ muss allein')
    const free = prepareRearrangeFree({ level: 3, seed: 3 })
    expect(free.answerLabel).toBe('x =')
    expect(free.keyboard).toMatchObject({ kind: 'rearrange', root: true })
  })
})

describe('Umstellen frei ab Stufe 4: jede gleichwertige Form ohne Doppelbruch', () => {
  const lenient = (t: RearrangeTask, input: string) => checkRearrangeAnswer(prepareRearrangeCheck(t, true), input)

  it('e-Funktion: verschiedene Schreibweisen des Logarithmus', () => {
    const t = task('e^{2x}', 'y')
    expect(lenient(t, '\\frac{\\ln y}{2}')).toEqual({ kind: 'correct' })
    expect(lenient(t, '\\frac{1}{2}\\ln y')).toEqual({ kind: 'correct' })
    expect(lenient(t, '\\ln\\sqrt{y}')).toEqual({ kind: 'correct' })
    // \ln auf der anderen Seite vergessen: 2x = y
    expect(lenient(t, '\\frac{y}{2}')).toEqual(expect.objectContaining({ kind: 'knownError' }))
  })

  it('Bruch im Logarithmus zählt wie ein Buchstabe, ein Doppelbruch auch dort nicht', () => {
    const t = task('\\frac{ae^{x}+b}{e^{x}-c}', 'y', 'x', [{ lhs: p('y'), rel: '>', rhs: p('a') }])
    expect(lenient(t, '\\ln\\left(\\frac{b+cy}{y-a}\\right)')).toEqual({ kind: 'correct' })
    expect(lenient(t, '\\ln(b+cy)-\\ln(y-a)')).toEqual({ kind: 'correct' })
    expect(lenient(t, '\\ln\\left(\\frac{\\frac{b}{y}+c}{1-\\frac{a}{y}}\\right)')).toEqual({ kind: 'unfinished', reason: 'nested' })
  })

  it('Wurzeln in Wurzeln: ausmultipliziert oder ineinander', () => {
    const t = task('y', '\\sqrt{a+\\sqrt{b+\\sqrt{x}}}')
    expect(lenient(t, '((y^2-a)^2-b)^2')).toEqual({ kind: 'correct' })
    expect(lenient(t, '(y^4-2ay^2+a^2-b)^2')).toEqual({ kind: 'correct' })
    expect(lenient(t, '(y^2-a-b)^2')).toEqual(expect.objectContaining({ kind: 'knownError' }))
  })

  it('Doppelbruch im Ergebnis ist noch nicht fertig', () => {
    const t = task('\\ln(x+a)-\\ln x', 'b')
    expect(lenient(t, '\\frac{a}{e^b-1}')).toEqual({ kind: 'correct' })
    expect(lenient(t, '\\frac{1}{\\frac{e^b-1}{a}}')).toEqual({ kind: 'unfinished', reason: 'nested' })
  })

  it('Tastatur mit e^x, ln und log_a in Stufe 4', () => {
    expect(prepareRearrangeFree({ level: 4, seed: 33 }).keyboard).toMatchObject({ kind: 'rearrange', exp: true })
    expect(prepareRearrangeFree({ level: 3, seed: 3 }).keyboard).toMatchObject({ kind: 'rearrange', exp: false })
  })

  it('Winkelfunktionen: Umkehrfunktion richtig, Kehrwert als typischer Fehler', () => {
    const t = task('\\frac{\\sin x+\\cos x}{\\sin x-\\cos x}', 'y', 'x', [{ lhs: p('x'), rel: '<', rhs: p('\\frac{\\pi}{2}') }])
    expect(lenient(t, '\\arctan\\left(\\frac{y+1}{y-1}\\right)')).toEqual({ kind: 'correct' })
    expect(lenient(t, '\\frac{1}{\\tan\\left(\\frac{y+1}{y-1}\\right)}')).toEqual(expect.objectContaining({ kind: 'knownError' }))
    // Bruch in der Umkehrfunktion zählt wie ein Buchstabe
    expect(lenient(t, '\\arctan\\left(\\frac{\\frac{1}{y}+1}{1-\\frac{1}{y}}\\right)')).toEqual({ kind: 'unfinished', reason: 'nested' })
  })

  it('Areafunktionen: als arsinh oder als ln geschrieben', () => {
    const t = task('a\\sinh x+b', 'y')
    expect(lenient(t, '\\operatorname{arsinh}\\left(\\frac{y-b}{a}\\right)')).toEqual({ kind: 'correct' })
    expect(lenient(t, '\\ln\\left(\\frac{y-b}{a}+\\sqrt{\\left(\\frac{y-b}{a}\\right)^2+1}\\right)')).toEqual({ kind: 'correct' })
  })

  it('Tastatur mit zweiter Seite „Funktionen" bei Winkel- und Hyperbelfunktionen', () => {
    expect(prepareRearrangeFree({ level: 4, seed: 33 }).keyboard).toMatchObject({ kind: 'rearrange', trig: true })
    expect(prepareRearrangeFree({ level: 4, seed: 25 }).keyboard).toMatchObject({ kind: 'rearrange', trig: false })
  })
})

describe('Umstellen frei: Zufallsaufgaben der Stufen 1 bis 4', () => {
  for (const level of [1, 2, 3, 4] as const) {
    it(`Stufe ${level}: Lösung richtig, falsche Ergebnisse als Fehler erkannt`, () => {
      for (let seed = 1; seed <= 80; seed++) {
        const t = generateRearrangeTask({ level, seed }).task
        const context = prepareRearrangeCheck(t, level >= 4)
        const label = `${level}-${seed}: ${toLatex(t.equation.lhs)} = ${toLatex(t.equation.rhs)}`
        const result = toLatex(context.solution.result)
        expect(context.points.length, label).toBeGreaterThanOrEqual(12)
        expect(checkRearrangeAnswer(context, result), `${label}: ${result}`).toEqual({ kind: 'correct' })
        expect(checkRearrangeAnswer(context, `${t.target} = ${result}`), label).toEqual({ kind: 'correct' })
        for (const w of context.wrongs) {
          if (!w.result) continue
          const verdict = checkRearrangeAnswer(context, toLatex(w.result))
          expect(verdict.kind, `${label}: ${w.rule.id} ${toLatex(w.result)}`).toBe('knownError')
        }
      }
    }, 60_000)
  }
})

describe('Umstellen frei: Differentialgleichungen (Stufe 5, Teil 7c)', () => {
  // f'' = k^2 f, f(0) = a, f'(0) = 0 und y = f(x), das Beispiel aus dem Plan
  const plan = generateRearrangeTask({ level: 5, seed: 427 }).task
  const context = prepareRearrangeCheck(plan, true)
  const verdict = (input: string) => {
    const v = checkRearrangeAnswer(context, input)
    return v.kind === 'knownError' ? v.wrong.rule.id : v.kind
  }

  it('Tastatur mit der Seite „Funktionen“ (arcosh) bei f\'\' = k^2 f', () => {
    expect(prepareRearrangeFree({ level: 5, seed: 427 }).keyboard).toMatchObject({ kind: 'rearrange', trig: true })
  })

  it('Ergebnis aus dem Plan, auch als arcosh', () => {
    expect(verdict('\\frac{1}{k}\\ln\\left(\\frac{y+\\sqrt{y^2-a^2}}{a}\\right)')).toBe('correct')
    expect(verdict('\\frac{1}{k}\\operatorname{arcosh}\\left(\\frac{y}{a}\\right)')).toBe('correct')
  })

  it('typische Fehler beim Lösen der Differentialgleichung werden erkannt, auch vor der Substitution', () => {
    expect(verdict('\\frac{1}{k}\\ln\\frac{y}{a}')).toBe('eq-ode-initial-unused')
    expect(verdict('\\frac{1}{k}\\ln\\left(\\frac{y+\\sqrt{y^2-4a^2}}{2a}\\right)')).toBe('eq-ode-not-halved')
  })

  it('Stufe 5: Lösung richtig, falsche Ergebnisse der Differentialgleichungen als Fehler erkannt', () => {
    let checked = 0
    for (let seed = 1; seed <= 300; seed++) {
      const g = generateRearrangeTask({ level: 5, seed })
      if (g.template.id !== 'baukasten-5-dgl') continue
      const c = prepareRearrangeCheck(g.task, true)
      const label = `5-${seed}`
      expect(checkRearrangeAnswer(c, toLatex(c.solution.result)), label).toEqual({ kind: 'correct' })
      for (const w of c.wrongs) {
        if (!w.result || !w.rule.id.startsWith('eq-ode')) continue
        expect(ruleIds(checkRearrangeAnswer(c, toLatex(w.result))), `${label}: ${w.rule.id} ${toLatex(w.result)}`).toContain(w.rule.id)
        checked++
      }
    }
    expect(checked).toBeGreaterThan(40)
  }, 60_000)
})

describe('Umstellen frei: die Endform der Engine ist fertig', () => {
  // 5-1157: f' = k(b - f) … im ln; die Engine lässt einen Bruch im Bruch stehen, so zeigt ihn auch der geführte Modus
  it('genau die Endform der Engine zählt als fertig, eine andere Form mit Doppelbruch nicht', () => {
    const c = prepareRearrangeCheck(generateRearrangeTask({ level: 5, seed: 1157 }).task, true)
    expect(toLatex(c.solution.result)).toBe('-\\frac{\\ln\\left(\\frac{2\\left(y - \\frac{q}{r}\\right) + p}{2}\\right)}{2}')
    expect(checkRearrangeAnswer(c, toLatex(c.solution.result))).toEqual({ kind: 'correct' })
    expect(checkRearrangeAnswer(c, '-\\frac{1}{2}\\ln\\left(\\frac{2y-\\frac{2q}{r}+p}{2}\\right)')).toEqual({ kind: 'unfinished', reason: 'nested' })
  })

  it('auch mit anderer Reihenfolge der Summanden', () => {
    const level3 = prepareRearrangeCheck(generateRearrangeTask({ level: 3, seed: 107 }).task)
    expect(checkRearrangeAnswer(level3, '\\sqrt{c\\left(y-d\\right)-ab}+5')).toEqual({ kind: 'correct' })
    expect(checkRearrangeAnswer(level3, '5+\\sqrt{c\\left(y-d\\right)-ab}')).toEqual({ kind: 'correct' })
    const level5 = prepareRearrangeCheck(generateRearrangeTask({ level: 5, seed: 569 }).task, true)
    expect(checkRearrangeAnswer(level5, '-\\sqrt{\\frac{m}{4p\\left(y-\\frac{q}{r}\\right)}}+m')).toEqual({ kind: 'correct' })
  })
})

describe('Umstellen frei: Determinanten (Stufe 5, Teil 8a)', () => {
  // \det\begin{pmatrix} e^{x} & e^{-x} \\ a & b \end{pmatrix} = y, das Beispiel aus dem Plan
  const plan = generateRearrangeTask({ level: 5, seed: 1460 }).task
  const context = prepareRearrangeCheck(plan, true)
  const verdict = (input: string) => {
    const v = checkRearrangeAnswer(context, input)
    return v.kind === 'knownError' ? v.wrong.rule.id : v.kind
  }

  it('Ergebnis aus dem Plan; Tastatur mit den Buchstaben der Einträge und e^x', () => {
    expect(verdict('\\ln\\left(\\frac{y+\\sqrt{y^2+4ab}}{2b}\\right)')).toBe('correct')
    expect(prepareRearrangeFree({ level: 5, seed: 1460 }).keyboard).toMatchObject({ kind: 'rearrange', letters: ['a', 'b', 'x', 'y'], exp: true })
  })

  it('typische Fehler bei der Determinante werden erkannt', () => {
    expect(verdict('\\ln\\left(\\frac{y+\\sqrt{y^2+4ab}}{2a}\\right)')).toBe('eq-det-rows')
    expect(verdict('\\ln\\frac{y}{b}')).toBe('eq-det-main')
  })

  it('passt das Ergebnis auch zu späteren Fehlern, werden alle genannt und keiner einzeln gezählt', () => {
    // Diagonalen vertauscht, später beim Rüberbringen das Vorzeichen nicht gewechselt oder bei der pq-Formel
    const swapped = '\\ln\\left(\\frac{\\sqrt{y^2+4ab}-y}{2b}\\right)'
    expect(ruleIds(checkRearrangeAnswer(context, swapped))).toEqual(['eq-det-swapped', 'eq-sign-not-flipped', 'eq-pq-sign'])
    const v = prepareRearrangeFree({ level: 5, seed: 1460 }).check(swapped)
    expect(v.kind).toBe('wrong')
    expect(v.error).toBeUndefined()
    expect(v.message).toContain('passt zu mehreren typischen Fehlern')
    expect(v.explanation?.detailed).toContain('Haupt- und Nebendiagonale vertauscht: Erst die Hauptdiagonale')
    expect(v.explanation?.detailed).toContain('Beim Rüberbringen das Vorzeichen nicht gewechselt: ')
  })

  it('Stufe 5: Lösung richtig, falsche Ergebnisse der Determinanten als Fehler erkannt', () => {
    let checked = 0
    for (let seed = 1; seed <= 400; seed++) {
      const g = generateRearrangeTask({ level: 5, seed })
      if (g.template.id !== 'baukasten-5-determinante') continue
      const c = prepareRearrangeCheck(g.task, true)
      const label = `5-${seed}`
      expect(checkRearrangeAnswer(c, toLatex(c.solution.result)), label).toEqual({ kind: 'correct' })
      for (const w of c.wrongs) {
        if (!w.result) continue
        const found = ruleIds(checkRearrangeAnswer(c, toLatex(w.result)))
        // ein Fehler beim Umstellen wird nie allein der Determinante zugeschrieben
        if (!w.rule.id.startsWith('eq-det')) {
          expect(found.some((id) => !id.startsWith('eq-det')), `${label}: ${w.rule.id} ${toLatex(w.result)}`).toBe(true)
          continue
        }
        expect(found, `${label}: ${w.rule.id} ${toLatex(w.result)}`).toContain(w.rule.id)
        checked++
      }
    }
    expect(checked).toBeGreaterThan(60)
  }, 60_000)
})
