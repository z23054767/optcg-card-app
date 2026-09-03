import { http } from '@/api/http'
import type { LeaderRegulation } from '@/api/cardsApi'
import type { CardRecord } from '@/api/cardsApi'

export interface CreateDeckRequest {
  code: string
  name: string
  regulation: LeaderRegulation
  leaderCid: number
  leaderFileId: number
  cards: {
    cid: number
    quantity: number
    fileId: number
  }[]
}

export type DeckLegalityViolation =
  | { type: 'banned_card'; cardIds: string[] }
  | { type: 'prohibited_combination'; cardIds: [string, string] }
  | { type: 'card_count_limit'; cardId: string; quantity: number; maxCount: number }
  | { type: 'deck_card_count'; quantity: number; requiredCount: number }

export interface CreatedDeckResponse {
  id: number
  code: string
  name: string
  isLegal: boolean
  violations: DeckLegalityViolation[]
  createdAt: string
}

export interface DeckListItem {
  id: number
  code: string
  name: string
  regulation: LeaderRegulation
  leaderCid: number
  leaderCardId: string
  leaderCardName: string
  leaderFileId?: number
  totalCards: number
  isLegal: boolean
  createdAt: string
}

export interface DeckDetail {
  id: number
  code: string
  name: string
  regulation: LeaderRegulation
  isLegal: boolean
  leader: CardRecord
  cards: Array<{
    card: CardRecord
    quantity: number
  }>
}

export type ImportedDeckDetail = Omit<DeckDetail, 'id' | 'code'>

export interface PaginatedDecks {
  items: DeckListItem[]
  page: number
  pageSize: number
  total: number
}

export async function getMyDecks(
  regulation?: LeaderRegulation,
  page = 1,
  pageSize = 6,
): Promise<PaginatedDecks> {
  const { data } = await http.get<PaginatedDecks>('/decks', {
    params: { regulation, page, pageSize },
  })
  return data
}

export async function getMyDeck(deckId: number): Promise<DeckDetail> {
  const { data } = await http.get<DeckDetail>(`/decks/${deckId}`)
  return data
}

export async function createDeck(input: CreateDeckRequest): Promise<CreatedDeckResponse> {
  const { data } = await http.post<CreatedDeckResponse>('/decks', input)
  return data
}

export async function updateDeck(
  deckId: number,
  input: CreateDeckRequest,
): Promise<CreatedDeckResponse> {
  const { data } = await http.put<CreatedDeckResponse>(`/decks/${deckId}`, input)
  return data
}

export async function deleteDeck(deckId: number): Promise<void> {
  await http.delete(`/decks/${deckId}`)
}

export async function copyDeck(deckId: number): Promise<CreatedDeckResponse> {
  const { data } = await http.post<CreatedDeckResponse>(`/decks/${deckId}/copy`)
  return data
}

export async function importDeckByCode(code: string): Promise<ImportedDeckDetail> {
  const { data } = await http.post<ImportedDeckDetail>('/decks/import', { code })
  return data
}
