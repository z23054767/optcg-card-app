<template>
  <header class="sticky top-0 z-50 border-b backdrop-blur" :class="headerClass">
    <div :class="headerInnerClass">
      <RouterLink to="/" class="flex min-w-0 items-center gap-3" aria-label="回到首頁">
        <img src="/logo_op.png" alt="OPTCG logo" :class="logoClass" />
      </RouterLink>

      <div class="flex shrink-0 items-center gap-2">
        <button
          type="button"
          class="inline-flex h-9 w-9 items-center justify-center rounded-lg border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:h-10 sm:w-10"
          :class="
            preferences.isDark
              ? 'border-white/10 bg-slate-900/70 text-slate-100 hover:bg-slate-800 focus-visible:ring-offset-slate-950'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-offset-white'
          "
          :aria-label="preferences.isDark ? '切換為亮色模式' : '切換為深色模式'"
          :title="preferences.isDark ? '切換為亮色模式' : '切換為深色模式'"
          @click="openHeaderPreferences"
        >
          <span class="text-base" aria-hidden="true">{{ preferences.isDark ? '☀️' : '🌙' }}</span>
        </button>

        <template v-if="auth.isAuthenticated">
          <button
            type="button"
            class="relative h-10 w-10 shrink-0 overflow-visible rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            :class="
              preferences.isDark
                ? 'focus-visible:ring-offset-slate-950'
                : 'focus-visible:ring-offset-white'
            "
            aria-label="開啟使用者選單"
            :aria-expanded="userMenuEnabled ? undefined : localMenuOpen"
            @click="handleAvatarClick"
          >
            <UserAvatar
              class="h-10 w-10 text-sm"
              :avatar-url="resolvedAvatarUrl"
              :display-name="displayName"
              :username="auth.user?.name || ''"
              :user-id="auth.user?.userId || null"
            />

            <span
              v-if="effectiveNotificationCount > 0"
              class="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-5 text-white"
            >
              {{ effectiveNotificationCount > 99 ? '99+' : effectiveNotificationCount }}
            </span>
          </button>
        </template>

        <RouterLink
          v-else-if="route.path !== '/login'"
          :to="actionLink"
          class="inline-flex h-9 items-center justify-center rounded-lg px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:px-4"
          :class="actionButtonClass"
        >
          {{ actionLabel }}
        </RouterLink>
      </div>
    </div>
  </header>

  <template v-if="auth.isAuthenticated && !userMenuEnabled">
    <div v-if="localMenuOpen" class="fixed inset-0 z-55" @click="localMenuOpen = false"></div>
    <UserMenu
      :open="localMenuOpen"
      :display-name="displayName"
      :name="auth.user?.name || ''"
      :avatar-url="resolvedAvatarUrl"
      :invitation-count="effectiveNotificationCount"
      show-deck-link
      show-chat-link
      @close="localMenuOpen = false"
      @logout="handleLogout"
      @open-invitations="openInvitations"
      @open-settings="openProfileSettings"
    />
  </template>

  <PreferencesModal v-if="showPreferences" @close="showPreferences = false" />

  <InvitationModal
    v-if="showInvitations"
    :invitations="invitations"
    :friend-requests="friendRequests"
    :processing-friend-request-id="processingFriendRequestId"
    @close="showInvitations = false"
    @accept-invitation="acceptInvitation"
    @reject-invitation="rejectInvitation"
    @accept-friend-request="acceptFriendRequest"
    @reject-friend-request="rejectFriendRequest"
  />

  <ProfileSettingsModal
    v-if="showProfileSettings && userProfile"
    :profile="userProfile"
    @close="showProfileSettings = false"
    @saved="handleProfileSaved"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import InvitationModal from '@/components/InvitationModal.vue'
import PreferencesModal from '@/components/PreferencesModal.vue'
import ProfileSettingsModal from '@/components/ProfileSettingsModal.vue'
import UserMenu from '@/components/UserMenu.vue'
import UserAvatar from '@/components/base/UserAvatar.vue'
import {
  acceptChatInvitationApi,
  acceptFriendRequestApi,
  getMyChatInvitationsApi,
  getMyFriendRequestsApi,
  rejectChatInvitationApi,
  rejectFriendRequestApi,
} from '@/api/chatApi'
import { resolveApiError } from '@/api/resolveApiError'
import { getMyProfileApi, type UserProfile } from '@/api/profileApi'
import { useAuthStore } from '@/stores/authStore'
import type { ChatFriendRequest, ChatInvitation } from '@/types/chat'
import { usePreferencesStore } from '@/stores/preferencesStore'
import { showToast } from '@/utils/alerts'

const props = withDefaults(
  defineProps<{
    avatarUrl?: string | null
    notificationCount?: number
    userMenuEnabled?: boolean
  }>(),
  {
    avatarUrl: null,
    notificationCount: 0,
    userMenuEnabled: false,
  },
)

const emit = defineEmits<{
  'toggle-user-menu': []
  'close-user-menu': []
}>()

const auth = useAuthStore()
const preferences = usePreferencesStore()
const route = useRoute()
const router = useRouter()
const localMenuOpen = ref(false)
const showPreferences = ref(false)
const showInvitations = ref(false)
const showProfileSettings = ref(false)
const invitations = ref<ChatInvitation[]>([])
const friendRequests = ref<ChatFriendRequest[]>([])
const processingFriendRequestId = ref<string | null>(null)
const userProfile = ref<UserProfile | null>(null)

function reportHeaderError(context: string, error: unknown, notificationTitle?: string): void {
  console.error(`[AppHeader] ${context}`, error)

  if (notificationTitle) {
    showToast(resolveApiError(error), {
      title: notificationTitle,
      variant: 'error',
    })
  }
}

