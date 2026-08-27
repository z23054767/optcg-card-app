import { http } from '@/api/http'
import type { LeaderRegulation } from '@/api/cardsApi'
import type { CardRecord } from '@/api/cardsApi'

export interface CreateDeckRequest {
  code: string
  regulation: LeaderRegulation
  leaderCid: number
  leaderFileId: number
  cards: {
    cid: number
    quantity: number
    fileId: number
  }[]
}

export interface CreatedDeckResponse {
  id: number
  code: string
  createdAt: string
}

export interface DeckListItem {
  id: number
  code: string
  regulation: LeaderRegulation
  leaderCid: number
  leaderCardId: string
  leaderCardName: string
  leaderFileId?: number
  totalCards: number
  createdAt: string
}

export interface DeckDetail {
  id: number
  code: string
  regulation: LeaderRegulation
  leader: CardRecord
  cards: Array<{
    card: CardRecord
    quantity: number
  }>
}

export async function getMyDecks(): Promise<DeckListItem[]> {
  const { data } = await http.get<{ decks: DeckListItem[] }>('/decks')
  return data.decks
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
