import { parseDecimal } from '../rational.ts'
import { type Expr, type FnName, E, PI, add, dec, div, fn, log, mul, neg, num, pow, root, variable } from '../expr/types.ts'

// Liest die LaTeX-Ausgabe der Mathe-Tastatur (MathLive) und der eigenen Ausgabe (print.ts)
// in einen Termbaum ein. Bewusst klein gehalten: genau die Schreibweisen, die beim Ableiten
// vorkommen, mit verständlichen Fehlermeldungen (Text mit $…$-Formeln wie in richText.ts).
//
// Schreibweisen:
// - Dezimalkomma: 0{,}5, 0,5 und 0.5
// - Mal: implizit (2x, x\sin x), \cdot, \times, *; geteilt: \frac{a}{b}, \frac12, /, \div
// - Klammern: (…), [ ], \left( … \right), \mleft( … \mright)
// - Funktionen mit Klammer \sin(3x) oder ohne: \sin 3x = \sin(3x), \sin x^2 = \sin(x^2),
//   \sin^2 x = (\sin x)^2; \ln, \log_2, \lg, \operatorname{arsinh} …
// - e ist immer die eulersche Zahl, \pi die Kreiszahl
// - davor darf „f'(x) =" stehen

export type ParseResult = { readonly ok: true; readonly expr: Expr } | { readonly ok: false; readonly message: string }

class ParseError extends Error {}

type Token =
  | { readonly kind: 'digit'; readonly value: string }
  | { readonly kind: 'letter'; readonly value: string }
  | { readonly kind: 'command'; readonly value: string }
  | { readonly kind: 'symbol'; readonly value: string }

const FUNCTIONS: Readonly<Record<string, FnName>> = {
  sin: 'sin',
  cos: 'cos',
  tan: 'tan',
  cot: 'cot',
  ln: 'ln',
  arcsin: 'arcsin',
  arccos: 'arccos',
  arctan: 'arctan',
  sinh: 'sinh',
  cosh: 'cosh',
  tanh: 'tanh',
  arsinh: 'arsinh',
  arcosh: 'arcosh',
  artanh: 'artanh',
}

// Befehle ohne Bedeutung für den Wert: Abstände und Klammergrößen
const IGNORED = new Set([',', ';', ':', '!', ' ', 'quad', 'qquad', 'displaystyle', 'textstyle', 'limits', 'nolimits'])
const SIZES = new Set(['left', 'right', 'mleft', 'mright', 'big', 'Big', 'bigg', 'Bigg', 'bigl', 'bigr', 'Bigl', 'Bigr', 'biggl', 'biggr', 'Biggl', 'Biggr'])
const SYMBOL_COMMANDS: Readonly<Record<string, string>> = {
  cdot: '*',
  times: '*',
  ast: '*',
  div: '/',
  lparen: '(',
  rparen: ')',
  lbrack: '[',
  rbrack: ']',
  prime: "'",
  vert: '|',
  lvert: '|',
  rvert: '|',
}
const TEXT_COMMANDS = new Set(['mathrm', 'operatorname', 'mathit', 'text', 'textrm', 'mbox'])

function tokenize(input: string): Token[] {
  // Dezimalkomma in der Form von MathLive: 0{,}5
  const text = input.replaceAll('{,}', ',').replaceAll('{.}', '.')
  const tokens: Token[] = []
  let i = 0
  while (i < text.length) {
    const c = text[i]
    if (/\s/.test(c) || c === '~') {
      i++
    } else if (c === '\\') {
      const word = /^[a-zA-Z]+/.exec(text.slice(i + 1))
      const name = word ? word[0] : text[i + 1] ?? ''
      i += 1 + Math.max(name.length, 1)
      if (IGNORED.has(name)) continue
      if (SIZES.has(name)) {
        // \left. und \right. sind unsichtbare Klammern
        while (text[i] === ' ') i++
        if (text[i] === '.') i++
        continue
      }
      if (name in SYMBOL_COMMANDS) tokens.push({ kind: 'symbol', value: SYMBOL_COMMANDS[name] })
      else tokens.push({ kind: 'command', value: name })
    } else if (/\d/.test(c)) {
      tokens.push({ kind: 'digit', value: c })
      i++
    } else if (/[a-zA-Z]/.test(c)) {
      tokens.push({ kind: 'letter', value: c })
      i++
    } else {
      tokens.push({ kind: 'symbol', value: c === '−' ? '-' : c === '·' ? '*' : c })
      i++
    }
  }
  return tokens
}

