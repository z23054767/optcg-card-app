<template>
  <Transition name="modal-fade" appear>
    <div
      class="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm"
      :class="preferences.isDark ? 'bg-slate-950/70' : 'bg-slate-900/35'"
      @click.self="$emit('close')"
    >
      <div
        class="modal-panel w-full max-w-xl overflow-hidden rounded-2xl border shadow-2xl"
        :class="
          preferences.isDark
            ? 'border-white/10 bg-slate-900/95 text-slate-100 shadow-black/40'
            : 'border-slate-200 bg-white/96 text-slate-900 shadow-slate-900/15'
        "
      >
        <div
          class="relative border-b px-5 py-4 sm:px-6"
          :class="preferences.isDark ? 'border-white/8' : 'border-slate-200'"
        >
          <div class="pr-10">
            <div
              class="mb-2 inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-medium"
              :class="
                preferences.isDark
                  ? 'bg-emerald-500/12 text-emerald-300'
                  : 'bg-emerald-100 text-emerald-700'
              "
            >
              <span class="text-xs">✦</span>
              社交互動
            </div>
            <h2 class="text-lg font-semibold tracking-tight" :class="preferences.isDark ? 'text-white' : 'text-slate-900'">
              檢視個人檔案
            </h2>
            <p class="mt-1 text-xs leading-5 sm:text-sm" :class="preferences.isDark ? 'text-slate-400' : 'text-slate-500'">
              你可以直接從訊息查看對方的基本資料與好友狀態。
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

        <div class="space-y-4 px-5 py-5 sm:px-6">
          <div
            v-if="!user"
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
            <div class="mt-3 text-sm font-medium" :class="preferences.isDark ? 'text-slate-200' : 'text-slate-800'">
              載入使用者資料中…
            </div>
          </div>

          <div
            v-else
            class="rounded-2xl border p-4"
            :class="
              preferences.isDark
                ? 'border-white/8 bg-slate-950/45'
                : 'border-slate-200 bg-slate-50'
            "
          >
            <div class="flex items-center gap-3">
              <UserAvatar
                class="h-12 w-12 shrink-0 text-base ring-1 ring-white/10"
                :avatar-url="user.avatarUrl"
                :display-name="user.displayName || user.name"
                :username="user.name"
                :user-id="user.userId"
              />

              <div class="min-w-0 flex-1">
                <div class="truncate text-base font-semibold" :class="preferences.isDark ? 'text-slate-100' : 'text-slate-900'">
                  {{ user.displayName || user.name }}
                </div>
                <div class="truncate text-sm" :class="preferences.isDark ? 'text-slate-400' : 'text-slate-500'">
                  @{{ user.name }}
                </div>
              </div>
            </div>

            <div class="mt-4 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold" :class="friendshipBadgeClass">
              {{ friendshipStatusLabel }}
            </div>

            <p class="mt-3 text-xs leading-5" :class="preferences.isDark ? 'text-slate-400' : 'text-slate-500'">
              {{ friendshipStatusHint }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import UserAvatar from '@/components/base/UserAvatar.vue'
import { usePreferencesStore } from '@/stores/preferencesStore'
import type { ChatUserSearchItem } from '@/types/chat'

const props = defineProps<{
  user: ChatUserSearchItem | null
  loading: boolean
}>()

defineEmits<{
  close: []
}>()

const preferences = usePreferencesStore()

const friendshipStatusLabel = computed(() => {
  switch (props.user?.friendshipStatus) {
    case 'outgoing_pending':
      return '邀請待回覆'
    case 'incoming_pending':
      return '待你接受'
    case 'friend':
      return '已是好友'
    default:
      return '尚未成為好友'
  }
})

const friendshipStatusHint = computed(() => {
  switch (props.user?.friendshipStatus) {
    case 'outgoing_pending':
      return '你已發出好友申請，等待對方回覆。'
    case 'incoming_pending':
      return '對方已向你發出申請，可到通知中心接受。'
    case 'friend':
      return '你們目前已經是好友，可直接開啟私人聊天。'
    default:
      return '目前尚未成為好友。'
  }
})

const friendshipBadgeClass = computed(() => {
  switch (props.user?.friendshipStatus) {
    case 'outgoing_pending':
      return preferences.isDark ? 'bg-amber-500/12 text-amber-300' : 'bg-amber-100 text-amber-700'
    case 'incoming_pending':
      return preferences.isDark ? 'bg-sky-500/12 text-sky-300' : 'bg-sky-100 text-sky-700'
    case 'friend':
      return preferences.isDark ? 'bg-emerald-500/12 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
    default:
      return preferences.isDark ? 'bg-slate-500/12 text-slate-300' : 'bg-slate-100 text-slate-700'
  }
})
</script>
