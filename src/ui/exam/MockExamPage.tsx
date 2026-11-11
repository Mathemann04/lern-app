import { useEffect, useMemo, useRef, useState } from 'react'
import { CHEM_MOCK, MOCK_ID_MAX, chemMockExam } from '../../engine/chem/exam/mock.ts'
import { examState, truthOf, withAnswer } from '../../engine/exam/grade.ts'
import { type MockExam, type MockTask, answersOf, gradeMock, missingToPass, openCountOf, remainingMs } from '../../engine/exam/mock.ts'
import { type MockSession, setMockAnswers, showMockTask, startMockSession, submitMockSession, useMockSession } from '../../state/mockExam.ts'
import { useSettings } from '../../state/settings.ts'
import { type Subject, mockSubjectOf } from '../catalog.ts'
import { FitWidth } from '../FitWidth.tsx'
import { Formula } from '../Formula.tsx'
import { RichText } from '../RichText.tsx'
import { mockHref } from '../routes.ts'
import { ModeSwitch, PartResultView, PartView } from './ExamParts.tsx'
import { decimal, pointsOf, recordExamErrors } from './examText.ts'

// Probeklausur (Plan M4, „Probeklausur", S9a): Deckblatt, dann alle Klausuraufgaben am Stück mit Uhr (45 Minuten,
// rückwärts; „Ohne Zeitdruck" wählbar). Man springt frei zwischen den Aufgaben; bis zur Abgabe gibt es keine
// Rückmeldung, keine Tipps und keine Lernkarten. Der Stand liegt auf dem Gerät (state/mockExam.ts): Neu laden
// verliert nichts, und die Uhr läuft ab dem Start weiter. Ist die Zeit um, gibt die App ab. Danach die Auswertung:
// Punkte je Aufgabe, Hinweis auf die 40 Punkte zum Bestehen, jede Frage mit Lösungsweg wie bei „Klausuraufgabe N üben".

const twoDigits = (n: number) => String(n).padStart(2, '0')
// „44:59"
const clock = (ms: number) => {
  const seconds = Math.ceil(ms / 1000)
  return `${Math.floor(seconds / 60)}:${twoDigits(seconds % 60)}`
}
const minutes = (n: number) => `${n} ${n === 1 ? 'Minute' : 'Minuten'}`
const randomId = () => 1 + Math.floor(Math.random() * MOCK_ID_MAX)

// Uhrzeit, die sich jede Sekunde erneuert
function useNow(): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])
  return now
}

// Titel der Aufgabe N aus dem Katalog (Gebiet mit „Klausuraufgabe N üben")
const taskTitle = (subject: Subject, no: number) => subject.areas.find((a) => a.exam?.task === no)?.title ?? `Aufgabe ${no}`

export default function MockExamPage({ subject: subjectId, id }: { subject: string; id: number | null }) {
  const subject = mockSubjectOf(subjectId)!
  const session = useMockSession()
  const own = session && session.subject === subject.id && session.id === id ? session : null
  if (own) return <MockRun key={`${own.id}-${own.startedAt}`} subject={subject} session={own} />
  return <Cover subject={subject} id={id} session={session?.subject === subject.id ? session : null} />
}

// --- Deckblatt ---

