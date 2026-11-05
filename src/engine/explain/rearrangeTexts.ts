import { toLatex } from '../expr/print.ts'
import type { Expr } from '../expr/types.ts'
import { m } from './format.ts'
import type { Explanation } from './texts.ts'

// Texte fürs Umstellen im geführten Modus: Fragen, Tipps, Erklärungen und „Warum ist das falsch?".
// Format Text mit $…$-Formeln (richText.ts). Die Terme kommen aus dem Rechenweg der Umstell-Engine
// (guided/rearrangePlan.ts); „Warum ist das falsch?" nennt den Fehler und die Regel, verrät aber
// nicht das Ergebnis des Schritts.

const same = (text: string): Explanation => ({ detailed: text, short: text })

// --- Warum ist das falsch? (je Fehlerregel aus rearrange/errorRules.ts) ---

export const REARRANGE_ERROR_TEXTS: Readonly<Record<string, Explanation>> = {
  'eq-sign-not-flipped': {
    detailed:
      'Bringst du einen Summanden auf die andere Seite, wechselt sein Vorzeichen. Das ist die Gegenrechnung auf beiden Seiten: Aus $+b$ wird $-b$, aus $-b$ wird $+b$.',
    short: 'Beim Rüberbringen wechselt das Vorzeichen: aus $+b$ wird $-b$.',
  },
  'eq-inverse-op': {
    detailed:
      'Auf beiden Seiten muss dieselbe Rechnung stehen. Teilst du die eine Seite, musst du auch die andere teilen; nimmst du die eine mal, auch die andere: $a \\cdot x = c \\Leftrightarrow x = \\frac{c}{a}$.',
    short: 'Beide Seiten gleich behandeln: $a \\cdot x = c \\Leftrightarrow x = \\frac{c}{a}$.',
  },
  'eq-divide-one-term': {
    detailed:
      'Teilst du eine Summe, wird jeder Summand geteilt, nicht nur der erste. Setze die Summe in Gedanken in Klammern: $\\frac{c + d}{a} = \\frac{c}{a} + \\frac{d}{a}$.',
    short: 'Jeden Summanden teilen: $\\frac{c + d}{a} = \\frac{c}{a} + \\frac{d}{a}$.',
  },
  'eq-fraction-flipped': {
    detailed:
      'Beim Teilen kommt das, wodurch du teilst, in den Nenner, nicht in den Zähler. Aus $a \\cdot x = c$ wird $x = \\frac{c}{a}$, nicht $\\frac{a}{c}$.',
    short: 'Der Teiler kommt in den Nenner: $a \\cdot x = c \\Leftrightarrow x = \\frac{c}{a}$.',
  },
  'eq-denominator-bracket': {
    detailed:
      'Ist der Nenner eine Summe, nimmst du mit der ganzen Summe mal. Sie gehört in Klammern, sonst wird nur ihr erster Summand malgenommen: $y \\cdot (x - 3) = xy - 3y$.',
    short: 'Den ganzen Nenner in Klammern malnehmen: $y \\cdot (x - 3) = xy - 3y$.',
  },
  'eq-bracket-first-term': {
    detailed: 'Beim Ausmultiplizieren wird jeder Summand in der Klammer malgenommen, nicht nur der erste: $a(x + b) = ax + ab$.',
    short: 'Jeden Summanden malnehmen: $a(x + b) = ax + ab$.',
  },
  'eq-factor-one-lost': {
    detailed:
      'Klammerst du $x$ aus einem Summanden aus, der nur $x$ ist, bleibt in der Klammer eine $1$ stehen: $xy - x = x(y - 1)$. Prüfe es, indem du die Klammer wieder ausmultiplizierst.',
    short: 'Beim Ausklammern bleibt eine $1$: $xy - x = x(y - 1)$.',
  },
  'eq-reciprocal-termwise': {
    detailed:
      'Den Kehrwert darfst du nur von einem einzigen Bruch nehmen, nicht von jedem Summanden einzeln: $\\frac{1}{b} - \\frac{1}{x}$ ist nicht der Kehrwert von $b - x$. Fasse die Seite erst zu einem Bruch zusammen.',
    short: 'Kehrwert erst nach dem Zusammenfassen zu einem Bruch.',
  },
  'eq-root-termwise': {
    detailed:
      'Die Wurzel aus einer Summe ist nicht die Summe der Wurzeln: $\\sqrt{a^2 + b^2} \\neq a + b$. Fasse unter der Wurzel zusammen und lass die Wurzel stehen.',
    short: 'Nicht gliedweise: $\\sqrt{a^2 + b^2} \\neq a + b$.',
  },
  'eq-square-one-factor': {
    detailed:
      'Beim Quadrieren wird alles quadriert, bei einem Bruch Zähler und Nenner: $\\left(\\frac{y}{a}\\right)^2 = \\frac{y^2}{a^2}$, bei einem Produkt jeder Faktor: $(2y)^2 = 4y^2$.',
    short: 'Alles quadrieren: $\\left(\\frac{y}{a}\\right)^2 = \\frac{y^2}{a^2}$.',
  },
  'eq-square-middle': {
    detailed:
      'Eine Summe quadrierst du mit der binomischen Formel, mit Mittelglied: $(a + b)^2 = a^2 + 2ab + b^2$. Ohne das Mittelglied $2ab$ stimmt es nicht.',
    short: 'Binomische Formel: $(a + b)^2 = a^2 + 2ab + b^2$.',
  },
  'eq-multiply-one-term': {
    detailed:
      'Nimmst du eine Seite mal, wird jeder Summand malgenommen, nicht nur der erste, auch einer ohne Bruch. Setze die Seite in Gedanken in Klammern: $(c - b) \\cdot a = ac - ab$.',
    short: 'Jeden Summanden malnehmen: $(c - b) \\cdot a = ac - ab$.',
  },
  'eq-minus-bracket': {
    detailed:
      'Ein Minus vor einer Klammer dreht das Vorzeichen jedes Summanden in der Klammer um, nicht nur das des ersten: $-c(x - d) = -cx + cd$.',
    short: 'Das Minus gilt für die ganze Klammer: $-c(x - d) = -cx + cd$.',
  },
  'eq-square-halved': {
    detailed:
      'Die Hochzahl $2$ ist kein Faktor: Aus $x^2 = c$ wird nicht $x = \\frac{c}{2}$. Die Gegenrechnung zum Quadrat ist die Wurzel, auf beiden Seiten: $x = \\sqrt{c}$.',
    short: 'Gegen das Quadrat hilft die Wurzel, nicht das Halbieren.',
  },
  'eq-factor-sign': {
    detailed:
      'Beim Ausklammern bleibt jedes Vorzeichen in der Klammer stehen: $ax - bx = x(a - b)$. Prüfe es, indem du die Klammer wieder ausmultiplizierst.',
    short: 'Vorzeichen bleiben: $ax - bx = x(a - b)$.',
  },
  'eq-nested-root': {
    detailed:
      'Beim Quadrieren fällt nur die äußere Wurzel weg, die innere bleibt stehen: Aus $\\sqrt{a + \\sqrt{u}} = y$ wird $a + \\sqrt{u} = y^2$. Die innere Wurzel stellst du danach allein und quadrierst noch einmal.',
    short: 'Quadrieren entfernt nur die äußere Wurzel.',
  },
  'eq-ln-forgotten': {
    detailed:
      'Logarithmieren heißt: auf beiden Seiten den $\\ln$ nehmen. Auf der Seite mit der Potenz holt er die Hochzahl herunter, auf der anderen Seite bleibt er stehen: aus $e^{kx} = w$ wird $kx = \\ln w$.',
    short: 'Auf beiden Seiten den $\\ln$: $e^{kx} = w \\Leftrightarrow kx = \\ln w$.',
  },
  'eq-exp-forgotten': {
    detailed:
      'Gegen einen Logarithmus hilft seine Basis hoch, auf beiden Seiten: aus $\\ln u = b$ wird $u = e^b$, aus $\\log_a u = b$ wird $u = a^b$. Lässt du den Logarithmus nur weg, stimmt die Gleichung nicht mehr.',
    short: 'Beide Seiten hoch: $\\ln u = b \\Leftrightarrow u = e^b$.',
  },
  'eq-exp-minus-lost': {
    detailed: 'Das Minus gehört zur Hochzahl und bleibt beim Logarithmieren stehen: aus $e^{-kx} = w$ wird $-kx = \\ln w$.',
    short: 'Das Minus bleibt: $e^{-kx} = w \\Leftrightarrow -kx = \\ln w$.',
  },
  'eq-ln-of-sum': {
    detailed:
      'Für den Logarithmus einer Summe gibt es kein Gesetz: $\\ln(a + b) \\neq \\ln a + \\ln b$. Nur Produkte und Quotienten lassen sich auseinanderziehen. Lass $\\ln(a + b)$ so stehen.',
    short: '$\\ln(a + b) \\neq \\ln a + \\ln b$.',
  },
  'eq-exp-of-sum': {
    detailed: 'Eine Summe in der Hochzahl wird zu einem Produkt, nicht zu einer Summe: $e^{a + b} = e^a \\cdot e^b \\neq e^a + e^b$. Schreibe einfach $e^{a + b}$.',
    short: '$e^{a + b} = e^a \\cdot e^b$, nicht $e^a + e^b$.',
  },
  'eq-log-base-forgotten': {
    detailed:
      'Nur bei der Basis $e$ hebt der $\\ln$ die Potenz ganz auf. Bei einer anderen Basis bleibt ein Faktor stehen: $\\ln\\left(a^x\\right) = x \\ln a$.',
    short: '$\\ln\\left(a^x\\right) = x\\ln a$: der Faktor $\\ln a$ bleibt.',
  },
  'eq-divide-inside-ln': {
    detailed: 'Teilst du beide Seiten durch $k$, wird der ganze $\\ln$ geteilt, nicht das, was in ihm steht: $\\frac{\\ln w}{k} \\neq \\ln\\frac{w}{k}$.',
    short: 'Den ganzen $\\ln$ teilen: $\\frac{\\ln w}{k} \\neq \\ln\\frac{w}{k}$.',
  },
  'eq-log-product': {
    detailed: 'Der Logarithmus macht aus einem Produkt eine Summe: $\\ln(u \\cdot v) = \\ln u + \\ln v$. Ein Produkt von Logarithmen entsteht dabei nicht.',
    short: '$\\ln(u \\cdot v) = \\ln u + \\ln v$.',
  },
  'eq-log-sum': {
    detailed: 'Eine Summe von Logarithmen wird zum Logarithmus eines Produkts: $\\ln u + \\ln v = \\ln(u \\cdot v)$, nicht $\\ln(u + v)$.',
    short: '$\\ln u + \\ln v = \\ln(u \\cdot v)$.',
  },
  'eq-log-quotient': {
    detailed: 'Eine Differenz von Logarithmen wird zum Logarithmus eines Quotienten: $\\ln u - \\ln v = \\ln\\frac{u}{v}$. Der Bruch steht im $\\ln$, nicht zwischen zwei Logarithmen.',
    short: '$\\ln u - \\ln v = \\ln\\frac{u}{v}$.',
  },
  'eq-power-sum': {
    detailed: 'Eine Summe in der Hochzahl wird zu einem Produkt: $a^{x + 1} = a^x \\cdot a^1 = a \\cdot a^x$. Als Summe $a^x + a$ stimmt es nicht.',
    short: '$a^{x + 1} = a \\cdot a^x$, nicht $a^x + a$.',
  },
  'eq-inverse-forgotten': {
    detailed:
      'Gegen eine Funktion hilft ihre Umkehrfunktion, auf beiden Seiten: aus $\\sin u = w$ wird $u = \\arcsin w$, aus $\\arctan u = w$ wird $u = \\tan w$. Lässt du die Funktion nur weg, stimmt die Gleichung nicht mehr.',
    short: 'Auf beiden Seiten die Umkehrfunktion: $\\sin u = w \\Leftrightarrow u = \\arcsin w$.',
  },
  'eq-inverse-reciprocal': {
    detailed:
      'Die Umkehrfunktion ist nicht der Kehrwert: $\\arcsin w \\neq \\frac{1}{\\sin w}$. Die Taste $\\sin^{-1}$ auf dem Taschenrechner meint die Umkehrfunktion $\\arcsin$. Gegen $\\tan$ hilft $\\arctan$, gegen $\\sinh$ hilft $\\operatorname{arsinh}$.',
    short: 'Umkehrfunktion, nicht Kehrwert: $\\arctan w \\neq \\frac{1}{\\tan w}$.',
  },
  'eq-divide-inside-arc': {
    detailed: 'Teilst du beide Seiten durch $k$, wird die ganze Umkehrfunktion geteilt, nicht das, was in ihr steht: $\\frac{\\arcsin w}{k} \\neq \\arcsin\\frac{w}{k}$.',
    short: 'Die ganze Umkehrfunktion teilen: $\\frac{\\arcsin w}{k} \\neq \\arcsin\\frac{w}{k}$.',
  },
  'eq-pythagoras-square': {
    detailed:
      'Aus $\\sin^2 u + \\cos^2 u = 1$ folgt $\\sin^2 u = 1 - \\cos^2 u$: Das Quadrat bleibt stehen. $1 - \\cos u$ ist etwas anderes. Bei Hyperbelfunktionen gilt dasselbe: $\\sinh^2 u = \\cosh^2 u - 1$.',
    short: '$\\sin^2 u = 1 - \\cos^2 u$, mit Quadrat.',
  },
  'eq-hyperbolic-sign': {
    detailed:
      'Bei den Hyperbelfunktionen gilt $\\cosh^2 u - \\sinh^2 u = 1$, mit Minus, nicht eine Summe wie bei $\\sin$ und $\\cos$. Also ist $\\sinh^2 u = \\cosh^2 u - 1$ und $\\cosh^2 u = 1 + \\sinh^2 u$.',
    short: '$\\cosh^2 u - \\sinh^2 u = 1$, also $\\sinh^2 u = \\cosh^2 u - 1$.',
  },
  'eq-tan-flipped': {
    detailed:
      '$\\tan u = \\frac{\\sin u}{\\cos u}$: Der Sinus steht oben. Teilst du durch $\\cos u$, wird aus $\\sin u$ der $\\tan u$ und aus $\\cos u$ die $1$. Teilst du durch $\\sin u$, entsteht $\\frac{\\cos u}{\\sin u} = \\frac{1}{\\tan u}$, nicht $\\tan u$. Bei $\\sinh$ und $\\cosh$ genauso mit $\\tanh u = \\frac{\\sinh u}{\\cosh u}$.',
    short: '$\\tan u = \\frac{\\sin u}{\\cos u}$, nicht $\\frac{\\cos u}{\\sin u}$.',
  },
  'eq-divide-cos-partly': {
    detailed:
      'Ein Bruch behält seinen Wert nur, wenn du Zähler und Nenner durch dasselbe teilst; bei einer Gleichung teilst du beide Seiten. Teilst du nur einen Teil durch $\\cos u$, ändert sich der Wert.',
    short: 'Zähler und Nenner (bzw. beide Seiten) durch $\\cos u$ teilen.',
  },
}

