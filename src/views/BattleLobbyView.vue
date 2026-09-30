<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
    <AppHeader />
    <main class="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-4 md:py-8">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">Online Battle</p>
          <h1 class="mt-1 text-2xl md:text-3xl font-black">線上卡牌對戰</h1>
        </div>
        <span class="rounded-full border px-3 py-1 text-xs font-bold" :class="connected ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' : 'border-amber-400/40 bg-amber-400/10 text-amber-300'">
          {{ connected ? '大廳已連線' : '連線中' }}
        </span>
      </div>

      <section class="grid flex-1 gap-5 lg:grid-cols-[1fr_340px]">
        <div class="rounded-2xl border border-white/10 bg-slate-900/80 p-4 md:p-6">
          <h2 class="text-lg font-bold">選擇目前使用牌組</h2>
          <p class="mt-1 text-sm text-slate-400">只有合法牌組可以加入配對，配對成功後將鎖定本場牌組內容。</p>
          <div v-if="loading" class="py-16 text-center text-slate-400">載入牌組中…</div>
          <div v-else-if="decks.length === 0" class="py-16 text-center text-slate-400">尚無可用牌組，請先至牌組編輯器建立牌組。</div>
          <div v-else class="mt-4 grid gap-3 sm:grid-cols-2">
            <button v-for="deck in decks" :key="deck.id" type="button" :disabled="!deck.isLegal || queued" class="rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-40" :class="selectedDeckId === deck.id ? 'border-cyan-400 bg-cyan-400/10' : 'border-white/10 bg-slate-950/60 hover:border-cyan-400/50'" @click="selectDeck(deck.id)">
              <div class="flex items-start justify-between gap-3"><strong class="truncate">{{ deck.name }}</strong><span class="rounded bg-white/5 px-2 py-0.5 text-[11px] shrink-0">{{ deck.regulation }}</span></div>
              <p class="mt-2 text-xs text-slate-400">{{ deck.leaderCardId }} · {{ deck.totalCards }} 張</p>
              <p class="mt-2 text-xs" :class="deck.isLegal ? 'text-emerald-300' : 'text-rose-300'">{{ deck.isLegal ? '可參加對戰' : '牌組不合法' }}</p>
            </button>
          </div>
        </div>
        <aside class="flex flex-col justify-between rounded-2xl border border-white/10 bg-gradient-to-b from-indigo-950 to-slate-900 p-5">
          <div><h2 class="text-lg font-bold">快速配對</h2><p class="mt-2 text-sm leading-6 text-slate-300">配對成功後會載入 Cocos 對戰遊戲；猜拳、先後攻與開局操作皆在遊戲內完成。</p></div>
          <div class="mt-6">
            <button v-if="!queued" type="button" :disabled="!selectedDeckId || !connected" class="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 px-4 py-3.5 font-black text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40" @click="joinQueue">加入配對</button>
            <button v-else type="button" class="w-full rounded-xl border border-rose-400/40 bg-rose-400/10 px-4 py-3.5 font-bold text-rose-200" @click="leaveQueue">取消配對</button>
            <div v-if="queued" class="mt-4 flex items-center justify-center gap-3 text-sm text-cyan-200"><span class="h-4 w-4 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />正在尋找對手…</div>
          </div>
        </aside>
      </section>

      <p v-if="error" class="mt-4 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{{ error }}</p>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import { getMyDecks, type DeckListItem } from '@/api/deckApi'
import { refreshAccessToken } from '@/api/http'
import router from '@/router'
import { useAuthStore } from '@/stores/authStore'
import { BattleSocket, type BattleWsMessage } from '@/websocket/battleSocket'

const DEFAULT_COCOS_PREVIEW_URL = 'http://127.0.0.1:7456/'
const DEFAULT_BATTLE_GAME_URL = '/battle-game/'

function getBattleGameBaseUrl(): string {
  const configuredUrl = import.meta.env.DEV
    ? import.meta.env.VITE_COCOS_PREVIEW_URL || DEFAULT_COCOS_PREVIEW_URL
    : import.meta.env.VITE_BATTLE_GAME_URL || DEFAULT_BATTLE_GAME_URL

  return configuredUrl.replace(/\/index\.html$/, '/')
}

function getBattleWebSocketUrl(): string {
  return import.meta.env.VITE_BATTLE_WS_URL
    || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/battle`
}

function createCocosGameUrl(roomId: string, token: string): string {
  const gameUrl = new URL(getBattleGameBaseUrl(), window.location.origin)
  gameUrl.searchParams.set('roomId', roomId)
  gameUrl.searchParams.set('battleWsUrl', getBattleWebSocketUrl())
  gameUrl.searchParams.set('returnUrl', new URL('/battle', window.location.origin).toString())
  gameUrl.hash = new URLSearchParams({ token }).toString()

  return gameUrl.toString()
}

const auth = useAuthStore()
const decks = ref<DeckListItem[]>([])
const loading = ref(true)
const connected = ref(false)
const queued = ref(false)
const selectedDeckId = ref<number | null>(null)
const error = ref('')
const socket = new BattleSocket(handleEvent, (value) => (connected.value = value))

function handleEvent(event: BattleWsMessage) {
  switch (event.type) {
    case 'QUEUE_WAITING': queued.value = true; break
    case 'MATCH_FOUND':
      void launchBattle(event)
      break
    case 'ERROR': error.value = event.message || '對戰服務發生錯誤'; queued.value = false; break
  }
}

async function ensureFreshBattleAccessToken(): Promise<boolean> {
  if (!auth.isAccessTokenExpiring()) return true

  try {
    await refreshAccessToken()
    return true
  } catch {
    error.value = '登入已過期，請重新登入後再進入對戰。'
    auth.logout()
    await router.replace({
      path: '/login',
      query: { redirect: '/battle', reason: 'expired' },
    })
    return false
  }
}

async function launchBattle(event: BattleWsMessage): Promise<void> {
  queued.value = false
  if (!(await ensureFreshBattleAccessToken())) return

  const roomId = event.roomId
  if (!roomId) {
    error.value = '配對成功但未收到遊戲房間資訊。'
    return
  }

  window.location.assign(createCocosGameUrl(roomId, auth.token))
}

function selectDeck(deckId: number) { if (!queued.value) { error.value = ''; selectedDeckId.value = deckId } }
function joinQueue() { if (selectedDeckId.value && connected.value) socket.send({ type: 'QUEUE_MATCH', deckId: String(selectedDeckId.value) }) }
function leaveQueue() { socket.send({ type: 'CANCEL_QUEUE' }); queued.value = false }
async function loadDecks() { try { const res = await getMyDecks(undefined, 1, 50); decks.value = res.items.filter((deck) => deck.regulation !== 'idea'); selectedDeckId.value = decks.value.find((deck) => deck.isLegal)?.id ?? null } catch { error.value = '無法載入牌組，請稍後再試。' } finally { loading.value = false } }
async function initializeBattleLobby(): Promise<void> {
  if (await ensureFreshBattleAccessToken()) {
    socket.connect()
    await loadDecks()
  } else {
    loading.value = false
  }
}

onMounted(() => { void initializeBattleLobby() })
onBeforeUnmount(() => socket.close())
</script>
