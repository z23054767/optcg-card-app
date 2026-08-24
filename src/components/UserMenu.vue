<template>
  <div v-if="open" class="fixed right-2 top-[4.5rem] z-[60] w-64 rounded-xl border bg-white py-2 shadow-xl sm:right-4">
    <div class="px-4 py-2">
      <div class="flex items-center gap-3">
        <UserAvatar
          class="h-10 w-10 text-sm"
          :avatar-url="avatarUrl"
          :display-name="displayName"
          :username="name"
        />

        <div class="min-w-0">
          <div class="truncate text-sm font-semibold text-gray-800">
            {{ displayName }}
          </div>

          <div class="mt-0.5 truncate text-xs text-gray-500">
            @{{ name }}
          </div>
        </div>
      </div>
    </div>

    <div v-if="showDeckLink || showChatLink" class="my-1 border-t"></div>

    <RouterLink
      v-if="showDeckLink"
      to="/decks"
      class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-100"
      @click="$emit('close')"
    >
      <span aria-hidden="true">🃏</span>
      <span>我的牌組</span>
    </RouterLink>

    <RouterLink
      v-if="showChatLink"
      to="/chat"
      class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-100"
      @click="$emit('close')"
    >
      <span aria-hidden="true">💬</span>
      <span>聊天室</span>
    </RouterLink>

    <div v-if="showInvitations || showSettings || showPreferences" class="my-1 border-t"></div>

    <button
      v-if="showInvitations"
      class="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-gray-100"
      @click="$emit('open-invitations')"
    >
      <span>📨 收到的邀請</span>

      <span v-if="invitationCount > 0" class="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
        {{ invitationCount }}
      </span>
    </button>

    <button
      v-if="showSettings"
      class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
      @click="$emit('open-settings')"
    >
      ⚙ 個人設定
    </button>

    <button
      v-if="showPreferences"
      class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
      @click="$emit('open-preferences')"
    >
      🌙 偏好設定
    </button>

    <div class="my-1 border-t"></div>

    <button class="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100" @click="$emit('logout')">
      🚪 登出
    </button>
  </div>
</template>

<script setup lang="ts">
import UserAvatar from '@/components/base/UserAvatar.vue'

withDefaults(
  defineProps<{
    open: boolean
    displayName: string
    name: string
    invitationCount: number
    avatarUrl: string | null
    showInvitations?: boolean
    showSettings?: boolean
    showPreferences?: boolean
    showDeckLink?: boolean
    showChatLink?: boolean
  }>(),
  {
    showInvitations: true,
    showSettings: true,
    showPreferences: true,
    showDeckLink: false,
    showChatLink: false,
  },
)

defineEmits<{
  close: []
  logout: []
  'open-invitations': []
  'open-settings': []
  'open-preferences': []
}>()
</script>