export function explainRearrangeError(id: string): Explanation {
  const text = REARRANGE_ERROR_TEXTS[id]
  if (!text) throw new Error(`Kein Text zur Fehlerregel ${id}`)
  return text
}

// --- Was machst du als Nächstes? (Irrwege, je Art des Schritts) ---

// Eine Umformung, die das Ziel der Frage nicht erreicht, mit Erklärung
export type WrongMove = { readonly label: string; readonly why: Explanation }

const ONE_SIDED: Explanation = {
  detailed:
    'Eine Gleichung ist wie eine Waage: Was du auf einer Seite rechnest, musst du auch auf der anderen rechnen. Sonst stimmt sie nicht mehr.',
  short: 'Immer auf beiden Seiten dasselbe rechnen.',
}

// „auf der linken Seite", „nur die linke Seite"
const sideName = (side: 'lhs' | 'rhs') => (side === 'lhs' ? 'linken' : 'rechten')
const sideAccusative = (side: 'lhs' | 'rhs') => (side === 'lhs' ? 'linke' : 'rechte')
// Faktor in einer Umformung, Summen in Klammern: „mal $(b - 2)$"
const factorText = (e: Expr) => (e.kind === 'add' || e.kind === 'neg' ? `$(${toLatex(e)})$` : m(e))

