import { Formula } from './Formula.tsx'
import { derivativeLevels, notationSamples } from './samples.ts'

export function HomeScreen() {
  return (
    <main className="space-y-10">
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Mathe Schritt für Schritt selbst lösen
        </h1>
        <p className="text-lg text-zinc-600 text-pretty">
          Du lernst, indem du Aufgaben selbst rechnest: geführt mit Auswahl-Antworten oder frei mit
          eigener Eingabe.
        </p>
      </section>

      <section aria-labelledby="topic-derivatives" className="rounded-2xl border border-zinc-200">
        <header className="flex items-start justify-between gap-4 p-5 pb-3">
          <div>
            <h2 id="topic-derivatives" className="text-xl font-semibold">
              Ableitungen
            </h2>
            <p className="mt-1 text-zinc-600">Fünf Stufen, vom Einstieg bis zum Profi.</p>
          </div>
          <span className="shrink-0 rounded-full bg-accent-50 px-3 py-1 text-sm font-medium text-accent-800">
            Bald verfügbar
          </span>
        </header>
        <ol className="divide-y divide-zinc-100">
          {derivativeLevels.map((level) => (
            <li key={level.level} className="flex gap-4 px-5 py-4">
              <span
                aria-hidden
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-50 font-semibold text-accent-700"
              >
                {level.level}
              </span>
              <div className="min-w-0 space-y-2">
                <p className="font-medium">
                  <span className="sr-only">Stufe {level.level}: </span>
                  {level.title}
                </p>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-lg">
                  {level.examples.map((tex) => (
                    <Formula key={tex} tex={tex} />
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="notation" className="space-y-4">
        <div>
          <h2 id="notation" className="text-xl font-semibold">
            Schreibweise
          </h2>
          <p className="mt-1 text-zinc-600">
            So werden Formeln in der App gesetzt. Sieht das aus wie in deinem Skript?
          </p>
        </div>
        <dl className="grid gap-3 sm:grid-cols-2">
          {notationSamples.map((sample) => (
            <div key={sample.label} className="rounded-xl bg-zinc-50 px-4 py-3">
              <dt className="text-sm text-zinc-500">{sample.label}</dt>
              <dd className="mt-1 text-xl">
                <Formula tex={sample.tex} />
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  )
}
