import { createRng } from '../random/rng.ts'
import type { Level } from './taskNumber.ts'

// Logarithmen auf beiden Seiten, verschiedene Basen (M6 Schritt 4b-2): die Arten der Aufgaben mit Stufe und Bausteinen.
// Reine Daten ohne Engine, damit die Seiten ohne Mathe-Engine wissen, welche Bausteine eine Nummer wie „logeq.2-4711" hat.
// Gebaut werden die Aufgaben in logEquationTasks.ts. Arten nur hinten anhängen und ihre Anteile nicht ändern, sonst bauen
// alte Nummern eine andere Art.

export type LogEquationKind = {
  readonly id: string
  readonly level: Level
  // Bausteine der Aufgabe: danach linear oder quadratisch
  readonly blocks: readonly string[]
  // Anteil innerhalb der Stufe
  readonly weight: number
}

export const LOG_EQUATION_KINDS: readonly LogEquationKind[] = [
  // Stufe 1: je Seite ein Logarithmus derselben Basis, dazu eine Zahl: \log_2(x + a) = \log_2 x + 3
  { id: 'zahl', level: 1, blocks: ['log'], weight: 1 },
  // Stufe 2: Faktor vor dem Logarithmus, danach quadratisch: 2\ln x = \ln(ax + b)
  { id: 'faktor', level: 2, blocks: ['log', 'quadratisch'], weight: 0.3 },
  // Stufe 2: \ln und ein anderer Logarithmus desselben Terms (Basiswechsel zu \ln): \ln(x + a) + \log_3(x + a) = b
  { id: 'basis-ln', level: 2, blocks: ['log'], weight: 0.25 },
  // Stufe 2: Zahlen auf beiden Seiten, danach linear: \log_3(x + a) - 1 = \log_3(x - b) + 1
  { id: 'zahlen', level: 2, blocks: ['log'], weight: 0.25 },
  // Stufe 2: Basen 2 und 4 mit Faktor 2, danach linear: 2\log_4(x + a) = \log_2(bx) + 1
  { id: 'basis-linear', level: 2, blocks: ['log'], weight: 0.2 },
  // Stufe 3: zwei Logarithmen auf einer Seite, danach quadratisch: \ln(x + a) + \ln(x - a) = \ln(bx)
  { id: 'produkt', level: 3, blocks: ['log', 'quadratisch'], weight: 0.4 },
  // Stufe 3: Basen 2 und 4 (Basiswechsel zur kleineren Basis), danach quadratisch: \log_2 x = \log_4(x + a)
  { id: 'basis-potenz', level: 3, blocks: ['log', 'quadratisch'], weight: 0.25 },
  // Stufe 3: Faktor gegen zwei Logarithmen, einer ohne x: 2\ln x = \ln b + \ln(x + c)
  { id: 'faktor-produkt', level: 3, blocks: ['log', 'quadratisch'], weight: 0.35 },
  // Stufe 4: Basen 2 und 4 mit einer Zahl: \log_2 x + 1 = \log_4(x + a)
  { id: 'basis-zahl', level: 4, blocks: ['log', 'quadratisch'], weight: 0.3 },
  // Stufe 4: zwei Logarithmen auf einer Seite mit einer Zahl: \log_2(x + a) + \log_2(x - a) = \log_2(bx) + 1
  { id: 'produkt-zahl', level: 4, blocks: ['log', 'quadratisch'], weight: 0.35 },
  // Stufe 4: Faktor gegen zwei Logarithmen, das Quadrat hebt sich weg: 2\ln x = \ln(x + a) + \ln(x - b)
  { id: 'quadrat-weg', level: 4, blocks: ['log'], weight: 0.15 },
  // Stufe 4: \ln und ein anderer Logarithmus desselben Terms mit Faktoren: 2\ln(x + a) - \log_3(x + a) = b
  { id: 'basis-ln-faktor', level: 4, blocks: ['log'], weight: 0.2 },
]

export const logEquationKinds = (level: Level) => LOG_EQUATION_KINDS.filter((kind) => kind.level === level)

export const hasLogEquations = (level: Level) => logEquationKinds(level).length > 0

// Art der Nummer s (ab 1) einer Stufe, vorab mit eigenem Zufall; null, wenn die Stufe keine solchen Aufgaben hat
export function logEquationKind(level: Level, s: number): LogEquationKind | null {
  const kinds = logEquationKinds(level)
  if (kinds.length === 0) return null
  const total = kinds.reduce((sum, kind) => sum + kind.weight, 0)
  let r = createRng(`logeq-art:${level}:${s}`).next() * total
  for (const kind of kinds) {
    r -= kind.weight
    if (r < 0) return kind
  }
  return kinds[kinds.length - 1]
}
