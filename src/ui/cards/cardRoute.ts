import { cardById, topicById } from '../../engine/explain/cards.ts'
import { cardFolderHref } from '../routes.ts'

// Welche Lernkarten-Seite zu einer Adresse gehört. Unbekanntes führt eine Ebene höher.
export type CardPage = { readonly kind: 'folders' } | { readonly kind: 'folder'; readonly topic: string } | { readonly kind: 'card'; readonly id: string }

export function resolveCardPage(folder: string | null, card: string | null): CardPage {
  if (folder === null) return { kind: 'folders' }
  if (card !== null) return cardById(card)?.topic === folder ? { kind: 'card', id: card } : resolveCardPage(folder, null)
  if (topicById(folder)) return { kind: 'folder', topic: folder }
  // ältere Adresse ohne Ordner, z. B. #/karten/product
  if (cardById(folder)) return { kind: 'card', id: folder }
  return { kind: 'folders' }
}

export const cardHref = (id: string) => `${cardFolderHref(cardById(id)!.topic)}/${id}`
