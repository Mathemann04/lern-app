import type { VirtualKeyboardKeycap, VirtualKeyboardLayout } from 'mathlive'

// Bildschirm-Tastatur für Ableitungen: alles bis Stufe 4 auf der ersten Seite, die
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

const ROWS: Key[][] = [
  ['x', { latex: '#@^{2}' }, { latex: '#@^{#?}' }, { latex: 'e^{#?}' }, '7', '8', '9', { latex: '\\frac{#@}{#?}' }, '[backspace]'],
  [{ label: '(', key: '(' }, { label: ')', key: ')' }, { latex: '\\sqrt{#0}' }, { latex: '\\sqrt[#?]{#0}' }, '4', '5', '6', { latex: '\\cdot' }, '[left]'],
  [fnKey('sin'), fnKey('cos'), fnKey('tan'), fnKey('ln'), '1', '2', '3', { label: '−', latex: '-' }, '[right]'],
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
  [areaKey('arsinh'), areaKey('arcosh'), areaKey('artanh'), { label: '(', key: '(' }, { label: ')', key: ')' }, { latex: '\\sqrt{#0}' }, fnKey('ln'), { latex: '\\cdot' }, '[left]'],
  [fnKey('arcsin'), fnKey('arccos'), fnKey('arctan'), fnKey('sin'), fnKey('cos'), fnKey('tan'), '+', { label: '−', latex: '-' }, '[right]'],
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
