import { type ReactNode, useLayoutEffect, useRef } from 'react'

// Setzt den Inhalt kleiner, bis er in die Breite passt (höchstens bis `min` der Grundgröße).
// Für lange Formeln am Handy, z. B. eingesetzte Quotientenregeln in Stufe 4. Passt es auch
// dann nicht, bleibt seitliches Wischen. Der Inhalt sollte Größen in em haben, nicht in rem.
export function FitWidth({ children, className = '', min = 0.7 }: { children: ReactNode; className?: string; min?: number }) {
  const ref = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const fit = () => {
      element.style.fontSize = ''
      const base = Number.parseFloat(getComputedStyle(element).fontSize)
      let size = base
      while (element.scrollWidth > element.clientWidth + 1 && size > base * min) {
        size -= base * 0.05
        element.style.fontSize = `${size}px`
      }
    }
    fit()
    // Breiten ändern sich, wenn Schriften nachladen oder das Handy gedreht wird
    void document.fonts?.ready.then(fit)
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  })

  return (
    <span ref={ref} className={`block overflow-x-auto ${className}`}>
      {children}
    </span>
  )
}
