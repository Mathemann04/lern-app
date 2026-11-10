// Breite einer Formel (KaTeX, \displaystyle) in em, aus dem LaTeX geschätzt, ohne Browser. Für Aufgaben mit
// Matrix (Determinanten, Teil 8a): Ihre Breite lässt sich nicht an der Zahl der Zeichen ablesen, weil die
// Zeilen untereinander stehen. Gemessen in Chromium (KaTeX wie in der App) an 35 Formeln mit
// \det\begin{pmatrix} und 600 mit Strichen liegt die echte Breite beim 0,89- bis 1,05-Fachen der Schätzung
// (am knappsten mit Klammern um eine Matrix); Brüche in einer Matrix schätzt sie zu breit (KaTeX setzt sie
// dort kleiner). Kalibrierung in latexWidth.test.ts. Die Werte folgen grob den Schriftmaßen von KaTeX;
// Abstände: Rechenzeichen 4/18 em je Seite, Relation 5/18 em.

const OPERATORS: Record<string, number> = {
  '\\ln': 0.86,
  '\\log': 1.3,
  '\\sin': 1.22,
  '\\cos': 1.33,
  '\\tan': 1.33,
  '\\cot': 1.33,
  '\\sinh': 1.75,
  '\\cosh': 1.86,
  '\\tanh': 1.86,
  '\\arcsin': 2.5,
  '\\arccos': 2.6,
  '\\arctan': 2.6,
  '\\det': 1.31,
  '\\arg': 1.45,
}

const LETTERS: Record<string, number> = {
  e: 0.47, a: 0.53, b: 0.43, c: 0.43, d: 0.52, f: 0.49, g: 0.48, h: 0.58, k: 0.52, m: 0.88, n: 0.6, p: 0.5, q: 0.46,
  r: 0.45, s: 0.47, t: 0.36, u: 0.57, v: 0.49, w: 0.72, x: 0.57, y: 0.49, z: 0.47, j: 0.41, l: 0.3, o: 0.48, i: 0.35,
}

// Inhalt einer Gruppe {…} ab der öffnenden Klammer und die Stelle danach
function group(s: string, i: number): [string, number] {
  let depth = 0
  for (let j = i; j < s.length; j++) {
    if (s[j] === '{') depth++
    else if (s[j] === '}') {
      depth--
      if (depth === 0) return [s.slice(i + 1, j), j + 1]
    }
  }
  return [s.slice(i + 1), s.length]
}

// Argument eines Befehls: Gruppe, Befehl oder ein Zeichen
function argument(s: string, i: number): [string, number] {
  while (s[i] === ' ') i++
  if (s[i] === '{') return group(s, i)
  if (s[i] === '\\') {
    const m = /^\\[a-zA-Z]+/.exec(s.slice(i))
    if (m) return [m[0], i + m[0].length]
  }
  return [s[i] ?? '', i + 1]
}

// An einem Trennzeichen teilen, nur auf oberster Ebene (nicht in Gruppen)
function splitTop(body: string, separator: string): string[] {
  const parts: string[] = []
  let depth = 0
  let start = 0
  for (let j = 0; j < body.length; j++) {
    const c = body[j]
    if (c === '{') depth++
    else if (c === '}') depth--
    else if (depth === 0 && body.startsWith(separator, j)) {
      parts.push(body.slice(start, j))
      start = j + separator.length
      j += separator.length - 1
    }
  }
  parts.push(body.slice(start))
  return parts
}

// Wie hoch ist der Inhalt bis zum passenden \right? 3: Matrix mit 3 Zeilen, 2: Bruch oder 2 Zeilen
function tallness(s: string, i: number): number {
  let depth = 1
  let j = i
  while (j < s.length && depth > 0) {
    if (s.startsWith('\\left', j)) depth++
    else if (s.startsWith('\\right', j)) depth--
    j++
  }
  const inner = s.slice(i, j)
  const m = /\\begin\{[a-z]*matrix\}(.*?)\\end/.exec(inner)
  if (m) return m[1].split('\\\\').length
  return /\\frac/.test(inner) ? 2 : 1
}

