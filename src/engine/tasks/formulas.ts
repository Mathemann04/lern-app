// Formeln aus Technik und Physik zum Umstellen (M6 Schritt 4b, Wunsch des Nutzers nach den Übungsblättern): eine eigene
// Sammlung bekannter Formeln, ohne Einheiten (mit Einheiten in M10). Reine Daten ohne Engine, damit die Seiten ohne
// Mathe-Engine wissen, welche Bausteine dabei vorkommen. Die Aufgaben baut formulaTasks.ts.
//
// Jede Aufgabe ist eine Formel und eine Größe, nach der aufgelöst wird. Ihre Nummer ist ihre Stelle in FORMULA_TASKS
// (ab 1, „formel.2-1"); neue Formeln und Größen deshalb nur hinten anhängen, nie umsortieren oder löschen. Stufe und
// Bausteine stehen hier fest; ein Test rechnet sie mit der Engine nach (formulaTasks.test.ts).

import type { Level } from './taskNumber.ts'

export type Formula = {
  // feste Id
  readonly id: string
  // Name, wie er über der Aufgabe steht
  readonly name: string
  // die Formel in LaTeX, links die Größe, die sie ausrechnet
  readonly latex: string
  // Zeichen (wie in der Formel) und Bedeutung, in der Reihenfolge, in der sie unter der Aufgabe stehen
  readonly quantities: readonly (readonly [string, string])[]
  // Bedingungen, damit die Lösung eindeutig ist (z. B. ein Winkel unter 90°), als LaTeX wie „\alpha < \frac{\pi}{2}"
  readonly conditions?: readonly string[]
}

export type FormulaTask = {
  readonly formula: string
  // Größe, nach der aufgelöst wird
  readonly target: string
  readonly level: Level
  // Bausteine (Ids aus blocks.ts) in der Reihenfolge der Liste
  readonly blocks: readonly string[]
}

