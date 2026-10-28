import { describe, expect, it } from 'vitest'
import { parseRoute, taskHref } from './routes.ts'

describe('parseRoute', () => {
  it('erkennt die Seiten', () => {
    expect(parseRoute('/')).toEqual({ page: 'home' })
    expect(parseRoute('/galerie')).toEqual({ page: 'gallery' })
    expect(parseRoute('/einstellungen')).toEqual({ page: 'settings' })
    expect(parseRoute('/unbekannt')).toEqual({ page: 'home' })
  })

  it('erkennt Übungsaufgaben mit und ohne Nummer', () => {
    expect(parseRoute('/ueben/1')).toEqual({ page: 'practice', level: 1, seed: null })
    expect(parseRoute('/ueben/1-4711')).toEqual({ page: 'practice', level: 1, seed: 4711 })
    expect(parseRoute('/ueben/9')).toEqual({ page: 'home' })
    expect(taskHref({ level: 1, seed: 4711 })).toBe('#/ueben/1-4711')
  })
})
