import { levelSummary, useProgress } from '../state/progress.ts'
import { useSettings } from '../state/settings.ts'
import { AreaIcon } from './AreaIcon.tsx'
import { type Area, DERIVATIVES, SUBJECTS, courseById, isAreaAvailable } from './catalog.ts'
import { RecentDots } from './RecentDots.tsx'
import { areaHref, courseHref, practiceHref } from './routes.ts'
import { derivativeLevels, isLevelAvailable } from './samples.ts'

// Startseite: „Weitermachen" und darunter die Fächer mit ihren Gebieten (Aufbau in catalog.ts)
export function HomeScreen() {
  return (
    <main className="space-y-10">
      <section className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-balance">Mathe Schritt für Schritt selbst lösen</h1>
        <p className="text-zinc-600 text-pretty">
          Du lernst, indem du Aufgaben selbst rechnest: geführt mit Auswahl-Antworten oder frei mit eigener Eingabe.
        </p>
      </section>

      <ContinueCard />

      {SUBJECTS.map((subject) => (
        <section key={subject.id} aria-labelledby={`subject-${subject.id}`} className="space-y-3">
          <h2 id={`subject-${subject.id}`} className="text-xl font-semibold">
            {subject.title}
          </h2>
          <ul className="space-y-3">
            {subject.areas.map((area) => (
              <li key={area.id}>
                <AreaTile area={area} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  )
}

// Zuletzt gewähltes Thema mit Stufe und Art, ein Tippen bis zur nächsten Aufgabe
function ContinueCard() {
  const { derivativeLevel, practiceMode } = useSettings()
  const progress = useProgress()
  const level = isLevelAvailable(derivativeLevel) ? derivativeLevel : 1
  const levelTitle = derivativeLevels.find((l) => l.level === level)!.title
  const { area, course } = courseById(DERIVATIVES)!
  const { solved, recent, recentClean } = levelSummary(progress, level)
  const started = progress.attempts.length > 0
  return (
    <section aria-labelledby="continue" data-tone={area.tone} className="space-y-4 rounded-2xl bg-accent-50 p-5">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1 space-y-1">
          <h2 id="continue" className="text-sm font-semibold tracking-wide text-accent-700 uppercase">
            {started ? 'Weitermachen' : 'Los geht’s'}
          </h2>
          <p className="text-2xl font-semibold tracking-tight">{course.title}</p>
          <p className="text-zinc-700">
            Stufe {level}: {levelTitle}
          </p>
        </div>
        <AreaIcon kind={course.icon} className="size-16 shrink-0" />
      </div>
      {solved > 0 && (
        <div className="space-y-1.5">
          <RecentDots recent={recent} />
          <p className="text-sm text-zinc-600">
            {solved} gelöst · zuletzt {recentClean} von {recent.length} ohne Fehler
          </p>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <a
          href={practiceHref(level, practiceMode)}
          className="rounded-xl bg-accent-700 px-5 py-3 text-lg font-medium text-on-accent hover:bg-accent-800"
        >
          {started ? 'Weiter üben' : 'Erste Aufgabe'} · {practiceMode === 'free' ? 'frei' : 'geführt'}
        </a>
        <a href={courseHref(DERIVATIVES)} className="-mx-2 rounded-lg px-2 py-3 font-medium text-accent-700 hover:bg-accent-100">
          Stufe oder Art ändern
        </a>
      </div>
    </section>
  )
}

function AreaTile({ area }: { area: Area }) {
  const available = isAreaAvailable(area)
  const body = (
    <>
      <AreaIcon kind={area.icon} className={`size-14 shrink-0 ${available ? '' : 'opacity-50'}`} />
      <span className="min-w-0 flex-1">
        <span className={`block text-lg font-semibold ${available ? '' : 'text-zinc-500'}`}>{area.title}</span>
        <span className={`block text-sm text-pretty ${available ? 'text-zinc-600' : 'text-zinc-500'}`}>{area.description}</span>
        {!available && (
          <span className="mt-2 inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">kommt bald</span>
        )}
      </span>
    </>
  )
  if (!available) {
    return (
      <div data-tone={area.tone} className="flex items-center gap-4 rounded-2xl border border-dashed border-zinc-300 px-4 py-3">
        {body}
      </div>
    )
  }
  return (
    <a
      href={areaHref(area.id)}
      data-tone={area.tone}
      className="flex items-center gap-4 rounded-2xl border border-zinc-200 px-4 py-3 transition-colors hover:border-accent-600 hover:bg-accent-50"
    >
      {body}
      <span aria-hidden className="text-accent-700">
        →
      </span>
    </a>
  )
}
