<template>
  <Teleport to="body">
    <Transition name="modal-fade" appear>
      <div
        v-if="activeAlert"
        class="fixed inset-0 z-[140] flex px-4 backdrop-blur-sm"
        :class="overlayClass"
        @click.self="handleBackdropClick"
      >
        <div class="w-full" :class="panelWrapperClass">
          <div
            class="modal-panel w-full overflow-hidden border shadow-2xl"
            :class="[panelClass, activeAlert.presentation === 'sheet' ? 'max-w-xl' : 'max-w-md']"
            role="alertdialog"
            :aria-labelledby="titleId"
            :aria-describedby="descriptionId"
            :aria-modal="true"
          >
            <div class="px-5 pt-5 sm:px-6">
              <div
                class="flex gap-4"
                :class="activeAlert.presentation === 'sheet' ? 'items-start' : 'items-start'"
              >
                <div
                  v-if="activeAlert.presentation !== 'sheet' || !activeAlert.showCancelButton"
                  class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg font-semibold"
                  :class="iconContainerClass"
                  aria-hidden="true"
                >
                  {{ iconText }}
                </div>

                <div class="min-w-0 flex-1">
                  <div
                    class="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium"
                    :class="badgeClass"
                  >
                    {{ badgeText }}
                  </div>

                  <h2
                    :id="titleId"
                    class="mt-3 text-lg font-semibold tracking-tight"
                    :class="preferences.isDark ? 'text-white' : 'text-slate-900'"
                  >
                    {{ activeAlert.title }}
                  </h2>

                  <p
                    :id="descriptionId"
                    class="mt-2 whitespace-pre-wrap text-sm leading-6"
                    :class="preferences.isDark ? 'text-slate-300' : 'text-slate-600'"
                  >
                    {{ activeAlert.text }}
                  </p>
                </div>
              </div>
            </div>

            <div
              class="mt-5 border-t px-5 py-4 sm:px-6"
              :class="preferences.isDark ? 'border-white/8' : 'border-slate-200'"
            >
              <div v-if="activeAlert.autoCloseMs" class="space-y-3">
                <div class="flex justify-end">
                  <button
                    type="button"
                    class="rounded-xl px-4 py-2 text-sm font-medium transition"
                    :class="ghostButtonClass"
                    @click="handleConfirm"
                  >
                    立即關閉
                  </button>
                </div>

                <div
                  class="h-1.5 overflow-hidden rounded-full"
                  :class="preferences.isDark ? 'bg-white/8' : 'bg-slate-100'"
                >
                  <div
                    class="h-full rounded-full transition-[width] duration-150"
                    :class="progressBarClass"
                    :style="{ width: `${progressPercent}%` }"
                  ></div>
                </div>
              </div>

              <div
                v-else
                class="flex"
                :class="
                  activeAlert.presentation === 'sheet'
                    ? 'flex-col-reverse gap-2'
                    : 'justify-end gap-2'
                "
              >
                <button
                  v-if="activeAlert.showCancelButton"
                  type="button"
                  class="rounded-2xl border px-4 py-3 text-sm font-medium transition"
                  :class="secondaryButtonClass"
                  @click="handleCancel"
                >
                  {{ activeAlert.cancelButtonText }}
                </button>

                <button
                  type="button"
                  class="rounded-2xl px-4 py-3 text-sm font-medium text-white transition"
                  :class="primaryButtonClass"
                  @click="handleConfirm"
                >
                  {{ activeAlert.confirmButtonText }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <TransitionGroup
      tag="div"
      enter-active-class="transition-all duration-250 ease-out"
      enter-from-class="translate-y-2 opacity-0 scale-[0.98]"
      enter-to-class="translate-y-0 opacity-100 scale-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="translate-y-0 opacity-100 scale-100"
      leave-to-class="translate-y-2 opacity-0 scale-[0.98]"
      class="pointer-events-none fixed inset-x-0 bottom-5 z-[150] flex flex-col items-center gap-3 px-4 sm:bottom-6"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="pointer-events-auto w-full max-w-md overflow-hidden rounded-2xl border shadow-2xl"
        :class="toastCardClass(toast.variant)"
      >
        <div class="flex items-start gap-3 px-4 py-3.5">
          <div
            class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-semibold"
            :class="toastIconClass(toast.variant)"
            aria-hidden="true"
          >
            {{ toastIcon(toast.variant) }}
          </div>

          <div class="min-w-0 flex-1">
            <div
              v-if="toast.title"
              class="text-sm font-semibold"
              :class="preferences.isDark ? 'text-white' : 'text-slate-900'"
            >
              {{ toast.title }}
            </div>
            <div
              class="text-sm leading-6"
              :class="preferences.isDark ? 'text-slate-200' : 'text-slate-700'"
            >
              {{ toast.text }}
            </div>
          </div>

          <button
            type="button"
            class="rounded-full p-1 transition"
            :class="
              preferences.isDark
                ? 'text-slate-400 hover:bg-white/8 hover:text-white'
                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
            "
            aria-label="關閉通知"
            @click="dismissToast(toast.id)"
          >
            ✕
          </button>
        </div>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

import {
  dismissActiveAlert,
  dismissToast,
  useAlertState,
  type ToastVariant,
} from '@/utils/alerts'
import { usePreferencesStore } from '@/stores/preferencesStore'

const preferences = usePreferencesStore()
const feedbackState = useAlertState()

const activeAlert = computed(() => feedbackState.current)
const toasts = computed(() => feedbackState.toasts)
const titleId = computed(() =>
  activeAlert.value ? `app-alert-title-${activeAlert.value.id}` : 'app-alert-title',
)
const descriptionId = computed(() =>
  activeAlert.value ? `app-alert-desc-${activeAlert.value.id}` : 'app-alert-desc',
)

const progressPercent = ref(100)
let autoCloseTimer: ReturnType<typeof setTimeout> | null = null
let progressTimer: ReturnType<typeof setInterval> | null = null
let progressStartedAt = 0

const overlayClass = computed(() => {
  const base = preferences.isDark ? 'bg-slate-950/72' : 'bg-slate-900/38'

  if (activeAlert.value?.presentation === 'sheet') {
    return `${base} items-end sm:items-center justify-center pb-3 sm:pb-0`
  }

  return `${base} items-center justify-center`
})

const panelWrapperClass = computed(() => {
  if (activeAlert.value?.presentation === 'sheet') {
    return 'mx-auto flex max-w-xl items-end sm:items-center justify-center'
  }

  return 'mx-auto flex max-w-md items-center justify-center'
})

const panelClass = computed(() => {
  const themeClass = preferences.isDark
    ? 'border-white/10 bg-slate-900/97 text-slate-100 shadow-black/45'
    : 'border-slate-200 bg-white/97 text-slate-900 shadow-slate-900/18'

  if (activeAlert.value?.presentation === 'sheet') {
    return `${themeClass} rounded-[28px] sm:rounded-3xl`
  }

  return `${themeClass} rounded-2xl`
})

const iconText = computed(() => {
  switch (activeAlert.value?.variant) {
    case 'success':
      return '✓'
    case 'error':
      return '!'
    case 'warning':
      return '!'
    case 'confirm':
      return activeAlert.value.tone === 'danger' ? '!' : '?'
    default:
      return '•'
  }
})

const badgeText = computed(() => {
  switch (activeAlert.value?.variant) {
    case 'success':
      return '操作完成'
    case 'error':
      return '需要注意'
    case 'warning':
      return '提醒'
    case 'confirm':
      return activeAlert.value.tone === 'danger' ? '危險操作' : '請確認'
    default:
      return ''
  }
})

const badgeClass = computed(() => {
  if (activeAlert.value?.tone === 'danger') {
    return preferences.isDark ? 'bg-rose-500/12 text-rose-300' : 'bg-rose-100 text-rose-700'
  }

  switch (activeAlert.value?.variant) {
    case 'success':
      return preferences.isDark ? 'bg-emerald-500/12 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
    case 'error':
      return preferences.isDark ? 'bg-rose-500/12 text-rose-300' : 'bg-rose-100 text-rose-700'
    case 'warning':
      return preferences.isDark ? 'bg-amber-500/12 text-amber-300' : 'bg-amber-100 text-amber-700'
    case 'confirm':
      return preferences.isDark ? 'bg-indigo-500/12 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
    default:
      return ''
  }
})

const iconContainerClass = computed(() => {
  if (activeAlert.value?.tone === 'danger') {
    return preferences.isDark ? 'bg-rose-500/14 text-rose-300' : 'bg-rose-100 text-rose-700'
  }

  switch (activeAlert.value?.variant) {
    case 'success':
      return preferences.isDark ? 'bg-emerald-500/14 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
    case 'error':
      return preferences.isDark ? 'bg-rose-500/14 text-rose-300' : 'bg-rose-100 text-rose-700'
    case 'warning':
      return preferences.isDark ? 'bg-amber-500/14 text-amber-300' : 'bg-amber-100 text-amber-700'
    case 'confirm':
      return preferences.isDark ? 'bg-indigo-500/14 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
    default:
      return ''
  }
})

const primaryButtonClass = computed(() => {
  if (activeAlert.value?.tone === 'danger') {
    return 'bg-rose-500 hover:bg-rose-400'
  }

  switch (activeAlert.value?.variant) {
    case 'error':
      return 'bg-rose-500 hover:bg-rose-400'
    case 'warning':
      return 'bg-amber-500 hover:bg-amber-400'
    default:
      return 'bg-indigo-500 hover:bg-indigo-400'
  }
})

const secondaryButtonClass = computed(() =>
  preferences.isDark
    ? 'border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06]'
    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
)

const ghostButtonClass = computed(() =>
  preferences.isDark
    ? 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
)

const progressBarClass = computed(() => {
  if (activeAlert.value?.tone === 'danger') {
    return 'bg-rose-500'
  }

  switch (activeAlert.value?.variant) {
    case 'success':
      return 'bg-emerald-500'
    case 'error':
      return 'bg-rose-500'
    case 'warning':
      return 'bg-amber-500'
    default:
      return 'bg-indigo-500'
  }
})

function clearAutoCloseTimers(): void {
  if (autoCloseTimer) {
    clearTimeout(autoCloseTimer)
    autoCloseTimer = null
  }

  if (progressTimer) {
    clearInterval(progressTimer)
    progressTimer = null
  }
}

function startAutoClose(durationMs: number): void {
  clearAutoCloseTimers()
  progressPercent.value = 100
  progressStartedAt = Date.now()

  autoCloseTimer = setTimeout(() => {
    handleConfirm()
  }, durationMs)

  progressTimer = setInterval(() => {
    const elapsedMs = Date.now() - progressStartedAt
    const nextPercent = Math.max(0, 100 - (elapsedMs / durationMs) * 100)
    progressPercent.value = nextPercent

    if (nextPercent <= 0) {
      clearAutoCloseTimers()
    }
  }, 100)
}

function handleConfirm(): void {
  dismissActiveAlert({
    isConfirmed: true,
    isDismissed: false,
  })
}

function handleCancel(): void {
  dismissActiveAlert({
    isConfirmed: false,
    isDismissed: true,
  })
}

function handleBackdropClick(): void {
  if (!activeAlert.value || activeAlert.value.autoCloseMs) {
    return
  }

  handleCancel()
}

function handleEscapeKey(event: KeyboardEvent): void {
  if (event.key !== 'Escape' || !activeAlert.value || activeAlert.value.autoCloseMs) {
    return
  }

  handleCancel()
}

function toastIcon(variant: ToastVariant): string {
  switch (variant) {
    case 'success':
      return '✓'
    case 'error':
      return '!'
    case 'warning':
      return '!'
    default:
      return 'i'
  }
}

function toastIconClass(variant: ToastVariant): string {
  switch (variant) {
    case 'success':
      return preferences.isDark ? 'bg-emerald-500/14 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
    case 'error':
      return preferences.isDark ? 'bg-rose-500/14 text-rose-300' : 'bg-rose-100 text-rose-700'
    case 'warning':
      return preferences.isDark ? 'bg-amber-500/14 text-amber-300' : 'bg-amber-100 text-amber-700'
    default:
      return preferences.isDark ? 'bg-indigo-500/14 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
  }
}

function toastCardClass(variant: ToastVariant): string {
  const themeClass = preferences.isDark
    ? 'border-white/10 bg-slate-900/96 text-slate-100 shadow-black/45'
    : 'border-slate-200 bg-white/96 text-slate-900 shadow-slate-900/18'
  const accentClass =
    variant === 'error'
      ? 'ring-1 ring-rose-500/20'
      : variant === 'warning'
        ? 'ring-1 ring-amber-500/20'
        : variant === 'success'
          ? 'ring-1 ring-emerald-500/20'
          : 'ring-1 ring-indigo-500/20'

  return `${themeClass} ${accentClass}`
}

watch(
  activeAlert,
  (nextAlert) => {
    clearAutoCloseTimers()

    if (nextAlert?.autoCloseMs) {
      startAutoClose(nextAlert.autoCloseMs)
    }
  },
  { immediate: true },
)

watch(
  activeAlert,
  (nextAlert) => {
    if (nextAlert) {
      window.addEventListener('keydown', handleEscapeKey)
      return
    }

    window.removeEventListener('keydown', handleEscapeKey)
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  clearAutoCloseTimers()
  window.removeEventListener('keydown', handleEscapeKey)
})
</script>
