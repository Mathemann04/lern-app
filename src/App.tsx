import { Suspense, lazy, useEffect } from 'react'
import { createRng } from './engine/random/rng.ts'
import { findTaskWithError } from './engine/tasks/focus.ts'
import { type Level, randomSeed } from './engine/tasks/taskNumber.ts'
import { GalleryScreen } from './ui/GalleryScreen.tsx'
import { HomeScreen } from './ui/HomeScreen.tsx'
import { ProgressScreen } from './ui/ProgressScreen.tsx'
import { SettingsScreen } from './ui/SettingsScreen.tsx'
import { CardScreen, CardTopicScreen, CardsScreen } from './ui/cards/CardsScreen.tsx'
import { buildInfoLabel } from './ui/buildInfo.ts'
import { derivativeLevels, isLevelAvailable } from './ui/samples.ts'
import { TaskScreen } from './ui/guided/TaskScreen.tsx'
import { type PracticeMode } from './state/storage.ts'
import { type Route, parseRoute, sectionOf, taskHref } from './ui/routes.ts'
import { MainNav } from './ui/MainNav.tsx'
import { useHashRoute } from './ui/useHashRoute.ts'
import { usePwa } from './ui/usePwa.ts'

// Der freie Modus mit der Mathe-Tastatur ist groß und wird erst bei Bedarf geladen
const FreeTaskScreen = lazy(() => import('./ui/free/FreeTaskScreen.tsx'))

export function App() {
  const pwa = usePwa()
  const path = useHashRoute()
  const route = parseRoute(path)
  // In Aufgaben kein Hauptmenü: dort beendet das X die Aufgabe
  const showNav = route.page !== 'practice'

  // Neue Seite beginnt oben. Geschweifte Klammern sind nötig: Neuere Browser geben bei
  // scrollTo einen Wert zurück, den React sonst für eine Aufräumfunktion hält.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [path])

  return (
    <div
      className={`mx-auto flex min-h-dvh max-w-2xl flex-col px-5 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-8 md:pb-5 ${
        // Platz für die Leiste unten am Handy
        showNav ? 'pb-[calc(5rem+env(safe-area-inset-bottom))]' : 'pb-[max(1.25rem,env(safe-area-inset-bottom))]'
      }`}
    >
      <header className="flex items-center justify-between py-2">
        <a href="#/" className="inline-flex items-center gap-3">
          <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="size-8" />
          <span className="text-lg font-semibold tracking-tight">Rechenweg</span>
        </a>
        {showNav && <MainNav active={sectionOf(route)} />}
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
          className={`fixed inset-x-4 z-20 mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-zinc-900 p-4 text-white shadow-lg md:bottom-4 ${
            showNav ? 'bottom-[calc(4.5rem+env(safe-area-inset-bottom))]' : 'bottom-[max(1rem,env(safe-area-inset-bottom))]'
          }`}
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
    case 'progress':
      return <ProgressScreen />
    case 'cards':
      return <CardsScreen />
    case 'cardTopic':
      return <CardTopicScreen key={route.topic} topic={route.topic} />
    case 'card':
      return <CardScreen key={route.id} id={route.id} />
    case 'practice':
      return <PracticePage mode={route.mode} level={route.level} seed={route.seed} focus={route.focus} />
    case 'home':
      return <HomeScreen />
  }
}

// Stufen für gezieltes Üben: zuerst die gewählte, dann die nächstgelegenen
function levelsNear(level: Level): Level[] {
  return derivativeLevels
    .filter((l) => l.available)
    .map((l) => l.level)
    .sort((a, b) => Math.abs(a - level) - Math.abs(b - level) || a - b)
}

function newTask(mode: PracticeMode, level: Level, focus: string | null): string {
  // Gezielt üben: eine Aufgabe, in der genau dieser Fehler passieren kann
  const found = focus ? findTaskWithError(focus, levelsNear(level), createRng(String(Math.random()))) : null
  return taskHref(found ?? { level, seed: randomSeed() }, mode, found ? focus : null)
}

type PracticeProps = { mode: PracticeMode; level: Level; seed: number | null; focus: string | null }

function PracticePage({ mode, level, seed, focus }: PracticeProps) {
  // Ohne Nummer: neue Aufgabe würfeln und ihre Nummer in die Adresse schreiben,
  // damit Neuladen dieselbe Aufgabe zeigt
  useEffect(() => {
    if (seed === null) window.location.replace(newTask(mode, level, focus))
  }, [mode, level, seed, focus])
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
  const key = `${level}-${seed}-${focus ?? ''}`
  if (mode === 'free') {
    return (
      <Suspense fallback={<p className="text-zinc-500">Mathe-Tastatur wird geladen …</p>}>
        <FreeTaskScreen key={key} taskRef={{ level, seed }} focus={focus} />
      </Suspense>
    )
  }
  return <TaskScreen key={key} taskRef={{ level, seed }} focus={focus} />
}
