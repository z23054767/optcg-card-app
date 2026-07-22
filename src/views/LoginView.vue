<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 px-4">
    <div class="w-full max-w-md bg-white rounded-xl shadow-lg p-6 sm:p-8">
      <!-- Title -->
      <h1 class="text-2xl font-bold text-center text-gray-800 mb-6">登入系統</h1>

      <!-- Form -->
      <form @submit.prevent="login" class="space-y-4">
        <!-- Account -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1"> 帳號 </label>
          <input
            v-model="account"
            type="text"
            placeholder="example@email.com"
            class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <!-- Password -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1"> 密碼 </label>

          <div class="relative">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="請輸入密碼"
              class="w-full rounded-lg border border-gray-300 px-4 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />

            <button
              type="button"
              :aria-label="showPassword ? '隱藏密碼' : '顯示密碼'"
              :title="showPassword ? '隱藏密碼' : '顯示密碼'"
              class="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-gray-500 hover:text-gray-700"
              @click="showPassword = !showPassword"
            >
              <FontAwesomeIcon :icon="showPassword ? 'eye-slash' : 'eye'" class="text-lg">
              </FontAwesomeIcon>
            </button>
          </div>
        </div>

        <!-- Error -->
        <p v-if="errorMessage" class="text-sm text-red-600">
          {{ errorMessage }}
        </p>

        <!-- Button -->
        <button
          type="submit"
          :disabled="loading"
          class="w-full rounded-lg bg-blue-600 py-2 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {{ loading ? '登入中...' : '登入' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { loginApi } from '@/api/loginApi'
import { useAuthStore } from '@/stores/authStore'
import { resolveApiError } from '@/api/resolveApiError'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { showWarningAlert } from '@/utils/alerts'

const authStore = useAuthStore()

const account = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const router = useRouter()
const route = useRoute()

async function login() {
  errorMessage.value = ''
  loading.value = true

  try {
    const res = await loginApi({
      account: account.value,
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

onMounted(async () => {
  if ((route.query.reason ?? '') !== 'expired') {
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