// Summand mit Vorzeichen als Text: „$+c$", „$-\frac{b}{c}$"
export const signed = (term: Expr, negative: boolean) => `$${negative ? '-' : '+'}${toLatex(term)}$`

export function addMoves(term: string, opposite: string, side: 'lhs' | 'rhs', divisor: Expr | null): WrongMove[] {
  return [
    {
      label: `Auf beiden Seiten ${term}`,
      why: {
        detailed: `Damit kommt ${term} noch einmal dazu, statt zu verschwinden. Die Gegenrechnung zu ${term} ist ${opposite}.`,
        short: `Gegenrechnung zu ${term} ist ${opposite}.`,
      },
    },
    ...(divisor
      ? [
          {
            label: `Beide Seiten durch ${m(divisor)}`,
            why: {
              detailed: `Teilen hilft gegen einen Faktor, nicht gegen einen Summanden. Nach dem Teilen steht ${m(divisor)} immer noch als Teil der Summe da.`,
              short: 'Teilen hilft nur gegen Faktoren, nicht gegen Summanden.',
            },
          },
        ]
      : []),
    { label: `Nur auf der ${sideName(side)} Seite ${opposite}`, why: ONE_SIDED },
  ]
}

export function moveMoves(term: Expr, side: 'lhs' | 'rhs'): WrongMove[] {
  const t = toLatex(term)
  return [
    {
      label: `Das Minus vor $${t}$ einfach weglassen`,
      why: { detailed: 'Ein Minus darfst du nicht einfach weglassen, dann stimmt die Gleichung nicht mehr. Bringe den Summanden auf die andere Seite: Dort steht er mit Plus.', short: 'Das Minus nicht weglassen, sondern den Summanden rüberbringen.' },
    },
    {
      label: `Auf beiden Seiten $-${t}$`,
      why: { detailed: `Damit steht dort zweimal $-${t}$, statt dass es verschwindet. Die Gegenrechnung zu einem Minus ist ein Plus.`, short: 'Gegenrechnung zu einem Minus ist ein Plus.' },
    },
    { label: `Nur auf der ${sideName(side)} Seite $+${t}$`, why: ONE_SIDED },
  ]
}

export function divideMoves(divisor: Expr, side: 'lhs' | 'rhs' | null): WrongMove[] {
  const d = m(divisor)
  return [
    {
      label: `Beide Seiten mal ${factorText(divisor)}`,
      why: { detailed: `Malnehmen macht den Faktor ${d} nur größer. Die Gegenrechnung zum Malnehmen ist das Teilen.`, short: 'Gegenrechnung zum Malnehmen ist das Teilen.' },
    },
    {
      label: `Auf beiden Seiten ${divisor.kind === 'add' ? `$-(${toLatex(divisor)})$` : `$-${toLatex(divisor)}$`}`,
      why: { detailed: `Abziehen hilft gegen einen Summanden, nicht gegen einen Faktor. ${d} bleibt danach als Faktor stehen.`, short: 'Abziehen hilft nur gegen Summanden.' },
    },
    ...(side ? [{ label: `Nur die ${sideAccusative(side)} Seite durch ${factorText(divisor)}`, why: ONE_SIDED }] : []),
  ]
}

