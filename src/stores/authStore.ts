import { defineStore } from 'pinia'
import { getMyProfileApi } from '@/api/profileApi'
import { useChatStore } from '@/stores/chatStore'

export type AuthUser = {
  userId: string
  name: string
  displayName: string
  email?: string | null
  avatarUrl?: string | null
  bio?: string | null
}

function parseJwt(token: string): AuthUser {
  const parts = token.split('.')
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format')
  }

  const payloadPart = parts[1]
  if (!payloadPart) {
    throw new Error('Invalid JWT format')
  }

  // JWT 是 base64url，要先轉成 base64
  const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/')

  const binary = atob(base64)
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  const json = new TextDecoder('utf-8').decode(bytes)
  const payload = JSON.parse(json)

  return {
    userId: String(payload.userId),
    name: payload.name,
    displayName: payload.displayName || payload.name,
    email: payload.email ?? null,
  }
}

let profileLoadingPromise: Promise<void> | null = null

export const useAuthStore = defineStore('auth', {
  state: () => {
    const token = localStorage.getItem('token') ?? ''
    let user: AuthUser | null = null

    try {
      user = token ? parseJwt(token) : null
    } catch {
      localStorage.removeItem('token')
    }

    return { token: user ? token : '', user }
  },

  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
    userId: (state) => state.user?.userId ?? '',
    userName: (state) => state.user?.name ?? '',
  },

  actions: {
    setAccessToken(token: string) {
      const previousUserId = this.user?.userId ?? null
      const nextUser = parseJwt(token)

      if (previousUserId && previousUserId !== nextUser.userId) {
        const chat = useChatStore()
        chat.clear()
      }

      this.token = token
      this.user = nextUser

      localStorage.setItem('token', token)
    },

    login(token: string) {
      this.setAccessToken(token)
    },

    updateProfile(profile: { displayName: string; avatarUrl: string | null; bio: string | null }) {
      if (!this.user) return
      this.user = { ...this.user, ...profile }
    },

    async ensureProfileLoaded(): Promise<void> {
      if (!this.isAuthenticated || !this.user) return

      if (this.user.avatarUrl !== undefined && this.user.bio !== undefined) {
        return
      }

      if (profileLoadingPromise) {
        await profileLoadingPromise
        return
      }

      profileLoadingPromise = (async () => {
        try {
          const profile = await getMyProfileApi()

          if (!this.user || String(this.user.userId) !== String(profile.id)) {
            return
          }

          this.user = {
            ...this.user,
            displayName: profile.displayName,
            email: profile.email,
            avatarUrl: profile.avatarUrl,
            bio: profile.bio,
          }
        } finally {
          profileLoadingPromise = null
        }
      })()

      await profileLoadingPromise
    },

    logout() {
      const chat = useChatStore()

      this.token = ''
      this.user = null
      chat.clear()

      localStorage.removeItem('token')
    },
  },
})
