import { describe, expect, it } from 'vitest'
import { ERRORS_BY_COURSE } from '../errorCatalog.ts'
import { planRearrangeTask } from '../guided/rearrangePlan.ts'
import { createRng } from '../random/rng.ts'
import { findRearrangeTaskWithError } from './rearrangeFocus.ts'
import { REARRANGE_TEMPLATES, generateRearrangeTask, likelyRearrangeTemplate } from './rearrangeTerms.ts'

// Gezieltes Üben beim Umstellen (M3, Schritt 9): Lernkarte und Fortschritt bieten „Gezielt üben" für jeden
// typischen Fehler des Themas an (auch die aus „Brüche" beim Zusammenfassen); zu jedem findet sich eine Aufgabe,
// in der er im geführten Modus als Antwort erscheint.

const ids = ERRORS_BY_COURSE.umstellen.map((e) => e.id).sort()

describe('Gezieltes Üben beim Umstellen', () => {
  it.each(ids)(
    '%s',
    (id) => {
      const ref = findRearrangeTaskWithError(id, [1, 2, 3, 4, 5], createRng(`test:${id}`))
      expect(ref, id).not.toBeNull()
      const plan = planRearrangeTask(ref!, id)
      expect(plan.steps.some((s) => s.choices.some((c) => c.errorRuleId === id)), `${id} in ${ref!.level}-${ref!.seed}`).toBe(true)
    },
    60_000,
  )

  // Die seltensten Fehler (in ihrer Vorlage nur in wenigen Prozent der Aufgaben): mit jedem Zufall
  it.each(['eq-arg-quotient-sign', 'eq-root-termwise', 'eq-ln-of-sum', 'eq-series-start', 'eq-int-derived', 'frac-distribute-first-only'])(
    '%s: findet ihn mit jedem Zufall',
    (id) => {
      for (let run = 0; run < 4; run++) expect(findRearrangeTaskWithError(id, [5, 4, 3, 2, 1], createRng(`zuverlässig:${id}:${run}`)), `${id} Lauf ${run}`).not.toBeNull()
    },
    240_000,
  )

  it('sucht Fehler mit eigener Vorlage nur in deren Stufen; findet nichts, wo es sie nicht gibt', () => {
    // Betrag gibt es nur in Stufe 5
    expect(findRearrangeTaskWithError('eq-abs-root', [1, 2, 3], createRng('test'))).toBeNull()
    expect(findRearrangeTaskWithError('eq-abs-root', [2, 5], createRng('test'))?.level).toBe(5)
  })

  it('jede Vorlage nennt nur bekannte Fehler; die schnelle Wahl der Vorlage trifft meist die tatsächliche', () => {
    const known = new Set(ids)
    for (const t of REARRANGE_TEMPLATES) for (const id of t.focus ?? []) expect(known.has(id), `${t.id}: ${id}`).toBe(true)
    let same = 0
    for (let seed = 1; seed <= 200; seed++) {
      const ref = { level: 5 as const, seed }
      if (likelyRearrangeTemplate(ref) === generateRearrangeTask(ref).template) same++
    }
    expect(same).toBeGreaterThanOrEqual(190)
  })
})
