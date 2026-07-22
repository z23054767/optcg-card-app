<template>
  <div v-if="open" class="fixed right-2 top-14 z-50 w-64 rounded-lg border bg-white shadow-lg py-2">
    <div class="px-4 py-2">
      <div class="font-semibold text-sm text-gray-800 truncate">👤 {{ name }}</div>

      <div class="text-xs text-gray-500 mt-1 truncate">
        {{ account }}
      </div>
    </div>

    <div class="border-t my-1"></div>

    <button
      class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center justify-between"
      @click="$emit('open-invitations')"
    >
      <span>📨 收到的邀請</span>

      <span
        v-if="invitationCount > 0"
        class="text-xs bg-red-500 text-white rounded-full px-2 py-0.5"
      >
        {{ invitationCount }}
      </span>
    </button>

    <div class="border-t my-1"></div>

    <button class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100" @click="$emit('close')">
      ⚙ 個人設定
    </button>

    <button
      class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-600"
      @click="$emit('logout')"
    >
      🚪 登出
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  open: boolean
  name: string
  account: string
  invitationCount: number
}>()

defineEmits<{
  close: []
  logout: []
  'open-invitations': []
}>()
</script>
