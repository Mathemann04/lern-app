import type { Level } from '../engine/tasks/taskNumber.ts'
import { forgetShown } from '../state/questionRounds.ts'

// „Überspringen" (M6 Schritt 2). Eine übersprungene Aufgabe zählt nicht als gelöst und nicht als Fehler; gespeichert
// wird dafür nichts auf dem Gerät. Nur hier im Arbeitsspeicher steht, welche Aufgabe zuletzt übersprungen wurde,
// damit (1) die nächste Wahl sie nicht gleich wieder nimmt (eine Wissensfrage kommt später in derselben Runde wieder,
// eine fällige Wiederholung nach einer anderen Frage) und (2) die nächste Aufgabe kurz „Aufgabe übersprungen" zeigt.
// Beides gilt, bis eine andere Aufgabe gezeigt wurde (taskShown). Neuladen der Seite vergisst es.

export type Skipped = {
  readonly course: string
  readonly level: Level
  readonly seed: number
  // Nummer der Wissensfrage hinter der Aufgabe; null bei Mathe-Aufgaben und Rechnungen
  readonly question: number | null
}

let skipped: Skipped | null = null

// Die Aufgabe wird übersprungen (vor dem Wechsel zur nächsten): Eine Wissensfrage verlässt die Runde, damit sie später
// in derselben Runde wiederkommt
export function skipTask(task: Skipped) {
  if (task.question !== null) forgetShown(task.course, task.level, task.question)
  skipped = task
}

const isSkipped = (course: string, seed: number) => skipped !== null && skipped.course === course && skipped.seed === seed

// Frage, die die nächste Wahl in diesem Thema und dieser Stufe meiden soll (null: keine)
export function avoidedQuestion(course: string, level: Level): number | null {
  return skipped && skipped.course === course && skipped.level === level ? skipped.question : null
}

// Übersprungene Wissensfrage für „Wiederholen" über alle Themen (null: keine)
export function skippedQuestion(): { readonly course: string; readonly no: number } | null {
  return skipped && skipped.question !== null ? { course: skipped.course, no: skipped.question } : null
}

// Soll diese Aufgabe „Aufgabe übersprungen" zeigen? (die erste andere Aufgabe nach dem Überspringen)
export function showsSkipNotice(course: string, seed: number): boolean {
  return skipped !== null && !isSkipped(course, seed)
}

// Eine Aufgabe wird gezeigt: Ist es eine andere als die übersprungene, ist das Überspringen erledigt
export function taskShown(course: string, seed: number) {
  if (skipped !== null && !isSkipped(course, seed)) skipped = null
}
