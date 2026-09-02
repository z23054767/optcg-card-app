import type { CardRecord, LeaderCard, LeaderRegulation } from '@/api/cardsApi'

export interface DeckEntry {
  card: CardRecord
  fileId: number
  imageUrl: string
  quantity: number
}

export interface DeckDraft {
  id?: number
  code?: string
  name: string
  regulation: LeaderRegulation
  leader: LeaderCard
  leaderFileId: number
  leaderImageUrl: string
  entries: DeckEntry[]
}
