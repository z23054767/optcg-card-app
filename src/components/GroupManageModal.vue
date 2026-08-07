<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" @click.self="$emit('close')">
    <div class="flex max-h-[88vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl">
      <div class="flex shrink-0 items-center justify-between border-b px-5 py-4">
        <h2 class="text-base font-bold text-gray-800">
          群組管理
        </h2>

        <button type="button"
          class="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          aria-label="關閉" @click="$emit('close')">
          ✕
        </button>
      </div>

      <div class="space-y-5 overflow-y-auto px-5 py-4">
        <!-- 群組資訊 -->
        <section>
          <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
            群組資訊
          </p>

          <div class="space-y-3">
            <div>
              <label class="mb-1 block text-sm text-gray-600">
                群組名稱
              </label>

              <input v-model="editRoomName" type="text"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                :disabled="updatingInfo" />
            </div>

            <div>
              <label class="mb-2 block text-sm text-gray-600">
                群組頭像
              </label>

              <AvatarCropper ref="avatarCropper" v-model:remove-avatar="removeAvatar"
                :current-avatar-url="currentAvatarUrl" current-avatar-label="目前群組頭像" current-avatar-alt="目前群組頭像"
                output-file-name="chat-room-avatar" :disabled="updatingInfo"
                @selection-change="hasSelectedAvatarFile = $event" />
            </div>

            <div class="flex justify-end">
              <button type="button"
                class="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                :disabled="updatingInfo || !canSaveInfo" @click="saveGroupInfo">
                {{ updatingInfo ? '儲存中…' : '儲存群組資訊' }}
              </button>
            </div>
          </div>
        </section>

        <!-- 成員管理 -->
        <section>
          <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
            成員管理
          </p>

          <div v-if="loadingMembers" class="py-6 text-center text-sm text-gray-400">
            載入中…
          </div>

          <div v-else class="space-y-2">
            <div v-for="member in members" :key="member.userId"
              class="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5">
              <UserAvatar
                class="h-9 w-9 shrink-0 text-sm"
                :avatar-url="member.avatarUrl"
                :display-name="member.displayName || member.name"
                :username="member.name"
                :user-id="member.userId"
              />

              <div class="min-w-0 flex-1">
                <div class="truncate text-sm font-medium text-gray-800">
                  {{ member.displayName || member.name }}
                </div>

                <div class="truncate text-xs text-gray-400">
                  @{{ member.name }}
                </div>
              </div>

              <span class="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold" :class="member.role === 'manager'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-gray-100 text-gray-500'
                ">
                {{ member.role === 'manager' ? '管理員' : '成員' }}
              </span>

              <div v-if="member.role !== 'manager'" class="shrink-0">
                <template v-if="transferringUserId === member.userId">
                  <span class="animate-pulse text-xs text-indigo-500">
                    轉讓中…
                  </span>
                </template>

                <template v-else-if="removingUserId === member.userId">
                  <span class="animate-pulse text-xs text-red-500">
                    移除中…
                  </span>
                </template>

                <template v-else-if="confirmingTransfer === member.userId">
                  <div class="flex flex-col items-end gap-1">
                    <span class="text-xs text-gray-600">
                      轉讓給
                      <b>{{ member.displayName || member.name }}</b>
                      ？
                    </span>

                    <div class="flex gap-1">
                      <button type="button"
                        class="rounded-lg bg-indigo-600 px-2 py-1 text-xs text-white hover:bg-indigo-700"
                        @click="confirmTransfer(member.userId)">
                        確認
                      </button>

                      <button type="button"
                        class="rounded-lg bg-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-300"
                        @click="confirmingTransfer = null">
                        取消
                      </button>
                    </div>
                  </div>
                </template>

                <template v-else-if="confirmingRemove === member.userId">
                  <div class="flex flex-col items-end gap-1">
                    <span class="text-xs text-gray-600">
                      移除
                      <b>{{ member.displayName || member.name }}</b>
                      ？
                    </span>

                    <div class="flex gap-1">
                      <button type="button" class="rounded-lg bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
                        @click="confirmRemove(member.userId)">
                        確認
                      </button>

                      <button type="button"
                        class="rounded-lg bg-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-300"
                        @click="confirmingRemove = null">
                        取消
                      </button>
                    </div>
                  </div>
                </template>

                <template v-else>
                  <div class="flex items-center gap-1.5">
                    <button type="button"
                      class="rounded-lg bg-indigo-600 px-2.5 py-1 text-xs text-white hover:bg-indigo-700"
                      @click="confirmingTransfer = member.userId">
                      轉讓
                    </button>

                    <button type="button" class="rounded-lg bg-red-600 px-2.5 py-1 text-xs text-white hover:bg-red-700"
                      @click="confirmingRemove = member.userId">
                      移除
                    </button>
                  </div>
                </template>
              </div>
            </div>

            <div v-if="members.length === 0" class="py-4 text-center text-sm text-gray-400">
              尚無成員資料
            </div>
          </div>
        </section>

        <!-- 邀請狀態 -->
        <section>
          <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
            邀請狀態
          </p>

          <div v-if="loadingInvitations" class="py-4 text-center text-sm text-gray-400">
            載入中…
          </div>

          <div v-else-if="invitations.length === 0" class="py-3 text-center text-sm text-gray-400">
            目前無待處理邀請
          </div>

          <div v-else class="space-y-2">
            <div v-for="invitation in invitations" :key="invitation.invitationId"
              class="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5">
              <UserAvatar
                class="h-9 w-9 shrink-0 text-sm"
                :avatar-url="invitation.inviteeAvatarUrl"
                :display-name="invitation.inviteeDisplayName || invitation.inviteeName"
                :username="invitation.inviteeName"
                :user-id="invitation.inviteeId"
              />

              <div class="min-w-0 flex-1">
                <div class="truncate text-sm font-medium text-gray-800">
                  {{ invitation.inviteeDisplayName || invitation.inviteeName }}
                </div>

                <div class="truncate text-xs text-gray-400">
                  @{{ invitation.inviteeName }}
                </div>
              </div>

              <template v-if="invitation.status === 'pending'">
                <span
                  class="shrink-0 rounded-full bg-yellow-100 px-2.5 py-0.5 text-[11px] font-semibold text-yellow-700">
                  邀請中
                </span>
              </template>

              <template v-else-if="invitation.status === 'rejected'">
                <span class="shrink-0 rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-semibold text-red-600">
                  已拒絕
                </span>

                <span v-if="reInvitingInviteeId === invitation.inviteeId"
                  class="shrink-0 animate-pulse text-xs text-indigo-500">
                  邀請中…
                </span>

                <button v-else type="button"
                  class="shrink-0 rounded-lg bg-indigo-600 px-2.5 py-1 text-xs text-white hover:bg-indigo-700"
                  @click="emit('re-invite', invitation.inviteeName)">
                  重新邀請
                </button>
              </template>

              <template v-else-if="invitation.status === 'accepted'">
                <span class="shrink-0 rounded-full bg-green-100 px-2.5 py-0.5 text-[11px] font-semibold text-green-700">
                  已接受
                </span>
              </template>
            </div>
          </div>
        </section>

        <!-- 刪除聊天室 -->
        <section class="pb-1">
          <div v-if="confirmingDelete" class="space-y-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p class="text-sm font-semibold text-red-700">
              ⚠️ 確定刪除這個聊天室？
            </p>

            <p class="text-xs text-red-500">
              此操作無法復原，所有訊息與成員都會一併移除。
            </p>

            <div class="flex justify-end gap-2">
              <button type="button" class="rounded-lg bg-gray-200 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-300"
                @click="confirmingDelete = false">
                取消
              </button>

              <button type="button"
                class="rounded-lg bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="deletingRoom" @click="confirmDelete">
                {{ deletingRoom ? '刪除中…' : '確認刪除' }}
              </button>
            </div>
          </div>

          <button v-else type="button"
            class="w-full rounded-xl border border-red-200 px-4 py-2.5 text-sm text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="deletingRoom" @click="confirmingDelete = true">
            刪除聊天室
          </button>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import UserAvatar from '@/components/base/UserAvatar.vue'
