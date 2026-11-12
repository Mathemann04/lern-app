import type { VirtualKeyboardKeycap, VirtualKeyboardLayout } from 'mathlive'
import type { KeyboardSpec } from '../../engine/check/freeTask.ts'

// Bildschirm-Tastaturen. Für Ableitungen: alles bis Stufe 4 auf der ersten Seite, die
// Funktionen der Stufe 5 (Hyperbel-, Arkus- und Areafunktionen) auf einer zweiten.
// Funktionen kommen gleich mit Klammer, damit „sin 3x" nicht mehrdeutig ist.
// y braucht es beim impliziten Ableiten (Stufe 5): y' wird in x und y angegeben.

type Key = string | Partial<VirtualKeyboardKeycap>

const fnKey = (name: string): Key => ({
  // lange Namen etwas kleiner, damit sie auf die Taste passen
  label: name.length > 4 ? `<span style="font-size:0.8em">${name}</span>` : name,
  insert: `\\${name}\\left(#0\\right)`,
  class: 'small',
})

// Areafunktionen haben keinen eigenen LaTeX-Befehl
const areaKey = (name: string): Key => ({
  label: `<span style="font-size:0.8em">${name}</span>`,
  insert: `\\operatorname{${name}}\\left(#0\\right)`,
  class: 'small',
})

// Pfeiltasten so breit wie Löschen und „Tastatur zu" (1,5), damit alle Zeilen gleich lang sind und
// die Spalten untereinander stehen
const LEFT: Key = { label: '[left]', width: 1.5 }
const RIGHT: Key = { label: '[right]', width: 1.5 }

const ROWS: Key[][] = [
  ['x', { latex: '#@^{2}' }, { latex: '#@^{#?}' }, { latex: 'e^{#?}' }, '7', '8', '9', { latex: '\\frac{#@}{#?}' }, '[backspace]'],
  [{ label: '(', key: '(' }, { label: ')', key: ')' }, { latex: '\\sqrt{#0}' }, { latex: '\\sqrt[#?]{#0}' }, '4', '5', '6', { latex: '\\cdot' }, LEFT],
  [fnKey('sin'), fnKey('cos'), fnKey('tan'), fnKey('ln'), '1', '2', '3', { label: '−', latex: '-' }, RIGHT],
  [
    fnKey('arctan'),
    { label: 'log<sub>a</sub>', insert: '\\log_{#?}\\left(#?\\right)', class: 'small' },
    'y',
    { label: ',', key: ',' },
    '0',
    '+',
    { label: 'Prüfen', command: 'commit', class: 'action', width: 2 },
    '[hide-keyboard]',
  ],
]

const MORE_ROWS: Key[][] = [
  [fnKey('sinh'), fnKey('cosh'), fnKey('tanh'), 'x', { latex: '#@^{2}' }, { latex: '#@^{#?}' }, { latex: 'e^{#?}' }, { latex: '\\frac{#@}{#?}' }, '[backspace]'],
  [areaKey('arsinh'), areaKey('arcosh'), areaKey('artanh'), { label: '(', key: '(' }, { label: ')', key: ')' }, { latex: '\\sqrt{#0}' }, fnKey('ln'), { latex: '\\cdot' }, LEFT],
  [fnKey('arcsin'), fnKey('arccos'), fnKey('arctan'), fnKey('sin'), fnKey('cos'), fnKey('tan'), '+', { label: '−', latex: '-' }, RIGHT],
  ['1', '2', '3', '4', '5', '0', { label: 'Prüfen', command: 'commit', class: 'action', width: 2 }, '[hide-keyboard]'],
]

export const DERIVATIVE_KEYBOARD: VirtualKeyboardLayout = {
  id: 'ableitungen',
  label: 'Standard',
  displayEditToolbar: false,
  rows: ROWS,
}

export const MORE_FUNCTIONS_KEYBOARD: VirtualKeyboardLayout = {
  id: 'mehr-funktionen',
  label: 'Mehr Funktionen',
  displayEditToolbar: false,
  rows: MORE_ROWS,
}

// Am Laptop getippt: Die Areafunktionen kennt MathLive nicht von selbst
export const AREA_SHORTCUTS: Record<string, string> = {
  arsinh: '\\operatorname{arsinh}',
  arcosh: '\\operatorname{arcosh}',
  artanh: '\\operatorname{artanh}',
}

// --- Brüche ---

// Leere Taste, damit die Spalten der Ziffern an derselben Stelle bleiben
const GAP: Key = { class: 'separator', width: 1 }

// Linker Block der Tastatur: Gruppen von Tasten der Reihe nach, je Zeile vier Tasten; eine Gruppe
// (z. B. die beiden Klammern) bleibt in einer Zeile zusammen
function flowKeys(groups: readonly Key[][]): Key[][] {
  const rows: Key[][] = [[]]
  for (const group of groups) {
    if (group.length === 0) continue
    if (rows.at(-1)!.length + group.length > 4) rows.push([])
    rows.at(-1)!.push(...group)
  }
  return rows
}

