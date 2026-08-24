<template>
  <div class="min-h-screen transition-colors duration-200" :class="pageClass">
    <AppHeader />

    <main class="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8">
      <section class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div class="min-w-0 space-y-4">
          <article class="rounded-2xl border" :class="panelClass">
            <div class="border-b p-4 sm:p-5" :class="sectionBorderClass">
              <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div class="min-w-0">
                  <div
                    class="inline-flex items-center gap-2 rounded-lg px-2.5 py-1 text-xs font-semibold"
                    :class="statusBadgeClass"
                  >
                    <span aria-hidden="true">🛠️</span>
                    功能建置中
                  </div>
                  <h2 class="mt-3 text-xl font-semibold tracking-tight sm:text-2xl" :class="titleClass">
                    我的牌組
                  </h2>
                  <p class="mt-2 max-w-3xl text-sm leading-6" :class="textClass">
                    {{ PRODUCT_COPY.deckSpaceSummary }}
                  </p>
                </div>

                <div class="flex shrink-0 flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    disabled
                    class="inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold text-white opacity-60 shadow-sm"
                    :class="primaryButtonClass"
                  >
                    ＋ 建立牌組
                  </button>
                  <RouterLink
                    to="/chat"
                    class="inline-flex h-10 items-center justify-center rounded-lg border px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:hidden"
                    :class="secondaryButtonClass"
                  >
                    前往聊天
                  </RouterLink>
                </div>
              </div>
            </div>

            <div class="p-4 sm:p-5">
              <div class="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 class="text-sm font-semibold" :class="titleClass">我的牌組</h3>
                  <p class="mt-0.5 text-xs" :class="mutedTextClass">之後建立的牌組會集中顯示在這裡。</p>
                </div>
                <span class="rounded-md px-2 py-1 text-xs font-medium" :class="countBadgeClass">0 副牌組</span>
              </div>

              <div class="rounded-xl border border-dashed px-4 py-10 text-center sm:py-14" :class="emptyStateClass">
                <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-xl text-2xl" :class="emptyIconClass">🃏</div>
                <div class="mt-4 text-sm font-semibold" :class="titleClass">還沒有牌組</div>
                <p class="mx-auto mt-1 max-w-md text-xs leading-6" :class="mutedTextClass">
                  牌組建立器完成後，你可以在這裡建立、整理與分享自己的牌組。
                </p>
              </div>
            </div>
          </article>

          <section class="grid gap-3 md:grid-cols-3">
            <article v-for="item in studioHighlights" :key="item.title" class="rounded-xl border p-4" :class="infoCardClass">
              <div class="flex h-9 w-9 items-center justify-center rounded-lg text-lg" :class="infoIconClass">{{ item.icon }}</div>
              <h3 class="mt-3 text-sm font-semibold" :class="titleClass">{{ item.title }}</h3>
              <p class="mt-1 text-xs leading-6" :class="mutedTextClass">{{ item.description }}</p>
            </article>
          </section>
        </div>

        <aside class="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <article class="rounded-2xl border" :class="panelClass">
            <div class="border-b px-4 py-3" :class="sectionBorderClass">
              <h2 class="text-sm font-semibold" :class="titleClass">快速操作</h2>
            </div>
            <div class="space-y-2 p-3">
              <button
                type="button"
                disabled
                class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm opacity-60"
                :class="quickActionClass"
              >
                <span class="flex h-8 w-8 items-center justify-center rounded-lg" :class="quickActionIconClass">＋</span>
                <span>
                  <span class="block font-medium">新增牌組</span>
                  <span class="mt-0.5 block text-xs" :class="mutedTextClass">即將推出</span>
                </span>
              </button>

              <RouterLink to="/chat" class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition" :class="quickActionClass">
                <span class="flex h-8 w-8 items-center justify-center rounded-lg" :class="quickActionIconClass">💬</span>
                <span>
                  <span class="block font-medium">前往聊天室</span>
                  <span class="mt-0.5 block text-xs" :class="mutedTextClass">討論構築與對戰想法</span>
                </span>
              </RouterLink>
            </div>
          </article>

          <article class="rounded-2xl border" :class="panelClass">
            <div class="border-b px-4 py-3" :class="sectionBorderClass">
              <h2 class="text-sm font-semibold" :class="titleClass">開發進度</h2>
            </div>
            <div class="space-y-2 p-3">
              <div v-for="item in roadmapItems" :key="item.title" class="rounded-lg px-3 py-2.5" :class="roadmapItemClass">
                <div class="flex items-center gap-2">
                  <span class="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                  <div class="text-sm font-medium" :class="titleClass">{{ item.title }}</div>
                </div>
                <p class="mt-1 pl-3.5 text-xs leading-5" :class="mutedTextClass">{{ item.description }}</p>
              </div>
            </div>
          </article>
        </aside>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import AppHeader from '@/components/AppHeader.vue'