function Cover({ subject, id, session }: { subject: Subject; id: number | null; session: MockSession | null }) {
  const mock = subject.mock!
  const [timed, setTimed] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const { practiceMode } = useSettings()
  const now = useNow()
  const running = session && session.submittedAt === null ? session : null
  const tasks = Array.from({ length: mock.tasks }, (_, i) => i + 1)

  const start = () => {
    if (running && !confirming) {
      setConfirming(true)
      return
    }
    const next = id ?? randomId()
    startMockSession(subject.id, next, timed, 1)
    window.location.hash = mockHref(subject.id, next).slice(1)
  }

  return (
    <main className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm text-zinc-500">
          {subject.title} · Teil {mock.part}
          {id !== null && ` · Nr. ${id}`}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Probeklausur</h1>
        <p className="text-pretty text-zinc-600">Wie die echte Klausur: alle Aufgaben am Stück, mit Uhr, Punkten und Auswertung.</p>
      </div>

      {running && (
        <section className="space-y-3 rounded-2xl border-2 border-accent-600 bg-accent-50 px-4 py-4" aria-label="Offene Probeklausur">
          <p className="font-semibold">Du schreibst gerade die Probeklausur Nr. {running.id}.</p>
          <p className="text-sm text-zinc-600">
            {running.timed ? `Noch ${minutes(Math.ceil(remainingMs(running.startedAt, mock.minutes, now) / 60_000))}.` : 'Ohne Zeitdruck.'} Dein Stand
            ist gespeichert.
          </p>
          <a
            href={mockHref(subject.id, running.id)}
            className="inline-flex min-h-11 items-center rounded-xl bg-accent-700 px-4 font-semibold text-on-accent hover:bg-accent-800"
          >
            Weiterschreiben
          </a>
        </section>
      )}

      <section className="space-y-4 rounded-2xl bg-zinc-100 px-4 py-4" aria-label="Deckblatt">
        <dl className="grid grid-cols-3 gap-2 text-center">
          <div>
            <dt className="text-sm text-zinc-500">Zeit</dt>
            <dd className="text-2xl font-semibold">{mock.minutes} min</dd>
          </div>
          <div>
            <dt className="text-sm text-zinc-500">Punkte</dt>
            <dd className="text-2xl font-semibold">{mock.points}</dd>
          </div>
          <div>
            <dt className="text-sm text-zinc-500">Aufgaben</dt>
            <dd className="text-2xl font-semibold">{mock.tasks}</dd>
          </div>
        </dl>
        <ol className="space-y-1 text-zinc-700">
          {tasks.map((no) => (
            <li key={no}>
              {no}. {taskTitle(subject, no)}
            </li>
          ))}
        </ol>
        <ul className="list-disc space-y-1 pl-5 text-sm text-pretty text-zinc-600">
          <li>Hilfsmittel: dein Taschenrechner, ein Periodensystem und eine Formelsammlung (bitte deine eigenen bereitlegen).</li>
          <li>Du springst frei zwischen den Aufgaben. Bis zur Abgabe gibt es keine Rückmeldung, keine Tipps und keine Lernkarten.</li>
          <li>Folgefehler zählen nicht doppelt. Ist die Zeit um, gibt die App deine Klausur ab.</li>
          <li>
            Die Klausur hat zwei Teile mit je {mock.points} Punkten. Bestanden ist sie mit zusammen {CHEM_MOCK.passTotal} von {CHEM_MOCK.total} Punkten.
          </li>
        </ul>
      </section>

      <div className="space-y-3">
        <label className="flex min-h-11 cursor-pointer items-center gap-3">
          <input type="checkbox" checked={!timed} onChange={(e) => setTimed(!e.target.checked)} className="size-5 accent-accent-700" />
          <span>Ohne Zeitdruck (die Uhr zählt nur mit)</span>
        </label>
        <div className="space-y-1">
          <p className="text-sm text-zinc-600">Zahlen in Rechnungen</p>
          <ModeSwitch mode={practiceMode} />
        </div>
        {confirming && running && (
          <p className="rounded-2xl bg-amber-50 px-4 py-3 text-zinc-800">
            Die offene Probeklausur Nr. {running.id} wird dabei abgebrochen und nicht ausgewertet. Trotzdem neu beginnen?
          </p>
        )}
        <button
          type="button"
          onClick={start}
          className="min-h-11 w-full rounded-2xl bg-accent-700 px-4 py-3 font-semibold text-on-accent hover:bg-accent-800"
        >
          {confirming && running ? 'Ja, neu beginnen' : running ? 'Neue Probeklausur beginnen' : 'Klausur beginnen'}
        </button>
        {session && session.submittedAt !== null && (
          <a href={mockHref(subject.id, session.id)} className="inline-flex min-h-11 items-center rounded-xl px-3 font-medium text-accent-700 hover:bg-accent-50">
            Letzte Auswertung ansehen (Nr. {session.id})
          </a>
        )}
      </div>
    </main>
  )
}

// --- Klausur schreiben und Auswertung ---

function MockRun({ subject, session }: { subject: Subject; session: MockSession }) {
  const exam = useMemo(() => chemMockExam(session.id), [session.id])
  if (session.submittedAt !== null) return <MockResultView subject={subject} session={session} exam={exam} />
  return <MockWriting subject={subject} session={session} exam={exam} />
}

