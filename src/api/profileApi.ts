import { http } from '@/api/http'
import type { AvatarUploadPayload } from '@/types/avatarUpload'

/**
 * 使用者驗證提供者
 * local: 本地帳號
 * google: Google OAuth
 * microsoft: Microsoft OAuth
 * line: LINE OAuth
 * discord: Discord OAuth
 */
export type AuthProvider = 'local' | 'google' | 'microsoft' | 'line' | 'discord'

export interface UserProfile {
  id: number
  name: string
  displayName: string
  email: string | null
  avatarUrl: string | null
  bio: string | null
  authProvider: AuthProvider
  isActive: boolean
}

interface ProfileResponse {
  success: boolean
  user: UserProfile
}

export async function getMyProfileApi(): Promise<UserProfile> {
  const { data } = await http.get<ProfileResponse>('/auth/me')
  return data.user
}

export async function updateMyProfileApi(input: {
  displayName?: string
  email?: string | null
  bio?: string | null
}): Promise<UserProfile> {
  const { data } = await http.patch<ProfileResponse>('/auth/me', input)
  return data.user
}

export async function uploadMyAvatarApi(input: AvatarUploadPayload): Promise<UserProfile> {
  const formData = new FormData()
  formData.append('file', input.file)
  formData.append('cropLeft', String(input.crop.left))
  formData.append('cropTop', String(input.crop.top))
  formData.append('cropSize', String(input.crop.size))
  formData.append('outputSize', String(input.crop.outputSize))
  const { data } = await http.post<ProfileResponse>('/auth/me/avatar', formData)
  return data.user
}

export async function deleteMyAvatarApi(): Promise<UserProfile> {
  const { data } = await http.delete<ProfileResponse>('/auth/me/avatar')
  return data.user
}

const ABSOLUTE_URL_RE = /^(?:https?:)?\/\//i

function getApiBaseUrl(): string {
  return (import.meta.env.VITE_API_FULL_URL || import.meta.env.VITE_API_BASE_URL).replace(/\/$/, '')
}

function joinUrl(base: string, path: string): string {
  return `${base.replace(/\/$/, '')}/${path.replace(/^\/+/, '')}`
}

export function resolveUserAvatarUrl(path?: string | null): string | null {
  const rawPath = String(path ?? '').trim()

  if (!rawPath) return null
  if (ABSOLUTE_URL_RE.test(rawPath) || rawPath.startsWith('data:') || rawPath.startsWith('blob:')) {
    return rawPath
  }

  const normalizedPath = rawPath.replace(/\\/g, '/')
  const match = normalizedPath.match(/^([^?#]+)([?#].*)?$/)
  const pathname = match?.[1] ?? normalizedPath
  const suffix = match?.[2] ?? ''
  const userAvatarPathIndex = pathname.indexOf('auth/user-avatars/')

  if (userAvatarPathIndex >= 0) {
    return `${joinUrl(getApiBaseUrl(), pathname.slice(userAvatarPathIndex))}${suffix}`
  }

  const fileName = pathname.split('/').pop()

  if (!fileName) return null

  return `${joinUrl(getApiBaseUrl(), `auth/user-avatars/${encodeURIComponent(fileName)}`)}${suffix}`
}
