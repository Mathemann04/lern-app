import { useMockHistory, useMockSession } from '../state/mockExam.ts'
import { dueReviewsOf } from '../state/reviews.ts'
import { AreaIcon } from './AreaIcon.tsx'
import { BackLink } from './BackLink.tsx'
import { CourseTile } from './AreaScreen.tsx'
import { type Area, type Subject, isAreaAvailable, isMixAvailable, subjectById, subjectCourseIds, subjectCourses } from './catalog.ts'
import { mockSummary, pointsText } from './examOverview.ts'
import { areaHref, examOverviewHref, mixHref, mockHref, reviewHref } from './routes.ts'

// Seite eines Fachs (M6 Schritt 1, #/fach/<id>): oben die Klausur-Karte (Fächer mit Probeklausur), darunter die
// spielbaren Gebiete als Kacheln und „Themen mischen", Kommendes in einer Zeile „Demnächst", unten Lernkarten (später
// auch „Nachschlagen", M12). In Fächern mit Tätigkeiten (Mathe, M6 Schritt 3) stehen statt der Gebiete die Tätigkeiten
// selbst da, jede in ihrer Farbe. Kommt ohne Mathe-Engine und KaTeX aus.
export function SubjectScreen({ id }: { id: string }) {
  const subject = subjectById(id)!
  const areas = subject.areas.filter(isAreaAvailable)
  const soon = subject.soon ?? subject.areas.filter((area) => !isAreaAvailable(area)).map((area) => area.title)
  return (
    <main className="space-y-8">
      <div className="space-y-3">
        <BackLink href="#/" label="Start" />
        <div className="flex items-center gap-4">
          <AreaIcon kind={subject.icon} className="size-16 shrink-0" />
          <h1 className="min-w-0 text-3xl font-semibold tracking-tight hyphens-auto">{subject.title}</h1>
        </div>
      </div>

      {subject.mock && <ExamStartCard subject={subject} />}

      <section aria-labelledby="practice" className="space-y-3">
        <h2 id="practice" className="text-sm font-semibold tracking-wide text-zinc-600 uppercase">
          Üben
        </h2>
        <ul className="space-y-3">
          {subject.activities
            ? subjectCourses(subject).map(({ area, course }) => (
                <li key={course.id}>
                  <CourseTile course={course} tone={course.tone ?? area.tone} />
                </li>
              ))
            : areas.map((area) => (
                <li key={area.id}>
                  <AreaTile area={area} />
                </li>
              ))}
          {isMixAvailable(subject) && (
            <li>
              <MixTile subject={subject} />
            </li>
          )}
        </ul>
        {soon.length > 0 && <SoonLine titles={soon} />}
      </section>

      <section aria-labelledby="more" className="space-y-3">
        <h2 id="more" className="text-sm font-semibold tracking-wide text-zinc-600 uppercase">
          Nachlesen
        </h2>
        <a
          href="#/karten"
          className="flex min-h-11 items-center gap-4 rounded-2xl border border-zinc-200 px-4 py-3 transition-colors hover:border-accent-600 hover:bg-accent-50"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-semibold">Lernkarten</span>
            <span className="block text-sm text-pretty text-zinc-600">Regeln, Beispiele und typische Fehler zu jedem Thema</span>
          </span>
          <span aria-hidden className="text-accent-700">
            →
          </span>
        </a>
      </section>
    </main>
  )
}

// Eine Zeile „Demnächst: A, B, C" statt blasser Kacheln (Titel wie „Säuren und Basen" enthalten selbst „und")
export function SoonLine({ titles }: { titles: readonly string[] }) {
  return (
    <p className="text-pretty text-zinc-600">
      <span className="font-medium text-zinc-700">Demnächst:</span> {titles.join(', ')}
    </p>
  )
}

