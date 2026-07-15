import { createRouter, createWebHistory } from 'vue-router'

import LoginView from '@/views/LoginView.vue'
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

  // 未登入，保留原本要去的網址
  if (!auth.isAuthenticated && to.path !== '/login') {
    return {
      path: '/login',
      query: {
        redirect: to.fullPath,
      },
    }
  }

  // 已登入且還在 login 頁，回聊天室
  if (auth.isAuthenticated && to.path === '/login') {
    return '/chat'
  }
})

export default router
