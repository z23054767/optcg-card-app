<template>
  <div class="min-h-screen transition-colors duration-200" :class="pageClass">
    <AppHeader />

    <DeckBuilder v-if="isDeckBuilderOpen && selectedLeader" :leader="selectedLeader.leader"
      :leader-file-id="deckDraft?.leaderFileId ?? selectedLeader.fileId"
      :leader-image-url="deckDraft?.leaderImageUrl ?? selectedLeader.url" :regulation="selectedRegulation!"
      :deck-id="deckDraft?.id" :deck-name="deckDraft?.name" :initial-entries="deckDraft?.entries"
      @cancel="closeDeckBuilder" @confirm="confirmDeck" />

    <DeckConfirmation v-else-if="deckDraft" :draft="deckDraft" @edit="editDeck" @saved="handleDeckSaved"
      @close="returnToDeckList" />

    <main v-else class="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8">
      <section class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div class="min-w-0 space-y-4">
          <article class="rounded-2xl border" :class="panelClass">
            <div class="border-b p-4 sm:p-5" :class="sectionBorderClass">
              <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div class="min-w-0">
                  <div class="inline-flex items-center gap-2 rounded-lg px-2.5 py-1 text-xs font-semibold"
                    :class="statusBadgeClass">
                    <span aria-hidden="true">🃏</span>
                    牌組建立器
                  </div>
                  <h2 class="mt-3 text-xl font-semibold tracking-tight sm:text-2xl" :class="titleClass">
                    我的牌組
                  </h2>
                  <p class="mt-2 max-w-3xl text-sm leading-6" :class="textClass">
                    {{ PRODUCT_COPY.deckSpaceSummary }}
                  </p>
                </div>

                <div class="flex shrink-0 flex-col gap-2 sm:flex-row">
                  <button type="button" :disabled="isLoading"
                    class="inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60"
                    :class="primaryButtonClass" @click="openRegulationDialog">
                    ＋ 建立牌組
                  </button>
                  <RouterLink to="/chat"
                    class="inline-flex h-10 items-center justify-center rounded-lg border px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:hidden"
                    :class="secondaryButtonClass">
                    前往聊天
                  </RouterLink>
                </div>
              </div>
            </div>

            <div class="p-4 sm:p-5">
              <div class="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 class="text-sm font-semibold" :class="titleClass">我的牌組</h3>
                  <p class="mt-0.5 text-xs" :class="mutedTextClass">
                    之後建立的牌組會集中顯示在這裡。
                  </p>
                </div>
                <span class="rounded-md px-2 py-1 text-xs font-medium" :class="countBadgeClass">
                  {{ totalDecks }} 副牌組
                </span>
              </div>

              <template v-if="!selectedRegulation">
                <div v-if="isDeckListLoading" class="rounded-xl border px-4 py-12 text-center" :class="emptyStateClass">
                  <div
                    class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent">
                  </div>
                  <p class="mt-4 text-sm font-medium" :class="titleClass">正在載入我的牌組...</p>
                </div>

                <div v-else-if="deckListError"
                  class="rounded-xl border border-red-300 bg-red-50 px-4 py-8 text-center text-sm text-red-700">
                  <p>{{ deckListError }}</p>
                  <button type="button" class="mt-3 font-semibold underline" @click="reloadMyDecks()">
                    重新載入
                  </button>
                </div>

                <div v-else>
                  <label class="mb-3 block sm:hidden">
                    <span class="sr-only">牌組賽制篩選</span>
                    <div class="relative">
                      <select
                        class="w-full appearance-none rounded-lg border px-3 py-2 pr-12 text-sm font-semibold outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                        :class="preferences.isDark
                          ? 'border-white/15 bg-slate-900 text-slate-100'
                          : 'border-gray-300 bg-white text-gray-800'" :value="activeDeckFilter ?? ''"
                        @change="handleDeckFilterSelect">
                        <option v-for="option in deckFilterOptions" :key="option.value ?? 'All'"
                          :value="option.value ?? ''">
                          {{ option.label }}
                        </option>
                      </select>
                      <svg class="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2"
                        :class="preferences.isDark ? 'text-slate-300' : 'text-slate-500'" viewBox="0 0 20 20"
                        fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <path d="m5 7 5 5 5-5"></path>
                      </svg>
                    </div>
                  </label>
                  <div class="mb-3 hidden gap-2 sm:flex" role="group" aria-label="牌組賽制篩選">
                    <button v-for="option in deckFilterOptions" :key="option.value ?? 'All'" type="button"
                      class="shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition"
                      :class="deckFilterButtonClass(option.value)" :aria-pressed="activeDeckFilter === option.value"
                      @click="selectDeckFilter(option.value)">
                      {{ option.label }}
                    </button>
                  </div>
                  <div ref="deckListContainer" class="overflow-y-scroll overscroll-contain pr-1"
                    :class="activeDeckFilter === null ? 'max-h-80' : 'max-h-80 sm:max-h-32rem'" tabindex="0"
                    aria-label="我的牌組清單" @scroll.passive="handleDeckListScroll">
                    <div v-if="isDeckListLoading" class="flex h-full items-center justify-center">
                      <span
                        class="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></span>
                    </div>
                    <div v-else-if="myDecks.length" class="grid grid-cols-1 gap-2 lg:grid-cols-2 xl:grid-cols-3">
                      <article v-for="deck in myDecks" :key="deck.id"
                        class="relative overflow-hidden rounded-xl border transition hover:border-indigo-500 hover:shadow-md"
                        :class="[
                          infoCardClass,
                          !deck.isLegal ? invalidDeckCardClass : 'hover:border-indigo-500',
                        ]">
                        <span v-if="!deck.isLegal"
                          class="absolute right-2 top-2 z-10 rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-extrabold tracking-wide text-white shadow-lg">
                          不合法
                        </span>
                        <div class="flex gap-2.5 p-2.5">
                          <button type="button"
                            class="aspect-5/7 w-16 shrink-0 overflow-hidden rounded-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                            :class="preferences.isDark ? 'bg-slate-950/10' : 'bg-white'"
                            :aria-label="`開啟牌組 ${deck.name}`" @click="activeDeckActions = deck">
                            <img v-if="deckImageUrlById.get(deck.id)" :src="deckImageUrlById.get(deck.id)"
                              :alt="`${deck.leaderCardName} (${deck.leaderCardId})`"
                              class="h-full w-full object-contain" loading="lazy" />
                            <span v-else class="flex h-full items-center justify-center text-2xl">
                              🃏
                            </span>
                          </button>
                          <div class="flex min-w-0 flex-1 flex-col">
                            <button type="button"
                              class="block min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                              @click="activeDeckActions = deck">
                              <span
                                class="inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide shadow-sm"
                                :class="deck.regulation === 'standard'
                                  ? preferences.isDark
                                    ? 'border-emerald-400/30 bg-emerald-400/15 text-emerald-300'
                                    : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                  : deck.regulation === 'extra'
                                    ? preferences.isDark
                                      ? 'border-violet-400/30 bg-violet-400/15 text-violet-300'
                                      : 'border-violet-200 bg-violet-50 text-violet-700'
                                    : deck.regulation === 'idea'
                                      ? preferences.isDark
                                        ? 'border-sky-400/30 bg-sky-400/15 text-sky-300'
                                        : 'border-sky-200 bg-sky-50 text-sky-700'
                                      : preferences.isDark
                                        ? 'border-amber-400/30 bg-amber-400/15 text-amber-300'
                                        : 'border-amber-200 bg-amber-50 text-amber-700'">
                                {{ regulationShortLabel(deck.regulation) }}
                              </span>
                              <div class="mt-1.5 rounded-lg border px-2 py-1.5" :class="preferences.isDark
                                ? 'border-white/10 bg-black/15'
                                : 'border-slate-200 bg-slate-50/70'">
                                <p class="truncate text-sm font-extrabold"
                                  :class="preferences.isDark ? 'text-indigo-200' : 'text-indigo-700'">
                                  {{ deck.name }}
                                </p>
                                <div class="mt-1 flex items-center gap-1.5">
                                  <span
                                    class="shrink-0 rounded-md border px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-wide"
                                    :class="preferences.isDark
                                      ? 'border-indigo-400/20 bg-indigo-400/10 text-indigo-200'
                                      : 'border-indigo-200 bg-indigo-50 text-indigo-700'">
                                    {{ deck.leaderCardId }}
                                  </span>
                                  <p class="min-w-0 truncate text-[11px] font-semibold" :class="mutedTextClass">
                                    {{ deck.leaderCardName }}
                                  </p>
                                </div>
                                <p class="mt-1 text-[10px]" :class="mutedTextClass">
                                  主牌
                                  <span class="font-bold"
                                    :class="preferences.isDark ? 'text-emerald-300' : 'text-emerald-700'">
                                    {{ deck.totalCards }} 張
                                  </span>
                                </p>
                                <span
                                  class="mt-1 inline-flex w-fit items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold"
                                  :class="preferences.isDark
                                    ? 'border-slate-400/20 bg-slate-400/10 text-slate-300'
                                    : 'border-slate-200 bg-white text-slate-500'"
                                  :title="deck.createdAt">
                                  <svg viewBox="0 0 24 24" class="h-2.5 w-2.5" fill="none" stroke="currentColor"
                                    stroke-width="2" aria-hidden="true">
                                    <rect x="3" y="5" width="18" height="16" rx="2"></rect>
                                    <path d="M16 3v4M8 3v4M3 10h18"></path>
                                  </svg>
                                  建立於 {{ formatDeckCreatedAt(deck.createdAt) }}
                                </span>
                              </div>
                            </button>
                            <div class="mt-auto flex items-center gap-1.5 pt-1.5">
                              <code
                                class="min-w-0 flex-1 select-all truncate rounded-md px-1.5 py-1 font-mono text-[9px] font-bold tracking-[0.06em] ring-1 ring-inset"
                                :class="inlineDeckCodeClass" :title="deck.code">
                              {{ deck.code }}
                            </code>
                              <button type="button"
                                class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                                :class="copyDeckCodeButtonClass(copiedDeckCode === deck.code)"
                                :aria-label="`複製牌組代碼 ${deck.code}`"
                                :title="copiedDeckCode === deck.code ? '已複製' : '複製牌組代碼'"
                                @click.stop="copyDeckCode(deck.code)">
                                <svg v-if="copiedDeckCode !== deck.code" viewBox="0 0 24 24" class="h-3.5 w-3.5"
                                  fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                                  <rect x="9" y="9" width="11" height="11" rx="2"></rect>
                                  <path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3"></path>
                                </svg>
                                <svg v-else viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor"
                                  stroke-width="2.5" aria-hidden="true">
                                  <path d="m5 12 4 4L19 6"></path>
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    </div>
                    <p v-else class="flex h-full items-center justify-center text-sm" :class="mutedTextClass">
                      尚無牌組
                    </p>
                    <div v-if="isLoadingMoreDecks" class="flex items-center justify-center gap-2 py-4 text-xs"
                      :class="mutedTextClass">
                      <span
                        class="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></span>
                      正在載入更多牌組...
                    </div>
                    <p v-else-if="myDecks.length && myDecks.length >= totalDecks" class="py-3 text-center text-xs"
                      :class="mutedTextClass">
                      已顯示全部 {{ totalDecks }} 副牌組
                    </p>
                  </div>
                </div>
              </template>

              <template v-else>
                <div v-if="isLoading" class="rounded-xl border px-4 py-12 text-center" :class="emptyStateClass">
                  <div
                    class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent">
                  </div>
                  <p class="mt-4 text-sm font-medium" :class="titleClass">
                    正在載入 Leader 圖片...
                  </p>
                </div>

                <div v-else-if="loadError"
                  class="rounded-xl border border-red-300 bg-red-50 px-4 py-8 text-center text-sm text-red-700">
                  <p>{{ loadError }}</p>
                  <button type="button" class="mt-3 font-semibold underline" @click="openRegulationDialog">
                    重新選擇賽制
                  </button>
                </div>

                <div v-else>
                  <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <button type="button" class="rounded-lg border px-3 py-2 text-xs font-semibold transition"
                      :class="secondaryButtonClass" @click="openRegulationDialog">
                      切換賽制
                    </button>
                  </div>

                  <div class="mb-5">
                    <div class="flex flex-wrap gap-2" role="group" aria-label="Leader 顏色篩選">
                      <button type="button" class="rounded-full border px-3 py-1.5 text-xs font-semibold transition"
                        :class="colorButtonClass(null)" :aria-pressed="selectedColor === null"
                        @click="selectColor(null)">
                        ALL
                      </button>
                      <button v-for="color in colors" :key="color" type="button"
                        class="rounded-full border px-3 py-1.5 text-xs font-semibold transition"
                        :class="colorButtonClass(color)" :aria-pressed="selectedColor === color"
                        @click="selectColor(color)">
                        {{ color }}
                      </button>
                    </div>
                  </div>

                  <div v-if="leaderReleaseGroups.length" class="space-y-5">
                    <section v-for="group in leaderReleaseGroups" :key="group.release"
                      class="overflow-hidden rounded-2xl border" :class="leaderReleaseSectionClass">
                      <header class="flex items-center justify-between gap-3 border-b px-4 py-3"
                        :class="leaderReleaseHeaderClass">
                        <div class="flex items-center gap-2.5">
                          <span class="h-2.5 w-2.5 rounded-full bg-indigo-500 shadow-sm"></span>
                          <h4 class="text-sm font-extrabold tracking-wide" :class="titleClass">
                            {{ group.release }}
                          </h4>
                        </div>
                        <span class="rounded-full px-2.5 py-1 text-[11px] font-semibold" :class="countBadgeClass">
                          {{ group.images.length }} 張領航
                        </span>
                      </header>
                      <div class="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3 sm:p-4 md:grid-cols-4 lg:grid-cols-5">
                        <button v-for="image in group.images" :key="image.fileId" type="button"
                          class="group overflow-hidden rounded-xl border text-left transition hover:-translate-y-0.5 hover:border-indigo-500 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                          :class="[
                            infoCardClass,
                            selectedLeader?.leader.cid === image.leader.cid
                              ? 'ring-2 ring-indigo-500'
                              : '',
                          ]" @click="openLeaderDialog(image)">
                          <div class="relative aspect-5/7 bg-slate-950/10">
                            <img :src="image.url" :alt="`${image.cardName} (${image.cardId})`"
                              class="h-full w-full object-contain transition group-hover:scale-[1.02]" loading="lazy" />
                            <span v-if="image.leader.isBanned"
                              class="absolute bottom-1.5 right-1.5 rounded-md bg-red-600 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white shadow-lg">
                              Banned
                            </span>
                          </div>
                          <div class="p-2.5">
                            <div class="flex items-center justify-between gap-2">
                              <div class="truncate text-xs font-semibold" :class="titleClass">
                                {{ image.cardId }}
                              </div>
                              <span v-if="selectedLeader?.leader.cid === image.leader.cid"
                                class="shrink-0 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                                已選擇
                              </span>
                            </div>
                            <div class="mt-0.5 truncate text-xs" :class="mutedTextClass">
                              {{ image.cardName }}
                            </div>
                          </div>
                        </button>
                      </div>
                    </section>
                  </div>
                  <div v-else class="rounded-xl border border-dashed px-4 py-10 text-center text-sm"
                    :class="emptyStateClass">
                    找不到符合此顏色的 Leader。
                  </div>
                </div>
              </template>
            </div>
          </article>
        </div>

        <aside class="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <article class="rounded-2xl border" :class="panelClass">
            <div class="border-b px-4 py-3" :class="sectionBorderClass">
              <h2 class="text-sm font-semibold" :class="titleClass">快速操作</h2>
            </div>
            <div class="space-y-2 p-3">
              <button type="button" :disabled="isLoading"
                class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-60"
                :class="quickActionClass" @click="openRegulationDialog">
                <span class="flex h-8 w-8 items-center justify-center rounded-lg" :class="quickActionIconClass">＋</span>
                <span>
                  <span class="block font-medium">新增牌組</span>
                  <span class="mt-0.5 block text-xs" :class="mutedTextClass">選擇賽制開始組牌</span>
                </span>
              </button>

              <form class="rounded-xl border p-3" :class="deckImportPanelClass" @submit.prevent="importSharedDeck">
                <label for="shared-deck-code" class="block text-xs font-bold" :class="titleClass">
                  使用牌組 Code
                </label>
                <p class="mt-1 text-[11px] leading-5" :class="mutedTextClass">
                  貼上朋友分享的 12 碼 Code，載入編輯器後再自行儲存。
                </p>
                <div class="mt-2 flex gap-2">
                  <input id="shared-deck-code" v-model.trim="sharedDeckCode" type="text" maxlength="12"
                    autocomplete="off" spellcheck="false" placeholder="輸入 12 碼 Code"
                    class="h-10 min-w-0 flex-1 rounded-lg border bg-transparent px-3 font-mono text-xs tracking-wider outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    :class="deckImportInputClass" :disabled="isImportingDeck" />
                  <button type="submit"
                    class="h-10 shrink-0 rounded-lg bg-indigo-600 px-3 text-xs font-bold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="isImportingDeck || sharedDeckCode.length !== 12">
                    {{ isImportingDeck ? '載入中...' : '載入' }}
                  </button>
                </div>
                <p v-if="deckImportError" class="mt-2 text-xs font-medium text-red-500">
                  {{ deckImportError }}
                </p>
              </form>

              <RouterLink to="/chat"
                class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition"
                :class="quickActionClass">
                <span class="flex h-8 w-8 items-center justify-center rounded-lg"
                  :class="quickActionIconClass">💬</span>
                <span>
                  <span class="block font-medium">前往聊天室</span>
                  <span class="mt-0.5 block text-xs" :class="mutedTextClass">討論構築與對戰想法</span>
                </span>
              </RouterLink>
            </div>
          </article>
        </aside>
      </section>
    </main>

    <div v-if="activeDeckActions"
      class="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-3 sm:items-center sm:p-4" role="dialog"
      aria-modal="true" aria-labelledby="deck-actions-title" @click.self="closeDeckActions">
      <div class="w-full max-w-sm space-y-3">
        <section class="overflow-hidden rounded-2xl border shadow-2xl" :class="panelClass">
          <header class="border-b px-5 py-4 text-center" :class="sectionBorderClass">
            <h2 id="deck-actions-title" class="truncate text-base font-bold" :class="titleClass">
              {{ activeDeckActions.name }}
            </h2>

            <div class="mt-2 space-y-1">
              <p class="truncate text-sm font-semibold" :class="mutedTextClass">
                {{ activeDeckActions.leaderCardName }}
              </p>

              <p class="inline-flex max-w-full items-center rounded-md px-2 py-1 font-mono text-[11px] font-medium"
                :class="deckCodeClass">
                {{ activeDeckActions.code }}
              </p>
            </div>
          </header>
          <div class="divide-y" :class="[sectionBorderClass, preferences.isDark ? 'divide-white/10' : 'divide-gray-200']">
            <button type="button" class="block w-full px-5 py-4 text-center text-sm font-bold transition"
             :class="deckActionButtonClass" @click="viewSelectedDeck">
             檢視
           </button>
           <button type="button" class="block w-full px-5 py-4 text-center text-sm font-bold transition"
             :class="[deckActionButtonClass, deckEditActionClass]" @click="editSelectedDeck">
             編輯
            </button>
            <button type="button"
              class="block w-full px-5 py-4 text-center text-sm font-bold text-indigo-600 transition disabled:cursor-not-allowed disabled:opacity-50"
              :class="deckActionButtonClass" :disabled="copyingDeckId === activeDeckActions.id"
              @click="copySelectedDeck">
              {{ copyingDeckId === activeDeckActions.id ? '複製中...' : '複製' }}
            </button>
            <button type="button"
              class="block w-full px-5 py-4 text-center text-sm font-bold text-red-600 transition disabled:cursor-not-allowed disabled:opacity-50"
              :class="deckActionButtonClass" :disabled="deletingDeckId === activeDeckActions.id"
              @click="deleteSelectedDeck">
              {{ deletingDeckId === activeDeckActions.id ? '刪除中...' : '刪除' }}
            </button>
          </div>
        </section>
        <button type="button"
          class="block w-full rounded-2xl border px-5 py-4 text-center text-sm font-bold shadow-lg transition"
          :class="deckCancelButtonClass" @click="closeDeckActions">
          取消
        </button>
      </div>
    </div>

    <div v-if="isRegulationDialogOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"
      role="dialog" aria-modal="true" aria-labelledby="regulation-dialog-title" @click.self="closeRegulationDialog">
      <div class="w-full max-w-lg rounded-2xl border p-5 shadow-2xl" :class="panelClass">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 id="regulation-dialog-title" class="text-lg font-semibold" :class="titleClass">
              選擇牌組賽制
            </h2>
            <p class="mt-1 text-sm" :class="mutedTextClass">請選擇要使用的賽制</p>
          </div>
          <button type="button" class="rounded-lg px-2 py-1 text-xl" :class="quickActionClass" aria-label="關閉"
            @click="closeRegulationDialog">
            ×
          </button>
        </div>

        <div class="mt-5 grid gap-3">
          <button v-for="option in regulationOptions" :key="option.value" type="button"
            class="rounded-xl border p-4 text-left transition hover:border-indigo-500 hover:ring-2 hover:ring-indigo-500/20"
            :class="infoCardClass" @click="selectRegulation(option.value)">
            <span class="block text-sm font-semibold" :class="titleClass">{{ option.label }}</span>
            <span class="mt-1 block text-xs leading-5" :class="mutedTextClass">
              {{ option.description }}
            </span>
          </button>
        </div>
      </div>
    </div>

    <div v-if="activeLeaderImage"
      class="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-slate-950/75 sm:items-center sm:p-4"
      role="dialog" aria-modal="true" aria-labelledby="leader-dialog-title" @click.self="closeLeaderDialog">
      <div
        class="flex max-h-[96dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border shadow-2xl sm:max-h-[94vh] sm:rounded-3xl"
        :class="panelClass">
        <div class="relative shrink-0 px-5 pb-3 pt-5 text-center sm:px-7">
          <h2 id="leader-dialog-title" class="text-xl font-bold tracking-tight" :class="titleClass">
            選擇領導者卡牌
          </h2>
          <button type="button"
            class="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-3xl font-light leading-none text-white transition hover:bg-slate-800"
            aria-label="關閉領導者卡牌詳情" @click="closeLeaderDialog">
            ×
          </button>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto px-5 pb-5 sm:px-8">
          <img :src="activeLeaderImage.url" :alt="`${activeLeaderImage.cardName} (${activeLeaderImage.cardId})`"
            class="mx-auto mt-4 max-h-[52vh] w-full max-w-sm object-contain" />

          <div v-if="activeLeaderImage.leader.relatedFileIds.length" class="mt-5">
            <div class="mb-2 flex items-center justify-between gap-3">
              <p class="text-sm font-bold" :class="titleClass">選擇圖片版本</p>
              <span class="text-xs" :class="mutedTextClass">
                {{ 1 + activeLeaderImage.leader.relatedFileIds.length }} 張圖片
              </span>
            </div>
            <div v-if="isLeaderVariantsLoading" class="flex items-center justify-center rounded-xl py-8"
              :class="leaderVariantPanelClass">
              <div class="h-7 w-7 animate-spin rounded-full border-2 border-rose-500 border-t-transparent"></div>
            </div>
            <div v-else-if="leaderVariantsError" class="rounded-xl px-4 py-5 text-center text-sm text-red-500"
              :class="leaderVariantPanelClass">
              {{ leaderVariantsError }}
            </div>
            <div v-else class="grid grid-cols-3 gap-2 sm:grid-cols-4">
              <button v-for="variant in activeLeaderVariants" :key="variant.fileId" type="button"
                class="relative overflow-hidden rounded-xl border p-1 transition hover:-translate-y-0.5 hover:border-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                :class="variant.fileId === activeLeaderImage.fileId
                  ? selectedLeaderVariantClass
                  : infoCardClass
                  " :aria-pressed="variant.fileId === activeLeaderImage.fileId" @click="selectLeaderVariant(variant)">
                <img :src="variant.url" :alt="`${variant.cardName} 圖片版本`"
                  class="aspect-5/7 w-full rounded-lg object-contain" loading="lazy" />
                <span v-if="variant.fileId === activeLeaderImage.fileId"
                  class="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-rose-500 px-2 py-0.5 text-[9px] font-bold text-white shadow">
                  已選擇
                </span>
              </button>
            </div>
          </div>

          <div class="mt-5 flex items-end justify-between gap-4">
            <h3 class="min-w-0 text-xl font-bold sm:text-2xl" :class="titleClass">
              {{ activeLeaderImage.cardName }}
            </h3>
            <span class="shrink-0 text-base font-bold sm:text-lg" :class="titleClass">
              {{ activeLeaderImage.cardId }}
            </span>
          </div>

          <div class="mt-5 overflow-hidden rounded-xl border" :class="leaderDetailClass">
            <button type="button"
              class="flex w-full items-center justify-between px-5 py-4 text-left text-base font-semibold transition"
              :class="leaderDetailButtonClass" :aria-expanded="isLeaderDetailOpen"
              @click="isLeaderDetailOpen = !isLeaderDetailOpen">
              Detail
              <span class="text-2xl font-light transition" :class="isLeaderDetailOpen ? 'rotate-45' : ''">＋</span>
            </button>
            <div v-if="isLeaderDetailOpen" class="space-y-3 border-t px-5 py-4 text-sm" :class="sectionBorderClass">
              <dl class="grid grid-cols-2 gap-x-5 gap-y-3">
                <div>
                  <dt class="text-xs" :class="mutedTextClass">顏色</dt>
                  <dd class="mt-0.5 font-medium">{{ activeLeaderImage.leader.color }}</dd>
                </div>
                <div>
                  <dt class="text-xs" :class="mutedTextClass">Block</dt>
                  <dd class="mt-0.5 font-medium">{{ activeLeaderImage.leader.block }}</dd>
                </div>
                <div>
                  <dt class="text-xs" :class="mutedTextClass">生命值</dt>
                  <dd class="mt-0.5 font-medium">{{ activeLeaderImage.leader.life ?? '—' }}</dd>
                </div>
                <div>
                  <dt class="text-xs" :class="mutedTextClass">攻擊力</dt>
                  <dd class="mt-0.5 font-medium">{{ activeLeaderImage.leader.power }}</dd>
                </div>
                <div class="col-span-2">
                  <dt class="text-xs" :class="mutedTextClass">特徵</dt>
                  <dd class="mt-0.5 font-medium">{{ activeLeaderImage.leader.feature || '—' }}</dd>
                </div>
                <div class="col-span-2">
                  <dt class="text-xs" :class="mutedTextClass">效果</dt>
                  <dd class="mt-0.5 whitespace-pre-line leading-6">
                    {{ activeLeaderImage.leader.effect || '—' }}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <div class="grid shrink-0 grid-cols-[minmax(100px,0.7fr)_minmax(0,1.3fr)] gap-3 border-t p-4 sm:px-8 sm:py-5"
          :class="sectionBorderClass">
          <button type="button" class="rounded-full px-4 py-3 text-sm font-bold transition" :class="preferences.isDark
            ? 'bg-white/10 text-white hover:bg-white/15'
            : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
            " @click="closeLeaderDialog">
            返回
          </button>
          <button type="button" class="rounded-full border px-4 py-3 text-sm font-bold transition active:translate-y-px"
            :class="leaderConfirmButtonClass" @click="confirmLeaderSelection">
            以此領導者製作牌組
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

