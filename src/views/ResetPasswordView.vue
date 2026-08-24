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
          alt="重設密碼"
          class="app-logo h-20 w-20 object-contain drop-shadow-sm"
        />

        <h1 class="mt-3 text-2xl font-bold text-gray-800">重設密碼</h1>

        <p class="mt-1 text-center text-sm leading-6 text-gray-500">請設定新的登入密碼</p>
      </div>

      <form v-if="token" class="space-y-4" @submit.prevent="submit">
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700"> 新密碼 </label>

          <div class="relative">
            <input
              v-model="newPassword"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="至少 8 碼，包含英文、數字及特殊符號"
              class="w-full rounded-lg border px-4 py-2 pr-12 focus:outline-none focus:ring-2"
              :class="passwordInputClass"
              required
              @input="handlePasswordInput"
              @blur="validateNewPassword"
            />

            <button
              type="button"
              class="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-gray-500 hover:text-gray-700"
              :aria-label="showPassword ? '隱藏密碼' : '顯示密碼'"
              @click="showPassword = !showPassword"
            >
              <FontAwesomeIcon :icon="showPassword ? 'eye-slash' : 'eye'" />
            </button>
          </div>

          <p v-if="passwordStatus === 'invalid'" class="mt-1 text-xs text-red-600">
            ✖ {{ passwordValidationMessage }}
          </p>

          <p v-else class="mt-1 text-xs text-gray-500">
            密碼需為 8 至 64 碼，包含英文、數字及特殊符號
          </p>
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700"> 確認新密碼 </label>

          <input
            v-model="confirmPassword"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
            placeholder="請再次輸入新密碼"
            class="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2"
            :class="confirmPasswordInputClass"
            required
            @input="handleConfirmPasswordInput"
            @blur="validateConfirmPassword"
          />

          <p v-if="confirmPasswordStatus === 'invalid'" class="mt-1 text-xs text-red-600">
            ✖ {{ confirmPasswordValidationMessage }}
          </p>
        </div>

        <p v-if="errorMessage" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {{ errorMessage }}
        </p>

        <button
          type="submit"
          :disabled="!canSubmit"
          class="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {{ loading ? '更新中...' : '更新密碼' }}
        </button>
      </form>

      <div v-else class="text-center">
        <p class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          重設密碼連結無效，請重新申請。
        </p>

        <RouterLink
          to="/forgot-password"
          class="mt-4 inline-block font-medium text-blue-600 hover:text-blue-700"
        >
          重新申請
        </RouterLink>
      </div>

      <p class="mt-6 text-center text-sm text-gray-500">
        <RouterLink to="/login" class="font-medium text-blue-600 hover:text-blue-700">
          返回登入
        </RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { resetPasswordApi } from '@/api/loginApi'
import { resolveApiError } from '@/api/resolveApiError'
import { showSuccessAlert } from '@/utils/alerts'

type PasswordStatus = 'idle' | 'valid' | 'invalid'

const route = useRoute()
const router = useRouter()

const token = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''))

const newPassword = ref('')
const confirmPassword = ref('')

const showPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')

const passwordStatus = ref<PasswordStatus>('idle')
const passwordValidationMessage = ref('')

const confirmPasswordStatus = ref<PasswordStatus>('idle')
const confirmPasswordValidationMessage = ref('')

const passwordInputClass = computed(() => {
  switch (passwordStatus.value) {
    case 'invalid':
      return 'border-red-500 focus:ring-red-200'

    case 'valid':
    case 'idle':
    default:
      return 'border-gray-300 focus:ring-blue-500'
  }
})

const confirmPasswordInputClass = computed(() => {
  switch (confirmPasswordStatus.value) {
    case 'invalid':
      return 'border-red-500 focus:ring-red-200'

    case 'valid':
    case 'idle':
    default:
      return 'border-gray-300 focus:ring-blue-500'
  }
})

const canSubmit = computed(() => {
  return (
    !loading.value &&
    token.value.length > 0 &&
    newPassword.value.length > 0 &&
    confirmPassword.value.length > 0 &&
    passwordStatus.value !== 'invalid' &&
    confirmPasswordStatus.value !== 'invalid'
  )
})

function validatePassword(value: string): string {
  if (value.length < 8 || value.length > 64) {
    return '密碼長度必須為 8 至 64 碼'
  }

  if (!/[a-zA-Z]/.test(value)) {
    return '密碼必須包含至少一個英文字母'
  }

  if (!/[0-9]/.test(value)) {
    return '密碼必須包含至少一個數字'
  }

  if (!/[()[\]{}<>+\-*/?,.:;"'_\\|~`!@#$%^&=]/.test(value)) {
    return '密碼必須包含至少一個特殊符號'
  }

  if (/^\s|\s$/.test(value)) {
    return '密碼開頭與結尾不可為空格'
  }

  return ''
}

function handlePasswordInput(): void {
  errorMessage.value = ''

  if (passwordStatus.value !== 'idle') {
    passwordStatus.value = 'idle'
    passwordValidationMessage.value = ''
  }

  if (confirmPassword.value) {
    confirmPasswordStatus.value = 'idle'
    confirmPasswordValidationMessage.value = ''
  }
}

function validateNewPassword(): void {
  const validationMessage = validatePassword(newPassword.value)

  if (validationMessage) {
    passwordStatus.value = 'invalid'
    passwordValidationMessage.value = validationMessage
    return
  }

  passwordStatus.value = 'valid'
  passwordValidationMessage.value = ''

  if (confirmPassword.value) {
    validateConfirmPassword()
  }
}

function handleConfirmPasswordInput(): void {
  errorMessage.value = ''

  if (confirmPasswordStatus.value !== 'idle') {
    confirmPasswordStatus.value = 'idle'
    confirmPasswordValidationMessage.value = ''
  }
}

function validateConfirmPassword(): void {
  if (!confirmPassword.value) {
    confirmPasswordStatus.value = 'invalid'
    confirmPasswordValidationMessage.value = '請再次輸入新密碼'
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    confirmPasswordStatus.value = 'invalid'
    confirmPasswordValidationMessage.value = '兩次輸入的密碼不一致'
    return
  }

  confirmPasswordStatus.value = 'valid'
  confirmPasswordValidationMessage.value = ''
}

async function submit(): Promise<void> {
  errorMessage.value = ''

  const passwordError = validatePassword(newPassword.value)

  if (passwordError) {
    passwordStatus.value = 'invalid'
    passwordValidationMessage.value = passwordError
    errorMessage.value = passwordError
    return
  }

  passwordStatus.value = 'valid'
  passwordValidationMessage.value = ''

  if (!confirmPassword.value) {
    confirmPasswordStatus.value = 'invalid'
    confirmPasswordValidationMessage.value = '請再次輸入新密碼'
    errorMessage.value = '請再次輸入新密碼'
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    confirmPasswordStatus.value = 'invalid'
    confirmPasswordValidationMessage.value = '兩次輸入的密碼不一致'
    errorMessage.value = '兩次輸入的密碼不一致'
    return
  }

  confirmPasswordStatus.value = 'valid'
  confirmPasswordValidationMessage.value = ''

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
