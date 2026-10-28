import { useSyncExternalStore } from 'react'

// Seiten der App über den Teil der Adresse nach „#", z. B. …/lern-app/#/galerie.
// Funktioniert auf jedem Hosting und später in der App-Version ohne Server-Einstellungen.

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

const currentPath = () => window.location.hash.replace(/^#/, '') || '/'

export function useHashRoute(): string {
  return useSyncExternalStore(subscribe, currentPath, () => '/')
}
