<template>
  <div class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
    <div class="bg-white rounded-xl shadow-lg w-full max-w-md p-4 max-h-[80vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-4">
        <h2 class="font-semibold text-gray-800">收到的邀請</h2>

        <button class="text-gray-500 hover:text-gray-700" @click="$emit('close')">×</button>
      </div>

      <div v-if="invitations.length === 0" class="text-sm text-gray-500 py-8 text-center">
        目前沒有收到邀請
      </div>

      <div v-else class="space-y-3">
        <div v-for="invitation in invitations" :key="invitation.invitationId"
          class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div class="flex items-center gap-2">
            <span class="text-xl">💬</span>
            <div class="font-semibold text-gray-900 truncate">
              {{ invitation.roomName || '聊天室' }}
            </div>
          </div>

          <div class="mt-4 flex items-start gap-3">
            <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-lg shrink-0">
              👤
            </div>

            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-800 truncate">
                {{ invitation.inviterName }}
              </div>

              <div class="text-sm text-gray-500 truncate">
                {{ invitation.inviterAccount }}
              </div>

              <div class="text-sm text-gray-600 mt-2">邀請你加入此聊天室</div>
            </div>
          </div>

          <div class="flex justify-end gap-2 mt-5">
            <button class="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
              @click="$emit('reject', invitation.invitationId)">
              拒絕
            </button>

            <button class="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              @click="$emit('accept', invitation.invitationId)">
              接受
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChatInvitation } from '@/types/chat'

defineProps<{
  invitations: ChatInvitation[]
}>()

defineEmits<{
  close: []
  accept: [invitationId: string]
  reject: [invitationId: string]
}>()
</script>
