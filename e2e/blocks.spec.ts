import { type Page, expect, test } from '@playwright/test'
import { REARRANGE_BLOCKS } from '../src/engine/tasks/blocks.ts'
import { indexedBlocks, rearrangePool, rearrangeSeedBlocks } from '../src/engine/tasks/rearrangePick.ts'
import { parseTaskNumber } from '../src/engine/tasks/taskNumber.ts'

// Gleichungen umstellen mit Bausteinen (M6 Schritte 3 und 4): ankreuzen, „nur", „Alle", „Keine", Stufe nach Verschachtelung,
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
const answers = (page: Page) => page.getByRole('group', { name: 'Antworten' }).getByRole('button')
const correctFeedback = (page: Page) => page.getByText('Richtig!', { exact: true })
const wrongFeedback = (page: Page) => page.getByText('Nicht ganz. Versuch es noch einmal.')

async function solveWholeTask(page: Page) {
  for (let step = 0; step < 30; step++) {
    if (await page.getByRole('heading', { name: 'Geschafft!' }).isVisible()) return
    await expect(page.locator('#question')).toBeVisible()
    const count = await answers(page).count()
    for (let i = 0; i < count; i++) {
      const button = answers(page).nth(i)
      if (await button.isDisabled()) continue
      await button.click()
      await correctFeedback(page).or(wrongFeedback(page)).waitFor()
      if (await correctFeedback(page).isVisible()) break
    }
    await page.getByRole('button', { name: /^(Weiter|Ergebnis ansehen)$/ }).click()
  }
  await expect(page.getByRole('heading', { name: 'Geschafft!' })).toBeVisible()
}

// Speicherstand vor dem ersten Laden: nur diese Bausteine angekreuzt, Stufe, gelöste Aufgaben
async function seed(page: Page, keep: readonly string[], level: number, attempts: readonly object[] = []) {
  const skip = REARRANGE_BLOCKS.map((block) => block.id).filter((id) => !keep.includes(id))
  await page.addInitScript(
    ([skipText, levelText, attemptsText]) => {
      if (sessionStorage.getItem('test-seeded')) return
      sessionStorage.setItem('test-seeded', '1')
      const settings = { explanations: true, detail: 'detailed', levels: { umstellen: Number(levelText) }, lastCourse: 'umstellen', practiceMode: 'guided', theme: 'system', skipParts: { umstellen: JSON.parse(skipText) }, mix: {}, lastMix: null }
      localStorage.setItem('rechenweg', JSON.stringify({ version: 3, settings, progress: { attempts: JSON.parse(attemptsText), errors: {}, suggestionDismissed: {} } }))
    },
    [JSON.stringify(skip), String(level), JSON.stringify(attempts)],
  )
}

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
  await expect(page.getByTestId('blocked')).toContainText('Zu deiner Auswahl gibt es in Stufe 1 keine Aufgaben. In Stufe 5 gibt es welche.')
  await expectCleanPage(page, 'gesperrt')

  await page.getByRole('button', { name: 'Stufe 5 wählen' }).click()
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
  await expect(page.getByRole('region', { name: /Weitermachen|Los geht’s/ })).toContainText('1 von 17 Bausteinen angekreuzt')
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

