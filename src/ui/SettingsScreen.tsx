import { useState } from 'react'
import { clearReports, reportsText, useReports } from '../state/reports.ts'
import { updateSettings, useSettings } from '../state/settings.ts'
import type { ExplanationDetail, ThemeChoice } from '../state/storage.ts'

const DETAILS: Array<{ value: ExplanationDetail; title: string; description: string }> = [
  { value: 'detailed', title: 'Ausführlich', description: 'Einfache Sprache, alle Fachbegriffe erklärt.' },
  { value: 'short', title: 'Kurz', description: 'Nur die Rechnung.' },
]

const THEMES: Array<{ value: ThemeChoice; title: string }> = [
  { value: 'system', title: 'Automatisch' },
  { value: 'light', title: 'Hell' },
  { value: 'dark', title: 'Dunkel' },
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

      <section aria-labelledby="appearance" className="space-y-3">
        <h2 id="appearance" className="text-xl font-semibold">
          Aussehen
        </h2>
        <fieldset>
          <legend className="sr-only">Hell oder dunkel</legend>
          <div className="flex gap-1 rounded-xl bg-zinc-100 p-1">
            {THEMES.map((option) => (
              <label
                key={option.value}
                className={`flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-lg px-2 py-2 text-center font-medium transition-colors has-focus-visible:ring-2 has-focus-visible:ring-accent-600 ${
                  settings.theme === option.value ? 'bg-raised text-accent-700 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <input
                  type="radio"
                  name="theme"
                  className="sr-only"
                  checked={settings.theme === option.value}
                  onChange={() => updateSettings({ theme: option.value })}
                />
                {option.title}
              </label>
            ))}
          </div>
        </fieldset>
        <p className="text-sm text-zinc-500">„Automatisch" wechselt mit deinem Gerät zwischen hell und dunkel.</p>
      </section>

      <ReportedQuestions />

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

// Mit „Frage melden" gemerkte Fragen: Liste kopieren (zum Einfügen in den Chat) oder leeren. Nur da,
// wenn es welche gibt.
function ReportedQuestions() {
  const reports = useReports()
  const [copy, setCopy] = useState<'idle' | 'done' | 'failed'>('idle')
  const [confirmClear, setConfirmClear] = useState(false)
  if (reports.length === 0) return null
  const text = reportsText(reports)

  async function copyList() {
    try {
      await navigator.clipboard.writeText(text)
      setCopy('done')
    } catch {
      // ohne Erlaubnis für die Zwischenablage: Text zum selbst Kopieren zeigen
      setCopy('failed')
    }
  }

  return (
    <section aria-labelledby="reports" className="space-y-3">
      <h2 id="reports" className="text-xl font-semibold">
        Gemeldete Fragen
      </h2>
      <p className="text-zinc-700">
        {reports.length === 1 ? '1 Frage gemeldet.' : `${reports.length} Fragen gemeldet.`} Kopiere die Liste und füge sie in der nächsten
        Sitzung in den Chat ein, dann wird jede dieser Fragen geprüft.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void copyList()}
          className="min-h-11 rounded-xl bg-accent-700 px-4 py-2.5 font-medium text-on-accent hover:bg-accent-800"
        >
          Liste kopieren
        </button>
        {!confirmClear && (
          <button
            type="button"
            onClick={() => setConfirmClear(true)}
            className="min-h-11 rounded-xl border border-zinc-300 px-4 py-2.5 font-medium hover:bg-zinc-50"
          >
            Liste leeren
          </button>
        )}
      </div>
      <div aria-live="polite">
        {copy === 'done' && <p className="text-sm text-green-800">Kopiert. Du kannst die Liste jetzt in den Chat einfügen.</p>}
        {copy === 'failed' && (
          <div className="space-y-2">
            <p className="text-sm text-zinc-600">Kopieren hat nicht geklappt. Markiere den Text und kopiere ihn selbst:</p>
            <textarea
              readOnly
              value={text}
              rows={Math.min(8, reports.length + 1)}
              onFocus={(event) => event.target.select()}
              className="w-full rounded-xl border border-zinc-300 bg-surface p-3 text-sm"
              aria-label="Liste der gemeldeten Fragen"
            />
          </div>
        )}
      </div>
      {confirmClear && (
        <div className="space-y-3 rounded-2xl bg-red-50 p-4">
          <p className="font-medium text-red-900">Die Liste der gemeldeten Fragen wirklich leeren?</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                clearReports()
                setConfirmClear(false)
                setCopy('idle')
              }}
              className="min-h-11 rounded-xl bg-red-700 px-4 py-2.5 font-medium text-on-accent hover:bg-red-800"
            >
              Ja, leeren
            </button>
            <button type="button" onClick={() => setConfirmClear(false)} className="min-h-11 rounded-xl px-4 py-2.5 font-medium hover:bg-red-100">
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
