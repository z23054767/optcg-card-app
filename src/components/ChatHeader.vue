<template>
  <div class="chat-header border-b border-gray-200 bg-gray-50/80 backdrop-blur-sm">
    <div class="flex min-h-16 items-center gap-3 px-3 py-2 sm:px-4">
      <button
        type="button"
        class="app-icon-button shrink-0 sm:hidden"
        aria-label="開啟聊天室選單"
        @click="$emit('toggle-sidebar')"
      >
        <svg viewBox="0 0 20 20" fill="none" class="h-5 w-5" aria-hidden="true">
          <path
            d="M3.5 5.5h13M3.5 10h13M3.5 14.5h13"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
          />
        </svg>
      </button>

      <div class="flex min-w-0 flex-1 items-center gap-3">
        <UserAvatar
          v-if="roomType === 'private'"
          class="h-10 w-10 text-sm"
          :avatar-url="avatarUrl"
          :display-name="title"
        />

        <span
          v-else
          class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl"
          :class="[avatarBackgroundClass, avatarTextClass]"
        >
          <img
            v-if="resolvedAvatarUrl && !avatarLoadFailed"
            :src="resolvedAvatarUrl"
            :alt="`${title} 頭像`"
            class="h-full w-full object-cover"
            @error="handleAvatarLoadError"
          />
          <span v-else>{{ defaultAvatar }}</span>
        </span>

        <div class="min-w-0">
          <div class="flex min-w-0 items-center gap-2">
            <h1 class="truncate text-sm font-semibold text-gray-900 sm:text-base">
              {{ title }}
            </h1>

            <span
              v-if="privateBlockedByOther"
              class="hidden shrink-0 rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600 sm:inline-flex"
            >
              已被封鎖
            </span>
          </div>

          <div class="mt-0.5 flex min-w-0 items-center gap-2 text-xs text-gray-500">
            <button
              v-if="currentRoomId !== 'lobby'"
              type="button"
              class="shrink-0 font-medium text-indigo-600 transition hover:text-indigo-700"
              @click="$emit('back-to-lobby')"
            >
              大廳
            </button>

            <span v-if="currentRoomId !== 'lobby' && roomType !== 'private'" class="text-gray-300"
              >·</span
            >

            <span v-if="roomType !== 'private'" class="truncate"> {{ onlineCount }} 人在線 </span>

            <span v-else-if="privateBlockedByOther" class="truncate text-red-500 sm:hidden">
              已被對方封鎖
            </span>
            <span v-else class="truncate"> 私人聊天室 </span>
          </div>
        </div>
      </div>

      <div class="hidden shrink-0 items-center gap-1.5 sm:flex">
        <button
          v-if="showAddFriendButton"
          type="button"
          class="chat-toolbar-button chat-toolbar-button-primary"
          @click="$emit('add-friend')"
        >
          加好友
        </button>

        <button
          v-if="showCreateButton"
          type="button"
          class="chat-toolbar-button chat-toolbar-button-primary"
          @click="$emit('create-room')"
        >
          建立群組
        </button>

        <button
          v-if="showInviteMembersButton"
          type="button"
          class="chat-toolbar-button"
          @click="$emit('invite-members')"
        >
          邀請成員
        </button>

        <button
          v-if="showPrivateChatButton"
          type="button"
          class="chat-toolbar-button chat-toolbar-button-primary"
          @click="$emit('start-private-chat')"
        >
          新增好友
        </button>

        <button
          v-if="showMembersButton"
          type="button"
          class="chat-toolbar-button"
          @click="$emit('open-members')"
        >
          成員
        </button>

        <button
          v-if="showManageGroupButton"
          type="button"
          class="chat-toolbar-button"
          @click="$emit('open-manage-group')"
        >
          群組管理
        </button>

        <button
          v-if="showUnblockUserButton"
          type="button"
          class="chat-toolbar-button"
          @click="$emit('unblock-user')"
        >
          解除封鎖
        </button>

        <button
          v-if="showLeaveGroupButton"
          type="button"
          class="chat-toolbar-button chat-toolbar-button-danger"
          :disabled="leavingGroup"
          @click="$emit('leave-group')"
        >
          {{ leavingGroup ? '退出中…' : '退出群組' }}
        </button>

        <button
          v-if="showBlockUserButton"
          type="button"
          class="chat-toolbar-button chat-toolbar-button-danger"
          @click="$emit('block-user')"
        >
          封鎖
        </button>
      </div>
    </div>

    <div
      v-if="hasMobileActions"
      class="chat-header-mobile-actions flex gap-2 overflow-x-auto border-t border-gray-200/70 px-3 py-2 sm:hidden"
    >
      <button
        v-if="showAddFriendButton"
        type="button"
        class="chat-toolbar-button chat-toolbar-button-primary shrink-0"
        @click="$emit('add-friend')"
      >
        加好友
      </button>

      <button
        v-if="showCreateButton"
        type="button"
        class="chat-toolbar-button chat-toolbar-button-primary shrink-0"
        @click="$emit('create-room')"
      >
        建立群組
      </button>

      <button
        v-if="showInviteMembersButton"
        type="button"
        class="chat-toolbar-button shrink-0"
        @click="$emit('invite-members')"
      >
        邀請成員
      </button>

      <button
        v-if="showPrivateChatButton"
        type="button"
        class="chat-toolbar-button chat-toolbar-button-primary shrink-0"
        @click="$emit('start-private-chat')"
      >
        新增好友
      </button>

      <button
        v-if="showMembersButton"
        type="button"
        class="chat-toolbar-button shrink-0"
        @click="$emit('open-members')"
      >
        成員
      </button>

      <button
        v-if="showManageGroupButton"
        type="button"
        class="chat-toolbar-button shrink-0"
        @click="$emit('open-manage-group')"
      >
        群組管理
      </button>

      <button
        v-if="showUnblockUserButton"
        type="button"
        class="chat-toolbar-button shrink-0"
        @click="$emit('unblock-user')"
      >
        解除封鎖
      </button>

      <button
        v-if="showLeaveGroupButton"
        type="button"
        class="chat-toolbar-button chat-toolbar-button-danger shrink-0"
        :disabled="leavingGroup"
        @click="$emit('leave-group')"
      >
        {{ leavingGroup ? '退出中…' : '退出群組' }}
      </button>

      <button
        v-if="showBlockUserButton"
        type="button"
        class="chat-toolbar-button chat-toolbar-button-danger shrink-0"
        @click="$emit('block-user')"
      >
        封鎖
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { resolveChatRoomAvatarUrl } from '@/utils/chatRoomAvatar'
import { resolveUserAvatarUrl } from '@/api/profileApi'
import UserAvatar from '@/components/base/UserAvatar.vue'

