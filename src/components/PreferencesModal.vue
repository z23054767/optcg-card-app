<template>
  <div
    class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 py-6"
    @click.self="$emit('close')"
  >
    <div class="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
      <div class="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4">
        <div>
          <h2 class="text-lg font-semibold text-gray-800">偏好設定</h2>
          <p class="mt-1 text-sm text-gray-500">管理你的介面外觀與使用體驗</p>
        </div>

        <button
          type="button"
          class="rounded-lg p-2 text-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          @click="$emit('close')"
        >
          ✕
        </button>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <section class="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <div class="flex items-start gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-xl">
              🌗
            </div>
            <div>
              <h3 class="text-base font-semibold text-gray-800">外觀主題</h3>
              <p class="mt-1 text-sm text-gray-500">切換明亮與暗黑模式，讓聊天室在不同時間段都更舒適。</p>
            </div>
          </div>

          <div class="mt-4 grid gap-3 md:grid-cols-3">
            <button
              v-for="option in themeOptions"
              :key="option.value"
              type="button"
              class="rounded-xl border px-4 py-3 text-left transition"
              :class="[
                preferences.themeMode === option.value
                  ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-gray-50',
              ]"
              @click="preferences.setThemeMode(option.value)"
            >
              <div class="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <span>{{ option.icon }}</span>
                <span>{{ option.label }}</span>
              </div>
              <p class="mt-1 text-sm text-gray-500">{{ option.description }}</p>
            </button>
          </div>
        </section>

        <section class="mt-4 rounded-2xl border border-gray-200 p-4">
          <h3 class="text-base font-semibold text-gray-800">目前設定</h3>
          <ul class="mt-3 space-y-2 text-sm text-gray-600">
            <li>• 主題模式：{{ currentThemeLabel }}</li>
            <li>• 喜歡的偏好會自動保存到這台裝置，重新開啟應用時會直接套用。</li>
          </ul>
        </section>
      </div>

      <div class="flex shrink-0 justify-end border-t border-gray-200 bg-white px-6 py-4">
        <button
          type="button"
          class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          @click="$emit('close')"
        >
          關閉
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { usePreferencesStore } from '@/stores/preferencesStore'
import type { ThemeMode } from '@/stores/preferencesStore'

const preferences = usePreferencesStore()

defineEmits<{
  close: []
}>()

const themeOptions: Array<{ value: ThemeMode; label: string; description: string; icon: string }> = [
  {
    value: 'system',
    label: '跟隨系統',
    description: '依照裝置的明暗設定自動切換',
    icon: '🖥️',
  },
  {
    value: 'light',
    label: '淺色模式',
    description: '保持明亮、清爽的介面',
    icon: '☀️',
  },
  {
    value: 'dark',
    label: '深色模式',
    description: '使用夜間模式，減少光線刺激',
    icon: '🌙',
  },
]

const currentThemeLabel = computed(() => {
  const match = themeOptions.find((option) => option.value === preferences.themeMode)
  return match?.label ?? '跟隨系統'
})
</script>
