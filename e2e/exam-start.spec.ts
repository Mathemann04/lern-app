import { type Page, expect, test } from '@playwright/test'
import { chemCourseEngine } from '../src/engine/chem/engine.ts'
import { VARIANTS, questionSeed } from '../src/engine/quiz/numbers.ts'

// Klausur-Start (S11): Karte „Klausur Teil 1" auf der Startseite, „Wiederholen" über alle Themen eines Fachs mit
// „Nächste Aufgabe" zurück zur Wiederholung, Klausur-Überblick mit „wie sicher" je Klausuraufgabe

function collectErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  return errors
}

async function expectCleanPage(page: Page, context: string) {
  await expect(page.locator('code.text-red-700'), context).toHaveCount(0)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow, `${context}: ragt seitlich heraus`).toBeLessThanOrEqual(0)
}

const COURSE = 'chem-atombau'
const engine = chemCourseEngine(COURSE)

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

const seedOf = (url: string) => Number(/\/1-(\d+)(?:\?.*)?$/.exec(url)![1])
const correctIndex = (seed: number) => engine.planGuidedTask({ level: 1, seed }).steps[0].choices.findIndex((c) => c.correct)
const answerButtons = (page: Page) => page.getByRole('group', { name: 'Antworten' }).getByRole('button')
const card = (page: Page) => page.getByRole('region', { name: 'Klausur Teil 1' })

test('Startseite: Karte „Chemie 1 · Klausur Teil 1" oben, ohne fällige Wiederholung', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/')
  await expect(page.getByRole('region', { name: 'Chemie 1 · Klausur Teil 1' })).toBeVisible()
  await expect(card(page).getByTestId('review-none')).toContainText('nichts fällig')
  await expect(card(page).getByRole('link', { name: /Wiederholen/ })).toHaveCount(0)
  await expect(card(page).getByRole('link', { name: /^Probeklausur/ })).toHaveAttribute('href', '#/probeklausur/chemie')
  await expect(card(page).getByRole('link', { name: /^Probeklausur/ })).toContainText('45 Minuten, 50 Punkte')
  await expect(card(page).getByRole('link', { name: /^Klausur-Überblick/ })).toHaveAttribute('href', '#/klausur/chemie')
  // die alte Kachel „Probeklausur" unten gibt es nicht mehr: nur ein Link zur Probeklausur
  await expect(page.getByRole('link', { name: /Probeklausur/ })).toHaveCount(1)
  // Mathe hat keine Probeklausur und keine Karte
  await expect(page.getByRole('region', { name: /Klausur/ })).toHaveCount(1)
  await expectCleanPage(page, 'Startseite')
  expect(errors).toEqual([])
})

test('Wiederholen: falsch beantwortete Frage wird fällig, „Wiederholen" führt hin, „Nächste Aufgabe" zurück', async ({ page }) => {
  const errors = collectErrors(page)
  const no = simpleQuestion()
  // Frage falsch beantworten, dann richtig zu Ende
  const first = questionSeed(no, 0)
  await page.goto(`./#/ueben/${COURSE}/1-${first}`)
  const right = correctIndex(first)
  await answerButtons(page).nth(right === 0 ? 1 : 0).click()
  await expect(page.getByText('Nicht ganz. Versuch es noch einmal.')).toBeVisible()
  await answerButtons(page).nth(right).click()
  await page.getByRole('button', { name: 'Ergebnis ansehen' }).click()
  await expect(page.getByText(/Die Frage kommt nach drei anderen Aufgaben noch einmal/)).toBeVisible()

  // erst nach drei anderen Aufgaben fällig: auf der Startseite noch nichts
  await page.goto('./#/')
  await expect(card(page).getByTestId('review-none')).toBeVisible()
  // drei andere Aufgaben überspringen wir: der gespeicherte Stand zählt sie dazu
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('rechenweg-wiederholung')!) as { tick: number }
    localStorage.setItem('rechenweg-wiederholung', JSON.stringify({ ...state, tick: state.tick + 3, last: null }))
  })
  await page.reload()
  const review = card(page).getByRole('link', { name: /Wiederholen/ })
  await expect(review).toContainText('1 Frage fällig')
  await expect(review).toHaveAttribute('href', '#/wiederholen/chemie')
  await expectCleanPage(page, 'Startseite mit Wiederholung')

  // „Wiederholen" führt zur Frage, in einer anderen Fassung, mit dem Thema darüber
  await review.click()
  await expect(page).toHaveURL(new RegExp(`#/ueben/${COURSE}/1-\\d+\\?wiederholen=chemie$`))
  const seed = seedOf(page.url())
  expect(Math.floor((seed - 500_000) / VARIANTS)).toBe(no)
  expect(seed).not.toBe(first)
  await expect(page.getByTestId('review-note')).toBeVisible()
  await expect(page.getByText('Wiederholen · Atombau')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Aufgabe beenden' })).toHaveAttribute('href', '#/')
  await expectCleanPage(page, 'Wiederholung')
  await answerButtons(page).nth(correctIndex(seed)).click()
  await page.getByRole('button', { name: 'Ergebnis ansehen' }).click()
  await expect(page.getByRole('link', { name: 'Zur Übersicht' })).toHaveAttribute('href', '#/')
  // kein Vorschlag für eine höhere Stufe in der Wiederholung
  await expect(page.getByText(/Stufe höher/)).toHaveCount(0)

  // „Nächste Aufgabe": nichts mehr fällig
  await page.getByRole('link', { name: 'Nächste Aufgabe' }).click()
  await expect(page).toHaveURL(/#\/wiederholen\/chemie$/)
  await expect(page.getByRole('heading', { name: 'Für heute ist alles wiederholt' })).toBeVisible()
  await expect(page.getByTestId('review-done-text')).toContainText('Eine Frage kommt später wieder')
  await expect(page.getByRole('link', { name: 'Klausur-Überblick' })).toHaveAttribute('href', '#/klausur/chemie')
  await expectCleanPage(page, 'Alles wiederholt')
  await page.getByRole('link', { name: 'Zur Startseite' }).click()
  await expect(card(page).getByTestId('review-none')).toBeVisible()
  // „Weitermachen" bleibt beim zuletzt allein geübten Thema
  await expect(page.getByRole('region', { name: 'Weitermachen' })).toContainText('Atombau')
  expect(errors).toEqual([])
})

