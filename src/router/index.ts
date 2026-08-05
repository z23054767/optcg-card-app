import { createRouter, createWebHistory } from 'vue-router'

import LoginView from '@/views/LoginView.vue'
import VerifySuccessView from '@/views/VerifySuccessView.vue'
import RegisterView from '@/views/RegisterView.vue'
import ForgotPasswordView from '@/views/ForgotPasswordView.vue'
import ResetPasswordView from '@/views/ResetPasswordView.vue'
import ChatView from '@/views/ChatView.vue'
import ChatInviteView from '@/views/ChatInviteView.vue'

import { useAuthStore } from '@/stores/authStore'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/chat',
    },
    {
      path: '/login',
      component: LoginView,
    },
    { path: '/register', component: RegisterView },
    { path: '/forgot-password', component: ForgotPasswordView },
    { path: '/auth/reset-password', component: ResetPasswordView },
    {
      path: '/auth/verify-success',
      component: VerifySuccessView,
    },
    {
      path: '/chat',
      component: ChatView,
    },
    {
      path: '/chat/invite',
      component: ChatInviteView,
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  const guestOnlyPaths = ['/login', '/register', '/forgot-password', '/auth/reset-password']
  const publicPaths = [...guestOnlyPaths, '/auth/verify-success']

  if (auth.isAuthenticated && guestOnlyPaths.includes(to.path)) {
    return '/chat'
  }

  // 驗證成功頁面必須可被未登入使用者開啟，讓使用者看到成功結果後再導向登入
  if (!auth.isAuthenticated && !publicPaths.includes(to.path)) {
    return {
      path: '/login',
      query: {
        redirect: to.fullPath,
      },
    }
  }
})

export default router
