import type { AvatarUploadPayload } from '@/types/avatarUpload'

export interface AvatarCropperExpose {
  createAvatarUploadPayload(): Promise<AvatarUploadPayload | null>
  reset(): void
}
