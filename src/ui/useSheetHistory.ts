import { useEffect, useRef, useState } from 'react'

// Fenster über einer Seite (Lernkarten, Periodensystem, Formelsammlung): Die Zurück-Taste des Handys schließt das
// Fenster, statt die Seite zu verlassen.
export function useSheetHistory() {
  const [open, setOpen] = useState(false)
  // Eintrag im Verlauf, den das Öffnen angelegt hat (gleiche Adresse, nur fürs Zurück)
  const pushed = useRef(false)

  useEffect(() => {
    if (!open) return
    const onBack = () => {
      pushed.current = false
      setOpen(false)
    }
    window.addEventListener('popstate', onBack)
    return () => window.removeEventListener('popstate', onBack)
  }, [open])

  const show = () => {
    window.history.pushState({ sheet: true }, '')
    pushed.current = true
    setOpen(true)
  }
  const close = () => {
    if (pushed.current) {
      pushed.current = false
      window.history.back()
    }
    setOpen(false)
  }
  return { open, show, close }
}
