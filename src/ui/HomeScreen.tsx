import { Fragment } from 'react'
import { useMockSession } from '../state/mockExam.ts'
import { SUGGEST_WINDOW, levelSummary, useProgress } from '../state/progress.ts'
import { useSettings } from '../state/settings.ts'
import type { Progress, Settings } from '../state/storage.ts'
import { AreaIcon } from './AreaIcon.tsx'
import {
  AVAILABLE_COURSES,
  type Area,
  SUBJECTS,
  type Subject,
  courseById,
  isAreaAvailable,
  isCourseAvailable,
  isMixAvailable,
  levelName,
  playableLevel,
  subjectById,
  subjectLevelName,
} from './catalog.ts'
import { RecentDots } from './RecentDots.tsx'
import { areaHref, courseHref, mixHref, mixPracticeHref, mockHref, practiceHref } from './routes.ts'
import { courseSummary, isSelectionPlayable, joinTitles, levelPartCount, mixBlockedHint, mixChoiceOf, mixedCourses } from './selection.ts'

// Startseite: „Weitermachen" und darunter die Fächer mit ihren Gebieten (Aufbau in catalog.ts)
export function HomeScreen() {
  return (
    <main className="space-y-10">
      <section className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-balance">Schritt für Schritt selbst lösen</h1>
        <p className="text-zinc-600 text-pretty">
          Du lernst, indem du Aufgaben selbst löst: geführt mit Auswahl-Antworten oder frei mit eigener Eingabe.
        </p>
      </section>

      <ContinueCard />

      {SUBJECTS.map((subject) => (
        <section key={subject.id} aria-labelledby={`subject-${subject.id}`} className="space-y-3">
          <h2 id={`subject-${subject.id}`} className="text-xl font-semibold">
            {subject.title}
          </h2>
          <ul className="space-y-3">
            {subject.areas.map((area, i) => (
              <Fragment key={area.id}>
                <li>
                  <AreaTile area={area} />
                </li>
                {/* „Themen mischen" gleich unter dem letzten Gebiet, das man schon üben kann */}
                {i === lastPlayableArea(subject) && isMixAvailable(subject) && (
                  <li>
                    <MixTile subject={subject} />
                  </li>
                )}
                {/* „Probeklausur" gleich darunter */}
                {i === lastPlayableArea(subject) && subject.mock && (
                  <li>
                    <MockTile subject={subject} />
                  </li>
                )}
              </Fragment>
            ))}
          </ul>
        </section>
      ))}
    </main>
  )
}

// Zuletzt geübtes Thema mit Stufe und Art, ein Tippen bis zur nächsten Aufgabe; zuletzt gemischt
// geübt: die Mischung. Gibt es zu den angekreuzten Unterthemen in der Stufe nichts (auf der Themenseite
// ist „Üben" dann gesperrt), führt der Knopf zur Auswahl.
function ContinueCard() {
  const settings = useSettings()
  const progress = useProgress()
  const mix = settings.lastMix ? subjectById(settings.lastMix) : undefined
  if (mix && isMixAvailable(mix)) return <MixContinueCard subject={mix} settings={settings} progress={progress} />
  const { levels, lastCourse, practiceMode: chosenMode } = settings
  const found = courseById(lastCourse)
  const { area, course } = found && isCourseAvailable(found.course) ? found : courseById(AVAILABLE_COURSES[0].id)!
  const level = playableLevel(course, levels[course.id])
  const levelTitle = course.levels.find((l) => l.level === level)!.title
  const practiceMode = course.free ? chosenMode : 'guided'
  const { solved, recent, recentClean } = levelSummary(progress, course.id, level)
  const started = progress.attempts.length > 0
  const playable = isSelectionPlayable(course, settings, level)
  const partCount = levelPartCount(course, settings, level)
  return (
    <section aria-labelledby="continue" data-tone={area.tone} className="space-y-4 rounded-2xl bg-accent-50 p-5">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1 space-y-1">
          <h2 id="continue" className="text-sm font-semibold tracking-wide text-accent-700 uppercase">
            {started ? 'Weitermachen' : 'Los geht’s'}
          </h2>
          <p className="text-2xl font-semibold tracking-tight">{course.title}</p>
          <p className="text-zinc-700">
            {levelName(course.id, level)}: {levelTitle}
          </p>
          {partCount && (
            <p className="text-sm text-pretty text-zinc-600">
              {playable
                ? `${partCount.checked} von ${partCount.total} Unterthemen angekreuzt`
                : `Kreuze mindestens ein Unterthema an, das es in ${levelName(course.id, level)} gibt.`}
            </p>
          )}
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
        {playable ? (
          <>
            <a
              href={practiceHref(course.id, level, practiceMode)}
              className="rounded-xl bg-accent-700 px-5 py-3 text-lg font-medium text-on-accent hover:bg-accent-800"
            >
              {started ? 'Weiter üben' : 'Erste Aufgabe'} · {practiceMode === 'free' ? 'frei' : 'geführt'}
            </a>
            <a href={courseHref(course.id)} className="-mx-2 rounded-lg px-2 py-3 font-medium text-accent-700 hover:bg-accent-100">
              Stufe oder Art ändern
            </a>
          </>
        ) : (
          <a
            href={courseHref(course.id)}
            className="rounded-xl bg-accent-700 px-5 py-3 text-lg font-medium text-on-accent hover:bg-accent-800"
          >
            Auswahl ändern
          </a>
        )}
      </div>
    </section>
  )
}