export function multiplyMoves(denominator: Expr, side: 'lhs' | 'rhs' | null, cancelInside: boolean): WrongMove[] {
  const d = m(denominator)
  return [
    {
      label: `Beide Seiten durch ${factorText(denominator)}`,
      why: { detailed: `Teilen macht den Nenner nur größer, ${d} steht dann zweimal unten. Gegen einen Nenner hilft das Malnehmen.`, short: 'Gegen einen Nenner hilft das Malnehmen.' },
    },
    ...(side ? [{ label: `Nur die ${sideAccusative(side)} Seite mal ${factorText(denominator)}`, why: ONE_SIDED }] : []),
    ...(cancelInside
      ? [
          {
            label: 'Im Bruch die Variable oben und unten wegkürzen',
            why: { detailed: 'Kürzen darfst du nur ganze Faktoren, nicht Teile einer Summe. Im Zähler und im Nenner stehen hier Summen.', short: 'Aus Summen darf man nicht kürzen.' },
          },
        ]
      : [
          {
            label: `Auf beiden Seiten ${denominator.kind === 'add' ? `$+(${toLatex(denominator)})$` : `$+${toLatex(denominator)}$`}`,
            why: { detailed: 'Addieren hilft nicht gegen einen Nenner: Der Bruch bleibt ein Bruch.', short: 'Addieren beseitigt keinen Nenner.' },
          },
        ]),
  ]
}

export function negateMoves(side: 'lhs' | 'rhs'): WrongMove[] {
  return [
    { label: 'Das Minus einfach weglassen', why: { detailed: 'Ein Minus darfst du nicht einfach weglassen, dann stimmt die Gleichung nicht mehr. Nimm beide Seiten mal $(-1)$.', short: 'Nicht weglassen: beide Seiten mal $(-1)$.' } },
    { label: `Nur die ${sideAccusative(side)} Seite mal $(-1)$`, why: ONE_SIDED },
  ]
}

export function reciprocalMoves(target: string, side: 'lhs' | 'rhs'): WrongMove[] {
  return [
    { label: `Kehrwert nur auf der ${sideName(side)} Seite`, why: ONE_SIDED },
    {
      label: `Beide Seiten durch $${target}$`,
      why: { detailed: `Dann steht $${target}$ zweimal im Nenner, statt herauszukommen. Steht auf beiden Seiten genau ein Bruch, drehst du beide um.`, short: 'Dann steht die Variable zweimal im Nenner.' },
    },
  ]
}

export const COMBINE_MOVES: readonly WrongMove[] = [
  { label: 'Von jedem Bruch einzeln den Kehrwert nehmen', why: REARRANGE_ERROR_TEXTS['eq-reciprocal-termwise'] },
  {
    label: 'Zähler minus Zähler und Nenner minus Nenner rechnen',
    why: { detailed: 'Brüche fasst du über den Hauptnenner zusammen: erweitern, dann nur die Zähler zusammenrechnen. Die Nenner werden nicht abgezogen.', short: 'Über den Hauptnenner zusammenfassen, Nenner nicht abziehen.' },
  },
]

// Zusammenfassen, bevor mit dem Nenner (mit der Variable) malgenommen wird
export const COMBINE_BEFORE_MULTIPLY_MOVES: readonly WrongMove[] = [
  COMBINE_MOVES[1],
  {
    label: 'Die Nenner auf dieser Seite einfach weglassen',
    why: {
      detailed: 'Einen Nenner darfst du nicht einfach weglassen, dann ändert sich der Wert der Seite. Fasse die Seite über den Hauptnenner zu einem Bruch zusammen.',
      short: 'Nenner nicht weglassen, sondern zusammenfassen.',
    },
  },
]

// Zusammenfassen, bevor die Wurzel gezogen wird
export const COMBINE_BEFORE_ROOT_MOVES: readonly WrongMove[] = [
  { label: 'Die Wurzel aus jedem Summanden einzeln ziehen', why: REARRANGE_ERROR_TEXTS['eq-root-termwise'] },
  COMBINE_BEFORE_MULTIPLY_MOVES[1],
]

// Zusammenfassen, bevor quadriert wird
export const COMBINE_BEFORE_SQUARE_MOVES: readonly WrongMove[] = [
  {
    label: 'Jeden Summanden einzeln quadrieren',
    why: { detailed: 'Eine Summe quadrierst du nicht Summand für Summand: $(a + b)^2 = a^2 + 2ab + b^2$. Fasse die Seite zuerst zu einem Bruch zusammen, dann quadrierst du Zähler und Nenner.', short: 'Nicht Summand für Summand quadrieren.' },
  },
  COMBINE_BEFORE_MULTIPLY_MOVES[1],
]

// Zusammenfassen, bevor logarithmiert wird
export const COMBINE_BEFORE_LOG_MOVES: readonly WrongMove[] = [
  { label: 'Von jedem Summanden einzeln den $\\ln$ nehmen', why: REARRANGE_ERROR_TEXTS['eq-ln-of-sum'] },
  COMBINE_BEFORE_MULTIPLY_MOVES[1],
]

// e hoch beide Seiten (log: \ln bzw. \log_a als LaTeX, base: e bzw. a)
export function expMoves(logLatex: string, base: string, side: 'lhs' | 'rhs'): WrongMove[] {
  return [
    { label: `Den $${logLatex}$ einfach weglassen`, why: REARRANGE_ERROR_TEXTS['eq-exp-forgotten'] },
    {
      label: `Beide Seiten durch $${logLatex}$ teilen`,
      why: {
        detailed: `$${logLatex}$ ist keine Zahl, sondern eine Rechenvorschrift; durch sie kannst du nicht teilen. Gegen den Logarithmus hilft $${base}$ hoch.`,
        short: `Gegen den Logarithmus hilft $${base}$ hoch.`,
      },
    },
    { label: `Nur die ${sideAccusative(side)} Seite als Hochzahl von $${base}$ schreiben`, why: ONE_SIDED },
  ]
}

// Logarithmieren
export function logMoves(side: 'lhs' | 'rhs' | null): WrongMove[] {
  return [
    { label: 'Die Hochzahl einfach herunterholen', why: REARRANGE_ERROR_TEXTS['eq-ln-forgotten'] },
    {
      label: 'Auf beiden Seiten die Wurzel ziehen',
      why: { detailed: 'Die Wurzel hilft gegen ein Quadrat. Steht die Variable in der Hochzahl, hilft der Logarithmus.', short: 'Gegen die Variable in der Hochzahl hilft der $\\ln$.' },
    },
    ...(side ? [{ label: `Nur die ${sideAccusative(side)} Seite logarithmieren`, why: ONE_SIDED }] : []),
  ]
}

// Logarithmen zusammenfassen
export const LOG_COMBINE_MOVES: readonly WrongMove[] = [
  { label: 'Zum $\\ln$ der Summe der beiden Terme zusammenfassen', why: REARRANGE_ERROR_TEXTS['eq-log-sum'] },
  { label: 'Durch den zweiten Logarithmus teilen', why: REARRANGE_ERROR_TEXTS['eq-log-quotient'] },
  {
    label: 'Jeden Logarithmus einzeln mit $e$ hoch auflösen',
    why: { detailed: '$e$ hoch eine Summe ist ein Produkt: $e^{\\ln u + \\ln v} = u \\cdot v$, nicht $u + v$. Fasse die Logarithmen zuerst zu einem einzigen zusammen.', short: 'Erst zu einem einzigen Logarithmus zusammenfassen.' },
  },
]