export const FORMULAS: readonly Formula[] = [
  {
    id: 'fadenpendel',
    name: 'Schwingungsdauer eines Fadenpendels',
    latex: 'T = 2\\pi\\sqrt{\\frac{l}{g}}',
    quantities: [['T', 'Schwingungsdauer'], ['l', 'Länge des Fadens'], ['g', 'Fallbeschleunigung']],
  },
  {
    id: 'federpendel',
    name: 'Schwingungsdauer eines Federpendels',
    latex: 'T = 2\\pi\\sqrt{\\frac{m}{D}}',
    quantities: [['T', 'Schwingungsdauer'], ['m', 'Masse'], ['D', 'Federkonstante']],
  },
  {
    id: 'fallweg',
    name: 'Freier Fall',
    latex: 's = \\frac{1}{2}gt^{2}',
    quantities: [['s', 'Fallweg'], ['g', 'Fallbeschleunigung'], ['t', 'Zeit']],
  },
  {
    id: 'aufprall',
    name: 'Geschwindigkeit nach dem freien Fall',
    latex: 'v = \\sqrt{2gh}',
    quantities: [['v', 'Geschwindigkeit'], ['g', 'Fallbeschleunigung'], ['h', 'Fallhöhe']],
  },
  {
    id: 'bewegungsenergie',
    name: 'Bewegungsenergie',
    latex: 'W = \\frac{1}{2}mv^{2}',
    quantities: [['W', 'Energie'], ['m', 'Masse'], ['v', 'Geschwindigkeit']],
  },
  {
    id: 'beschleunigt',
    name: 'Gleichmäßig beschleunigte Bewegung',
    latex: 's = v_0t + \\frac{at^{2}}{2}',
    quantities: [['s', 'Weg'], ['v_0', 'Anfangsgeschwindigkeit'], ['a', 'Beschleunigung'], ['t', 'Zeit']],
  },
  {
    id: 'bremsweg',
    name: 'Bremsweg',
    latex: 's = \\frac{v^{2}}{2a}',
    quantities: [['s', 'Bremsweg'], ['v', 'Geschwindigkeit'], ['a', 'Bremsverzögerung']],
  },
  {
    id: 'linse',
    name: 'Linsengleichung',
    latex: '\\frac{1}{f} = \\frac{1}{g} + \\frac{1}{b}',
    quantities: [['f', 'Brennweite'], ['g', 'Gegenstandsweite'], ['b', 'Bildweite']],
  },
  {
    id: 'parallelschaltung',
    name: 'Zwei Widerstände parallel',
    latex: '\\frac{1}{R} = \\frac{1}{R_1} + \\frac{1}{R_2}',
    quantities: [['R', 'Gesamtwiderstand'], ['R_1', 'erster Widerstand'], ['R_2', 'zweiter Widerstand']],
  },
  {
    id: 'leistung',
    name: 'Elektrische Leistung',
    latex: 'P = \\frac{U^{2}}{R}',
    quantities: [['P', 'Leistung'], ['U', 'Spannung'], ['R', 'Widerstand']],
  },
  {
    id: 'plattenkondensator',
    name: 'Kapazität eines Plattenkondensators',
    latex: 'C = \\frac{\\varepsilon_0\\varepsilon_r A}{d}',
    quantities: [['C', 'Kapazität'], ['\\varepsilon_0', 'elektrische Feldkonstante'], ['\\varepsilon_r', 'Permittivitätszahl'], ['A', 'Fläche einer Platte'], ['d', 'Abstand der Platten']],
  },
  {
    id: 'entladen',
    name: 'Entladen eines Kondensators',
    latex: 'U = U_0e^{-\\frac{t}{RC}}',
    quantities: [['U', 'Spannung'], ['U_0', 'Spannung am Anfang'], ['t', 'Zeit'], ['R', 'Widerstand'], ['C', 'Kapazität']],
  },
  {
    id: 'aufladen',
    name: 'Aufladen eines Kondensators',
    latex: 'Q = Q_0\\left(1 - e^{-\\frac{t}{\\tau}}\\right)',
    quantities: [['Q', 'Ladung'], ['Q_0', 'Ladung am Ende'], ['t', 'Zeit'], ['\\tau', 'Zeitkonstante']],
  },
  {
    id: 'zerfall',
    name: 'Radioaktiver Zerfall',
    latex: 'N = N_0e^{-\\lambda t}',
    quantities: [['N', 'Zahl der noch nicht zerfallenen Kerne'], ['N_0', 'Zahl der Kerne am Anfang'], ['\\lambda', 'Zerfallskonstante'], ['t', 'Zeit']],
  },
  {
    id: 'abkuehlen',
    name: 'Abkühlen',
    latex: 'T = T_U + (T_0 - T_U)e^{-kt}',
    quantities: [['T', 'Temperatur'], ['T_U', 'Temperatur der Umgebung'], ['T_0', 'Temperatur am Anfang'], ['k', 'Abkühlkonstante'], ['t', 'Zeit']],
  },
  {
    id: 'luftdruck',
    name: 'Luftdruck in der Höhe',
    latex: 'p = p_0e^{-\\frac{h}{H}}',
    quantities: [['p', 'Luftdruck'], ['p_0', 'Luftdruck am Boden'], ['h', 'Höhe'], ['H', 'Skalenhöhe']],
  },
  {
    id: 'schallpegel',
    name: 'Schallpegel',
    latex: 'L = 10\\lg\\left(\\frac{I}{I_0}\\right)',
    quantities: [['L', 'Schallpegel'], ['I', 'Schallintensität'], ['I_0', 'Bezugsintensität']],
  },
  {
    id: 'wurfweite',
    name: 'Wurfweite beim schiefen Wurf',
    latex: 'w = \\frac{v^{2}\\sin(2\\alpha)}{g}',
    quantities: [['w', 'Wurfweite'], ['v', 'Abwurfgeschwindigkeit'], ['\\alpha', 'Abwurfwinkel'], ['g', 'Fallbeschleunigung']],
    // flacher Wurf: Jede Wurfweite erreichen zwei Winkel, einer unter 45°
    conditions: ['\\alpha < \\frac{\\pi}{4}'],
  },
  {
    id: 'hangabtrieb',
    name: 'Hangabtriebskraft',
    latex: 'F = mg\\sin\\alpha',
    quantities: [['F', 'Hangabtriebskraft'], ['m', 'Masse'], ['g', 'Fallbeschleunigung'], ['\\alpha', 'Neigungswinkel']],
    conditions: ['\\alpha < \\frac{\\pi}{2}'],
  },
  {
    id: 'gravitation',
    name: 'Gravitationskraft',
    latex: 'F = \\frac{Gm_1m_2}{r^{2}}',
    quantities: [['F', 'Kraft'], ['G', 'Gravitationskonstante'], ['m_1', 'erste Masse'], ['m_2', 'zweite Masse'], ['r', 'Abstand']],
  },
  {
    id: 'zentripetal',
    name: 'Zentripetalkraft',
    latex: 'F = \\frac{mv^{2}}{r}',
    quantities: [['F', 'Kraft'], ['m', 'Masse'], ['v', 'Bahngeschwindigkeit'], ['r', 'Radius']],
  },
  {
    id: 'seil',
    name: 'Durchhängendes Seil (Kettenlinie)',
    latex: 'y = a\\cosh\\left(\\frac{x}{a}\\right)',
    quantities: [['y', 'Höhe des Seils'], ['x', 'waagrechter Abstand vom tiefsten Punkt'], ['a', 'Parameter des Seils']],
  },
  {
    id: 'auftrieb',
    name: 'Auftrieb',
    latex: 'F = \\rho gV',
    quantities: [['F', 'Auftriebskraft'], ['\\rho', 'Dichte der Flüssigkeit'], ['g', 'Fallbeschleunigung'], ['V', 'eingetauchtes Volumen']],
  },
  {
    id: 'fluchtgeschwindigkeit',
    name: 'Fluchtgeschwindigkeit',
    latex: 'v = \\sqrt{\\frac{2GM}{r}}',
    quantities: [['v', 'Fluchtgeschwindigkeit'], ['G', 'Gravitationskonstante'], ['M', 'Masse des Planeten'], ['r', 'Abstand vom Mittelpunkt']],
  },
  {
    id: 'schwingkreis',
    name: 'Frequenz eines Schwingkreises',
    latex: 'f = \\frac{1}{2\\pi\\sqrt{LC}}',
    quantities: [['f', 'Frequenz'], ['L', 'Induktivität'], ['C', 'Kapazität']],
  },
  {
    id: 'gasgesetz',
    name: 'Gasgesetz',
    latex: 'pV = nRT',
    quantities: [['p', 'Druck'], ['V', 'Volumen'], ['n', 'Stoffmenge'], ['R', 'Gaskonstante'], ['T', 'Temperatur']],
  },
  {
    id: 'hebel',
    name: 'Hebelgesetz',
    latex: 'F_1l_1 = F_2l_2',
    quantities: [['F_1', 'erste Kraft'], ['l_1', 'erster Hebelarm'], ['F_2', 'zweite Kraft'], ['l_2', 'zweiter Hebelarm']],
  },
]