import AvatarCropper from '@/components/base/AvatarCropper.vue'
import type { AvatarCropperExpose } from './base/avatarCropper'
import type {
  ChatInvitation,
  ChatRoomListItem,
  ChatRoomMember,
} from '@/types/chat'
import { resolveChatRoomAvatarUrl } from '@/utils/chatRoomAvatar'

const props = defineProps<{
  room: ChatRoomListItem
  members: ChatRoomMember[]
  loadingMembers: boolean
  updatingInfo: boolean
  deletingRoom: boolean
  removingUserId: string | null
  transferringUserId: string | null
  invitations: ChatInvitation[]
  loadingInvitations: boolean
  reInvitingInviteeId: string | null
}>()

const emit = defineEmits<{
  close: []
  'save-info': [
    payload: {
      roomName: string
      avatarFile: File | null
      removeAvatar: boolean
    },
  ]
  'remove-member': [userId: string]
  'transfer-manager': [userId: string]
  'delete-room': []
  're-invite': [inviteeName: string]
}>()

const confirmingTransfer = ref<string | null>(null)
const confirmingRemove = ref<string | null>(null)
const confirmingDelete = ref(false)

const editRoomName = ref(props.room.name ?? '')
const avatarCropper = ref<AvatarCropperExpose | null>(null)
const hasSelectedAvatarFile = ref(false)
const removeAvatar = ref(false)

const currentAvatarUrl = computed(() => {
  return resolveChatRoomAvatarUrl(props.room.avatarUrl)
})

const canSaveInfo = computed(() => {
  const roomName = editRoomName.value.trim()

  if (!roomName) {
    return false
  }

  const originalName = props.room.name ?? ''

  return (
    roomName !== originalName ||
    hasSelectedAvatarFile.value ||
    removeAvatar.value
  )
})

function confirmTransfer(userId: string): void {
  confirmingTransfer.value = null
  emit('transfer-manager', userId)
}

function confirmRemove(userId: string): void {
  confirmingRemove.value = null
  emit('remove-member', userId)
}

function confirmDelete(): void {
  emit('delete-room')
}

async function saveGroupInfo(): Promise<void> {
  const avatarFile =
    (await avatarCropper.value?.createCroppedAvatarFile()) ?? null

  emit('save-info', {
    roomName: editRoomName.value.trim(),
    avatarFile,
    removeAvatar: removeAvatar.value,
  })
}

watch(
  () => props.room,
  (room) => {
    editRoomName.value = room.name ?? ''
    removeAvatar.value = false
    hasSelectedAvatarFile.value = false
    avatarCropper.value?.reset()
  },
  {
    deep: true,
  },
)
</script>