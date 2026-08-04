import { createRouter, createWebHistory } from 'vue-router'

import LoginView from '@/views/LoginView.vue'
import VerifySuccessView from '@/views/VerifySuccessView.vue'
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

  if (auth.isAuthenticated && to.path === '/login') {
    return '/chat'
  }

  // 驗證成功頁面必須可被未登入使用者開啟，讓使用者看到成功結果後再導向登入
  if (!auth.isAuthenticated && to.path !== '/login' && to.path !== '/auth/verify-success') {
    return {
      path: '/login',
      query: {
        redirect: to.fullPath,
      },
    }
  }
})

export default router
