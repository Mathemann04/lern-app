import { type Page, expect, test } from '@playwright/test'

function collectErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  return errors
}

async function expectCleanPage(page: Page, context: string) {
  // Rote Ersatzanzeige erscheint nur, wenn eine Formel nicht gesetzt werden konnte
  await expect(page.locator('code.text-red-700'), context).toHaveCount(0)
  // Nichts ragt seitlich über den Bildschirm hinaus
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow, `${context}: ragt seitlich heraus`).toBeLessThanOrEqual(0)
}

test('Startseite: ohne Kopf und Begrüßung, „Los geht’s", Klausur-Karte, nur Fächer und „Demnächst"', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./')

  // kein Kopf mit Logo und keine Begrüßung mehr (M6)
  await expect(page.getByRole('link', { name: 'Rechenweg' })).toHaveCount(0)
  await expect(page.getByText('Schritt für Schritt selbst lösen')).toHaveCount(0)
  await expect(page.getByRole('heading', { level: 2 })).toHaveText(['Los geht’s', 'Chemie 1 · Klausur Teil 1', 'Fächer'])
  // nur die Fächer mit spielbaren Gebieten als Kacheln, keine Gebiete und kein „kommt bald"
  await expect(page.getByRole('link', { name: /^Mathematik MB1/ })).toHaveAttribute('href', '#/fach/mathe')
  await expect(page.getByRole('link', { name: /^Chemie 1/ })).toHaveAttribute('href', '#/fach/chemie')
  await expect(page.getByRole('link', { name: /^Differentialrechnung/ })).toHaveCount(0)
  await expect(page.getByText('kommt bald')).toHaveCount(0)
  await expect(page.getByText('Demnächst: Werkstoffkunde, Physik, Technische Mechanik')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Erste Aufgabe · geführt' })).toHaveAttribute('href', '#/ueben/ableiten/1')
  await expectCleanPage(page, 'Startseite')

  // Seite Chemie 1: Klausur-Karte, Gebiete, „Themen mischen", Kommendes in einer Zeile, Lernkarten
  await page.getByRole('link', { name: /^Chemie 1/ }).click()
  await expect(page).toHaveURL(/#\/fach\/chemie$/)
  await expect(page.getByRole('heading', { name: 'Chemie 1', level: 1 })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Klausur Teil 1' })).toBeVisible()
  await expect(page.getByRole('link', { name: /^Aufbau der Materie/ })).toHaveAttribute('href', '#/gebiet/chem-materie')
  await expect(page.getByRole('link', { name: /^Themen mischen/ })).toHaveAttribute('href', '#/mischen/chemie')
  await expect(page.getByText('Demnächst: Säuren und Basen, Redox und Elektrochemie')).toBeVisible()
  await expect(page.getByRole('link', { name: /^Säuren und Basen/ })).toHaveCount(0)
  await expect(page.getByRole('link', { name: /^Lernkarten/ }).first()).toBeVisible()
  await expectCleanPage(page, 'Chemie 1')

  // Seite Mathematik MB1: Gebiete ohne Klausur-Karte und ohne Mischung
  await page.goto('./#/fach/mathe')
  await expect(page.getByRole('heading', { name: 'Mathematik MB1', level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: /^Grundlagen/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /^Differentialrechnung/ })).toBeVisible()
  await expect(page.getByRole('region', { name: /Klausur/ })).toHaveCount(0)
  await expect(page.getByRole('link', { name: /^Themen mischen/ })).toHaveCount(0)
  await expect(page.getByText('Demnächst: Integralrechnung')).toBeVisible()
  await expectCleanPage(page, 'Mathematik MB1')
  // Fächer ohne spielbares Gebiet haben keine Seite
  await page.goto('./#/fach/physik')
  await expect(page.getByRole('heading', { level: 2, name: 'Fächer' })).toBeVisible()
  expect(errors).toEqual([])
})

test('Von der Startseite über Fach, Gebiet und Thema zur Aufgabe und zurück', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./')
  await page.getByRole('link', { name: /^Mathematik MB1/ }).click()
  await expect(page).toHaveURL(/#\/fach\/mathe$/)
  await page.getByRole('link', { name: /^Differentialrechnung/ }).click()
  await expect(page).toHaveURL(/#\/gebiet\/differentialrechnung$/)
  await expect(page.getByRole('heading', { name: 'Differentialrechnung', level: 1 })).toBeVisible()
  await expectCleanPage(page, 'Gebiet')

  await page.getByRole('link', { name: /^Ableiten/ }).click()
  await expect(page).toHaveURL(/#\/thema\/ableiten$/)
  await expect(page.getByRole('heading', { name: 'Ableiten', level: 1 })).toBeVisible()
  // Beispiel-Formeln aller fünf Stufen
  expect(await page.locator('.katex').count()).toBeGreaterThanOrEqual(11)
  await expectCleanPage(page, 'Thema')

  await page.getByText('Zwei Regeln kombiniert').click()
  await page.getByRole('link', { name: 'Stufe 3 geführt üben' }).click()
  await expect(page).toHaveURL(/#\/ueben\/ableiten\/3-\d+$/)
  // Die Nummer der Aufgabe steht klein ganz unten, nicht mehr über der Aufgabe
  await expect(page.getByText(/^Stufe 3 · Leite ab/)).toBeVisible()
  const seed = /3-(\d+)$/.exec(page.url())![1]
  await expect(page.getByText(`Aufgabe 3-${seed}`, { exact: true })).toBeVisible()
  // Das X führt zurück zum Thema
  await page.getByRole('link', { name: 'Aufgabe beenden' }).click()
  await expect(page).toHaveURL(/#\/thema\/ableiten$/)

  // „Weitermachen" merkt sich Stufe und Art
  await page.goto('./')
  await expect(page.getByText('Stufe 3: Zwei Regeln kombiniert')).toBeVisible()
  await page.getByRole('link', { name: 'Erste Aufgabe · geführt' }).click()
  await expect(page).toHaveURL(/#\/ueben\/ableiten\/3-\d+$/)
  expect(errors).toEqual([])
})

test('Gelöste Aufgaben: „Weitermachen" mit Fortschritt', async ({ page }) => {
  await page.addInitScript(() => {
    const attempts = [true, false, true].map((clean, i) => ({ level: 4, mode: 'free', clean, at: i }))
    const settings = { explanations: true, detail: 'detailed', derivativeLevel: 4, practiceMode: 'free' }
    localStorage.setItem('rechenweg', JSON.stringify({ version: 2, settings, progress: { attempts, errors: {}, suggestionDismissed: {} } }))
  })
  await page.goto('./')
  const card = page.getByRole('region', { name: 'Weitermachen' })
  await expect(card).toContainText('Stufe 4: Uni-Niveau')
  await expect(card).toContainText('3 gelöst · zuletzt 2 von 3 ohne Fehler')
  await expect(card.getByRole('link', { name: 'Weiter üben · frei' })).toHaveAttribute('href', '#/frei/ableiten/4')
  await card.getByRole('link', { name: 'Stufe oder Art ändern' }).click()
  await expect(page).toHaveURL(/#\/thema\/ableiten$/)
  await expect(page.getByRole('radio', { name: /^Stufe 4/ })).toBeChecked()
})

test('App funktioniert nach dem ersten Besuch auch offline', async ({ page, context }) => {
  await page.goto('./')
  await expect(page.getByTestId('offline-status')).toHaveText('Offline nutzbar ✓', { timeout: 15_000 })

  await context.setOffline(true)
  await page.reload()

  await expect(page.getByRole('link', { name: /^Mathematik MB1/ })).toBeVisible()
  await expect(page.getByTestId('offline-status')).toHaveText('Offline nutzbar ✓')
  await page.getByRole('link', { name: /^Mathematik MB1/ }).click()
  await page.getByRole('link', { name: /^Differentialrechnung/ }).click()
  await page.getByRole('link', { name: /^Ableiten/ }).click()
  await expect(page.locator('.katex').first()).toBeVisible()
  await page.getByRole('link', { name: 'Stufe 1 geführt üben' }).click()
  await expect(page.locator('#question')).toBeVisible()
  // Auch die Seiten, die erst bei Bedarf geladen werden, liegen schon auf dem Gerät
  await page.goto('./#/karten/ableitungen/product')
  await expect(page.getByRole('heading', { name: 'Produktregel', level: 1 })).toBeVisible()
  await page.goto('./#/fortschritt')
  await expect(page.getByRole('heading', { name: 'Dein Fortschritt' })).toBeVisible()
  await page.goto('./#/galerie')
  await expect(page.getByRole('heading', { name: 'Formel-Galerie' })).toBeVisible()
})
