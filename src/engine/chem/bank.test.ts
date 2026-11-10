import { describe, expect, it } from 'vitest'
import { courseById, isLevelAvailable, partsAvailable } from '../../ui/catalog.ts'
import { cardById, cardsInTopic } from '../explain/cards.ts'
import { parseRichText } from '../explain/richText.ts'
import { latexProblem } from '../expr/latexChecks.ts'
import { QUESTION_NO_MAX } from '../quiz/numbers.ts'
import type { Explanation, Question } from '../quiz/types.ts'
import { CHEM_TOPICS } from './banks.ts'

// Prüfung jeder Fragensammlung (Plan M4, Teil B „Tests"): Ids, Nummern, Zahl der Fragen je Stufe,
// Antworten, Denkfehler, Karten und Schreibweise (docs/CHEMIE.md §3)

const MIN_PER_LEVEL = 15
const MIN_WRONG = 4

// Texte mit $…$-Formeln: jede Formel setzt sich im strengen Modus
function expectRenderable(text: string, context: string) {
  expect(text.trim(), context).not.toBe('')
  expect(text, context).not.toMatch(/undefined|NaN|\[object|null/)
  for (const segment of parseRichText(text).flat()) {
    if (segment.kind === 'math') expect(latexProblem(segment.latex, { checkUgly: false }), context).toBeNull()
    // keine Unicode-Indizes und -Ladungen im Fließtext, Formeln gehören in $…$
    else expect(segment.text, `${context}: Unicode-Index oder -Ladung außerhalb von $…$`).not.toMatch(/[₀-₉⁰-⁹⁺⁻]/)
  }
  // in \ce{…} weder $ noch Umlaute (brechen den strengen Modus bzw. die Formel)
  for (const content of ceContents(text)) expect(content, `${context}: \\ce{${content}}`).not.toMatch(/[$äöüÄÖÜß]/)
}

// Inhalte aller \ce{…} (mit geschachtelten Klammern)
function ceContents(text: string): string[] {
  const found: string[] = []
  for (let start = text.indexOf('\\ce{'); start !== -1; start = text.indexOf('\\ce{', start + 1)) {
    let depth = 0
    for (let i = start + 3; i < text.length; i++) {
      if (text[i] === '{') depth++
      if (text[i] === '}' && --depth === 0) {
        found.push(text.slice(start + 4, i))
        break
      }
    }
  }
  return found
}

const expectExplanation = (e: Explanation, context: string) => {
  expectRenderable(e.detailed, `${context} (ausführlich)`)
  expectRenderable(e.short, `${context} (kurz)`)
}

// Antworten vergleichen ohne Groß- und Kleinschreibung, Leerraum und Satzzeichen am Ende
const normalized = (text: string) => text.toLowerCase().replace(/\s+/g, ' ').replace(/[.!?…\s]+$/, '').trim()

const allQuestions: Question[] = CHEM_TOPICS.flatMap((t) => [...t.bank.questions])

describe('Fragensammlungen: über alle Themen', () => {
  it('haben eindeutige Ids nach den Regeln ([a-z0-9-], höchstens 40 Zeichen)', () => {
    const ids = allQuestions.map((q) => q.id)
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]{1,40}$/)
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([])
  })

  it('haben eindeutige Denkfehler mit der Vorsilbe chem-mis-', () => {
    const ids = CHEM_TOPICS.flatMap((t) => t.misconceptions.map((m) => m.id))
    for (const id of ids) expect(id).toMatch(/^chem-mis-[a-z0-9-]{1,31}$/)
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([])
  })

  it('gehören zu Themen des Katalogs, jedes Thema höchstens einmal', () => {
    const courses = CHEM_TOPICS.map((t) => t.bank.course)
    expect(new Set(courses).size).toBe(courses.length)
    for (const course of courses) expect(courseById(course), course).toBeDefined()
  })
})

