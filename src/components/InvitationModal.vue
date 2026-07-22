<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" @click.self="$emit('close')">
    <div class="w-full max-w-md rounded-xl bg-white shadow-xl">
      <div class="flex items-center justify-between border-b px-5 py-4">
        <h2 class="text-lg font-semibold text-gray-800">收到的邀請</h2>

        <button type="button" class="text-gray-400 hover:text-gray-600" @click="$emit('close')">
          ✕
        </button>
      </div>

      <div class="max-h-[70vh] overflow-y-auto p-4">
        <div v-if="invitations.length === 0 && friendRequests.length === 0"
          class="py-8 text-center text-sm text-gray-500">
          目前沒有待處理的邀請
        </div>

        <section v-if="friendRequests.length > 0">
          <h3 class="mb-3 text-sm font-semibold text-gray-700">好友申請</h3>

          <div v-for="request in friendRequests" :key="request.requestId" class="mb-3 rounded-lg border p-4">
            <div class="font-medium text-gray-800">
              {{ request.requesterName }}
            </div>

            <div class="mt-1 text-sm text-gray-500">
              {{ request.requesterAccount }}
            </div>

            <div class="mt-2 text-sm text-gray-600">向你發出好友申請</div>

            <div class="mt-4 flex justify-end gap-2">
              <button type="button"
                class="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="processingFriendRequestId === request.requestId"
                @click="$emit('reject-friend-request', request.requestId)">
                拒絕
              </button>

              <button type="button"
                class="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="processingFriendRequestId === request.requestId"
                @click="$emit('accept-friend-request', request.requestId)">
                接受
              </button>
            </div>
          </div>
        </section>

        <section v-if="invitations.length > 0" :class="{ 'mt-6': friendRequests.length > 0 }">
          <h3 class="mb-3 text-sm font-semibold text-gray-700">群組聊天室邀請</h3>

          <div v-for="invitation in invitations" :key="invitation.invitationId"
            class="mb-3 rounded-lg border p-4 last:mb-0">
            <div class="font-medium text-gray-800">
              {{ invitation.roomName }}
            </div>

            <div class="mt-1 text-sm text-gray-500">
              {{ invitation.inviterName }}
            </div>

            <div class="mt-2 text-sm text-gray-600">邀請你加入群組聊天室</div>

            <div class="mt-4 flex justify-end gap-2">
              <button type="button"
                class="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                @click="$emit('reject-invitation', invitation.invitationId)">
                拒絕
              </button>

              <button type="button" class="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                @click="$emit('accept-invitation', invitation.invitationId)">
                接受
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChatFriendRequest, ChatInvitation } from '@/types/chat'

defineProps<{
  invitations: ChatInvitation[]
  friendRequests: ChatFriendRequest[]
  processingFriendRequestId: string | null
}>()

defineEmits<{
  close: []
  'accept-invitation': [invitationId: string]
  'reject-invitation': [invitationId: string]
  'accept-friend-request': [requestId: string]
  'reject-friend-request': [requestId: string]
}>()
</script>