// Abgeben: bewerten, erkannte Fehler zählen (nur beim ersten Mal)
function submit(exam: MockExam, session: MockSession, timeUp: boolean) {
  if (!submitMockSession(timeUp)) return
  for (const t of gradeMock(exam, session.answers).tasks) recordExamErrors(t.result)
  window.scrollTo(0, 0)
}

function MockWriting({ subject, session, exam }: { subject: Subject; session: MockSession; exam: MockExam }) {
  const now = useNow()
  const [leaving, setLeaving] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const { practiceMode } = useSettings()
  const current = exam.tasks.find((t) => t.no === session.current) ?? exam.tasks[0]
  const index = exam.tasks.indexOf(current)
  const remaining = remainingMs(session.startedAt, exam.minutes, now)
  const timeUp = session.timed && remaining === 0
  const open = exam.tasks.reduce((sum, t) => sum + openCountOf(t, session.answers), 0)

  // Zeit um: abgeben (auch, wenn die App erst danach wieder geöffnet wird)
  useEffect(() => {
    if (timeUp) submit(exam, session, true)
  }, [timeUp, exam, session])

  const go = (no: number) => {
    showMockTask(no)
    setConfirming(false)
    window.scrollTo(0, 0)
  }

  return (
    <main className="space-y-6">
      <div className="sticky top-0 z-10 -mx-2 space-y-2 bg-surface px-2 pt-1 pb-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setLeaving(true)}
            aria-label="Klausur unterbrechen"
            className="-my-1 -ml-3 rounded-lg p-3 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
          >
            <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <p className="min-w-0 flex-1 text-sm text-zinc-500">
            Probeklausur Nr. {session.id} · {subject.mock!.points} Punkte
          </p>
          <Clock session={session} minutes={exam.minutes} now={now} />
        </div>
        <TaskNav exam={exam} current={current.no} onGo={go} badge={(t) => {
          const left = openCountOf(t, session.answers)
          return left === 0 ? 'fertig' : `${left} offen`
        }} />
      </div>

      {leaving && (
        <section className="space-y-3 rounded-2xl bg-amber-50 px-4 py-4 text-zinc-800" aria-label="Unterbrechen">
          <p className="font-semibold">Klausur unterbrechen?</p>
          <p className="text-sm">
            Dein Stand bleibt gespeichert{session.timed ? ', aber die Uhr läuft weiter' : ''}. Weiterschreiben kannst du über die Kachel „Probeklausur“.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setLeaving(false)}
              className="min-h-11 rounded-xl bg-accent-700 px-4 font-semibold text-on-accent hover:bg-accent-800"
            >
              Weiterschreiben
            </button>
            <a href="#/" className="inline-flex min-h-11 items-center rounded-xl px-3 font-medium text-accent-700 hover:bg-accent-50">
              Unterbrechen
            </a>
          </div>
        </section>
      )}

      <TaskHeader subject={subject} task={current} />
      <TaskWriting key={current.no} task={current} answers={answersOf(session.answers, current)} free={practiceMode === 'free'} onChange={() => setConfirming(false)} />

      <div className="flex flex-wrap justify-between gap-2">
        {index > 0 ? (
          <button type="button" onClick={() => go(exam.tasks[index - 1].no)} className="min-h-11 rounded-xl px-3 font-medium text-accent-700 hover:bg-accent-50">
            ← Aufgabe {exam.tasks[index - 1].no}
          </button>
        ) : (
          <span />
        )}
        {index < exam.tasks.length - 1 && (
          <button
            type="button"
            onClick={() => go(exam.tasks[index + 1].no)}
            className="min-h-11 rounded-xl border-2 border-accent-600 px-4 font-medium text-accent-700 hover:bg-accent-50"
          >
            Aufgabe {exam.tasks[index + 1].no} →
          </button>
        )}
      </div>

      <div className="space-y-3 border-t border-zinc-200 pt-6">
        {confirming && open > 0 && (
          <p className="rounded-2xl bg-amber-50 px-4 py-3 text-zinc-800">
            Noch {open === 1 ? 'eine Frage' : `${open} Fragen`} offen. Offene Fragen geben keine Punkte. Trotzdem abgeben?
          </p>
        )}
        <button
          type="button"
          onClick={() => (open > 0 && !confirming ? setConfirming(true) : submit(exam, session, false))}
          className="min-h-11 w-full rounded-2xl bg-accent-700 px-4 py-3 font-semibold text-on-accent hover:bg-accent-800"
        >
          {confirming && open > 0 ? 'Ja, abgeben' : 'Klausur abgeben'}
        </button>
      </div>
    </main>
  )
}

