import type { CardImageOption, SignedImageUrl } from '@/api/cardsApi'

export type SignedCardImageOption = CardImageOption & { url: string }

/** 以當前 fileId 對應簽章網址，保留每張異圖的系列與代碼及 API 選項順序。 */
export function signedCardImageOptions(
  options: CardImageOption[],
  signedImages: SignedImageUrl[],
): SignedCardImageOption[] {
  const urls = new Map(signedImages.map(({ fileId, url }) => [fileId, url]))
  return options.flatMap((option) => {
    const url = urls.get(option.fileId)
    return url ? [{ ...option, url }] : []
  })
}
