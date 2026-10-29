import type { VirtualKeyboardKeycap, VirtualKeyboardLayout } from 'mathlive'

// Bildschirm-Tastatur für Ableitungen: alles, was in den Stufen vorkommt, auf einer Seite.
// Funktionen kommen gleich mit Klammer, damit „sin 3x" nicht mehrdeutig ist.

type Key = string | Partial<VirtualKeyboardKeycap>

const fnKey = (name: string): Key => ({
  // lange Namen etwas kleiner, damit sie auf die Taste passen
  label: name.length > 4 ? `<span style="font-size:0.8em">${name}</span>` : name,
  insert: `\\${name}\\left(#0\\right)`,
  class: 'small',
})

const ROWS: Key[][] = [
  ['x', { latex: '#@^{2}' }, { latex: '#@^{#?}' }, { latex: 'e^{#?}' }, '7', '8', '9', { latex: '\\frac{#@}{#?}' }, '[backspace]'],
  [{ label: '(', key: '(' }, { label: ')', key: ')' }, { latex: '\\sqrt{#0}' }, { latex: '\\sqrt[#?]{#0}' }, '4', '5', '6', { latex: '\\cdot' }, '[left]'],
  [fnKey('sin'), fnKey('cos'), fnKey('tan'), fnKey('ln'), '1', '2', '3', { label: '−', latex: '-' }, '[right]'],
  [
    fnKey('arctan'),
    { label: 'log<sub>a</sub>', insert: '\\log_{#?}\\left(#?\\right)', class: 'small' },
    { latex: '\\pi' },
    { label: ',', key: ',' },
    '0',
    '+',
    { label: 'Prüfen', command: 'commit', class: 'action', width: 2 },
    '[hide-keyboard]',
  ],
]

export const DERIVATIVE_KEYBOARD: VirtualKeyboardLayout = {
  id: 'ableitungen',
  label: 'Ableitungen',
  displayEditToolbar: false,
  rows: ROWS,
}