const isSymbol = (t: Token | undefined, value: string) => t?.kind === 'symbol' && t.value === value

// Für Fehlermeldungen: ein Token so zeigen, wie man es sieht
function shown(t: Token): string {
  if (t.kind === 'symbol') return t.value === '*' ? '$\\cdot$' : `„${t.value}"`
  if (t.kind === 'command') return `„\\${t.value}"`
  return `„${t.value}"`
}

class Parser {
  private pos = 0
  private readonly tokens: readonly Token[]

  constructor(tokens: readonly Token[]) {
    this.tokens = tokens
  }

  private peek(offset = 0): Token | undefined {
    return this.tokens[this.pos + offset]
  }

  private next(): Token {
    const t = this.tokens[this.pos]
    if (!t) throw new ParseError('Hier fehlt noch etwas.')
    this.pos++
    return t
  }

  private expectClosing(open: string) {
    const close = open === '(' ? ')' : open === '[' ? ']' : '}'
    const t = this.peek()
    if (isSymbol(t, close)) {
      this.pos++
      return
    }
    if (open === '{') {
      // Geschweifte Klammern sieht man in der Eingabe nicht; eine übrige runde Klammer schon
      if (isSymbol(t, ')') || isSymbol(t, ']')) throw new ParseError('Hier ist eine Klammer zu viel.')
      throw new ParseError(t ? `Das Zeichen ${shown(t)} kann ich hier nicht lesen.` : 'Hier fehlt noch etwas.')
    }
    throw new ParseError('Eine Klammer ist nicht geschlossen.')
  }

  parseAll(): Expr {
    if (this.tokens.length === 0) throw new ParseError('Gib zuerst deine Ableitung ein.')
    const e = this.parseSum()
    const rest = this.peek()
    if (rest) {
      if (isSymbol(rest, ')') || isSymbol(rest, ']')) throw new ParseError('Hier ist eine Klammer zu viel.')
      if (isSymbol(rest, '=')) throw new ParseError("Gib nur den Term ein, der nach $f'(x) =$ kommt.")
      throw new ParseError(`Das Zeichen ${shown(rest)} kann ich hier nicht lesen.`)
    }
    return e
  }

  private atEndOfGroup(): boolean {
    const t = this.peek()
    return !t || isSymbol(t, ')') || isSymbol(t, ']') || isSymbol(t, '}')
  }

  private parseSum(): Expr {
    const terms = [this.parseProduct()]
    for (;;) {
      const t = this.peek()
      if (!isSymbol(t, '+') && !isSymbol(t, '-')) break
      this.pos++
      if (this.atEndOfGroup()) throw new ParseError(`Nach „${t!.value === '-' ? '−' : '+'}" fehlt noch etwas.`)
      const term = this.parseProduct()
      terms.push(t!.value === '-' ? neg(term) : term)
    }
    return add(...terms)
  }

