<template>
  <Transition name="modal-fade" appear>
    <div
      class="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 backdrop-blur-sm"
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
        class="relative shrink-0 border-b px-5 py-4"
        :class="preferences.isDark ? 'border-white/8' : 'border-slate-200'"
      >
        <div class="pr-10">
          <div
            class="mb-2 inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-medium"
            :class="
              preferences.isDark
                ? 'bg-sky-500/12 text-sky-300'
                : 'bg-sky-100 text-sky-700'
            "
          >
            <span class="text-xs">✦</span>
            個人資料
          </div>
          <h2 class="text-lg font-semibold tracking-tight" :class="preferences.isDark ? 'text-white' : 'text-slate-900'">個人設定</h2>
        </div>

        <button
          class="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full text-xl transition disabled:opacity-50"
          :class="
            preferences.isDark
              ? 'text-slate-400 hover:bg-white/8 hover:text-white'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
          "
          :disabled="saving"
          @click="$emit('close')"
        >
          ✕
        </button>
      </div>

        <div class="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
        <AvatarCropper
          ref="avatarCropper"
          v-model:remove-avatar="removeCurrentAvatar"
          :current-avatar-url="currentAvatarUrl"
          current-avatar-label="目前個人頭像"
          current-avatar-alt="個人頭像"
          output-file-name="user-avatar"
          :disabled="saving || isThirdPartyAccount"
          @selection-change="hasSelectedAvatarFile = $event"
          @error="errorMessage = $event"
        />

        <p v-if="isThirdPartyAccount" class="mt-2 text-xs" :class="preferences.isDark ? 'text-slate-400' : 'text-slate-500'">
          第三方登入帳號的頭像由登入服務提供，無法在此修改。
        </p>
        <div
          class="mt-5 space-y-4 rounded-2xl border p-4"
          :class="
            preferences.isDark
              ? 'border-white/8 bg-slate-950/45'
              : 'border-slate-200 bg-slate-50'
          "
        >
          <div>
            <label class="mb-1 block text-sm font-medium" :class="preferences.isDark ? 'text-slate-200' : 'text-slate-700'"> 顯示名稱 </label>

            <input
              v-model="displayName"
              maxlength="30"
              class="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 disabled:cursor-not-allowed"
              :class="
                preferences.isDark
                  ? 'border-slate-700 bg-slate-950/70 text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:ring-indigo-500/25 disabled:bg-slate-900 disabled:text-slate-500'
                  : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:text-slate-500'
              "
            />

            <p v-if="isThirdPartyAccount" class="mt-1 text-xs" :class="preferences.isDark ? 'text-slate-400' : 'text-slate-500'">
              顯示名稱可隨時修改。
            </p>
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium" :class="preferences.isDark ? 'text-slate-200' : 'text-slate-700'"> 帳號 ID（不可修改） </label>

            <input
              :value="`@${name}`"
              disabled
              class="w-full rounded-xl border px-3 py-2 text-sm"
              :class="
                preferences.isDark
                  ? 'border-slate-700 bg-slate-900 text-slate-400'
                  : 'border-slate-300 bg-slate-100 text-slate-500'
              "
            />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium" :class="preferences.isDark ? 'text-slate-200' : 'text-slate-700'"> Email </label>

            <input
              :value="email"
              disabled
              class="w-full rounded-xl border px-3 py-2 text-sm"
              :class="
                preferences.isDark
                  ? 'border-slate-700 bg-slate-900 text-slate-400'
                  : 'border-slate-300 bg-slate-100 text-slate-500'
              "
            />
          </div>

          <div>
            <div class="mb-1 flex justify-between text-sm font-medium" :class="preferences.isDark ? 'text-slate-200' : 'text-slate-700'">
              <label>個人簡介</label>

              <span class="text-xs" :class="preferences.isDark ? 'text-slate-500' : 'text-slate-400'"> {{ bio.length }}/160 </span>
            </div>

            <textarea
              v-model="bio"
              maxlength="160"
              rows="4"
              class="w-full resize-none rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2"
              :class="
                preferences.isDark
                  ? 'border-slate-700 bg-slate-950/70 text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:ring-indigo-500/25'
                  : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500/20'
              "
              placeholder="簡單介紹一下自己"
            />
          </div>
        </div>

        <p v-if="errorMessage" class="mt-3 text-sm" :class="preferences.isDark ? 'text-red-400' : 'text-red-600'">
          {{ errorMessage }}
        </p>
      </div>

        <div
          class="flex shrink-0 justify-end gap-2 border-t px-5 py-4 sm:px-6"
        :class="
          preferences.isDark
            ? 'border-white/8 bg-slate-900/95'
            : 'border-slate-200 bg-white/96'
        "
      >
        <button
          class="rounded-xl border px-4 py-2 text-sm font-medium transition disabled:opacity-50"
          :class="
            preferences.isDark
              ? 'border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06]'
              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
          "
          :disabled="saving"
          @click="$emit('close')"
        >
          取消
        </button>

        <button
          class="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:opacity-50"
          :disabled="saving || !displayName.trim()"
          @click="save"
        >
          {{ saving ? '儲存中...' : '儲存' }}
        </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePreferencesStore } from '@/stores/preferencesStore'

import AvatarCropper from '@/components/base/AvatarCropper.vue'
import type { AvatarCropperExpose } from '@/components/base/avatarCropper'

import {
  deleteMyAvatarApi,
  resolveUserAvatarUrl,
  updateMyProfileApi,
  uploadMyAvatarApi,
  type UserProfile,
} from '@/api/profileApi'

const props = defineProps<{
  profile: UserProfile
}>()

const emit = defineEmits<{
  close: []
  saved: [profile: UserProfile]
}>()

const preferences = usePreferencesStore()
const isThirdPartyAccount = computed(() => props.profile.authProvider !== 'local')

const avatarCropper = ref<AvatarCropperExpose | null>(null)
const hasSelectedAvatarFile = ref(false)
const removeCurrentAvatar = ref(false)

const name = props.profile.name
const email = props.profile.email?.trim() || '未設定'
const displayName = ref(props.profile.displayName)
const bio = ref(props.profile.bio ?? '')

const saving = ref(false)
const errorMessage = ref('')

const currentAvatarUrl = computed(() => resolveUserAvatarUrl(props.profile.avatarUrl))

async function save(): Promise<void> {
  const trimmedDisplayName = displayName.value.trim()

  if (!trimmedDisplayName) {
    return
  }

  saving.value = true
  errorMessage.value = ''

  try {
    let profile = await updateMyProfileApi({
      displayName: trimmedDisplayName,
      bio: bio.value.trim() || null,
    })

    if (hasSelectedAvatarFile.value) {
      const avatarFile = (await avatarCropper.value?.createCroppedAvatarFile()) ?? null

      if (!avatarFile) {
        errorMessage.value = '無法產生裁切後的頭像'
        return
      }

      profile = await uploadMyAvatarApi(avatarFile)
    } else if (removeCurrentAvatar.value && props.profile.avatarUrl) {
      profile = await deleteMyAvatarApi()
    }

    emit('saved', profile)
  } catch {
    errorMessage.value = '個人設定儲存失敗，請稍後再試'
  } finally {
    saving.value = false
  }
}
</script>
