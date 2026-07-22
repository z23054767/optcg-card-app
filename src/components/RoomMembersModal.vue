<template>
  <div class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
    <div class="bg-white rounded-xl shadow-lg w-full max-w-md p-4 max-h-[80vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-4">
        <h2 class="font-semibold text-gray-800">群組成員</h2>

        <button class="text-gray-500 hover:text-gray-700" @click="$emit('close')">×</button>
      </div>

      <div v-if="loading" class="py-8 text-center text-sm text-gray-500">載入中...</div>

      <div v-else-if="members.length === 0" class="py-8 text-center text-sm text-gray-500">
        尚無成員資料
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="member in members"
          :key="member.userId"
          class="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2"
        >
          <div class="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-sm">
            👤
          </div>
          <div class="min-w-0 flex-1">
            <div class="truncate text-sm font-medium text-gray-800">{{ member.name }}</div>
            <div class="truncate text-xs text-gray-500">{{ member.account }}</div>
          </div>
          <span
            class="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium"
            :class="
              member.role === 'manager'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-gray-100 text-gray-600'
            "
          >
            {{ member.role === 'manager' ? '管理員' : '成員' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChatRoomMember } from '@/types/chat'

defineProps<{
  members: ChatRoomMember[]
  loading: boolean
}>()

defineEmits<{
  close: []
}>()
</script>
