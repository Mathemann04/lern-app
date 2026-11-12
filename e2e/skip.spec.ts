import { type Page, expect, test } from '@playwright/test'
import { chemCourseEngine } from '../src/engine/chem/engine.ts'
import { VARIANTS, questionSeed } from '../src/engine/quiz/numbers.ts'

// „Überspringen" (M6 Schritt 2): in jeder Aufgabe unten, führt wie „Nächste Aufgabe" weiter, zählt nicht als gelöst und
// nicht als Fehler; eine übersprungene Wissensfrage verlässt die Runde und kommt später wieder, eine fällige Wiederholung
// nicht gleich noch einmal. In Klausuraufgaben gibt es den Knopf nicht.

function collectErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  return errors
}

const COURSE = 'chem-atombau'
const engine = chemCourseEngine(COURSE)
const skip = (page: Page) => page.getByRole('link', { name: 'Überspringen' })
const notice = (page: Page) => page.getByRole('status').filter({ hasText: 'Aufgabe übersprungen' })
const stored = (page: Page, key: string) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? 'null') as unknown, key)
const seedOf = (url: string) => Number(/\/\d-(\d+)(?:\?.*)?$/.exec(url)![1])
const questionNo = (seed: number) => Math.floor((seed - 500_000) / VARIANTS)

// Eine Wissensfrage der Grundlagen mit einer einzigen Auswahl-Frage (kein Ankreuzen, Zuordnen, Ordnen), in jeder Fassung
function simpleQuestion(): number {
  for (const no of engine.questionNos!(1)) {
    if (engine.resolve({ level: 1, seed: questionSeed(no, 0) }) !== 1) continue
    const simple = Array.from({ length: VARIANTS }, (_, v) => engine.planGuidedTask({ level: 1, seed: questionSeed(no, v) })).every(
      (task) => task.steps.length === 1 && task.steps[0].choices.length > 1 && !task.steps[0].multi && !task.steps[0].match && !task.steps[0].order && !task.steps[0].boxes && !task.steps[0].numeric,
    )
    if (simple) return no
  }
  throw new Error('keine passende Frage')
}

test('Mathe geführt und frei: Überspringen zeigt die nächste Aufgabe, zählt nichts', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/ueben/ableiten/2-4')
  await expect(page.locator('#question')).toBeVisible()
  // eine falsche Antwort ist ein Fehler, das Überspringen selbst nicht
  await expect(skip(page)).toHaveAttribute('href', '#/ueben/ableiten/2')
  await skip(page).click()
  await expect(page).toHaveURL(/#\/ueben\/ableiten\/2-\d+$/)
  expect(seedOf(page.url())).not.toBe(4)
  await expect(notice(page)).toBeVisible()
  await expect(page.locator('#question')).toBeVisible()
  // der Hinweis verschwindet nach ein paar Sekunden
  await expect(notice(page)).toHaveCount(0, { timeout: 8000 })
  const progress = (await stored(page, 'rechenweg')) as { progress: { attempts: unknown[]; errors: object } } | null
  expect(progress?.progress.attempts ?? []).toEqual([])
  expect(progress?.progress.errors ?? {}).toEqual({})

  // frei: dasselbe, weiter im freien Modus
  await page.goto('./#/frei/ableiten/2-4')
  await expect(page.locator('math-field[data-ready]')).toBeVisible()
  await skip(page).click()
  await expect(page).toHaveURL(/#\/frei\/ableiten\/2-\d+$/)
  await expect(notice(page)).toBeVisible()
  await expect(page.locator('math-field[data-ready]')).toBeVisible()
  expect(errors).toEqual([])
})

test('Gelöste Aufgabe: kein Überspringen mehr, dafür „Nächste Aufgabe"', async ({ page }) => {
  const no = simpleQuestion()
  const seed = questionSeed(no, 0)
  await page.goto(`./#/ueben/${COURSE}/1-${seed}`)
  await expect(skip(page)).toBeVisible()
  const right = engine.planGuidedTask({ level: 1, seed }).steps[0].choices.findIndex((c) => c.correct)
  await page.getByRole('group', { name: 'Antworten' }).getByRole('button').nth(right).click()
  await page.getByRole('button', { name: 'Ergebnis ansehen' }).click()
  await expect(page.getByRole('link', { name: 'Nächste Aufgabe' })).toBeVisible()
  await expect(skip(page)).toHaveCount(0)
})

test('Wissensfrage: verlässt beim Überspringen die Runde und kommt nicht gleich wieder', async ({ page }) => {
  const errors = collectErrors(page)
  const no = simpleQuestion()
  await page.goto(`./#/ueben/${COURSE}/1-${questionSeed(no, 0)}`)
  await expect(page.locator('#question')).toBeVisible()
  // gezeigt: in der Runde
  await expect.poll(async () => ((await stored(page, 'rechenweg-fragen')) as Record<string, number[]>)[`${COURSE}:1`]).toContain(no)
  await skip(page).click()
  await expect(page).toHaveURL(new RegExp(`#/ueben/${COURSE}/1-\\d+$`))
  await expect(notice(page)).toBeVisible()
  // die nächste ist eine andere Aufgabe; die übersprungene Frage ist nicht mehr in der Runde, kommt also später wieder
  const next = seedOf(page.url())
  if (next >= 500_000) expect(questionNo(next)).not.toBe(no)
  const round = ((await stored(page, 'rechenweg-fragen')) as Record<string, number[]>)[`${COURSE}:1`]
  expect(round).not.toContain(no)
  expect(errors).toEqual([])
})

test('Wiederholen: die übersprungene fällige Frage kommt nicht gleich wieder', async ({ page }) => {
  const errors = collectErrors(page)
  const no = simpleQuestion()
  // die Frage ist fällig (falsch beantwortet, drei andere Aufgaben später)
  await page.addInitScript((key) => {
    if (sessionStorage.getItem('test-seeded')) return
    sessionStorage.setItem('test-seeded', '1')
    localStorage.setItem('rechenweg-wiederholung', JSON.stringify({ tick: 10, last: null, items: { [key]: { box: 0, dueTick: 3, dueAt: 0, variant: 0, answeredAt: 1 } } }))
  }, `${COURSE}:${no}`)
  await page.goto('./#/wiederholen/chemie')
  await expect(page).toHaveURL(new RegExp(`#/ueben/${COURSE}/1-\\d+\\?wiederholen=chemie$`))
  expect(questionNo(seedOf(page.url()))).toBe(no)
  await expect(skip(page)).toHaveAttribute('href', '#/wiederholen/chemie')
  await skip(page).click()
  await expect(page.getByRole('heading', { name: 'Nur noch die übersprungene Frage ist fällig' })).toBeVisible()
  await expect(page.getByTestId('review-done-text')).toHaveText('Sie bleibt fällig und kommt beim nächsten Wiederholen wieder.')
  // sie bleibt fällig: auf der Startseite weiter „1 Frage fällig"
  await page.getByRole('link', { name: 'Zur Startseite' }).click()
  await expect(page.getByRole('region', { name: 'Klausur Teil 1' }).getByRole('link', { name: /Wiederholen/ })).toContainText('1 Frage fällig')
  expect(errors).toEqual([])
})

test('Klausuraufgabe üben und Probeklausur: kein Überspringen', async ({ page }) => {
  await page.goto('./#/klausur/chemie/aufgabe/1')
  await expect(page.getByRole('button', { name: 'Abgeben', exact: true })).toBeVisible()
  await expect(skip(page)).toHaveCount(0)
})