  // Produkt mit Vorzeichen: −2x ist −(2x)
  private parseProduct(): Expr {
    const t = this.peek()
    if (isSymbol(t, '-') || isSymbol(t, '+')) {
      this.pos++
      if (this.atEndOfGroup()) throw new ParseError(`Nach „${t!.value === '-' ? '−' : '+'}" fehlt noch etwas.`)
      const rest = this.parseProduct()
      return t!.value === '-' ? neg(rest) : rest
    }
    let factors: Expr[] = [this.parsePower()]
    for (;;) {
      const t = this.peek()
      if (isSymbol(t, '*') || isSymbol(t, '/')) {
        this.pos++
        if (this.atEndOfGroup()) throw new ParseError(`Nach ${t!.value === '*' ? '$\\cdot$' : '„/"'} fehlt noch etwas.`)
        const factor = this.parseSignedFactor()
        if (t!.value === '*') factors.push(factor)
        else factors = [div(mul(...factors), factor)]
      } else if (this.startsFactor(t)) {
        factors.push(this.parsePower())
      } else {
        break
      }
    }
    return mul(...factors)
  }

  private parseSignedFactor(): Expr {
    const t = this.peek()
    if (isSymbol(t, '-')) {
      this.pos++
      return neg(this.parseSignedFactor())
    }
    return this.parsePower()
  }

  // Kann hier ein weiterer Faktor beginnen (Malnehmen ohne Zeichen)?
  private startsFactor(t: Token | undefined): boolean {
    if (!t) return false
    if (t.kind === 'digit' || t.kind === 'letter') return true
    if (t.kind === 'command') return true
    return isSymbol(t, '(') || isSymbol(t, '[') || isSymbol(t, '{')
  }

  private parsePower(): Expr {
    let base = this.parsePrimary()
    for (;;) {
      const t = this.peek()
      if (isSymbol(t, '^')) {
        this.pos++
        base = pow(base, this.parseArgument('Exponenten'))
      } else if (isSymbol(t, "'")) {
        throw new ParseError('Ableitungsstriche gehören nicht in die Antwort. Gib die fertige Ableitung ein.')
      } else if (isSymbol(t, '_')) {
        throw new ParseError('Tiefgestellte Zeichen brauchst du hier nur bei $\\log_a$.')
      } else {
        return base
      }
    }
  }

  // Argument von ^, \frac, \sqrt, _: {…} oder ein einzelnes Zeichen (x^2, \frac12)
  private parseArgument(what: string): Expr {
    const t = this.peek()
    if (!t || isSymbol(t, '}')) throw new ParseError(`Der ${what} fehlt noch.`)
    if (isSymbol(t, '{')) {
      this.pos++
      if (isSymbol(this.peek(), '}')) throw new ParseError(`Ein Feld ist noch leer (der ${what}).`)
      const e = this.parseSum()
      this.expectClosing('{')
      return e
    }
    if (isSymbol(t, '-')) {
      this.pos++
      return neg(this.parseArgument(what))
    }
    if (t.kind === 'digit') {
      this.pos++
      return num(Number(t.value))
    }
    return this.parsePrimary()
  }

  private parseNumber(): Expr {
    let digits = ''
    while (this.peek()?.kind === 'digit') digits += this.next().value
    const separator = this.peek()
    if ((isSymbol(separator, ',') || isSymbol(separator, '.')) && this.peek(1)?.kind === 'digit') {
      this.pos++
      let fraction = ''
      while (this.peek()?.kind === 'digit') fraction += this.next().value
      return dec(parseDecimal(`${digits},${fraction}`)!)
    }
    return num(BigInt(digits))
  }

  private parsePrimary(): Expr {
    const t = this.peek()
    if (!t) throw new ParseError('Hier fehlt noch etwas.')
    if (t.kind === 'digit') return this.parseNumber()
    if (t.kind === 'letter') {
      this.pos++
      return t.value === 'e' ? E : variable(t.value)
    }
    if (t.kind === 'command') return this.parseCommand()

    this.pos++
    switch (t.value) {
      case '(':
      case '[':
      case '{': {
        if (isSymbol(this.peek(), t.value === '(' ? ')' : t.value === '[' ? ']' : '}')) {
          throw new ParseError(t.value === '{' ? 'Ein Feld ist noch leer.' : 'Die Klammer ist leer.')
        }
        const e = this.parseSum()
        this.expectClosing(t.value)
        return e
      }
      case ',':
      case '.':
        throw new ParseError('Vor dem Komma fehlt eine Zahl, z. B. $0{,}5$.')
      case '|':
        throw new ParseError('Betragsstriche brauchst du hier nicht.')
      case '^':
        throw new ParseError('Vor dem Hochzeichen fehlt die Basis.')
      case ')':
      case ']':
        throw new ParseError('Hier ist eine Klammer zu viel.')
      case '=':
        throw new ParseError("Gib nur den Term ein, der nach $f'(x) =$ kommt.")
      default:
        throw new ParseError(`Das Zeichen ${shown(t)} kann ich hier nicht lesen.`)
    }
  }

