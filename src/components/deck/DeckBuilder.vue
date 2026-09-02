<template>
  <main class="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6 lg:px-6">
    <div class="mb-4 flex items-center justify-between gap-3">
      <div class="h-11 w-11 shrink-0" aria-hidden="true"></div>
      <h1 class="text-xl font-bold sm:text-2xl" :class="titleClass">
        {{ isEditing ? '編輯牌組' : '製作牌組' }}
      </h1>
      <div class="h-11 w-11"></div>
    </div>

    <section class="mb-4 rounded-2xl border p-4 sm:p-5" :class="panelClass">
      <label for="deck-name" class="text-sm font-bold" :class="titleClass">牌組名稱</label>
      <input id="deck-name" v-model="deckName" type="text" maxlength="40" placeholder="請輸入牌組名稱"
        class="mt-2 h-11 w-full rounded-xl border px-3 text-sm outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20"
        :class="inputClass" />
      <div class="mt-1.5 flex justify-between gap-3 text-xs" :class="mutedTextClass">
        <span>建立後仍可再次編輯名稱</span>
        <span>{{ deckName.length }}/40</span>
      </div>
    </section>

    <section class="mb-4 overflow-hidden rounded-2xl border" :class="deckPanelClass">
      <div class="flex items-center justify-between border-b px-4 py-3" :class="deckHeaderClass">
        <p class="text-xs font-semibold" :class="deckHintClass">從下方搜尋結果點擊卡片加入主牌</p>
        <button type="button" class="rounded-full px-4 py-2 text-xs font-semibold transition"
          :class="deckSortButtonClass" @click="isSortDialogOpen = true">
          ⇅ 變更排序
        </button>
      </div>

      <div class="grid grid-cols-2 border-b text-center text-sm" :class="deckDividerClass">
        <button type="button" class="border-b-2 px-4 py-3 font-semibold transition"
          :class="activeDeckTab === 'main' ? activeDeckTabClass : inactiveDeckTabClass" @click="activeDeckTab = 'main'">
          主牌 {{ mainDeckCount }}/50
        </button>
        <button type="button" class="border-b-2 px-4 py-3 font-semibold transition"
          :class="activeDeckTab === 'leader' ? activeDeckTabClass : inactiveDeckTabClass"
          @click="activeDeckTab = 'leader'">
          領航卡
        </button>
      </div>

      <div class="h-56 overflow-y-auto overscroll-contain p-4" style="overflow-anchor: none">
        <div v-if="activeDeckTab === 'leader'" class="grid grid-cols-3 gap-3 sm:grid-cols-5 md:grid-cols-7">
          <button type="button"
            class="group relative rounded-xl p-1 text-left transition hover:-translate-y-0.5 hover:ring-2 hover:ring-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            :class="selectedDeckCardClass" @click="openLeaderArtPicker">
            <img :src="currentLeaderImageUrl" :alt="leader.cardName" class="aspect-5/7 w-full rounded-lg object-contain"
              @error="refreshImage(currentLeaderFileId)" />
            <span
              class="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full px-1 text-xs font-extrabold shadow-lg ring-2"
              :class="quantityBadgeClass">1</span>
            <p class="mt-1 truncate px-1 text-center text-[10px] font-semibold" :class="titleClass">
              點擊更換圖片
            </p>
          </button>
        </div>

        <div v-else-if="deckEntries.length" class="grid grid-cols-3 gap-3 sm:grid-cols-5 md:grid-cols-7">
          <button v-for="entry in deckEntries" :key="entry.card.cid" type="button"
            class="relative rounded-xl p-1 text-left transition hover:-translate-y-0.5 hover:ring-2 hover:ring-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            :class="selectedDeckCardClass" @click="openDeckCardDetail(entry)">
            <img :src="entry.imageUrl" :alt="entry.card.cardName" class="aspect-5/7 w-full rounded-lg object-contain"
              @error="refreshImage(entry.fileId)" />
            <span
              class="absolute -right-1 -top-1 flex h-8 min-w-8 items-center justify-center rounded-full px-1.5 text-sm font-extrabold shadow-lg ring-2"
              :class="quantityBadgeClass">
              {{ entry.quantity }}
            </span>
            <span v-if="entry.card.isBanned"
              class="absolute bottom-7 right-1 rounded-md bg-red-600 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white shadow-lg">
              Banned
            </span>
            <p class="mt-1 truncate px-1 text-center text-[10px] font-semibold" :class="titleClass">
              {{ entry.card.cardId }}
            </p>
          </button>
        </div>

        <div v-else class="flex min-h-40 items-center justify-center text-center text-sm" :class="mutedTextClass">
          尚未加入主牌，從下方搜尋結果點擊卡片即可加入。
        </div>
      </div>
    </section>

    <section class="overflow-hidden rounded-2xl border" :class="panelClass">
      <div class="border-b p-4 sm:p-5" :class="[sectionBorderClass, searchHeaderClass]">
        <div class="mb-4 flex items-start justify-between gap-3">
          <div class="flex items-center gap-2.5">
            <span class="flex h-9 w-9 items-center justify-center rounded-xl" :class="searchIconClass">
              <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2"
                aria-hidden="true">
                <circle cx="11" cy="11" r="7"></circle>
                <path d="m20 20-4-4"></path>
              </svg>
            </span>
            <div>
              <h2 class="text-base font-bold" :class="titleClass">搜尋卡片</h2>
              <p class="mt-0.5 text-xs" :class="mutedTextClass">依名稱、卡號、類型或顏色尋找卡片</p>
            </div>
          </div>
          <span class="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold" :class="resultCountClass">
            {{ totalResults }} 張
          </span>
        </div>

        <form class="flex overflow-hidden rounded-xl border transition-colors" :class="searchBoxClass"
          @submit.prevent="runSearch">
          <span class="flex w-12 shrink-0 items-center justify-center" :class="mutedTextClass">
            <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2"
              aria-hidden="true">
              <circle cx="11" cy="11" r="7"></circle>
              <path d="m20 20-4-4"></path>
            </svg>
          </span>
          <label class="sr-only" for="deck-card-search">卡片搜尋</label>
          <input id="deck-card-search" v-model.trim="searchQuery" type="search" placeholder="輸入卡片名稱或卡號..."
            class="min-w-0 flex-1 bg-transparent py-3.5 pr-3 pl-2 text-sm outline-none placeholder:text-slate-400" />
          <button type="submit"
            class="m-1.5 flex shrink-0 items-center justify-center rounded-lg px-4 text-sm font-bold transition"
            :class="searchButtonClass">
            搜尋
          </button>
        </form>

        <div class="mt-4 grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-end">
          <label class="block">
            <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider" :class="mutedTextClass">
              卡片類型
            </span>
            <span class="relative block">
              <select v-model="selectedType"
                class="h-10 w-full appearance-none rounded-xl border py-0 pl-3 pr-10 text-xs font-semibold outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20"
                :class="inputClass" aria-label="卡片類型" @change="runSearch">
                <option value="">全部類型</option>
                <option value="CHARACTER">角色卡</option>
                <option value="EVENT">事件卡</option>
                <option value="STAGE">場地卡</option>
              </select>
              <svg viewBox="0 0 20 20" class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2"
                :class="mutedTextClass" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd"
                  d="M5.22 7.22a.75.75 0 0 1 1.06 0L10 10.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.28a.75.75 0 0 1 0-1.06Z"
                  clip-rule="evenodd" />
              </svg>
            </span>
          </label>

          <div>
            <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider" :class="mutedTextClass">
              顏色
            </span>
            <div class="flex flex-wrap gap-2" role="group" aria-label="搜尋顏色">
              <button type="button"
                class="inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-bold transition"
                :class="colorButtonClass(null)" @click="setColor(null)">
                <span class="h-2.5 w-2.5 rounded-full bg-linear-to-br from-rose-500 via-emerald-500 to-blue-500"></span>
                ALL
              </button>
              <button v-for="color in leaderColors" :key="color" type="button"
                class="inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-bold transition"
                :class="colorButtonClass(color)" @click="setColor(color)">
                <span class="h-2.5 w-2.5 rounded-full ring-1 ring-black/10" :class="colorDotClass(color)"></span>
                {{ color }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div ref="searchResultsScroll"
        class="max-h-[52vh] overflow-y-auto overscroll-contain p-3 sm:max-h-[56vh] sm:p-4 lg:max-h-155"
        :class="searchResultsClass">
        <div v-if="isLoading" class="py-14 text-center">
          <div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-rose-500 border-t-transparent"></div>
          <p class="mt-3 text-sm" :class="mutedTextClass">正在搜尋卡片...</p>
        </div>
        <div v-else-if="searchError" class="py-12 text-center text-sm text-red-500">
          {{ searchError }}
        </div>
        <div v-else-if="searchResults.length === 0" class="py-12 text-center text-sm" :class="mutedTextClass">
          找不到符合條件的卡片。
        </div>
        <div v-else class="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          <article v-for="card in searchResults" :key="card.cid"
            class="group relative overflow-hidden rounded-xl border text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:border-rose-500 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            :class="[infoCardClass, deckQuantity(card.cid) ? selectedSearchCardClass : '']">
            <button type="button" class="block w-full text-left focus-visible:outline-none"
              :aria-label="`加入 ${card.cardName}`" @click="addCard(card)">
              <div class="relative aspect-5/7 bg-slate-950/10">
                <img v-if="cardImageUrlByCid.get(card.cid)" :src="cardImageUrlByCid.get(card.cid)"
                  :alt="`${card.cardName} (${card.cardId})`"
                  class="h-full w-full object-contain transition group-hover:scale-[1.02]" loading="lazy"
                  @error="card.fileId === undefined ? undefined : refreshImage(card.fileId)" />
                <div v-else class="flex h-full items-center justify-center text-xs" :class="mutedTextClass">無圖片</div>
                <div
                  class="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-black/70 to-transparent">
                </div>
                <span
                  class="absolute bottom-1.5 left-1.5 rounded-md bg-black/65 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
                  {{ cardTypeLabel(card.cardType) }}
                </span>
                <span v-if="card.isBanned"
                  class="absolute bottom-1.5 right-1.5 rounded-md bg-red-600 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white shadow-lg">
                  Banned
                </span>
              </div>
              <div class="p-2">
                <div class="truncate text-[10px] font-bold" :class="titleClass">{{ card.cardId }}</div>
                <div class="mt-0.5 truncate text-[10px]" :class="mutedTextClass">{{ card.cardName }}</div>
              </div>
            </button>
            <span v-if="deckQuantity(card.cid)"
              class="pointer-events-none absolute left-1 top-1 flex h-7 min-w-7 items-center justify-center rounded-full px-1.5 text-sm font-extrabold shadow-lg ring-2"
              :class="quantityBadgeClass">
              {{ deckQuantity(card.cid) }}
            </span>
            <button type="button"
              class="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-white/90 text-indigo-600 shadow-[0_4px_14px_rgba(15,23,42,0.35)] backdrop-blur-md transition duration-200 hover:scale-110 hover:border-indigo-200 hover:bg-indigo-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-900 active:scale-95"
              :aria-label="`查看 ${card.cardName} 詳細資訊`" title="查看詳細資訊" @click="openSearchCardDetail(card)">
              <svg viewBox="0 0 24 24" class="h-4.5 w-4.5" fill="none" stroke="currentColor" stroke-width="2.25"
                stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9"></circle>
                <path d="M12 11v5"></path>
                <path d="M12 8h.01"></path>
              </svg>
            </button>
          </article>
        </div>

        <div ref="loadSentinel" class="h-1" aria-hidden="true"></div>
        <div v-if="isLoadingMore" class="py-5 text-center">
          <div class="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-rose-500 border-t-transparent"></div>
          <p class="mt-2 text-xs" :class="mutedTextClass">正在載入更多卡片...</p>
        </div>
      </div>
    </section>

    <div class="sticky bottom-0 mt-4 grid grid-cols-1 gap-3 bg-inherit py-4 sm:grid-cols-[1fr_1fr_1.4fr]">
      <button type="button" class="rounded-full border px-5 py-3.5 text-sm font-bold transition"
        :class="returnToDecksButtonClass" @click="emit('close')">
        回到我的牌組
      </button>
      <button type="button"
        class="rounded-full bg-slate-200 px-5 py-3.5 text-sm font-bold text-slate-900 transition hover:bg-slate-300"
        @click="emit('cancel')">
        取消
      </button>
      <button type="button"
        class="rounded-full border px-5 py-3.5 text-sm font-bold transition active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        :class="primaryActionButtonClass" :disabled="mainDeckCount === 0" @click="confirmDeck">
        {{ isEditing ? '編輯完畢' : '製作' }}（{{ mainDeckCount }}/50）
      </button>
    </div>

    <div v-if="detailCard"
      class="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-slate-950/75 sm:items-center sm:p-4"
      role="dialog" aria-modal="true" aria-labelledby="deck-card-detail-title" @click.self="closeDeckCardDetail">
      <div
        class="flex max-h-[96dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border shadow-2xl sm:max-h-[94vh] sm:rounded-3xl"
        :class="panelClass">
        <header class="relative shrink-0 px-5 pb-3 pt-5 text-center">
          <h2 id="deck-card-detail-title" class="text-xl font-bold" :class="titleClass">卡牌詳細資訊</h2>
          <button type="button"
            class="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full text-3xl font-light leading-none transition"
            :class="dialogCloseButtonClass" aria-label="關閉卡牌詳細資訊" @click="closeDeckCardDetail">
            ×
          </button>
        </header>

        <div class="min-h-0 flex-1 overflow-y-auto px-5 pb-5 sm:px-8">
          <div class="mx-auto mt-4 aspect-5/7 w-full max-w-xs overflow-hidden rounded-xl bg-slate-950/10">
            <div v-if="isPreviewImageLoading" class="flex h-full items-center justify-center">
              <div class="h-8 w-8 animate-spin rounded-full border-2 border-rose-500 border-t-transparent"></div>
            </div>
            <img v-else-if="!previewImageError" :key="previewImageUrl" :src="previewImageUrl"
              :alt="`${detailCard.cardName} (${detailCard.cardId})`" class="h-full w-full object-contain"
              @error="detailFileId === null ? undefined : refreshImage(detailFileId)" />
            <div v-else class="flex h-full items-center justify-center px-5 text-center text-sm text-red-500">
              {{ previewImageError }}
            </div>
          </div>

          <div v-if="activeDeckEntry && !isPreviewImageLoading && !previewImageError && cardArtOptions.length > 1"
            class="mt-5">
            <div class="mb-2 flex items-center justify-between gap-3">
              <p class="text-sm font-bold" :class="titleClass">選擇圖片版本</p>
              <span class="text-xs" :class="mutedTextClass">{{ cardArtOptions.length }} 張圖片</span>
            </div>
            <div class="grid grid-cols-3 gap-2 sm:grid-cols-4">
              <button v-for="art in cardArtOptions" :key="art.fileId" type="button"
                class="relative overflow-hidden rounded-xl border p-1 transition hover:-translate-y-0.5 hover:border-rose-500 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                :class="pendingCardFileId === art.fileId ? selectedLeaderArtClass : infoCardClass"
                :aria-pressed="pendingCardFileId === art.fileId" @click="selectCardArt(art)">
                <img :src="art.url" :alt="`${activeDeckEntry.card.cardName} 圖片版本`"
                  class="aspect-5/7 w-full rounded-lg object-contain" loading="lazy"
                  @error="refreshImage(art.fileId)" />
                <span v-if="pendingCardFileId === art.fileId"
                  class="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-rose-500 px-2 py-0.5 text-[9px] font-bold text-white shadow">
                  已選擇
                </span>
              </button>
            </div>
          </div>

          <div class="mt-5">
            <h3 class="text-xl font-bold sm:text-2xl" :class="titleClass">
              {{ detailCard.cardName }}
            </h3>
            <p class="mt-1 text-base font-bold" :class="titleClass">{{ detailCard.cardId }}</p>
          </div>

          <div class="mt-5 overflow-hidden rounded-xl border" :class="sectionBorderClass">
            <button type="button"
              class="flex w-full items-center justify-between px-5 py-4 text-left text-base font-semibold transition"
              :class="detailToggleClass" :aria-expanded="isCardDetailOpen"
              @click="isCardDetailOpen = !isCardDetailOpen">
              詳細資訊
              <span class="text-2xl font-light transition" :class="isCardDetailOpen ? 'rotate-45' : ''">＋</span>
            </button>
            <dl v-if="isCardDetailOpen" class="grid grid-cols-2 gap-x-5 gap-y-3 border-t px-5 py-4 text-sm"
              :class="sectionBorderClass">
              <div>
                <dt :class="mutedTextClass">類型</dt>
                <dd class="mt-1 font-medium">{{ detailCard.cardType }}</dd>
              </div>
              <div>
                <dt :class="mutedTextClass">顏色</dt>
                <dd class="mt-1 font-medium">{{ detailCard.color }}</dd>
              </div>
              <div>
                <dt :class="mutedTextClass">費用</dt>
                <dd class="mt-1 font-medium">{{ detailCard.cost ?? '—' }}</dd>
              </div>
              <div>
                <dt :class="mutedTextClass">力量</dt>
                <dd class="mt-1 font-medium">{{ detailCard.power }}</dd>
              </div>
              <div>
                <dt :class="mutedTextClass">反擊</dt>
                <dd class="mt-1 font-medium">{{ detailCard.counter }}</dd>
              </div>
              <div>
                <dt :class="mutedTextClass">擴張記號</dt>
                <dd class="mt-1 font-medium">{{ detailCard.block }}</dd>
              </div>
              <div class="col-span-2">
                <dt :class="mutedTextClass">特徵</dt>
                <dd class="mt-1 font-medium">{{ detailCard.feature || '—' }}</dd>
              </div>
              <div class="col-span-2">
                <dt :class="mutedTextClass">效果</dt>
                <dd class="mt-1 whitespace-pre-line leading-6">{{ detailCard.effect || '—' }}</dd>
              </div>
            </dl>
          </div>
        </div>

        <footer v-if="activeDeckEntry" class="shrink-0 border-t p-4 sm:px-8" :class="sectionBorderClass">
          <div class="mb-4 flex items-center justify-center gap-8">
            <button type="button"
              class="flex h-12 w-12 items-center justify-center rounded-full border text-2xl transition disabled:cursor-not-allowed disabled:opacity-40"
              :class="quantityControlClass" :disabled="editingQuantity <= 1" @click="editingQuantity -= 1">−</button>
            <strong class="min-w-8 text-center text-xl" :class="titleClass">{{ editingQuantity }}</strong>
            <button type="button"
              class="flex h-12 w-12 items-center justify-center rounded-full border text-2xl transition disabled:cursor-not-allowed disabled:opacity-40"
              :class="quantityControlClass" :disabled="editingQuantity >= maximumEditingQuantity"
              @click="editingQuantity += 1">＋</button>
          </div>
          <div class="grid grid-cols-[0.8fr_1.2fr] gap-3">
            <button type="button" class="rounded-full px-5 py-3.5 text-sm font-bold transition"
              :class="removeCardButtonClass" @click="removeActiveDeckCard">
              刪除
            </button>
            <button type="button"
              class="rounded-full border px-5 py-3.5 text-sm font-bold transition active:translate-y-px"
              :class="primaryActionButtonClass" @click="applyDeckCardChanges">
              變更
            </button>
          </div>
        </footer>
        <footer v-else class="shrink-0 border-t p-4 sm:px-8" :class="sectionBorderClass">
          <button type="button"
            class="w-full rounded-full border px-5 py-3.5 text-sm font-bold transition active:translate-y-px"
            :class="primaryActionButtonClass" @click="closeDeckCardDetail">
            關閉
          </button>
        </footer>
      </div>
    </div>

    <div v-if="isLeaderArtPickerOpen"
      class="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-slate-950/75 sm:items-center sm:p-4"
      role="dialog" aria-modal="true" aria-labelledby="leader-art-picker-title" @click.self="closeLeaderArtPicker">
      <div
        class="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border shadow-2xl sm:rounded-3xl"
        :class="panelClass">
        <header class="relative shrink-0 border-b px-5 py-5 text-center" :class="sectionBorderClass">
          <h2 id="leader-art-picker-title" class="text-xl font-bold" :class="titleClass">選擇領航卡圖片</h2>
          <p class="mt-1 text-xs" :class="mutedTextClass">{{ leader.cardName }}・{{ leader.cardId }}</p>
          <button type="button"
            class="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-3xl font-light leading-none text-white transition hover:bg-slate-800"
            aria-label="關閉領航卡圖片選擇" @click="closeLeaderArtPicker">
            ×
          </button>
        </header>

        <div class="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <div v-if="isLeaderArtLoading" class="py-16 text-center">
            <div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-rose-500 border-t-transparent">
            </div>
            <p class="mt-3 text-sm" :class="mutedTextClass">正在載入領航卡圖片...</p>
          </div>
          <div v-else-if="leaderArtError" class="py-14 text-center text-sm text-red-500">
            {{ leaderArtError }}
          </div>
          <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            <button v-for="art in leaderArtOptions" :key="art.fileId" type="button"
              class="group relative overflow-hidden rounded-xl border p-1 transition hover:-translate-y-0.5 hover:border-rose-500 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              :class="pendingLeaderFileId === art.fileId ? selectedLeaderArtClass : infoCardClass"
              :aria-pressed="pendingLeaderFileId === art.fileId" @click="pendingLeaderFileId = art.fileId">
              <img :src="art.url" :alt="`${leader.cardName} 圖片版本`" class="aspect-5/7 w-full rounded-lg object-contain"
                loading="lazy" @error="refreshImage(art.fileId)" />
              <span v-if="pendingLeaderFileId === art.fileId"
                class="absolute right-2 top-2 rounded-full bg-rose-500 px-2 py-1 text-[10px] font-bold text-white shadow">
                已選擇
              </span>
            </button>
          </div>
        </div>

        <footer class="grid shrink-0 grid-cols-[0.8fr_1.2fr] gap-3 border-t p-4 sm:px-6" :class="sectionBorderClass">
          <button type="button" class="rounded-full px-5 py-3.5 text-sm font-bold transition"
            :class="cancelPickerButtonClass" @click="closeLeaderArtPicker">
            取消
          </button>
          <button type="button"
            class="rounded-full border px-5 py-3.5 text-sm font-bold transition active:translate-y-px disabled:opacity-50"
            :class="primaryActionButtonClass" :disabled="pendingLeaderFileId === null" @click="applyLeaderArt">
            套用圖片
          </button>
        </footer>
      </div>
    </div>

    <DeckSortDialog v-if="isSortDialogOpen" @close="isSortDialogOpen = false" @select="applyDeckSort" />
  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

import {
  createSignedImageUrls,
  searchCards,
  type CardRecord,
  type LeaderCard,
  type LeaderRegulation,
  type SignedImageUrl,
} from '@/api/cardsApi'
import { resolveApiError } from '@/api/resolveApiError'
import DeckSortDialog from '@/components/deck/DeckSortDialog.vue'
import { usePreferencesStore } from '@/stores/preferencesStore'
import type { DeckDraft, DeckEntry } from '@/types/deck'
import { showConfirmAlert, showToast } from '@/utils/alerts'
import { sortDeckEntries, type DeckSortOption } from '@/utils/deckSort'

const props = defineProps<{
  deckId?: number
  deckName?: string
  leader: LeaderCard
  leaderFileId: number
  leaderImageUrl: string
  regulation: LeaderRegulation
  initialEntries?: DeckEntry[]
}>()

const emit = defineEmits<{
  cancel: []
  close: []
  confirm: [draft: DeckDraft]
}>()

const PAGE_SIZE = 50
const preferences = usePreferencesStore()
const deckName = ref(props.deckName ?? '')
const searchQuery = ref('')
const selectedColor = ref<string | null>(null)
const selectedType = ref<'' | 'CHARACTER' | 'EVENT' | 'STAGE'>('')
const searchResults = ref<CardRecord[]>([])
const cardImageUrlByCid = ref(new Map<number, string>())
const currentPage = ref(1)
const totalResults = ref(0)
const isLoading = ref(false)
const isLoadingMore = ref(false)
const searchError = ref('')
const deckEntries = ref<DeckEntry[]>(
  (props.initialEntries ?? []).map((entry) => ({ ...entry, card: { ...entry.card } })),
)
const activeDeckTab = ref<'main' | 'leader'>('main')
const currentLeaderFileId = ref(props.leaderFileId)
const currentLeaderImageUrl = ref(props.leaderImageUrl)
const isLeaderArtPickerOpen = ref(false)
const isSortDialogOpen = ref(false)
const isLeaderArtLoading = ref(false)
const leaderArtError = ref('')
const pendingLeaderFileId = ref<number | null>(null)
const leaderArtOptions = ref<Array<{ fileId: number; url: string }>>([])
const activeDeckEntryCid = ref<number | null>(null)
const readonlySearchCard = ref<CardRecord | null>(null)
const editingQuantity = ref(1)
const isCardDetailOpen = ref(false)
const isPreviewImageLoading = ref(false)
const previewImageError = ref('')
const previewImageUrl = ref('')
const pendingCardFileId = ref<number | null>(null)
const cardArtOptions = ref<Array<{ fileId: number; url: string }>>([])
const loadSentinel = ref<HTMLElement | null>(null)
const searchResultsScroll = ref<HTMLElement | null>(null)
let loadObserver: IntersectionObserver | null = null
let previewRequestId = 0
let leaderArtRequestId = 0
let signedImageRefreshTimer: number | null = null
let isRefreshingSignedImages = false
const signedImageExpiryByFileId = new Map<number, number>()

const leaderColors = computed(() => props.leader.color.split('/').filter(Boolean))
const mainDeckCount = computed(() =>
  deckEntries.value.reduce((total, entry) => total + entry.quantity, 0),
)
const isEditing = computed(() => props.deckId !== undefined)
const canLoadMore = computed(() => currentPage.value * PAGE_SIZE < totalResults.value)
const activeDeckEntry = computed(() =>
  deckEntries.value.find(({ card }) => card.cid === activeDeckEntryCid.value),
)
const detailCard = computed(() => readonlySearchCard.value ?? activeDeckEntry.value?.card ?? null)
const detailFileId = computed(
  () => readonlySearchCard.value?.fileId ?? activeDeckEntry.value?.fileId ?? null,
)
const maximumEditingQuantity = computed(() => {
  if (!activeDeckEntry.value) return 1
  const otherCardsCount = mainDeckCount.value - activeDeckEntry.value.quantity
  return Math.max(1, 50 - otherCardsCount)
})


async function fetchCards(page: number, append: boolean): Promise<void> {
  if (append) {
    isLoadingMore.value = true
  } else {
    isLoading.value = true
  }
  searchError.value = ''

  try {
    const result = await searchCards({
      regulation: props.regulation,
      fuzzy: searchQuery.value || undefined,
      colors: selectedColor.value ? [selectedColor.value] : leaderColors.value,
      type: selectedType.value || undefined,
      page,
      pageSize: PAGE_SIZE,
    })
    const candidates = result.items.filter((card) => card.cardType !== 'LEADER')
    const nextCards = append ? [...searchResults.value, ...candidates] : candidates
    const uniqueCards = new Map(nextCards.map((card) => [card.cid, card]))
    searchResults.value = [...uniqueCards.values()]
    currentPage.value = page
    totalResults.value = result.total

    const unsignedCards = searchResults.value.filter(
      (card) => card.fileId !== undefined && !cardImageUrlByCid.value.has(card.cid),
    )
    const signedUrls = unsignedCards.length
      ? await createSignedImageUrls(unsignedCards.flatMap((card) => (card.fileId === undefined ? [] : [card.fileId])))
      : []
    registerSignedImages(signedUrls)
    const urlByFileId = new Map(signedUrls.map(({ fileId, url }) => [fileId, url]))
    const nextImageUrls = new Map(cardImageUrlByCid.value)
    unsignedCards.forEach((card) => {
      if (card.fileId === undefined) return
      const url = urlByFileId.get(card.fileId)
      if (url) nextImageUrls.set(card.cid, url)
    })
    cardImageUrlByCid.value = nextImageUrls
  } catch (error) {
    searchError.value = resolveApiError(error)
  } finally {
    if (append) {
      isLoadingMore.value = false
    } else {
      isLoading.value = false
    }
  }
}

async function runSearch(): Promise<void> {
  cardImageUrlByCid.value = new Map()
  await fetchCards(1, false)
}

async function loadMore(): Promise<void> {
  if (!canLoadMore.value || isLoading.value || isLoadingMore.value) return
  await fetchCards(currentPage.value + 1, true)
}

async function setColor(color: string | null): Promise<void> {
  if (selectedColor.value === color) return
  selectedColor.value = color
  await runSearch()
}

function deckQuantity(cid: number): number {
  return deckEntries.value.find((entry) => entry.card.cid === cid)?.quantity ?? 0
}

function addCard(card: CardRecord): void {
  if (card.cardType === 'LEADER' || mainDeckCount.value >= 50) return
  const existing = deckEntries.value.find((entry) => entry.card.cid === card.cid)
  if (existing) {
    if (existing.quantity < 50 && mainDeckCount.value < 50) existing.quantity += 1
    return
  }

  const imageUrl = cardImageUrlByCid.value.get(card.cid)
  if (!imageUrl || card.fileId === undefined) return
  deckEntries.value.push({ card, fileId: card.fileId, imageUrl, quantity: 1 })
}

async function openDeckCardDetail(entry: DeckEntry): Promise<void> {
  const requestId = ++previewRequestId
  readonlySearchCard.value = null
  activeDeckEntryCid.value = entry.card.cid
  editingQuantity.value = entry.quantity
  isCardDetailOpen.value = false
  isPreviewImageLoading.value = true
  previewImageError.value = ''
  previewImageUrl.value = entry.imageUrl
  pendingCardFileId.value = entry.fileId
  cardArtOptions.value = []

  try {
    const fileIds = Array.from(
      new Set([
        entry.fileId,
        ...(entry.card.fileId === undefined ? [] : [entry.card.fileId]),
        ...entry.card.relatedFileIds,
      ]),
    )
    const signedImages = await createSignedImageUrls(fileIds)
    if (requestId !== previewRequestId) return
    registerSignedImages(signedImages)
    if (!signedImages.length) {
      previewImageError.value = '找不到這張卡片的圖片。'
      return
    }
    cardArtOptions.value = signedImages.map(({ fileId, url }) => ({ fileId, url }))
    const selectedArt = cardArtOptions.value.find(({ fileId }) => fileId === entry.fileId)
    if (!selectedArt) {
      previewImageError.value = '找不到目前選擇的圖片版本。'
      return
    }
    previewImageUrl.value = selectedArt.url
  } catch (error) {
    if (requestId !== previewRequestId) return
    previewImageError.value = resolveApiError(error)
  } finally {
    if (requestId === previewRequestId) isPreviewImageLoading.value = false
  }
}

async function openSearchCardDetail(card: CardRecord): Promise<void> {
  const requestId = ++previewRequestId
  activeDeckEntryCid.value = null
  readonlySearchCard.value = card
  isCardDetailOpen.value = false
  isPreviewImageLoading.value = true
  previewImageError.value = ''
  previewImageUrl.value = cardImageUrlByCid.value.get(card.cid) ?? ''
  pendingCardFileId.value = card.fileId ?? null
  cardArtOptions.value = []

  if (card.fileId === undefined) {
    previewImageError.value = '找不到這張卡片的圖片。'
    isPreviewImageLoading.value = false
    return
  }

  try {
    const [signedImage] = await createSignedImageUrls([card.fileId])
    if (requestId !== previewRequestId) return
    if (!signedImage) {
      previewImageError.value = '找不到這張卡片的圖片。'
      return
    }
    registerSignedImages([signedImage])
    previewImageUrl.value = signedImage.url
  } catch (error) {
    if (requestId !== previewRequestId) return
    previewImageError.value = resolveApiError(error)
  } finally {
    if (requestId === previewRequestId) isPreviewImageLoading.value = false
  }
}

function closeDeckCardDetail(): void {
  previewRequestId += 1
  activeDeckEntryCid.value = null
  readonlySearchCard.value = null
  isCardDetailOpen.value = false
  previewImageError.value = ''
  previewImageUrl.value = ''
  pendingCardFileId.value = null
  cardArtOptions.value = []
}

function applyDeckCardChanges(): void {
  if (!activeDeckEntry.value || pendingCardFileId.value === null) return
  activeDeckEntry.value.quantity = editingQuantity.value
  activeDeckEntry.value.fileId = pendingCardFileId.value
  activeDeckEntry.value.imageUrl = previewImageUrl.value
  closeDeckCardDetail()
}

function selectCardArt(art: { fileId: number; url: string }): void {
  pendingCardFileId.value = art.fileId
  previewImageUrl.value = art.url
}

function removeActiveDeckCard(): void {
  const index = deckEntries.value.findIndex(({ card }) => card.cid === activeDeckEntryCid.value)
  if (index < 0) return
  deckEntries.value.splice(index, 1)
  closeDeckCardDetail()
}

function handleEscape(event: KeyboardEvent): void {
  if (event.key !== 'Escape') return
  if (isSortDialogOpen.value) {
    isSortDialogOpen.value = false
  } else if (isLeaderArtPickerOpen.value) {
    closeLeaderArtPicker()
  } else if (detailCard.value) {
    closeDeckCardDetail()
  }
}

async function openLeaderArtPicker(): Promise<void> {
  const requestId = ++leaderArtRequestId
  isLeaderArtPickerOpen.value = true
  isLeaderArtLoading.value = true
  leaderArtError.value = ''
  pendingLeaderFileId.value = currentLeaderFileId.value

  try {
    const fileIds = Array.from(
      new Set([
        currentLeaderFileId.value,
        ...(props.leader.fileId === undefined ? [] : [props.leader.fileId]),
        ...props.leader.relatedFileIds,
      ]),
    )
    const signedImages = await createSignedImageUrls(fileIds)
    if (requestId !== leaderArtRequestId) return
    registerSignedImages(signedImages)
    leaderArtOptions.value = signedImages.map(({ fileId, url }) => ({ fileId, url }))
    if (!leaderArtOptions.value.length) {
      leaderArtError.value = '找不到此領航卡的圖片。'
    }
  } catch (error) {
    if (requestId !== leaderArtRequestId) return
    leaderArtError.value = resolveApiError(error)
  } finally {
    if (requestId === leaderArtRequestId) isLeaderArtLoading.value = false
  }
}

function closeLeaderArtPicker(): void {
  leaderArtRequestId += 1
  isLeaderArtPickerOpen.value = false
  pendingLeaderFileId.value = null
  leaderArtError.value = ''
}

function applyLeaderArt(): void {
  const selectedArt = leaderArtOptions.value.find(({ fileId }) => fileId === pendingLeaderFileId.value)
  if (!selectedArt) return
  currentLeaderFileId.value = selectedArt.fileId
  currentLeaderImageUrl.value = selectedArt.url
  closeLeaderArtPicker()
}

function activeSignedImageFileIds(): number[] {
  return Array.from(
    new Set([
      currentLeaderFileId.value,
      ...deckEntries.value.map(({ fileId }) => fileId),
      ...searchResults.value.flatMap(({ fileId }) => (fileId === undefined ? [] : [fileId])),
      ...cardArtOptions.value.map(({ fileId }) => fileId),
      ...leaderArtOptions.value.map(({ fileId }) => fileId),
    ]),
  )
}

function registerSignedImages(images: SignedImageUrl[]): void {
  if (!images.length) return
  const urlByFileId = new Map(images.map(({ fileId, url }) => [fileId, url]))
  images.forEach(({ fileId, expireAt }) => signedImageExpiryByFileId.set(fileId, expireAt))

  const currentLeaderUrl = urlByFileId.get(currentLeaderFileId.value)
  if (currentLeaderUrl) currentLeaderImageUrl.value = currentLeaderUrl
  deckEntries.value.forEach((entry) => {
    const url = urlByFileId.get(entry.fileId)
    if (url) entry.imageUrl = url
  })
  const nextSearchUrls = new Map(cardImageUrlByCid.value)
  searchResults.value.forEach((card) => {
    if (card.fileId === undefined) return
    const url = urlByFileId.get(card.fileId)
    if (url) nextSearchUrls.set(card.cid, url)
  })
  cardImageUrlByCid.value = nextSearchUrls
  cardArtOptions.value = cardArtOptions.value.map((art) => ({
    ...art,
    url: urlByFileId.get(art.fileId) ?? art.url,
  }))
  leaderArtOptions.value = leaderArtOptions.value.map((art) => ({
    ...art,
    url: urlByFileId.get(art.fileId) ?? art.url,
  }))
  if (pendingCardFileId.value !== null) {
    previewImageUrl.value = urlByFileId.get(pendingCardFileId.value) ?? previewImageUrl.value
  }
  scheduleSignedImageRefresh()
}

function scheduleSignedImageRefresh(delayOverride?: number): void {
  if (signedImageRefreshTimer !== null) window.clearTimeout(signedImageRefreshTimer)
  const expirations = activeSignedImageFileIds().flatMap((fileId) => {
    const expireAt = signedImageExpiryByFileId.get(fileId)
    return expireAt === undefined ? [] : [expireAt]
  })
  if (!expirations.length) return

  const refreshAt = Math.min(...expirations) * 1000 - 60_000
  const delay = delayOverride ?? Math.max(1_000, refreshAt - Date.now())
  signedImageRefreshTimer = window.setTimeout(() => void refreshActiveSignedImages(), delay)
}

async function refreshActiveSignedImages(fileIds = activeSignedImageFileIds()): Promise<void> {
  if (!fileIds.length || isRefreshingSignedImages) return
  isRefreshingSignedImages = true
  try {
    registerSignedImages(await createSignedImageUrls(fileIds))
  } catch (error) {
    showToast(resolveApiError(error), { variant: 'error', title: '圖片更新失敗' })
    scheduleSignedImageRefresh(15_000)
  } finally {
    isRefreshingSignedImages = false
  }
}

function refreshImage(fileId: number): void {
  void refreshActiveSignedImages([fileId])
}

function applyDeckSort(options: DeckSortOption[]): void {
  deckEntries.value = sortDeckEntries(deckEntries.value, options)
  isSortDialogOpen.value = false
}

async function confirmDeck(): Promise<void> {
  const normalizedDeckName = deckName.value.trim()
  if (!normalizedDeckName) {
    showToast('請輸入牌組名稱。', { variant: 'error', title: '無法完成牌組' })
    return
  }
  if (mainDeckCount.value === 0) return
  if (mainDeckCount.value < 50) {
    const result = await showConfirmAlert(
      `目前主牌只有 ${mainDeckCount.value} 張，尚未達到 50 張。仍要繼續嗎？`,
      {
        title: '牌組尚未滿 50 張',
        confirmButtonText: props.deckId === undefined ? '仍要製作' : '仍要完成編輯',
        cancelButtonText: '繼續補牌',
      },
    )
    if (!result.isConfirmed) return
  }

  emit('confirm', {
    id: props.deckId,
    name: normalizedDeckName,
    regulation: props.regulation,
    leader: props.leader,
    leaderFileId: currentLeaderFileId.value,
    leaderImageUrl: currentLeaderImageUrl.value,
    entries: deckEntries.value.map((entry) => ({ ...entry, card: { ...entry.card } })),
  })
}

const titleClass = computed(() => (preferences.isDark ? 'text-slate-100' : 'text-slate-900'))
const mutedTextClass = computed(() => (preferences.isDark ? 'text-slate-400' : 'text-slate-500'))
const panelClass = computed(() =>
  preferences.isDark ? 'border-white/10 bg-slate-900/70' : 'border-slate-200 bg-white shadow-sm',
)
const sectionBorderClass = computed(() => (preferences.isDark ? 'border-white/10' : 'border-slate-200'))
const infoCardClass = computed(() =>
  preferences.isDark ? 'border-white/10 bg-slate-900' : 'border-slate-200 bg-white',
)

const deckPanelClass = computed(() =>
  preferences.isDark
    ? 'border-rose-400/35 bg-slate-900 shadow-[0_0_0_1px_rgba(251,113,133,0.06)]'
    : 'border-rose-200 bg-white shadow-sm',
)
const deckHeaderClass = computed(() =>
  preferences.isDark ? 'border-white/10 bg-rose-500/10' : 'border-rose-100 bg-rose-50',
)
const deckHintClass = computed(() =>
  preferences.isDark ? 'text-rose-300' : 'text-rose-700',
)
const deckSortButtonClass = computed(() =>
  preferences.isDark
    ? 'bg-white/10 text-slate-100 hover:bg-white/15'
    : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50',
)
const deckDividerClass = computed(() =>
  preferences.isDark ? 'border-white/10 bg-slate-950/30' : 'border-slate-200 bg-slate-50/70',
)
const activeDeckTabClass = computed(() =>
  preferences.isDark ? 'border-rose-400 bg-rose-500/10 text-rose-300' : 'border-rose-500 bg-rose-50 text-rose-700',
)
const inactiveDeckTabClass = computed(() =>
  preferences.isDark
    ? 'border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200'
    : 'border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800',
)
const quantityBadgeClass = computed(() =>
  preferences.isDark
    ? 'bg-rose-500 text-white ring-slate-950'
    : 'bg-slate-950 text-white ring-white',
)
const selectedSearchCardClass = computed(() =>
  preferences.isDark
    ? 'border-rose-400 ring-2 ring-rose-400/70 shadow-[0_0_18px_rgba(251,113,133,0.2)]'
    : 'border-rose-500 ring-2 ring-rose-200',
)
const selectedDeckCardClass = computed(() =>
  preferences.isDark ? 'bg-white/5 ring-1 ring-white/10' : 'bg-slate-50 ring-1 ring-slate-200',
)
const primaryActionButtonClass = computed(() =>
  preferences.isDark
    ? 'border-rose-400/40 bg-rose-500 text-white shadow-sm enabled:hover:bg-rose-400'
    : 'border-rose-600 bg-rose-600 text-white shadow-sm enabled:hover:border-rose-700 enabled:hover:bg-rose-700',
)
const returnToDecksButtonClass = computed(() =>
  preferences.isDark
    ? 'border-indigo-400 bg-indigo-500 text-white shadow-sm hover:border-indigo-300 hover:bg-indigo-400'
    : 'border-indigo-600 bg-indigo-600 text-white shadow-sm hover:border-indigo-700 hover:bg-indigo-700',
)
const detailToggleClass = computed(() =>
  preferences.isDark ? 'bg-slate-950 text-white hover:bg-slate-800' : 'bg-slate-950 text-white hover:bg-slate-800',
)
const quantityControlClass = computed(() =>
  preferences.isDark
    ? 'border-white/20 bg-slate-800 text-white hover:bg-slate-700'
    : 'border-slate-300 bg-white text-slate-900 hover:bg-slate-100',
)
const removeCardButtonClass = computed(() =>
  preferences.isDark
    ? 'bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white'
    : 'bg-red-50 text-red-600 hover:bg-red-100',
)
const selectedLeaderArtClass = computed(() =>
  preferences.isDark
    ? 'border-rose-400 bg-rose-500/10 ring-2 ring-rose-400/70'
    : 'border-rose-500 bg-rose-50 ring-2 ring-rose-200',
)
const cancelPickerButtonClass = computed(() =>
  preferences.isDark
    ? 'bg-slate-800 text-slate-100 hover:bg-slate-700'
    : 'bg-slate-100 text-slate-800 hover:bg-slate-200',
)

const inputClass = computed(() =>
  preferences.isDark ? 'border-white/15 bg-slate-950 text-white' : 'border-slate-300 bg-white text-slate-700',
)
const searchBoxClass = computed(() =>
  preferences.isDark
    ? 'border-white/10 bg-slate-950/80 text-white shadow-inner shadow-black/20 focus-within:border-rose-400/70 focus-within:ring-2 focus-within:ring-rose-400/10'
    : 'border-slate-300 bg-white text-slate-900 shadow-sm focus-within:border-rose-400 focus-within:ring-2 focus-within:ring-rose-100',
)
const searchButtonClass = computed(() =>
  preferences.isDark
    ? 'bg-rose-500 text-white shadow-sm hover:bg-rose-400'
    : 'bg-rose-600 text-white shadow-sm hover:bg-rose-700',
)
const searchHeaderClass = computed(() =>
  preferences.isDark
    ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/25'
    : 'bg-gradient-to-br from-white via-white to-rose-50/80',
)
const searchIconClass = computed(() =>
  preferences.isDark ? 'bg-rose-500/15 text-rose-300' : 'bg-rose-100 text-rose-600',
)
const resultCountClass = computed(() =>
  preferences.isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-600',
)
const searchResultsClass = computed(() =>
  preferences.isDark ? 'bg-slate-950/25' : 'bg-slate-50/70',
)

const dialogCloseButtonClass = computed(() =>
  preferences.isDark
    ? 'bg-slate-950 text-white hover:bg-slate-800'
    : 'bg-white text-slate-950 ring-1 ring-slate-200 shadow-sm hover:bg-slate-100',
)

function colorButtonClass(color: string | null): string {
  if (selectedColor.value === color) {
    return preferences.isDark
      ? 'border-rose-400 bg-rose-500 text-white shadow-sm shadow-rose-950/30'
      : 'border-rose-600 bg-rose-600 text-white shadow-sm'
  }
  return preferences.isDark
    ? 'border-white/10 bg-slate-950/50 text-slate-300 hover:border-rose-400 hover:bg-white/5'
    : 'border-slate-200 bg-white text-slate-700 shadow-sm hover:border-rose-400 hover:bg-rose-50'
}

function colorDotClass(color: string): string {
  const classes: Record<string, string> = {
    // 紅
    紅: "bg-red-500",
    赤: "bg-red-500",
    Red: "bg-red-500",

    // 綠
    綠: "bg-emerald-500",
    緑: "bg-emerald-500",
    Green: "bg-emerald-500",

    // 藍 / 青
    藍: "bg-blue-500",
    青: "bg-blue-500",
    Blue: "bg-blue-500",

    // 紫
    紫: "bg-purple-500",
    Purple: "bg-purple-500",

    // 黃
    黃: "bg-yellow-400",
    黄: "bg-yellow-400",
    Yellow: "bg-yellow-400",

    // 黑
    黑: "bg-slate-900",
    黒: "bg-slate-900",
    Black: "bg-slate-900",
  }

  return classes[color.trim()] ?? "bg-slate-400"
}

function cardTypeLabel(cardType: string): string {
  const labels: Record<string, string> = {
    CHARACTER: '角色',
    EVENT: '事件',
    STAGE: '場地',
  }
  return labels[cardType] ?? cardType
}

onMounted(async () => {
  window.addEventListener('keydown', handleEscape)
  await Promise.all([runSearch(), refreshActiveSignedImages()])
  await nextTick()

  loadObserver = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) void loadMore()
    },
    { root: searchResultsScroll.value, rootMargin: '300px 0px' },
  )
  if (loadSentinel.value) loadObserver.observe(loadSentinel.value)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleEscape)
  loadObserver?.disconnect()
  if (signedImageRefreshTimer !== null) window.clearTimeout(signedImageRefreshTimer)
})
</script>