// Uhr rückwärts; ohne Zeitdruck zählt sie mit. Die letzten fünf Minuten in Gelb.
function Clock({ session, minutes: total, now }: { session: MockSession; minutes: number; now: number }) {
  if (!session.timed) {
    return (
      <p className="text-sm text-zinc-600" data-testid="mock-clock">
        Ohne Zeitdruck · {clock(Math.max(0, now - session.startedAt))}
      </p>
    )
  }
  const remaining = remainingMs(session.startedAt, total, now)
  return (
    <p
      role="timer"
      aria-label="Verbleibende Zeit"
      data-testid="mock-clock"
      className={`rounded-lg px-2 py-1 text-lg font-semibold tabular-nums ${remaining <= 5 * 60_000 ? 'bg-amber-50 text-amber-800' : 'text-zinc-900'}`}
    >
      {clock(remaining)}
    </p>
  )
}

// Knöpfe 1 bis 5 zum Springen, mit kurzem Stand darunter
function TaskNav({ exam, current, onGo, badge }: { exam: MockExam; current: number; onGo: (no: number) => void; badge: (task: MockTask) => string }) {
  return (
    <nav aria-label="Aufgaben" className="grid grid-cols-5 gap-1.5">
      {exam.tasks.map((t) => (
        <button
          key={t.no}
          type="button"
          aria-current={t.no === current ? 'step' : undefined}
          aria-label={`Aufgabe ${t.no}, ${badge(t)}`}
          onClick={() => onGo(t.no)}
          className={`flex min-h-11 flex-col items-center justify-center rounded-xl border-2 px-1 py-1 ${
            t.no === current ? 'border-accent-600 bg-accent-50' : 'border-zinc-200 bg-surface hover:border-accent-600'
          }`}
        >
          <span className="font-semibold">{t.no}</span>
          <span className="text-xs text-zinc-600">{badge(t)}</span>
        </button>
      ))}
    </nav>
  )
}

function TaskHeader({ subject, task, earned }: { subject: Subject; task: MockTask; earned?: number }) {
  const max = task.task.parts.reduce((s, p) => s + p.points, 0)
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold tracking-tight hyphens-auto">
        Aufgabe {task.no}: {taskTitle(subject, task.no)}
        <span className="ml-2 text-base font-medium text-zinc-500">{earned === undefined ? `${max} Punkte` : pointsOf(earned, max)}</span>
      </h1>
      <section className="space-y-3 rounded-2xl bg-zinc-100 px-4 py-4" aria-label="Aufgabe">
        <RichText text={task.task.intro} />
        {task.task.givenLatex && (
          <FitWidth className="text-xl">
            <Formula tex={task.task.givenLatex} />
          </FitWidth>
        )}
        <RichText text={task.task.note} className="text-sm text-zinc-600" />
      </section>
    </div>
  )
}

function TaskWriting({ task, answers, free, onChange }: { task: MockTask; answers: Readonly<Record<string, string>>; free: boolean; onChange: () => void }) {
  const states = useMemo(() => examState(task.task, answers), [task, answers])
  // Eintippen nur bei Fragen mit Zahl
  const hasNumbers = useMemo(() => [...truthOf(task.task).values()].some((t) => t.build.numeric), [task])
  return (
    <>
      {hasNumbers && <ModeSwitch mode={free ? 'free' : 'guided'} />}
      {task.task.parts.map((part) => (
        <PartView
          key={part.id}
          part={part}
          states={states.filter((s) => part.items.includes(s.item))}
          free={free && hasNumbers}
          answers={answers}
          onPick={(itemId, optionId) => {
            setMockAnswers(task.no, withAnswer(task.task, answers, itemId, optionId))
            onChange()
          }}
        />
      ))}
    </>
  )
}

// --- Auswertung ---

