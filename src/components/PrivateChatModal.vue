<template>
  <Transition name="modal-fade" appear>
    <div
      class="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm"
      :class="preferences.isDark ? 'bg-slate-950/70' : 'bg-slate-900/35'"
      @click.self="$emit('close')"
    >
      <div
        class="modal-panel w-full max-w-xl overflow-hidden rounded-2xl border shadow-2xl"
        :class="
          preferences.isDark
            ? 'border-white/10 bg-slate-900/95 text-slate-100 shadow-black/40'
            : 'border-slate-200 bg-white/96 text-slate-900 shadow-slate-900/15'
        "
      >
        <div
          class="relative border-b px-5 py-4 sm:px-6"
          :class="preferences.isDark ? 'border-white/8' : 'border-slate-200'"
        >
          <div class="pr-10">
            <div
              class="mb-2 inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-medium"
              :class="
                preferences.isDark
                  ? 'bg-emerald-500/12 text-emerald-300'
                  : 'bg-emerald-100 text-emerald-700'
              "
            >
              <span class="text-xs">✦</span>
              社交互動
            </div>

            <h2
              class="text-lg font-semibold tracking-tight"
              :class="preferences.isDark ? 'text-white' : 'text-slate-900'"
            >
              新增好友
            </h2>

            <p
              class="mt-1 text-xs leading-5 sm:text-sm"
              :class="preferences.isDark ? 'text-slate-400' : 'text-slate-500'"
            >
              輸入對方的使用者名稱（@name）搜尋並發送好友邀請。
            </p>
          </div>

          <button
            type="button"
            class="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full transition"
            :class="
              preferences.isDark
                ? 'text-slate-400 hover:bg-white/8 hover:text-white'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
            "
            aria-label="關閉"
            @click="$emit('close')"
          >
            ✕
          </button>
        </div>

        <div class="space-y-4 px-5 py-5 sm:px-6">
          <div>
            <label
              class="mb-2 block text-xs font-medium tracking-wide"
              :class="preferences.isDark ? 'text-slate-300' : 'text-slate-700'"
            >
              使用者名稱
            </label>

            <div class="relative">
              <input
                v-model="keyword"
                type="text"
                class="w-full rounded-xl border px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2"
                :class="{
                  'border-red-400/80 focus:border-red-400 focus:ring-red-500/20':
                    keywordValidationMessage,
                  'border-slate-700 bg-slate-950/70 text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:ring-indigo-500/25':
                    preferences.isDark && !keywordValidationMessage,
                  'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500/20':
                    !preferences.isDark && !keywordValidationMessage,
                }"
                placeholder="例如：@wayne"
                autocomplete="off"
                spellcheck="false"
                maxlength="31"
              />

              <div
                v-if="searching"
                class="absolute inset-y-0 right-3 flex items-center"
                aria-label="搜尋中"
              >
                <span
                  class="h-4 w-4 animate-spin rounded-full border-2 border-t-indigo-400"
                  :class="preferences.isDark ? 'border-slate-600' : 'border-slate-300'"
                ></span>
              </div>

              <button
                v-else-if="keyword"
                type="button"
                class="absolute inset-y-0 right-2 flex items-center px-2 text-sm transition"
                :class="
                  preferences.isDark
                    ? 'text-slate-500 hover:text-slate-200'
                    : 'text-slate-400 hover:text-slate-700'
                "
                aria-label="清除搜尋"
                @click="clearSearch"
              >
                ✕
              </button>
            </div>

            <p
              v-if="keywordValidationMessage"
              class="mt-2 text-xs"
              :class="preferences.isDark ? 'text-red-400' : 'text-red-600'"
            >
              {{ keywordValidationMessage }}
            </p>

            <p
              v-else
              class="mt-2 text-xs leading-5"
              :class="preferences.isDark ? 'text-slate-400' : 'text-slate-500'"
            >
              請以 @ 開頭，使用者名稱僅能包含英文字母、數字與底線。
            </p>
          </div>

          <div
            class="rounded-2xl border p-3"
            :class="
              preferences.isDark
                ? 'border-white/8 bg-slate-950/45'
                : 'border-slate-200 bg-slate-50'
            "
          >
            <div class="mb-3 flex items-center justify-between">
              <div
                class="text-sm font-medium"
                :class="preferences.isDark ? 'text-slate-200' : 'text-slate-800'"
              >
                搜尋結果
              </div>
              <div class="text-xs text-slate-500">
                {{ users.length > 0 ? `${users.length} 位使用者` : '等待搜尋' }}
              </div>
            </div>

            <div class="max-h-80 space-y-2 overflow-y-auto pr-1">
              <div
                v-if="!keyword.trim()"
                class="rounded-xl border border-dashed px-4 py-8 text-center"
                :class="
                  preferences.isDark
                    ? 'border-white/10 bg-white/[0.03]'
                    : 'border-slate-200 bg-white'
                "
              >
                <div
                  class="mx-auto flex h-10 w-10 items-center justify-center rounded-full"
                  :class="
                    preferences.isDark
                      ? 'bg-emerald-500/12 text-emerald-300'
                      : 'bg-emerald-100 text-emerald-700'
                  "
                >
                  🔎
                </div>
                <div
                  class="mt-3 text-sm font-medium"
                  :class="preferences.isDark ? 'text-slate-200' : 'text-slate-800'"
                >
                  輸入使用者名稱開始搜尋
                </div>
                <div class="mt-1 text-xs leading-5 text-slate-500">
                  例如輸入 @wayne，系統會自動查找可邀請的使用者。
                </div>
              </div>

              <div
                v-else-if="keywordValidationMessage"
                class="rounded-xl border border-dashed px-4 py-8 text-center"
                :class="
                  preferences.isDark
                    ? 'border-amber-500/20 bg-amber-500/6'
                    : 'border-amber-200 bg-amber-50'
                "
              >
                <div
                  class="mx-auto flex h-10 w-10 items-center justify-center rounded-full"
                  :class="
                    preferences.isDark
                      ? 'bg-amber-500/12 text-amber-300'
                      : 'bg-amber-100 text-amber-700'
                  "
                >
                  ⚠️
                </div>
                <div
                  class="mt-3 text-sm font-medium"
                  :class="preferences.isDark ? 'text-slate-200' : 'text-slate-800'"
                >
                  請輸入有效的使用者名稱
                </div>
                <div class="mt-1 text-xs leading-5 text-slate-500">格式需為 @username。</div>
              </div>

              <div
                v-else-if="searching && users.length === 0"
                class="rounded-xl border border-dashed px-4 py-8 text-center"
                :class="
                  preferences.isDark
                    ? 'border-white/10 bg-white/[0.03]'
                    : 'border-slate-200 bg-white'
                "
              >
                <div
                  class="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-t-indigo-400"
                  :class="preferences.isDark ? 'border-slate-600' : 'border-slate-300'"
                ></div>
                <div
                  class="mt-3 text-sm font-medium"
                  :class="preferences.isDark ? 'text-slate-200' : 'text-slate-800'"
                >
                  正在搜尋使用者…
                </div>
                <div class="mt-1 text-xs text-slate-500">請稍候一下</div>
              </div>

              <div
                v-else-if="searched && !searching && users.length === 0"
                class="rounded-xl border border-dashed px-4 py-8 text-center"
                :class="
                  preferences.isDark
                    ? 'border-white/10 bg-white/[0.03]'
                    : 'border-slate-200 bg-white'
                "
              >
                <div
                  class="mx-auto flex h-10 w-10 items-center justify-center rounded-full"
                  :class="
                    preferences.isDark
                      ? 'bg-emerald-500/12 text-emerald-300'
                      : 'bg-emerald-100 text-emerald-700'
                  "
                >
                  😶
                </div>
                <div
                  class="mt-3 text-sm font-medium"
                  :class="preferences.isDark ? 'text-slate-200' : 'text-slate-800'"
                >
                  找不到符合的使用者
                </div>
                <div class="mt-1 text-xs leading-5 text-slate-500">
                  請確認 Username 是否正確，或稍後再試。
                </div>
              </div>

              <div
                v-for="user in users"
                :key="user.userId"
                class="flex items-center gap-3 rounded-xl border p-3 transition"
                :class="
                  preferences.isDark
                    ? 'border-white/8 bg-white/[0.03] hover:border-indigo-400/30 hover:bg-indigo-500/6'
                    : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/60'
                "
              >
                <UserAvatar
                  class="h-10 w-10 shrink-0 text-sm ring-1 ring-white/10"
                  :avatar-url="user.avatarUrl"
                  :display-name="user.displayName || user.name"
                  :username="user.name"
                  :user-id="user.userId"
                />

                <div class="min-w-0 flex-1">
                  <div
                    class="truncate text-sm font-semibold"
                    :class="preferences.isDark ? 'text-slate-100' : 'text-slate-900'"
                  >
                    {{ user.displayName || user.name }}
                  </div>

                  <div
                    class="mt-0.5 truncate text-xs"
                    :class="preferences.isDark ? 'text-slate-400' : 'text-slate-500'"
                  >
                    @{{ user.name }}
                  </div>
                </div>

                <span
                  v-if="user.blockStatus === 'blocked_by_me'"
                  class="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  :class="
                    preferences.isDark
                      ? 'bg-slate-500/12 text-slate-300'
                      : 'bg-slate-100 text-slate-700'
                  "
                >
                  已封鎖
                </span>

                <span
                  v-else-if="user.blockStatus === 'blocked_me'"
                  class="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  :class="
                    preferences.isDark
                      ? 'bg-red-500/12 text-red-300'
                      : 'bg-red-100 text-red-700'
                  "
                >
                  已被封鎖
                </span>

                <span
                  v-if="user.friendshipStatus === 'friend'"
                  class="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  :class="
                    preferences.isDark
                      ? 'bg-emerald-500/12 text-emerald-300'
                      : 'bg-emerald-100 text-emerald-700'
                  "
                >
                  已是好友
                </span>

                <span
                  v-else-if="user.friendshipStatus === 'outgoing_pending'"
                  class="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  :class="
                    preferences.isDark
                      ? 'bg-amber-500/12 text-amber-300'
                      : 'bg-amber-100 text-amber-700'
                  "
                >
                  邀請已送出
                </span>

                <span
                  v-else-if="user.friendshipStatus === 'incoming_pending'"
                  class="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  :class="
                    preferences.isDark
                      ? 'bg-sky-500/12 text-sky-300'
                      : 'bg-sky-100 text-sky-700'
                  "
                >
                  待你接受
                </span>

                <button
                  v-else-if="user.blockStatus === 'none'"
                  type="button"
                  class="shrink-0 rounded-xl bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
                  :disabled="inviting"
                  @click="$emit('invite', user)"
                >
                  {{ invitingUserId === user.userId ? '邀請中…' : '發送邀請' }}
                </button>

                <span
                  v-else
                  class="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  :class="
                    preferences.isDark
                      ? 'bg-slate-500/12 text-slate-300'
                      : 'bg-slate-100 text-slate-700'
                  "
                >
                  封鎖中
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import UserAvatar from '@/components/base/UserAvatar.vue'
import { usePreferencesStore } from '@/stores/preferencesStore'
import type { ChatUserSearchItem } from '@/types/chat'