describe.each(CHEM_TOPICS.map((t) => [t.bank.course, t] as const))('Fragensammlung %s', (course, { bank, misconceptions }) => {
  const known = new Set(misconceptions.map((m) => m.id))

  it('vergibt jede Nummer höchstens einmal und nie eine gelöschte', () => {
    const nos = bank.questions.map((q) => q.no)
    for (const no of nos) expect(Number.isInteger(no) && no >= 1 && no <= QUESTION_NO_MAX, String(no)).toBe(true)
    expect(nos.filter((no, i) => nos.indexOf(no) !== i)).toEqual([])
    expect(nos.filter((no) => bank.retired.includes(no))).toEqual([])
  })

  it(`hat mindestens ${MIN_PER_LEVEL} Fragen in jeder spielbaren Stufe`, () => {
    const { course: entry } = courseById(course)!
    for (const level of entry.levels.filter((l) => isLevelAvailable(entry, l.level))) {
      expect(bank.questions.filter((q) => q.level === level.level).length, `Stufe ${level.level}`).toBeGreaterThanOrEqual(MIN_PER_LEVEL)
    }
  })

  it('ordnet jede Frage einem Unterthema des Katalogs zu, mit genau den Stufen, in denen es Fragen dazu gibt', () => {
    const { course: entry } = courseById(course)!
    const parts = entry.parts ?? []
    expect(parts.length, 'Unterthemen im Katalog (parts)').toBeGreaterThan(0)
    const ids = parts.map((p) => p.id)
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]{1,40}$/)
    expect(ids.filter((id, i) => ids.indexOf(id) !== i), 'doppelte Unterthemen').toEqual([])
    // Titel als reiner Text: Die Seiten mit Auswahl kommen ohne KaTeX aus
    for (const part of parts) expect(part.title, part.id).toMatch(/^[^$\\]+$/)
    const live = bank.questions.filter((q) => !bank.retired.includes(q.no))
    for (const q of live) expect(ids, `${q.id}: Unterthema ${q.part}`).toContain(q.part)
    for (const part of parts) {
      const levels = [...new Set(live.filter((q) => q.part === part.id).map((q) => q.level))].sort((a, b) => a - b)
      expect(levels.length, `${part.id}: keine Fragen`).toBeGreaterThan(0)
      expect([...part.levels], `${part.id}: Stufen`).toEqual(levels)
    }
    // jede spielbare Stufe hat mindestens ein Unterthema
    for (const level of entry.levels.filter((l) => l.available)) {
      expect(partsAvailable(entry, level.level).length, `Stufe ${level.level}`).toBeGreaterThan(0)
    }
  })

  it.each(bank.questions.map((q) => [q.id, q] as const))('%s: Antworten, Denkfehler, Karten und Texte', (id, q) => {
    expect(q.wrong.length, id).toBeGreaterThanOrEqual(MIN_WRONG)
    const options = [q.correct, ...q.wrong]
    expect(new Set(options.map((o) => o.id)).size, `${id}: Ids der Antworten`).toBe(options.length)
    const texts = options.map((o) => normalized(o.text))
    expect(texts.filter((t, i) => texts.indexOf(t) !== i), `${id}: doppelte Antworten`).toEqual([])
    for (const option of q.wrong) {
      expect(known.has(option.misconception), `${id}: Denkfehler ${option.misconception}`).toBe(true)
      if (option.why) expectExplanation(option.why, `${id}/${option.id}`)
    }
    for (const card of q.cards) expect(cardById(card), `${id}: Karte ${card}`).toBeDefined()
    for (const text of [q.title, q.prompt, q.hint, ...options.map((o) => o.text)]) expectRenderable(text, id)
    expectExplanation(q.explanation, id)
    expect(q.fact, id).toMatch(/^[a-z0-9-]+$/)
  })

  it('hat Denkfehler mit Namen, falscher Aussage und Erklärung', () => {
    for (const m of misconceptions) {
      expectRenderable(m.name, m.id)
      expectRenderable(m.wrongText, m.id)
      expectExplanation(m.why, m.id)
    }
  })

  it('schreibt auch die Lernkarten des Themas nach den Regeln', () => {
    for (const card of cardsInTopic(course)) {
      for (const text of [card.title, card.memo, card.note ?? 'x', card.when ?? 'x']) expectRenderable(text, card.id)
      for (const formula of card.formulas) expectRenderable(`$${formula}$`, card.id)
      for (const e of card.examples) {
        if (!('chemTask' in e)) continue
        expectRenderable(e.chemTask, card.id)
        for (const line of e.lines) {
          expectRenderable(line.label, card.id)
          if (line.latex !== undefined) expectRenderable(`$${line.latex}$`, card.id)
        }
      }
    }
  })
})