// Logarithmusgesetze anwenden
export const LOG_LAW_MOVES: readonly WrongMove[] = [
  { label: 'Den $\\ln$ des Produkts als Produkt der Logarithmen schreiben', why: REARRANGE_ERROR_TEXTS['eq-log-product'] },
  { label: 'Die Hochzahl herunterholen und den Faktor $\\ln a$ weglassen', why: REARRANGE_ERROR_TEXTS['eq-log-base-forgotten'] },
  {
    label: 'Den $\\ln$ auf beiden Seiten einfach weglassen',
    why: { detailed: 'Der $\\ln$ steht auf beiden Seiten, weil du gerade logarithmiert hast. Weglassen würde das rückgängig machen. Ziehe ihn mit den Logarithmusgesetzen auseinander, dann kommt die Hochzahl als Faktor herunter.', short: 'Nicht weglassen, mit den Gesetzen auseinanderziehen.' },
  },
]

// Potenzgesetz
export const POWER_LAW_MOVES: readonly WrongMove[] = [
  { label: '$a^{x + 1}$ als $a^x + a$ schreiben', why: REARRANGE_ERROR_TEXTS['eq-power-sum'] },
  { label: 'Von jedem Summanden einzeln den $\\ln$ nehmen', why: REARRANGE_ERROR_TEXTS['eq-ln-of-sum'] },
  {
    label: 'Die Hochzahlen einfach weglassen',
    why: { detailed: 'Ohne die Hochzahlen ändert sich der Wert. Zerlege die Potenzen mit $a^{m + n} = a^m \\cdot a^n$, bis überall dieselbe Potenz steht.', short: 'Hochzahlen nicht weglassen.' },
  },
]

// Umkehrfunktion auf beiden Seiten (fn: \sin, arc: \arcsin, als LaTeX)
export function arcMoves(fnLatex: string, arcLatex: string, side: 'lhs' | 'rhs'): WrongMove[] {
  return [
    { label: `Den $${fnLatex}$ einfach weglassen`, why: REARRANGE_ERROR_TEXTS['eq-inverse-forgotten'] },
    { label: `Auf beiden Seiten den Kehrwert $\\frac{1}{${fnLatex}}$ nehmen`, why: REARRANGE_ERROR_TEXTS['eq-inverse-reciprocal'] },
    {
      label: `Beide Seiten durch $${fnLatex}$ teilen`,
      why: {
        detailed: `$${fnLatex}$ ist keine Zahl, sondern eine Rechenvorschrift; durch sie kannst du nicht teilen. Gegen $${fnLatex}$ hilft die Umkehrfunktion $${arcLatex}$.`,
        short: `Gegen $${fnLatex}$ hilft $${arcLatex}$.`,
      },
    },
    { label: `Nur auf der ${sideName(side)} Seite $${arcLatex}$`, why: ONE_SIDED },
  ]
}

// Funktion auf beiden Seiten gegen eine Umkehrfunktion (arc: \arctan, fn: \tan, als LaTeX)
export function trigMoves(arcLatex: string, fnLatex: string, side: 'lhs' | 'rhs'): WrongMove[] {
  return [
    { label: `Den $${arcLatex}$ einfach weglassen`, why: REARRANGE_ERROR_TEXTS['eq-inverse-forgotten'] },
    {
      label: `Beide Seiten durch $${arcLatex}$ teilen`,
      why: {
        detailed: `$${arcLatex}$ ist keine Zahl, sondern eine Rechenvorschrift; durch sie kannst du nicht teilen. Gegen die Umkehrfunktion hilft die Funktion selbst: $${fnLatex}$.`,
        short: `Gegen $${arcLatex}$ hilft $${fnLatex}$.`,
      },
    },
    { label: `Nur auf der ${sideName(side)} Seite $${fnLatex}$`, why: ONE_SIDED },
  ]
}

// Quadrat ersetzen (square: das ersetzte Quadrat, partner: die andere Funktion ohne Quadrat, als LaTeX)
export function pythagorasMoves(square: string, partner: string, hyperbolic: boolean): WrongMove[] {
  return [
    hyperbolic
      ? { label: `$${square}$ durch $1 - ${partner}^2$ ersetzen`, why: REARRANGE_ERROR_TEXTS['eq-hyperbolic-sign'] }
      : { label: `$${square}$ durch $1 - ${partner}$ ersetzen`, why: REARRANGE_ERROR_TEXTS['eq-pythagoras-square'] },
    {
      label: 'Die beiden Quadrate einfach zu $1$ zusammenfassen',
      why: {
        detailed: 'Zu $1$ zusammenfassen darfst du nur, wenn beide Quadrate genau so dastehen wie in der Formel, mit demselben Faktor. Ersetze stattdessen ein Quadrat durch das andere.',
        short: 'Nur bei gleichen Faktoren; besser ein Quadrat ersetzen.',
      },
    },
    {
      label: 'Auf beiden Seiten die Wurzel ziehen',
      why: {
        detailed: 'Die Wurzel aus einer Summe lässt sich nicht Summand für Summand ziehen. Sorge zuerst dafür, dass nur noch eine Funktion in der Gleichung steht.',
        short: 'Erst nur noch eine Funktion, dann weiter.',
      },
    },
  ]
}

// Durch \cos u teilen (sin, cos, tan: als LaTeX, z. B. \sin x, \cos x und \tan x)
export function tanQuotientMoves(sin: string, cos: string, tan: string, fraction: boolean): WrongMove[] {
  return [
    { label: fraction ? `Nur den Zähler durch $${cos}$ teilen` : `Nur die linke Seite durch $${cos}$ teilen`, why: REARRANGE_ERROR_TEXTS['eq-divide-cos-partly'] },
    { label: `Durch $${sin}$ teilen und $\\frac{${cos}}{${sin}}$ als $${tan}$ schreiben`, why: REARRANGE_ERROR_TEXTS['eq-tan-flipped'] },
    {
      label: `$${sin}$ und $${cos}$ gegeneinander kürzen`,
      why: {
        detailed: 'Kürzen darfst du nur gleiche Faktoren. $\\sin$ und $\\cos$ sind verschiedene Funktionen, und es stehen Summen da.',
        short: 'Verschiedene Funktionen lassen sich nicht kürzen.',
      },
    },
  ]
}

