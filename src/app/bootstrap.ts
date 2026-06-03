import type { App as VueApp } from 'vue';

import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import { createPinia } from 'pinia';

import { registerUnauthorizedHandler } from '@/api/http/httpClient';
import { buildLoginLocation } from '@/router/authRedirect';
import { createAppRouter } from '@/router';
import { useAuthStore } from '@/stores/auth/useAuthStore';
import {
  ACCESS_TOKEN_EXPIRES_AT_STORAGE_KEY,
  ACCESS_TOKEN_STORAGE_KEY,
} from '@/app/storageKeys';
import '@/styles/index.css';

export async function bootstrapApp(app: VueApp) {
  const pinia = createPinia();
  const router = createAppRouter(pinia);
  const authStore = useAuthStore(pinia);

  registerUnauthorizedHandler(async () => {
    const currentRoute = router.currentRoute.value;
    authStore.clearSession();

    if (currentRoute.path !== '/login') {
      await router.push(buildLoginLocation(currentRoute.fullPath));
    }
  });

  window.addEventListener('storage', async (event) => {
    if (
      event.key !== ACCESS_TOKEN_STORAGE_KEY &&
      event.key !== ACCESS_TOKEN_EXPIRES_AT_STORAGE_KEY
    ) {
      return;
    }

    await authStore.syncFromStorage();

    if (!authStore.isAuthenticated && router.currentRoute.value.path !== '/login') {
      await router.push(buildLoginLocation(router.currentRoute.value.fullPath));
    }
  });

  app.use(pinia);
  app.use(router);
  app.use(ElementPlus);

  app.config.errorHandler = (error) => {
    console.error('[app-error]', error);
  };

  await router.isReady();
  app.mount('#app');
}
