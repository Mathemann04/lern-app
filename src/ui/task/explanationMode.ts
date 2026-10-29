import { useState } from 'react'
import { useSettings } from '../../state/settings.ts'
import type { ExplanationDetail } from '../../state/storage.ts'

// Erklärungen in dieser Aufgabe: ausführlich, kurz oder aus (startet mit der globalen Einstellung)
export type ExplanationMode = ExplanationDetail | 'off'
export const MODE_LABEL: Record<ExplanationMode, string> = { detailed: 'Ausführlich', short: 'Kurz', off: 'Aus' }
const NEXT_MODE: Record<ExplanationMode, ExplanationMode> = { detailed: 'short', short: 'off', off: 'detailed' }

export function useExplanationMode() {
  const settings = useSettings()
  const [mode, setMode] = useState<ExplanationMode>(settings.explanations ? settings.detail : 'off')
  // „Warum ist das falsch?" geht auch bei ausgeschalteten Erklärungen, dann in der globalen Ausführlichkeit
  const detail: ExplanationDetail = mode === 'off' ? settings.detail : mode
  return { mode, detail, cycle: () => setMode(NEXT_MODE[mode]) }
}
