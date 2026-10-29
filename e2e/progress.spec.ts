import { type Page, expect, test } from '@playwright/test'

// Legt vor dem ersten Laden einen Stand im Speicher an (nur einmal, nicht bei jedem Neuladen)
async function seedStorage(page: Page, progress: object, settings: object = {}) {
  const state = {
    version: 2,
    settings: { explanations: true, detail: 'detailed', derivativeLevel: 1, practiceMode: 'guided', ...settings },
    progress: { attempts: [], errors: {}, suggestionDismissed: {}, ...progress },
  }
  await page.addInitScript((text) => {
    if (sessionStorage.getItem('test-seeded')) return
    sessionStorage.setItem('test-seeded', '1')
    localStorage.setItem('rechenweg', text)
  }, JSON.stringify(state))
}

const clean = (level: number, count: number) => Array.from({ length: count }, (_, i) => ({ level, mode: 'guided', clean: true, at: i }))

const answers = (page: Page) => page.getByRole('group', { name: 'Antworten' }).getByRole('button')
const correctFeedback = (page: Page) => page.getByText('Richtig!', { exact: true })
const wrongFeedback = (page: Page) => page.getByText('Nicht ganz. Versuch es noch einmal.')

async function solveWholeTask(page: Page) {
  for (let step = 0; step < 8; step++) {
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

test('Nach 8 von 10 ohne Fehler schlägt die App eine Stufe höher vor', async ({ page }) => {
  await seedStorage(page, { attempts: clean(1, 9) })
  await page.goto('./#/ueben/1-1')
  await solveWholeTask(page)
  const suggestion = page.getByRole('region', { name: 'Eine Stufe höher?' })
  await expect(suggestion).toContainText('Lust auf Stufe 2?')
  await suggestion.getByRole('link', { name: 'Stufe 2 probieren' }).click()
  await expect(page).toHaveURL(/#\/ueben\/2-\d+$/)

  // Gewechselt wird nur auf Knopfdruck; jetzt ist Stufe 2 gewählt
  await page.goto('./#/thema/ableiten')
  await expect(page.getByRole('radio', { name: /^Stufe 2/ })).toBeChecked()
  await expect(page.getByText('10 gelöst')).toBeVisible()
})

test('„Später" blendet den Vorschlag aus', async ({ page }) => {
  await seedStorage(page, { attempts: clean(1, 9) })
  await page.goto('./#/ueben/1-1')
  await solveWholeTask(page)
  await page.getByRole('button', { name: 'Später' }).click()
  await expect(page.getByRole('region', { name: 'Eine Stufe höher?' })).toHaveCount(0)
  await page.getByRole('link', { name: 'Nächste Aufgabe' }).click()
  await solveWholeTask(page)
  await expect(page.getByRole('region', { name: 'Eine Stufe höher?' })).toHaveCount(0)
})

test('Häufigste Fehler mit gezieltem Üben', async ({ page }) => {
  await seedStorage(page, { attempts: clean(2, 3), errors: { 'cos-sign': 3, 'chain-inner-forgotten': 1 } })
  await page.goto('./')
  await page.getByRole('link', { name: 'Fortschritt', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Dein Fortschritt' })).toBeVisible()
  await expect(page.getByRole('listitem', { name: 'Stufe 2' })).toContainText('3 gelöst · zuletzt 3 von 3 ohne Fehler')
  await expect(page.getByRole('listitem', { name: 'Stufe 1' })).toContainText('Noch keine Aufgabe gelöst.')

  const errors = page.getByRole('region', { name: 'Deine häufigsten Fehler' })
  await expect(errors.getByRole('listitem').first()).toContainText('Minuszeichen beim Kosinus vergessen')
  await expect(errors.getByRole('listitem').first()).toContainText('3-mal')
  await errors.getByRole('link', { name: 'Gezielt üben' }).first().click()

  // Der Kosinus kommt erst ab Stufe 2 vor: gezielt geübt wird dort
  await expect(page).toHaveURL(/#\/ueben\/2-\d+\?fokus=cos-sign$/)
  await expect(page.getByText('Gezielt üben: Minuszeichen beim Kosinus vergessen')).toBeVisible()
  await solveWholeTask(page)
  await page.getByRole('link', { name: 'Nächste Aufgabe' }).click()
  await expect(page).toHaveURL(/\?fokus=cos-sign$/)
  await page.getByRole('link', { name: 'Beenden', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Dein Fortschritt' })).toBeVisible()
})

test('Freier Modus zählt Fehler und gelöste Aufgaben', async ({ page }) => {
  await page.goto('./#/frei/2-4')
  await expect(page.locator('math-field[data-ready]')).toBeVisible()
  const enter = (latex: string) =>
    page.evaluate((value) => {
      const field = document.querySelector('math-field') as HTMLElement & { value: string; executeCommand: (c: string) => void }
      field.value = value
      field.executeCommand('commit')
    }, latex)
  await enter('2x\\cos x')
  await expect(page.getByText('Typischer Fehler')).toBeVisible()
  await enter('2x\\sin x+x^2\\cos x')
  await expect(page.getByText('Richtig!', { exact: true })).toBeVisible()

  await page.goto('./#/fortschritt')
  await expect(page.getByRole('listitem', { name: 'Stufe 2' })).toContainText('1 gelöst · zuletzt 0 von 1 ohne Fehler')
  await expect(page.getByRole('region', { name: 'Deine häufigsten Fehler' })).toContainText('Ableitungen der Faktoren multipliziert')

  // Löschen nur nach Rückfrage
  await page.getByRole('button', { name: 'Fortschritt löschen' }).click()
  await page.getByRole('button', { name: 'Ja, löschen' }).click()
  await expect(page.getByRole('listitem', { name: 'Stufe 2' })).toContainText('Noch keine Aufgabe gelöst.')
  await expect(page.getByText('Noch keine Fehler gesammelt.')).toBeVisible()
})