// Vier Zeilen: links der Block aus flowKeys, rechts Ziffern, Rechenzeichen und „Prüfen" wie beim Ableiten
function withNumberPad(id: string, label: string, left: Key[][]): VirtualKeyboardLayout {
  const leftRow = (row: number) => [0, 1, 2, 3].map((column) => left[row]?.[column] ?? GAP)
  return {
    id,
    label,
    displayEditToolbar: false,
    rows: [
      [...leftRow(0), '7', '8', '9', { latex: '\\frac{#@}{#?}' }, '[backspace]'],
      [...leftRow(1), '4', '5', '6', { latex: '\\cdot' }, LEFT],
      [...leftRow(2), '1', '2', '3', { label: '−', latex: '-' }, RIGHT],
      [...leftRow(3), '0', '+', { label: 'Prüfen', command: 'commit', class: 'action', width: 2 }, '[hide-keyboard]'],
    ],
  }
}

const POWERS: Key[] = [{ latex: '#@^{2}' }, { latex: '#@^{#?}' }]
const BRACKETS: Key[] = [{ label: '(', key: '(' }, { label: ')', key: ')' }]
const ROOT: Key = { latex: '\\sqrt{#0}' }
// imaginäre Einheit, aufrecht wie im Lehrbuch
const IMAG: Key = { latex: '\\mathrm{i}', label: '<i>i</i>' }

// Bildschirm-Tastatur für Brüche: links die Buchstaben der Aufgabe, Hochzahlen und Klammern (bei
// Bausteinen auch e^x, ln, sin, cos, tan, bei Hyperbelfunktionen e^x, sinh, cosh, tanh, bei Wurzeln √,
// bei komplexen Zahlen i)
export function fractionKeyboard(letters: readonly string[], blocks: boolean, root = false, imag = false, hyperbolic = false): VirtualKeyboardLayout {
  return withNumberPad(
    'brueche',
    'Brüche',
    flowKeys([
      imag ? [IMAG] : [],
      ...letters.map((l) => [l]),
      letters.length > 0 || blocks || imag ? POWERS : [],
      BRACKETS,
      hyperbolic ? [{ latex: 'e^{#?}' }] : blocks ? [{ latex: 'e^{#?}' }, fnKey('ln')] : [],
      hyperbolic ? [fnKey('sinh'), fnKey('cosh'), fnKey('tanh')] : blocks ? [fnKey('sin'), fnKey('cos'), fnKey('tan')] : [],
      root ? [ROOT] : [],
    ]),
  )
}

// --- Umstellen ---

// Logarithmus zu einer Basis: \log_{□}(□)
const LOG_KEY: Key = { label: 'log<sub>a</sub>', insert: '\\log_{#?}\\left(#?\\right)', class: 'small' }

// Bildschirm-Tastatur fürs Umstellen: links der Reihe nach die Buchstaben der Aufgabe (oft fünf oder
// sechs), Hochzahlen, Klammern, bei Wurzeln √, bei e-Funktion und Logarithmus (Stufe 4) e^□, ln und log_a,
// mit \pi im Ergebnis (Stufe 5, Winkel komplexer Zahlen) π
export function rearrangeKeyboard(letters: readonly string[], root: boolean, exp = false, pi = false): VirtualKeyboardLayout {
  return withNumberPad(
    'umstellen',
    'Umstellen',
    flowKeys([
      ...letters.map((l) => [l]),
      POWERS,
      BRACKETS,
      root ? [ROOT] : [],
      exp ? [{ latex: 'e^{#?}' }, fnKey('ln'), LOG_KEY] : [],
      pi ? [{ latex: '\\pi' }] : [],
    ]),
  )
}

// Zweite Seite fürs Umstellen mit Winkel-, Hyperbel- und Umkehrfunktionen (Stufe 4, Teil 6b)
export const REARRANGE_FUNCTIONS_KEYBOARD: VirtualKeyboardLayout = withNumberPad('umstellen-funktionen', 'Funktionen', [
  [fnKey('sin'), fnKey('cos'), fnKey('tan'), fnKey('ln')],
  [fnKey('arcsin'), fnKey('arccos'), fnKey('arctan'), { latex: 'e^{#?}' }],
  [fnKey('sinh'), fnKey('cosh'), fnKey('tanh'), ROOT],
  [areaKey('arsinh'), areaKey('arcosh'), areaKey('artanh'), LOG_KEY],
])

// --- Vektoren (M7) ---

// Einträge eines Vektors oder Punkts: Zahlen, Brüche, Wurzeln, Klammern, Komma (Kommazahlen), Hochzahl 2
export const VECTOR_KEYBOARD: VirtualKeyboardLayout = withNumberPad(
  'vektoren',
  'Vektoren',
  flowKeys([[{ label: ',', key: ',' }, ROOT], BRACKETS, [{ latex: '#@^{2}' }]]),
)

// Seiten der Tastatur je Thema
export function keyboardLayouts(spec: KeyboardSpec): VirtualKeyboardLayout[] {
  switch (spec.kind) {
    case 'derivative':
      return [DERIVATIVE_KEYBOARD, MORE_FUNCTIONS_KEYBOARD]
    case 'fraction':
      return [fractionKeyboard(spec.letters, spec.blocks, spec.root, spec.imag, spec.hyperbolic)]
    case 'rearrange': {
      const main = rearrangeKeyboard(spec.letters, spec.root, spec.exp, spec.pi)
      return spec.trig ? [main, REARRANGE_FUNCTIONS_KEYBOARD] : [main]
    }
    case 'vector':
      return [VECTOR_KEYBOARD]
  }
}
