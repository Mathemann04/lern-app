import { createRng } from '../random/rng.ts'
import type { Level } from './taskNumber.ts'

// Gleichungen mit Zahlen (M6 Schritt 4b-3): die Arten der Aufgaben mit Stufe und Bausteinen. Ergebnis eine Zahl oder
// „keine Lösung“, mit Probe in der Ausgangsgleichung. Reine Daten ohne Engine, damit die Seiten ohne Mathe-Engine wissen,
// welche Bausteine eine Nummer wie „zahlen.2-4711" hat. Gebaut werden die Aufgaben in numberEquationTasks.ts. Arten nur
// hinten anhängen und ihre Anteile nicht ändern, sonst bauen alte Nummern eine andere Art.

export type NumberEquationKind = {
  readonly id: string
  readonly level: Level
  readonly blocks: readonly string[]
  // Anteil innerhalb der Stufe
  readonly weight: number
}

export const NUMBER_EQUATION_KINDS: readonly NumberEquationKind[] = [
  // Stufe 1: Wurzel gleich Zahl, auch gleich einer negativen Zahl (keine Lösung): 2\sqrt{3x + 1} - 4 = 6
  { id: 'wurzel', level: 1, blocks: ['wurzeln'], weight: 0.4 },
  // Stufe 1: x im Nenner, danach linear: \frac{12}{x - 2} = 3
  { id: 'bruch', level: 1, blocks: ['brueche'], weight: 0.3 },
  // Stufe 1: Logarithmus gleich Zahl: \log_2(3x - 1) = 3
  { id: 'log', level: 1, blocks: ['log'], weight: 0.3 },
  // Stufe 2: Wurzel gleich einem Term mit x, danach quadratisch, eine Scheinlösung: \sqrt{2x + 1} = x - 1
  { id: 'wurzel-linear', level: 2, blocks: ['wurzeln', 'quadratisch'], weight: 0.4 },
  // Stufe 2: x im Nenner auf beiden Seiten, die Lösung kann der verbotene Wert sein: \frac{2x}{x - 1} = \frac{2}{x - 1} + 3
  { id: 'bruch-def', level: 2, blocks: ['brueche'], weight: 0.3 },
  // Stufe 2: zwei Logarithmen, danach quadratisch, eine Lösung außerhalb des Definitionsbereichs: \log_2 x + \log_2(x - 2) = 3
  { id: 'log-quadratisch', level: 2, blocks: ['log', 'quadratisch'], weight: 0.3 },
  // Stufe 3: zwei Wurzeln, zweimal quadrieren: \sqrt{x + 7} = \sqrt{x} + 1
  { id: 'zwei-wurzeln', level: 3, blocks: ['wurzeln'], weight: 0.25 },
  // Stufe 3: x und \sqrt{x}, Substitution, u < 0 verwerfen: x - 2\sqrt{x} = 8
  { id: 'wurzel-x', level: 3, blocks: ['wurzeln', 'quadratisch'], weight: 0.2 },
  // Stufe 3: x^2 im Zähler, eine Lösung ist der verbotene Wert: \frac{x^2}{x - 3} = \frac{5x - 6}{x - 3}
  { id: 'bruch-quadratisch', level: 3, blocks: ['brueche', 'quadratisch'], weight: 0.3 },
  // Stufe 3: Hauptnenner aus zwei Nennern mit x, danach linear, auch ohne Lösung: \frac{3}{x} + \frac{2}{x - 1} = \frac{5}{x(x - 1)}
  { id: 'hauptnenner', level: 3, blocks: ['brueche'], weight: 0.25 },
  // Stufe 4: e^{2x} und e^x, Substitution, u ≤ 0 verwerfen: e^{2x} - e^x = 6
  { id: 'exp-quadratisch', level: 4, blocks: ['exp', 'quadratisch'], weight: 0.25 },
  // Stufe 4: Logarithmen auf beiden Seiten mit einer Zahl, danach quadratisch: \log_2(x + 2) + \log_2 x = \log_2(x + 4) + 1
  { id: 'log-zahl-quadratisch', level: 4, blocks: ['log', 'quadratisch'], weight: 0.25 },
  // Stufe 4: Wurzel aus einem Bruch oder Bruch mit Wurzel, danach quadratisch: \frac{24}{\sqrt{x}} = \sqrt{x} + 2
  { id: 'wurzel-bruch', level: 4, blocks: ['brueche', 'wurzeln', 'quadratisch'], weight: 0.25 },
  // Stufe 4: Wurzel aus einem quadratischen Term gleich Term mit x, Scheinlösung oder keine Lösung: \sqrt{x^2 + 7} = x + 1
  { id: 'wurzel-quadrat', level: 4, blocks: ['wurzeln', 'quadratisch'], weight: 0.25 },
]

export const numberEquationKinds = (level: Level) => NUMBER_EQUATION_KINDS.filter((kind) => kind.level === level)

export const hasNumberEquations = (level: Level) => numberEquationKinds(level).length > 0

// Art der Nummer s (ab 1) einer Stufe, vorab mit eigenem Zufall; null, wenn die Stufe keine solchen Aufgaben hat
export function numberEquationKind(level: Level, s: number): NumberEquationKind | null {
  const kinds = numberEquationKinds(level)
  if (kinds.length === 0) return null
  const total = kinds.reduce((sum, kind) => sum + kind.weight, 0)
  let r = createRng(`zahlen-art:${level}:${s}`).next() * total
  for (const kind of kinds) {
    r -= kind.weight
    if (r < 0) return kind
  }
  return kinds[kinds.length - 1]
}
