<template>
  <div class="fixed inset-0 z-30 bg-black/40 flex items-center justify-center">
    <div class="bg-white rounded-lg shadow-lg w-96 p-4">
      <h2 class="font-semibold mb-3">建立群組聊天室</h2>

      <div class="space-y-3">
        <div>
          <label class="block text-sm text-gray-600 mb-1">群組名稱</label>
          <input v-model="roomName" type="text" class="w-full border rounded px-3 py-2 text-sm"
            placeholder="例如：OPTCG 交流群組" :disabled="props.loading" />
        </div>

        <div>
          <label class="block text-sm text-gray-600 mb-1">邀請信箱</label>
          <div
            class="min-h-24 max-h-48 overflow-y-auto w-full border rounded px-2 py-2 text-sm flex flex-wrap items-start gap-2 bg-white">
            <span v-for="email in emails" :key="email"
              class="inline-flex items-center max-w-full gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
              <span class="max-w-48 truncate">
                {{ email }}
              </span>
              <button type="button" class="text-gray-500 hover:text-red-600" :disabled="props.loading"
                @click="removeEmail(email)">
                ×
              </button>
            </span>
            <input v-model="emailInput" type="text" class="basis-full w-full px-1 py-1 outline-none disabled:bg-white"
              placeholder="輸入信箱..." :disabled="props.loading" @keydown="onEmailKeydown" @blur="addEmailFromInput" />
          </div>

          <p v-if="emailError" class="text-xs text-red-600 mt-1">
            {{ emailError }}
          </p>

          <p class="text-xs text-gray-400 mt-1">可用 Enter、Tab、逗號分隔多筆信箱</p>
        </div>
      </div>

      <div class="flex justify-end gap-2 mt-4">
        <button class="px-3 py-1 text-sm border rounded disabled:opacity-50" :disabled="props.loading"
          @click="emit('close')">
          取消
        </button>

        <button class="px-3 py-1 text-sm rounded bg-blue-600 text-white disabled:opacity-50"
          :disabled="!canCreate || props.loading" @click="handleCreate">
          {{ props.loading ? '建立中...' : '建立並寄送邀請' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  loading: boolean
}>()

const emit = defineEmits<{
  close: []
  create: [
    payload: {
      roomName: string
      emails: string[]
    },
  ]
}>()

const roomName = ref('')
const emailInput = ref('')
const emails = ref<string[]>([])
const emailError = ref('')

const canCreate = computed(() => {
  return roomName.value.trim().length > 0 && emails.value.length > 0
})

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function addEmailFromInput(): void {
  const value = emailInput.value.trim().replace(/,$/, '')

  if (!value) return

  if (!isValidEmail(value)) {
    emailError.value = '信箱格式不正確'
    return
  }

  if (emails.value.includes(value)) {
    emailError.value = '此信箱已加入'
    emailInput.value = ''
    return
  }

  emails.value.push(value)
  emailInput.value = ''
  emailError.value = ''
}

function removeEmail(email: string): void {
  emails.value = emails.value.filter((item) => item !== email)
}

function handleDelete(): void {
  if (emailInput.value) return

  emails.value.pop()
}

function onEmailKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter' || event.key === 'Tab' || event.key === ',' || event.key === ';') {
    event.preventDefault()
    addEmailFromInput()
    return
  }

  if (event.key === 'Backspace') {
    handleDelete()
  }
}

function handleCreate(): void {
  addEmailFromInput()

  if (!canCreate.value || props.loading) {
    return
  }

  emit('create', {
    roomName: roomName.value.trim(),
    emails: emails.value,
  })
}
</script>
