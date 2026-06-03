import type { Pinia } from 'pinia';
import type { RouteRecordRaw } from 'vue-router';

import { createRouter, createWebHistory } from 'vue-router';

import LoginPage from '@/features/auth/pages/LoginPage.vue';
import SupervisorDashboardPage from '@/features/supervisor/pages/SupervisorDashboardPage.vue';
import AppShell from '@/layouts/AppShell.vue';
import { buildLoginLocation, resolvePostLoginRedirect } from '@/router/authRedirect';
import { useAuthStore } from '@/stores/auth/useAuthStore';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
    meta: {
      guestOnly: true,
      title: '登录',
    },
  },
  {
    path: '/',
    component: AppShell,
    meta: {
      requiresAuth: true,
    },
    children: [
      {
        path: '',
        redirect: '/supervisor',
      },
      {
        path: 'supervisor',
        name: 'supervisor',
        component: SupervisorDashboardPage,
        meta: {
          requiresAuth: true,
          title: 'Supervisor 管理',
        },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/supervisor',
  },
];

export function createAppRouter(pinia: Pinia) {
  const router = createRouter({
    history: createWebHistory(),
    routes,
  });

  router.beforeEach(async (to) => {
    const authStore = useAuthStore(pinia);

    if (!authStore.initialized) {
      await authStore.initialize();
    }

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
      return buildLoginLocation(to.fullPath);
    }

    if (to.meta.guestOnly && authStore.isAuthenticated) {
      return resolvePostLoginRedirect(to.query.redirect);
    }

    return true;
  });

  router.afterEach((to) => {
    document.title = to.meta.title ? `Supervisor Console - ${String(to.meta.title)}` : 'Supervisor Console';
  });

  return router;
}