  private parseCommand(): Expr {
    const name = this.next().value
    if (name in FUNCTIONS) return this.parseFunction(FUNCTIONS[name], `\\${name}`)
    switch (name) {
      case 'frac':
      case 'dfrac':
      case 'tfrac':
      case 'cfrac': {
        const numerator = this.parseArgument('Zähler')
        return div(numerator, this.parseArgument('Nenner'))
      }
      case 'sqrt': {
        let index = 2
        if (isSymbol(this.peek(), '[')) {
          this.pos++
          let digits = ''
          while (this.peek()?.kind === 'digit') digits += this.next().value
          if (!isSymbol(this.peek(), ']') || digits === '' || Number(digits) < 2) {
            throw new ParseError('Bei $\\sqrt[n]{\\;}$ muss oben eine ganze Zahl ab $2$ stehen.')
          }
          this.pos++
          index = Number(digits)
        }
        return root(this.parseArgument('Inhalt der Wurzel'), index)
      }
      case 'pi':
        return PI
      case 'exponentialE':
        return E
      case 'log': {
        if (!isSymbol(this.peek(), '_')) {
          throw new ParseError('Schreibe $\\ln$ für den natürlichen Logarithmus oder $\\log_a$ mit einer Basis $a$.')
        }
        this.pos++
        const base = this.parseArgument('Basis des Logarithmus')
        return this.parseFunctionArgument((arg) => log(base, arg), '\\log')
      }
      case 'lg':
        return this.parseFunctionArgument((arg) => log(num(10), arg), '\\lg')
      case 'placeholder':
        throw new ParseError('Ein Feld ist noch leer.')
      default:
        if (TEXT_COMMANDS.has(name)) return this.parseText()
        throw new ParseError(`Das Zeichen „\\${name}" kenne ich nicht.`)
    }
  }

  // \operatorname{arsinh}, \mathrm{e} …; MathLive schreibt auch \operatorname{\mathrm{arsinh}}
  private parseText(): Expr {
    const word = this.readTextWord()
    if (word === 'e') return E
    if (word in FUNCTIONS) return this.parseFunction(FUNCTIONS[word], `\\operatorname{${word}}`)
    if (word === 'lg') return this.parseFunctionArgument((arg) => log(num(10), arg), '\\lg')
    if (word.length === 1) return variable(word)
    throw new ParseError(`„${word}" kenne ich nicht.`)
  }

  // Buchstaben in geschweiften Klammern, auch verschachtelt in einem weiteren Textbefehl
  private readTextWord(): string {
    if (!isSymbol(this.peek(), '{')) throw new ParseError('Hier fehlt etwas in geschweiften Klammern.')
    this.pos++
    const inner = this.peek()
    let word = ''
    if (inner?.kind === 'command' && TEXT_COMMANDS.has(inner.value)) {
      this.pos++
      word = this.readTextWord()
    } else {
      while (this.peek()?.kind === 'letter') word += this.next().value
    }
    this.expectClosing('{')
    return word
  }

