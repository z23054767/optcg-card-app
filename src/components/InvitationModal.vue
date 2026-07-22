<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
    <div class="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-4 shadow-lg">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="font-semibold text-gray-800">
          收到的邀請
        </h2>

        <button type="button" class="text-gray-500 hover:text-gray-700" aria-label="關閉" @click="$emit('close')">
          ×
        </button>
      </div>

      <div v-if="invitations.length === 0" class="py-8 text-center text-sm text-gray-500">
        目前沒有收到邀請
      </div>

      <div v-else class="space-y-3">
        <div v-for="invitation in invitations" :key="invitation.invitationId"
          class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div v-if="invitation.roomType === 'group'" class="flex items-center gap-2">
            <span class="text-xl">
              💬
            </span>

            <div class="truncate font-semibold text-gray-900">
              {{ invitation.roomName || "聊天室" }}
            </div>
          </div>

          <div :class="invitation.roomType === 'group' ? 'mt-4' : ''" class="flex items-start gap-3">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg">
              👤
            </div>

            <div class="min-w-0 flex-1">
              <div class="truncate font-medium text-gray-800">
                {{ invitation.inviterName }}
              </div>

              <div class="truncate text-sm text-gray-500">
                {{ invitation.inviterAccount }}
              </div>

              <div class="mt-2 text-sm text-gray-600">
                {{
                  invitation.roomType === "private"
                    ? "邀請你開始私人聊天"
                    : "邀請你加入此聊天室"
                }}
              </div>
            </div>
          </div>

          <div class="mt-5 flex justify-end gap-2">
            <button type="button" class="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-100"
              @click="$emit('reject', invitation.invitationId)">
              拒絕
            </button>

            <button type="button" class="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
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
import type { ChatInvitation } from "@/types/chat"

defineProps<{
  invitations: ChatInvitation[]
}>()

defineEmits<{
  close: []
  accept: [invitationId: string]
  reject: [invitationId: string]
}>()
</script>