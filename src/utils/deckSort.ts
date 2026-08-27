import type { DeckEntry } from '@/types/deck'

export type DeckSortOption =
  | 'color-asc'
  | 'color-desc'
  | 'cost-desc'
  | 'cost-asc'
  | 'type-asc'
  | 'type-desc'

export interface DeckSortChoice {
  value: DeckSortOption
  label: string
  description: string
}

export const DECK_SORT_GROUPS: Array<{ label: string; choices: DeckSortChoice[] }> = [
  {
    label: '卡片種類排序',
    choices: [
      { value: 'type-asc', label: '正序', description: '角色→事件→場地' },
      { value: 'type-desc', label: '反序', description: '場地→事件→角色' },
    ],
  },
  {
    label: '費用排序',
    choices: [
      { value: 'cost-asc', label: '由小至大', description: '低費用卡片優先' },
      { value: 'cost-desc', label: '由大至小', description: '高費用卡片優先' },
    ],
  },
  {
    label: '顏色排序',
    choices: [
      { value: 'color-asc', label: '正序', description: '顏色由前至後' },
      { value: 'color-desc', label: '反序', description: '顏色由後至前' },
    ],
  },
]

const CARD_TYPE_ORDER: Record<string, number> = {
  CHARACTER: 0,
  EVENT: 1,
  STAGE: 2,
}

export function sortDeckEntries(entries: DeckEntry[], options: DeckSortOption[]): DeckEntry[] {
  return [...entries].sort((left, right) => {
    for (const option of options) {
      const direction = option.endsWith('-desc') ? -1 : 1
      let difference = 0
      if (option.startsWith('color-')) {
        difference = left.card.color.localeCompare(right.card.color, 'zh-Hant')
      } else if (option.startsWith('cost-')) {
        difference = (left.card.cost ?? 0) - (right.card.cost ?? 0)
      } else {
        difference =
          (CARD_TYPE_ORDER[left.card.cardType] ?? Number.MAX_SAFE_INTEGER) -
          (CARD_TYPE_ORDER[right.card.cardType] ?? Number.MAX_SAFE_INTEGER)
      }
      if (difference) return difference * direction
    }

    return left.card.cardId.localeCompare(right.card.cardId, 'en', { numeric: true })
  })
}
