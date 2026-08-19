export interface AvatarCropArea {
  left: number
  top: number
  size: number
  outputSize: number
}

export interface AvatarUploadPayload {
  file: File
  crop: AvatarCropArea
}
