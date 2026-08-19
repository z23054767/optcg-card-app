<template>
  <Transition name="modal-fade" appear>
    <div
      class="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm"
      :class="preferences.isDark ? 'bg-slate-950/70' : 'bg-slate-900/35'"
      @click.self="$emit('close')"
    >
      <div
        class="modal-panel flex max-h-[88vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border shadow-2xl"
        :class="
          preferences.isDark
            ? 'border-white/10 bg-slate-900/95 text-slate-100 shadow-black/40'
            : 'border-slate-200 bg-white/96 text-slate-900 shadow-slate-900/15'
        "
      >
      <div
        class="relative shrink-0 border-b px-5 py-4"
        :class="preferences.isDark ? 'border-white/8' : 'border-slate-200'"
      >
        <div class="pr-10">
          <div
            class="mb-2 inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-medium"
            :class="
              preferences.isDark
                ? 'bg-indigo-500/12 text-indigo-300'
                : 'bg-indigo-100 text-indigo-700'
            "
          >
            <span class="text-xs">✦</span>
            群組管理
          </div>

          <h2 class="text-lg font-semibold tracking-tight" :class="preferences.isDark ? 'text-white' : 'text-slate-900'">
            群組管理
          </h2>

          <p class="mt-1 text-xs leading-5 sm:text-sm" :class="preferences.isDark ? 'text-slate-400' : 'text-slate-500'">
            編輯群組資訊、管理成員與追蹤邀請狀態。
          </p>
        </div>

        <button
          type="button"
          class="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full transition"
          :class="
            preferences.isDark
              ? 'text-slate-400 hover:bg-white/8 hover:text-white'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
          "
          aria-label="關閉"
          @click="$emit('close')"
        >
          ✕
        </button>
      </div>

        <div class="space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
        <!-- 群組資訊 -->
        <section
          class="rounded-2xl border p-4"
          :class="
            preferences.isDark
              ? 'border-white/8 bg-slate-950/45'
              : 'border-slate-200 bg-slate-50'
          "
        >
          <p class="mb-3 text-xs font-semibold uppercase tracking-wide" :class="preferences.isDark ? 'text-slate-400' : 'text-slate-500'">
            群組資訊
          </p>

          <div class="space-y-3">
            <div>
              <label class="mb-1 block text-sm" :class="preferences.isDark ? 'text-slate-300' : 'text-slate-600'">
                群組名稱
              </label>

              <input
                v-model="editRoomName"
                type="text"
                class="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                :class="
                  preferences.isDark
                    ? 'border-slate-700 bg-slate-950/70 text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:ring-indigo-500/25'
                    : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500/20'
                "
                :disabled="updatingInfo"
              />
            </div>

            <div>
              <label class="mb-2 block text-sm" :class="preferences.isDark ? 'text-slate-300' : 'text-slate-600'">
                群組頭像
              </label>

              <AvatarCropper ref="avatarCropper" v-model:remove-avatar="removeAvatar"
                :current-avatar-url="currentAvatarUrl" current-avatar-label="目前群組頭像" current-avatar-alt="目前群組頭像"
                output-file-name="chat-room-avatar" :disabled="updatingInfo"
                @selection-change="hasSelectedAvatarFile = $event" />
            </div>

            <div class="flex justify-end">
              <button
                type="button"
                class="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
                :disabled="updatingInfo || !canSaveInfo"
                @click="saveGroupInfo"
              >
                {{ updatingInfo ? '儲存中…' : '儲存群組資訊' }}
              </button>
            </div>
          </div>
        </section>

        <!-- 成員管理 -->
        <section
          class="rounded-2xl border p-4"
          :class="
            preferences.isDark
              ? 'border-white/8 bg-slate-950/45'
              : 'border-slate-200 bg-slate-50'
          "
        >
          <p class="mb-3 text-xs font-semibold uppercase tracking-wide" :class="preferences.isDark ? 'text-slate-400' : 'text-slate-500'">
            成員管理
          </p>

          <div
            v-if="loadingMembers"
            class="rounded-xl border border-dashed px-4 py-8 text-center"
            :class="
              preferences.isDark
                ? 'border-white/10 bg-white/[0.03]'
                : 'border-slate-200 bg-white'
            "
          >
            <div
              class="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-t-indigo-400"
              :class="preferences.isDark ? 'border-slate-600' : 'border-slate-300'"
            ></div>
            <div
              class="mt-3 text-sm font-medium"
              :class="preferences.isDark ? 'text-slate-200' : 'text-slate-800'"
            >
              載入成員中…
            </div>
            <div class="mt-1 text-xs leading-5" :class="preferences.isDark ? 'text-slate-400' : 'text-slate-500'">
              正在同步最新群組成員名單。
            </div>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="member in members"
              :key="member.userId"
              class="flex items-center gap-3 rounded-xl border px-4 py-2.5"
              :class="
                preferences.isDark
                  ? 'border-white/8 bg-white/[0.03]'
                  : 'border-slate-200 bg-white'
              "
            >
              <UserAvatar
                class="h-9 w-9 shrink-0 text-sm ring-1 ring-white/10"
                :avatar-url="member.avatarUrl"
                :display-name="member.displayName || member.name"
                :username="member.name"
                :user-id="member.userId"
              />

              <div class="min-w-0 flex-1">
                <div class="truncate text-sm font-medium" :class="preferences.isDark ? 'text-slate-100' : 'text-slate-900'">
                  {{ member.displayName || member.name }}
                </div>

                <div class="truncate text-xs" :class="preferences.isDark ? 'text-slate-400' : 'text-slate-500'">
                  @{{ member.name }}
                </div>
              </div>

              <span
                class="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                :class="
                  member.role === 'manager'
                    ? preferences.isDark
                      ? 'bg-amber-500/12 text-amber-300'
                      : 'bg-amber-100 text-amber-700'
                    : preferences.isDark
                      ? 'bg-white/8 text-slate-300'
                      : 'bg-slate-100 text-slate-500'
                "
              >
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
                    <span class="text-xs" :class="preferences.isDark ? 'text-slate-300' : 'text-slate-600'">
                      轉讓給
                      <b>{{ member.displayName || member.name }}</b>
                      ？
                    </span>

                    <div class="flex gap-1">
                      <button
                        type="button"
                        class="rounded-lg bg-indigo-500 px-2 py-1 text-xs text-white hover:bg-indigo-400"
                        @click="confirmTransfer(member.userId)"
                      >
                        確認
                      </button>

                      <button
                        type="button"
                        class="rounded-lg px-2 py-1 text-xs transition"
                        :class="
                          preferences.isDark
                            ? 'bg-white/8 text-slate-300 hover:bg-white/12'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        "
                        @click="confirmingTransfer = null"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                </template>

                <template v-else-if="confirmingRemove === member.userId">
                  <div class="flex flex-col items-end gap-1">
                    <span class="text-xs" :class="preferences.isDark ? 'text-slate-300' : 'text-slate-600'">
                      移除
                      <b>{{ member.displayName || member.name }}</b>
                      ？
                    </span>

                    <div class="flex gap-1">
                      <button
                        type="button"
                        class="rounded-lg bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-500"
                        @click="confirmRemove(member.userId)"
                      >
                        確認
                      </button>

                      <button
                        type="button"
                        class="rounded-lg px-2 py-1 text-xs transition"
                        :class="
                          preferences.isDark
                            ? 'bg-white/8 text-slate-300 hover:bg-white/12'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        "
                        @click="confirmingRemove = null"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                </template>

                <template v-else>
                  <div class="flex items-center gap-1.5">
                    <button
                      type="button"
                      class="rounded-lg bg-indigo-500 px-2.5 py-1 text-xs text-white hover:bg-indigo-400"
                      @click="confirmingTransfer = member.userId"
                    >
                      轉讓
                    </button>

                    <button
                      type="button"
                      class="rounded-lg bg-red-600 px-2.5 py-1 text-xs text-white hover:bg-red-500"
                      @click="confirmingRemove = member.userId"
                    >
                      移除
                    </button>
                  </div>
                </template>
              </div>
            </div>

            <div
              v-if="members.length === 0"
              class="rounded-xl border border-dashed px-4 py-8 text-center"
              :class="
                preferences.isDark
                  ? 'border-white/10 bg-white/[0.03]'
                  : 'border-slate-200 bg-white'
              "
            >
              <div
                class="mx-auto flex h-10 w-10 items-center justify-center rounded-full"
                :class="
                  preferences.isDark
                    ? 'bg-indigo-500/12 text-indigo-300'
                    : 'bg-indigo-100 text-indigo-700'
                "
              >
                👥
              </div>
              <div
                class="mt-3 text-sm font-medium"
                :class="preferences.isDark ? 'text-slate-200' : 'text-slate-800'"
              >
                尚無成員資料
              </div>
              <div class="mt-1 text-xs leading-5" :class="preferences.isDark ? 'text-slate-400' : 'text-slate-500'">
                邀請成員後，這裡會顯示最新名單。
              </div>
            </div>
          </div>
        </section>

        <!-- 邀請狀態 -->
        <section
          class="rounded-2xl border p-4"
          :class="
            preferences.isDark
              ? 'border-white/8 bg-slate-950/45'
              : 'border-slate-200 bg-slate-50'
          "
        >
          <p class="mb-3 text-xs font-semibold uppercase tracking-wide" :class="preferences.isDark ? 'text-slate-400' : 'text-slate-500'">
            邀請狀態
          </p>

          <div
            v-if="loadingInvitations"
            class="rounded-xl border border-dashed px-4 py-8 text-center"
            :class="
              preferences.isDark
                ? 'border-white/10 bg-white/[0.03]'
                : 'border-slate-200 bg-white'
            "
          >
            <div
              class="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-t-indigo-400"
              :class="preferences.isDark ? 'border-slate-600' : 'border-slate-300'"
            ></div>
            <div
              class="mt-3 text-sm font-medium"
              :class="preferences.isDark ? 'text-slate-200' : 'text-slate-800'"
            >
              載入邀請中…
            </div>
            <div class="mt-1 text-xs leading-5" :class="preferences.isDark ? 'text-slate-400' : 'text-slate-500'">
              正在同步目前邀請狀態。
            </div>
          </div>

          <div
            v-else-if="invitations.length === 0"
            class="rounded-xl border border-dashed px-4 py-8 text-center"
            :class="
              preferences.isDark
                ? 'border-white/10 bg-white/[0.03]'
                : 'border-slate-200 bg-white'
            "
          >
            <div
              class="mx-auto flex h-10 w-10 items-center justify-center rounded-full"
              :class="
                preferences.isDark
                  ? 'bg-indigo-500/12 text-indigo-300'
                  : 'bg-indigo-100 text-indigo-700'
              "
            >
              📭
            </div>
            <div
              class="mt-3 text-sm font-medium"
              :class="preferences.isDark ? 'text-slate-200' : 'text-slate-800'"
            >
              目前無待處理邀請
            </div>
            <div class="mt-1 text-xs leading-5" :class="preferences.isDark ? 'text-slate-400' : 'text-slate-500'">
              你發出的邀請會在這裡顯示進度。
            </div>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="invitation in invitations"
              :key="invitation.invitationId"
              class="flex items-center gap-3 rounded-xl border px-4 py-2.5"
              :class="
                preferences.isDark
                  ? 'border-white/8 bg-white/[0.03]'
                  : 'border-slate-200 bg-white'
              "
            >
              <UserAvatar
                class="h-9 w-9 shrink-0 text-sm ring-1 ring-white/10"
                :avatar-url="invitation.inviteeAvatarUrl"
                :display-name="invitation.inviteeDisplayName || invitation.inviteeName"
                :username="invitation.inviteeName"
                :user-id="invitation.inviteeId"
              />

              <div class="min-w-0 flex-1">
                <div class="truncate text-sm font-medium" :class="preferences.isDark ? 'text-slate-100' : 'text-slate-900'">
                  {{ invitation.inviteeDisplayName || invitation.inviteeName }}
                </div>

                <div class="truncate text-xs" :class="preferences.isDark ? 'text-slate-400' : 'text-slate-500'">
                  @{{ invitation.inviteeName }}
                </div>
              </div>

              <template v-if="invitation.status === 'pending'">
                <span
                  class="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                  :class="
                    preferences.isDark
                      ? 'bg-amber-500/12 text-amber-300'
                      : 'bg-amber-100 text-amber-700'
                  "
                >
                  邀請中
                </span>
              </template>

              <template v-else-if="invitation.status === 'rejected'">
                <span
                  class="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                  :class="
                    preferences.isDark
                      ? 'bg-red-500/12 text-red-300'
                      : 'bg-red-100 text-red-600'
                  "
                >
                  已拒絕
                </span>

                <span v-if="reInvitingInviteeId === invitation.inviteeId"
                  class="shrink-0 animate-pulse text-xs text-indigo-500">
                  邀請中…
                </span>

                <button
                  v-else
                  type="button"
                  class="shrink-0 rounded-lg bg-indigo-500 px-2.5 py-1 text-xs text-white hover:bg-indigo-400"
                  @click="emit('re-invite', invitation.inviteeName)"
                >
                  重新邀請
                </button>
              </template>

              <template v-else-if="invitation.status === 'accepted'">
                <span
                  class="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                  :class="
                    preferences.isDark
                      ? 'bg-emerald-500/12 text-emerald-300'
                      : 'bg-emerald-100 text-emerald-700'
                  "
                >
                  已接受
                </span>
              </template>
            </div>
          </div>
        </section>

        <!-- 刪除聊天室 -->
        <section class="pb-1">
          <div
            v-if="confirmingDelete"
            class="space-y-2 rounded-xl border px-4 py-3"
            :class="
              preferences.isDark
                ? 'border-red-500/25 bg-red-500/8'
                : 'border-red-200 bg-red-50'
            "
          >
            <p class="text-sm font-semibold" :class="preferences.isDark ? 'text-red-300' : 'text-red-700'">
              ⚠️ 確定刪除這個聊天室？
            </p>

            <p class="text-xs" :class="preferences.isDark ? 'text-red-200/80' : 'text-red-500'">
              此操作無法復原，所有訊息與成員都會一併移除。
            </p>

            <div class="flex justify-end gap-2">
              <button
                type="button"
                class="rounded-lg px-3 py-1.5 text-xs transition"
                :class="
                  preferences.isDark
                    ? 'bg-white/8 text-slate-300 hover:bg-white/12'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                "
                @click="confirmingDelete = false"
              >
                取消
              </button>

              <button
                type="button"
                class="rounded-lg bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="deletingRoom"
                @click="confirmDelete"
              >
                {{ deletingRoom ? '刪除中…' : '確認刪除' }}
              </button>
            </div>
          </div>

          <button
            v-else
            type="button"
            class="w-full rounded-xl border px-4 py-2.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-50"
            :class="
              preferences.isDark
                ? 'border-red-500/25 text-red-300 hover:bg-red-500/8'
                : 'border-red-200 text-red-600 hover:bg-red-50'
            "
            :disabled="deletingRoom"
            @click="confirmingDelete = true"
          >
            刪除聊天室
          </button>
        </section>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import UserAvatar from '@/components/base/UserAvatar.vue'
import AvatarCropper from '@/components/base/AvatarCropper.vue'
import { usePreferencesStore } from '@/stores/preferencesStore'
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
      avatarUpload: import('@/types/avatarUpload').AvatarUploadPayload | null
      hadSelectedAvatarFile: boolean
      removeAvatar: boolean
    },
  ]
  'remove-member': [userId: string]
  'transfer-manager': [userId: string]
  'delete-room': []
  're-invite': [inviteeName: string]
}>()

const preferences = usePreferencesStore()
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
  const avatarUpload =
    (await avatarCropper.value?.createAvatarUploadPayload()) ?? null

  emit('save-info', {
    roomName: editRoomName.value.trim(),
    avatarUpload,
    hadSelectedAvatarFile: hasSelectedAvatarFile.value,
    removeAvatar: removeAvatar.value,
  })
}

watch(
  () => [props.room.id, props.room.name ?? '', props.room.avatarUrl ?? null] as const,
  ([, roomName]) => {
    editRoomName.value = roomName
    removeAvatar.value = false
    hasSelectedAvatarFile.value = false
    avatarCropper.value?.reset()
  },
)
</script>