function AreaTile({ area }: { area: Area }) {
  return (
    <a
      href={areaHref(area.id)}
      data-tone={area.tone}
      className="flex items-center gap-4 rounded-2xl border border-zinc-200 px-4 py-3 transition-colors hover:border-accent-600 hover:bg-accent-50"
    >
      <AreaIcon kind={area.icon} className="size-14 shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-semibold">{area.title}</span>
        <span className="block text-sm text-pretty text-zinc-600">{area.description}</span>
      </span>
      <span aria-hidden className="text-accent-700">
        →
      </span>
    </a>
  )
}

// Kachel „Themen mischen" im Blaugrün der App, damit sie sich von den Gebieten abhebt
function MixTile({ subject }: { subject: Subject }) {
  return (
    <a
      href={mixHref(subject.id)}
      data-tone="teal"
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

// Karte „Klausur Teil N" (S11) im Blaugrün der App: heute fällige Wiederholung über alle Themen des Fachs, Probeklausur
// (läuft eine, weiterschreiben; sonst das letzte Ergebnis) und Klausur-Überblick. Ist nichts fällig, steht dort dezent
// „nichts fällig" statt eines Knopfs, der ins Leere führt. Auf der Startseite mit dem Namen des Fachs (withSubject).
export function ExamStartCard({ subject, withSubject = false }: { subject: Subject; withSubject?: boolean }) {
  const session = useMockSession()
  const history = useMockHistory()
  const mock = subject.mock!
  const running = session && session.subject === subject.id && session.submittedAt === null ? session : null
  const { last } = mockSummary(subject, history)
  // beim Zeigen gelesen: Start- und Fach-Seite werden bei jedem Besuch neu aufgebaut
  const due = dueReviewsOf(subjectCourseIds(subject)).length
  const tile = 'flex min-h-11 flex-col justify-center rounded-xl px-3 py-2.5'
  return (
    <section aria-labelledby={`exam-${subject.id}`} data-tone="teal" className="space-y-3 rounded-2xl border border-accent-200 bg-accent-50 p-4">
      <div className="flex items-center gap-3">
        <AreaIcon kind="exam" className="size-10 shrink-0" />
        <h2 id={`exam-${subject.id}`} className="text-lg font-semibold">
          {withSubject ? `${subject.title} · ` : ''}Klausur Teil {mock.part}
        </h2>
      </div>
      <ul className="grid gap-2 sm:grid-cols-3">
        <li>
          {due > 0 ? (
            <a href={reviewHref(subject.id)} className={`${tile} h-full bg-accent-700 text-on-accent hover:bg-accent-800`}>
              <span className="font-semibold">Wiederholen</span>
              <span className="text-sm">{due === 1 ? '1 Frage fällig' : `${due} Fragen fällig`}</span>
            </a>
          ) : (
            <div className={`${tile} h-full border border-dashed border-zinc-300`} data-testid="review-none">
              <span className="font-semibold text-zinc-600">Wiederholen</span>
              <span className="text-sm text-zinc-500">nichts fällig</span>
            </div>
          )}
        </li>
        <li>
          <a
            href={running ? mockHref(subject.id, running.id) : mockHref(subject.id)}
            className={`${tile} h-full border border-accent-200 bg-surface transition-colors hover:border-accent-600`}
          >
            <span className="font-semibold">Probeklausur</span>
            <span className="text-sm text-pretty text-zinc-600">
              {running
                ? `Nr. ${running.id} läuft: weiterschreiben`
                : last
                  ? `zuletzt ${pointsText(last.points)} von ${last.max} Punkten`
                  : `${mock.minutes} Minuten, ${mock.points} Punkte`}
            </span>
          </a>
        </li>
        <li>
          <a href={examOverviewHref(subject.id)} className={`${tile} h-full border border-accent-200 bg-surface transition-colors hover:border-accent-600`}>
            <span className="font-semibold">Klausur-Überblick</span>
            <span className="text-sm text-pretty text-zinc-600">Wie sicher je Aufgabe</span>
          </a>
        </li>
      </ul>
    </section>
  )
}
