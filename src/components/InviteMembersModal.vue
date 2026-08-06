<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" @click.self="$emit('close')">
    <div class="w-full max-w-md rounded-lg bg-white p-4 shadow-lg">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-base font-semibold text-gray-800">
          邀請成員
        </h2>

        <button type="button"
          class="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          aria-label="關閉" @click="$emit('close')">
          ✕
        </button>
      </div>

      <div class="space-y-3">
        <div>
          <label class="mb-1 block text-sm text-gray-600">
            使用者名稱
          </label>

          <div
            class="flex min-h-24 max-h-48 w-full flex-wrap items-start gap-2 overflow-y-auto rounded border bg-white px-2 py-2 text-sm"
            :class="{ 'border-red-400': usernameError }">
            <span v-for="entry in users" :key="entry.name"
              class="inline-flex max-w-full items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
              <span class="max-w-48 truncate">
                {{ entry.displayName || entry.name }}
              </span>

              <span class="max-w-32 truncate text-slate-400">
                @{{ entry.name }}
              </span>

              <button type="button"
                class="ml-0.5 text-gray-500 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="loading" :aria-label="`移除 ${entry.displayName || entry.name}`"
                @click="removeUser(entry.name)">
                ×
              </button>
            </span>

            <div class="inline-flex basis-full items-center gap-1">
              <input v-model="usernameInput" type="text" class="flex-1 px-1 py-1 text-sm outline-none disabled:bg-white"
                placeholder="輸入 @使用者名稱後按 Enter" autocomplete="off" spellcheck="false" maxlength="31"
                :disabled="loading || validating" @keydown="onUsernameKeydown" @blur="() => void addUserFromInput()" />

              <span v-if="validating" class="shrink-0 text-xs text-gray-400">
                查詢中…
              </span>
            </div>
          </div>

          <p v-if="usernameError" class="mt-1 text-xs" :class="usernameError === '查無此人' ||
              usernameError === '已是成員' ||
              usernameError === '已加入清單'
              ? 'text-amber-600'
              : 'text-red-600'
            ">
            {{
              usernameError === '查無此人'
                ? '⚠ 查無此使用者，請確認使用者名稱是否正確'
                : usernameError === '已是成員'
                  ? '此使用者已是群組成員'
                  : usernameError === '已加入清單'
                    ? '此使用者已加入邀請清單'
                    : usernameError
            }}
          </p>

          <p v-else class="mt-1 text-xs text-gray-400">
            請以 @ 開頭，可使用 Enter、Tab、逗號或分號加入多位使用者。
          </p>
        </div>
      </div>

      <div class="mt-4 flex justify-end gap-2">
        <button type="button" class="rounded border px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="loading" @click="$emit('close')">
          取消
        </button>

        <button type="button"
          class="rounded bg-indigo-600 px-3 py-1 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="users.length === 0 || loading || validating" @click="handleInvite">
          {{ loading ? '邀請中...' : '送出邀請' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { searchUserByNameApi } from '@/api/chatApi'

interface InviteUserEntry {
  /** 唯一使用者名稱 */
  name: string

  /** 顯示名稱 */
  displayName: string
}

const props = defineProps<{
  loading: boolean
  roomId: string
}>()

const emit = defineEmits<{
  close: []
  invite: [payload: { names: string[] }]
}>()

const usernameInput = ref('')
const users = ref<InviteUserEntry[]>([])
const usernameError = ref('')
const validating = ref(false)

function normalizeUsernameInput(value: string): string {
  return value.trim().replace(/[,;]$/, '')
}

function validateUsernameInput(value: string): string {
  if (!value) {
    return ''
  }

  if (!value.startsWith('@')) {
    return '請輸入 @使用者名稱'
  }

  const name = value.slice(1)

  if (!name) {
    return '請在 @ 後輸入使用者名稱'
  }

  if (!/^[a-zA-Z0-9_]+$/.test(name)) {
    return '使用者名稱僅能包含英文字母、數字與底線（_）'
  }

  if (name.length < 3) {
    return '使用者名稱長度至少需要 3 碼'
  }

  if (name.length > 30) {
    return '使用者名稱長度不可超過 30 碼'
  }

  return ''
}

async function addUserFromInput(): Promise<void> {
  const value = normalizeUsernameInput(usernameInput.value)

  if (!value) {
    return
  }

  const validationMessage = validateUsernameInput(value)

  if (validationMessage) {
    usernameError.value = validationMessage
    return
  }

  const name = value.slice(1)

  if (
    users.value.some(
      (entry) => entry.name.toLowerCase() === name.toLowerCase(),
    )
  ) {
    usernameError.value = '已加入清單'
    usernameInput.value = ''
    return
  }

  if (validating.value) {
    return
  }

  validating.value = true
  usernameError.value = ''

  try {
    const result = await searchUserByNameApi(name, props.roomId)

    if (!result.found) {
      usernameError.value = '查無此人'
      return
    }

    if (result.isMember) {
      usernameError.value = '已是成員'
      return
    }

    users.value.push({
      name: result.name,
      displayName: result.displayName || result.name,
    })

    usernameInput.value = ''
    usernameError.value = ''
  } catch {
    usernameError.value = '查詢使用者失敗，請稍後再試'
  } finally {
    validating.value = false
  }
}

function removeUser(name: string): void {
  users.value = users.value.filter((entry) => entry.name !== name)
}

function handleDelete(): void {
  if (usernameInput.value) {
    return
  }

  users.value.pop()
}

function onUsernameKeydown(event: KeyboardEvent): void {
  switch (event.key) {
    case 'Enter':
    case 'Tab':
    case ',':
    case ';':
      event.preventDefault()
      void addUserFromInput()
      break

    case 'Backspace':
      handleDelete()
      break

    default:
      break
  }
}

async function handleInvite(): Promise<void> {
  if (usernameInput.value.trim()) {
    await addUserFromInput()
  }

  if (users.value.length === 0) {
    return
  }

  emit('invite', {
    names: users.value.map((entry) => entry.name),
  })
}
</script>