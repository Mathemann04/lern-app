import { describe, expect, it } from 'vitest'
import { createRng } from '../random/rng.ts'
import { type InputBox, judgeBoxes, nextBox, solutionBoxes } from './boxInput.ts'
import { parseBoxFigureId } from './electrons.ts'
import { boxTask } from './generators/elektronen.ts'

// Orbital-Kästchen zum Antippen (N2a): Urteil gegen die Kästchenbilder der Auswahl derselben Aufgabe. Die richtige
// Besetzung zählt als richtig (auch mit ↓ statt ↑ und anderer Lage in der Zeile), jedes falsche Bild der Auswahl als
// sein Rechenfehler (außer Pauli, das sich nicht tippen lässt).

const tasks = ([1, 2, 3] as const).flatMap((level) =>
  Array.from({ length: 300 }, (_, i) => boxTask(level, createRng(`kaestchen:${level}:${i}`), { level, seed: 10_000 + i })).filter((c) => c !== null),
)
const stepOf = (calc: (typeof tasks)[number]) => calc.task.steps[0]

describe('Orbital-Kästchen zum Antippen', () => {
  it('schaltet leer → ↑ → ↓ → ↑↓ → leer', () => {
    expect(['0', 'u', 'd', '2'].map((b) => nextBox(b as InputBox))).toEqual(['u', 'd', '2', '0'])
  })

  it('hat in jeder Kästchen-Aufgabe eine Eingabe, deren Zeilen zum richtigen Bild passen', () => {
    expect(tasks.length).toBeGreaterThan(500)
    for (const calc of tasks) {
      const step = stepOf(calc)
      const right = parseBoxFigureId(step.choices.find((c) => c.correct)!.figure!)!
      expect(step.boxes!.core).toBe(right.core)
      expect(solutionBoxes(step.boxes!).map((r) => r.join(''))).toEqual(right.rows.map((r) => r.boxes.join('')))
      expect(judgeBoxes(step.boxes!, solutionBoxes(step.boxes!))).toEqual({ kind: 'correct' })
    }
  })

  it('nimmt auch ↓ für die einzelnen Elektronen und eine andere Lage in der Zeile', () => {
    for (const calc of tasks) {
      const boxes = stepOf(calc).boxes!
      const flipped = solutionBoxes(boxes).map((r) => r.map((b): InputBox => (b === 'u' ? 'd' : b)))
      const reversed = solutionBoxes(boxes).map((r) => [...r].reverse())
      expect(judgeBoxes(boxes, flipped)).toEqual({ kind: 'correct' })
      expect(judgeBoxes(boxes, reversed)).toEqual({ kind: 'correct' })
    }
  })

  it('erkennt jedes falsche Bild der Auswahl als seinen Rechenfehler', () => {
    const seen = new Set<string>()
    for (const calc of tasks) {
      const step = stepOf(calc)
      for (const choice of step.choices.filter((c) => !c.correct && c.errorRuleId !== 'chem-el-pauli')) {
        const rows = parseBoxFigureId(choice.figure!)!.rows.map((r) => r.boxes as InputBox[])
        expect(judgeBoxes(step.boxes!, rows), `${calc.substance} ${choice.figure}`).toEqual({ kind: 'error', rule: choice.errorRuleId })
        seen.add(choice.errorRuleId!)
      }
    }
    expect(seen).toEqual(new Set(['chem-el-hund', 'chem-el-hund-spin', 'chem-el-3d-first', 'chem-el-exception']))
  })

  it('nennt für leere oder falsch gezählte Kästchen keinen typischen Fehler und hat zu jedem Fehler einen Text', () => {
    for (const calc of tasks) {
      const boxes = stepOf(calc).boxes!
      expect(judgeBoxes(boxes, boxes.rows.map((r) => Array.from({ length: r.orbitals }, (): InputBox => '0')))).toEqual({ kind: 'wrong' })
      for (const rule of ['chem-el-hund', 'chem-el-hund-spin', ...boxes.alternatives.map((a) => a.rule)]) expect(boxes.whys[rule], rule).toBeDefined()
    }
  })

  it('bleibt beim gezielten Üben von Pauli bei der Auswahl', () => {
    for (let i = 0; i < 50; i++) {
      const calc = boxTask(2, createRng(`pauli:${i}`), { level: 2, seed: 10_000 + i }, 'chem-el-pauli')
      if (calc) expect(calc.task.steps[0].boxes).toBeUndefined()
    }
  })
})