const displayName = computed(() => auth.user?.displayName || auth.user?.name || '使用者')
const resolvedAvatarUrl = computed(() => props.avatarUrl ?? auth.user?.avatarUrl ?? null)
const effectiveNotificationCount = computed(() =>
  props.userMenuEnabled
    ? props.notificationCount
    : invitations.value.length + friendRequests.value.length,
)

const actionLabel = computed(() => (route.path === '/login' ? '註冊' : '登入'))

async function ensureUserProfile(): Promise<void> {
  if (!auth.isAuthenticated) return

  try {
    await auth.ensureProfileLoaded()
  } catch (error) {
    reportHeaderError('Failed to preload user profile', error)
  }
}

onMounted(() => {
  void ensureUserProfile()

  if (auth.isAuthenticated && !props.userMenuEnabled) {
    void loadHeaderNotifications()
  }
})

watch(
  () => auth.isAuthenticated,
  (isAuthenticated) => {
    if (isAuthenticated) {
      void ensureUserProfile()

      if (!props.userMenuEnabled) {
        void loadHeaderNotifications()
      }
    } else {
      invitations.value = []
      friendRequests.value = []
      localMenuOpen.value = false
    }
  },
)

const actionLink = computed(() => {
  if (route.path === '/login') {
    return '/register'
  }

  if (route.path === '/') {
    return '/login'
  }

  return {
    path: '/login',
    query: { redirect: route.fullPath },
  }
})

const isChatRoute = computed(() => route.path.startsWith('/chat'))

const headerInnerClass = computed(() =>
  isChatRoute.value
    ? 'flex min-h-14 w-full items-center justify-between gap-3 px-3 sm:px-4'
    : 'mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-3 sm:px-4 lg:px-6',
)

const logoClass = computed(() =>
  isChatRoute.value
    ? 'app-logo h-8 w-auto max-w-[138px] object-contain sm:max-w-[150px]'
    : 'app-logo h-9 w-auto max-w-[150px] object-contain sm:h-10 sm:max-w-[180px]',
)

const headerClass = computed(() =>
  preferences.isDark
    ? 'border-white/10 bg-slate-950/90 shadow-[0_1px_0_rgba(255,255,255,0.04)]'
    : 'border-gray-200 bg-white/90 shadow-sm',
)

const actionButtonClass = computed(() =>
  preferences.isDark
    ? 'border border-blue-500 bg-blue-600 text-white hover:bg-blue-500 focus-visible:ring-offset-slate-950'
    : 'border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-offset-white',
)

function handleAvatarClick(): void {
  if (props.userMenuEnabled) {
    emit('toggle-user-menu')
    return
  }

  localMenuOpen.value = !localMenuOpen.value
}

function openHeaderPreferences(): void {
  localMenuOpen.value = false

  if (props.userMenuEnabled) {
    emit('close-user-menu')
  }

  showPreferences.value = true
}

async function loadHeaderNotifications(notifyOnError = false): Promise<void> {
  if (!auth.isAuthenticated || props.userMenuEnabled) return

  try {
    const [invitationResponse, friendRequestResponse] = await Promise.all([
      getMyChatInvitationsApi(),
      getMyFriendRequestsApi(),
    ])

    invitations.value = invitationResponse.invitations ?? []
    friendRequests.value = friendRequestResponse.requests ?? []
  } catch (error) {
    reportHeaderError(
      'Failed to load notifications',
      error,
      notifyOnError ? '通知載入失敗' : undefined,
    )
  }
}

async function openInvitations(): Promise<void> {
  localMenuOpen.value = false
  await loadHeaderNotifications(true)
  showInvitations.value = true
}

async function openProfileSettings(): Promise<void> {
  localMenuOpen.value = false

  try {
    userProfile.value = await getMyProfileApi()
    showProfileSettings.value = true
  } catch (error) {
    reportHeaderError('Failed to open profile settings', error, '個人資料載入失敗')
  }
}

function handleProfileSaved(profile: UserProfile): void {
  userProfile.value = profile
  auth.updateProfile({
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
    bio: profile.bio,
  })
  showProfileSettings.value = false
}

async function acceptInvitation(invitationId: string): Promise<void> {
  try {
    await acceptChatInvitationApi(invitationId)
    invitations.value = invitations.value.filter((item) => item.invitationId !== invitationId)
  } catch (error) {
    reportHeaderError('Failed to accept chat invitation', error, '接受邀請失敗')
  }
}

async function rejectInvitation(invitationId: string): Promise<void> {
  try {
    await rejectChatInvitationApi(invitationId)
    invitations.value = invitations.value.filter((item) => item.invitationId !== invitationId)
  } catch (error) {
    reportHeaderError('Failed to reject chat invitation', error, '拒絕邀請失敗')
  }
}

async function acceptFriendRequest(requestId: string): Promise<void> {
  processingFriendRequestId.value = requestId

  try {
    await acceptFriendRequestApi(requestId)
    friendRequests.value = friendRequests.value.filter((item) => item.requestId !== requestId)
  } catch (error) {
    reportHeaderError('Failed to accept friend request', error, '接受好友邀請失敗')
  } finally {
    processingFriendRequestId.value = null
  }
}

async function rejectFriendRequest(requestId: string): Promise<void> {
  processingFriendRequestId.value = requestId

  try {
    await rejectFriendRequestApi(requestId)
    friendRequests.value = friendRequests.value.filter((item) => item.requestId !== requestId)
  } catch (error) {
    reportHeaderError('Failed to reject friend request', error, '拒絕好友邀請失敗')
  } finally {
    processingFriendRequestId.value = null
  }
}

async function handleLogout(): Promise<void> {
  localMenuOpen.value = false
  auth.logout()
  await router.push('/')
}
</script>
