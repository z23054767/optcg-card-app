<template>
  <div
    class="min-h-screen bg-linear-to-br from-slate-100 via-white to-violet-50 px-4 py-6 sm:flex sm:items-center sm:justify-center"
  >
    <div
      class="relative mx-auto w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-8"
    >
      <RouterLink
        to="/"
        class="absolute left-4 top-4 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
      >
        ← 返回首頁
      </RouterLink>

      <div class="mb-6 flex flex-col items-center pt-8">
        <img
          src="/logo_op.png"
          alt="忘記密碼"
          class="app-logo h-20 w-20 object-contain drop-shadow-sm"
        />

        <h1 class="mt-3 text-2xl font-bold text-gray-800">忘記密碼</h1>

        <p class="mt-1 text-center text-sm leading-6 text-gray-500">
          輸入註冊 Email，我們會寄送密碼重設連結
        </p>
      </div>

      <form class="space-y-4" @submit.prevent="submit">
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700"> Email </label>

          <input
            v-model.trim="email"
            type="email"
            autocomplete="email"
            placeholder="example@email.com"
            class="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2"
            :class="emailInputClass"
            required
            @input="handleEmailInput"
            @blur="validateEmail"
          />

          <p v-if="emailStatus === 'invalid'" class="mt-1 text-xs text-red-600">
            ✖ {{ emailValidationMessage }}
          </p>

          <p v-else class="mt-1 text-xs text-gray-500">請輸入建立帳號時使用的 Email</p>
        </div>

        <p v-if="errorMessage" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {{ errorMessage }}
        </p>

        <button
          type="submit"
          :disabled="!canSubmit"
          class="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {{ loading ? '寄送中...' : '寄送重設連結' }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-gray-500">
        想起密碼了？

        <RouterLink to="/login" class="font-medium text-blue-600 hover:text-blue-700">
          返回登入
        </RouterLink>
      </p>

      <p class="mt-2 text-center text-xs text-gray-400">
        只想先逛內容？

        <RouterLink to="/" class="font-medium text-slate-500 hover:text-slate-700">
          回首頁看看
        </RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { forgotPasswordApi } from '@/api/loginApi'
import { resolveApiError } from '@/api/resolveApiError'
import { showSuccessAlert } from '@/utils/alerts'

type EmailStatus = 'idle' | 'valid' | 'invalid'

const email = ref('')
const loading = ref(false)
const errorMessage = ref('')

const emailStatus = ref<EmailStatus>('idle')
const emailValidationMessage = ref('')

const emailInputClass = computed(() => {
  switch (emailStatus.value) {
    case 'invalid':
      return 'border-red-500 focus:ring-red-200'

    case 'valid':
    case 'idle':
    default:
      return 'border-gray-300 focus:ring-blue-500'
  }
})

const canSubmit = computed(() => {
  return !loading.value && email.value.trim().length > 0 && emailStatus.value !== 'invalid'
})

function validateEmailFormat(value: string): string {
  if (!value) {
    return '請輸入 Email'
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailPattern.test(value)) {
    return '請輸入有效的 Email'
  }

  return ''
}

function handleEmailInput(): void {
  errorMessage.value = ''

  if (emailStatus.value !== 'idle') {
    emailStatus.value = 'idle'
    emailValidationMessage.value = ''
  }
}

function validateEmail(): void {
  const normalizedEmail = email.value.trim()

  email.value = normalizedEmail

  const validationMessage = validateEmailFormat(normalizedEmail)

  if (validationMessage) {
    emailStatus.value = 'invalid'
    emailValidationMessage.value = validationMessage
    return
  }

  emailStatus.value = 'valid'
  emailValidationMessage.value = ''
}

async function submit(): Promise<void> {
  errorMessage.value = ''

  const normalizedEmail = email.value.trim()

  const emailError = validateEmailFormat(normalizedEmail)

  if (emailError) {
    emailStatus.value = 'invalid'
    emailValidationMessage.value = emailError
    return
  }

  emailStatus.value = 'valid'
  emailValidationMessage.value = ''

  loading.value = true

  try {
    await forgotPasswordApi(normalizedEmail)

    await showSuccessAlert('若此 Email 已註冊，密碼重設信將寄送至您的信箱')

    email.value = ''
    emailStatus.value = 'idle'
    emailValidationMessage.value = ''
  } catch (error: unknown) {
    errorMessage.value = resolveApiError(error)
  } finally {
    loading.value = false
  }
}
</script>