test('Übungsseite ohne Aufgabe zur Auswahl: Hinweis statt einer Aufgabe mit anderen Bausteinen', async ({ page }) => {
  const errors = collectErrors(page)
  // nur Ableitungen: in Stufe 5 gibt es dazu keine Aufgabe allein (z. B. nach einer alten Adresse)
  await seed(page, ['ableitung'], 5)
  await page.goto('./#/ueben/umstellen/5')
  await expect(page.getByRole('heading', { name: 'Gerade gibt es hier keine Aufgabe.' })).toBeVisible()
  // Ableitungen gibt es nur zusammen mit anderen Bausteinen: der Hinweis nennt solche
  await expect(page.getByTestId('no-tasks')).toHaveText(/^Zu deiner Auswahl gibt es in Stufe 5 keine Aufgaben\. Kreuze dazu z\. B\. .+ an\.$/)
  await expect(page).toHaveURL(/#\/ueben\/umstellen\/5$/)
  await page.getByRole('link', { name: 'Zur Auswahl' }).click()
  await expect(page).toHaveURL(/#\/thema\/umstellen$/)
  await expectCleanPage(page, 'Hinweis')
  expect(errors).toEqual([])
})

test('„Eine Stufe höher?", wenn es in der nächsten Stufe Aufgaben zur Auswahl gibt (Brüche gibt es jetzt in jeder Stufe)', async ({ page }) => {
  // neun Aufgaben ohne Fehler in Stufe 3 mit nur Brüchen
  const clean = Array.from({ length: 9 }, (_, i) => ({ course: 'umstellen', level: 3, mode: 'guided', clean: true, at: i + 1 }))
  await seed(page, ['brueche'], 3, clean)
  await page.goto(`./#/ueben/umstellen/3-${rearrangePool(3, new Set(['brueche']))[0]}`)
  await solveWholeTask(page)
  await expect(page.getByRole('link', { name: 'Nächste Aufgabe' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Eine Stufe höher?' })).toBeVisible()
})

test('„nur e-Funktion" in Stufe 1 (M6 Schritt 4): leichte Aufgabe nur mit e-Funktion, Nummer mit Baustein, auch frei', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/thema/umstellen')
  await blocks(page).getByRole('button', { name: 'Nur e-Funktion' }).click()
  await expect(page.getByRole('radio', { name: /^Stufe 1: Einstieg/ })).toBeChecked()
  await expect(start(page)).toHaveText('Stufe 1 geführt üben · 1 Baustein')
  await expect(example(page).locator('.katex').first()).toBeVisible()
  await start(page).click()
  await expect(page).toHaveURL(/#\/ueben\/umstellen\/exp\.1-\d+$/)
  const number = /(exp\.1-\d+)$/.exec(page.url())![1]
  expect(rearrangeSeedBlocks(1, parseTaskNumber(number)!.seed)).toEqual(['exp'])
  await expect(page.getByText(`Aufgabe ${number}`)).toBeVisible()
  await expectCleanPage(page, 'Aufgabe')
  await solveWholeTask(page)
  await page.getByRole('link', { name: 'Nächste Aufgabe' }).click()
  await expect(page).toHaveURL(/#\/ueben\/umstellen\/exp\.1-\d+$/)

  // dieselbe Nummer frei: Tastatur mit e hoch x
  await page.goto(`./#/frei/umstellen/${number}`)
  await expect(page.locator('math-field[data-ready]')).toBeVisible()
  await expectCleanPage(page, 'frei')
  expect(errors).toEqual([])
})

test('Formel aus Technik und Physik (M6 Schritt 4b): Fadenpendel nach g, mit Bedeutung der Zeichen, geführt und frei', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/ueben/umstellen/formel.2-2')
  await expect(page.getByText('Stufe 2 · Löse nach')).toBeVisible()
  await expect(page.getByText(/Schwingungsdauer eines Fadenpendels:/)).toBeVisible()
  await expect(page.getByText(/Alle Größen sind positiv/)).toBeVisible()
  await expect(page.getByText('Aufgabe formel.2-2')).toBeVisible()
  await expectCleanPage(page, 'Formel')
  await solveWholeTask(page)

  // Abklingen beim Entladen eines Kondensators nach t, frei: Tastatur mit den Größen der Formel (auch U_0)
  await page.goto('./#/frei/umstellen/formel.2-24')
  await expect(page.locator('math-field[data-ready]')).toBeVisible()
  await expect(page.getByText(/Entladen eines Kondensators:/)).toBeVisible()
  await expectCleanPage(page, 'Formel frei')
  expect(errors).toEqual([])
})

test('Logarithmen auf beiden Seiten (M6 Schritt 4b-2): geführt bis zum Ergebnis, frei mit ln-Taste', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/ueben/umstellen/logeq.1-1')
  await expect(page.getByText('Stufe 1 · Löse nach')).toBeVisible()
  await expect(page.getByText('Aufgabe logeq.1-1')).toBeVisible()
  await expectCleanPage(page, 'Logarithmen')
  await solveWholeTask(page)

  await page.goto('./#/frei/umstellen/logeq.3-2')
  await expect(page.locator('math-field[data-ready]')).toBeVisible()
  await expectCleanPage(page, 'Logarithmen frei')
  expect(errors).toEqual([])
})
