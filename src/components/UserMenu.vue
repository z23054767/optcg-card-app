<template>
  <div v-if="open" class="fixed right-2 top-14 z-50 w-64 rounded-lg border bg-white py-2 shadow-lg">
    <div class="px-4 py-2">
      <div class="flex items-center gap-3">
        <UserAvatar class="h-10 w-10 text-sm" :avatar-url="avatarUrl" :name="displayName" :account="name" />

        <div class="min-w-0">
          <div class="truncate text-sm font-semibold text-gray-800">
            {{ displayName }}
          </div>

          <div class="mt-0.5 truncate text-xs text-gray-500">
            @{{ name }}
          </div>
        </div>
      </div>
    </div>

    <div class="my-1 border-t"></div>

    <button class="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-gray-100"
      @click="$emit('open-invitations')">
      <span>📨 收到的邀請</span>

      <span v-if="invitationCount > 0" class="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
        {{ invitationCount }}
      </span>
    </button>

    <div class="my-1 border-t"></div>

    <button class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100" @click="$emit('open-settings')">
      ⚙ 個人設定
    </button>

    <button class="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100" @click="$emit('logout')">
      🚪 登出
    </button>
  </div>
</template>

<script setup lang="ts">
import UserAvatar from '@/components/base/UserAvatar.vue'

defineProps<{
  open: boolean
  displayName: string
  name: string
  invitationCount: number
  avatarUrl: string | null
}>()

defineEmits<{
  close: []
  logout: []
  'open-invitations': []
  'open-settings': []
}>()
</script>