function MockResultView({ subject, session, exam }: { subject: Subject; session: MockSession; exam: MockExam }) {
  const result = useMemo(() => gradeMock(exam, session.answers), [exam, session.answers])
  const [shown, setShown] = useState(exam.tasks[0].no)
  const detailsRef = useRef<HTMLDivElement>(null)
  const mock = subject.mock!
  const missing = missingToPass(result.points, CHEM_MOCK.passTotal)
  const used = Math.min(Math.round(((session.submittedAt ?? session.startedAt) - session.startedAt) / 60_000), session.timed ? exam.minutes : Infinity)
  const task = exam.tasks.find((t) => t.no === shown)!
  const taskResult = result.tasks.find((t) => t.task.no === shown)!.result
  const states = useMemo(() => examState(task.task, answersOf(session.answers, task)), [task, session.answers])

  return (
    <main className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm text-zinc-500">
          {subject.title} · Teil {mock.part} · Probeklausur Nr. {session.id}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Auswertung</h1>
        {session.timeUp && <p className="rounded-2xl bg-amber-50 px-4 py-3 text-zinc-800">Die Zeit war um. Die App hat deine Klausur abgegeben.</p>}
      </div>

      <section className="space-y-3 rounded-2xl border-2 border-accent-600 px-4 py-4" aria-label="Ergebnis">
        <p className="text-3xl font-semibold" data-testid="mock-score">
          {pointsOf(result.points, result.max)}
        </p>
        <ul className="space-y-1 text-zinc-700">
          {result.tasks.map((t) => (
            <li key={t.task.no} className="flex justify-between gap-3">
              <span>
                {t.task.no}. {taskTitle(subject, t.task.no)}
              </span>
              <span className="shrink-0 tabular-nums">
                {decimal(t.result.points)} / {t.result.max}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-pretty text-zinc-800" data-testid="mock-pass">
          {missing === 0
            ? `Damit hast du die ${CHEM_MOCK.passTotal} Punkte zum Bestehen schon mit Teil ${mock.part} zusammen.`
            : `Bestanden ist die Klausur mit ${CHEM_MOCK.passTotal} von ${CHEM_MOCK.total} Punkten aus beiden Teilen. Mit diesem Ergebnis bräuchtest du in Teil 2 noch ${pointsOf(missing, mock.points)}.`}
        </p>
        <p className="text-sm text-zinc-500">
          {session.timed ? `Gebraucht: ${minutes(used)} von ${exam.minutes}.` : `Ohne Zeitdruck, gebraucht: ${minutes(used)}.`} Punkte nach dem Schema der App,
          Teilpunkte geschätzt.
        </p>
        <MockLinks subject={subject} session={session} />
      </section>

      <div ref={detailsRef} className="space-y-6">
        <h2 className="text-xl font-semibold">Aufgaben im Einzelnen</h2>
        <TaskNav
          exam={exam}
          current={shown}
          onGo={(no) => {
            setShown(no)
            detailsRef.current?.scrollIntoView()
          }}
          badge={(t) => {
            const r = result.tasks.find((x) => x.task.no === t.no)!.result
            return `${decimal(r.points)}/${r.max}`
          }}
        />
        <TaskHeader subject={subject} task={task} earned={taskResult.points} />
        {task.task.parts.map((part) => (
          <PartResultView
            key={`${task.no}-${part.id}`}
            part={part}
            result={taskResult.parts.find((p) => p.part.id === part.id)!}
            answers={answersOf(session.answers, task)}
            states={states}
          />
        ))}
      </div>

      <MockLinks subject={subject} session={session} />
    </main>
  )
}

function MockLinks({ subject, session }: { subject: Subject; session: MockSession }) {
  return (
    <div className="flex flex-wrap gap-2">
      <a href={mockHref(subject.id)} className="inline-flex min-h-11 items-center rounded-xl bg-accent-700 px-4 font-semibold text-on-accent hover:bg-accent-800">
        Neue Probeklausur
      </a>
      <button
        type="button"
        onClick={() => {
          startMockSession(subject.id, session.id, session.timed, 1)
          window.scrollTo(0, 0)
        }}
        className="min-h-11 rounded-xl px-3 font-medium text-accent-700 hover:bg-accent-50"
      >
        Diese Klausur noch einmal
      </button>
      <a href="#/" className="inline-flex min-h-11 items-center rounded-xl px-3 font-medium text-accent-700 hover:bg-accent-50">
        Zur Startseite
      </a>
    </div>
  )
}
