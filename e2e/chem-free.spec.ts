import { type Page, expect, test } from '@playwright/test'
import { chemCourseEngine } from '../src/engine/chem/engine.ts'
import { chemExamTask } from '../src/engine/chem/exam/index.ts'
import { examState, gradeExam, itemsOf, numberAnswer } from '../src/engine/exam/grade.ts'
import { GENERATED_MIN } from '../src/engine/quiz/numbers.ts'
import { formatText } from '../src/engine/quantity/numberDe.ts'
import { type Rational, ratMul, parseDecimal } from '../src/engine/rational.ts'

// Chemie frei rechnen (S8b): Zahlen über den eigenen Ziffernblock, Toleranz, „Fast: Prüfe deine Rundung",
// typischer Fehler mit Namen und Erklärung, Hinweis auf der Themenseite für Stufen ohne Rechnung; S8c: Klausuraufgabe
// frei

function collectErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  return errors
}

const SUP: Record<string, string> = { '⁻': '-', '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9' }
const COURSE = 'chem-stoffmenge'
const engine = chemCourseEngine(COURSE)

// eine Aufgabe der Grundlagen, in der jeder Schritt eine Zahl ist und der erste einen typischen Fehler kennt
function findTask() {
  for (let i = 0; i < 2000; i++) {
    const seed = GENERATED_MIN + 101 * i
    const task = engine.planGuidedTask({ level: 1, seed })
    const first = task.steps[0]?.numeric
    if (task.steps.length >= 2 && task.steps.every((s) => s.numeric) && first && !first.exact && first.wrongs.length > 0) return { seed, task }
  }
  throw new Error('keine passende Aufgabe')
}

// Zahl als Tastenfolge, gerundet auf drei gültige Ziffern: „3,98 · 10⁻¹⁹" → 3 , 9 8 ·10ⁿ − 1 9
function keysOf(value: Rational): string[] {
  const sup: Record<string, string> = { '⁻': '-', '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9' }
  const text = formatText(value)
  const [mantissa, power] = text.split(' · 10')
  const keys: string[] = []
  for (const c of mantissa) keys.push(c === ',' ? 'Komma' : c === '-' ? 'Minus' : c)
  if (power) {
    keys.push('mal zehn hoch')
    for (const c of [...power].map((s) => sup[s])) keys.push(c === '-' ? 'Minus' : c)
  }
  return keys
}

async function typeNumber(page: Page, value: Rational) {
  const pad = page.getByRole('group', { name: 'Zahl eingeben' })
  for (let i = 0; i < 16; i++) await pad.getByRole('button', { name: 'Löschen' }).click()
  for (const key of keysOf(value)) await pad.getByRole('button', { name: key, exact: true }).click()
  await pad.getByRole('button', { name: 'Prüfen' }).click()
}

test('Chemie frei: Fehler erkannt, Rundung „fast", dann richtig bis zum Ergebnis', async ({ page }) => {
  const errors = collectErrors(page)
  const { seed, task } = findTask()
  await page.goto(`./#/frei/${COURSE}/1-${seed}`)
  await expect(page.getByRole('group', { name: 'Zahl eingeben' })).toBeVisible()
  await expect(page.getByText('Tippe das Ergebnis ein.')).toBeVisible()
  // Antworten zum Auswählen gibt es bei Zahlen nicht
  await expect(page.getByRole('group', { name: 'Antworten' })).toHaveCount(0)

  const first = task.steps[0].numeric!
  // typischer Fehler: Name und „Warum ist das falsch?"
  await typeNumber(page, first.wrongs[0].value)
  await expect(page.getByText('Nicht ganz. Versuch es noch einmal.')).toBeVisible()
  await expect(page.getByText(/^Das passt zu einem typischen Fehler:/)).toBeVisible()
  await page.getByRole('button', { name: 'Warum ist das falsch?' }).click()
  await expect(page.getByRole('button', { name: 'Warum ist das falsch?' })).toHaveCount(0)
  // 2,5 % daneben: „fast", zählt nicht als Fehler
  await typeNumber(page, ratMul(first.value, parseDecimal('1.025')!))
  await expect(page.getByText('Fast: Prüfe deine Rundung.')).toBeVisible()
  await expect(page.getByTestId('read-as')).toContainText('Gelesen als')

  for (const [i, step] of task.steps.entries()) {
    await typeNumber(page, step.numeric!.value)
    await expect(page.getByText('Richtig!', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: i === task.steps.length - 1 ? 'Ergebnis ansehen' : 'Weiter' }).click()
  }
  await expect(page.getByText(/^Gelöst mit 1 Fehlversuch\./)).toBeVisible()
  await expect(page.getByRole('link', { name: 'Nächste Aufgabe' })).toHaveAttribute('href', `#/frei/${COURSE}/1`)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)

  // „Nächste Aufgabe" im freien Modus: wieder eine Rechnung mit Zahl
  await page.getByRole('link', { name: 'Nächste Aufgabe' }).click()
  await expect(page).toHaveURL(new RegExp(`#/frei/${COURSE}/1-\\d+$`))
  await expect(page.getByRole('group', { name: 'Zahl eingeben' }).or(page.getByRole('group', { name: 'Antworten' }))).toBeVisible()
  expect(errors).toEqual([])
})

