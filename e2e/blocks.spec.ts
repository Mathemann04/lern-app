import { type Page, expect, test } from '@playwright/test'
import { indexedBlocks } from '../src/engine/tasks/rearrangePick.ts'

// Gleichungen umstellen mit Bausteinen (M6 Schritt 3): ankreuzen, „nur", „Alle", „Keine", Stufe nach Verschachtelung,
// Beispiel aus der Auswahl, gesperrter Knopf mit Hinweis, Aufgaben nur aus den angekreuzten Bausteinen

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

const blocks = (page: Page) => page.getByRole('region', { name: 'Was soll drankommen?' })
const box = (page: Page, title: string) => blocks(page).getByRole('checkbox', { name: title, exact: true })
const start = (page: Page) => page.getByRole('link', { name: /geführt üben ·/ })
const blockedStart = (page: Page) => page.getByRole('button', { name: /geführt üben ·/ })
const example = (page: Page) => page.getByTestId('example')

test('Seite „Gleichungen umstellen": Bausteine in Gruppen, Stufen, Beispiel, alles angekreuzt', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/thema/umstellen')
  await expect(page.getByRole('heading', { name: 'Gleichungen umstellen', level: 1 })).toBeVisible()
  await expect(blocks(page).getByRole('heading', { level: 3 })).toHaveText(['Grundlagen', 'Funktionen', 'Aus späteren Kapiteln'])
  await expect(blocks(page).getByRole('checkbox')).toHaveCount(17)
  for (const checkbox of await blocks(page).getByRole('checkbox').all()) await expect(checkbox).toBeChecked()
  // in Stufe 1 gibt es nur lineare Gleichungen: die übrigen blass mit „erst ab"
  await expect(blocks(page).getByText('erst ab Stufe 5')).toHaveCount(8)
  await expect(page.getByRole('radio', { name: /^Stufe 1: Einstieg/ })).toBeChecked()
  await expect(start(page)).toHaveText('Stufe 1 geführt üben · alle Bausteine')
  await expect(example(page).locator('.katex').first()).toBeVisible()
  await expectCleanPage(page, 'Tätigkeit')
  expect(errors).toEqual([])
})

test('„nur Determinanten": in Stufe 1 gesperrt mit Hinweis, Stufe 5 wählen, Aufgabe nur mit Determinante', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/thema/umstellen')
  await blocks(page).getByRole('button', { name: 'Nur Determinanten' }).click()
  await expect(box(page, 'Determinanten')).toBeChecked()
  await expect(box(page, 'Brüche')).not.toBeChecked()
  await expect(blockedStart(page)).toBeDisabled()
  await expect(page.getByTestId('blocked')).toContainText('Determinanten gibt es erst ab Stufe 5.')
  await expectCleanPage(page, 'gesperrt')

  await page.getByRole('button', { name: 'Stufe 5 wählen: dort gibt es Aufgaben dazu' }).click()
  await expect(page.getByRole('radio', { name: /^Stufe 5/ })).toBeChecked()
  await expect(start(page)).toHaveText('Stufe 5 geführt üben · 1 Baustein')
  await expect(example(page)).toContainText('det')
  await page.getByRole('button', { name: 'Anderes Beispiel' }).click()
  await expect(example(page)).toContainText('det')

  // die Auswahl bleibt nach dem Neuladen und zeigt sich bei „Weitermachen"
  await page.reload()
  await expect(box(page, 'Determinanten')).toBeChecked()
  await expect(box(page, 'Integrale')).not.toBeChecked()

  await start(page).click()
  await expect(page).toHaveURL(/#\/ueben\/umstellen\/5-\d+$/)
  const seed = Number(/5-(\d+)$/.exec(page.url())![1])
  expect(indexedBlocks(5, seed)).toEqual(['det'])
  await expect(page.getByText('Stufe 5 · Löse nach')).toBeVisible()
  await expectCleanPage(page, 'Aufgabe')

  await page.goto('./')
  await expect(page.getByRole('region', { name: /Weitermachen|Los geht’s/ })).toContainText('1 von 16 Bausteinen angekreuzt')
  expect(errors).toEqual([])
})

test('„Keine", ein Baustein, der allein nicht reicht, und „Alle"', async ({ page }) => {
  await page.goto('./#/thema/umstellen')
  await blocks(page).getByRole('button', { name: 'Keine' }).click()
  for (const checkbox of await blocks(page).getByRole('checkbox').all()) await expect(checkbox).not.toBeChecked()
  await expect(blockedStart(page)).toBeDisabled()
  await expect(page.getByTestId('blocked')).toHaveText('Kreuze mindestens einen Baustein an.')

  // Ableitungen gibt es in Stufe 5 nur zusammen mit anderen Bausteinen: Der Hinweis nennt, was man dazunehmen kann
  await page.getByRole('radio', { name: /^Stufe 5/ }).check({ force: true })
  await box(page, 'Ableitungen').check()
  await expect(page.getByTestId('blocked')).toContainText('Zu deiner Auswahl gibt es in Stufe 5 keine Aufgaben. Kreuze dazu z. B.')
  await box(page, 'e-Funktion').check()
  await box(page, 'Quadratische Gleichungen').check()
  await box(page, 'Grenzwerte').check()
  await expect(start(page)).toBeEnabled()

  await blocks(page).getByRole('button', { name: 'Alle' }).click()
  await expect(start(page)).toHaveText('Stufe 5 geführt üben · alle Bausteine')
})
