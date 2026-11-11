import { type Page, expect, test } from '@playwright/test'
import { chemMockExam } from '../src/engine/chem/exam/mock.ts'
import { truthOf } from '../src/engine/exam/grade.ts'

// Probeklausur Teil 1 (S9a): Deckblatt, Uhr, freies Springen, Stand bleibt beim Neuladen, Unterbrechen, Abgabe und
// Auswertung mit dem Hinweis auf die 40 Punkte; Zeit um: die App gibt selbst ab

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

test('Probeklausur: beginnen, antworten, neu laden, springen, unterbrechen, weiterschreiben, abgeben', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/')
  await page.getByRole('link', { name: /Probeklausur/ }).click()
  await expect(page).toHaveURL(/#\/probeklausur\/chemie$/)
  await expect(page.getByRole('heading', { name: 'Probeklausur' })).toBeVisible()
  await expect(page.getByText('Bestanden ist sie mit zusammen 40 von 100 Punkten.')).toBeVisible()
  await expectCleanPage(page, 'Deckblatt')
  await page.getByRole('button', { name: 'Klausur beginnen' }).click()
  await expect(page).toHaveURL(/#\/probeklausur\/chemie\/\d+$/)
  await expect(page.getByRole('timer')).toHaveText(/^(45:00|44:\d\d)$/)
  await expect(page.getByRole('heading', { name: /Aufgabe 1: Aufbau der Materie/ })).toBeVisible()
  // kein Hauptmenü in der Klausur
  await expect(page.getByRole('link', { name: 'Lernkarten' })).toHaveCount(0)
  await expectCleanPage(page, 'Aufgabe 1')

  // erste Antwort wählen, neu laden: Stand bleibt
  const firstGroup = page.getByTestId('exam-item').first().getByRole('group', { name: 'Antworten' })
  await firstGroup.getByRole('button').first().click()
  await page.reload()
  await expect(page.getByTestId('exam-item').first().locator('[aria-pressed="true"]')).toHaveCount(1)

  // Hilfsmittel: Periodensystem und Formelsammlung als Fenster
  await page.getByRole('button', { name: 'Periodensystem', exact: true }).click()
  const pse = page.getByRole('dialog', { name: 'Periodensystem' })
  await expect(pse.getByRole('cell', { name: /^8\s*O\s*16,0$/ })).toBeVisible()
  await expect(pse.getByRole('cell', { name: /^17\s*Cl\s*35,5$/ })).toBeVisible()
  await pse.getByRole('button', { name: 'Schließen' }).click()
  await expect(pse).toBeHidden()
  await page.getByRole('button', { name: 'Formelsammlung', exact: true }).click()
  const formulas = page.getByRole('dialog', { name: 'Formelsammlung' })
  await expect(formulas.getByText('Ideales Gasgesetz')).toBeVisible()
  await expect(formulas.locator('code.text-red-700')).toHaveCount(0)
  // die Zurück-Taste schließt nur das Fenster
  await page.goBack()
  await expect(formulas).toBeHidden()
  await expect(page.getByRole('heading', { name: /Aufgabe 1: Aufbau der Materie/ })).toBeVisible()

  // springen zu Aufgabe 4 und weiter mit dem Knopf
  await page.getByRole('navigation', { name: 'Aufgaben' }).getByRole('button', { name: /^Aufgabe 4/ }).click()
  await expect(page.getByRole('heading', { name: /Aufgabe 4: Stöchiometrie/ })).toBeVisible()
  await expectCleanPage(page, 'Aufgabe 4')
  await page.getByRole('button', { name: 'Aufgabe 5 →' }).click()
  await expect(page.getByRole('heading', { name: /Aufgabe 5/ })).toBeVisible()

  // unterbrechen fragt nach; die Kachel führt zurück, an dieselbe Stelle
  const url = page.url()
  await page.getByRole('button', { name: 'Klausur unterbrechen' }).click()
  await expect(page.getByText(/die Uhr läuft weiter/)).toBeVisible()
  await page.getByRole('link', { name: 'Unterbrechen' }).click()
  await expect(page).toHaveURL(/#\/$/)
  await page.getByRole('link', { name: /läuft: weiterschreiben/ }).click()
  expect(page.url()).toBe(url)
  await expect(page.getByRole('heading', { name: /Aufgabe 5/ })).toBeVisible()

  // abgeben mit offenen Fragen fragt nach
  await page.getByRole('button', { name: 'Klausur abgeben' }).click()
  await expect(page.getByText(/Fragen offen/)).toBeVisible()
  await page.getByRole('button', { name: 'Ja, abgeben' }).click()
  await expect(page.getByRole('heading', { name: 'Auswertung' })).toBeVisible()
  await expect(page.getByTestId('mock-score')).toHaveText(/^\d+(,5)? von 50 Punkten$/)
  await expect(page.getByTestId('mock-pass')).toContainText('in Teil 2 noch')
  await expect(page.getByText(/Punkte nach dem Schema der App, Teilpunkte geschätzt/)).toBeVisible()
  // fast alles offen: Vorschläge zum Üben mit Link zum Thema
  const hints = page.getByRole('region', { name: 'Das solltest du üben' }).getByRole('link')
  await expect(hints).toHaveCount(3)
  await expectCleanPage(page, 'Auswertung')
  // Einzelheiten je Aufgabe
  await page.getByRole('navigation', { name: 'Aufgaben' }).getByRole('button', { name: /^Aufgabe 3/ }).click()
  await expect(page.getByRole('heading', { name: /Aufgabe 3: Chemische Bindung/ })).toBeVisible()
  await expectCleanPage(page, 'Auswertung Aufgabe 3')
  // neu laden zeigt die Auswertung wieder
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Auswertung' })).toBeVisible()
  // eine neue Probeklausur beginnt auf dem Deckblatt
  await page.getByRole('link', { name: 'Neue Probeklausur' }).first().click()
  await expect(page).toHaveURL(/#\/probeklausur\/chemie$/)
  await expect(page.getByRole('link', { name: /Letzte Auswertung ansehen/ })).toBeVisible()
  // Verlauf mit dieser Klausur
  await expect(page.getByTestId('mock-history').getByRole('listitem')).toHaveCount(1)
  await expect(page.getByText(/^Bestes Ergebnis: /)).toBeVisible()
  await expectCleanPage(page, 'Deckblatt mit Verlauf')
  expect(errors).toEqual([])
})

test('Probeklausur: Zeit um, die App gibt ab; alles richtig gibt 50 Punkte', async ({ page }) => {
  const errors = collectErrors(page)
  const id = 4711
  const exam = chemMockExam(id)
  const answers = Object.fromEntries(exam.tasks.map((t) => [String(t.no), Object.fromEntries([...truthOf(t.task)].map(([item, x]) => [item, x.option.id]))]))
  const session = { subject: 'chemie', id, startedAt: Date.now() - 46 * 60_000, timed: true, answers, current: 2, submittedAt: null, timeUp: false }
  await page.goto('./#/')
  await page.evaluate((s) => localStorage.setItem('rechenweg-probeklausur', JSON.stringify(s)), session)
  await page.goto(`./#/probeklausur/chemie/${id}`)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Auswertung' })).toBeVisible()
  await expect(page.getByText('Die Zeit war um. Die App hat deine Klausur abgegeben.')).toBeVisible()
  await expect(page.getByTestId('mock-score')).toHaveText('50 von 50 Punkten')
  await expect(page.getByTestId('mock-pass')).toHaveText('Damit hast du die 40 Punkte zum Bestehen schon mit Teil 1 zusammen.')
  await expectCleanPage(page, 'Auswertung alles richtig')
  expect(errors).toEqual([])
})

test('Probeklausur: falsch beantwortete Wissensfrage kommt in die Wiederholung', async ({ page }) => {
  const errors = collectErrors(page)
  const id = 4712
  const exam = chemMockExam(id)
  const task1 = exam.tasks[0]
  const item = task1.task.parts.flatMap((p) => p.items).find((i) => i.review)!
  const build = [...truthOf(task1.task)].find(([itemId]) => itemId === item.id)![1].build
  const wrong = build.options.find((o) => o.id !== build.correct)!
  const session = { subject: 'chemie', id, startedAt: Date.now(), timed: true, answers: { '1': { [item.id]: wrong.id } }, current: 1, submittedAt: null, timeUp: false }
  await page.goto('./#/')
  await page.evaluate((s) => localStorage.setItem('rechenweg-probeklausur', JSON.stringify(s)), session)
  await page.goto(`./#/probeklausur/chemie/${id}`)
  await page.reload()
  await page.getByRole('button', { name: 'Klausur abgeben' }).click()
  await page.getByRole('button', { name: 'Ja, abgeben' }).click()
  await expect(page.getByRole('heading', { name: 'Auswertung' })).toBeVisible()
  const reviews = await page.evaluate(() => JSON.parse(localStorage.getItem('rechenweg-wiederholung') ?? '{}') as { items?: Record<string, unknown> })
  expect(Object.keys(reviews.items ?? {})).toEqual([`${item.review!.course}:${Math.floor((item.review!.seed - 500_000) / 50)}`])
  const history = await page.evaluate(() => JSON.parse(localStorage.getItem('rechenweg-probeklausuren') ?? '[]') as { id: number }[])
  expect(history.map((r) => r.id)).toEqual([id])
  expect(errors).toEqual([])
})