import {
  createSignedImageUrls,
  getCardColors,
  getLeaderCards,
  getRegulationConfig,
  type LeaderCard,
  type LeaderRegulation,
} from '@/api/cardsApi'
import { resolveApiError } from '@/api/resolveApiError'
import {
  copyDeck,
  deleteDeck,
  getMyDeck,
  getMyDecks,
  importDeckByCode,
  type DeckListItem,
  type ImportedDeckDetail,
} from '@/api/deckApi'
import AppHeader from '@/components/AppHeader.vue'
import DeckBuilder from '@/components/deck/DeckBuilder.vue'
import DeckConfirmation from '@/components/deck/DeckConfirmation.vue'
import { PRODUCT_COPY } from '@/constants/productGlossary'
import { usePreferencesStore } from '@/stores/preferencesStore'
import type { DeckDraft } from '@/types/deck'
import { showDangerConfirmAlert, showErrorAlert, showSuccessAlert, showToast } from '@/utils/alerts'

const preferences = usePreferencesStore()
const isRegulationDialogOpen = ref(false)
const isLoading = ref(false)
const loadError = ref('')
const selectedRegulation = ref<LeaderRegulation | null>(null)
const selectedColor = ref<string | null>(null)
const colors = ref<string[]>([])
const leaders = ref<LeaderCard[]>([])
const imageUrlByFileId = ref(new Map<number, string>())
const activeLeaderImage = ref<LeaderImage | null>(null)
const selectedLeaderFileId = ref<number | null>(null)
const selectedLeader = ref<LeaderImage | null>(null)
const isDeckBuilderOpen = ref(false)
const deckDraft = ref<DeckDraft | null>(null)
const isLeaderDetailOpen = ref(false)
const isLeaderVariantsLoading = ref(false)
const leaderVariantsError = ref('')
const DECK_PAGE_SIZE = 6
type DeckListState = {
  decks: DeckListItem[]
  page: number
  total: number
  isLoading: boolean
  isLoadingMore: boolean
}
let leaderVariantsRequestId = 0
const activeDeckFilter = ref<LeaderRegulation | null>(null)
const deckList = ref<DeckListState>({ decks: [], page: 1, total: 0, isLoading: true, isLoadingMore: false })
const myDecks = computed(() => deckList.value.decks)
const totalDecks = computed(() => deckList.value.total)
const deckListContainer = ref<HTMLElement | null>(null)
const deckImageUrlById = ref(new Map<number, string>())
const isDeckListLoading = computed(() => deckList.value.isLoading)
const isLoadingMoreDecks = computed(() => deckList.value.isLoadingMore)
const deckListError = ref('')
const deletingDeckId = ref<number | null>(null)
const copyingDeckId = ref<number | null>(null)
const activeDeckActions = ref<DeckListItem | null>(null)
const copiedDeckCode = ref<string | null>(null)
let copiedDeckCodeTimer: number | null = null
const sharedDeckCode = ref('')
const isImportingDeck = ref(false)
const deckImportError = ref('')
const rotatedThroughBlock = ref<number | null>(null)