defineProps<{
  users: ChatUserSearchItem[]
  searching: boolean
  inviting: boolean
  invitingUserId: string | null
  searched: boolean
}>()

const emit = defineEmits<{
  close: []
  search: [keyword: string]
  clear: []
  invite: [user: ChatUserSearchItem]
}>()

const preferences = usePreferencesStore()
const keyword = ref('')

let searchTimer: ReturnType<typeof setTimeout> | null = null

const normalizedUsername = computed(() => {
  const value = keyword.value.trim()

  if (!value.startsWith('@')) {
    return ''
  }

  return value.slice(1)
})

const keywordValidationMessage = computed(() => {
  const value = keyword.value.trim()

  if (!value) {
    return ''
  }

  if (!value.startsWith('@')) {
    return '請輸入 @使用者名稱 才能開始搜尋'
  }

  const username = value.slice(1)

  if (!username) {
    return '請在 @ 後輸入使用者名稱'
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return '使用者名稱僅能包含英文字母、數字與底線（_）'
  }

  if (username.length < 3) {
    return '使用者名稱長度至少需要 3 碼'
  }

  if (username.length > 30) {
    return '使用者名稱長度不可超過 30 碼'
  }

  return ''
})

watch(keyword, () => {
  clearSearchTimer()

  const value = keyword.value.trim()

  if (!value) {
    emit('clear')
    return
  }

  if (!value.startsWith('@')) {
    emit('clear')
    return
  }

  const username = normalizedUsername.value

  if (!username || keywordValidationMessage.value) {
    emit('clear')
    return
  }

  searchTimer = setTimeout(() => {
    emit('search', username)
    searchTimer = null
  }, 300)
})

function clearSearch(): void {
  keyword.value = ''
  clearSearchTimer()
  emit('clear')
}

function clearSearchTimer(): void {
  if (!searchTimer) {
    return
  }

  clearTimeout(searchTimer)
  searchTimer = null
}

onBeforeUnmount(() => {
  clearSearchTimer()
})
</script>
