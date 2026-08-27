<template>
  <main class="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6 lg:px-6">
    <div class="mb-5 flex items-center justify-between gap-3">
      <div class="h-11 w-11 shrink-0" aria-hidden="true"></div>
      <h1 class="text-xl font-bold sm:text-2xl" :class="titleClass">確認牌組</h1>
      <div class="h-11 w-11"></div>
    </div>

    <section class="rounded-2xl border p-4 sm:p-6" :class="panelClass">
      <div class="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between" :class="borderClass">
        <div>
          <p class="text-xs font-medium" :class="mutedTextClass">牌組代碼</p>
          <div class="mt-1 flex items-center gap-2">
            <strong class="break-all text-lg tracking-wide" :class="titleClass">{{ deckCode }}</strong>
            <button type="button" class="rounded-lg px-2 py-1 text-sm" :class="softButtonClass" @click="copyDeckCode">
              複製
            </button>
          </div>
          <p class="mt-2 text-base font-bold" :class="titleClass">{{ regulationLabel }}</p>
        </div>

        <div class="flex flex-wrap gap-2">
          <button type="button" class="rounded-full px-4 py-2.5 text-sm font-semibold" :class="softButtonClass"
            :disabled="isExporting" @click="downloadDeckImage">
            {{ isExporting ? '產生圖片中...' : '⇩ 保存圖片' }}
          </button>
          <button type="button" class="rounded-full px-4 py-2.5 text-sm font-semibold" :class="softButtonClass"
            @click="isSortDialogOpen = true">
            ⇅ 變更排序
          </button>
        </div>
      </div>

      <p v-if="actionMessage" class="mt-4 text-sm font-medium text-emerald-600">{{ actionMessage }}</p>
      <p v-if="actionError" class="mt-4 text-sm font-medium text-red-500">{{ actionError }}</p>
    </section>

    <section class="mt-4 overflow-hidden rounded-2xl border" :class="panelClass">
      <div class="bg-[#101117] px-4 py-3 text-sm font-bold text-white">主牌組 {{ mainDeckCount }}</div>
      <div class="grid grid-cols-3 gap-3 p-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9">
        <article v-for="entry in sortedEntries" :key="entry.card.cid" class="relative">
          <img :src="entry.imageUrl" :alt="entry.card.cardName" class="aspect-5/7 w-full rounded-lg object-contain" />
          <span
            class="absolute -right-1 -top-1 flex h-8 min-w-8 items-center justify-center rounded-full bg-[#101117] px-1.5 text-sm font-bold text-white ring-2 ring-white">
            {{ entry.quantity }}
          </span>
          <p class="mt-1 truncate text-center text-xs" :class="titleClass">{{ entry.card.cardId }}</p>
        </article>
      </div>

      <div class="bg-[#101117] px-4 py-3 text-sm font-bold text-white">領航卡</div>
      <div class="grid grid-cols-3 gap-3 p-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9">
        <article class="relative">
          <img :src="draft.leaderImageUrl" :alt="draft.leader.cardName"
            class="aspect-5/7 w-full rounded-lg object-contain" />
          <span
            class="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#101117] text-sm font-bold text-white ring-2 ring-white">
            1
          </span>
          <p class="mt-1 truncate text-center text-xs" :class="titleClass">{{ draft.leader.cardId }}</p>
        </article>
      </div>
    </section>

    <div class="sticky bottom-0 mt-4 grid gap-3 bg-inherit py-4 sm:grid-cols-3">
      <button type="button" class="rounded-full border px-5 py-3.5 text-sm font-bold transition"
        :class="returnButtonClass" @click="emit('close')">
        回到我的牌組
      </button>
      <button type="button"
        class="rounded-full bg-rose-100 px-5 py-3.5 text-sm font-bold text-rose-600 hover:bg-rose-200"
        @click="editDeck">
        編輯牌組
      </button>
      <button type="button"
        class="rounded-full border px-5 py-3.5 text-sm font-bold transition active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        :class="primaryActionButtonClass" :disabled="isSaving" @click="saveDeck">
        {{ isSaving ? (isEditing ? '更新中...' : '儲存中...') : (isEditing ? '更新牌組' : '儲存牌組') }}
      </button>
    </div>

    <DeckSortDialog v-if="isSortDialogOpen" @close="isSortDialogOpen = false" @select="applyDeckSort" />
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { createDeck, updateDeck } from '@/api/deckApi'
import { resolveApiError } from '@/api/resolveApiError'
import DeckSortDialog from '@/components/deck/DeckSortDialog.vue'
import { usePreferencesStore } from '@/stores/preferencesStore'
import type { DeckDraft } from '@/types/deck'
import { showSuccessAlert } from '@/utils/alerts'
import { sortDeckEntries, type DeckSortOption } from '@/utils/deckSort'

