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
                ? 'bg-emerald-500/12 text-emerald-300'
                : 'bg-emerald-100 text-emerald-700'
            "
          >
            <span class="text-xs">✦</span>
            通知中心
          </div>
          <h2
            class="text-lg font-semibold tracking-tight"
            :class="preferences.isDark ? 'text-white' : 'text-slate-900'"
          >
            收到的邀請
          </h2>
          <p
            class="mt-1 text-xs leading-5 sm:text-sm"
            :class="preferences.isDark ? 'text-slate-400' : 'text-slate-500'"
          >
            在這裡處理好友申請與群組聊天室邀請。
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

        <div class="max-h-[70vh] overflow-y-auto px-5 py-5 sm:px-6">
        <div
          v-if="invitations.length === 0 && friendRequests.length === 0"
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
                ? 'bg-emerald-500/12 text-emerald-300'
                : 'bg-emerald-100 text-emerald-700'
            "
          >
            📭
          </div>
          <div
            class="mt-3 text-sm font-medium"
            :class="preferences.isDark ? 'text-slate-200' : 'text-slate-800'"
          >
            目前沒有待處理的邀請
          </div>
          <div class="mt-1 text-xs leading-5" :class="preferences.isDark ? 'text-slate-400' : 'text-slate-500'">
            新的好友申請或群組邀請會顯示在這裡。
          </div>
        </div>

        <section v-if="friendRequests.length > 0">
          <h3
            class="mb-3 text-sm font-semibold"
            :class="preferences.isDark ? 'text-slate-300' : 'text-slate-700'"
          >
            好友申請
          </h3>

          <div
            v-for="request in friendRequests"
            :key="request.requestId"
            class="mb-3 rounded-xl border p-4 last:mb-0"
            :class="
              preferences.isDark
                ? 'border-white/8 bg-white/[0.03]'
                : 'border-slate-200 bg-white'
            "
          >
            <div class="flex items-center gap-3">
              <UserAvatar
                class="h-10 w-10 shrink-0 text-sm ring-1 ring-white/10"
                :avatar-url="request.requesterAvatarUrl"
                :display-name="request.requesterDisplayName"
                :username="request.requesterName"
                :user-id="request.requesterId"
              />

              <div class="min-w-0 flex-1">
                <div class="truncate font-medium" :class="preferences.isDark ? 'text-slate-100' : 'text-slate-900'">
                  {{ request.requesterDisplayName }}
                </div>

                <div class="truncate text-sm" :class="preferences.isDark ? 'text-slate-400' : 'text-slate-500'">
                  @{{ request.requesterName }}
                </div>
              </div>
            </div>

            <div class="mt-2 text-sm" :class="preferences.isDark ? 'text-slate-300' : 'text-slate-600'">
              向你發出好友申請
            </div>

            <div class="mt-4 flex justify-end gap-2">
              <button
                type="button"
                class="rounded-xl border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
                :class="
                  preferences.isDark
                    ? 'border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06]'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                "
                :disabled="processingFriendRequestId === request.requestId"
                @click="$emit('reject-friend-request', request.requestId)"
              >
                拒絕
              </button>

              <button
                type="button"
                class="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="processingFriendRequestId === request.requestId"
                @click="$emit('accept-friend-request', request.requestId)"
              >
                {{ processingFriendRequestId === request.requestId ? '處理中...' : '接受' }}
              </button>
            </div>
          </div>
        </section>

        <section v-if="invitations.length > 0" :class="{ 'mt-6': friendRequests.length > 0 }">
          <h3
            class="mb-3 text-sm font-semibold"
            :class="preferences.isDark ? 'text-slate-300' : 'text-slate-700'"
          >
            群組聊天室邀請
          </h3>

          <div
            v-for="invitation in invitations"
            :key="invitation.invitationId"
            class="mb-3 rounded-xl border p-4 last:mb-0"
            :class="
              preferences.isDark
                ? 'border-white/8 bg-white/[0.03]'
                : 'border-slate-200 bg-white'
            "
          >
            <div class="font-medium" :class="preferences.isDark ? 'text-slate-100' : 'text-slate-900'">
              {{ invitation.roomName }}
            </div>

            <div class="mt-1 text-sm" :class="preferences.isDark ? 'text-slate-400' : 'text-slate-500'">
              {{ invitation.inviterName }}
            </div>

            <div class="mt-2 text-sm" :class="preferences.isDark ? 'text-slate-300' : 'text-slate-600'">
              邀請你加入群組聊天室
            </div>

            <div class="mt-4 flex justify-end gap-2">
              <button
                type="button"
                class="rounded-xl border px-4 py-2 text-sm font-medium transition"
                :class="
                  preferences.isDark
                    ? 'border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06]'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                "
                @click="$emit('reject-invitation', invitation.invitationId)"
              >
                拒絕
              </button>

              <button
                type="button"
                class="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400"
                @click="$emit('accept-invitation', invitation.invitationId)"
              >
                接受
              </button>
            </div>
          </div>
        </section>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import UserAvatar from '@/components/base/UserAvatar.vue'
import { usePreferencesStore } from '@/stores/preferencesStore'
import type { ChatFriendRequest, ChatInvitation } from '@/types/chat'

const preferences = usePreferencesStore()

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