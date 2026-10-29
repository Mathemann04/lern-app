import type { Level } from '../engine/tasks/taskNumber.ts'

// Vorschau-Formeln für die Startseite. Nur Aufgabenterme aus docs/VISION.md,
// keine Lösungen: Lösungen berechnet ab Schritt 3 die Mathe-Engine.

export type LevelPreview = {
  level: Level
  title: string
  examples: string[]
  // schon im geführten Modus spielbar
  available: boolean
}

export const derivativeLevels: LevelPreview[] = [
  {
    level: 1,
    available: true,
    title: 'Potenz-, Faktor- und Summenregel',
    examples: [String.raw`4x^3 - \frac{2}{x} + \sqrt{x}`],
  },
  {
    level: 2,
    available: true,
    title: 'Mit e-Funktion, ln, sin und cos',
    examples: [String.raw`x^2 e^x`, String.raw`\sin(3x)`],
  },
  {
    level: 3,
    available: true,
    title: 'Zwei Regeln kombiniert',
    examples: [String.raw`e^{x^2} \cos x`, String.raw`\frac{\ln x}{x^2}`],
  },
  {
    level: 4,
    available: true,
    title: 'Uni-Niveau: mehrere Regeln verschachtelt',
    examples: [
      String.raw`\frac{x^2 e^{-3x}}{\sqrt{1+x^2}}`,
      String.raw`\ln\left(\frac{x^2+1}{x-1}\right)`,
    ],
  },
  {
    level: 5,
    available: false,
    title: 'Profi: logarithmisch, implizit, Umkehr- und Hyperbelfunktionen',
    examples: [String.raw`x^x`, String.raw`x^{\sin x}`, String.raw`x^2 + y^2 = 25`],
  },
]

export const isLevelAvailable = (level: Level) => derivativeLevels.some((l) => l.level === level && l.available)

export type NotationSample = {
  label: string
  tex: string
}

// Zeigt die deutschen Schreibweisen, damit man sie mit dem Skript vergleichen kann
export const notationSamples: NotationSample[] = [
  { label: 'Bruch', tex: String.raw`\frac{x^2+1}{x-1}` },
  { label: 'Wurzeln', tex: String.raw`\sqrt{1+x^2}, \quad \sqrt[3]{x^2}` },
  { label: 'Exponenten', tex: String.raw`e^{-3x}, \quad x^{\frac{2}{3}}` },
  { label: 'Dezimalkomma und Malpunkt', tex: String.raw`1{,}5 \cdot 10^3` },
  { label: 'Logarithmen', tex: String.raw`\ln x, \quad \log_2 x` },
  { label: 'Ableitung', tex: String.raw`f'(x)` },
]