const props = defineProps<{
  draft: DeckDraft
}>()

const emit = defineEmits<{
  edit: [draft: DeckDraft]
  saved: [deckId: number]
  close: []
}>()

const preferences = usePreferencesStore()
const deckCode = ref(props.draft.code ?? createDeckCode())
const persistedDeckId = ref(props.draft.id)
const sortedEntries = ref(props.draft.entries.map((entry) => ({ ...entry, card: { ...entry.card } })))
const isExporting = ref(false)
const isSaving = ref(false)
const isSortDialogOpen = ref(false)
const actionMessage = ref('')
const actionError = ref('')

const mainDeckCount = computed(() =>
  sortedEntries.value.reduce((total, entry) => total + entry.quantity, 0),
)
const isEditing = computed(() => persistedDeckId.value !== undefined)
const regulationLabel = computed(() =>
  props.draft.regulation === 'standard'
    ? 'Standard Regulation For Asia'
    : 'Extra Regulation For Asia',
)

function createDeckCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  return Array.from(bytes, (value) => alphabet[value % alphabet.length]).join('')
}

async function copyDeckCode(): Promise<void> {
  try {
    await navigator.clipboard.writeText(deckCode.value)
    actionError.value = ''
    actionMessage.value = '牌組代碼已複製。'
  } catch {
    actionMessage.value = ''
    actionError.value = '無法複製牌組代碼，請手動選取複製。'
  }
}

function applyDeckSort(options: DeckSortOption[]): void {
  sortedEntries.value = sortDeckEntries(sortedEntries.value, options)
  isSortDialogOpen.value = false
}

async function saveDeck(): Promise<void> {
  if (isSaving.value) return
  isSaving.value = true
  actionMessage.value = ''
  actionError.value = ''

  try {
    const wasEditing = persistedDeckId.value !== undefined
    const input = {
      code: deckCode.value,
      regulation: props.draft.regulation,
      leaderCid: props.draft.leader.cid,
      leaderFileId: props.draft.leaderFileId,
      cards: sortedEntries.value.map(({ card, quantity, fileId }) => ({
        cid: card.cid,
        quantity,
        fileId,
      })),
    }
    if (persistedDeckId.value === undefined) {
      const created = await createDeck(input)
      persistedDeckId.value = created.id
    } else {
      await updateDeck(persistedDeckId.value, input)
    }
    if (wasEditing) {
      await showSuccessAlert('牌組編輯完成。')
    } else {
      await showSuccessAlert('牌組已儲存到資料庫。')
    }
    emit('saved', persistedDeckId.value)
  } catch (error) {
    actionError.value = resolveApiError(error)
  } finally {
    isSaving.value = false
  }
}

function editDeck(): void {
  emit('edit', {
    ...props.draft,
    id: persistedDeckId.value,
    code: deckCode.value,
    entries: sortedEntries.value.map((entry) => ({ ...entry, card: { ...entry.card } })),
  })
}

async function downloadDeckImage(): Promise<void> {
  isExporting.value = true
  actionError.value = ''
  actionMessage.value = ''

  try {
    const blob = await renderDeckImage()
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `optcg-deck-${deckCode.value}.png`
    anchor.hidden = true
    document.body.append(anchor)
    anchor.click()
    anchor.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
    actionMessage.value = '牌組圖片已下載。'
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : '牌組圖片產生失敗。'
  } finally {
    isExporting.value = false
  }
}

