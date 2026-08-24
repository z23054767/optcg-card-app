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
          class="relative border-b px-5 py-4 sm:px-6"
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
              群組資訊
            </div>

            <h2
              class="text-lg font-semibold tracking-tight"
              :class="preferences.isDark ? 'text-white' : 'text-slate-900'"
            >
              群組成員
            </h2>

            <p
              class="mt-1 text-xs leading-5 sm:text-sm"
              :class="preferences.isDark ? 'text-slate-400' : 'text-slate-500'"
            >
              查看目前聊天室中的成員與角色。
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

        <div class="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <div
            v-if="loading"
            class="rounded-xl border border-dashed px-4 py-8 text-center"
            :class="
              preferences.isDark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-white'
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
            <div
              class="mt-1 text-xs leading-5"
              :class="preferences.isDark ? 'text-slate-400' : 'text-slate-500'"
            >
              正在同步最新群組成員名單。
            </div>
          </div>

          <div
            v-else-if="members.length === 0"
            class="rounded-xl border border-dashed px-4 py-8 text-center"
            :class="
              preferences.isDark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-white'
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
            <div
              class="mt-1 text-xs leading-5"
              :class="preferences.isDark ? 'text-slate-400' : 'text-slate-500'"
            >
              邀請成員後，會在這裡顯示角色與帳號資訊。
            </div>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="member in members"
              :key="member.userId"
              class="flex items-center gap-3 rounded-xl border px-3 py-3 transition"
              :class="
                preferences.isDark
                  ? 'border-white/8 bg-white/[0.03] hover:border-indigo-400/30 hover:bg-indigo-500/6'
                  : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/60'
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
                <div
                  class="truncate text-sm font-medium"
                  :class="preferences.isDark ? 'text-slate-100' : 'text-slate-900'"
                >
                  {{ member.displayName || member.name }}
                </div>

                <div
                  class="truncate text-xs"
                  :class="preferences.isDark ? 'text-slate-400' : 'text-slate-500'"
                >
                  @{{ member.name }}
                </div>
              </div>

              <span
                class="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium"
                :class="
                  member.role === 'manager'
                    ? preferences.isDark
                      ? 'bg-amber-500/12 text-amber-300'
                      : 'bg-amber-100 text-amber-700'
                    : preferences.isDark
                      ? 'bg-white/8 text-slate-300'
                      : 'bg-slate-100 text-slate-600'
                "
              >
                {{ member.role === 'manager' ? '管理員' : '成員' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import UserAvatar from '@/components/base/UserAvatar.vue'
import { usePreferencesStore } from '@/stores/preferencesStore'
import type { ChatRoomMember } from '@/types/chat'

const preferences = usePreferencesStore()

defineProps<{
  members: ChatRoomMember[]
  loading: boolean
}>()

defineEmits<{
  close: []
}>()
</script>
