import { Suspense, lazy, useEffect } from 'react'
import { AreaScreen } from './ui/AreaScreen.tsx'
import { HomeScreen } from './ui/HomeScreen.tsx'
import { type Tone, areaById, courseById, courseOfCards } from './ui/catalog.ts'
import { loadCourseEngine } from './ui/courseEngines.ts'
import { SettingsScreen } from './ui/SettingsScreen.tsx'
import { buildInfoLabel } from './ui/buildInfo.ts'
import { type Route, parseRoute, sectionOf } from './ui/routes.ts'
import { MainNav } from './ui/MainNav.tsx'
import { useHashRoute } from './ui/useHashRoute.ts'
import { getAppState } from './state/store.ts'
import { usePwa } from './ui/usePwa.ts'
import { useTheme } from './ui/useTheme.ts'

// Seiten mit Formeln oder Mathe-Engine werden erst bei Bedarf geladen: Die Startseite kommt ohne
// beides aus und erscheint so schneller. (Offline liegen alle Teile ohnehin schon auf dem Gerät.)
const CourseScreen = lazy(() => loadCourse().then((m) => ({ default: m.CourseScreen })))
const ProgressScreen = lazy(() => import('./ui/ProgressScreen.tsx').then((m) => ({ default: m.ProgressScreen })))
const CardsPage = lazy(() => import('./ui/cards/CardsScreen.tsx').then((m) => ({ default: m.CardsPage })))
const GalleryScreen = lazy(() => import('./ui/GalleryScreen.tsx').then((m) => ({ default: m.GalleryScreen })))
const loadPractice = () => import('./ui/PracticePage.tsx')
const loadCourse = () => import('./ui/CourseScreen.tsx')
const PracticePage = lazy(loadPractice)

export function App() {
  const pwa = usePwa()
  useTheme()
  const path = useHashRoute()
  const route = parseRoute(path)
  // In Aufgaben kein Hauptmenü: dort beendet das X die Aufgabe
  const showNav = route.page !== 'practice'

  // Kurz nach dem Start schon die Teile für Aufgaben holen (auch die Engine des zuletzt geübten
  // Themas), damit „Weiter üben" sofort reagiert
  useEffect(() => {
    const timer = setTimeout(() => {
      void loadPractice()
      void loadCourse()
      const { lastCourse } = getAppState().settings
      if (courseById(lastCourse)) void loadCourseEngine(lastCourse).catch(() => {})
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

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
        <a href="#/" className="-my-1.5 inline-flex items-center gap-3 py-1.5">
          <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="size-8" />
          <span className="text-lg font-semibold tracking-tight">Rechenweg</span>
        </a>
        {showNav && <MainNav active={sectionOf(route)} />}
      </header>

      <div key={path} data-tone={toneOf(route)} className="animate-page-in flex-1 py-8">
        {/* Hinweis erst nach einer Weile: Meist ist der Teil sofort da */}
        <Suspense fallback={<p className="animate-late text-zinc-500">Wird geladen …</p>}>
          <Page route={route} />
        </Suspense>
      </div>

      <footer className="space-y-1 pt-6 text-center text-sm text-zinc-500">
        <p data-testid="offline-status">
          {pwa.isOfflineReady ? 'Offline nutzbar ✓' : 'Wird für die Offline-Nutzung vorbereitet …'}
        </p>
        <p>{buildInfoLabel()}</p>
      </footer>

      {pwa.needRefresh && (
        <div
          role="status"
          className={`fixed inset-x-4 z-20 mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-zinc-900 p-4 text-zinc-50 shadow-lg md:bottom-4 ${
            showNav ? 'bottom-[calc(4.5rem+env(safe-area-inset-bottom))]' : 'bottom-[max(1rem,env(safe-area-inset-bottom))]'
          }`}
        >
          <p className="flex-1">Eine neue Version ist da.</p>
          <button
            type="button"
            onClick={pwa.dismissUpdate}
            className="rounded-lg px-3 py-2 text-zinc-300 hover:text-zinc-50"
          >
            Später
          </button>
          <button
            type="button"
            onClick={pwa.applyUpdate}
            className="rounded-lg bg-surface px-3 py-2 font-medium text-zinc-900"
          >
            Jetzt laden
          </button>
        </div>
      )}
    </div>
  )
}

// Seiten, die zu einem Gebiet gehören, zeigen sich in dessen Farbe; die übrigen im Blaugrün der App
function toneOf(route: Route): Tone | undefined {
  switch (route.page) {
    case 'area':
      return areaById(route.id)?.area.tone
    case 'course':
      return courseById(route.id)?.area.tone
    case 'practice':
      return courseById(route.course)?.area.tone
    case 'cards':
      return route.folder ? courseOfCards(route.folder)?.area.tone : undefined
    default:
      return undefined
  }
}

function Page({ route }: { route: Route }) {
  switch (route.page) {
    case 'gallery':
      return <GalleryScreen />
    case 'settings':
      return <SettingsScreen />
    case 'progress':
      return <ProgressScreen />
    case 'area':
      return <AreaScreen key={route.id} id={route.id} />
    case 'course':
      return <CourseScreen key={route.id} id={route.id} />
    case 'cards':
      return <CardsPage folder={route.folder} card={route.card} />
    case 'practice':
      return <PracticePage course={route.course} mode={route.mode} level={route.level} seed={route.seed} focus={route.focus} />
    case 'home':
      return <HomeScreen />
  }
}
