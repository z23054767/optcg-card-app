<template>
  <div class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
    <div class="bg-white rounded-lg shadow-lg w-full max-w-md p-4">
      <h2 class="font-semibold mb-3">邀請成員</h2>

      <div class="space-y-3">
        <div>
          <label class="block text-sm text-gray-600 mb-1">邀請信箱</label>
          <div
            class="min-h-24 max-h-48 overflow-y-auto w-full border rounded px-2 py-2 text-sm flex flex-wrap items-start gap-2 bg-white"
            :class="{ 'border-red-400': emailError }"
          >
            <span
              v-for="entry in emails"
              :key="entry.email"
              class="inline-flex items-center max-w-full gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700"
            >
              <span class="max-w-48 truncate">{{ entry.name }}</span>
              <span class="text-slate-400 truncate max-w-32">{{ entry.email }}</span>
              <button
                type="button"
                class="text-gray-500 hover:text-red-600 ml-0.5"
                :disabled="loading"
                @click="removeEmail(entry.email)"
              >
                ×
              </button>
            </span>

            <div class="inline-flex items-center gap-1 basis-full">
              <input
                v-model="emailInput"
                type="text"
                class="flex-1 px-1 py-1 outline-none disabled:bg-white text-sm"
                placeholder="輸入信箱後按 Enter 確認..."
                :disabled="loading || validating"
                @keydown="onEmailKeydown"
                @blur="() => void addEmailFromInput()"
              />
              <span v-if="validating" class="text-xs text-gray-400 shrink-0">查詢中…</span>
            </div>
          </div>

          <p v-if="emailError" class="text-xs mt-1" :class="emailError === '查無此人' ? 'text-amber-600' : 'text-red-600'">
            {{ emailError === '查無此人' ? '⚠ 查無此帳號，請確認信箱是否正確' : emailError }}
          </p>

          <p v-else class="text-xs text-gray-400 mt-1">可用 Enter、Tab、逗號分隔多筆信箱</p>
        </div>
      </div>

      <div class="flex justify-end gap-2 mt-4">
        <button
          class="px-3 py-1 text-sm border rounded disabled:opacity-50"
          :disabled="loading"
          @click="$emit('close')"
        >
          取消
        </button>

        <button
          class="px-3 py-1 text-sm rounded bg-indigo-600 text-white disabled:opacity-50"
          :disabled="emails.length === 0 || loading || validating"
          @click="handleInvite"
        >
          {{ loading ? '邀請中...' : '送出邀請' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { searchUserByEmailApi } from '@/api/chatApi'

interface EmailEntry {
  email: string
  name: string
}

defineProps<{
  loading: boolean
}>()

const emit = defineEmits<{
  close: []
  invite: [payload: { emails: string[] }]
}>()

const emailInput = ref('')
const emails = ref<EmailEntry[]>([])
const emailError = ref('')
const validating = ref(false)

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

async function addEmailFromInput(): Promise<void> {
  const value = emailInput.value.trim().replace(/[,;]$/, '')

  if (!value) return

  if (!isValidEmail(value)) {
    emailError.value = '信箱格式不正確'
    return
  }

  if (emails.value.some((e) => e.email === value)) {
    emailError.value = '此信箱已加入'
    emailInput.value = ''
    return
  }

  if (validating.value) return

  validating.value = true
  emailError.value = ''

  try {
    const result = await searchUserByEmailApi(value)

    if (!result.found) {
      emailError.value = '查無此人'
      return
    }

    emails.value.push({ email: value, name: result.name })
    emailInput.value = ''
    emailError.value = ''
  } finally {
    validating.value = false
  }
}

function removeEmail(email: string): void {
  emails.value = emails.value.filter((e) => e.email !== email)
}

function handleDelete(): void {
  if (emailInput.value) return
  emails.value.pop()
}

function onEmailKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter' || event.key === 'Tab' || event.key === ',' || event.key === ';') {
    event.preventDefault()
    void addEmailFromInput()
    return
  }

  if (event.key === 'Backspace') {
    handleDelete()
  }
}

function handleInvite(): void {
  void addEmailFromInput().then(() => {
    if (emails.value.length === 0) return

    emit('invite', {
      emails: emails.value.map((e) => e.email),
    })
  })
}
</script>
