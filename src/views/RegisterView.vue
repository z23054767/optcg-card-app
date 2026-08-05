<template>
  <div class="min-h-screen bg-gray-100 px-4 py-6 sm:flex sm:items-center sm:justify-center">
    <div class="mx-auto w-full max-w-md rounded-xl bg-white p-6 shadow-lg sm:p-8">
      <div class="mb-6 flex flex-col items-center">
        <img
          src="/images/login-logo.png"
          alt="註冊"
          class="h-20 w-20 object-contain drop-shadow-sm"
        />
        <h1 class="mt-3 text-2xl font-bold text-gray-800">建立帳號</h1>
        <p class="mt-1 text-center text-sm text-gray-500">填寫資料後，我們會寄送驗證信給您</p>
      </div>

      <form class="space-y-4" @submit.prevent="register">
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">名稱</label>
          <input
            v-model.trim="name"
            type="text"
            maxlength="30"
            placeholder="請輸入顯示名稱"
            class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

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

        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">密碼</label>
          <div class="relative">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="至少 8 碼，包含英文、數字及特殊符號"
              class="w-full rounded-lg border border-gray-300 px-4 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
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
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">確認密碼</label>
          <input
            v-model="confirmPassword"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
            placeholder="請再次輸入密碼"
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
          {{ loading ? '註冊中...' : '註冊' }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-gray-500">
        已經有帳號？
        <RouterLink to="/login" class="font-medium text-blue-600 hover:text-blue-700"
          >返回登入</RouterLink
        >
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { registerApi } from '@/api/loginApi'
import { resolveApiError } from '@/api/resolveApiError'
import { showSuccessAlert } from '@/utils/alerts'

const router = useRouter()
const name = ref('')
const account = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')

function validatePassword(value: string): string {
  if (value.length < 8 || value.length > 64) return '密碼長度必須為 8 至 64 碼'
  if (!/[a-zA-Z]/.test(value)) return '密碼必須包含至少一個英文字母'
  if (!/[0-9]/.test(value)) return '密碼必須包含至少一個數字'
  if (!/[()\[\]{}<>+\-*/?,.:;"'_\\|~`!@#$%^&=]/.test(value)) return '密碼必須包含至少一個特殊符號'
  if (/^\s|\s$/.test(value)) return '密碼開頭與結尾不可為空格'
  return ''
}

async function register(): Promise<void> {
  errorMessage.value = validatePassword(password.value)
  if (errorMessage.value) return
  if (password.value !== confirmPassword.value) {
    errorMessage.value = '兩次輸入的密碼不一致'
    return
  }

  loading.value = true
  try {
    await registerApi({ account: account.value, password: password.value, name: name.value })
    await showSuccessAlert('註冊成功，請至信箱完成帳號驗證')
    await router.replace('/login')
  } catch (error: unknown) {
    errorMessage.value = resolveApiError(error)
  } finally {
    loading.value = false
  }
}
</script>
