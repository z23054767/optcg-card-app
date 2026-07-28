<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
    <div class="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
      <div class="mb-5 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-800">個人設定</h2>
        <button class="text-xl text-gray-400 hover:text-gray-600" :disabled="saving" @click="$emit('close')">×</button>
      </div>

      <div class="flex flex-col items-center">
        <div class="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gray-200 text-3xl font-semibold text-gray-500">
          <img v-if="avatarPreview" :src="avatarPreview" class="h-full w-full object-cover" alt="個人頭像" />
          <span v-else>{{ name.trim().charAt(0).toUpperCase() || '?' }}</span>
        </div>

        <div class="mt-3 flex gap-2">
          <label class="cursor-pointer rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">
            選擇頭像
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" class="hidden" @change="onFileChange" />
          </label>
          <button v-if="avatarPreview" class="rounded-lg border px-3 py-1.5 text-sm text-red-600 hover:bg-red-50" @click="removeAvatar">移除</button>
        </div>
        <p class="mt-1 text-xs text-gray-400">支援 JPG、PNG、WebP、GIF，最大 5 MB</p>
      </div>

      <div class="mt-5 space-y-4">
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">顯示名稱</label>
          <input v-model="name" maxlength="30" class="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">帳號</label>
          <input :value="account" disabled class="w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-500" />
        </div>
        <div>
          <div class="mb-1 flex justify-between text-sm font-medium text-gray-700"><label>個人簡介</label><span class="text-xs text-gray-400">{{ bio.length }}/160</span></div>
          <textarea v-model="bio" maxlength="160" rows="4" class="w-full resize-none rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" placeholder="簡單介紹一下自己"></textarea>
        </div>
      </div>

      <p v-if="errorMessage" class="mt-3 text-sm text-red-600">{{ errorMessage }}</p>
      <div class="mt-5 flex justify-end gap-2">
        <button class="rounded-lg border px-4 py-2 text-sm" :disabled="saving" @click="$emit('close')">取消</button>
        <button class="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50" :disabled="saving || !name.trim()" @click="save">{{ saving ? '儲存中...' : '儲存' }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { deleteMyAvatarApi, resolveUserAvatarUrl, updateMyProfileApi, uploadMyAvatarApi, type UserProfile } from '@/api/profileApi'

const props = defineProps<{ profile: UserProfile }>()
const emit = defineEmits<{ close: []; saved: [profile: UserProfile] }>()
const name = ref(props.profile.name)
const bio = ref(props.profile.bio ?? '')
const account = props.profile.account
const avatarPreview = ref(resolveUserAvatarUrl(props.profile.avatarUrl))
const selectedFile = ref<File | null>(null)
const removeCurrentAvatar = ref(false)
const saving = ref(false)
const errorMessage = ref('')
let objectUrl: string | null = null

function onFileChange(event: Event): void {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > 5 * 1024 * 1024) { errorMessage.value = '頭像不可超過 5 MB'; return }
  if (objectUrl) URL.revokeObjectURL(objectUrl)
  objectUrl = URL.createObjectURL(file)
  avatarPreview.value = objectUrl
  selectedFile.value = file
  removeCurrentAvatar.value = false
  errorMessage.value = ''
}

function removeAvatar(): void {
  selectedFile.value = null
  removeCurrentAvatar.value = true
  avatarPreview.value = null
  if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = null }
}

async function save(): Promise<void> {
  saving.value = true
  errorMessage.value = ''
  try {
    let profile = await updateMyProfileApi({ name: name.value.trim(), bio: bio.value.trim() || null })
    if (selectedFile.value) profile = await uploadMyAvatarApi(selectedFile.value)
    else if (removeCurrentAvatar.value && props.profile.avatarUrl) profile = await deleteMyAvatarApi()
    emit('saved', profile)
  } catch { errorMessage.value = '個人設定儲存失敗，請稍後再試' }
  finally { saving.value = false }
}

onBeforeUnmount(() => { if (objectUrl) URL.revokeObjectURL(objectUrl) })
</script>
