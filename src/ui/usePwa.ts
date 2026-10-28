import { useRegisterSW } from 'virtual:pwa-register/react'

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000

// Zustand der installierbaren App: offline bereit? Neue Version da?
export function usePwa() {
  const {
    offlineReady: [offlineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // Wer die App lange offen hat, soll trotzdem von neuen Versionen erfahren
      if (registration) {
        setInterval(() => void registration.update(), UPDATE_CHECK_INTERVAL_MS)
      }
    },
  })

  // Beim ersten Besuch meldet offlineReady; bei späteren Besuchen steuert der
  // Service Worker die Seite bereits
  const isOfflineReady =
    offlineReady || (typeof navigator !== 'undefined' && !!navigator.serviceWorker?.controller)

  return {
    isOfflineReady,
    needRefresh,
    applyUpdate: () => void updateServiceWorker(true),
    dismissUpdate: () => setNeedRefresh(false),
  }
}
