import { http } from '@/api/http'

/**
 * 使用者驗證提供者
 * local: 本地帳號
 * google: Google OAuth
 * microsoft: Microsoft OAuth
 * line: LINE OAuth
 */
export type AuthProvider = 'local' | 'google' | 'microsoft' | 'line'

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

export async function uploadMyAvatarApi(file: File): Promise<UserProfile> {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await http.post<ProfileResponse>('/auth/me/avatar', formData)
  return data.user
}

export async function deleteMyAvatarApi(): Promise<UserProfile> {
  const { data } = await http.delete<ProfileResponse>('/auth/me/avatar')
  return data.user
}

export function resolveUserAvatarUrl(path?: string | null): string | null {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path
  const fileName = path.replace(/\\/g, '/').split('/').pop()
  if (!fileName) return null
  return `${import.meta.env.VITE_API_BASE_URL}/auth/user-avatars/${encodeURIComponent(fileName)}`
}
