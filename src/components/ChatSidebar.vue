<template>
  <aside
    class="fixed inset-y-0 left-0 z-40 w-72 bg-white border-r shadow-lg transition-transform sm:static sm:z-auto sm:w-64 sm:shadow-none"
    :class="open ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'"
  >
    <div class="px-4 py-3 border-b flex items-center justify-between">
      <div>
        <div class="font-semibold text-gray-800">聊天室</div>
        <div class="text-xs text-gray-400 mt-0.5">選擇聊天室開始對話</div>
      </div>

      <button
        class="sm:hidden w-8 h-8 rounded-full hover:bg-gray-100 text-gray-500 flex items-center justify-center text-xl"
        @click="$emit('close')"
      >
        ✕
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-3 space-y-4">
      <div>
        <div class="text-xs font-semibold text-gray-400 px-2 mb-2">公開聊天室</div>

        <button
          class="w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg text-sm transition"
          :class="
            currentRoomId === 'lobby'
              ? 'bg-blue-50 text-blue-700 font-semibold'
              : 'hover:bg-gray-100 text-gray-700'
          "
          @click="$emit('switch-room', 'lobby')"
        >
          <span class="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
            🏠
          </span>

          <span class="truncate">大廳</span>
        </button>
      </div>

      <div class="space-y-3">
        <div class="text-xs font-semibold text-gray-400 px-2 mb-1">我的聊天室</div>

        <div>
          <button
            class="mb-1 flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-xs font-semibold text-gray-500 hover:bg-gray-100"
            type="button"
            @click="privateCollapsed = !privateCollapsed"
          >
            <span>朋友</span>
            <span
              class="text-sm transition-transform"
              :class="privateCollapsed ? '-rotate-90' : 'rotate-0'"
            >
              ▾
            </span>
          </button>
          <div v-show="!privateCollapsed">
            <button
              v-for="room in privateRooms"
              :key="room.id"
              class="w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg text-sm transition"
              :class="
                currentRoomId === room.id
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'hover:bg-gray-100 text-gray-700'
              "
              :title="getRoomName(room)"
              @click="$emit('switch-room', room.id)"
            >
              <span class="w-7 h-7 rounded-full flex items-center justify-center bg-purple-100">
                🔒
              </span>
              <span class="truncate">{{ getRoomName(room) }}</span>
            </button>
            <div v-if="privateRooms.length === 0" class="px-3 py-2 text-xs text-gray-400">
              尚無朋友聊天室
            </div>
          </div>
        </div>

        <div>
          <button
            class="mb-1 flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-xs font-semibold text-gray-500 hover:bg-gray-100"
            type="button"
            @click="groupCollapsed = !groupCollapsed"
          >
            <span>群組聊天</span>
            <span
              class="text-sm transition-transform"
              :class="groupCollapsed ? '-rotate-90' : 'rotate-0'"
            >
              ▾
            </span>
          </button>
          <div v-show="!groupCollapsed">
            <button
              v-for="room in groupRooms"
              :key="room.id"
              class="w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg text-sm transition"
              :class="
                currentRoomId === room.id
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'hover:bg-gray-100 text-gray-700'
              "
              :title="getRoomName(room)"
              @click="$emit('switch-room', room.id)"
            >
              <span
                class="w-7 h-7 rounded-full flex items-center justify-center bg-green-100 overflow-hidden"
              >
                <img
                  v-if="getRoomAvatarUrl(room) && !failedAvatarRoomIds.has(room.id)"
                  :src="getRoomAvatarUrl(room) ?? undefined"
                  alt="群組頭像"
                  class="w-full h-full object-cover"
                  @error="markAvatarLoadFailed(room.id)"
                />
                <span v-else>👥</span>
              </span>
              <span class="truncate">{{ getRoomName(room) }}</span>
            </button>
            <div v-if="groupRooms.length === 0" class="px-3 py-2 text-xs text-gray-400">
              尚無群組聊天室
            </div>
          </div>
        </div>
      </div>
    </div>
  </aside>

  <div v-if="open" class="fixed inset-0 z-30 bg-black/40 sm:hidden" @click="$emit('close')"></div>
</template>
<script setup lang="ts">
import { resolveChatRoomAvatarUrl } from '@/utils/chatRoomAvatar'
import { computed, ref } from 'vue'
import type { ChatRoomListItem } from '@/types/chat'

const props = defineProps<{
  open: boolean
  rooms: ChatRoomListItem[]
  currentRoomId: string
}>()

const privateCollapsed = ref(false)
const groupCollapsed = ref(false)
const failedAvatarRoomIds = ref<Set<string>>(new Set())

defineEmits<{
  close: []
  'switch-room': [roomId: string]
}>()

function getRoomName(room: ChatRoomListItem): string {
  return room.name?.trim() || room.id
}

function getRoomAvatarUrl(room: ChatRoomListItem): string | null {
  return resolveChatRoomAvatarUrl(room.avatarUrl)
}

function markAvatarLoadFailed(roomId: string): void {
  failedAvatarRoomIds.value = new Set([...failedAvatarRoomIds.value, roomId])
}

const privateRooms = computed(() => props.rooms.filter((room) => room.type === 'private'))

const groupRooms = computed(() => props.rooms.filter((room) => room.type === 'group'))
</script>