import { PRODUCT_COPY } from '@/constants/productGlossary'
import { usePreferencesStore } from '@/stores/preferencesStore'

const preferences = usePreferencesStore()

const studioHighlights = [
  {
    icon: '📝',
    title: '草稿管理',
    description: '整理構築中的牌組、測試版本與修改想法。',
  },
  {
    icon: '↕️',
    title: '展示與排序',
    description: '用一致的卡片版型瀏覽與整理自己的牌組。',
  },
  {
    icon: '💬',
    title: '社群分享',
    description: '快速切到聊天室，討論構築與對戰方向。',
  },
]

const roadmapItems = [
  {
    title: '牌組建立器',
    description: '建立牌組內容、備註與構築說明。',
  },
  {
    title: '牌組瀏覽與排序',
    description: '快速找到草稿、公開牌組與最近修改內容。',
  },
  {
    title: '聊天室分享卡片',
    description: '將牌組摘要直接分享進聊天。',
  },
]


const pageClass = computed(() =>
  preferences.isDark ? 'bg-slate-950 text-slate-100' : 'bg-gray-100 text-gray-900',
)
const panelClass = computed(() =>
  preferences.isDark ? 'border-white/10 bg-slate-900/70' : 'border-gray-200 bg-white shadow-sm',
)
const sectionBorderClass = computed(() => (preferences.isDark ? 'border-white/10' : 'border-gray-200'))
const titleClass = computed(() => (preferences.isDark ? 'text-slate-100' : 'text-gray-800'))
const textClass = computed(() => (preferences.isDark ? 'text-slate-300' : 'text-gray-600'))
const mutedTextClass = computed(() => (preferences.isDark ? 'text-slate-400' : 'text-gray-500'))
const primaryButtonClass = computed(() =>
  'bg-gradient-to-r from-indigo-600 to-violet-600 shadow-indigo-900/20 hover:from-indigo-500 hover:to-violet-500',
)
const secondaryButtonClass = computed(() =>
  preferences.isDark
    ? 'border-white/10 bg-slate-900 text-slate-100 hover:bg-slate-800 focus-visible:ring-offset-slate-950'
    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-offset-white',
)
const statusBadgeClass = computed(() =>
  preferences.isDark
    ? 'bg-amber-500/10 text-amber-300 ring-1 ring-inset ring-amber-400/20'
    : 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
)
const countBadgeClass = computed(() =>
  preferences.isDark ? 'bg-white/[0.05] text-slate-400' : 'bg-gray-100 text-gray-500',
)
const emptyStateClass = computed(() =>
  preferences.isDark ? 'border-white/10 bg-slate-950/30' : 'border-gray-300 bg-gray-50/70',
)
const emptyIconClass = computed(() =>
  preferences.isDark ? 'bg-indigo-500/10 text-indigo-200' : 'bg-indigo-100 text-indigo-700',
)
const infoCardClass = computed(() =>
  preferences.isDark ? 'border-white/10 bg-slate-900/55' : 'border-gray-200 bg-white',
)
const infoIconClass = computed(() =>
  preferences.isDark ? 'bg-white/[0.05] text-slate-200' : 'bg-gray-100 text-gray-700',
)
const quickActionClass = computed(() =>
  preferences.isDark
    ? 'text-slate-200 hover:bg-white/[0.05]'
    : 'text-gray-700 hover:bg-gray-100',
)
const quickActionIconClass = computed(() =>
  preferences.isDark ? 'bg-white/[0.05] text-slate-300' : 'bg-gray-100 text-gray-600',
)
const roadmapItemClass = computed(() =>
  preferences.isDark ? 'bg-slate-950/35' : 'bg-gray-50',
)
</script>
