<template>
  <Transition name="modal-fade" appear>
    <div
      class="fixed inset-0 z-60 flex items-center justify-center px-4 py-6 backdrop-blur-sm"
      :class="preferences.isDark ? 'bg-slate-950/70' : 'bg-slate-900/35'"
      @click.self="$emit('close')"
    >
      <div
        class="modal-panel flex max-h-[88vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border shadow-2xl"
        :class="
          preferences.isDark
            ? 'border-white/10 bg-slate-900/95 text-slate-100 shadow-black/40'
            : 'border-slate-200 bg-white/96 text-slate-900 shadow-slate-900/15'
        "
      >
        <div
          class="relative shrink-0 border-b px-6 py-4"
          :class="preferences.isDark ? 'border-white/8' : 'border-slate-200'"
        >
          <div class="pr-10">
            <div
              class="mb-2 inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-medium"
              :class="
                preferences.isDark
                  ? 'bg-violet-500/12 text-violet-300'
                  : 'bg-violet-100 text-violet-700'
              "
            >
              <span class="text-xs">✦</span>
              系統偏好
            </div>
            <h2
              class="text-lg font-semibold tracking-tight"
              :class="preferences.isDark ? 'text-white' : 'text-slate-900'"
            >
              偏好設定
            </h2>
            <p
              class="mt-1 text-sm"
              :class="preferences.isDark ? 'text-slate-400' : 'text-slate-500'"
            >
              管理你的介面外觀與使用體驗
            </p>
          </div>

          <button
            type="button"
            class="absolute top-4 right-4 rounded-full p-2 text-xl transition"
            :class="
              preferences.isDark
                ? 'text-slate-400 hover:bg-white/8 hover:text-white'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
            "
            @click="$emit('close')"
          >
            ✕
          </button>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <section
            class="rounded-2xl border p-4"
            :class="
              preferences.isDark ? 'border-white/8 bg-slate-950/45' : 'border-slate-200 bg-slate-50'
            "
          >
            <div class="flex items-start gap-3">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-full text-xl"
                :class="
                  preferences.isDark
                    ? 'bg-indigo-500/12 text-indigo-300'
                    : 'bg-indigo-100 text-indigo-700'
                "
              >
                🌗
              </div>
              <div>
                <h3
                  class="text-base font-semibold"
                  :class="preferences.isDark ? 'text-slate-100' : 'text-slate-800'"
                >
                  外觀主題
                </h3>
                <p
                  class="mt-1 text-sm"
                  :class="preferences.isDark ? 'text-slate-400' : 'text-slate-500'"
                >
                  切換明亮與暗黑模式，讓聊天室在不同時間段都更舒適。
                </p>
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
                    ? preferences.isDark
                      ? 'border-indigo-400 bg-indigo-500/12 shadow-sm'
                      : 'border-indigo-500 bg-indigo-50 shadow-sm'
                    : preferences.isDark
                      ? 'border-white/10 bg-white/3 hover:border-indigo-400/30 hover:bg-indigo-500/6'
                      : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50',
                ]"
                @click="preferences.setThemeMode(option.value)"
              >
                <div
                  class="flex items-center gap-2 text-sm font-semibold"
                  :class="preferences.isDark ? 'text-slate-100' : 'text-slate-800'"
                >
                  <span>{{ option.icon }}</span>
                  <span>{{ option.label }}</span>
                </div>
                <p
                  class="mt-1 text-sm"
                  :class="preferences.isDark ? 'text-slate-400' : 'text-slate-500'"
                >
                  {{ option.description }}
                </p>
              </button>
            </div>
          </section>

          <section
            class="mt-4 rounded-2xl border p-4"
            :class="
              preferences.isDark ? 'border-white/8 bg-slate-950/45' : 'border-slate-200 bg-white'
            "
          >
            <h3
              class="text-base font-semibold"
              :class="preferences.isDark ? 'text-slate-100' : 'text-slate-800'"
            >
              目前設定
            </h3>
            <ul
              class="mt-3 space-y-2 text-sm"
              :class="preferences.isDark ? 'text-slate-300' : 'text-slate-600'"
            >
              <li>• 主題模式：{{ currentThemeLabel }}</li>
              <li>• 喜歡的偏好會自動保存到這台裝置，重新開啟應用時會直接套用。</li>
            </ul>
          </section>
        </div>

        <div
          class="flex shrink-0 justify-end border-t px-5 py-4 sm:px-6"
          :class="
            preferences.isDark ? 'border-white/8 bg-slate-900/95' : 'border-slate-200 bg-white/96'
          "
        >
          <button
            type="button"
            class="rounded-xl border px-4 py-2 text-sm font-medium transition"
            :class="
              preferences.isDark
                ? 'border-white/10 bg-white/3 text-slate-200 hover:bg-white/6'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            "
            @click="$emit('close')"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { usePreferencesStore } from '@/stores/preferencesStore'
import type { ThemeMode } from '@/stores/preferencesStore'

const preferences = usePreferencesStore()

defineEmits<{
  close: []
}>()

const themeOptions: Array<{ value: ThemeMode; label: string; description: string; icon: string }> =
  [
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
