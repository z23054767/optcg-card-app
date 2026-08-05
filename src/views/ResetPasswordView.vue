<template>
  <div class="min-h-screen bg-gray-100 px-4 py-6 sm:flex sm:items-center sm:justify-center">
    <div class="mx-auto w-full max-w-md rounded-xl bg-white p-6 shadow-lg sm:p-8">
      <div class="mb-6 flex flex-col items-center">
        <img
          src="/images/login-logo.png"
          alt="重設密碼"
          class="h-20 w-20 object-contain drop-shadow-sm"
        />
        <h1 class="mt-3 text-2xl font-bold text-gray-800">重設密碼</h1>
        <p class="mt-1 text-center text-sm text-gray-500">請設定新的登入密碼</p>
      </div>

      <form v-if="token" class="space-y-4" @submit.prevent="submit">
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">新密碼</label>
          <input
            v-model="newPassword"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
            placeholder="至少 8 碼，包含英文、數字及特殊符號"
            class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">確認新密碼</label>
          <input
            v-model="confirmPassword"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
            placeholder="請再次輸入新密碼"
            class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <label class="flex items-center gap-2 text-sm text-gray-600">
          <input v-model="showPassword" type="checkbox" class="rounded border-gray-300" /> 顯示密碼
        </label>
        <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>
        <button
          type="submit"
          :disabled="loading"
          class="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {{ loading ? '更新中...' : '更新密碼' }}
        </button>
      </form>

      <div v-else class="text-center">
        <p class="text-sm text-red-600">重設密碼連結無效，請重新申請。</p>
        <RouterLink
          to="/forgot-password"
          class="mt-4 inline-block font-medium text-blue-600 hover:text-blue-700"
          >重新申請</RouterLink
        >
      </div>

      <p class="mt-6 text-center text-sm">
        <RouterLink to="/login" class="font-medium text-blue-600 hover:text-blue-700"
          >返回登入</RouterLink
        >
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { resetPasswordApi } from '@/api/loginApi'
import { resolveApiError } from '@/api/resolveApiError'
import { showSuccessAlert } from '@/utils/alerts'

const route = useRoute()
const router = useRouter()
const token = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''))
const newPassword = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')

async function submit(): Promise<void> {
  errorMessage.value = ''
  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = '兩次輸入的密碼不一致'
    return
  }

  loading.value = true
  try {
    await resetPasswordApi(token.value, newPassword.value)
    await showSuccessAlert('密碼已更新，請使用新密碼登入')
    await router.replace('/login')
  } catch (error: unknown) {
    errorMessage.value = resolveApiError(error)
  } finally {
    loading.value = false
  }
}
</script>
