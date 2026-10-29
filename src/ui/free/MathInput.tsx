import { MathfieldElement } from 'mathlive'
import { useEffect, useRef } from 'react'
import { DERIVATIVE_KEYBOARD } from './keyboard.ts'

// Eingabefeld mit Mathe-Tastatur (MathLive). Die Schriften sind dieselben wie bei KaTeX und
// kommen schon mit der App, deshalb lädt MathLive keine eigenen (wichtig für offline).
MathfieldElement.fontsDirectory = null
MathfieldElement.soundsDirectory = null
MathfieldElement.decimalSeparator = ','

type Props = {
  label: string
  readOnly: boolean
  onInput: (latex: string) => void
  // Enter oder „Prüfen" auf der Bildschirm-Tastatur
  onSubmit: (latex: string) => void
  // Höhe der Bildschirm-Tastatur, damit die Seite darüber Platz lässt
  onKeyboardHeight: (height: number) => void
}

export function MathInput({ label, readOnly, onInput, onSubmit, onKeyboardHeight }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const fieldRef = useRef<MathfieldElement | null>(null)
  // Aktuelle Rückruffunktionen, ohne das Feld neu anzulegen
  const callbacks = useRef({ onInput, onSubmit, onKeyboardHeight })
  useEffect(() => {
    callbacks.current = { onInput, onSubmit, onKeyboardHeight }
  })

  const readOnlyRef = useRef(readOnly)

  useEffect(() => {
    const field = new MathfieldElement()
    field.setAttribute('aria-label', label)
    field.className = 'block w-full text-2xl'
    // Nur echte Änderungen melden: Nach Enter schickt MathLive noch ein „input" ohne neuen Inhalt
    let lastValue = ''
    field.addEventListener('input', () => {
      if (field.value === lastValue) return
      lastValue = field.value
      callbacks.current.onInput(field.value)
    })
    field.addEventListener('beforeinput', (event) => {
      if (event.inputType === 'insertLineBreak') {
        event.preventDefault()
        callbacks.current.onSubmit(field.value)
      }
    })
    // Einstellungen erst, wenn MathLive das Feld aufgebaut hat (vorher meldet es einen Fehler)
    field.addEventListener(
      'mount',
      () => {
        field.mathVirtualKeyboardPolicy = 'auto'
        field.menuItems = []
        field.smartMode = false
        field.readOnly = readOnlyRef.current
        field.dataset.ready = 'true'
        // Am Laptop gleich lostippen; am Handy erst beim Antippen, sonst verdeckt die Tastatur die Aufgabe
        if (window.matchMedia('(pointer: fine)').matches) field.focus()
      },
      { once: true },
    )
    hostRef.current!.append(field)
    fieldRef.current = field

    const keyboard = window.mathVirtualKeyboard
    keyboard.layouts = [DERIVATIVE_KEYBOARD]
    keyboard.editToolbar = 'none'
    const onGeometry = () => callbacks.current.onKeyboardHeight(keyboard.visible ? keyboard.boundingRect.height : 0)
    keyboard.addEventListener('geometrychange', onGeometry)
    keyboard.addEventListener('virtual-keyboard-toggle', onGeometry)

    return () => {
      keyboard.removeEventListener('geometrychange', onGeometry)
      keyboard.removeEventListener('virtual-keyboard-toggle', onGeometry)
      keyboard.hide()
      field.remove()
    }
  }, [label])

  useEffect(() => {
    readOnlyRef.current = readOnly
    const field = fieldRef.current
    if (field?.dataset.ready) field.readOnly = readOnly
  }, [readOnly])

  return <div ref={hostRef} className="min-w-0 flex-1" />
}
