import { CARDS, cardById } from '../../engine/explain/cards.ts'
import { FitWidth } from '../FitWidth.tsx'
import { Formula } from '../Formula.tsx'
import { RichText } from '../RichText.tsx'
import { cardHref } from '../routes.ts'
import { derivativeLevels } from '../samples.ts'
import { CardBody } from './CardBody.tsx'

// Übersicht aller Lernkarten, nach der Stufe, ab der die Regel vorkommt
export function CardsScreen() {
  const levels = derivativeLevels.filter((l) => CARDS.some((c) => c.level === l.level))
  return (
    <main className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Lernkarten</h1>
        <p className="text-zinc-600 text-pretty">Jede Regel mit Merksatz, durchgerechneten Beispielen und den typischen Fehlern.</p>
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
            {CARDS.filter((c) => c.level === l.level).map((card) => (
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

// Eine Lernkarte als eigene Seite, mit Blättern zur vorigen und nächsten Karte
export function CardScreen({ id }: { id: string }) {
  const card = cardById(id)!
  const index = CARDS.indexOf(card)
  const [previous, next] = [CARDS[index - 1], CARDS[index + 1]]
  return (
    <main className="space-y-6">
      <a href="#/karten" className="-ml-2 inline-block rounded-lg px-2 py-1 font-medium text-accent-700 hover:bg-accent-50">
        ← Alle Lernkarten
      </a>
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
