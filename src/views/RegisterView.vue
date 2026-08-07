<template>
  <div class="min-h-screen bg-gray-100 px-4 py-6 sm:flex sm:items-center sm:justify-center">
    <div class="mx-auto w-full max-w-md rounded-xl bg-white p-6 shadow-lg sm:p-8">
      <div class="mb-6 flex flex-col items-center">
        <img src="/images/login-logo.png" alt="註冊" class="h-20 w-20 object-contain drop-shadow-sm" />

        <h1 class="mt-3 text-2xl font-bold text-gray-800">
          建立帳號
        </h1>

        <p class="mt-1 text-center text-sm text-gray-500">
          填寫資料後，我們會寄送驗證信給您
        </p>
      </div>

      <form class="space-y-4" @submit.prevent="register">
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">
            Username
          </label>

          <input v-model.trim="name" type="text" maxlength="30" autocomplete="username" placeholder="例如：player.one_01"
            class="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2" :class="nameInputClass" required
            @input="scheduleNameCheck" />

          <p v-if="nameStatus === 'checking'" class="mt-1 text-xs text-gray-500">
            檢查中...
          </p>

          <p v-else-if="nameStatus === 'available'" class="mt-1 text-xs text-green-600">
            ✔ 此帳號可以使用
          </p>

          <p v-else-if="nameStatus === 'unavailable'" class="mt-1 text-xs text-red-600">
            ✖ 此帳號已被使用
          </p>

          <p v-else-if="nameStatus === 'invalid'" class="mt-1 text-xs text-red-600">
            ✖ {{ nameValidationMessage }}
          </p>

          <p v-else class="mt-1 text-xs text-gray-500">
            {{ USERNAME_RULES_HINT }}
          </p>
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">
            Display Name（選填）
          </label>

          <input v-model.trim="displayName" type="text" maxlength="50" autocomplete="nickname" placeholder="請輸入顯示名稱"
            class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />

          <p class="mt-1 text-xs text-gray-500">
            若未填寫，將自動使用 Username
          </p>
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">
            Email
          </label>

          <input v-model.trim="email" type="email" autocomplete="email" placeholder="example@email.com"
            class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required />
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">
            密碼
          </label>

          <div class="relative">
            <input v-model="password" :type="showPassword ? 'text' : 'password'" autocomplete="new-password"
              placeholder="至少 8 碼，包含英文、數字及特殊符號"
              class="w-full rounded-lg border border-gray-300 px-4 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required />

            <button type="button"
              class="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-gray-500 hover:text-gray-700"
              :aria-label="showPassword ? '隱藏密碼' : '顯示密碼'" @click="showPassword = !showPassword">
              <FontAwesomeIcon :icon="showPassword ? 'eye-slash' : 'eye'" />
            </button>
          </div>
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">
            確認密碼
          </label>

          <input v-model="confirmPassword" :type="showPassword ? 'text' : 'password'" autocomplete="new-password"
            placeholder="請再次輸入密碼"
            class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required />
        </div>

        <p v-if="errorMessage" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {{ errorMessage }}
        </p>

        <button type="submit" :disabled="!canSubmit"
          class="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
          {{ loading ? '註冊中...' : '註冊' }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-gray-500">
        已經有帳號？

        <RouterLink to="/login" class="font-medium text-blue-600 hover:text-blue-700">
          返回登入
        </RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { checkNameAvailabilityApi, registerApi } from '@/api/loginApi'
import { resolveApiError } from '@/api/resolveApiError'
import { showSuccessAlert } from '@/utils/alerts'
import { USERNAME_RULES_HINT, normalizeUsername, validateUsername } from '@/utils/username'

type NameStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'unavailable'
  | 'invalid'

const router = useRouter()

const name = ref('')
const displayName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

const showPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')

const nameStatus = ref<NameStatus>('idle')
const nameValidationMessage = ref('')

let nameCheckTimer: ReturnType<typeof setTimeout> | null = null
let nameCheckRequestId = 0

const nameInputClass = computed(() => {
  switch (nameStatus.value) {
    case 'available':
      return 'border-green-500 focus:ring-green-200'

    case 'invalid':
    case 'unavailable':
      return 'border-red-500 focus:ring-red-200'

    case 'idle':
    case 'checking':
    default:
      return 'border-gray-300 focus:ring-blue-500'
  }
})

const canSubmit = computed(() => {
  return !loading.value && nameStatus.value === 'available'
})

function clearNameCheckTimer(): void {
  if (!nameCheckTimer) {
    return
  }

  clearTimeout(nameCheckTimer)
  nameCheckTimer = null
}

function scheduleNameCheck(): void {
  clearNameCheckTimer()

  errorMessage.value = ''
  nameValidationMessage.value = ''

  name.value = normalizeUsername(name.value)
  const value = name.value
  const validationMessage = validateUsername(value)

  if (!value) {
    nameStatus.value = 'idle'
    return
  }

  if (validationMessage) {
    nameStatus.value = 'invalid'
    nameValidationMessage.value = validationMessage
    return
  }

  nameStatus.value = 'checking'

  const currentRequestId = ++nameCheckRequestId

  nameCheckTimer = setTimeout(async () => {
    try {
      const available = await checkNameAvailabilityApi(value)

      if (
        currentRequestId !== nameCheckRequestId ||
        name.value.trim() !== value
      ) {
        return
      }

      nameStatus.value = available ? 'available' : 'unavailable'
    } catch (error: unknown) {
      if (
        currentRequestId !== nameCheckRequestId ||
        name.value.trim() !== value
      ) {
        return
      }

      nameStatus.value = 'idle'
      errorMessage.value = resolveApiError(error)
    } finally {
      if (currentRequestId === nameCheckRequestId) {
        nameCheckTimer = null
      }
    }
  }, 400)
}

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

async function register(): Promise<void> {
  errorMessage.value = ''

  const normalizedName = normalizeUsername(name.value)
  const normalizedDisplayName = displayName.value.trim()
  const normalizedEmail = email.value.trim()

  const nameError = validateUsername(normalizedName)

  if (nameError) {
    nameStatus.value = 'invalid'
    nameValidationMessage.value = nameError
    errorMessage.value = nameError
    return
  }

  if (nameStatus.value === 'checking') {
    errorMessage.value = 'Username 尚在檢查中，請稍候'
    return
  }

  if (nameStatus.value === 'unavailable') {
    errorMessage.value = '此 Username 已被使用'
    return
  }

  if (nameStatus.value !== 'available') {
    errorMessage.value = '請先確認 Username 可以使用'
    scheduleNameCheck()
    return
  }

  const passwordError = validatePassword(password.value)

  if (passwordError) {
    errorMessage.value = passwordError
    return
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = '兩次輸入的密碼不一致'
    return
  }

  loading.value = true

  try {
    await registerApi({
      name: normalizedName,
      displayName: normalizedDisplayName || undefined,
      email: normalizedEmail,
      password: password.value,
    })

    await showSuccessAlert('註冊成功，請至信箱完成帳號驗證')
    await router.replace('/login')
  } catch (error: unknown) {
    errorMessage.value = resolveApiError(error)
  } finally {
    loading.value = false
  }
}

onBeforeUnmount(() => {
  clearNameCheckTimer()
  nameCheckRequestId += 1
})
</script>