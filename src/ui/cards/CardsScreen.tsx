import { cardById, cardsInTopic, topicById } from '../../engine/explain/cards.ts'
import { BackLink } from '../BackLink.tsx'
import { FitWidth } from '../FitWidth.tsx'
import { Formula } from '../Formula.tsx'
import { RichText } from '../RichText.tsx'
import { SUBJECTS, courseOfCards, isCourseAvailable } from '../catalog.ts'
import { cardFolderHref } from '../routes.ts'
import { cardHref, resolveCardPage } from './cardRoute.ts'
import { CardBody } from './CardBody.tsx'

// Lernkarten-Seite zur Adresse: alle Ordner, ein Ordner oder eine Karte
export function CardsPage({ folder, card }: { folder: string | null; card: string | null }) {
  const page = resolveCardPage(folder, card)
  switch (page.kind) {
    case 'folders':
      return <CardsScreen />
    case 'folder':
      return <CardTopicScreen key={page.topic} topic={page.topic} />
    case 'card':
      return <CardScreen key={page.id} id={page.id} />
  }
}

// Ordner der Lernkarten nach Fach und Gebiet wie auf der Startseite (je spielbarem Thema ein Ordner)
const FOLDER_GROUPS = SUBJECTS.flatMap((subject) =>
  subject.areas.flatMap((area) => {
    const topics = area.courses.flatMap((course) => (isCourseAvailable(course) && course.cards ? [topicById(course.cards)!] : []))
    return topics.length > 0 ? [{ subject, area, topics }] : []
  }),
)

// Lernkarten in Ordnern nach Themen, wie eine Formelsammlung
export function CardsScreen() {
  return (
    <main className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Lernkarten</h1>
        <p className="text-zinc-600 text-pretty">Jede Regel mit Merksatz, durchgerechneten Beispielen und den typischen Fehlern.</p>
      </div>
      {FOLDER_GROUPS.map(({ subject, area, topics }) => (
        <section key={area.id} aria-labelledby={`cards-${area.id}`} data-tone={area.tone} className="space-y-3">
          <div>
            <p className="text-sm text-zinc-500">{subject.title}</p>
            <h2 id={`cards-${area.id}`} className="text-xl font-semibold">
              {area.title}
            </h2>
          </div>
          <ul className="space-y-3">
            {topics.map((topic) => (
              <li key={topic.id}>
                <a
                  href={cardFolderHref(topic.id)}
                  className="flex items-center gap-4 rounded-2xl border border-zinc-200 px-4 py-4 transition-colors hover:border-accent-600 hover:bg-accent-50"
                >
                  <span aria-hidden className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-700">
                    <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
                      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    </svg>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-lg font-semibold">{topic.title}</span>
                    <span className="block text-sm text-zinc-600">{topic.description}</span>
                    <span className="block text-sm text-zinc-500">{cardsInTopic(topic.id).length} Karten</span>
                  </span>
                  <span aria-hidden className="text-accent-700">
                    →
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="text-sm text-zinc-500 text-pretty">Weitere Ordner kommen dazu, sobald neue Themen in der App sind.</p>
    </main>
  )
}

// Ein Ordner: die Namen der Formeln mit den Formeln selbst, nach der Stufe, ab der sie vorkommen
export function CardTopicScreen({ topic: id }: { topic: string }) {
  const topic = topicById(id)!
  const cards = cardsInTopic(id)
  const levels = (courseOfCards(id)?.course.levels ?? []).filter((l) => cards.some((c) => c.level === l.level))
  return (
    <main className="space-y-8">
      <div className="space-y-3">
        <BackLink href="#/karten" label="Lernkarten" />
        <h1 className="text-3xl font-semibold tracking-tight">{topic.title}</h1>
      </div>
      {levels.map((l) => (
        <section key={l.level} aria-labelledby={`cards-level-${l.level}`} className="space-y-3">
          <div>
            <h2 id={`cards-level-${l.level}`} className="text-xl font-semibold">
              Stufe {l.level}
            </h2>
            <p className="text-sm text-zinc-500">{l.title}</p>
          </div>
          <ul className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200">
            {cards
              .filter((c) => c.level === l.level)
              .map((card) => (
                <li key={card.id}>
                  <a href={cardHref(card.id)} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50">
                    <span className="min-w-0 flex-1 space-y-1">
                      <RichText text={card.title} className="block font-medium" inline />
                      <FitWidth className="text-zinc-600">
                        <Formula tex={card.formulas[0]} />
                      </FitWidth>
                    </span>
                    <span aria-hidden className="text-accent-700">
                      →
                    </span>
                  </a>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </main>
  )
}

// Eine Lernkarte als eigene Seite, mit Blättern zur vorigen und nächsten Karte im Ordner
export function CardScreen({ id }: { id: string }) {
  const card = cardById(id)!
  const topic = topicById(card.topic)!
  const siblings = cardsInTopic(card.topic)
  const index = siblings.indexOf(card)
  const [previous, next] = [siblings[index - 1], siblings[index + 1]]
  return (
    <main className="space-y-6">
      <BackLink href={cardFolderHref(topic.id)} label={topic.title} />
      <div className="space-y-1">
        <p className="text-sm text-zinc-500">Lernkarte · ab Stufe {card.level}</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          <RichText text={card.title} inline />
        </h1>
      </div>
      <CardBody card={card} heading="h2" practice />
      <nav aria-label="Weitere Lernkarten" className="flex gap-3 border-t border-zinc-100 pt-6">
        {previous && (
          <a href={cardHref(previous.id)} className="min-w-0 flex-1 rounded-xl border border-zinc-200 px-4 py-3 hover:bg-zinc-50">
            <span className="block text-sm text-zinc-500">← Vorige Karte</span>
            <RichText text={previous.title} className="block font-medium hyphens-auto" inline />
          </a>
        )}
        {next && (
          <a href={cardHref(next.id)} className="min-w-0 flex-1 rounded-xl border border-zinc-200 px-4 py-3 text-right hover:bg-zinc-50">
            <span className="block text-sm text-zinc-500">Nächste Karte →</span>
            <RichText text={next.title} className="block font-medium hyphens-auto" inline />
          </a>
        )}
      </nav>
    </main>
  )
}
