import { readCompanyJSON, writeCompanyJSON } from './store'
import type { BattleCard } from '../shared/types'

const CARDS_FILE = 'cards.json'

export function getCards(companyId: string): BattleCard[] {
  return readCompanyJSON<BattleCard[]>(companyId, CARDS_FILE, [])
}

export function saveCard(companyId: string, card: BattleCard): BattleCard {
  const cards = getCards(companyId)
  const idx = cards.findIndex(c => c.id === card.id)
  if (idx >= 0) {
    cards[idx] = { ...card, updatedAt: new Date().toISOString() }
  } else {
    cards.push({
      ...card,
      id: card.id || crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      thumbsUp: card.thumbsUp || 0,
      thumbsDown: card.thumbsDown || 0,
    })
  }
  writeCompanyJSON(companyId, CARDS_FILE, cards)
  return cards[idx >= 0 ? idx : cards.length - 1]
}

export function deleteCard(companyId: string, id: string): void {
  const cards = getCards(companyId).filter(c => c.id !== id)
  writeCompanyJSON(companyId, CARDS_FILE, cards)
}

export function voteCard(companyId: string, id: string, vote: 'up' | 'down'): void {
  const cards = getCards(companyId)
  const card = cards.find(c => c.id === id)
  if (card) {
    if (vote === 'up') card.thumbsUp++
    else card.thumbsDown++
    card.updatedAt = new Date().toISOString()
    writeCompanyJSON(companyId, CARDS_FILE, cards)
  }
}

export function findMatchingCards(companyId: string, text: string): BattleCard[] {
  const cards = getCards(companyId)
  const lower = text.toLowerCase()
  return cards.filter(card =>
    card.triggerKeywords.some(kw => lower.includes(kw.toLowerCase()))
  ).sort((a, b) => (b.thumbsUp - b.thumbsDown) - (a.thumbsUp - a.thumbsDown))
}
