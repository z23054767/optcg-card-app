<template>
  <div class="min-h-screen bg-gray-100 px-4 py-6 sm:flex sm:items-center sm:justify-center">
    <div class="mx-auto w-full max-w-md rounded-xl bg-white p-6 shadow-lg sm:p-8">
      <div class="mb-6 flex flex-col items-center">
        <img
          src="/images/login-logo.png"
          alt="忘記密碼"
          class="h-20 w-20 object-contain drop-shadow-sm"
        />
        <h1 class="mt-3 text-2xl font-bold text-gray-800">忘記密碼</h1>
        <p class="mt-1 text-center text-sm text-gray-500">輸入註冊 Email，我們會寄送密碼重設連結</p>
      </div>

      <form class="space-y-4" @submit.prevent="submit">
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">Email</label>
          <input
            v-model.trim="account"
            type="email"
            autocomplete="email"
            placeholder="example@email.com"
            class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>
        <button
          type="submit"
          :disabled="loading"
          class="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {{ loading ? '寄送中...' : '寄送重設連結' }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm">
        <RouterLink to="/login" class="font-medium text-blue-600 hover:text-blue-700"
          >返回登入</RouterLink
        >
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { forgotPasswordApi } from '@/api/loginApi'
import { resolveApiError } from '@/api/resolveApiError'
import { showSuccessAlert } from '@/utils/alerts'

const account = ref('')
const loading = ref(false)
const errorMessage = ref('')

async function submit(): Promise<void> {
  errorMessage.value = ''
  loading.value = true
  try {
    await forgotPasswordApi(account.value)
    await showSuccessAlert('若此 Email 已註冊，密碼重設信將寄送至您的信箱')
    account.value = ''
  } catch (error: unknown) {
    errorMessage.value = resolveApiError(error)
  } finally {
    loading.value = false
  }
}
</script>
