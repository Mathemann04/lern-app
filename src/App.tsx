import { useEffect } from 'react'
import { GalleryScreen } from './ui/GalleryScreen.tsx'
import { HomeScreen } from './ui/HomeScreen.tsx'
import { formatBuildTime } from './ui/buildInfo.ts'
import { useHashRoute } from './ui/useHashRoute.ts'
import { usePwa } from './ui/usePwa.ts'

export function App() {
  const pwa = usePwa()
  const route = useHashRoute()

  // Neue Seite beginnt oben. Geschweifte Klammern sind nötig: Neuere Browser geben bei
  // scrollTo einen Wert zurück, den React sonst für eine Aufräumfunktion hält.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [route])

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-8">
      <header className="py-2">
        <a href="#/" className="inline-flex items-center gap-3">
          <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="size-8" />
          <span className="text-lg font-semibold tracking-tight">Rechenweg</span>
        </a>
      </header>

      <div className="flex-1 py-8">{route === '/galerie' ? <GalleryScreen /> : <HomeScreen />}</div>

      <footer className="space-y-1 pt-6 text-center text-sm text-zinc-400">
        <p data-testid="offline-status">
          {pwa.isOfflineReady ? 'Offline nutzbar ✓' : 'Wird für die Offline-Nutzung vorbereitet …'}
        </p>
        <p>
          Version vom {formatBuildTime(__BUILD_INFO__.builtAt)} · {__BUILD_INFO__.commit}
        </p>
      </footer>

      {pwa.needRefresh && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-zinc-900 p-4 text-white shadow-lg"
        >
          <p className="flex-1">Eine neue Version ist da.</p>
          <button
            type="button"
            onClick={pwa.dismissUpdate}
            className="rounded-lg px-3 py-2 text-zinc-300 hover:text-white"
          >
            Später
          </button>
          <button
            type="button"
            onClick={pwa.applyUpdate}
            className="rounded-lg bg-white px-3 py-2 font-medium text-zinc-900"
          >
            Jetzt laden
          </button>
        </div>
      )}
    </div>
  )
}
