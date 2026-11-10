import { chemTopic } from '../../engine/chem/banks.ts'
import { cardById } from '../../engine/explain/cards.ts'
import type { Misconception, Question } from '../../engine/quiz/types.ts'
import { formatTaskNumber } from '../../engine/tasks/taskNumber.ts'
import { AreaIcon } from '../AreaIcon.tsx'
import { BackLink } from '../BackLink.tsx'
import { RichText } from '../RichText.tsx'
import { cardHref } from '../cards/cardRoute.ts'
import { courseById, levelName } from '../catalog.ts'
import { galleryHref, taskHref } from '../routes.ts'

// Testseite „Fragen durchsehen" eines Chemie-Themas (#/galerie/chem-atombau), erst bei Bedarf
// geladen: je Stufe alle Fragen mit Nummer, richtiger Antwort, allen falschen Antworten samt
// Denkfehler und „Warum ist das falsch?", Tipp, Erklärung, Karten und Fundstelle; darunter alle
// Denkfehler des Themas. So lassen sich die Fragen vor dem Üben in Ruhe prüfen.

export default function QuestionGallery({ course: id }: { course: string }) {
  const { area, course } = courseById(id)!
  const topic = chemTopic(id)
  const misconceptions = new Map((topic?.misconceptions ?? []).map((m) => [m.id, m]))
  const levels = course.levels.filter((l) => l.available)
  return (
    <main className="space-y-10">
      <section className="space-y-3">
        <BackLink href={galleryHref()} label="Formel-Galerie" />
        <div className="flex items-center gap-4">
          <AreaIcon kind={course.icon} className="size-16 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm text-zinc-500">{area.title} · Testseite</p>
            <h1 className="text-3xl font-semibold tracking-tight hyphens-auto">{course.title}: Fragen durchsehen</h1>
          </div>
        </div>
        <p className="text-zinc-600 text-pretty">
          Alle Fragen mit der richtigen Antwort, allen falschen Antworten samt Denkfehler und „Warum ist das falsch?“, Tipp, Erklärung und
          Lernkarten. Beim Üben werden je Frage drei der falschen Antworten gezeigt.
        </p>
      </section>

      {!topic && <p className="text-zinc-600">Für dieses Thema gibt es noch keine Fragen.</p>}

      {topic &&
        levels.map((l) => {
          const questions = topic.bank.questions.filter((q) => q.level === l.level).sort((a, b) => a.no - b.no)
          return (
            <section key={l.level} aria-labelledby={`questions-${l.level}`} className="space-y-4">
              <div>
                <h2 id={`questions-${l.level}`} className="text-xl font-semibold">
                  {levelName(id, l.level)}
                </h2>
                <p className="text-sm text-zinc-500">
                  {l.title} · {questions.length} {questions.length === 1 ? 'Frage' : 'Fragen'}
                </p>
              </div>
              <ol className="space-y-4">
                {questions.map((q) => (
                  <li key={q.id}>
                    <QuestionCard course={id} question={q} misconceptions={misconceptions} />
                  </li>
                ))}
              </ol>
            </section>
          )
        })}

      {topic && (
        <section aria-labelledby="misconceptions" className="space-y-4 border-t border-zinc-100 pt-8">
          <div>
            <h2 id="misconceptions" className="text-xl font-semibold">
              Denkfehler
            </h2>
            <p className="text-sm text-zinc-500">Alle typischen Denkfehler des Themas, wie sie in „Deine häufigsten Fehler“ erscheinen.</p>
          </div>
          <ul className="space-y-3">
            {topic.misconceptions.map((m) => (
              <li key={m.id} className="space-y-2 rounded-2xl border border-zinc-200 p-4">
                <RichText text={m.name} className="block font-medium" inline />
                <p className="text-sm text-zinc-500">{m.id}</p>
                <RichText text={`„${m.wrongText}“`} className="italic text-zinc-700" />
                <RichText text={m.why.detailed} className="text-zinc-700" />
                <RichText text={`Kurz: ${m.why.short}`} className="text-sm text-zinc-600" />
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}

type CardProps = { course: string; question: Question; misconceptions: ReadonlyMap<string, Misconception> }

function QuestionCard({ course, question: q, misconceptions }: CardProps) {
  const ref = { level: q.level, seed: q.no }
  return (
    <article data-question-no={q.no} className="space-y-4 rounded-2xl border border-zinc-200 p-4">
      <div className="space-y-1">
        {/* Link vorn in voller Höhe (44 px), Nummer, Id und Fakt daneben bzw. darunter */}
        <p className="flex flex-wrap items-center gap-x-3 text-sm text-zinc-500">
          <a href={taskHref(course, ref)} className="inline-flex min-h-11 items-center font-medium text-accent-700 hover:underline">
            Aufgabe {formatTaskNumber(ref)}
          </a>
          <span>
            Nr. {q.no} · {q.id} · Fakt {q.fact}
          </span>
        </p>
        <RichText text={q.title} className="block text-sm font-medium text-accent-700" inline />
        <RichText text={q.prompt} className="text-lg font-semibold" />
      </div>

      <div className="space-y-1 rounded-xl bg-green-50 px-3 py-2">
        <p className="text-sm font-semibold text-green-800">Richtig</p>
        <div data-testid="correct-answer">
          <RichText text={q.correct.text} />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-red-800">Falsch ({q.wrong.length})</p>
        <ul className="space-y-3">
          {q.wrong.map((w) => {
            const m = misconceptions.get(w.misconception)
            const why = w.why ?? m?.why
            return (
              <li key={w.id} className="space-y-1 border-l-2 border-red-200 pl-3">
                <div data-testid="wrong-answer">
                  <RichText text={w.text} className="font-medium" />
                </div>
                <p className="text-sm text-zinc-500">
                  Denkfehler: {m ? <RichText text={m.name} inline /> : 'unbekannt'} ({w.misconception}){w.why && ' · eigener Text'}
                </p>
                {why && <RichText text={why.detailed} className="text-sm text-zinc-700" />}
              </li>
            )
          })}
        </ul>
      </div>

      <dl className="space-y-2 text-sm">
        <div>
          <dt className="font-semibold text-amber-800">Tipp</dt>
          <dd>
            <RichText text={q.hint} className="text-zinc-700" />
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-zinc-600">Erklärung</dt>
          <dd className="space-y-1">
            <RichText text={q.explanation.detailed} className="text-zinc-700" />
            <RichText text={`Kurz: ${q.explanation.short}`} className="text-zinc-600" />
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-zinc-600">Lernkarten</dt>
          <dd className="flex flex-wrap gap-x-3">
            {q.cards.length === 0
              ? '–'
              : q.cards.map((id) => {
                  const card = cardById(id)
                  return card ? (
                    <a key={id} href={cardHref(id)} className="inline-flex min-h-11 items-center font-medium text-accent-700 hover:underline">
                      <RichText text={card.title} inline />
                    </a>
                  ) : (
                    <span key={id} className="text-red-700">
                      {id} (fehlt)
                    </span>
                  )
                })}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-zinc-600">Fundstelle</dt>
          <dd className="text-zinc-700">{q.ref ?? '–'}</dd>
        </div>
      </dl>
    </article>
  )
}