interface LeaderImage {
  fileId: number
  url: string
  cardId: string
  cardName: string
  leader: LeaderCard
}

async function fillDeckListViewport(): Promise<void> {
  await nextTick()
  const element = deckListContainer.value
  const state = deckList.value
  if (
    element &&
    element.scrollHeight <= element.clientHeight &&
    !state.isLoading &&
    !state.isLoadingMore &&
    state.decks.length < state.total
  ) {
    await loadMyDecks(state.page + 1, true)
  }
}

const regulationOptions = computed(
  (): {
    value: LeaderRegulation
    label: string
    description: string
  }[] => [
      {
        value: 'standard',
        label: '常規賽制',
        description:
          rotatedThroughBlock.value === null
            ? '正在載入目前的賽制規則。'
            : `除部分指定的卡牌之外，擴張記號${toCircledNumber(rotatedThroughBlock.value)}及之前的卡牌將不可以在本活動中使用。`,
      },
      {
        value: 'extra',
        label: '非常規賽制',
        description: '所有擴張記號的卡牌皆可以在本活動中使用，不受擴張記號限制。',
      },
      {
        value: 'sealed',
        label: '現開賽',
        description:
          '5包現開賽是特殊規則的對戰。參與對戰的玩家購買5包補充包，然後用這5包中開出的卡牌構築30張卡的牌組、並參加對戰！',
      },
      {
        value: 'idea',
        label: '構思',
        description:
          '自由構思牌組內容，不套用禁止卡、限制卡或同卡編號張數限制，主牌允許 0 至 100 張。',
      },
    ],
)

