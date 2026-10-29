import { Suspense, lazy, useEffect } from 'react'
import { type Level, randomSeed } from './engine/tasks/taskNumber.ts'
import { GalleryScreen } from './ui/GalleryScreen.tsx'
import { HomeScreen } from './ui/HomeScreen.tsx'
import { SettingsScreen } from './ui/SettingsScreen.tsx'
import { buildInfoLabel } from './ui/buildInfo.ts'
import { isLevelAvailable } from './ui/samples.ts'
import { TaskScreen } from './ui/guided/TaskScreen.tsx'
import { type PracticeMode } from './state/storage.ts'
import { type Route, parseRoute, taskHref } from './ui/routes.ts'
import { useHashRoute } from './ui/useHashRoute.ts'
import { usePwa } from './ui/usePwa.ts'

// Der freie Modus mit der Mathe-Tastatur ist groß und wird erst bei Bedarf geladen
const FreeTaskScreen = lazy(() => import('./ui/free/FreeTaskScreen.tsx'))

export function App() {
  const pwa = usePwa()
  const path = useHashRoute()
  const route = parseRoute(path)

  // Neue Seite beginnt oben. Geschweifte Klammern sind nötig: Neuere Browser geben bei
  // scrollTo einen Wert zurück, den React sonst für eine Aufräumfunktion hält.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [path])

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-8">
      <header className="flex items-center justify-between py-2">
        <a href="#/" className="inline-flex items-center gap-3">
          <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="size-8" />
          <span className="text-lg font-semibold tracking-tight">Rechenweg</span>
        </a>
        <a
          href="#/einstellungen"
          aria-label="Einstellungen"
          className="-mr-2 rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
        >
          <svg aria-hidden viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
          </svg>
        </a>
      </header>

      <div className="flex-1 py-8">
        <Page route={route} />
      </div>

      <footer className="space-y-1 pt-6 text-center text-sm text-zinc-400">
        <p data-testid="offline-status">
          {pwa.isOfflineReady ? 'Offline nutzbar ✓' : 'Wird für die Offline-Nutzung vorbereitet …'}
        </p>
        <p>{buildInfoLabel()}</p>
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

function Page({ route }: { route: Route }) {
  switch (route.page) {
    case 'gallery':
      return <GalleryScreen />
    case 'settings':
      return <SettingsScreen />
    case 'practice':
      return <PracticePage mode={route.mode} level={route.level} seed={route.seed} />
    case 'home':
      return <HomeScreen />
  }
}

function PracticePage({ mode, level, seed }: { mode: PracticeMode; level: Level; seed: number | null }) {
  // Ohne Nummer: neue Aufgabe würfeln und ihre Nummer in die Adresse schreiben,
  // damit Neuladen dieselbe Aufgabe zeigt
  useEffect(() => {
    if (seed === null) window.location.replace(taskHref({ level, seed: randomSeed() }, mode))
  }, [mode, level, seed])
  if (seed === null) return null
  if (!isLevelAvailable(level)) {
    return (
      <main className="space-y-4">
        <h1 className="text-2xl font-semibold">Stufe {level} kommt bald</h1>
        <p className="text-zinc-600">Bisher gibt es die Stufen 1 bis 4. Stufe 5 folgt bald.</p>
        <a href="#/" className="inline-block rounded-xl border border-zinc-300 px-4 py-2 font-medium hover:bg-zinc-50">
          Zur Startseite
        </a>
      </main>
    )
  }
  if (mode === 'free') {
    return (
      <Suspense fallback={<p className="text-zinc-500">Mathe-Tastatur wird geladen …</p>}>
        <FreeTaskScreen key={`${level}-${seed}`} taskRef={{ level, seed }} />
      </Suspense>
    )
  }
  return <TaskScreen key={`${level}-${seed}`} taskRef={{ level, seed }} />
}