export const EXPAND_MOVES: readonly WrongMove[] = [
  { label: 'Die Klammern einfach weglassen', why: { detailed: 'Ohne Klammer gehört der Faktor nur noch zum ersten Summanden. Jeder Summand in der Klammer muss malgenommen werden.', short: 'Klammern nicht weglassen, ausmultiplizieren.' } },
  { label: 'Die Zahl vor der Klammer nur mit dem ersten Summanden malnehmen', why: REARRANGE_ERROR_TEXTS['eq-bracket-first-term'] },
]

// Doppelbruch mit Brüchen im Nenner
export const EXTEND_MOVES: readonly WrongMove[] = [
  {
    label: 'Nur den Zähler mit dem inneren Nenner malnehmen',
    why: { detailed: 'Nimmst du nur den Zähler mal, ändert sich der Wert des Bruchs. Beim Erweitern nimmst du Zähler und Nenner mit demselben Term mal.', short: 'Erweitern: Zähler und Nenner mit demselben Term mal.' },
  },
  {
    label: 'Die inneren Nenner einfach weglassen',
    why: { detailed: 'Einen Nenner darfst du nicht einfach weglassen, dann ändert sich der Wert. Erweitere den Doppelbruch mit dem Hauptnenner der inneren Brüche.', short: 'Nicht weglassen, mit dem inneren Hauptnenner erweitern.' },
  },
]

// unknown: die Unbekannte als LaTeX, x oder \sqrt{x} (dann ist √x die Unbekannte, x = (√x)²)
export function collectMoves(target: string, unknown = target): WrongMove[] {
  const rootUnknown = unknown !== target
  return [
    {
      label: rootUnknown ? `Durch den Faktor vor $${unknown}$ teilen` : `Durch den Faktor vor dem ersten $${target}$ teilen`,
      why: { detailed: `Danach steht $${target}$ immer noch auf beiden Seiten. Erst müssen alle Summanden mit $${unknown}$ auf eine Seite.`, short: `Danach steht $${target}$ immer noch auf beiden Seiten.` },
    },
    rootUnknown
      ? {
          label: 'Beide Seiten noch einmal quadrieren',
          why: { detailed: `Solange neben $${unknown}$ noch andere Summanden stehen, entsteht beim Quadrieren wieder eine Wurzel. Stelle zuerst den Summanden mit $${unknown}$ allein.`, short: `Erst den Summanden mit $${unknown}$ allein stellen.` },
        }
      : {
          label: `Die Summanden mit $${target}$ auf beiden Seiten streichen`,
          why: { detailed: 'Streichen darfst du nur, was auf beiden Seiten genau gleich ist. Bringe die Summanden mit der Variable stattdessen auf eine Seite.', short: 'Nur genau Gleiches darf man auf beiden Seiten streichen.' },
        },
    { label: `Alles mit $${unknown}$ nach links, ohne die Vorzeichen zu ändern`, why: REARRANGE_ERROR_TEXTS['eq-sign-not-flipped'] },
  ]
}

export function factorMoves(unknown: string): WrongMove[] {
  return [
    {
      label: `Die Zahlen und Buchstaben vor $${unknown}$ malnehmen`,
      why: { detailed: `Summanden werden nicht malgenommen. Was in jedem Summanden steckt, kommt vor die Klammer: $a${unknown} + b${unknown} = ${unknown}(a + b)$.`, short: `Ausklammern: $a${unknown} + b${unknown} = ${unknown}(a + b)$.` },
    },
    {
      label: `Ein $${unknown}$ einfach streichen`,
      why: { detailed: 'Streichen ändert den Wert der Seite, dann stimmt die Gleichung nicht mehr. Klammere die Variable aus.', short: 'Nicht streichen, ausklammern.' },
    },
  ]
}

export const SQUARE_MOVES: readonly WrongMove[] = [
  { label: 'Die Wurzel einfach weglassen', why: { detailed: 'Weglassen ändert den Wert der Seite. Gegen eine Wurzel hilft das Quadrieren, auf beiden Seiten.', short: 'Gegen die Wurzel: beide Seiten quadrieren.' } },
  { label: 'Beide Seiten durch $2$ teilen', why: { detailed: 'Teilen ändert an der Wurzel nichts. Die Gegenrechnung zur Quadratwurzel ist das Quadrieren.', short: 'Gegenrechnung zur Wurzel ist das Quadrieren.' } },
]

export const ROOT_MOVES: readonly WrongMove[] = [
  { label: 'Beide Seiten durch $2$ teilen', why: { detailed: 'Die Hochzahl $2$ ist kein Faktor: $\\frac{x^2}{2}$ ist nicht $x$. Die Gegenrechnung zum Quadrieren ist die Wurzel.', short: 'Gegenrechnung zum Quadrieren ist die Wurzel.' } },
  { label: 'Das Quadrat einfach weglassen', why: { detailed: 'Weglassen ändert den Wert der Seite. Ziehe auf beiden Seiten die Wurzel.', short: 'Auf beiden Seiten die Wurzel ziehen.' } },
]

// --- Tipps ---

