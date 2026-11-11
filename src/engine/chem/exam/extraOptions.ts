import type { ExamItem, ExamOption } from '../../exam/types.ts'
import type { Explanation } from '../../explain/texts.ts'
import type { Rng } from '../../random/rng.ts'

// Weitere falsche Antworten für eine Frage der Klausuraufgaben (Abgleich mit den Altklausuren: dort hat jede
// Auswahlfrage vier Antworten; mit nur zwei brächte Raten zu viele Punkte). Die Rechnungen der Themen liefern nur
// falsche Antworten mit einem typischen Fehler; wo das weniger als drei sind, kommen hier sinnvolle weitere dazu. Sie
// haben keinen typischen Fehler (zählen nicht in der Fehlerstatistik), aber ein „Warum ist das falsch?", das die Regel
// nennt, ohne die richtige Antwort zu verraten.

export type ExtraOption = { readonly content: string; readonly why: Explanation }

export const MAX_OPTIONS = 4

// Frage ohne Abhängigkeiten (aus fromStep) mit weiteren falschen Antworten bis zu vier; Antworten mit demselben Text wie
// eine vorhandene fallen weg. Die Reihenfolge wird neu gemischt (sonst stünden die neuen immer unten).
export function withExtraOptions(item: ExamItem, extras: readonly ExtraOption[], rng: Rng): ExamItem {
  if (item.dependsOn.length > 0) throw new Error(`Frage ${item.id}: weitere Antworten nur bei Fragen ohne Abhängigkeiten`)
  const none = () => {
    throw new Error('ohne Abhängigkeiten')
  }
  const base = item.build(none, none)
  const options: ExamOption[] = [...base.options]
  for (const extra of extras) {
    if (options.length >= MAX_OPTIONS) break
    if (options.some((o) => o.id === extra.content)) continue
    options.push({ id: extra.content, content: extra.content, why: extra.why })
  }
  if (options.length === base.options.length) return item
  const shuffled = rng.shuffle(options)
  return { ...item, build: () => ({ ...base, options: shuffled }) }
}
