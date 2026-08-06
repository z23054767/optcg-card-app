<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" @click.self="$emit('close')">
    <div class="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
      <div class="mb-4 flex items-center justify-between">
        <div>
          <h2 class="font-semibold text-gray-800">
            新增好友
          </h2>

          <p class="mt-1 text-xs text-gray-500">
            輸入對方的使用者名稱（@name）搜尋並發送好友邀請。
          </p>
        </div>

        <button type="button" class="rounded-full p-2 text-gray-500 hover:bg-gray-100" aria-label="關閉"
          @click="$emit('close')">
          ✕
        </button>
      </div>

      <div class="relative">
        <input v-model="keyword" type="text"
          class="w-full rounded-lg border px-3 py-2 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          :class="{
            'border-red-400 focus:border-red-500 focus:ring-red-100':
              keywordValidationMessage,
          }" placeholder="輸入使用者名稱" autocomplete="off" spellcheck="false" maxlength="31" />

        <div v-if="searching" class="absolute inset-y-0 right-3 flex items-center" aria-label="搜尋中">
          <span class="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600"></span>
        </div>

        <button v-else-if="keyword" type="button"
          class="absolute inset-y-0 right-2 flex items-center px-2 text-sm text-gray-400 hover:text-gray-600"
          aria-label="清除搜尋" @click="clearSearch">
          ✕
        </button>
      </div>

      <p v-if="keywordValidationMessage" class="mt-2 text-xs text-red-600">
        {{ keywordValidationMessage }}
      </p>

      <p v-else class="mt-2 text-xs text-gray-400">
        請以 @ 開頭，使用者名稱僅能包含英文字母、數字與底線。
      </p>

      <div class="mt-4 max-h-80 space-y-2 overflow-y-auto">
        <div v-if="!keyword.trim()" class="py-8 text-center text-sm text-gray-400">
          輸入使用者名稱開始搜尋
        </div>

        <div v-else-if="keywordValidationMessage" class="py-8 text-center text-sm text-gray-400">
          請輸入有效的使用者名稱
        </div>

        <div v-else-if="searching && users.length === 0" class="py-8 text-center text-sm text-gray-400">
          正在搜尋使用者…
        </div>

        <div v-else-if="searched && !searching && users.length === 0" class="py-8 text-center text-sm text-gray-400">
          找不到符合的使用者，請確認 Username 是否正確。
        </div>

        <div v-for="user in users" :key="user.userId"
          class="flex w-full items-center gap-3 rounded-lg border border-gray-200 p-3 transition hover:border-indigo-200 hover:bg-gray-50">
          <UserAvatar class="h-10 w-10 shrink-0 text-sm" :avatar-url="user.avatarUrl"
            :name="user.displayName || user.name" :account="user.name" :user-id="user.userId" />

          <div class="min-w-0 flex-1">
            <div class="truncate text-sm font-semibold text-gray-800">
              {{ user.displayName || user.name }}
            </div>

            <div class="truncate text-xs text-gray-500">
              @{{ user.name }}
            </div>
          </div>

          <span v-if="user.friendshipStatus === 'friend'"
            class="shrink-0 rounded-full bg-green-100 px-2.5 py-0.5 text-[11px] font-semibold text-green-700">
            已是好友
          </span>

          <span v-else-if="user.friendshipStatus === 'outgoing_pending'"
            class="shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
            邀請已送出
          </span>

          <span v-else-if="user.friendshipStatus === 'incoming_pending'"
            class="shrink-0 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
            待你接受
          </span>

          <button v-else type="button"
            class="shrink-0 rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="inviting" @click="$emit('invite', user)">
            {{ invitingUserId === user.userId ? '邀請中…' : '發送邀請' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import UserAvatar from '@/components/base/UserAvatar.vue'
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