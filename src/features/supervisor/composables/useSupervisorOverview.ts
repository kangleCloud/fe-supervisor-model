import { computed, ref, watch, type Ref } from 'vue';

import { getSupervisorOverview } from '@/api/supervisor/supervisorApi';
import type { SupervisorOverviewResponse } from '@/api/supervisor/supervisor.types';

const OVERVIEW_TTL_MS = 15_000;

type OverviewCacheEntry = {
  data: SupervisorOverviewResponse;
  fetchedAt: number;
};

export function useSupervisorOverview(selectedHost: Ref<string>) {
  const cache = new Map<string, OverviewCacheEntry>();
  const overview = ref<SupervisorOverviewResponse | null>(null);
  const loading = ref(false);
  const refreshing = ref(false);
  const error = ref<string | null>(null);

  async function fetchOverview(host: string, options: { force?: boolean; background?: boolean } = {}) {
    if (!host) {
      overview.value = null;
      error.value = null;
      return null;
    }

    const now = Date.now();
    const cached = cache.get(host);
    const isCacheValid = !!cached && now - cached.fetchedAt < OVERVIEW_TTL_MS;

    if (cached && (!options.force || isCacheValid)) {
      overview.value = cached.data;
    }

    if (isCacheValid && !options.force) {
      if (!options.background) {
        void fetchOverview(host, { force: true, background: true });
      }
      return { data: cached?.data || null, success: true };
    }

    if (!overview.value || options.force) {
      if (options.background) {
        refreshing.value = true;
      } else {
        loading.value = true;
      }
    } else {
      refreshing.value = true;
    }

    error.value = null;

    try {
      const result = await getSupervisorOverview(host);
      cache.set(host, { data: result, fetchedAt: Date.now() });
      if (selectedHost.value === host) {
        overview.value = result;
      }
      return { data: result, success: true };
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : '加载服务器概况失败';
      error.value = message;
      return { data: cached?.data || null, success: false };
    } finally {
      loading.value = false;
      refreshing.value = false;
    }
  }

  async function refresh(force = false) {
    return fetchOverview(selectedHost.value, { force });
  }

  watch(
    selectedHost,
    (host) => {
      if (!host) {
        overview.value = null;
        error.value = null;
        return;
      }
      void fetchOverview(host);
    },
    { immediate: true },
  );

  return {
    overview: computed(() => overview.value),
    loading: computed(() => loading.value),
    refreshing: computed(() => refreshing.value),
    error: computed(() => error.value),
    refresh,
    _cache: cache,
  };
}