export function latexWidthEm(latex: string): number {
  let lastTall = 1
  const width = (s: string): number => {
    let w = 0
    let i = 0
    let previousAtom = false
    while (i < s.length) {
      const c = s[i]
      if (c === ' ') {
        i++
        continue
      }
      if (c === '{') {
        const [g, j] = group(s, i)
        w += width(g)
        i = j
        previousAtom = true
        continue
      }
      if (c === '^' || c === '_') {
        const [g, j] = argument(s, i + 1)
        w += 0.7 * width(g) + 0.05
        i = j
        previousAtom = true
        continue
      }
      if (c === '+' || c === '-' || c === '=' || c === '<' || c === '>') {
        if (c === '=' || c === '<' || c === '>') w += 0.78 + 0.56
        else w += previousAtom ? 0.78 + 0.44 : 0.78
        i++
        previousAtom = false
        continue
      }
      if (c === '(' || c === ')') {
        w += 0.39
        i++
        previousAtom = c === ')'
        continue
      }
      if (c === '[' || c === ']' || c === '|') {
        w += 0.28
        i++
        previousAtom = true
        continue
      }
      // Komma mit dem kleinen Abstand danach (\\sphericalangle(\\vec u, \\vec v))
      if (c === ',') {
        w += 0.44
        i++
        previousAtom = false
        continue
      }
      if (c === '&') {
        i++
        continue
      }
      if (/[0-9]/.test(c)) {
        w += 0.5
        i++
        previousAtom = true
        continue
      }
      if (/[a-zA-Z]/.test(c)) {
        w += LETTERS[c] ?? 0.6
        i++
        previousAtom = true
        continue
      }
      if (c === "'") {
        w += 0.3
        i++
        continue
      }
      if (c !== '\\') {
        w += 0.5
        i++
        continue
      }
      if (s.startsWith('\\\\', i)) {
        i += 2
        continue
      }
      const command = /^\\([a-zA-Z]+|.)/.exec(s.slice(i))![0]
      i += command.length
      if (command === '\\frac' || command === '\\dfrac') {
        const [a, j] = argument(s, i)
        const [b, k] = argument(s, j)
        w += Math.max(width(a), width(b)) + 0.24
        i = k
        previousAtom = true
        continue
      }
      if (command === '\\sqrt') {
        if (s[i] === '[') {
          i = s.indexOf(']', i) + 1
          w += 0.3
        }
        const [a, j] = argument(s, i)
        w += width(a) + 0.85
        i = j
        previousAtom = true
        continue
      }
      if (command === '\\left' || command === '\\right') {
        const delimiter = s[i] === '\\' ? (/^\\[a-zA-Z]+|^\\./.exec(s.slice(i))?.[0] ?? '\\') : (s[i] ?? '')
        i += delimiter.length
        // Klammern um hohe Inhalte (Matrix, Bruch) sind breiter, Betragsstriche nicht
        const tall = command === '\\left' ? tallness(s, i) : lastTall
        if (command === '\\left') lastTall = tall
        const bar = delimiter === '\\lvert' || delimiter === '\\rvert' || delimiter === '|'
        w += delimiter === '.' ? 0.12 : bar ? 0.33 : tall >= 3 ? 0.75 : tall === 2 ? 0.6 : 0.46
        previousAtom = command === '\\right'
        continue
      }
      if (command === '\\mathrm' || command === '\\operatorname' || command === '\\text') {
        const [a, j] = argument(s, i)
        w += a === 'd' ? 0.56 : a === 'i' ? 0.28 : a.length * 0.5
        i = j
        previousAtom = true
        continue
      }
      if (command === '\\,') {
        w += 0.17
        continue
      }
      if (command === '\\;') {
        w += 0.28
        continue
      }
      if (command === '\\quad') {
        w += 1
        continue
      }
      if (command === '\\cdot') {
        w += 0.28 + 0.44
        previousAtom = false
        continue
      }
      if (command === '\\to') {
        w += 1.0 + 0.56
        previousAtom = false
        continue
      }
      if (command === '\\infty') {
        w += 1.0
        previousAtom = true
        continue
      }
      if (command === '\\pi') {
        w += 0.57
        previousAtom = true
        continue
      }
      // Winkelzeichen ∢ (0,72 em), dazu die großen Klammern um zwei Vektoren
      if (command === '\\sphericalangle') {
        w += 1.2
        previousAtom = false
        continue
      }
      if (command === '\\displaystyle') continue
      if (command === '\\int' || command === '\\sum' || command === '\\lim') {
        // Grenzen: beim Integral klein rechts daneben, bei Summe und Grenzwert darüber und darunter
        let limits = 0
        while (s[i] === '_' || s[i] === '^') {
          const [g, j] = argument(s, i + 1)
          limits = Math.max(limits, 0.7 * width(g))
          i = j
        }
        w += command === '\\int' ? 0.95 + limits + 0.17 : Math.max(command === '\\sum' ? 1.44 : 1.22, limits) + 0.17
        previousAtom = false
        continue
      }
      if (command === '\\begin') {
        const [environment, j] = argument(s, i)
        const end = s.indexOf(`\\end{${environment}}`, j)
        const body = s.slice(j, end < 0 ? s.length : end)
        i = end < 0 ? s.length : end + `\\end{${environment}}`.length
        if (/matrix$/.test(environment)) {
          const rows = splitTop(body, '\\\\').map((row) => splitTop(row, '&').map((entry) => width(entry)))
          const columns = Math.max(...rows.map((row) => row.length))
          let matrix = 0
          for (let col = 0; col < columns; col++) matrix += Math.max(...rows.map((row) => row[col] ?? 0))
          // runde Klammern wachsen mit der Höhe der Matrix (gemessen: 0,66 em bei 2 Zeilen, 0,8 em bei 3)
          const paren = rows.length >= 3 ? 0.8 : 0.66
          matrix += (columns - 1) * 1.0 + (environment === 'pmatrix' ? 2 * paren : environment === 'vmatrix' ? 2 * 0.33 : 0) + 0.24
          w += matrix
          previousAtom = true
          continue
        }
        if (environment === 'gathered') {
          w += Math.max(...splitTop(body, '\\\\').map(width))
          previousAtom = true
          continue
        }
        w += width(body)
        continue
      }
      if (OPERATORS[command] !== undefined) {
        w += OPERATORS[command] + 0.17
        previousAtom = false
        continue
      }
      w += 0.6
      previousAtom = true
    }
    return w
  }
  return width(latex)
}
