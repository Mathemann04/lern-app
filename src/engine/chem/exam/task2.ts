import type { ExamPart, ExamTask } from '../../exam/types.ts'
import { type Rng, createRng } from '../../random/rng.ts'
import { ionTask, steckbriefTask } from '../generators/pse.ts'
import { orderTask } from '../generators/trends.ts'
import type { Property } from '../trends.ts'
import { fromStep } from './fromStep.ts'

// „Klausuraufgabe 2 üben" (Plan M4, S6e; Bauplan Teil 1, Aufgabe 2 mit 6 Punkten): Periodensystem.
// a) drei Auswahlfragen zu einem Element: Periode, Gruppe, Block (3), b) ein Trend (Richtung, dann eine Reihe ordnen) oder
// eine Ionenladung (abgeben oder aufnehmen, Ion, Edelgas) (3). Die Fragen kommen aus den Rechnungen der Themen „Aufbau des
// Periodensystems" und „Trends im Periodensystem", mit denselben falschen Antworten und Rechenfehlern. Die Teile hängen
// nicht voneinander ab (keine Folgefehler).

export const TASK2_POINTS = 6

const PROPS: readonly Property[] = ['radius', 'ie', 'en']

function placePart(seed: string): ExamPart | null {
  for (let i = 0; i < 30; i++) {
    const calc = steckbriefTask(2, createRng(`${seed}:platz:${i}`), { level: 2, seed: 10000 })
    if (!calc || calc.task.steps.length !== 3) continue
    const [period, group, block] = calc.task.steps
    return {
      id: 'a',
      prompt: calc.task.note!,
      points: 3,
      items: [fromStep(period, 'periode', 'Periode', 1), fromStep(group, 'gruppe', 'Gruppe', 1), fromStep(block, 'block', 'Block', 1)],
    }
  }
  return null
}

function secondPart(seed: string, rng: Rng): ExamPart | null {
  if (rng.chance(0.5)) {
    const calc = orderTask(rng.pick(PROPS), 2, createRng(`${seed}:trend`), { level: 2, seed: 10000 })
    if (!calc || calc.task.steps.length !== 2) return null
    const [direction, order] = calc.task.steps
    return {
      id: 'b',
      prompt: `Trends im Periodensystem. ${calc.task.note!}`,
      points: 3,
      items: [fromStep(direction, 'richtung', 'Richtung des Trends', 1), fromStep(order, 'ordnung', 'Reihe ordnen', 2, true)],
    }
  }
  const calc = ionTask(2, createRng(`${seed}:ion`), { level: 2, seed: 10000 })
  if (!calc || calc.task.steps.length !== 3) return null
  const [way, charge, noble] = calc.task.steps
  return {
    id: 'b',
    prompt: `Ionenbildung. ${calc.task.note!}`,
    points: 3,
    items: [fromStep(way, 'weg', 'Abgeben oder aufnehmen', 1), fromStep(charge, 'ladung', 'Ion', 1), fromStep(noble, 'edelgas', 'Edelgaskonfiguration', 1)],
  }
}

export function buildTask2(seed: number): ExamTask {
  for (let attempt = 0; attempt < 50; attempt++) {
    const key = `aufgabe2:${seed}:${attempt}`
    const rng = createRng(key)
    const a = placePart(key)
    const b = secondPart(key, rng)
    if (!a || !b) continue
    return {
      title: 'Aufgabe 2: Periodensystem',
      intro: 'Beantworte die Fragen zum Platz eines Elements im Periodensystem und zu einem Trend oder einer Ionenladung.',
      givenLatex: '',
      note: 'Bei jeder Frage ist genau eine Antwort richtig.',
      parts: [a, b],
    }
  }
  throw new Error(`Keine Klausuraufgabe 2 zu Nummer ${seed}`)
}