function regulationShortLabel(regulation: LeaderRegulation): string {
  if (regulation === 'standard') return 'Standard'
  if (regulation === 'extra') return 'Extra'
  if (regulation === 'idea') return 'Idea'
  return 'Sealed'
}

function formatDeckCreatedAt(createdAt: string): string {
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return createdAt

  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

const deckFilterOptions: Array<{ value: LeaderRegulation | null; label: string }> = [
  { value: null, label: 'All' },
  { value: 'standard', label: 'Standard' },
  { value: 'extra', label: 'Extra' },
  { value: 'sealed', label: 'Sealed' },
  { value: 'idea', label: 'Idea' },
]

async function copyDeckCode(code: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(code)
    copiedDeckCode.value = code
    if (copiedDeckCodeTimer !== null) window.clearTimeout(copiedDeckCodeTimer)
    copiedDeckCodeTimer = window.setTimeout(() => {
      copiedDeckCode.value = null
      copiedDeckCodeTimer = null
    }, 1800)
  } catch {
    showToast('無法複製牌組代碼，請手動選取複製。', {
      variant: 'error',
      title: '複製失敗',
    })
  }
}

async function importSharedDeck(): Promise<void> {
  const code = sharedDeckCode.value.trim()
  if (!/^[A-Za-z0-9]{12}$/.test(code) || isImportingDeck.value) {
    deckImportError.value = '請輸入正確的 12 碼英數牌組 Code。'
    return
  }

  isImportingDeck.value = true
  deckImportError.value = ''
  try {
    const deck = await importDeckByCode(code)
    await openDeckInBuilder(deck)
    sharedDeckCode.value = ''
    showToast('已載入分享牌組；完成編輯後請確認並儲存。', {
      variant: 'success',
      title: '牌組已載入',
    })
  } catch (error) {
    deckImportError.value = resolveApiError(error)
  } finally {
    isImportingDeck.value = false
  }
}

