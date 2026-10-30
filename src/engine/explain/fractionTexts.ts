import { toLatex } from '../expr/print.ts'
import type { Expr } from '../expr/types.ts'
import type { FractionShape } from '../fraction/task.ts'
import { m } from './format.ts'
import type { Explanation } from './texts.ts'

// Texte für Brüche im geführten Modus: Erklärungen, Tipps und „Warum ist das falsch?". Format
// Text mit $…$-Formeln (richText.ts). Die Zahlen und Terme kommen aus dem Rechenweg der
// Bruch-Engine (guided/fractionPlan.ts); „Warum ist das falsch?" nennt den Fehler und die Regel,
// verrät aber nicht das Ergebnis des Schritts.

const same = (text: string): Explanation => ({ detailed: text, short: text })

// „$4$ und $6$", „$a$, $b$ und $c$"
export function listing(items: readonly string[]): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} und ${items.at(-1)}`
}

// --- Warum ist das falsch? (je Fehlerregel aus fraction/errorRules.ts) ---

export const FRACTION_ERROR_TEXTS: Readonly<Record<string, Explanation>> = {
  'frac-add-across': {
    detailed:
      'Der Nenner wird nicht mitaddiert. Er sagt nur, in wie viele Teile das Ganze geteilt ist, und das ändert sich beim Addieren nicht. Erst auf einen gemeinsamen Nenner bringen, dann nur die Zähler zusammenrechnen: $\\frac{a}{n} + \\frac{b}{n} = \\frac{a + b}{n}$.',
    short: 'Der Nenner bleibt, nur die Zähler werden addiert: $\\frac{a}{n} + \\frac{b}{n} = \\frac{a + b}{n}$.',
  },
  'frac-expand-denominator-only': {
    detailed:
      'Beim Erweitern nimmst du Zähler und Nenner mit demselben Faktor mal. Wird nur der Nenner größer, ändert sich der Wert des Bruchs: $\\frac{a}{b} = \\frac{a \\cdot k}{b \\cdot k}$.',
    short: 'Zähler und Nenner mit demselben Faktor malnehmen: $\\frac{a}{b} = \\frac{a \\cdot k}{b \\cdot k}$.',
  },
  'frac-minus-bracket': {
    detailed: 'Das Minus vor einem Bruch gilt für seinen ganzen Zähler. Setze den Zähler in Klammern, bevor du ausmultiplizierst: $-(a - b) = -a + b$.',
    short: 'Das Minus gilt für den ganzen Zähler: $-(a - b) = -a + b$.',
  },
  'frac-whole-not-expanded': {
    detailed:
      'Auch die ganze Zahl muss auf den Hauptnenner. Sie ist ein Bruch mit dem Nenner $1$ und wird deshalb ebenfalls erweitert: $n = \\frac{n \\cdot k}{k}$.',
    short: 'Die ganze Zahl auch erweitern: $n = \\frac{n \\cdot k}{k}$.',
  },
  'frac-lcd-gcd': {
    detailed:
      'Das ist der größte gemeinsame Teiler der Nenner. Der Hauptnenner muss aber durch jeden Nenner teilbar sein, gesucht ist also das kleinste gemeinsame Vielfache.',
    short: 'Gesucht ist das kleinste gemeinsame Vielfache, nicht der größte gemeinsame Teiler.',
  },
  'frac-lcd-sum': {
    detailed:
      'Für den Hauptnenner werden die Nenner nicht addiert. Er muss durch jeden Nenner teilbar sein. Nimm dazu jeden Faktor der Nenner so oft, wie er in einem Nenner höchstens vorkommt.',
    short: 'Nicht addieren: Der Hauptnenner muss durch jeden Nenner teilbar sein.',
  },
  'frac-lcd-factor-missing': {
    detailed:
      'Durch diesen Nenner ist nicht jeder Nenner teilbar. Jeder Faktor muss so oft vorkommen, wie er in einem der Nenner höchstens steht, bei $x^2$ also zweimal.',
    short: 'Nicht jeder Nenner teilt ihn: Nimm jeden Faktor mit seiner höchsten Hochzahl.',
  },
  'frac-expand-own-denominator': {
    detailed:
      'Erweitert wird mit dem Faktor, der dem Nenner zum Hauptnenner fehlt, nicht mit dem eigenen Nenner. Den Faktor bekommst du, wenn du den Hauptnenner durch den Nenner des Bruchs teilst.',
    short: 'Mit dem fehlenden Faktor erweitern: Hauptnenner geteilt durch den eigenen Nenner.',
  },
  'frac-distribute-first-only': {
    detailed: 'Beim Ausmultiplizieren wird jeder Summand in der Klammer malgenommen, nicht nur der erste: $a(b + c) = ab + ac$.',
    short: 'Jeden Summanden malnehmen: $a(b + c) = ab + ac$.',
  },
  'frac-number-times-both': {
    detailed:
      'Eine Zahl mal einen Bruch: Nur der Zähler wird malgenommen, der Nenner bleibt: $n \\cdot \\frac{a}{b} = \\frac{n \\cdot a}{b}$. Zähler und Nenner mit derselben Zahl malnehmen wäre Erweitern, das ändert den Wert nicht.',
    short: 'Nur den Zähler malnehmen: $n \\cdot \\frac{a}{b} = \\frac{n \\cdot a}{b}$.',
  },
  'frac-multiply-reciprocal': {
    detailed:
      'Beim Malnehmen wird nichts umgedreht: Zähler mal Zähler, Nenner mal Nenner, $\\frac{a}{b} \\cdot \\frac{c}{d} = \\frac{a \\cdot c}{b \\cdot d}$. Den Kehrwert brauchst du nur beim Teilen.',
    short: 'Nur beim Teilen umdrehen: $\\frac{a}{b} \\cdot \\frac{c}{d} = \\frac{a \\cdot c}{b \\cdot d}$.',
  },
  'frac-reciprocal-forgotten': {
    detailed:
      'Durch einen Bruch teilt man, indem man mit seinem Kehrwert malnimmt: $\\frac{a}{b} : \\frac{c}{d} = \\frac{a}{b} \\cdot \\frac{d}{c}$. Hier wurde der Bruch nicht umgedreht.',
    short: 'Mit dem Kehrwert malnehmen: $\\frac{a}{b} : \\frac{c}{d} = \\frac{a}{b} \\cdot \\frac{d}{c}$.',
  },
  'frac-reciprocal-first': {
    detailed: 'Umgedreht wird der Bruch, durch den du teilst, also der zweite: $\\frac{a}{b} : \\frac{c}{d} = \\frac{a}{b} \\cdot \\frac{d}{c}$.',
    short: 'Den zweiten Bruch umdrehen, nicht den ersten.',
  },
  'frac-complex-times-denominator': {
    detailed:
      'Ein Doppelbruch ist eine Division: oberer Bruch geteilt durch unteren Bruch. Also wird mit dem Kehrwert des unteren Bruchs malgenommen: $\\frac{\\frac{a}{b}}{\\frac{c}{d}} = \\frac{a}{b} \\cdot \\frac{d}{c}$.',
    short: 'Mit dem Kehrwert des unteren Bruchs malnehmen.',
  },
  'frac-complex-number-up': {
    detailed: 'Durch den unteren Term wird geteilt. Er kommt deshalb in den Nenner, nicht in den Zähler: $\\frac{\\frac{a}{b}}{c} = \\frac{a}{b \\cdot c}$.',
    short: 'Durch den unteren Term wird geteilt: $\\frac{\\frac{a}{b}}{c} = \\frac{a}{b \\cdot c}$.',
  },
  'frac-cancel-one-summand': {
    detailed:
      'Aus einer Summe kürzt du nur, wenn der Faktor in jedem Summanden steckt. Teile dann jeden Summanden dadurch, nicht nur einen: $\\frac{k a + k b}{k} = a + b$.',
    short: 'Jeden Summanden durch den Faktor teilen: $\\frac{ka + kb}{k} = a + b$.',
  },
  'frac-cancel-in-sum': {
    detailed: 'Kürzen darfst du nur Faktoren, keine Summanden. In $\\frac{a + b}{a}$ ist $a$ nur ein Summand im Zähler, deshalb lässt sich dort nichts kürzen.',
    short: 'Nur Faktoren kürzen, keine Summanden.',
  },
  'frac-cancel-forgot-one': {
    detailed: 'Kürzt sich der ganze Zähler weg, bleibt dort eine $1$ stehen: $\\frac{a}{a \\cdot b} = \\frac{1}{b}$.',
    short: 'Im Zähler bleibt $1$ stehen: $\\frac{a}{a \\cdot b} = \\frac{1}{b}$.',
  },
  'frac-cancel-sign': {
    detailed: '$a - b$ und $b - a$ sind nicht gleich, sie unterscheiden sich im Vorzeichen: $b - a = -(a - b)$. Beim Kürzen bleibt deshalb ein Minus stehen.',
    short: '$b - a = -(a - b)$: Das Minus bleibt stehen.',
  },
  'frac-cancel-one-side': {
    detailed:
      'Beim Kürzen teilst du Zähler und Nenner durch dieselbe Zahl bzw. denselben Faktor. Teilt man nur einen der beiden, ändert sich der Wert: $\\frac{a \\cdot k}{b \\cdot k} = \\frac{a}{b}$.',
    short: 'Zähler und Nenner durch denselben Faktor teilen: $\\frac{a \\cdot k}{b \\cdot k} = \\frac{a}{b}$.',
  },
  'frac-power-reversed': {
    detailed:
      'Steht die höhere Potenz im Nenner, bleibt der Rest im Nenner: $\\frac{x^m}{x^n} = \\frac{1}{x^{n - m}}$ für $n > m$. Die Hochzahlen werden immer „oben minus unten" gerechnet.',
    short: 'Höhere Potenz unten, Rest bleibt unten: $\\frac{x^m}{x^n} = \\frac{1}{x^{n-m}}$ für $n > m$.',
  },
  'frac-power-divided': {
    detailed: 'Beim Kürzen von Potenzen ziehst du die Hochzahlen ab, du teilst sie nicht: $\\frac{x^m}{x^n} = x^{m - n}$.',
    short: 'Hochzahlen abziehen: $\\frac{x^m}{x^n} = x^{m-n}$.',
  },
  'frac-factor-wrong': {
    detailed:
      'Beim Ausklammern wird jeder Summand durch den Faktor geteilt. Prüfe durch Ausmultiplizieren: Es muss wieder genau der Term von vorher herauskommen.',
    short: 'Jeden Summanden durch den Faktor teilen, Probe durch Ausmultiplizieren.',
  },
  'frac-binomial-confused': {
    detailed:
      'Die binomischen Formeln: $(a + b)^2 = a^2 + 2ab + b^2$, $(a - b)^2 = a^2 - 2ab + b^2$ und $(a + b)(a - b) = a^2 - b^2$. Eine Differenz von zwei Quadraten ohne Mittelglied passt zur dritten.',
    short: '$a^2 - b^2 = (a + b)(a - b)$; ein Quadrat wie $(a - b)^2$ hat ein Mittelglied.',
  },
  'frac-vieta-sign': {
    detailed:
      'Bei $x^2 + px + q = (x - x_1)(x - x_2)$ stehen in den Klammern die Nullstellen mit umgekehrtem Vorzeichen. Probe: Ausmultiplizieren muss wieder genau den Term ergeben.',
    short: 'Probe durch Ausmultiplizieren; in der Klammer steht die Nullstelle mit umgekehrtem Vorzeichen.',
  },
}

export function explainFractionError(id: string): Explanation {
  const text = FRACTION_ERROR_TEXTS[id]
  if (!text) throw new Error(`Kein Text zur Fehlerregel ${id}`)
  return text
}

// --- Erklärungen der richtigen Schritte ---

// dens: Nenner der Brüche (ohne ganze Zahlen); numbersOnly: alle Nenner sind Zahlen
// factored: Nenner, die sich zerlegen lassen, mit ihrer Zerlegung
export function explainLcd(
  dens: readonly Expr[],
  lcd: Expr,
  product: Expr | null,
  numbersOnly: boolean,
  factored: ReadonlyArray<readonly [Expr, Expr]> = [],
): Explanation {
  const list = listing(dens.map(m))
  const productNote = product ? ` Das Produkt ${m(product)} der Nenner geht auch, ist aber unnötig groß.` : ''
  const factorNote =
    factored.length > 0 ? `Zerlege zuerst die Nenner: ${listing(factored.map(([before, after]) => `$${toLatex(before)} = ${toLatex(after)}$`))}. ` : ''
  if (numbersOnly) {
    return {
      detailed: `Der Hauptnenner ist das kleinste gemeinsame Vielfache der Nenner ${list}: die kleinste Zahl, die durch jeden Nenner teilbar ist. Das ist ${m(lcd)}.${productNote}`,
      short: `Kleinste Zahl, die durch ${list} teilbar ist: ${m(lcd)}.`,
    }
  }
  return {
    detailed: `${factorNote}Der Hauptnenner muss durch jeden Nenner teilbar sein: durch ${list}. Nimm von den Zahlen das kleinste gemeinsame Vielfache und jeden anderen Faktor mit der höchsten Hochzahl, mit der er in einem Nenner vorkommt. Das ergibt ${m(lcd)}.${productNote}`,
    short: `${factorNote}Durch ${list} teilbar und so klein wie möglich: ${m(lcd)}.`,
  }
}

// items: je Summand der Bruch (bzw. die ganze Zahl) und sein Erweiterungsfaktor; null: hat den
// Hauptnenner schon
export function explainExpand(items: ReadonlyArray<{ part: Expr; factor: Expr | null; whole: boolean }>, lcd: Expr): Explanation {
  const expanded = items.filter((i) => i.factor)
  const list = listing(expanded.map((i) => `${m(i.part)} mit ${m(i.factor!)}`))
  const kept = items.filter((i) => !i.factor).map((i) => m(i.part))
  const keptNote = kept.length > 0 ? ` ${listing(kept)} ${kept.length === 1 ? 'hat' : 'haben'} den Hauptnenner schon.` : ''
  const wholeNote = items.some((i) => i.whole) ? ' Eine ganze Zahl ist ein Bruch mit dem Nenner $1$.' : ''
  return {
    detailed: `Erweitere mit dem Faktor, der zum Hauptnenner ${m(lcd)} fehlt: ${list}.${keptNote}${wholeNote} Zähler und Nenner werden dabei mit demselben Faktor malgenommen, deshalb ändert sich der Wert nicht.`,
    short: `Erweitern: ${list}.`,
  }
}

// sum: die Zähler mit ihren Vorzeichen, numerator: zusammengefasst; bracket: nach einem Minus
// steht eine Summe (dann gilt das Minus für die ganze Summe)
export function explainCombine(sum: Expr, numerator: Expr, lcd: Expr, bracket: boolean): Explanation {
  const calculation = toLatex(sum) === toLatex(numerator) ? m(numerator) : `$${toLatex(sum)} = ${toLatex(numerator)}$`
  const bracketNote = bracket ? ' Das Minus gilt jeweils für den ganzen Zähler dahinter.' : ''
  return {
    detailed: `Die Nenner sind jetzt gleich. Du rechnest nur die Zähler zusammen, der Nenner ${m(lcd)} bleibt: ${calculation}.${bracketNote}`,
    short: `Zähler zusammenrechnen: ${calculation}.`,
  }
}

// common: der Faktor, durch den gekürzt wird; powers: Potenzen von Buchstaben werden gekürzt;
// oneLeft: der ganze Zähler kürzt sich weg; minusKept: ein Minus aus einer vertauschten Differenz
// bleibt stehen
export function explainCancel(common: Expr, powers: boolean, oneLeft: boolean, minusKept = false): Explanation {
  const powerNote = powers ? ' Bei Potenzen ziehst du dazu die Hochzahlen ab: $\\frac{x^m}{x^n} = x^{m-n}$.' : ''
  const oneNote = oneLeft ? ' Der ganze Zähler kürzt sich weg, dort bleibt eine $1$.' : ''
  const minusNote = minusKept ? ' Das Minus aus $b - a = -(a - b)$ bleibt dabei stehen.' : ''
  return {
    detailed: `Zähler und Nenner haben den gemeinsamen Faktor ${m(common)}. Teile beide dadurch.${powerNote}${oneNote}${minusNote}`,
    short: `Durch den gemeinsamen Faktor ${m(common)} kürzen.`,
  }
}

export function explainMultiply(multiplied: Expr, withWhole: boolean): Explanation {
  const wholeNote = withWhole ? ' Eine ganze Zahl ist ein Bruch mit dem Nenner $1$, sie kommt also nur in den Zähler.' : ''
  return {
    detailed: `Zähler mal Zähler, Nenner mal Nenner: ${m(multiplied)}.${wholeNote}`,
    short: `Zähler mal Zähler, Nenner mal Nenner: ${m(multiplied)}.`,
  }
}

// divisor: der Bruch, durch den geteilt wird; complex: beim Doppelbruch
export function explainReciprocal(divisor: Expr, reciprocal: Expr, complex: boolean): Explanation {
  if (complex) {
    return {
      detailed: `Ein Doppelbruch ist eine Division: oberer Bruch geteilt durch unteren Bruch. Also wird mit dem Kehrwert des unteren Bruchs malgenommen, mit ${m(reciprocal)}.`,
      short: `Mit dem Kehrwert ${m(reciprocal)} des unteren Bruchs malnehmen.`,
    }
  }
  return {
    detailed: `Durch einen Bruch teilt man, indem man mit seinem Kehrwert malnimmt. Den Kehrwert bekommst du, wenn du Zähler und Nenner vertauschst: Aus ${m(divisor)} wird ${m(reciprocal)}.`,
    short: `Mit dem Kehrwert ${m(reciprocal)} malnehmen.`,
  }
}

// Wie ein Term zerlegt wird: ausklammern, binomische Formel, x² + px + q
export type FactorMethod = 'out' | 'binomial' | 'quadratic'

const METHOD_TEXT: Record<FactorMethod, string> = {
  out: 'ausklammern',
  binomial: 'binomische Formel',
  quadratic: 'zwei Zahlen mit dem richtigen Produkt und der richtigen Summe',
}

export function explainFactor(before: Expr, after: Expr, numerator: boolean, methods: readonly FactorMethod[] = []): Explanation {
  const how = methods.length > 0 ? ` (${listing(methods.map((k) => METHOD_TEXT[k]))})` : ''
  return {
    detailed: `Zerlege den ${numerator ? 'Zähler' : 'Nenner'} in Faktoren${how}: $${toLatex(before)} = ${toLatex(after)}$. Nur Faktoren lassen sich kürzen.`,
    short: `$${toLatex(before)} = ${toLatex(after)}$.`,
  }
}

export function explainInner(numerator: boolean): Explanation {
  return same(`Fasse den ${numerator ? 'Zähler' : 'Nenner'} des Doppelbruchs wie eine eigene Aufgabe zu einem Bruch zusammen: Hauptnenner, erweitern, Zähler zusammenfassen.`)
}

// --- Tipps (vor der Antwort, ohne das Ergebnis zu verraten) ---

export const FRACTION_HINTS = {
  lcd: 'Gesucht ist der kleinste Nenner, durch den jeder Nenner teilbar ist.',
  expand: 'Teile den Hauptnenner durch den Nenner eines Bruchs. Mit dem Ergebnis nimmst du Zähler und Nenner dieses Bruchs mal.',
  combine: 'Bei gleichen Nennern rechnest du nur die Zähler zusammen. Der Nenner bleibt, wie er ist.',
  cancel: 'Suche einen Faktor, der im Zähler und im Nenner steckt, und teile beide dadurch.',
  cancelPowers: 'Suche Faktoren, die oben und unten stehen. Bei Potenzen: $\\frac{x^m}{x^n} = x^{m-n}$.',
  multiply: 'Zähler mal Zähler, Nenner mal Nenner. Kürzen kannst du schon vor dem Ausrechnen, auch über Kreuz.',
  reciprocal: 'Durch einen Bruch teilen heißt: mit dem umgedrehten Bruch malnehmen.',
  factor: 'Klammere aus, was in jedem Summanden steckt, oder nutze eine binomische Formel.',
  factorOut: 'Was steckt in jedem Summanden? Das kommt vor die Klammer: $ka + kb = k(a + b)$.',
  factorBinomial: 'Zwei Quadrate mit Minus dazwischen: $a^2 - b^2 = (a + b)(a - b)$. Mit Mittelglied: $a^2 \\pm 2ab + b^2 = (a \\pm b)^2$.',
  factorQuadratic: 'Suche zwei Zahlen $a$ und $b$ mit $a \\cdot b = q$ und $a + b = p$. Dann ist $x^2 + px + q = (x + a)(x + b)$.',
  inner: 'Fasse diesen Teil wie eine eigene Aufgabe zu einem Bruch zusammen.',
} as const

// Tipp für die ganze Aufgabe (im freien Modus)
export function fractionTaskHint(t: FractionShape): Explanation {
  switch (t.kind) {
    case 'reduce':
      return same('Zerlege Zähler und Nenner in Faktoren und kürze die gemeinsamen Faktoren.')
    case 'sum':
      return same('Bringe alles auf den Hauptnenner, fasse die Zähler zusammen und kürze am Ende, wenn möglich.')
    case 'product':
      return same('Zähler mal Zähler, Nenner mal Nenner, dann kürzen.')
    case 'quotient':
      return same('Nimm mit dem Kehrwert des zweiten Bruchs mal, dann kürzen.')
    case 'complex':
      return same('Fasse Zähler und Nenner je zu einem Bruch zusammen und nimm dann mit dem Kehrwert des unteren Bruchs mal.')
  }
}