export const REARRANGE_HINTS = {
  add: 'Ein Summand verschwindet mit der Gegenrechnung: Aus $+c$ wird auf beiden Seiten $-c$.',
  move: 'Bringe den Summanden mit Minus auf die andere Seite, dort steht er mit Plus. Den Rest bringst du herüber.',
  divide: 'Einen Faktor wirst du los, indem du beide Seiten durch ihn teilst.',
  multiply: 'Einen Nenner wirst du los, indem du beide Seiten mit ihm malnimmst.',
  denominator: 'Steht die Variable im Nenner, nimm beide Seiten mit dem Nenner mal. Dann steht sie oben.',
  clear: 'Nimm beide Seiten mit dem Hauptnenner mal. Dann kürzen sich alle Nenner weg.',
  negate: 'Mal $(-1)$ dreht auf beiden Seiten alle Vorzeichen um.',
  reciprocal: 'Steht auf beiden Seiten genau ein Bruch, darfst du beide umdrehen.',
  combine: 'Den Kehrwert darfst du nur von einem einzigen Bruch nehmen.',
  combineBeforeMultiply: 'Fasse die Seite zuerst zu einem Bruch zusammen. Sonst entsteht beim Malnehmen und Teilen ein Doppelbruch.',
  combineBeforeRoot: 'Fasse die Seite zuerst zu einem Bruch zusammen. Dann ziehst du die Wurzel aus einem einzigen Bruch.',
  combineBeforeSquare: 'Fasse die Seite zuerst zu einem Bruch zusammen. Dann quadrierst du Zähler und Nenner.',
  combineBeforeLog: 'Fasse die Seite zuerst zu einem Bruch zusammen. Den $\\ln$ einer Summe kannst du nicht auseinanderziehen.',
  exp: 'Gegen einen Logarithmus hilft seine Basis hoch, auf beiden Seiten: $e^{\\ln u} = u$.',
  log: 'Steht die Variable in der Hochzahl, nimm auf beiden Seiten den $\\ln$: $\\ln\\left(e^u\\right) = u$, $\\ln\\left(a^u\\right) = u\\ln a$.',
  logLaw: 'Ziehe den $\\ln$ mit den Gesetzen auseinander: $\\ln(u \\cdot v) = \\ln u + \\ln v$, $\\ln\\left(a^u\\right) = u\\ln a$.',
  logCombine: 'Fasse die Logarithmen mit den Gesetzen zusammen: $\\ln u + \\ln v = \\ln(uv)$, $\\ln u - \\ln v = \\ln\\frac{u}{v}$.',
  powerLaw: 'Zerlege die Potenzen mit $a^{m + n} = a^m \\cdot a^n$, bis überall dieselbe Potenz steht.',
  arc: 'Gegen eine Winkel- oder Hyperbelfunktion hilft ihre Umkehrfunktion, auf beiden Seiten: $\\sin u = w \\Leftrightarrow u = \\arcsin w$.',
  trig: 'Gegen eine Umkehrfunktion hilft die Funktion selbst, auf beiden Seiten: $\\arctan u = w \\Leftrightarrow u = \\tan w$.',
  pythagoras: 'Mit $\\sin^2 u + \\cos^2 u = 1$ (bei Hyperbelfunktionen $\\cosh^2 u - \\sinh^2 u = 1$) ersetzt du ein Quadrat durch das andere.',
  tanQuotient: 'Teile durch $\\cos u$: Aus $\\frac{\\sin u}{\\cos u}$ wird $\\tan u$, aus $\\frac{\\cos u}{\\cos u}$ wird $1$. Bei Hyperbelfunktionen genauso mit $\\tanh u$.',
  extend: 'Erweitere den Doppelbruch: Zähler und Nenner mal den Hauptnenner der inneren Brüche. Dann kürzen sich die inneren Nenner weg.',
  expand: 'Jeder Summand in der Klammer wird malgenommen: $a(b + c) = ab + ac$.',
  collect: 'Alle Summanden mit der Variable auf eine Seite, alle anderen auf die andere. Was die Seite wechselt, wechselt das Vorzeichen.',
  factor: 'Klammere die Variable aus: $ax + bx = x(a + b)$. Steht ein Summand nur als $x$ da, bleibt in der Klammer eine $1$.',
  square: 'Die Gegenrechnung zur Wurzel ist das Quadrieren, auf beiden Seiten.',
  root: 'Die Gegenrechnung zum Quadrat ist die Wurzel. Alle Buchstaben sind positiv, also brauchst du kein $\\pm$.',
  finish: 'Bringe alles auf einen Hauptnenner und fasse die Zähler zusammen.',
  result: 'Rechne die Umformung auf beiden Seiten aus. Auf der Seite mit der Variable hebt sich etwas weg.',
} as const

// Tipp für die ganze Aufgabe (im freien Modus)
export function rearrangeTaskHint(target: string, several: boolean): Explanation {
  return several
    ? same(`Nenner beseitigen, ausmultiplizieren, alle Summanden mit $${target}$ auf eine Seite, $${target}$ ausklammern und teilen.`)
    : same(`Mache die Rechnungen um $${target}$ von außen nach innen rückgängig, immer auf beiden Seiten.`)
}

// --- Erklärungen der richtigen Schritte ---

