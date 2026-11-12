import { SUGGEST_WINDOW, levelSummary, useProgress } from '../state/progress.ts'
import { useSettings } from '../state/settings.ts'
import type { Progress, Settings } from '../state/storage.ts'
import { AreaIcon } from './AreaIcon.tsx'
import {
  AVAILABLE_COURSES,
  SUBJECTS,
  type Subject,
  courseById,
  isCourseAvailable,
  isMixAvailable,
  isSubjectAvailable,
  levelName,
  playableLevel,
  subjectById,
  subjectCourseIds,
  subjectLevelName,
} from './catalog.ts'
import { RecentDots } from './RecentDots.tsx'
import { courseHref, mixHref, mixPracticeHref, practiceHref, subjectHref } from './routes.ts'
import { blockedHint, courseSummary, isSelectionPlayable, joinTitles, levelPartCount, mixBlockedHint, mixChoiceOf, mixedCourses, partWords } from './selection.ts'
import { ExamStartCard, SoonLine } from './SubjectScreen.tsx'

// Startseite (M6 Schritt 1): ohne Begrüßung; oben „Weitermachen" und die Klausur-Karte (S11), darunter nur die
// Fächer als große Kacheln, Fächer ohne spielbares Gebiet in einer Zeile „Demnächst"
export function HomeScreen() {
  const subjects = SUBJECTS.filter(isSubjectAvailable)
  const soon = SUBJECTS.filter((subject) => !isSubjectAvailable(subject))
  return (
    <main className="space-y-8">
      <h1 className="sr-only">Rechenweg</h1>

      <ContinueCard />

      {subjects
        .filter((subject) => subject.mock)
        .map((subject) => (
          <ExamStartCard key={subject.id} subject={subject} withSubject />
        ))}

      <section aria-labelledby="subjects" className="space-y-3">
        <h2 id="subjects" className="text-sm font-semibold tracking-wide text-zinc-600 uppercase">
          Fächer
        </h2>
        <ul className="space-y-3">
          {subjects.map((subject) => (
            <li key={subject.id}>
              <SubjectTile subject={subject} />
            </li>
          ))}
        </ul>
        {soon.length > 0 && <SoonLine titles={soon.map((subject) => subject.title)} />}
      </section>
    </main>
  )
}

// Große Kachel eines Fachs mit Bild, Untertitel und der Zahl der gelösten Aufgaben
function SubjectTile({ subject }: { subject: Subject }) {
  const progress = useProgress()
  const ids = new Set(subjectCourseIds(subject))
  const solved = progress.attempts.filter((a) => ids.has(a.course)).length
  return (
    <a
      href={subjectHref(subject.id)}
      data-tone={subject.tone}
      className="flex items-center gap-4 rounded-2xl border border-zinc-200 px-4 py-4 transition-colors hover:border-accent-600 hover:bg-accent-50"
    >
      <AreaIcon kind={subject.icon} className="size-16 shrink-0" />
      <span className="min-w-0 flex-1 space-y-0.5">
        <span className="block text-xl font-semibold tracking-tight">{subject.title}</span>
        <span className="block text-pretty text-zinc-600">{subject.description}</span>
        {solved > 0 && (
          <span className="block text-sm text-zinc-500">
            {solved} {solved === 1 ? 'Aufgabe' : 'Aufgaben'} gelöst
          </span>
        )}
      </span>
      <span aria-hidden className="text-accent-700">
        →
      </span>
    </a>
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
    <section aria-labelledby="continue" data-tone={course.tone ?? area.tone} className="space-y-4 rounded-2xl bg-accent-50 p-5">
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
              {playable ? `${partCount.checked} von ${partCount.total} ${partWords(course).dative} angekreuzt` : blockedHint(course, settings, level)}
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
