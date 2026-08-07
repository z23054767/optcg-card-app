<template>
  <Transition name="modal-fade" appear>
    <div
      class="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm"
      :class="preferences.isDark ? 'bg-slate-950/70' : 'bg-slate-900/35'"
      @click.self="$emit('close')"
    >
      <div
        class="modal-panel w-full max-w-xl overflow-hidden rounded-2xl border shadow-2xl"
        :class="
          preferences.isDark
            ? 'border-white/10 bg-slate-900/95 text-slate-100 shadow-black/40'
            : 'border-slate-200 bg-white/96 text-slate-900 shadow-slate-900/15'
        "
      >
      <div
        class="relative border-b px-5 py-4 sm:px-6"
        :class="preferences.isDark ? 'border-white/8' : 'border-slate-200'"
      >
        <div class="pr-10">
          <div
            class="mb-2 inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-medium"
            :class="
              preferences.isDark
                ? 'bg-indigo-500/12 text-indigo-300'
                : 'bg-indigo-100 text-indigo-700'
            "
          >
            <span class="text-xs">✦</span>
            群組管理
          </div>

          <h2
            class="text-lg font-semibold tracking-tight"
            :class="preferences.isDark ? 'text-white' : 'text-slate-900'"
          >
            邀請成員
          </h2>

          <p
            class="mt-1 text-xs leading-5 sm:text-sm"
            :class="preferences.isDark ? 'text-slate-400' : 'text-slate-500'"
          >
            輸入使用者名稱，快速將多位成員加入目前聊天室。
          </p>
        </div>

        <button
          type="button"
          class="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full transition"
          :class="
            preferences.isDark
              ? 'text-slate-400 hover:bg-white/8 hover:text-white'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
          "
          aria-label="關閉"
          @click="$emit('close')"
        >
          ✕
        </button>
      </div>

        <div class="space-y-4 px-5 py-5 sm:px-6">
        <div>
          <label
            class="mb-2 block text-xs font-medium tracking-wide"
            :class="preferences.isDark ? 'text-slate-300' : 'text-slate-700'"
          >
            使用者名稱
          </label>

          <div
            class="flex min-h-28 max-h-52 w-full flex-wrap items-start gap-2 overflow-y-auto rounded-2xl border px-3 py-3 text-sm"
            :class="[
              usernameError
                ? preferences.isDark
                  ? 'border-red-400/80 bg-red-500/6'
                  : 'border-red-300 bg-red-50/60'
                : preferences.isDark
                  ? 'border-slate-700 bg-slate-950/70'
                  : 'border-slate-300 bg-white',
            ]"
          >
            <span
              v-for="entry in users"
              :key="entry.name"
              class="inline-flex max-w-full items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs"
              :class="
                preferences.isDark
                  ? 'bg-white/8 text-slate-200'
                  : 'bg-slate-100 text-slate-700'
              "
            >
              <span class="max-w-48 truncate">
                {{ entry.displayName || entry.name }}
              </span>

              <span :class="preferences.isDark ? 'text-slate-400' : 'text-slate-400'">
                @{{ entry.name }}
              </span>

              <button
                type="button"
                class="ml-0.5 transition disabled:cursor-not-allowed disabled:opacity-50"
                :class="
                  preferences.isDark
                    ? 'text-slate-400 hover:text-red-300'
                    : 'text-slate-500 hover:text-red-600'
                "
                :disabled="loading"
                :aria-label="`移除 ${entry.displayName || entry.name}`"
                @click="removeUser(entry.name)"
              >
                ×
              </button>
            </span>

            <div class="inline-flex basis-full items-center gap-2">
              <input
                v-model="usernameInput"
                type="text"
                class="min-w-0 flex-1 bg-transparent px-1 py-1.5 text-sm outline-none"
                :class="
                  preferences.isDark
                    ? 'text-slate-100 placeholder:text-slate-500 disabled:text-slate-500'
                    : 'text-slate-900 placeholder:text-slate-400 disabled:text-slate-400'
                "
                placeholder="輸入 @使用者名稱後按 Enter"
                autocomplete="off"
                spellcheck="false"
                maxlength="31"
                :disabled="loading || validating"
                @keydown="onUsernameKeydown"
                @blur="() => void addUserFromInput()"
              />

              <span v-if="validating" class="shrink-0 text-xs" :class="preferences.isDark ? 'text-slate-400' : 'text-slate-500'">
                查詢中…
              </span>
            </div>
          </div>

          <p
            v-if="usernameError"
            class="mt-2 text-xs leading-5"
            :class="
              usernameError === '查無此人' ||
              usernameError === '已是成員' ||
              usernameError === '已加入清單'
                ? preferences.isDark
                  ? 'text-amber-300'
                  : 'text-amber-700'
                : preferences.isDark
                  ? 'text-red-400'
                  : 'text-red-600'
            "
          >
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

          <p
            v-else
            class="mt-2 text-xs leading-5"
            :class="preferences.isDark ? 'text-slate-400' : 'text-slate-500'"
          >
            請以 @ 開頭，可使用 Enter、Tab、逗號或分號加入多位使用者。
          </p>
        </div>

        <div
          class="rounded-2xl border p-4"
          :class="
            preferences.isDark
              ? 'border-white/8 bg-slate-950/45'
              : 'border-slate-200 bg-slate-50'
          "
        >
          <div
            class="text-sm font-medium"
            :class="preferences.isDark ? 'text-slate-200' : 'text-slate-800'"
          >
            邀請前提醒
          </div>
          <ul
            class="mt-3 space-y-2 text-xs leading-5"
            :class="preferences.isDark ? 'text-slate-400' : 'text-slate-500'"
          >
            <li>• 加入清單後可一次送出多位成員邀請。</li>
            <li>• 已是成員或重複加入的人員會即時提示。</li>
          </ul>
        </div>

        <div class="flex justify-end gap-2 pt-1">
          <button
            type="button"
            class="rounded-xl border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
            :class="
              preferences.isDark
                ? 'border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06]'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            "
            :disabled="loading"
            @click="$emit('close')"
          >
            取消
          </button>

          <button
            type="button"
            class="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="users.length === 0 || loading || validating"
            @click="handleInvite"
          >
            {{ loading ? '邀請中...' : '送出邀請' }}
          </button>
        </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { searchUserByNameApi } from '@/api/chatApi'
import { usePreferencesStore } from '@/stores/preferencesStore'

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

const preferences = usePreferencesStore()
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