async function renderDeckImage(): Promise<Blob> {
  const width = 1600
  const padding = 64
  const columns = 8
  const cardWidth = 160
  const cardHeight = 224
  const gapX = 28
  const gapY = 64
  const rows = Math.ceil(sortedEntries.value.length / columns)
  const leaderTop = 250 + rows * (cardHeight + gapY) + 100
  const height = leaderTop + cardHeight + 180
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('瀏覽器不支援圖片產生功能。')

  context.fillStyle = '#f4f3fb'
  context.fillRect(0, 0, width, height)
  context.fillStyle = '#101117'
  context.fillRect(0, 0, width, 190)
  context.fillStyle = '#ffffff'
  context.font = '700 46px sans-serif'
  context.fillText('ONE PIECE CARD GAME', padding, 78)
  context.font = '700 30px sans-serif'
  context.fillText(regulationLabel.value, padding, 132)
  context.font = '500 22px sans-serif'
  context.fillText(`Deck Code: ${deckCode.value}`, padding, 168)

  context.fillStyle = '#101117'
  context.font = '700 26px sans-serif'
  context.fillText(`主牌組 ${mainDeckCount.value}`, padding, 235)

  const images = await Promise.all(sortedEntries.value.map((entry) => loadImage(entry.imageUrl)))
  sortedEntries.value.forEach((entry, index) => {
    const column = index % columns
    const row = Math.floor(index / columns)
    const x = padding + column * (cardWidth + gapX)
    const y = 260 + row * (cardHeight + gapY)
    context.drawImage(images[index]!, x, y, cardWidth, cardHeight)
    drawQuantityBadge(context, x + cardWidth - 8, y + 8, entry.quantity)
    context.fillStyle = '#101117'
    context.font = '600 20px sans-serif'
    context.textAlign = 'center'
    context.fillText(entry.card.cardId, x + cardWidth / 2, y + cardHeight + 28)
    context.textAlign = 'start'
  })

  context.fillStyle = '#101117'
  context.fillRect(0, leaderTop - 58, width, 48)
  context.fillStyle = '#ffffff'
  context.font = '700 24px sans-serif'
  context.fillText('領航卡', padding, leaderTop - 25)

  const leaderImage = await loadImage(props.draft.leaderImageUrl)
  context.drawImage(leaderImage, padding, leaderTop, cardWidth, cardHeight)
  drawQuantityBadge(context, padding + cardWidth - 8, leaderTop + 8, 1)
  context.fillStyle = '#101117'
  context.font = '600 20px sans-serif'
  context.textAlign = 'center'
  context.fillText(props.draft.leader.cardId, padding + cardWidth / 2, leaderTop + cardHeight + 28)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('牌組圖片產生失敗。'))),
      'image/png',
    )
  })
}

async function loadImage(url: string): Promise<ImageBitmap> {
  const response = await fetch(url, { credentials: 'include', cache: 'no-store' })
  if (!response.ok) throw new Error('無法載入牌組卡片圖片。')
  return createImageBitmap(await response.blob())
}

function drawQuantityBadge(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  quantity: number,
): void {
  context.beginPath()
  context.arc(x, y, 24, 0, Math.PI * 2)
  context.fillStyle = '#101117'
  context.fill()
  context.fillStyle = '#ffffff'
  context.font = '700 24px sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(String(quantity), x, y + 1)
  context.textAlign = 'start'
  context.textBaseline = 'alphabetic'
}

const titleClass = computed(() => (preferences.isDark ? 'text-slate-100' : 'text-slate-900'))
const mutedTextClass = computed(() => (preferences.isDark ? 'text-slate-400' : 'text-slate-500'))
const panelClass = computed(() =>
  preferences.isDark ? 'border-white/10 bg-slate-900/70' : 'border-slate-200 bg-white shadow-sm',
)
const borderClass = computed(() => (preferences.isDark ? 'border-white/10' : 'border-slate-200'))
const softButtonClass = computed(() =>
  preferences.isDark
    ? 'bg-white/10 text-slate-100 hover:bg-white/15 disabled:opacity-50'
    : 'bg-slate-100 text-slate-800 hover:bg-slate-200 disabled:opacity-50',
)
const returnButtonClass = computed(() =>
  preferences.isDark
    ? 'border-indigo-400 bg-indigo-500 text-white shadow-sm hover:border-indigo-300 hover:bg-indigo-400'
    : 'border-indigo-600 bg-indigo-600 text-white shadow-sm hover:border-indigo-700 hover:bg-indigo-700',
)
const primaryActionButtonClass = computed(() =>
  preferences.isDark
    ? 'border-rose-400/40 bg-rose-500 text-white shadow-sm enabled:hover:bg-rose-400'
    : 'border-rose-600 bg-rose-600 text-white shadow-sm enabled:hover:border-rose-700 enabled:hover:bg-rose-700',
)
</script>
