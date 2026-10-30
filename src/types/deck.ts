import type { CardRecord, LeaderCard, LeaderRegulation, CardImageOption } from '@/api/cardsApi'

export interface DeckEntry extends CardImageOption {
  card: CardRecord
  imageUrl: string
  quantity: number
}

export interface DeckDraft {
  id?: number
  code?: string
  name: string
  regulation: LeaderRegulation
  leader: LeaderCard
  leaderSeriesId: string
  leaderImageCode: string
  leaderFileId: number
  leaderImageUrl: string
  entries: DeckEntry[]
}