test('Klausur-Überblick: nach einer geübten Klausuraufgabe mit Stufe, Probeklausur und Wiederholung', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/klausur/chemie')
  await expect(page.getByRole('heading', { name: 'Klausur-Überblick', level: 1 })).toBeVisible()
  const rows = page.getByTestId('exam-task-row')
  await expect(rows).toHaveCount(5)
  await expect(rows.getByTestId('confidence')).toHaveText(Array(5).fill('noch nicht geübt'))
  await expect(page.getByText('Noch keine Probeklausur geschrieben.')).toBeVisible()
  await expect(page.getByTestId('overview-review-text')).toContainText('Heute ist nichts fällig.')
  await expectCleanPage(page, 'Überblick leer')

  // Klausuraufgabe 2 üben und ohne Antwort abgeben: 0 Punkte, unsicher
  await page.getByRole('link', { name: 'Klausuraufgabe 2 üben' }).click()
  await expect(page).toHaveURL(/#\/klausur\/chemie\/aufgabe\/2\/\d+$/)
  await page.getByRole('button', { name: 'Abgeben' }).click()
  await page.getByRole('button', { name: 'Ja, abgeben' }).click()
  await expect(page.getByTestId('exam-score')).toHaveText('0 von 6 Punkten')
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('rechenweg-klausuraufgaben') ?? '[]') as { task: number; points: number; max: number }[])
  expect(stored.map(({ task, points, max }) => ({ task, points, max }))).toEqual([{ task: 2, points: 0, max: 6 }])

  // dazu eine ältere Probeklausur mit allen Punkten in Aufgabe 1 und keinem in Aufgabe 2 (gespeicherter Verlauf)
  await page.evaluate(() => {
    const record = { subject: 'chemie', id: 7, at: Date.now() - 3_600_000, points: 24, max: 50, tasks: [8, 0, 6, 5, 5], timed: true, minutes: 40, timeUp: false }
    localStorage.setItem('rechenweg-probeklausuren', JSON.stringify([record]))
  })
  await page.goto('./#/klausur/chemie')
  await page.reload()
  const row = (n: number) => page.getByRole('listitem', { name: `Klausuraufgabe ${n}` })
  await expect(row(2).getByTestId('confidence')).toHaveText('unsicher')
  await expect(row(2)).toContainText('zuletzt 0 von 6 Punkten')
  await expect(row(2)).toContainText('Periodensystem')
  await expect(row(1).getByTestId('confidence')).toHaveText('sicher')
  await expect(row(1)).toContainText('zuletzt 8 von 8 Punkten (Probeklausur)')
  await expect(row(4).getByTestId('confidence')).toHaveText('unsicher')
  await expect(page.getByTestId('overview-mock-results')).toContainText('Zuletzt: 24 von 50 Punkten')
  await expectCleanPage(page, 'Überblick mit Ergebnissen')

  // die Startseite zeigt das letzte Ergebnis der Probeklausur, der Fortschritt verweist auf den Überblick
  await page.goto('./#/')
  await expect(card(page).getByRole('link', { name: /^Probeklausur/ })).toContainText('zuletzt 24 von 50 Punkten')
  await page.goto('./#/fortschritt')
  await page.getByRole('link', { name: 'Klausur-Überblick Chemie 1' }).click()
  await expect(page).toHaveURL(/#\/klausur\/chemie$/)
  // „Fortschritt löschen" leert auch die Ergebnisse der Klausuraufgaben
  await page.goto('./#/fortschritt')
  await page.getByRole('button', { name: 'Fortschritt löschen' }).click()
  await page.getByRole('button', { name: 'Ja, löschen' }).click()
  expect(await page.evaluate(() => localStorage.getItem('rechenweg-klausuraufgaben'))).toBe('[]')
  await page.goto('./#/klausur/chemie')
  await expect(row(2).getByTestId('confidence')).toHaveText('noch nicht geübt')
  expect(errors).toEqual([])
})

test('Klausur-Start im dunklen Design: Startseite, Überblick, „alles wiederholt" ohne Fehler', async ({ page }) => {
  const errors = collectErrors(page)
  await page.emulateMedia({ colorScheme: 'dark' })
  // „Aussehen: wie das Gerät" (Grundeinstellung) folgt dem dunklen Design des Geräts
  for (const [path, heading] of [
    ['./#/', 'Klausur Teil 1'],
    ['./#/klausur/chemie', 'Klausur-Überblick'],
    ['./#/wiederholen/chemie', 'Für heute ist alles wiederholt'],
  ] as const) {
    await page.goto(path)
    await expect(page.getByRole('heading', { name: heading })).toBeVisible()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await expectCleanPage(page, `${heading} dunkel`)
  }
  expect(errors).toEqual([])
})
