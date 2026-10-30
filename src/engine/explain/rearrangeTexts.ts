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

const sideName = (side: 'lhs' | 'rhs') => (side === 'lhs' ? 'linken' : 'rechten')

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
      label: `Beide Seiten mal ${d}`,
      why: { detailed: `Malnehmen macht den Faktor ${d} nur größer. Die Gegenrechnung zum Malnehmen ist das Teilen.`, short: 'Gegenrechnung zum Malnehmen ist das Teilen.' },
    },
    {
      label: `Auf beiden Seiten ${divisor.kind === 'add' ? `$-(${toLatex(divisor)})$` : `$-${toLatex(divisor)}$`}`,
      why: { detailed: `Abziehen hilft gegen einen Summanden, nicht gegen einen Faktor. ${d} bleibt danach als Faktor stehen.`, short: 'Abziehen hilft nur gegen Summanden.' },
    },
    ...(side ? [{ label: `Nur die ${sideName(side)} Seite durch ${d}`, why: ONE_SIDED }] : []),
  ]
}

export function multiplyMoves(denominator: Expr, side: 'lhs' | 'rhs' | null, cancelInside: boolean): WrongMove[] {
  const d = m(denominator)
  return [
    {
      label: `Beide Seiten durch ${d}`,
      why: { detailed: `Teilen macht den Nenner nur größer, ${d} steht dann zweimal unten. Gegen einen Nenner hilft das Malnehmen.`, short: 'Gegen einen Nenner hilft das Malnehmen.' },
    },
    ...(side ? [{ label: `Nur die ${sideName(side)} Seite mal ${d}`, why: ONE_SIDED }] : []),
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
    { label: `Nur die ${sideName(side)} Seite mal $(-1)$`, why: ONE_SIDED },
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

export const EXPAND_MOVES: readonly WrongMove[] = [
  { label: 'Die Klammern einfach weglassen', why: { detailed: 'Ohne Klammer gehört der Faktor nur noch zum ersten Summanden. Jeder Summand in der Klammer muss malgenommen werden.', short: 'Klammern nicht weglassen, ausmultiplizieren.' } },
  { label: 'Die Zahl vor der Klammer nur mit dem ersten Summanden malnehmen', why: REARRANGE_ERROR_TEXTS['eq-bracket-first-term'] },
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
    case 'expand':
      return { detailed: 'Die Variable steckt in Klammern. Nach dem Ausmultiplizieren stehen alle Summanden einzeln da und lassen sich sortieren.', short: 'Ausmultiplizieren, dann sortieren.' }
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
