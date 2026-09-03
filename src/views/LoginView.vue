<template>
  <div class="min-h-screen bg-linear-to-br transition-colors duration-200" :class="pageClass">
    <AppHeader />

    <main class="px-4 py-6 sm:flex sm:min-h-[calc(100vh-4rem)] sm:items-center sm:justify-center sm:py-8">
      <div class="relative mx-auto w-full max-w-md rounded-[28px] border p-6 shadow-xl sm:p-8" :class="panelClass">
        <!-- Login Logo -->
        <div class="mb-6 flex flex-col items-center">
          <img src="/logo_op.png" alt="Login Logo" class="app-logo h-20 w-20 object-contain drop-shadow-sm" />

          <h1 class="mt-3 text-2xl font-bold" :class="titleClass">登入帳號</h1>

          <p class="mt-1 text-center text-sm" :class="mutedTextClass">登入您的帳號以繼續使用</p>
        </div>

        <!-- Form -->
        <form class="space-y-4" @submit.prevent="login">
          <!-- Account -->
          <div>
            <label class="mb-1 block text-sm font-medium" :class="labelClass"> 帳號 </label>

            <input v-model="name" type="text" autocomplete="username" placeholder="請輸入 Username"
              class="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              :class="inputClass" required />
          </div>

          <!-- Password -->
          <div>
            <label class="mb-1 block text-sm font-medium" :class="labelClass"> 密碼 </label>

            <div class="relative">
              <input v-model="password" :type="showPassword ? 'text' : 'password'" autocomplete="current-password"
                placeholder="請輸入密碼"
                class="w-full rounded-lg border px-4 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="inputClass" required />

              <button type="button" :aria-label="showPassword ? '隱藏密碼' : '顯示密碼'" :title="showPassword ? '隱藏密碼' : '顯示密碼'"
                class="absolute inset-y-0 right-0 flex w-10 items-center justify-center transition"
                :class="passwordToggleClass" @click="showPassword = !showPassword">
                <FontAwesomeIcon :icon="showPassword ? 'eye-slash' : 'eye'" class="text-lg" />
              </button>
            </div>
          </div>

          <div class="flex items-center justify-end">
            <RouterLink to="/forgot-password" class="text-sm font-medium" :class="linkClass">
              忘記密碼？
            </RouterLink>
          </div>

          <!-- Error -->
          <p v-if="errorMessage" class="text-sm text-red-600">
            {{ errorMessage }}
          </p>

          <!-- Login Button -->
          <button type="submit" :disabled="loading"
            class="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
            {{ loading ? '登入中...' : '登入' }}
          </button>
        </form>

        <p class="mt-5 text-center text-sm" :class="mutedTextClass">
          還沒有帳號？
          <RouterLink to="/register" class="font-medium" :class="linkClass">立即註冊</RouterLink>
        </p>

        <p class="mt-2 text-center text-xs" :class="subtleTextClass">
          <RouterLink to="/" class="font-medium" :class="subtleLinkClass">回首頁</RouterLink>
        </p>

        <!-- Divider -->
        <div class="my-6 flex items-center gap-3">
          <div class="h-px flex-1" :class="dividerClass"></div>

          <span class="shrink-0 text-xs" :class="subtleTextClass"> 或使用第三方登入 </span>

          <div class="h-px flex-1" :class="dividerClass"></div>
        </div>

        <!-- OAuth Login -->
        <div class="space-y-3">
          <!-- Google -->
          <button type="button" :disabled="oauthLoadingProvider !== null"
            class="flex w-full items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 sm:px-4"
            :class="oauthButtonClass" @click="startOAuthLogin('google')">
            <span class="grid w-full max-w-48 grid-cols-[24px_1fr_24px] items-center gap-2 sm:gap-3">
              <img :src="GoogleIcon" alt="Google" class="h-5 w-5 justify-self-center object-contain" />

              <span class="whitespace-nowrap text-center">
                {{ oauthLoadingProvider === 'google' ? '前往 Google...' : '使用 Google 登入' }}
              </span>

              <span aria-hidden="true"></span>
            </span>
          </button>

          <!-- Microsoft -->
          <button type="button" :disabled="oauthLoadingProvider !== null"
            class="flex w-full items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 sm:px-4"
            :class="oauthButtonClass" @click="startOAuthLogin('microsoft')">
            <span class="grid w-full max-w-48 grid-cols-[24px_1fr_24px] items-center gap-2 sm:gap-3">
              <span class="grid w-full max-w-48 grid-cols-[24px_1fr_24px] items-center gap-2 sm:gap-3">
                <img :src="MicrosoftIcon" alt="Microsoft" class="h-5 w-5 justify-self-center object-contain" />

                <span class="whitespace-nowrap text-center">
                  {{
                    oauthLoadingProvider === 'microsoft'
                      ? '前往 Microsoft...'
                      : '使用 Microsoft 登入'
                  }}
                </span>

                <span aria-hidden="true"></span>
              </span>

              <span aria-hidden="true"></span>
            </span>
          </button>

          <!-- LINE -->
          <button type="button" :disabled="oauthLoadingProvider !== null"
            class="flex w-full items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 sm:px-4"
            :class="oauthButtonClass" @click="startOAuthLogin('line')">
            <span class="grid w-full max-w-48 grid-cols-[24px_1fr_24px] items-center gap-2 sm:gap-3">
              <img :src="LineIcon" alt="LINE" class="h-5 w-5 justify-self-center object-contain" />

              <span class="whitespace-nowrap text-center">
                {{ oauthLoadingProvider === 'line' ? '前往 LINE...' : '使用 LINE 登入' }}
              </span>

              <span aria-hidden="true"></span>
            </span>
          </button>

          <!-- Discord -->
          <button type="button" :disabled="oauthLoadingProvider !== null"
            class="flex w-full items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 sm:px-4"
            :class="oauthButtonClass" @click="startOAuthLogin('discord')">
            <span class="grid w-full max-w-48 grid-cols-[24px_1fr_24px] items-center gap-2 sm:gap-3">
              <img :src="DiscordIcon" alt="Discord" class="h-5 w-5 justify-self-center object-contain" />

              <span class="whitespace-nowrap text-center">
                {{ oauthLoadingProvider === 'discord' ? '前往 Discord...' : '使用 Discord 登入' }}
              </span>

              <span aria-hidden="true"></span>
            </span>
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import { useRoute, useRouter } from 'vue-router'
import { buildOAuthLoginUrl, loginApi, type OAuthProvider } from '@/api/loginApi'
import { useAuthStore } from '@/stores/authStore'
import { resolveApiError } from '@/api/resolveApiError'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { showWarningAlert } from '@/utils/alerts'
import { refreshAccessToken } from '@/api/http'
import GoogleIcon from '@/assets/icons/google.svg'
import LineIcon from '@/assets/icons/line.svg'
import MicrosoftIcon from '@/assets/icons/microsoft.svg'
import DiscordIcon from '@/assets/icons/discord.svg'
import { usePreferencesStore } from '@/stores/preferencesStore'

