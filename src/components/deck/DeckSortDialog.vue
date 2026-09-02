<template>
  <div class="fixed inset-0 z-60 flex items-end justify-center bg-slate-950/70 p-3 sm:items-center sm:p-4" role="dialog"
    aria-modal="true" aria-labelledby="deck-sort-title" @click.self="emit('close')">
    <div class="w-full max-w-lg overflow-hidden rounded-3xl border shadow-2xl" :class="panelClass">
      <header class="border-b px-5 py-5 text-center" :class="borderClass">
        <h2 id="deck-sort-title" class="text-xl font-bold" :class="titleClass">變更卡片排序</h2>
        <p class="mt-1 text-xs" :class="mutedTextClass">依點選順序累加條件，先選的優先排序</p>
      </header>

      <div class="max-h-[70vh] space-y-4 overflow-y-auto p-4 sm:p-5">
        <div v-if="selectedOptions.length" class="rounded-xl border p-3" :class="priorityPanelClass">
          <p class="mb-2 text-xs font-bold" :class="titleClass">排序優先順序</p>
          <div class="flex flex-wrap gap-2">
            <span v-for="(option, index) in selectedOptions" :key="option"
              class="inline-flex items-center gap-1.5 rounded-full bg-rose-500 px-2.5 py-1 text-[11px] font-bold text-white">
              <span class="flex h-4 w-4 items-center justify-center rounded-full bg-white/20">{{
                index + 1
                }}</span>
              {{ optionLabel(option) }}
            </span>
          </div>
        </div>

        <section v-for="group in DECK_SORT_GROUPS" :key="group.label">
          <h3 class="mb-2 text-xs font-bold uppercase tracking-wider" :class="mutedTextClass">
            {{ group.label }}
          </h3>
          <div class="grid grid-cols-2 gap-2">
            <button v-for="choice in group.choices" :key="choice.value" type="button"
              class="relative rounded-xl border p-3 text-left transition hover:-translate-y-0.5 hover:border-rose-500 hover:shadow-md"
              :class="choiceClass(choice.value)" @click="selectChoice(choice.value)">
              <span v-if="selectedPriority(choice.value)"
                class="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-extrabold text-white">
                {{ selectedPriority(choice.value) }}
              </span>
              <span class="block text-sm font-bold" :class="titleClass">{{ choice.label }}</span>
              <span class="mt-1 block text-[11px]" :class="mutedTextClass">{{
                choice.description
                }}</span>
            </button>
          </div>
        </section>
      </div>

      <footer class="grid grid-cols-2 gap-2 border-t p-4" :class="borderClass">
        <button type="button"
          class="rounded-full px-5 py-3.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40"
          :class="cancelButtonClass" :disabled="selectedOptions.length === 0" @click="selectedOptions = []">
          清除條件
        </button>
        <button type="button"
          class="rounded-full bg-rose-500 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="selectedOptions.length === 0" @click="applySort">
          套用排序
        </button>
        <button type="button" class="col-span-2 w-full rounded-full px-5 py-3.5 text-sm font-bold transition"
          :class="cancelButtonClass" @click="emit('close')">
          取消
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import { usePreferencesStore } from '@/stores/preferencesStore'
import { DECK_SORT_GROUPS, type DeckSortOption } from '@/utils/deckSort'

const emit = defineEmits<{
  close: []
  select: [options: DeckSortOption[]]
}>()

const preferences = usePreferencesStore()
const selectedOptions = ref<DeckSortOption[]>([])
const titleClass = computed(() => (preferences.isDark ? 'text-slate-100' : 'text-slate-900'))
const mutedTextClass = computed(() => (preferences.isDark ? 'text-slate-400' : 'text-slate-500'))
const panelClass = computed(() =>
  preferences.isDark ? 'border-white/10 bg-slate-900' : 'border-slate-200 bg-white',
)
const borderClass = computed(() => (preferences.isDark ? 'border-white/10' : 'border-slate-200'))
const priorityPanelClass = computed(() =>
  preferences.isDark ? 'border-white/10 bg-slate-950/50' : 'border-rose-100 bg-rose-50/60',
)
const cancelButtonClass = computed(() =>
  preferences.isDark
    ? 'bg-slate-800 text-slate-100 hover:bg-slate-700'
    : 'bg-slate-100 text-slate-800 hover:bg-slate-200',
)

function criterion(option: DeckSortOption): string {
  return option.split('-')[0] ?? option
}

function selectedPriority(option: DeckSortOption): number | null {
  const index = selectedOptions.value.findIndex(
    (selected) => criterion(selected) === criterion(option),
  )
  return index < 0 ? null : index + 1
}

function choiceClass(option: DeckSortOption): string {
  const isSelected = selectedOptions.value.includes(option)
  if (isSelected) {
    return preferences.isDark
      ? 'border-rose-400 bg-rose-500/10 ring-2 ring-rose-400/50'
      : 'border-rose-500 bg-rose-50 ring-2 ring-rose-200'
  }
  return preferences.isDark
    ? 'border-white/10 bg-slate-950/60 hover:bg-white/5'
    : 'border-slate-200 bg-slate-50 hover:bg-rose-50'
}

function selectChoice(option: DeckSortOption): void {
  const index = selectedOptions.value.findIndex(
    (selected) => criterion(selected) === criterion(option),
  )
  if (index < 0) {
    selectedOptions.value.push(option)
  } else if (selectedOptions.value[index] === option) {
    selectedOptions.value.splice(index, 1)
  } else {
    selectedOptions.value.splice(index, 1, option)
  }
}

function optionLabel(option: DeckSortOption): string {
  for (const group of DECK_SORT_GROUPS) {
    const choice = group.choices.find(({ value }) => value === option)
    if (choice) return `${group.label.replace('排序', '')}・${choice.label}`
  }
  return option
}

function applySort(): void {
  if (!selectedOptions.value.length) return
  emit('select', [...selectedOptions.value])
}

function handleEscape(event: KeyboardEvent): void {
  if (event.key === 'Escape') emit('close')
}

onMounted(() => window.addEventListener('keydown', handleEscape))
onBeforeUnmount(() => window.removeEventListener('keydown', handleEscape))
</script>
