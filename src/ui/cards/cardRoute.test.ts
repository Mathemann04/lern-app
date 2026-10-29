import { describe, expect, it } from 'vitest'
import { parseRoute } from '../routes.ts'
import { cardHref, resolveCardPage } from './cardRoute.ts'

const page = (path: string) => {
  const route = parseRoute(path)
  if (route.page !== 'cards') throw new Error(`${path} ist keine Lernkarten-Seite`)
  return resolveCardPage(route.folder, route.card)
}

describe('resolveCardPage', () => {
  it('erkennt die Lernkarten mit Ordnern, Unbekanntes führt eine Ebene höher', () => {
    expect(page('/karten')).toEqual({ kind: 'folders' })
    expect(page('/karten/ableitungen')).toEqual({ kind: 'folder', topic: 'ableitungen' })
    expect(page('/karten/ableitungen/product')).toEqual({ kind: 'card', id: 'product' })
    expect(page('/karten/ableitungen/gibt-es-nicht')).toEqual({ kind: 'folder', topic: 'ableitungen' })
    expect(page('/karten/gibt-es-nicht/product')).toEqual({ kind: 'folders' })
    expect(page('/karten/gibt-es-nicht')).toEqual({ kind: 'folders' })
    // ältere Adresse ohne Ordner
    expect(page('/karten/product')).toEqual({ kind: 'card', id: 'product' })
    expect(cardHref('sin-cos')).toBe('#/karten/ableitungen/sin-cos')
  })
})
