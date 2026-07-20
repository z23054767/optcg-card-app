<template>
  <header class="sticky top-0 z-10 border-b bg-white">
    <div class="flex min-h-14 items-center gap-3 px-3 py-2 sm:px-4">
      <button type="button"
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xl text-gray-600 hover:bg-gray-100 sm:hidden"
        aria-label="開啟聊天室選單" @click="$emit('toggle-sidebar')">
        ☰
      </button>

      <div class="min-w-0 flex-1">
        <div class="min-w-0">
          <h1 class="truncate text-base font-semibold text-gray-800 sm:text-lg">
            {{ title }}
          </h1>

          <div class="mt-0.5 flex items-center gap-2 text-xs">
            <button v-if="currentRoomId !== 'lobby'" type="button"
              class="text-blue-600 hover:text-blue-700 hover:underline" @click="$emit('back-to-lobby')">
              ← 回到大廳
            </button>

            <span v-if="currentRoomId !== 'lobby'" class="text-gray-300">
              |
            </span>

            <span class="inline-flex items-center gap-1 text-emerald-600">
              <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              {{ onlineCount }} 人在線
            </span>
          </div>
        </div>
      </div>

      <div class="hidden shrink-0 items-center gap-2 sm:flex">
        <button v-if="showCreateButton" type="button"
          class="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          @click="$emit('create-room')">
          建立群組聊天
        </button>

        <button v-if="showInviteMembersButton" type="button"
          class="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          @click="$emit('invite-members')">
          邀請成員
        </button>

        <button v-if="showManageGroupButton" type="button"
          class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          @click="$emit('open-manage-group')">
          群組管理
        </button>

        <button v-if="showMembersButton" type="button"
          class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          @click="$emit('open-members')">
          成員
        </button>
      </div>

      <button type="button"
        class="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
        aria-label="開啟使用者選單" @click="$emit('toggle-user-menu')">
        👤

        <span v-if="hasUnreadInvitations"
          class="absolute -right-1 -top-1 h-4 min-w-4 rounded-full bg-red-500 px-1 text-center text-[10px] font-bold leading-4 text-white">
          !
        </span>
      </button>
    </div>

    <div v-if="
      showCreateButton ||
      showInviteMembersButton ||
      showManageGroupButton ||
      showMembersButton
    " class="flex gap-2 overflow-x-auto border-t border-gray-100 px-3 py-2 sm:hidden">
      <button v-if="showCreateButton" type="button"
        class="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        @click="$emit('create-room')">
        建立群組聊天
      </button>

      <button v-if="showInviteMembersButton" type="button"
        class="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        @click="$emit('invite-members')">
        邀請成員
      </button>

      <button v-if="showManageGroupButton" type="button"
        class="shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        @click="$emit('open-manage-group')">
        群組管理
      </button>

      <button v-if="showMembersButton" type="button"
        class="shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        @click="$emit('open-members')">
        成員
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
  showCreateButton: boolean
  showInviteMembersButton: boolean
  showManageGroupButton: boolean
  showMembersButton: boolean
}>()

defineEmits<{
  'toggle-sidebar': []
  'create-room': []
  'invite-members': []
  'open-manage-group': []
  'back-to-lobby': []
  'toggle-user-menu': []
  'open-members': []
}>()
</script>