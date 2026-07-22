<template>
  <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[88vh]">

      <!-- Sticky header -->
      <div class="flex items-center justify-between px-5 py-4 border-b shrink-0">
        <h2 class="text-base font-bold text-gray-800">群組管理</h2>
        <button
          class="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          @click="$emit('close')">
          ✕
        </button>
      </div>

      <!-- Scrollable body -->
      <div class="overflow-y-auto px-5 py-4 space-y-5">

        <!-- 群組資訊 -->
        <section>
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">群組資訊</p>
          <div class="space-y-3">
            <div>
              <label class="block text-sm text-gray-600 mb-1">群組名稱</label>
              <input v-model="editRoomName" type="text"
                class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                :disabled="updatingInfo" />
            </div>

            <div>
              <label class="block text-sm text-gray-600 mb-1">群組頭像 URL</label>
              <div class="flex gap-3 items-center">
                <div class="w-10 h-10 rounded-full overflow-hidden bg-gray-100 border shrink-0">
                  <img v-if="normalizedAvatarUrl" :src="normalizedAvatarUrl" alt="群組頭像"
                    class="w-full h-full object-cover" />
                  <div v-else class="w-full h-full flex items-center justify-center text-base">👥</div>
                </div>
                <input v-model="editAvatarUrl" type="text"
                  class="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="https://..." :disabled="updatingInfo" />
              </div>
            </div>

            <div class="flex justify-end">
              <button
                class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition"
                :disabled="updatingInfo || !canSaveInfo" @click="saveGroupInfo">
                {{ updatingInfo ? '儲存中…' : '儲存群組資訊' }}
              </button>
            </div>
          </div>
        </section>

        <!-- 成員管理 -->
        <section>
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">成員管理</p>
          <div v-if="loadingMembers" class="py-6 text-center text-sm text-gray-400">載入中…</div>
          <div v-else class="space-y-2">
            <div v-for="member in members" :key="member.userId"
              class="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5">
              <div class="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-sm shrink-0">👤</div>
              <div class="min-w-0 flex-1">
                <div class="truncate text-sm font-medium text-gray-800">{{ member.name }}</div>
                <div class="truncate text-xs text-gray-400">{{ member.account }}</div>
              </div>
              <span class="rounded-full px-2.5 py-0.5 text-[11px] font-semibold shrink-0"
                :class="member.role === 'manager' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'">
                {{ member.role === 'manager' ? '管理員' : '成員' }}
              </span>
              <div v-if="member.role !== 'manager'">
                <!-- loading 狀態 -->
                <template v-if="transferringUserId === member.userId">
                  <span class="text-xs text-indigo-500 animate-pulse">轉讓中…</span>
                </template>
                <template v-else-if="removingUserId === member.userId">
                  <span class="text-xs text-red-500 animate-pulse">移除中…</span>
                </template>

                <!-- 確認轉讓 -->
                <template v-else-if="confirmingTransfer === member.userId">
                  <div class="flex flex-col items-end gap-1">
                    <span class="text-xs text-gray-600">轉讓給 <b>{{ member.name }}</b>？</span>
                    <div class="flex gap-1">
                      <button class="px-2 py-1 text-xs rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                        @click="confirmTransfer(member.userId)">確認</button>
                      <button class="px-2 py-1 text-xs rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300"
                        @click="confirmingTransfer = null">取消</button>
                    </div>
                  </div>
                </template>

                <!-- 確認移除 -->
                <template v-else-if="confirmingRemove === member.userId">
                  <div class="flex flex-col items-end gap-1">
                    <span class="text-xs text-gray-600">移除 <b>{{ member.name }}</b>？</span>
                    <div class="flex gap-1">
                      <button class="px-2 py-1 text-xs rounded-lg bg-red-600 text-white hover:bg-red-700"
                        @click="confirmRemove(member.userId)">確認</button>
                      <button class="px-2 py-1 text-xs rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300"
                        @click="confirmingRemove = null">取消</button>
                    </div>
                  </div>
                </template>

                <!-- 預設按鈕 -->
                <template v-else>
                  <div class="flex items-center gap-1.5">
                    <button class="px-2.5 py-1 text-xs rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                      @click="confirmingTransfer = member.userId">轉讓</button>
                    <button class="px-2.5 py-1 text-xs rounded-lg bg-red-600 text-white hover:bg-red-700"
                      @click="confirmingRemove = member.userId">移除</button>
                  </div>
                </template>
              </div>
            </div>
            <div v-if="members.length === 0" class="py-4 text-center text-sm text-gray-400">尚無成員資料</div>
          </div>
        </section>

        <!-- 邀請狀態 -->
        <section>
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">邀請狀態</p>
          <div v-if="loadingInvitations" class="py-4 text-center text-sm text-gray-400">載入中…</div>
          <div v-else-if="invitations.length === 0" class="py-3 text-center text-sm text-gray-400">目前無待處理邀請</div>
          <div v-else class="space-y-2">
            <div v-for="inv in invitations" :key="inv.invitationId"
              class="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5">
              <div class="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm shrink-0">👤</div>
              <div class="min-w-0 flex-1 truncate text-sm text-gray-700">{{ inv.inviteeAccount }}</div>
              <template v-if="inv.status === 'pending'">
                <span
                  class="rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-yellow-100 text-yellow-700 shrink-0">邀請中</span>
              </template>
              <template v-else-if="inv.status === 'rejected'">
                <span
                  class="rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-red-100 text-red-600 shrink-0">已拒絕</span>
                <span v-if="reInvitingInviteeId === inv.inviteeId"
                  class="text-xs text-indigo-500 animate-pulse shrink-0">邀請中…</span>
                <button v-else
                  class="px-2.5 py-1 text-xs rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shrink-0"
                  @click="emit('re-invite', inv.inviteeAccount)">
                  重新邀請
                </button>
              </template>
            </div>
          </div>
        </section>

        <!-- 刪除聊天室 -->
        <section class="pb-1">
          <div v-if="confirmingDelete" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 space-y-2">
            <p class="text-sm font-semibold text-red-700">⚠️ 確定刪除這個聊天室？</p>
            <p class="text-xs text-red-500">此操作無法復原，所有訊息與成員都會一併移除。</p>
            <div class="flex gap-2 justify-end">
              <button class="px-3 py-1.5 text-xs rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
                @click="confirmingDelete = false">取消</button>
              <button class="px-3 py-1.5 text-xs rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                :disabled="deletingRoom" @click="confirmDelete">
                {{ deletingRoom ? '刪除中…' : '確認刪除' }}
              </button>
            </div>
          </div>
          <button v-else
            class="w-full px-4 py-2.5 text-sm rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition disabled:opacity-50"
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
import type { ChatInvitation, ChatRoomListItem, ChatRoomMember } from '@/types/chat'

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
  'save-info': [payload: { roomName: string; avatarUrl: string | null }]
  'remove-member': [userId: string]
  'transfer-manager': [userId: string]
  'delete-room': []
  're-invite': [inviteeAccount: string]
}>()

const confirmingTransfer = ref<string | null>(null)
const confirmingRemove = ref<string | null>(null)
const confirmingDelete = ref(false)

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

const editRoomName = ref(props.room.name ?? '')
const editAvatarUrl = ref(props.room.avatarUrl ?? '')

watch(
  () => props.room,
  (room) => {
    editRoomName.value = room.name ?? ''
    editAvatarUrl.value = room.avatarUrl ?? ''
  },
  { deep: true },
)

const normalizedAvatarUrl = computed(() => {
  const value = editAvatarUrl.value.trim()
  return value.length > 0 ? value : null
})

const canSaveInfo = computed(() => {
  const roomName = editRoomName.value.trim()
  if (!roomName) return false

  const originalName = props.room.name ?? ''
  const originalAvatar = props.room.avatarUrl ?? ''

  return roomName !== originalName || editAvatarUrl.value.trim() !== originalAvatar
})

function saveGroupInfo(): void {
  emit('save-info', {
    roomName: editRoomName.value.trim(),
    avatarUrl: normalizedAvatarUrl.value,
  })
}
</script>