const leaderImages = computed(() =>
  leaders.value.flatMap((leader) => {
    if (leader.fileId === undefined) return []
    const url = imageUrlByFileId.value.get(leader.fileId)
    if (!url) return []
    return [
      {
        fileId: leader.fileId,
        url,
        cardId: leader.cardId,
        cardName: leader.cardName,
        leader,
      },
    ]
  }),
)

const leaderReleaseGroups = computed(() => {
  const groups = new Map<string, LeaderImage[]>()
  leaderImages.value.forEach((image) => {
    const release = releaseLabel(image.cardId)
    const images = groups.get(release) ?? []
    images.push(image)
    groups.set(release, images)
  })
  return Array.from(groups, ([release, images]) => ({ release, images }))
})

const activeLeaderVariants = computed<LeaderImage[]>(() => {
  if (!activeLeaderImage.value) return []
  const leader = activeLeaderImage.value.leader
  return [leader.fileId, ...leader.relatedFileIds].flatMap((fileId) => {
    if (fileId === undefined) return []
    const url = imageUrlByFileId.value.get(fileId)
    return url ? [{ fileId, url, cardId: leader.cardId, cardName: leader.cardName, leader }] : []
  })
})

async function openLeaderDialog(image: LeaderImage): Promise<void> {
  const requestId = ++leaderVariantsRequestId
  activeLeaderImage.value = image
  isLeaderDetailOpen.value = false
  isLeaderVariantsLoading.value = image.leader.relatedFileIds.length > 0
  leaderVariantsError.value = ''

  if (!isLeaderVariantsLoading.value) return
  try {
    const signedUrls = await createSignedImageUrls([image.fileId, ...image.leader.relatedFileIds])
    if (requestId !== leaderVariantsRequestId) return
    imageUrlByFileId.value = new Map([
      ...imageUrlByFileId.value,
      ...signedUrls.map(({ fileId, url }) => [fileId, url] as const),
    ])
  } catch (error) {
    if (requestId !== leaderVariantsRequestId) return
    leaderVariantsError.value = resolveApiError(error)
  } finally {
    if (requestId === leaderVariantsRequestId) isLeaderVariantsLoading.value = false
  }
}