type MixCardProps = { subject: Subject; settings: Settings; progress: Progress }

// „Weitermachen" mit der zuletzt geübten Mischung: Stufe und angekreuzte Themen, die letzten Aufgaben
// aus diesen Themen in dieser Stufe; kommt in der Stufe nichts dran, ist „Auswahl ändern" der Hauptknopf
function MixContinueCard({ subject, settings, progress }: MixCardProps) {
  const { level } = mixChoiceOf(subject, settings)
  const courses = mixedCourses(subject, settings, level)
  const ids = new Set(courses.map((course) => course.id))
  const attempts = progress.attempts.filter((a) => a.level === level && ids.has(a.course))
  const recent = attempts.slice(-SUGGEST_WINDOW)
  const recentClean = recent.filter((a) => a.clean).length
  // Art wie beim Üben: frei nur, wenn alle Themen der Mischung einen freien Modus haben
  const modes = new Set(courses.map((course) => (course.free ? settings.practiceMode : 'guided')))
  const modeLabel = modes.size === 1 ? (modes.has('free') ? ' · frei' : ' · geführt') : ''
  return (
    <section aria-labelledby="continue" className="space-y-4 rounded-2xl bg-accent-50 p-5">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1 space-y-1">
          <h2 id="continue" className="text-sm font-semibold tracking-wide text-accent-700 uppercase">
            Weitermachen
          </h2>
          <p className="text-2xl font-semibold tracking-tight">Themen mischen</p>
          {courses.length > 0 ? (
            <p className="text-zinc-700 text-pretty">
              {subjectLevelName(subject, level)}: {joinTitles(courses.map((course) => courseSummary(course, settings, level)))}
            </p>
          ) : (
            <>
              <p className="text-zinc-700">{subjectLevelName(subject, level)}</p>
              <p className="text-sm text-pretty text-zinc-600">{mixBlockedHint(subject, settings, level)}</p>
            </>
          )}
        </div>
        <AreaIcon kind="mix" className="size-16 shrink-0" />
      </div>
      {attempts.length > 0 && (
        <div className="space-y-1.5">
          <RecentDots recent={recent} />
          <p className="text-sm text-zinc-600">
            {attempts.length} gelöst · zuletzt {recentClean} von {recent.length} ohne Fehler
          </p>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        {courses.length > 0 ? (
          <>
            <a
              href={mixPracticeHref(subject.id, level)}
              className="rounded-xl bg-accent-700 px-5 py-3 text-lg font-medium text-on-accent hover:bg-accent-800"
            >
              Weiter üben{modeLabel}
            </a>
            <a href={mixHref(subject.id)} className="-mx-2 rounded-lg px-2 py-3 font-medium text-accent-700 hover:bg-accent-100">
              Auswahl ändern
            </a>
          </>
        ) : (
          <a
            href={mixHref(subject.id)}
            className="rounded-xl bg-accent-700 px-5 py-3 text-lg font-medium text-on-accent hover:bg-accent-800"
          >
            Auswahl ändern
          </a>
        )}
      </div>
    </section>
  )
}

// Index des letzten Gebiets eines Fachs, das sich schon üben lässt (-1: keins)
function lastPlayableArea(subject: Subject): number {
  return subject.areas.findLastIndex(isAreaAvailable)
}

// Kachel „Themen mischen" im Blaugrün der App, damit sie sich von den Gebieten abhebt
function MixTile({ subject }: { subject: Subject }) {
  return (
    <a
      href={mixHref(subject.id)}
      className="flex items-center gap-4 rounded-2xl border border-accent-200 bg-accent-50 px-4 py-3 transition-colors hover:border-accent-600"
    >
      <AreaIcon kind="mix" className="size-14 shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-semibold">Themen mischen</span>
        <span className="block text-sm text-pretty text-zinc-600">Themen und Unterthemen ankreuzen, gemischt üben</span>
      </span>
      <span aria-hidden className="text-accent-700">
        →
      </span>
    </a>
  )
}

// Kachel „Probeklausur" im Blaugrün der App; läuft eine, führt sie zum Weiterschreiben
function MockTile({ subject }: { subject: Subject }) {
  const session = useMockSession()
  const mock = subject.mock!
  const running = session && session.subject === subject.id && session.submittedAt === null ? session : null
  return (
    <a
      href={running ? mockHref(subject.id, running.id) : mockHref(subject.id)}
      className="flex items-center gap-4 rounded-2xl border border-accent-200 bg-accent-50 px-4 py-3 transition-colors hover:border-accent-600"
    >
      <AreaIcon kind="exam" className="size-14 shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-semibold">Probeklausur</span>
        <span className="block text-sm text-pretty text-zinc-600">
          {running ? `Nr. ${running.id} läuft: weiterschreiben` : `Teil ${mock.part} wie die echte Klausur: ${mock.minutes} Minuten, ${mock.points} Punkte`}
        </span>
      </span>
      <span aria-hidden className="text-accent-700">
        →
      </span>
    </a>
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