const authStore = useAuthStore()
const preferences = usePreferencesStore()

const name = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const oauthLoadingProvider = ref<OAuthProvider | null>(null)
const router = useRouter()
const route = useRoute()

const pageClass = computed(() =>
  preferences.isDark
    ? 'from-slate-950 via-slate-950 to-indigo-950'
    : 'from-slate-100 via-white to-indigo-50',
)
const panelClass = computed(() =>
  preferences.isDark
    ? 'border-white/10 bg-slate-900/90 shadow-black/30'
    : 'border-slate-200 bg-white shadow-slate-200/70',
)
const titleClass = computed(() => (preferences.isDark ? 'text-slate-100' : 'text-gray-800'))
const labelClass = computed(() => (preferences.isDark ? 'text-slate-200' : 'text-gray-700'))
const mutedTextClass = computed(() => (preferences.isDark ? 'text-slate-400' : 'text-gray-500'))
const subtleTextClass = computed(() => (preferences.isDark ? 'text-slate-500' : 'text-gray-400'))
const inputClass = computed(() =>
  preferences.isDark
    ? 'border-slate-700 bg-slate-950/70 text-slate-100 placeholder:text-slate-500'
    : 'border-gray-300 bg-white text-gray-900',
)
const passwordToggleClass = computed(() =>
  preferences.isDark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-500 hover:text-gray-700',
)
const linkClass = computed(() =>
  preferences.isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700',
)
const subtleLinkClass = computed(() =>
  preferences.isDark
    ? 'text-slate-400 hover:text-slate-200'
    : 'text-slate-500 hover:text-slate-700',
)
const dividerClass = computed(() => (preferences.isDark ? 'bg-white/10' : 'bg-gray-200'))
const oauthButtonClass = computed(() =>
  preferences.isDark
    ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
)

function normalizeRedirectTarget(input: unknown): string {
  const redirect = String(input ?? '/decks')
  if (!redirect.startsWith('/') || redirect.startsWith('//') || redirect.includes('://')) {
    return '/decks'
  }

  return redirect
}

function resolveOAuthErrorMessage(code: unknown): string {
  switch (String(code ?? '')) {
    case 'OAUTH_PROVIDER_NOT_CONFIGURED':
      return '第三方登入尚未完成設定，請改用帳密登入'
    case 'OAUTH_STATE_INVALID':
      return '第三方登入狀態失效，請重新嘗試'
    case 'OAUTH_CODE_EXCHANGE_FAILED':
      return '第三方登入授權失敗，請稍後再試'
    case 'OAUTH_EMAIL_REQUIRED':
      return '第三方登入資料不完整，無法建立帳號'
    case 'OAUTH_TOKEN_INVALID':
      return '第三方登入憑證無效，請重新登入'
    case 'OAUTH_ACCOUNT_CONFLICT':
      return '此帳號已綁定原系統登入方式，請使用帳號密碼登入'
    default:
      return '第三方登入失敗，請稍後再試'
  }
}

async function login() {
  errorMessage.value = ''
  loading.value = true

  try {
    const res = await loginApi({
      name: name.value,
      password: password.value,
    })

    if (!res.success) {
      errorMessage.value = '登入失敗'
      return
    }

    authStore.login(res.token)

    const redirect = normalizeRedirectTarget(route.query.redirect)

    await router.replace(redirect)
  } catch (error: unknown) {
    errorMessage.value = resolveApiError(error)
  } finally {
    loading.value = false
  }
}

async function startOAuthLogin(provider: OAuthProvider): Promise<void> {
  const redirect = normalizeRedirectTarget(route.query.redirect)
  oauthLoadingProvider.value = provider
  window.location.assign(buildOAuthLoginUrl(provider, redirect))
}

onMounted(async () => {
  if (route.query.oauth_error) {
    errorMessage.value = resolveOAuthErrorMessage(route.query.oauth_error)
    return
  }

  if (route.query.oauth !== 'success') {
    return
  }

  if ((route.query.reason ?? '') !== 'expired') {
    try {
      const redirect = normalizeRedirectTarget(route.query.redirect)
      await refreshAccessToken()
      await router.replace(redirect)
    } catch {
      errorMessage.value = '第三方登入完成，但登入憑證取得失敗，請重新嘗試'
    }
    return
  }

  await showWarningAlert('登入已逾時，請重新登入')

  await router.replace({
    path: '/login',
    query: {
      redirect: route.query.redirect,
    },
  })
})
</script>
