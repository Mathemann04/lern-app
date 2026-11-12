import { useExamPractice } from '../../state/examPractice.ts'
import { type MockRecord, useMockHistory, useMockSession } from '../../state/mockExam.ts'
import { dueReviewsOf, waitingReviewCount } from '../../state/reviews.ts'
import { AreaIcon } from '../AreaIcon.tsx'
import { BackLink } from '../BackLink.tsx'
import { type Subject, subjectById, subjectCourseIds } from '../catalog.ts'
import { CONFIDENCE_LABEL, type Confidence, type ExamTaskInfo, confidenceOf, examAttempts, examTasksOf, mockSummary, pointsText, shortDate } from '../examOverview.ts'
import { examTaskHref, mockHref, reviewHref } from '../routes.ts'

// Klausur-Überblick (S11, #/klausur/<fach>, Fächer mit Probeklausur): je Klausuraufgabe, wie sicher sie sitzt (aus den
// letzten drei Versuchen, ui/examOverview.ts), mit „Üben"; darunter letzte und beste Probeklausur und die heute fällige
// Wiederholung. Ohne Engine und KaTeX. Die Seite im Blaugrün der App, jede Klausuraufgabe in der Farbe ihres Gebiets.

export default function ExamOverviewPage({ subject: subjectId }: { subject: string }) {
  const subject = subjectById(subjectId)!
  const mock = subject.mock!
  const practice = useExamPractice()
  const history = useMockHistory()
  return (
    <main className="space-y-8">
      <div className="space-y-3">
        <BackLink href="#/" label="Start" />
        <h1 className="text-3xl font-semibold tracking-tight text-balance">Klausur-Überblick</h1>
        <p className="text-pretty text-zinc-600">
          {subject.title}, Teil {mock.part}: {mock.minutes} Minuten, {mock.points} Punkte. Wie sicher du bist, zählt aus deinen letzten drei
          Versuchen je Aufgabe, geübt oder in der Probeklausur.
        </p>
      </div>

      <section aria-labelledby="overview-tasks" className="space-y-3">
        <h2 id="overview-tasks" className="text-xl font-semibold">
          Klausuraufgaben
        </h2>
        <ul className="space-y-3">
          {examTasksOf(subject).map((info) => (
            <TaskRow key={info.task} subject={subject} info={info} confidence={confidenceOf(examAttempts(subject, info.task, practice, history))} />
          ))}
        </ul>
      </section>

      <MockSection subject={subject} history={history} />
      <ReviewSection subject={subject} />
    </main>
  )
}

// Der Balken in der Farbe des Gebiets; die Stufe hebt nur die Enden hervor: unsicher bernstein, sicher grün
const BADGE: Readonly<Record<Confidence, string>> = {
  new: 'bg-zinc-100 text-zinc-600',
  unsure: 'bg-amber-50 text-amber-900',
  almost: 'bg-zinc-100 text-zinc-700',
  sure: 'bg-green-50 text-green-800',
}

type RowProps = { subject: Subject; info: ExamTaskInfo; confidence: ReturnType<typeof confidenceOf> }

function TaskRow({ subject, info, confidence }: RowProps) {
  const { area, task, points } = info
  const { level, share, last } = confidence
  const percent = share === null ? 0 : Math.round(share * 100)
  return (
    <li data-tone={area.tone} aria-label={`Klausuraufgabe ${task}`} data-testid="exam-task-row" className="space-y-3 rounded-2xl border border-zinc-200 p-4">
      <div className="flex items-start gap-3">
        <AreaIcon kind={area.icon} className="size-12 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-accent-700">
            Klausuraufgabe {task} · {points} Punkte
          </p>
          <p className="text-lg font-semibold text-pretty">{area.title}</p>
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <span className={`rounded-full px-2.5 py-0.5 text-sm font-medium ${BADGE[level]}`} data-testid="confidence">
            {CONFIDENCE_LABEL[level]}
          </span>
          {share !== null && <span className="text-sm text-zinc-600">{percent} % der Punkte</span>}
        </div>
        <div aria-hidden className="h-2 overflow-hidden rounded-full bg-zinc-100">
          <div className="h-full rounded-full bg-accent-600" style={{ width: `${percent}%` }} />
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 flex-1 text-sm text-pretty text-zinc-600">
          {last ? `zuletzt ${pointsText(last.points)} von ${last.max} Punkten${last.mock ? ' (Probeklausur)' : ''}` : 'Noch kein Versuch.'}
        </p>
        <a
          href={examTaskHref(subject.id, task)}
          className="inline-flex min-h-11 shrink-0 items-center rounded-xl bg-accent-700 px-5 font-semibold text-on-accent hover:bg-accent-800"
          aria-label={`Klausuraufgabe ${task} üben`}
        >
          Üben
        </a>
      </div>
    </li>
  )
}

const mockLine = (label: string, record: MockRecord) => `${label}: ${pointsText(record.points)} von ${record.max} Punkten am ${shortDate(record.at)}`

function MockSection({ subject, history }: { subject: Subject; history: readonly MockRecord[] }) {
  const session = useMockSession()
  const running = session && session.subject === subject.id && session.submittedAt === null ? session : null
  const { last, best, count } = mockSummary(subject, history)
  return (
    <section aria-labelledby="overview-mock" className="space-y-3 rounded-2xl bg-accent-50 p-4">
      <h2 id="overview-mock" className="text-xl font-semibold">
        Probeklausur
      </h2>
      {running && <p className="text-zinc-700">Nr. {running.id} läuft gerade.</p>}
      {last ? (
        <div className="space-y-1 text-zinc-700" data-testid="overview-mock-results">
          <p>{mockLine('Zuletzt', last)}</p>
          {best && count > 1 && best !== last && <p>{mockLine('Beste', best)}</p>}
        </div>
      ) : (
        !running && <p className="text-zinc-700">Noch keine Probeklausur geschrieben.</p>
      )}
      <a
        href={running ? mockHref(subject.id, running.id) : mockHref(subject.id)}
        className="inline-flex min-h-11 items-center rounded-xl bg-accent-700 px-5 font-semibold text-on-accent hover:bg-accent-800"
      >
        {running ? 'Probeklausur weiterschreiben' : 'Probeklausur schreiben'}
      </a>
    </section>
  )
}

function ReviewSection({ subject }: { subject: Subject }) {
  const courses = subjectCourseIds(subject)
  const due = dueReviewsOf(courses).length
  const waiting = waitingReviewCount(courses)
  return (
    <section aria-labelledby="overview-review" className="space-y-3 rounded-2xl bg-accent-50 p-4">
      <h2 id="overview-review" className="text-xl font-semibold">
        Wiederholung
      </h2>
      <p className="text-pretty text-zinc-700" data-testid="overview-review-text">
        {due > 0
          ? `Heute ${due === 1 ? 'ist 1 Frage' : `sind ${due} Fragen`} fällig, die du schon einmal falsch beantwortet hast.`
          : waiting > 0
            ? `Heute ist nichts fällig. ${waiting === 1 ? '1 Frage kommt' : `${waiting} Fragen kommen`} später wieder.`
            : 'Heute ist nichts fällig. Falsch beantwortete Fragen kommen hier wieder.'}
      </p>
      {due > 0 && (
        <a href={reviewHref(subject.id)} className="inline-flex min-h-11 items-center rounded-xl bg-accent-700 px-5 font-semibold text-on-accent hover:bg-accent-800">
          Wiederholen
        </a>
      )}
    </section>
  )
}
