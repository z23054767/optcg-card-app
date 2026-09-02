import { http } from '@/api/http'

export type LeaderRegulation = 'standard' | 'extra' | 'sealed'

export interface CardRecord {
  cid: number
  cardSpecies: string
  getInfo: string
  seriesId: string
  cardId: string
  cardName: string
  cardType: string
  cost: number | null
  life: number | null
  attribute: string
  power: number
  counter: number
  color: string
  block: string
  feature: string
  effect: string
  fileId?: number
  relatedFileIds: number[]
  isBanned: boolean
  prohibitedWithCardIds: string[]
  deckLimit: { maxCount: number | null } | null
}

export type LeaderCard = CardRecord

export interface PaginatedCards {
  items: CardRecord[]
  page: number
  pageSize: number
  total: number
}

export interface SignedImageUrl {
  fileId: number
  url: string
  expireAt: number
}

export async function getCardColors(): Promise<string[]> {
  const { data } = await http.get<string[]>('/cards/colors')
  return data
}

export async function getLeaderCards(
  regulation: LeaderRegulation,
  color?: string,
): Promise<LeaderCard[]> {
  const { data } = await http.get<LeaderCard[]>('/cards/leaders', {
    params: { regulation, color },
  })
  return data
}

export async function searchCards(input: {
  regulation: LeaderRegulation
  fuzzy?: string
  colors: string[]
  type?: 'CHARACTER' | 'EVENT' | 'STAGE'
  page?: number
  pageSize?: number
}): Promise<PaginatedCards> {
  const { data } = await http.get<PaginatedCards>('/cards', {
    params: {
      ...input,
      colors: input.colors.join(','),
    },
  })
  return data
}

export async function createSignedImageUrls(fileIds: number[]): Promise<SignedImageUrl[]> {
  const { data } = await http.post<SignedImageUrl[]>('/files/images/signed-urls', { fileIds })
  return data
}