// Stufe und Bausteine je Aufgabe (von der Engine nachgerechnet im Test); nur hinten anhängen
export const FORMULA_TASKS: readonly FormulaTask[] = [
  { formula: 'fadenpendel', target: 'l', level: 2, blocks: ['wurzeln'] },
  { formula: 'fadenpendel', target: 'g', level: 2, blocks: ['brueche', 'wurzeln'] },
  { formula: 'federpendel', target: 'm', level: 2, blocks: ['wurzeln'] },
  { formula: 'federpendel', target: 'D', level: 2, blocks: ['brueche', 'wurzeln'] },
  { formula: 'fallweg', target: 't', level: 1, blocks: ['potenzen'] },
  { formula: 'fallweg', target: 'g', level: 1, blocks: ['linear'] },
  { formula: 'aufprall', target: 'h', level: 1, blocks: ['wurzeln'] },
  { formula: 'aufprall', target: 'g', level: 1, blocks: ['wurzeln'] },
  { formula: 'bewegungsenergie', target: 'v', level: 1, blocks: ['potenzen'] },
  { formula: 'bewegungsenergie', target: 'm', level: 1, blocks: ['linear'] },
  { formula: 'beschleunigt', target: 'a', level: 2, blocks: ['linear'] },
  { formula: 'beschleunigt', target: 'v_0', level: 1, blocks: ['linear'] },
  { formula: 'beschleunigt', target: 't', level: 3, blocks: ['quadratisch'] },
  { formula: 'bremsweg', target: 'v', level: 1, blocks: ['potenzen'] },
  { formula: 'bremsweg', target: 'a', level: 1, blocks: ['brueche'] },
  { formula: 'linse', target: 'b', level: 2, blocks: ['brueche'] },
  { formula: 'linse', target: 'f', level: 1, blocks: ['brueche'] },
  { formula: 'parallelschaltung', target: 'R_1', level: 2, blocks: ['brueche'] },
  { formula: 'parallelschaltung', target: 'R', level: 1, blocks: ['brueche'] },
  { formula: 'leistung', target: 'U', level: 1, blocks: ['potenzen'] },
  { formula: 'leistung', target: 'R', level: 1, blocks: ['brueche'] },
  { formula: 'plattenkondensator', target: 'd', level: 1, blocks: ['brueche'] },
  { formula: 'plattenkondensator', target: '\\varepsilon_r', level: 1, blocks: ['linear'] },
  { formula: 'entladen', target: 't', level: 2, blocks: ['exp'] },
  { formula: 'entladen', target: 'R', level: 3, blocks: ['brueche', 'exp'] },
  { formula: 'aufladen', target: 't', level: 3, blocks: ['exp'] },
  { formula: 'zerfall', target: 't', level: 2, blocks: ['exp'] },
  { formula: 'zerfall', target: '\\lambda', level: 2, blocks: ['exp'] },
  { formula: 'abkuehlen', target: 't', level: 3, blocks: ['exp'] },
  { formula: 'luftdruck', target: 'h', level: 2, blocks: ['exp'] },
  { formula: 'schallpegel', target: 'I', level: 2, blocks: ['log'] },
  { formula: 'wurfweite', target: '\\alpha', level: 2, blocks: ['winkel'] },
  { formula: 'wurfweite', target: 'v', level: 2, blocks: ['potenzen'] },
  { formula: 'hangabtrieb', target: '\\alpha', level: 1, blocks: ['winkel'] },
  { formula: 'hangabtrieb', target: 'm', level: 1, blocks: ['linear'] },
  { formula: 'gravitation', target: 'r', level: 1, blocks: ['brueche', 'potenzen'] },
  { formula: 'gravitation', target: 'm_1', level: 1, blocks: ['linear'] },
  { formula: 'zentripetal', target: 'v', level: 2, blocks: ['potenzen'] },
  { formula: 'zentripetal', target: 'r', level: 1, blocks: ['brueche'] },
  { formula: 'seil', target: 'x', level: 2, blocks: ['hyperbel'] },
  { formula: 'auftrieb', target: 'V', level: 1, blocks: ['linear'] },
  { formula: 'auftrieb', target: '\\rho', level: 1, blocks: ['linear'] },
  { formula: 'fluchtgeschwindigkeit', target: 'r', level: 1, blocks: ['brueche', 'wurzeln'] },
  { formula: 'fluchtgeschwindigkeit', target: 'M', level: 2, blocks: ['wurzeln'] },
  { formula: 'schwingkreis', target: 'L', level: 3, blocks: ['brueche', 'wurzeln'] },
  { formula: 'schwingkreis', target: 'C', level: 3, blocks: ['brueche', 'wurzeln'] },
  { formula: 'gasgesetz', target: 'T', level: 1, blocks: ['linear'] },
  { formula: 'hebel', target: 'l_2', level: 1, blocks: ['linear'] },
]
