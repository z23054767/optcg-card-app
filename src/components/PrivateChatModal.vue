<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" @click.self="$emit('close')">
    <div class="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
      <div class="mb-4 flex items-center justify-between">
        <div>
          <h2 class="font-semibold text-gray-800">新增好友</h2>

          <p class="mt-1 text-xs text-gray-500">輸入姓名關鍵字，或輸入完整 Email 搜尋。</p>
        </div>

        <button type="button" class="rounded-full p-2 text-gray-500 hover:bg-gray-100" aria-label="關閉"
          @click="$emit('close')">
          ✕
        </button>
      </div>

      <div class="relative">
        <input v-model="keyword" type="text"
          class="w-full rounded-lg border px-3 py-2 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          placeholder="搜尋姓名或 Email" autocomplete="off" />

        <div v-if="searching" class="absolute inset-y-0 right-3 flex items-center">
          <span class="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600">
          </span>
        </div>

        <button v-else-if="keyword" type="button"
          class="absolute inset-y-0 right-2 flex items-center px-2 text-sm text-gray-400 hover:text-gray-600"
          aria-label="清除搜尋" @click="clearSearch">
          ✕
        </button>
      </div>

      <div class="mt-4 max-h-80 space-y-2 overflow-y-auto">
        <div v-if="!keyword.trim()" class="py-8 text-center text-sm text-gray-400">
          輸入姓名或 Email 開始搜尋
        </div>

        <div v-else-if="searched && !searching && users.length === 0" class="py-8 text-center text-sm text-gray-400">
          找不到符合的使用者
        </div>

        <div v-for="user in users" :key="user.userId" class="flex w-full items-center gap-3 rounded-lg border p-3">
          <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100">
            👤
          </span>

          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-semibold text-gray-800">
              {{ user.name }}
            </span>

            <span class="block truncate text-xs text-gray-500">
              {{ user.account }}
            </span>
          </span>

          <span v-if="user.friendshipStatus === 'friend'" class="shrink-0 text-xs font-medium text-green-600">
            已經是朋友
          </span>

          <span v-else-if="user.friendshipStatus === 'outgoing_pending'"
            class="shrink-0 text-xs font-medium text-amber-600">
            已發送邀請
          </span>

          <span v-else-if="user.friendshipStatus === 'incoming_pending'"
            class="shrink-0 text-xs font-medium text-blue-600">
            對方已邀請你
          </span>

          <button v-else type="button"
            class="shrink-0 rounded px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="inviting" @click="$emit('invite', user)">
            {{
              invitingUserId === user.userId
                ? "邀請中…"
                : "發送好友邀請"
            }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
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

watch(keyword, (value) => {
  clearSearchTimer()

  const trimmedKeyword = value.trim()

  if (!trimmedKeyword) {
    emit('clear')
    return
  }

  searchTimer = setTimeout(() => {
    emit('search', trimmedKeyword)
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