function closeLeaderDialog(): void {
  leaderVariantsRequestId += 1
  activeLeaderImage.value = null
  isLeaderDetailOpen.value = false
  leaderVariantsError.value = ''
}

function selectLeaderVariant(variant: LeaderImage): void {
  activeLeaderImage.value = variant
}

function releaseLabel(cardId: string): string {
  return cardId.split('-')[0] ?? cardId
}

function confirmLeaderSelection(): void {
  if (!activeLeaderImage.value) return
  selectedLeaderFileId.value = activeLeaderImage.value.fileId
  selectedLeader.value = activeLeaderImage.value
  isDeckBuilderOpen.value = true
  closeLeaderDialog()
}

function closeDeckBuilder(): void {
  isDeckBuilderOpen.value = false
}

function confirmDeck(draft: DeckDraft): void {
  deckDraft.value = {
    ...draft,
    id: deckDraft.value?.id,
    code: deckDraft.value?.code,
    name: draft.name,
  }
  isDeckBuilderOpen.value = false
}

async function openSavedDeck(deckId: number, openBuilder = true): Promise<void> {
  deckListError.value = ''

  try {
    const deck = await getMyDeck(deckId)
    await openDeckInBuilder(deck, { id: deck.id, code: deck.code }, openBuilder)
  } catch (error) {
    deckListError.value = resolveApiError(error)
  }
}

async function openDeckInBuilder(
  deck: ImportedDeckDetail,
  persisted?: { id: number; code: string },
  openBuilder = true,
): Promise<void> {
  const leaderFileId = deck.leader.fileId
  if (leaderFileId === undefined) {
    throw new Error('此牌組的 Leader 圖片資料不完整。')
  }
  const entries = deck.cards.map(({ card, quantity }) => {
    if (card.fileId === undefined) {
      throw new Error(`卡片 ${card.cardId} 的圖片資料不完整。`)
    }
    return { card, quantity, fileId: card.fileId }
  })
  const fileIds = [leaderFileId, ...entries.map(({ fileId }) => fileId)]
  const signedUrls = await createSignedImageUrls(fileIds)
  const urlByFileId = new Map(signedUrls.map(({ fileId, url }) => [fileId, url]))
  const leaderImageUrl = urlByFileId.get(leaderFileId) ?? ''

  selectedRegulation.value = deck.regulation
  selectedLeader.value = {
    fileId: leaderFileId,
    url: leaderImageUrl,
    cardId: deck.leader.cardId,
    cardName: deck.leader.cardName,
    leader: deck.leader,
  }
  deckDraft.value = {
    id: persisted?.id,
    code: persisted?.code,
    name: persisted ? deck.name : '',
    regulation: deck.regulation,
    leader: deck.leader,
    leaderFileId,
    leaderImageUrl,
    entries: entries.map(({ card, quantity, fileId }) => ({
      card,
      fileId,
      quantity,
      imageUrl: urlByFileId.get(fileId) ?? '',
    })),
  }
  isDeckBuilderOpen.value = openBuilder
}

function editDeck(draft: DeckDraft): void {
  deckDraft.value = draft
  isDeckBuilderOpen.value = true
}

async function handleDeckSaved(deckId: number): Promise<void> {
  if (deckDraft.value) {
    deckDraft.value = { ...deckDraft.value, id: deckId }
  }
  await reloadMyDecks()
}

