<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
    <div class="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-xl bg-white shadow-xl">
      <div class="flex shrink-0 items-center justify-between border-b px-5 py-4">
        <h2 class="text-lg font-semibold text-gray-800">
          個人設定
        </h2>

        <button class="text-xl text-gray-400 hover:text-gray-600 disabled:opacity-50" :disabled="saving"
          @click="$emit('close')">
          ✕
        </button>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <AvatarCropper ref="avatarCropper" v-model:remove-avatar="removeCurrentAvatar"
          :current-avatar-url="currentAvatarUrl" current-avatar-label="目前個人頭像" current-avatar-alt="個人頭像"
          output-file-name="user-avatar" :disabled="saving" @selection-change="hasSelectedAvatarFile = $event"
          @error="errorMessage = $event" />

        <div class="mt-5 space-y-4">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">
              顯示名稱
            </label>

            <input v-model="name" maxlength="30"
              class="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">
              帳號
            </label>

            <input :value="account" disabled
              class="w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-500" />
          </div>

          <div>
            <div class="mb-1 flex justify-between text-sm font-medium text-gray-700">
              <label>個人簡介</label>

              <span class="text-xs text-gray-400">
                {{ bio.length }}/160
              </span>
            </div>

            <textarea v-model="bio" maxlength="160" rows="4"
              class="w-full resize-none rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="簡單介紹一下自己" />
          </div>
        </div>

        <p v-if="errorMessage" class="mt-3 text-sm text-red-600">
          {{ errorMessage }}
        </p>
      </div>

      <div class="flex shrink-0 justify-end gap-2 border-t bg-white px-5 py-4">
        <button class="rounded-lg border px-4 py-2 text-sm disabled:opacity-50" :disabled="saving"
          @click="$emit('close')">
          取消
        </button>

        <button class="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
          :disabled="saving || !name.trim()" @click="save">
          {{ saving ? "儲存中..." : "儲存" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

import AvatarCropper from "@/components/base/AvatarCropper.vue";
import type { AvatarCropperExpose } from "@/components/base/avatarCropper";

import {
  deleteMyAvatarApi,
  resolveUserAvatarUrl,
  updateMyProfileApi,
  uploadMyAvatarApi,
  type UserProfile,
} from "@/api/profileApi";

const props = defineProps<{
  profile: UserProfile;
}>();

const emit = defineEmits<{
  close: [];
  saved: [profile: UserProfile];
}>();

const avatarCropper = ref<AvatarCropperExpose | null>(null);
const hasSelectedAvatarFile = ref(false);
const removeCurrentAvatar = ref(false);

const name = ref(props.profile.name);
const bio = ref(props.profile.bio ?? "");
const account = props.profile.account;

const saving = ref(false);
const errorMessage = ref("");

const currentAvatarUrl = computed(() =>
  resolveUserAvatarUrl(props.profile.avatarUrl),
);

async function save(): Promise<void> {
  const trimmedName = name.value.trim();

  if (!trimmedName) {
    return;
  }

  saving.value = true;
  errorMessage.value = "";

  try {
    let profile = await updateMyProfileApi({
      name: trimmedName,
      bio: bio.value.trim() || null,
    });

    if (hasSelectedAvatarFile.value) {
      const avatarFile =
        (await avatarCropper.value?.createCroppedAvatarFile()) ?? null;

      if (!avatarFile) {
        errorMessage.value = "無法產生裁切後的頭像";
        return;
      }

      profile = await uploadMyAvatarApi(avatarFile);
    } else if (
      removeCurrentAvatar.value &&
      props.profile.avatarUrl
    ) {
      profile = await deleteMyAvatarApi();
    }

    emit("saved", profile);
  } catch {
    errorMessage.value = "個人設定儲存失敗，請稍後再試";
  } finally {
    saving.value = false;
  }
}
</script>