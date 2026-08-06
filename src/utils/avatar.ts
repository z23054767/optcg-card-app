import { resolveUserAvatarUrl } from '@/api/profileApi'

export interface AvatarInput {
  avatarUrl?: string | null
  name?: string | null
  displayName?: string | null
  account?: string | null
  userId?: string | number | null
}

export interface AvatarProps {
  imageUrl: string | null
  initial: string
  backgroundColor: string
  textColor: string
  label: string
}

const AVATAR_COLORS = [
  '#D32F2F', '#C2185B', '#7B1FA2', '#512DA8', '#303F9F', '#1976D2',
  '#0288D1', '#0097A7', '#00796B', '#388E3C', '#689F38', '#AFB42B',
  '#F57C00', '#E64A19', '#5D4037', '#455A64',
] as const

function normalize(value?: string | number | null): string {
  return String(value ?? '').trim()
}

export function getAvatarDisplayName(input: AvatarInput): string {
  return normalize(input.displayName) || normalize(input.name) || normalize(input.account) || '使用者'
}

export function getAvatarInitial(input: Pick<AvatarInput, 'displayName' | 'name' | 'account'>): string {
  const displayName = normalize(input.displayName) || normalize(input.name) || normalize(input.account)
  return Array.from(displayName)[0]?.toLocaleUpperCase() || '?'
}

export function getAvatarBackgroundColor(
  input: Pick<AvatarInput, 'account' | 'userId' | 'name'> | string | number,
): string {
  const key =
    typeof input === 'string' || typeof input === 'number'
      ? normalize(input)
      : normalize(input.name) || normalize(input.account) || normalize(input.userId)

  let hash = 0
  for (const character of key || '?') {
    hash = (hash * 31 + (character.codePointAt(0) ?? 0)) >>> 0
  }

  return AVATAR_COLORS[hash % AVATAR_COLORS.length] ?? AVATAR_COLORS[0]
}

export function getAvatarProps(input: AvatarInput): AvatarProps {
  const label = getAvatarDisplayName(input)
  return {
    imageUrl: resolveUserAvatarUrl(input.avatarUrl ?? null),
    initial: getAvatarInitial(input),
    backgroundColor: getAvatarBackgroundColor(input),
    textColor: '#FFFFFF',
    label,
  }
}