const props = defineProps<{
  title: string
  currentRoomId: string
  roomType: 'group' | 'private' | 'lobby'
  avatarUrl?: string | null
  onlineCount: number
  showCreateButton: boolean
  showPrivateChatButton: boolean
  showInviteMembersButton: boolean
  showManageGroupButton: boolean
  showMembersButton: boolean
  showLeaveGroupButton: boolean
  leavingGroup: boolean
  showAddFriendButton: boolean
  showBlockUserButton: boolean
  showUnblockUserButton: boolean
  privateBlockedByOther: boolean
}>()

const avatarLoadFailed = ref(false)
const avatarRetryCount = ref(0)

const resolvedAvatarUrl = computed<string | null>(() => {
  switch (props.roomType) {
    case 'group':
      return resolveChatRoomAvatarUrl(props.avatarUrl)

    case 'private':
      return resolveUserAvatarUrl(props.avatarUrl)

    case 'lobby':
    default:
      return null
  }
})

const defaultAvatar = computed(() => {
  switch (props.roomType) {
    case 'group':
      return '👥'
    case 'private':
      return ''
    case 'lobby':
    default:
      return '📢'
  }
})

const avatarBackgroundClass = computed(() => {
  switch (props.roomType) {
    case 'group':
      return 'bg-green-100'
    case 'private':
      return 'bg-purple-100'
    case 'lobby':
    default:
      return 'bg-blue-100'
  }
})

const avatarTextClass = computed(() => {
  switch (props.roomType) {
    case 'group':
      return 'font-semibold text-green-600'

    case 'private':
      return 'font-semibold text-purple-700'

    case 'lobby':
    default:
      return 'font-semibold text-blue-600'
  }
})

const hasMobileActions = computed(
  () =>
    props.showCreateButton ||
    props.showPrivateChatButton ||
    props.showInviteMembersButton ||
    props.showManageGroupButton ||
    props.showMembersButton ||
    props.showLeaveGroupButton ||
    props.showAddFriendButton ||
    props.showBlockUserButton ||
    props.showUnblockUserButton,
)

watch(
  () => [props.roomType, props.avatarUrl],
  () => {
    avatarLoadFailed.value = false
    avatarRetryCount.value = 0
  },
)

function handleAvatarLoadError(): void {
  if (avatarRetryCount.value >= 2) {
    avatarLoadFailed.value = true
    return
  }

  avatarRetryCount.value += 1
  avatarLoadFailed.value = true

  setTimeout(() => {
    avatarLoadFailed.value = false
  }, 800)
}

defineEmits<{
  'toggle-sidebar': []
  'create-room': []
  'start-private-chat': []
  'invite-members': []
  'open-manage-group': []
  'back-to-lobby': []
  'open-members': []
  'leave-group': []
  'add-friend': []
  'block-user': []
  'unblock-user': []
}>()
</script>
