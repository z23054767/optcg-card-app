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
          :class="preferences.isDark
            ? 'border-white/10 bg-slate-900/70 text-slate-100 hover:bg-slate-800 focus-visible:ring-offset-slate-950'
            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-offset-white'"
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
            :class="preferences.isDark ? 'focus-visible:ring-offset-slate-950' : 'focus-visible:ring-offset-white'"
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
              v-if="notificationCount > 0"
              class="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-5 text-white"
            >
              {{ notificationCount > 99 ? '99+' : notificationCount }}
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
    <div v-if="localMenuOpen" class="fixed inset-0 z-[55]" @click="localMenuOpen = false"></div>
    <UserMenu
      :open="localMenuOpen"
      :display-name="displayName"
      :name="auth.user?.name || ''"
      :avatar-url="resolvedAvatarUrl"
      :invitation-count="0"
      :show-invitations="false"
      :show-settings="false"
      show-preferences
      show-deck-link
      show-chat-link
      @close="localMenuOpen = false"
      @logout="handleLogout"
      @open-preferences="openPreferences"
    />
  </template>

  <PreferencesModal v-if="showPreferences" @close="showPreferences = false" />
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import PreferencesModal from '@/components/PreferencesModal.vue'
import UserMenu from '@/components/UserMenu.vue'
import UserAvatar from '@/components/base/UserAvatar.vue'
import { useAuthStore } from '@/stores/authStore'
import { usePreferencesStore } from '@/stores/preferencesStore'

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

const displayName = computed(() => auth.user?.displayName || auth.user?.name || '使用者')
const resolvedAvatarUrl = computed(() => props.avatarUrl ?? auth.user?.avatarUrl ?? null)

const actionLabel = computed(() => (route.path === '/login' ? '註冊' : '登入'))

async function ensureUserProfile(): Promise<void> {
  if (!auth.isAuthenticated) return

  try {
    await auth.ensureProfileLoaded()
  } catch {
    // 個人資料載入失敗時保留預設頭像，不影響 Header 與其他頁面功能。
  }
}

onMounted(() => {
  void ensureUserProfile()
})

watch(
  () => auth.isAuthenticated,
  (isAuthenticated) => {
    if (isAuthenticated) {
      void ensureUserProfile()
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
    ? 'bg-slate-100 text-slate-900 hover:bg-white focus-visible:ring-offset-slate-950'
    : 'bg-gray-900 text-white hover:bg-gray-800 focus-visible:ring-offset-white',
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

function openPreferences(): void {
  localMenuOpen.value = false
  showPreferences.value = true
}

async function handleLogout(): Promise<void> {
  localMenuOpen.value = false
  auth.logout()
  await router.push('/')
}
</script>
