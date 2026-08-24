<template>
  <div class="min-h-screen transition-colors duration-200" :class="pageClass">
    <AppHeader />

    <main class="mx-auto max-w-6xl px-3 py-6 sm:px-4 sm:py-8 lg:px-6 lg:py-10">
      <section class="overflow-hidden rounded-2xl border" :class="heroPanelClass">
        <div class="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <div class="p-5 sm:p-7 lg:p-9">
            <div
              class="inline-flex items-center gap-2 rounded-lg px-2.5 py-1 text-xs font-semibold"
              :class="heroBadgeClass"
            >
              <span aria-hidden="true">✦</span>
              {{ PRODUCT_COPY.heroBadge }}
            </div>

            <h1
              class="mt-4 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
              :class="heroTitleClass"
            >
              組牌、分享、聊天，
              <span class="text-indigo-600 dark:text-indigo-400">都從這裡開始。</span>
            </h1>

            <p class="mt-4 max-w-2xl text-sm leading-7 sm:text-base" :class="heroTextClass">
              {{ PRODUCT_COPY.featureSummary }}
            </p>

            <div class="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <RouterLink
                :to="deckStudioLink"
                class="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                :class="primaryButtonClass"
              >
                <span aria-hidden="true">🃏</span>
                {{ auth.isAuthenticated ? '進入我的牌組' : '登入後開始組牌' }}
              </RouterLink>

              <RouterLink
                :to="chatLink"
                class="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                :class="secondaryButtonClass"
              >
                <span aria-hidden="true">💬</span>
                {{ auth.isAuthenticated ? '前往聊天室' : '登入後進入聊天' }}
              </RouterLink>
            </div>
          </div>

          <div class="border-t p-4 sm:p-5 lg:border-l lg:border-t-0" :class="heroSideBorderClass">
            <div class="grid h-full gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <RouterLink
                :to="deckStudioLink"
                class="group flex min-h-33 flex-col justify-between rounded-xl border p-4 text-left transition"
                :class="entryCardClass"
              >
                <div class="flex items-start justify-between gap-3">
                  <span
                    class="flex h-10 w-10 items-center justify-center rounded-lg text-xl"
                    :class="entryIconPrimaryClass"
                  >
                    🃏
                  </span>
                  <span
                    class="rounded-md px-2 py-1 text-[11px] font-semibold"
                    :class="entryBadgeClass"
                    >Deck</span
                  >
                </div>

                <div class="mt-4">
                  <div class="flex items-center justify-between gap-3">
                    <h2 class="text-base font-semibold" :class="entryTitleClass">我的牌組</h2>
                    <span
                      class="text-sm transition-transform group-hover:translate-x-1"
                      :class="entryActionClass"
                      >→</span
                    >
                  </div>
                  <p class="mt-1 text-xs leading-5" :class="entryTextClass">
                    {{ PRODUCT_COPY.deckEntryDescription }}
                  </p>
                </div>
              </RouterLink>

              <RouterLink
                :to="chatLink"
                class="group flex min-h-33 flex-col justify-between rounded-xl border p-4 text-left transition"
                :class="entryCardClass"
              >
                <div class="flex items-start justify-between gap-3">
                  <span
                    class="flex h-10 w-10 items-center justify-center rounded-lg text-xl"
                    :class="entryIconSecondaryClass"
                  >
                    💬
                  </span>
                  <span
                    class="rounded-md px-2 py-1 text-[11px] font-semibold"
                    :class="entryBadgeClass"
                    >Chat</span
                  >
                </div>

                <div class="mt-4">
                  <div class="flex items-center justify-between gap-3">
                    <h2 class="text-base font-semibold" :class="entryTitleClass">聊天室</h2>
                    <span
                      class="text-sm transition-transform group-hover:translate-x-1"
                      :class="entryActionClass"
                      >→</span
                    >
                  </div>
                  <p class="mt-1 text-xs leading-5" :class="entryTextClass">
                    {{ PRODUCT_COPY.chatEntryDescription }}
                  </p>
                </div>
              </RouterLink>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import AppHeader from '@/components/AppHeader.vue'
import { PRODUCT_COPY } from '@/constants/productGlossary'
import { useAuthStore } from '@/stores/authStore'
import { usePreferencesStore } from '@/stores/preferencesStore'

const auth = useAuthStore()
const preferences = usePreferencesStore()

const deckStudioLink = computed(() =>
  auth.isAuthenticated ? '/decks' : { path: '/login', query: { redirect: '/decks' } },
)
const chatLink = computed(() =>
  auth.isAuthenticated ? '/chat' : { path: '/login', query: { redirect: '/chat' } },
)

const primaryButtonClass = computed(
  () =>
    'bg-gradient-to-r from-indigo-600 to-violet-600 shadow-indigo-900/20 hover:from-indigo-500 hover:to-violet-500',
)

const pageClass = computed(() =>
  preferences.isDark ? 'bg-slate-950 text-slate-100' : 'bg-gray-100 text-gray-900',
)
const heroPanelClass = computed(() =>
  preferences.isDark
    ? 'border-white/10 bg-slate-900/80 shadow-[0_12px_30px_rgba(0,0,0,0.18)]'
    : 'border-gray-200 bg-white shadow-sm',
)
const heroSideBorderClass = computed(() =>
  preferences.isDark ? 'border-white/10' : 'border-gray-200',
)
const heroBadgeClass = computed(() =>
  preferences.isDark
    ? 'bg-indigo-500/10 text-indigo-300 ring-1 ring-inset ring-indigo-400/20'
    : 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-100',
)
const heroTitleClass = computed(() => (preferences.isDark ? 'text-white' : 'text-gray-900'))
const heroTextClass = computed(() => (preferences.isDark ? 'text-slate-300' : 'text-gray-600'))
const secondaryButtonClass = computed(() =>
  preferences.isDark
    ? 'border-white/10 bg-slate-900 text-slate-100 hover:bg-slate-800 focus-visible:ring-offset-slate-950'
    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-offset-white',
)
const entryCardClass = computed(() =>
  preferences.isDark
    ? 'border-white/10 bg-slate-950/45 hover:border-indigo-400/30 hover:bg-slate-900'
    : 'border-gray-200 bg-gray-50 hover:border-indigo-200 hover:bg-white hover:shadow-sm',
)
const entryIconPrimaryClass = computed(() =>
  preferences.isDark ? 'bg-indigo-500/15 text-indigo-200' : 'bg-indigo-100 text-indigo-700',
)
const entryIconSecondaryClass = computed(() =>
  preferences.isDark ? 'bg-emerald-500/15 text-emerald-200' : 'bg-emerald-100 text-emerald-700',
)
const entryBadgeClass = computed(() =>
  preferences.isDark
    ? 'bg-white/[0.05] text-slate-400'
    : 'bg-white text-gray-500 ring-1 ring-inset ring-gray-200',
)
const entryTitleClass = computed(() => (preferences.isDark ? 'text-slate-100' : 'text-gray-800'))
const entryTextClass = computed(() => (preferences.isDark ? 'text-slate-400' : 'text-gray-500'))
const entryActionClass = computed(() =>
  preferences.isDark ? 'text-indigo-300' : 'text-indigo-600',
)
</script>