  // Funktion mit möglicher Potenz am Namen: \sin^2 x = (\sin x)^2
  private parseFunction(name: FnName, latex: string): Expr {
    let power: Expr | null = null
    if (isSymbol(this.peek(), '^')) {
      this.pos++
      power = this.parseArgument('Exponent')
      const value = power.kind === 'num' ? power.value : null
      if (!value || value.d !== 1n || value.n < 1n) {
        throw new ParseError(
          name === 'ln'
            ? 'Schreibe die Potenz um den ganzen Logarithmus: $(\\ln x)^2$.'
            : `Am Funktionsnamen ist nur eine positive ganze Hochzahl erlaubt, z. B. $${latex}^2 x$. Für die Umkehrfunktion schreibe z. B. $\\arcsin$.`,
        )
      }
    }
    const call = this.parseFunctionArgument((arg) => fn(name, arg), latex)
    return power ? pow(call, power) : call
  }

  // Argument in Klammern oder ohne Klammern: \sin 3x = \sin(3x), \ln x^2 = \ln(x^2)
  private parseFunctionArgument(build: (arg: Expr) => Expr, latex: string): Expr {
    const t = this.peek()
    if (isSymbol(t, '(') || isSymbol(t, '[')) {
      this.pos++
      if (isSymbol(this.peek(), t!.value === '(' ? ')' : ']')) throw new ParseError(`Bei $${latex}$ ist die Klammer leer.`)
      const arg = this.parseSum()
      this.expectClosing(t!.value)
      return build(arg)
    }
    const factors: Expr[] = []
    while (this.startsBareFactor(this.peek())) factors.push(this.parsePower())
    if (factors.length === 0) throw new ParseError(`Nach $${latex}$ fehlt das Argument, z. B. $${latex}(x)$.`)
    return build(mul(...factors))
  }

  // Teile eines Arguments ohne Klammer: Zahlen, Buchstaben, π, Brüche, Wurzeln
  private startsBareFactor(t: Token | undefined): boolean {
    if (!t) return false
    if (t.kind === 'digit' || t.kind === 'letter') return true
    return t.kind === 'command' && ['pi', 'exponentialE', 'frac', 'dfrac', 'tfrac', 'sqrt'].includes(t.value)
  }
}

// „f'(x) =" vorne abschneiden, falls vorhanden
function stripLeftSide(input: string): string | null {
  const parts = input.split('=')
  if (parts.length === 1) return input
  if (parts.length > 2) return null
  const left = parts[0]
    .replace(/\\(?:left|right|mleft|mright)/g, '')
    .replace(/\^\{?\\prime\}?|\\prime/g, "'")
    .replace(/\s|\\[,;: !]/g, '')
  return /^[fy]'+(\(x\))?$/.test(left) ? parts[1] : null
}

// Eingabe beim Umstellen: ein Term (die rechte Seite von „x = …") oder eine Gleichung; lhs ist null,
// wenn kein Gleichheitszeichen dasteht
export type EquationParseResult = { ok: true; lhs: Expr | null; rhs: Expr } | { ok: false; message: string }

export function parseLatexEquation(input: string): EquationParseResult {
  const parts = input.split('=')
  if (parts.length > 2) return { ok: false, message: 'Schreibe höchstens ein Gleichheitszeichen.' }
  try {
    const sides = parts.map((part) => {
      const tokens = tokenize(part)
      if (tokens.length === 0) throw new ParseError(parts.length === 1 ? 'Gib zuerst dein Ergebnis ein.' : 'Auf einer Seite des Gleichheitszeichens fehlt noch etwas.')
      return new Parser(tokens).parseAll()
    })
    return sides.length === 1 ? { ok: true, lhs: null, rhs: sides[0] } : { ok: true, lhs: sides[0], rhs: sides[1] }
  } catch (error) {
    if (error instanceof ParseError) return { ok: false, message: error.message }
    throw error
  }
}

export function parseLatex(input: string): ParseResult {
  try {
    const right = stripLeftSide(input)
    if (right === null) throw new ParseError("Gib nur den Term ein, der nach $f'(x) =$ kommt.")
    return { ok: true, expr: new Parser(tokenize(right)).parseAll() }
  } catch (error) {
    if (error instanceof ParseError) return { ok: false, message: error.message }
    throw error
  }
}