function returnToDeckList(): void {
  deckDraft.value = null
  isDeckBuilderOpen.value = false
  selectedRegulation.value = null
  selectedColor.value = null
  selectedLeader.value = null
  selectedLeaderFileId.value = null
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function loadMyDecks(page = 1, append = false): Promise<void> {
  const state = deckList.value
  if (append) state.isLoadingMore = true
  else state.isLoading = true
  deckListError.value = ''

  try {
    const result = await getMyDecks(activeDeckFilter.value ?? undefined, page, DECK_PAGE_SIZE)
    const decks = result.items
    const fileIds = decks.flatMap(({ leaderFileId }) =>
      leaderFileId === undefined ? [] : [leaderFileId],
    )
    const signedUrls = fileIds.length ? await createSignedImageUrls(fileIds) : []
    const urlByFileId = new Map(signedUrls.map(({ fileId, url }) => [fileId, url]))

    state.decks = append ? [...state.decks, ...decks] : decks
    state.total = result.total
    state.page = result.page
    deckImageUrlById.value = new Map([
      ...deckImageUrlById.value.entries(),
      ...decks.flatMap((deck) => {
        if (deck.leaderFileId === undefined) return []
        const url = urlByFileId.get(deck.leaderFileId)
        return url ? [[deck.id, url] as const] : []
      }),
    ])
  } catch (error) {
    deckListError.value = resolveApiError(error)
  } finally {
    if (append) state.isLoadingMore = false
    else state.isLoading = false
  }

  void fillDeckListViewport()
}

async function reloadMyDecks(): Promise<void> {
  deckImageUrlById.value = new Map()
  await loadMyDecks()
}

async function selectDeckFilter(regulation: LeaderRegulation | null): Promise<void> {
  if (activeDeckFilter.value === regulation || isDeckListLoading.value) return
  activeDeckFilter.value = regulation
  deckImageUrlById.value = new Map()
  await loadMyDecks()
}

function handleDeckFilterSelect(event: Event): void {
  const value = (event.target as HTMLSelectElement).value
  const option = deckFilterOptions.find((candidate) => (candidate.value ?? '') === value)
  if (!option) {
    showToast('無法套用選取的賽制篩選。', { variant: 'error', title: '篩選失敗' })
    return
  }
  void selectDeckFilter(option.value)
}

function handleDeckListScroll(event: Event): void {
  const element = event.currentTarget as HTMLElement
  const state = deckList.value
  const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight
  if (
    distanceFromBottom <= 120 &&
    !state.isLoading &&
    !state.isLoadingMore &&
    state.decks.length < state.total
  ) {
    void loadMyDecks(state.page + 1, true)
  }
}

async function confirmDeleteDeck(deck: DeckListItem): Promise<void> {
  const result = await showDangerConfirmAlert(`刪除後將無法復原。牌組代碼：${deck.code}`, {
    title: `確定要刪除「${deck.leaderCardName}」牌組？`,
    confirmButtonText: '刪除牌組',
    cancelButtonText: '取消',
  })
  if (!result.isConfirmed) return

  deletingDeckId.value = deck.id
  try {
    await deleteDeck(deck.id)
    await reloadMyDecks()
    await showSuccessAlert('牌組已刪除。')
  } catch (error) {
    await showErrorAlert(resolveApiError(error))
  } finally {
    deletingDeckId.value = null
  }
}

function closeDeckActions(): void {
  if (copyingDeckId.value !== null || deletingDeckId.value !== null) return
  activeDeckActions.value = null
}

async function editSelectedDeck(): Promise<void> {
  const deck = activeDeckActions.value
  if (!deck) return
  activeDeckActions.value = null
  await openSavedDeck(deck.id)
}

async function viewSelectedDeck(): Promise<void> {
  const deck = activeDeckActions.value
  if (!deck) return
  activeDeckActions.value = null
  await openSavedDeck(deck.id, false)
}

async function copySelectedDeck(): Promise<void> {
  const deck = activeDeckActions.value
  if (!deck || copyingDeckId.value !== null) return

  copyingDeckId.value = deck.id
  try {
    await copyDeck(deck.id)
    activeDeckActions.value = null
    await reloadMyDecks()
    await showSuccessAlert('牌組已複製。')
  } catch (error) {
    await showErrorAlert(resolveApiError(error))
  } finally {
    copyingDeckId.value = null
  }
}

async function deleteSelectedDeck(): Promise<void> {
  const deck = activeDeckActions.value
  if (!deck) return
  activeDeckActions.value = null
  await confirmDeleteDeck(deck)
}

function handleEscape(event: KeyboardEvent): void {
  if (event.key !== 'Escape') return
  if (activeDeckActions.value) {
    closeDeckActions()
  } else if (activeLeaderImage.value) {
    closeLeaderDialog()
  } else if (isRegulationDialogOpen.value) {
    closeRegulationDialog()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleEscape)
  void Promise.all([reloadMyDecks(), loadRegulationConfig()])
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleEscape)
  if (copiedDeckCodeTimer !== null) window.clearTimeout(copiedDeckCodeTimer)
})

function openRegulationDialog(): void {
  isRegulationDialogOpen.value = true
}

async function loadRegulationConfig(): Promise<void> {
  try {
    const config = await getRegulationConfig()
    rotatedThroughBlock.value = config.rotatedThroughBlock
  } catch (error) {
    loadError.value = resolveApiError(error)
  }
}

function toCircledNumber(value: number): string {
  if (value >= 1 && value <= 20) return String.fromCodePoint(0x2460 + value - 1)
  return String(value)
}

function closeRegulationDialog(): void {
  isRegulationDialogOpen.value = false
}

async function selectRegulation(regulation: LeaderRegulation): Promise<void> {
  closeRegulationDialog()
  selectedRegulation.value = regulation
  selectedColor.value = null
  selectedLeaderFileId.value = null
  deckDraft.value = null
  isLoading.value = true
  loadError.value = ''
  leaders.value = []
  imageUrlByFileId.value = new Map()

  try {
    const [availableColors] = await Promise.all([
      getCardColors(),
      loadLeaderCards(regulation, null),
    ])
    colors.value = availableColors
  } catch (error) {
    loadError.value = resolveApiError(error)
  } finally {
    isLoading.value = false
  }
}

async function selectColor(color: string | null): Promise<void> {
  if (!selectedRegulation.value || selectedColor.value === color) return

  selectedColor.value = color
  isLoading.value = true
  loadError.value = ''

  try {
    await loadLeaderCards(selectedRegulation.value, color)
  } catch (error) {
    loadError.value = resolveApiError(error)
  } finally {
    isLoading.value = false
  }
}

async function loadLeaderCards(regulation: LeaderRegulation, color: string | null): Promise<void> {
  leaders.value = []
  imageUrlByFileId.value = new Map()

  const result = await getLeaderCards(regulation, color ?? undefined)
  const fileIds = result.flatMap((leader) => (leader.fileId === undefined ? [] : [leader.fileId]))
  const signedUrls = fileIds.length ? await createSignedImageUrls(fileIds) : []

  leaders.value = result
  imageUrlByFileId.value = new Map(signedUrls.map(({ fileId, url }) => [fileId, url]))
}

