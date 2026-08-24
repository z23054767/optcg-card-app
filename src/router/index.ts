import { createRouter, createWebHistory } from 'vue-router'

import { useAuthStore } from '@/stores/authStore'
import ChatInviteView from '@/views/ChatInviteView.vue'
import ChatView from '@/views/ChatView.vue'
import DeckStudioView from '@/views/DeckStudioView.vue'
import ForgotPasswordView from '@/views/ForgotPasswordView.vue'
import HomeView from '@/views/HomeView.vue'
import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'
import ResetPasswordView from '@/views/ResetPasswordView.vue'
import VerifySuccessView from '@/views/VerifySuccessView.vue'

const DEFAULT_AUTHENTICATED_PATH = '/decks'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { public: true },
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { guestOnly: true },
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: { guestOnly: true },
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: ForgotPasswordView,
      meta: { guestOnly: true },
    },
    {
      path: '/auth/reset-password',
      name: 'reset-password',
      component: ResetPasswordView,
      meta: { guestOnly: true },
    },
    {
      path: '/auth/verify-success',
      name: 'verify-success',
      component: VerifySuccessView,
      meta: { public: true },
    },
    {
      path: '/decks',
      name: 'deck-studio',
      component: DeckStudioView,
      meta: { requiresAuth: true },
    },
    {
      path: '/chat',
      name: 'chat',
      component: ChatView,
      meta: { requiresAuth: true },
    },
    {
      path: '/chat/invite',
      name: 'chat-invite',
      component: ChatInviteView,
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const guestOnly = to.matched.some((record) => record.meta.guestOnly)

  if (auth.isAuthenticated && guestOnly) {
    const redirectTarget =
      typeof to.query.redirect === 'string' && to.query.redirect.startsWith('/')
        ? to.query.redirect
        : DEFAULT_AUTHENTICATED_PATH

    return redirectTarget
  }

  if (!auth.isAuthenticated && requiresAuth) {
    return {
      path: '/login',
      query: {
        redirect: to.fullPath,
      },
    }
  }

  return true
})

export { DEFAULT_AUTHENTICATED_PATH }
export default router
