import { useEffect, useSyncExternalStore } from 'react'
import { useSettings } from '../state/settings.ts'

// Hell oder dunkel nach der Einstellung, bei „Automatisch" wie das Gerät. Beim Laden setzt schon
// ein kleines Skript in index.html dieselbe Klasse, damit nichts hell aufblitzt.

const DARK_QUERY = '(prefers-color-scheme: dark)'
// Farbe der Statusleiste am Handy: wie der Seitenhintergrund (--surface in index.css)
const BAR_COLOR = { light: '#ffffff', dark: '#09090b' }

function subscribe(onChange: () => void) {
  const media = window.matchMedia(DARK_QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

const deviceIsDark = () => window.matchMedia(DARK_QUERY).matches

export function useTheme() {
  const { theme } = useSettings()
  const deviceDark = useSyncExternalStore(subscribe, deviceIsDark, () => false)
  const dark = theme === 'dark' || (theme === 'system' && deviceDark)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    // MathLive (Eingabefeld und Tastatur) richtet sich nach diesem Merkmal
    document.body.setAttribute('theme', dark ? 'dark' : 'light')
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? BAR_COLOR.dark : BAR_COLOR.light)
  }, [dark])
}
