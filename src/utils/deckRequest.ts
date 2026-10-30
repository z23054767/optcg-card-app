import type { CreateDeckRequest } from '@/api/deckApi'
import type { DeckDraft, DeckEntry } from '@/types/deck'

/** 儲存穩定的系列及異圖代碼；簽章網址與 fileId 僅留在畫面狀態。 */
export function toDeckRequest(
  draft: DeckDraft,
  code: string,
  entries: DeckEntry[] = draft.entries,
): CreateDeckRequest {
  return {
    code,
    name: draft.name,
    regulation: draft.regulation,
    leaderCardId: draft.leader.cardId,
    leaderSeriesId: draft.leaderSeriesId,
    leaderImageCode: draft.leaderImageCode,
    cards: entries.map(({ card, quantity, seriesId, imageCode }) => ({
      cardId: card.cardId,
      quantity,
      seriesId,
      imageCode,
    })),
  }
}
