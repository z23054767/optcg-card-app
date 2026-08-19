import type { ChatReplyAttachmentPreview } from '@/types/chat'

export function getReplyAttachmentPreviewLabel(
  attachment?: ChatReplyAttachmentPreview | null,
): string {
  if (!attachment) {
    return ''
  }

  const mimeType = attachment.mimeType.toLowerCase()
  const fileName = attachment.name.trim()

  if (mimeType.startsWith('image/')) {
    return fileName ? `圖片 · ${fileName}` : '圖片'
  }

  if (mimeType.startsWith('video/')) {
    return fileName ? `影片 · ${fileName}` : '影片'
  }

  if (mimeType.startsWith('audio/')) {
    return fileName ? `音訊 · ${fileName}` : '音訊'
  }

  return fileName ? `檔案 · ${fileName}` : '檔案'
}

export function getReplyAttachmentPreviewSizeText(
  attachment?: ChatReplyAttachmentPreview | null,
): string {
  if (!attachment) {
    return ''
  }

  const size = attachment.size

  if (size < 1024) {
    return `${size} B`
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

export function getReplyAttachmentPreviewIcon(
  attachment?: ChatReplyAttachmentPreview | null,
): string {
  if (!attachment) {
    return ''
  }

  const mimeType = attachment.mimeType.toLowerCase()

  if (mimeType.startsWith('image/')) {
    return '🖼️'
  }

  if (mimeType.startsWith('video/')) {
    return '🎬'
  }

  if (mimeType.startsWith('audio/')) {
    return '🎵'
  }

  return '📎'
}

export function getReplyAttachmentPreviewToneClass(
  attachment?: ChatReplyAttachmentPreview | null,
): string {
  if (!attachment) {
    return 'bg-slate-200/70 text-slate-600'
  }

  const mimeType = attachment.mimeType.toLowerCase()

  if (mimeType.startsWith('image/')) {
    return 'bg-emerald-100 text-emerald-700'
  }

  if (mimeType.startsWith('video/')) {
    return 'bg-violet-100 text-violet-700'
  }

  if (mimeType.startsWith('audio/')) {
    return 'bg-amber-100 text-amber-700'
  }

  if (
    mimeType.includes('pdf') ||
    mimeType.includes('word') ||
    mimeType.includes('spreadsheet') ||
    mimeType.includes('presentation') ||
    mimeType.includes('excel') ||
    mimeType.includes('powerpoint')
  ) {
    return 'bg-sky-100 text-sky-700'
  }

  return 'bg-slate-200/70 text-slate-600'
}