test('Chemie frei: Lösung zeigen nach einem Fehler, Tastatur des Laptops', async ({ page }) => {
  const { seed, task } = findTask()
  await page.goto(`./#/frei/${COURSE}/1-${seed}`)
  await expect(page.getByRole('group', { name: 'Zahl eingeben' })).toBeVisible()
  await page.keyboard.type('99999')
  await page.keyboard.press('Enter')
  await expect(page.getByText('Nicht ganz. Versuch es noch einmal.')).toBeVisible()
  await page.getByRole('button', { name: 'Lösung zeigen' }).click()
  await expect(page.getByText('Die Lösung', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: task.steps.length === 1 ? 'Ergebnis ansehen' : 'Weiter' }).click()
  await expect(page.getByText('Tippe das Ergebnis ein.')).toBeVisible()
})

test('Chemie frei: Stufe ohne Rechnung mit Zahlen geht geführt weiter, mit Hinweis', async ({ page }) => {
  await page.goto('./#/thema/chem-ionen')
  await page.getByRole('radio', { name: /Frei/ }).check({ force: true })
  await page.getByRole('radio', { name: /^Grundlagen/ }).check({ force: true })
  await expect(page.getByTestId('free-note')).toHaveText('In Grundlagen gibt es hier nichts zum Eintippen, deshalb übst du geführt.')
  await expect(page.getByRole('link', { name: 'Grundlagen geführt üben' })).toBeVisible()
  await page.getByRole('radio', { name: /^Klausurniveau/ }).check({ force: true })
  await expect(page.getByTestId('free-note')).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Klausurniveau frei üben' })).toBeVisible()
  // eine Adresse „frei" in einer solchen Stufe führt zum geführten Üben
  await page.goto('./#/frei/chem-ionen/1')
  await expect(page).toHaveURL(/#\/ueben\/chem-ionen\/1-\d+$/)
})

test('Chemie: Klausuraufgabe 4 frei, Zahlen eintippen, eine grob gerundet, abgeben, Auswertung', async ({ page }) => {
  const errors = collectErrors(page)
  const seed = 4242
  const task = chemExamTask(4, seed)!
  const items = itemsOf(task)
  await page.goto(`./#/klausur/chemie/aufgabe/4/${seed}`)
  await page.getByRole('button', { name: 'Eintippen', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Eintippen', exact: true })).toHaveAttribute('aria-pressed', 'true')

  // wie ein Mensch: Gleichung wählen (die erste Antwort), Zahlen der erwarteten Antwort eintippen, die Molmasse des
  // Brennstoffs 2,5 % daneben
  const answers: Record<string, string> = {}
  const fuelMolar = task.parts[1].items[0].id
  for (const [index, item] of items.entries()) {
    const build = examState(task, answers).find((s) => s.item.id === item.id)!.build!
    const box = page.getByTestId('exam-item').nth(index)
    if (!build.numeric) {
      // die Gleichung schreibt man in der Klausur selbst: erst die Antworten zeigen
      if (item.paperFirst) await box.getByRole('button', { name: 'Auf Papier gelöst, Antworten zeigen' }).click()
      await box.getByRole('group', { name: 'Antworten' }).getByRole('button').first().click()
      answers[item.id] = build.options[0].id
      continue
    }
    const expected = build.options.find((o) => o.id === build.expected)!.value as Rational
    const value = item.id === fuelMolar ? ratMul(expected, parseDecimal('1.025')!) : expected
    const text = formatText(value, { significant: 6, scientific: true }).replace(' · 10', 'e').replace(/[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (c) => SUP[c])
    await box.getByRole('button', { name: 'Zahl eintippen' }).click()
    await page.keyboard.type(text)
    await box.getByRole('button', { name: 'Übernehmen' }).click()
    await expect(box.getByTestId('typed-answer')).toBeVisible()
    answers[item.id] = numberAnswer(text)
  }
  await expect(page.getByText('Kommt, sobald die Fragen davor beantwortet sind.')).toHaveCount(0)
  await page.getByRole('button', { name: 'Abgeben', exact: true }).click()
  const result = gradeExam(task, answers)
  await expect(page.getByTestId('exam-score')).toHaveText(`${String(result.points).replace('.', ',')} von 14 Punkten`)
  await expect(page.getByText('Knapp daneben: Prüfe deine Rundung. Das gibt hier trotzdem die vollen Punkte.')).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)
  expect(errors).toEqual([])
})