// unknown: x oder \sqrt{x} (siehe collectMoves)
export function explainMove(kind: string, operation: string, target: string, unknown = target): Explanation {
  switch (kind) {
    case 'add':
      return { detailed: `Der Summand steht ganz außen. Mit der Gegenrechnung ${operation.replace(/^Auf beiden Seiten /, '')} auf beiden Seiten verschwindet er dort, und die Gleichung stimmt weiter.`, short: `${operation}: Gegenrechnung auf beiden Seiten.` }
    case 'move':
      return { detailed: 'Der Summand mit der Variable steht mit Minus da. Auf der anderen Seite steht er mit Plus; dafür kommt die andere Seite mit umgekehrtem Vorzeichen herüber.', short: 'Rüberbringen: Das Vorzeichen wechselt.' }
    case 'divide':
      return { detailed: `Der Faktor steht ganz außen um $${target}$. Die Gegenrechnung zum Malnehmen ist das Teilen, auf beiden Seiten.`, short: `${operation}: Gegenrechnung zum Malnehmen.` }
    case 'multiply':
      return { detailed: 'Der Nenner wird beseitigt, indem du beide Seiten mit ihm malnimmst. Auf seiner Seite kürzt er sich weg.', short: `${operation}: Der Nenner kürzt sich weg.` }
    case 'negate':
      return { detailed: `Vor $${target}$ steht ein Minus. Mal $(-1)$ auf beiden Seiten dreht alle Vorzeichen um.`, short: 'Mal $(-1)$: alle Vorzeichen drehen sich um.' }
    case 'reciprocal':
      return { detailed: 'Auf beiden Seiten steht genau ein Bruch. Sind zwei Brüche gleich, sind es auch ihre Kehrwerte. So kommt die Variable aus dem Nenner.', short: 'Gleiche Brüche haben gleiche Kehrwerte.' }
    case 'combine':
      return { detailed: 'Bevor du den Kehrwert nimmst, muss auf der Seite genau ein Bruch stehen. Fasse sie deshalb über den Hauptnenner zusammen.', short: 'Erst zu einem Bruch, dann Kehrwert.' }
    case 'combine-multiply':
      return { detailed: 'Auf der anderen Seite steht eine Summe mit Brüchen. Fasse sie erst über den Hauptnenner zu einem Bruch zusammen; dann bleibt nach dem Malnehmen mit dem Nenner kein Doppelbruch übrig.', short: 'Erst zu einem Bruch, dann mit dem Nenner malnehmen.' }
    case 'combine-root':
      return { detailed: 'Auf der anderen Seite steht eine Summe mit Brüchen. Fasse sie erst über den Hauptnenner zu einem Bruch zusammen; dann ziehst du die Wurzel aus einem einzigen Bruch.', short: 'Erst zu einem Bruch, dann die Wurzel ziehen.' }
    case 'combine-square':
      return { detailed: 'Auf der anderen Seite steht eine Summe mit Brüchen. Fasse sie erst über den Hauptnenner zu einem Bruch zusammen; dann quadrierst du einfach Zähler und Nenner.', short: 'Erst zu einem Bruch, dann quadrieren.' }
    case 'combine-log':
      return { detailed: 'Auf der anderen Seite steht eine Summe mit Brüchen. Fasse sie erst über den Hauptnenner zu einem Bruch zusammen; den $\\ln$ einer Summe kannst du nämlich nicht auseinanderziehen.', short: 'Erst zu einem Bruch, dann logarithmieren.' }
    case 'exp':
      return { detailed: 'Die Variable steckt in einem Logarithmus. Die Potenz zu seiner Basis hebt ihn auf: $e^{\\ln u} = u$, $a^{\\log_a u} = u$. Also schreibst du beide Seiten als Hochzahl dieser Basis.', short: `${operation}: hebt den Logarithmus auf.` }
    case 'log':
      return { detailed: 'Die Variable steckt in einer Hochzahl. Nimm auf beiden Seiten den $\\ln$: Er hebt die e-Funktion auf, $\\ln\\left(e^u\\right) = u$. Bei einer anderen Basis oder einem Produkt holen ihn danach die Logarithmusgesetze herunter.', short: 'Logarithmieren: $\\ln$ auf beiden Seiten.' }
    case 'logLaw':
      return { detailed: 'Im $\\ln$ steht ein Produkt oder eine Potenz mit der Variable in der Hochzahl. Mit den Logarithmusgesetzen wird daraus eine Summe, und die Hochzahl kommt als Faktor herunter: $\\ln(u \\cdot v) = \\ln u + \\ln v$, $\\ln\\left(a^u\\right) = u\\ln a$.', short: 'Logarithmusgesetze: die Hochzahl kommt herunter.' }
    case 'logCombine':
      return { detailed: 'Die Variable steckt in mehreren Logarithmen. Mit den Logarithmusgesetzen wird daraus einer: $\\ln u + \\ln v = \\ln(uv)$, $\\ln u - \\ln v = \\ln\\frac{u}{v}$. Den löst du dann mit der Basis hoch auf.', short: 'Logarithmusgesetze: aus mehreren Logarithmen wird einer.' }
    case 'powerLaw':
      return { detailed: 'Die Variable steht in mehreren Hochzahlen, die sich nur um einen festen Teil unterscheiden. Mit $a^{m + n} = a^m \\cdot a^n$ steht danach überall dieselbe Potenz, die du ausklammern kannst.', short: 'Potenzgesetz: überall dieselbe Potenz.' }
    case 'arc':
      return { detailed: 'Die Variable steckt in einer Winkel- oder Hyperbelfunktion. Ihre Umkehrfunktion hebt sie auf: $\\arcsin(\\sin u) = u$, solange $u$ im Bereich der Aufgabe liegt. Also nimmst du auf beiden Seiten die Umkehrfunktion.', short: `${operation}: hebt die Funktion auf.` }
    case 'trig':
      return { detailed: 'Die Variable steckt in einer Umkehrfunktion. Die Funktion selbst hebt sie auf: $\\tan(\\arctan u) = u$. Also nimmst du auf beiden Seiten diese Funktion.', short: `${operation}: hebt die Umkehrfunktion auf.` }
    case 'pythagoras':
      return { detailed: 'In der Gleichung stehen zwei verschiedene Quadrate. Mit $\\sin^2 u + \\cos^2 u = 1$ (bei Hyperbelfunktionen $\\cosh^2 u - \\sinh^2 u = 1$) ersetzt du eines durch das andere. Dann steht nur noch eine Funktion da, nach der du auflöst wie nach $x$.', short: 'Ein Quadrat durch das andere ersetzen.' }
    case 'tanQuotient':
      return { detailed: 'In jedem Summanden steht genau ein $\\sin u$ oder $\\cos u$. Teilst du durch $\\cos u$, wird aus $\\sin u$ der $\\tan u$ und aus $\\cos u$ die $1$; bei einem Bruch teilst du Zähler und Nenner, dann bleibt sein Wert gleich. Danach steht nur noch $\\tan u$ da (bei Hyperbelfunktionen $\\tanh u$).', short: `${operation}: nur noch der Tangens.` }
    case 'expand':
      return { detailed: 'Die Variable steckt in Klammern. Nach dem Ausmultiplizieren stehen alle Summanden einzeln da und lassen sich sortieren.', short: 'Ausmultiplizieren, dann sortieren.' }
    case 'extend':
      return { detailed: 'Im Zähler und Nenner stehen weitere Brüche. Nimmst du Zähler und Nenner mit dem Hauptnenner der inneren Brüche mal, kürzen sich die inneren Nenner weg, und der Wert bleibt gleich.', short: `${operation}: Die inneren Nenner kürzen sich weg.` }
    case 'collect':
      if (unknown !== target) {
        return { detailed: `Bringe den Summanden mit $${unknown}$ auf eine Seite und alle anderen auf die andere; was die Seite wechselt, wechselt das Vorzeichen. Steht $${unknown}$ allein, kannst du noch einmal quadrieren.`, short: `Summand mit $${unknown}$ nach links, Rest nach rechts.` }
      }
      return { detailed: `$${target}$ kommt in mehreren Summanden vor. Bringe alle Summanden mit $${target}$ auf eine Seite und alle anderen auf die andere; was die Seite wechselt, wechselt das Vorzeichen.`, short: `Summanden mit $${target}$ nach links, Rest nach rechts.` }
    case 'factor':
      return { detailed: `Links steht $${unknown}$ in mehreren Summanden. Klammerst du $${unknown}$ aus, steht es nur noch einmal da: $a${unknown} + b${unknown} = ${unknown}(a + b)$.`, short: `$${unknown}$ ausklammern.` }
    case 'square':
      return { detailed: 'Die Gegenrechnung zur Wurzel ist das Quadrieren. Weil beide Seiten positiv sind, bleibt die Lösung dieselbe.', short: 'Gegenrechnung zur Wurzel: quadrieren.' }
    case 'root':
      return { detailed: 'Die Gegenrechnung zum Quadrat ist die Wurzel. Weil alle Buchstaben positiv sind, gilt nur das Plus.', short: 'Gegenrechnung zum Quadrat: Wurzel.' }
    default:
      return same(operation)
  }
}

// Erklärung zum Ergebnis eines Schritts: vorher → nachher
export function explainResult(kind: string, before: string, after: string): Explanation {
  const lines = `$${before}$\n$${after}$`
  switch (kind) {
    case 'finish':
      return { detailed: `Die rechte Seite wird über den Hauptnenner zu einem Bruch zusammengefasst und gekürzt:\n${lines}`, short: lines }
    case 'expand':
      return { detailed: `Jeder Summand in der Klammer wird malgenommen:\n${lines}`, short: lines }
    case 'collect':
      return { detailed: `Die Summanden, die die Seite wechseln, wechseln ihr Vorzeichen:\n${lines}`, short: lines }
    default:
      return { detailed: `Auf beiden Seiten dieselbe Rechnung:\n${lines}`, short: lines }
  }
}
