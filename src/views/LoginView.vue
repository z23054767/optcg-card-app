<template>
  <div class="min-h-screen bg-gray-100 px-4 py-6 sm:flex sm:items-center sm:justify-center">
    <div class="mx-auto w-full max-w-md rounded-xl bg-white p-6 shadow-lg sm:p-8 relative">
      <button type="button" @click="preferences.setThemeMode(preferences.isDark ? 'light' : 'dark')"
        :title="preferences.isDark ? '切換到淺色模式' : '切換到深色模式'" :aria-label="preferences.isDark ? '切換到淺色模式' : '切換到深色模式'"
        class="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-lg shadow-sm shadow-slate-200/60 transition hover:scale-105 hover:shadow-md">
        <span>{{ preferences.isDark ? '☀️' : '🌙' }}</span>
      </button>

      <!-- Login Logo -->
      <div class="mb-6 flex flex-col items-center">
        <img src="/images/login-logo.png" alt="Login Logo" class="h-20 w-20 object-contain drop-shadow-sm" />

        <h1 class="mt-3 text-2xl font-bold text-gray-800">Login</h1>

        <p class="mt-1 text-center text-sm text-gray-500">登入您的帳號以繼續使用</p>
      </div>

      <!-- Form -->
      <form class="space-y-4" @submit.prevent="login">
        <!-- Account -->
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700"> 帳號 </label>

          <input v-model="name" type="text" placeholder="請輸入 Username"
            class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required />
        </div>

        <!-- Password -->
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700"> 密碼 </label>

          <div class="relative">
            <input v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="請輸入密碼"
              class="w-full rounded-lg border border-gray-300 px-4 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required />

            <button type="button" :aria-label="showPassword ? '隱藏密碼' : '顯示密碼'" :title="showPassword ? '隱藏密碼' : '顯示密碼'"
              class="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-gray-500 transition hover:text-gray-700"
              @click="showPassword = !showPassword">
              <FontAwesomeIcon :icon="showPassword ? 'eye-slash' : 'eye'" class="text-lg" />
            </button>
          </div>
        </div>

        <div class="flex items-center justify-end">
          <RouterLink to="/forgot-password" class="text-sm font-medium text-blue-600 hover:text-blue-700">
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

      <p class="mt-5 text-center text-sm text-gray-500">
        還沒有帳號？
        <RouterLink to="/register" class="font-medium text-blue-600 hover:text-blue-700">立即註冊</RouterLink>
      </p>

      <!-- Divider -->
      <div class="my-6 flex items-center gap-3">
        <div class="h-px flex-1 bg-gray-200"></div>

        <span class="shrink-0 text-xs text-gray-400"> 或使用第三方登入 </span>

        <div class="h-px flex-1 bg-gray-200"></div>
      </div>

      <!-- OAuth Login -->
      <div class="space-y-3">
        <!-- Google -->
        <button type="button" :disabled="oauthLoadingProvider !== null"
          class="flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4"
          @click="startOAuthLogin('google')">
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
          class="flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4"
          @click="startOAuthLogin('microsoft')">
          <span class="grid w-full max-w-48 grid-cols-[24px_1fr_24px] items-center gap-2 sm:gap-3">
            <span class="grid w-full max-w-48 grid-cols-[24px_1fr_24px] items-center gap-2 sm:gap-3">
              <img :src="MicrosoftIcon" alt="Microsoft" class="h-5 w-5 justify-self-center object-contain" />

              <span class="whitespace-nowrap text-center">
                {{
                  oauthLoadingProvider === 'microsoft' ? '前往 Microsoft...' : '使用 Microsoft 登入'
                }}
              </span>

              <span aria-hidden="true"></span>
            </span>

            <span aria-hidden="true"></span>
          </span>
        </button>

        <!-- LINE -->
        <button type="button" :disabled="oauthLoadingProvider !== null"
          class="flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4"
          @click="startOAuthLogin('line')">
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
          class="flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4"
          @click="startOAuthLogin('discord')">
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
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { buildOAuthLoginUrl, loginApi, type OAuthProvider } from '@/api/loginApi'
import { useAuthStore } from '@/stores/authStore'
import { usePreferencesStore } from '@/stores/preferencesStore'
import { resolveApiError } from '@/api/resolveApiError'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { showWarningAlert } from '@/utils/alerts'
import { refreshAccessToken } from '@/api/http'
import GoogleIcon from '@/assets/icons/google.svg'
import LineIcon from '@/assets/icons/line.svg'
import MicrosoftIcon from '@/assets/icons/microsoft.svg'
import DiscordIcon from '@/assets/icons/discord.svg'

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

function normalizeRedirectTarget(input: unknown): string {
  const redirect = String(input ?? '/chat')
  if (!redirect.startsWith('/') || redirect.startsWith('//') || redirect.includes('://')) {
    return '/chat'
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

    const redirect = String(route.query.redirect ?? '/chat')

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
