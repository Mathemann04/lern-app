import { updateSettings, useSettings } from '../state/settings.ts'
import type { ExplanationDetail } from '../state/storage.ts'

const DETAILS: Array<{ value: ExplanationDetail; title: string; description: string }> = [
  { value: 'detailed', title: 'Ausführlich', description: 'Einfache Sprache, alle Fachbegriffe erklärt.' },
  { value: 'short', title: 'Kurz', description: 'Nur die Rechnung.' },
]

export function SettingsScreen() {
  const settings = useSettings()
  return (
    <main className="space-y-8">
      <h1 className="text-3xl font-semibold tracking-tight">Einstellungen</h1>

      <section aria-labelledby="explanations" className="space-y-5">
        <h2 id="explanations" className="text-xl font-semibold">
          Erklärungen
        </h2>

        <label className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 px-4 py-3">
          <span>
            <span className="block font-medium">Erklärungen nach jeder Antwort zeigen</span>
            <span className="block text-sm text-zinc-500">„Warum ist das falsch?" kannst du immer aufrufen.</span>
          </span>
          <input
            type="checkbox"
            checked={settings.explanations}
            onChange={(event) => updateSettings({ explanations: event.target.checked })}
            className="size-5 shrink-0 accent-accent-700"
          />
        </label>

        <fieldset className="space-y-3">
          <legend className="mb-2 font-medium">Ausführlichkeit</legend>
          {DETAILS.map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 px-4 py-3 ${
                settings.detail === option.value ? 'border-accent-600 bg-accent-50' : 'border-zinc-200'
              }`}
            >
              <input
                type="radio"
                name="detail"
                value={option.value}
                checked={settings.detail === option.value}
                onChange={() => updateSettings({ detail: option.value })}
                className="mt-1 size-4 accent-accent-700"
              />
              <span>
                <span className="block font-medium">{option.title}</span>
                <span className="block text-sm text-zinc-500">{option.description}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <p className="text-sm text-zinc-500">
          In einer Aufgabe kannst du das oben rechts auch nur für diese Aufgabe umstellen.
        </p>
      </section>

      <section aria-labelledby="more" className="space-y-3">
        <h2 id="more" className="text-xl font-semibold">
          Für Neugierige
        </h2>
        <a
          href="#/galerie"
          className="flex items-center gap-4 rounded-2xl border border-zinc-200 px-4 py-3 transition-colors hover:border-accent-600 hover:bg-accent-50"
        >
          <span className="min-w-0 flex-1">
            <span className="block font-medium">Formel-Galerie (Testseite)</span>
            <span className="block text-sm text-zinc-500">
              Zufällige Aufgaben mit Ableitung, Rechenweg und typischen Fehlern, dazu die Schreibweise der Formeln.
            </span>
          </span>
          <span aria-hidden className="text-accent-700">
            →
          </span>
        </a>
      </section>
    </main>
  )
}
