<template>
  <header class="flex items-center justify-between px-4 py-3 border-b bg-white sticky top-0 z-10">
    <div class="flex items-center gap-3 min-w-0">
      <button class="sm:hidden text-xl" @click="$emit('toggle-sidebar')">☰</button>

      <div class="min-w-0">
        <h1 class="text-lg font-semibold text-gray-800 truncate">
          {{ title }}
        </h1>

        <button v-if="currentRoomId !== 'lobby'" class="text-xs text-blue-600 hover:underline"
          @click="$emit('back-to-lobby')">
          回到大廳
        </button>
      </div>
    </div>
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-2">
        <button class="text-sm px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 whitespace-nowrap"
          @click="$emit('create-room')">
          建立
        </button>
        <span class="hidden sm:inline text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full whitespace-nowrap">
          {{ onlineCount }} 人在線
        </span>
      </div>
      <button
        class="relative w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center shrink-0"
        @click="$emit('toggle-user-menu')"
      >
        👤
        <span
          v-if="hasUnreadInvitations"
          class="absolute -top-1 -right-1 h-4 min-w-4 rounded-full bg-red-500 text-white text-[10px] leading-4 text-center px-1 font-bold"
        >
          !
        </span>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  currentRoomId: string
  onlineCount: number
  hasUnreadInvitations: boolean
}>()

defineEmits<{
  'toggle-sidebar': []
  'create-room': []
  'back-to-lobby': []
  'toggle-user-menu': []
}>()
</script>