const leaderDetailClass = computed(() =>
  preferences.isDark
    ? 'border-white/10 bg-slate-950/80 text-slate-100'
    : 'border-slate-200 bg-slate-50 text-slate-900 shadow-sm',
)
const leaderDetailButtonClass = computed(() =>
  preferences.isDark ? 'hover:bg-white/5' : 'hover:bg-slate-100',
)
const leaderVariantPanelClass = computed(() => (preferences.isDark ? 'bg-white/5' : 'bg-slate-100'))
const selectedLeaderVariantClass = computed(() =>
  preferences.isDark
    ? 'border-rose-400 bg-rose-500/10 ring-2 ring-rose-400/70'
    : 'border-rose-500 bg-rose-50 ring-2 ring-rose-200',
)
const leaderReleaseSectionClass = computed(() =>
  preferences.isDark
    ? 'border-white/10 bg-slate-900/60 shadow-lg shadow-black/10'
    : 'border-slate-200 bg-white shadow-sm',
)
const leaderReleaseHeaderClass = computed(() =>
  preferences.isDark
    ? 'border-white/10 bg-gradient-to-r from-indigo-500/15 to-transparent'
    : 'border-slate-200 bg-gradient-to-r from-indigo-50 to-white',
)
const leaderConfirmButtonClass = computed(() =>
  preferences.isDark
    ? 'border-rose-400/40 bg-rose-500 text-white shadow-sm hover:bg-rose-400'
    : 'border-rose-600 bg-rose-600 text-white shadow-sm hover:border-rose-700 hover:bg-rose-700',
)
const deckActionButtonClass = computed(() =>
  preferences.isDark ? 'bg-slate-900 hover:bg-white/5' : 'bg-white hover:bg-slate-50',
)
const deckEditActionClass = computed(() =>
  preferences.isDark ? 'text-amber-300 hover:bg-amber-400/10' : 'text-amber-700 hover:bg-amber-50',
)
const deckCancelButtonClass = computed(() =>
  preferences.isDark
    ? 'border-white/10 bg-slate-800 text-slate-100 hover:bg-slate-700'
    : 'border-slate-200 bg-white text-slate-900 hover:bg-slate-100',
)

const deckCodeClass = computed(() =>
  preferences.isDark ? 'bg-white/[0.06] text-slate-400' : 'bg-slate-100 text-slate-500',
)
const inlineDeckCodeClass = computed(() =>
  preferences.isDark
    ? 'bg-slate-950/65 text-indigo-200 ring-indigo-300/15'
    : 'bg-indigo-50 text-indigo-800 ring-indigo-200',
)

function copyDeckCodeButtonClass(isCopied: boolean): string {
  if (isCopied) {
    return preferences.isDark
      ? 'border-emerald-400/30 bg-emerald-400/15 text-emerald-300'
      : 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }
  return preferences.isDark
    ? 'border-white/10 bg-white/[0.06] text-slate-200 hover:border-indigo-400/40 hover:bg-indigo-400/15 hover:text-indigo-200'
    : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700'
}
const pageClass = computed(() =>
  preferences.isDark ? 'bg-slate-950 text-slate-100' : 'bg-gray-100 text-gray-900',
)
const panelClass = computed(() =>
  preferences.isDark ? 'border-white/10 bg-slate-900/70' : 'border-gray-200 bg-white shadow-sm',
)
const sectionBorderClass = computed(() =>
  preferences.isDark ? 'border-white/10' : 'border-gray-200',
)
const titleClass = computed(() => (preferences.isDark ? 'text-slate-100' : 'text-gray-800'))
const textClass = computed(() => (preferences.isDark ? 'text-slate-300' : 'text-gray-600'))
const mutedTextClass = computed(() => (preferences.isDark ? 'text-slate-400' : 'text-gray-500'))
const primaryButtonClass = computed(
  () =>
    'bg-gradient-to-r from-indigo-600 to-violet-600 shadow-indigo-900/20 hover:from-indigo-500 hover:to-violet-500',
)
const secondaryButtonClass = computed(() =>
  preferences.isDark
    ? 'border-white/10 bg-slate-900 text-slate-100 hover:bg-slate-800 focus-visible:ring-offset-slate-950'
    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-offset-white',
)
function colorButtonClass(color: string | null): string {
  if (selectedColor.value === color) {
    return 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
  }

  return preferences.isDark
    ? 'border-white/15 bg-slate-900 text-slate-300 hover:border-indigo-400 hover:text-white'
    : 'border-gray-300 bg-white text-gray-700 hover:border-indigo-500 hover:text-indigo-700'
}

function deckFilterButtonClass(regulation: LeaderRegulation | null): string {
  if (activeDeckFilter.value === regulation) {
    return 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
  }

  return preferences.isDark
    ? 'border-white/15 bg-slate-900 text-slate-300 hover:border-indigo-400 hover:text-white'
    : 'border-gray-300 bg-white text-gray-700 hover:border-indigo-500 hover:text-indigo-700'
}
const statusBadgeClass = computed(() =>
  preferences.isDark
    ? 'bg-amber-500/10 text-amber-300 ring-1 ring-inset ring-amber-400/20'
    : 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
)
const countBadgeClass = computed(() =>
  preferences.isDark ? 'bg-white/[0.05] text-slate-400' : 'bg-gray-100 text-gray-500',
)
const emptyStateClass = computed(() =>
  preferences.isDark ? 'border-white/10 bg-slate-950/30' : 'border-gray-300 bg-gray-50/70',
)
const infoCardClass = computed(() =>
  preferences.isDark ? 'border-white/10 bg-slate-900/55' : 'border-gray-200 bg-white',
)
const invalidDeckCardClass = computed(() =>
  preferences.isDark
    ? 'border-red-500/70 bg-red-950/20 ring-1 ring-red-500/25'
    : 'border-red-300 bg-red-50/60 ring-1 ring-red-200',
)

const quickActionClass = computed(() =>
  preferences.isDark ? 'text-slate-200 hover:bg-white/[0.05]' : 'text-gray-700 hover:bg-gray-100',
)
const quickActionIconClass = computed(() =>
  preferences.isDark ? 'bg-white/[0.05] text-slate-300' : 'bg-gray-100 text-gray-600',
)
const deckImportPanelClass = computed(() =>
  preferences.isDark ? 'border-white/10 bg-slate-950/30' : 'border-indigo-100 bg-indigo-50/50',
)
const deckImportInputClass = computed(() =>
  preferences.isDark
    ? 'border-white/15 text-slate-100 placeholder:text-slate-500'
    : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-400',
)
</script>
