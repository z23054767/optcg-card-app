<template>
  <Transition name="modal-fade" appear>
    <div
      class="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm"
      :class="preferences.isDark ? 'bg-slate-950/70' : 'bg-slate-900/35'"
      @click.self="emit('close')"
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
              群組聊天
            </div>

            <h2
              class="text-lg font-semibold tracking-tight"
              :class="preferences.isDark ? 'text-white' : 'text-slate-900'"
            >
              建立群組聊天室
            </h2>

            <p
              class="mt-1 text-xs leading-5 sm:text-sm"
              :class="preferences.isDark ? 'text-slate-400' : 'text-slate-500'"
            >
              建立一個新的聊天空間，邀請朋友一起加入討論。
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
            @click="emit('close')"
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
              群組名稱
            </label>

            <input
              v-model="roomName"
              type="text"
              class="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2"
              :class="
                preferences.isDark
                  ? 'border-slate-700 bg-slate-950/70 text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:ring-indigo-500/25'
                  : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500/20'
              "
              placeholder="例如：OPTCG 交流群組"
              :disabled="props.loading"
            />

            <p
              class="mt-2 text-xs leading-5"
              :class="preferences.isDark ? 'text-slate-400' : 'text-slate-500'"
            >
              建議使用清楚好辨識的名稱，方便成員快速找到聊天室。
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
              建立前提醒
            </div>
            <ul
              class="mt-3 space-y-2 text-xs leading-5"
              :class="preferences.isDark ? 'text-slate-400' : 'text-slate-500'"
            >
              <li>• 建立完成後即可從聊天室上方邀請成員加入。</li>
              <li>• 群組名稱之後仍可再到群組管理中調整。</li>
            </ul>
          </div>

          <div class="flex justify-end gap-2 pt-1">
            <button
              class="rounded-xl border px-4 py-2 text-sm font-medium transition disabled:opacity-50"
              :class="
                preferences.isDark
                  ? 'border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06]'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              "
              :disabled="props.loading"
              @click="emit('close')"
            >
              取消
            </button>

            <button
              class="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:opacity-50"
              :disabled="!canCreate || props.loading"
              @click="handleCreate"
            >
              {{ props.loading ? '建立中...' : '建立聊天室' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePreferencesStore } from '@/stores/preferencesStore'

const props = defineProps<{
  loading: boolean
}>()

const emit = defineEmits<{
  close: []
  create: [
    payload: {
      roomName: string
    },
  ]
}>()

const preferences = usePreferencesStore()
const roomName = ref('')

const canCreate = computed(() => {
  return roomName.value.trim().length > 0
})

function handleCreate(): void {
  if (!canCreate.value || props.loading) {
    return
  }

  emit('create', {
    roomName: roomName.value.trim(),
  })
}
</script>
