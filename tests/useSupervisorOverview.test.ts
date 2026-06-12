import { ref } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSupervisorOverview } from '@/features/supervisor/composables/useSupervisorOverview';

const { mockGetSupervisorOverview } = vi.hoisted(() => ({
  mockGetSupervisorOverview: vi.fn(),
}));

vi.mock('@/api/supervisor/supervisorApi', () => ({
  getSupervisorOverview: mockGetSupervisorOverview,
}));

const connectedOverview = {
  host: '10.1.0.104',
  hostName: 'web-104-host',
  executorType: 'ansible',
  available: true,
  connectionState: 'CONNECTED' as const,
  collectedAt: '2026-06-12 18:30:00',
  cpu: { usagePercent: 12.34 },
  memory: {
    usagePercent: 50,
    usedBytes: 4294967296,
    totalBytes: 8589934592,
    usedText: '4.00 GB',
    totalText: '8.00 GB',
  },
  checks: {
    supervisorctlAvailable: true,
    confDirReadable: true,
  },
  warnings: [],
};

describe('useSupervisorOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-12T10:00:00Z'));
  });

  it('loads overview on initial host selection', async () => {
    mockGetSupervisorOverview.mockResolvedValue(connectedOverview);
    const selectedHost = ref('10.1.0.104');

    const state = useSupervisorOverview(selectedHost);
    await vi.runAllTimersAsync();

    expect(mockGetSupervisorOverview).toHaveBeenCalledWith('10.1.0.104');
    expect(state.overview.value?.hostName).toBe('web-104-host');
  });

  it('uses host-scoped cache and triggers background refresh within 15s', async () => {
    mockGetSupervisorOverview.mockResolvedValue(connectedOverview);
    const selectedHost = ref('10.1.0.104');

    const state = useSupervisorOverview(selectedHost);
    await vi.runAllTimersAsync();
    expect(mockGetSupervisorOverview).toHaveBeenCalledTimes(1);

    selectedHost.value = '';
    await vi.runAllTimersAsync();
    selectedHost.value = '10.1.0.104';
    await vi.runAllTimersAsync();

    expect(state.overview.value?.hostName).toBe('web-104-host');
    expect(mockGetSupervisorOverview).toHaveBeenCalledTimes(2);
  });

  it('force refresh ignores cache', async () => {
    mockGetSupervisorOverview.mockResolvedValue(connectedOverview);
    const selectedHost = ref('10.1.0.104');

    const state = useSupervisorOverview(selectedHost);
    await vi.runAllTimersAsync();

    await state.refresh(true);

    expect(mockGetSupervisorOverview).toHaveBeenCalledTimes(2);
  });

  it('isolates cache by host', async () => {
    mockGetSupervisorOverview
      .mockResolvedValueOnce(connectedOverview)
      .mockResolvedValueOnce({
        ...connectedOverview,
        host: '10.1.0.105',
        hostName: 'web-105-host',
      });

    const selectedHost = ref('10.1.0.104');
    const state = useSupervisorOverview(selectedHost);
    await vi.runAllTimersAsync();

    selectedHost.value = '10.1.0.105';
    await vi.runAllTimersAsync();

    expect(mockGetSupervisorOverview).toHaveBeenCalledTimes(2);
    expect(state.overview.value?.hostName).toBe('web-105-host');
  });

  it('preserves old data and exposes error on request failure', async () => {
    mockGetSupervisorOverview
      .mockResolvedValueOnce(connectedOverview)
      .mockRejectedValueOnce(new Error('network failed'));

    const selectedHost = ref('10.1.0.104');
    const state = useSupervisorOverview(selectedHost);
    await vi.runAllTimersAsync();

    const result = await state.refresh(true);

    expect(result?.success).toBe(false);
    expect(state.overview.value?.hostName).toBe('web-104-host');
    expect(state.error.value).toBe('network failed');
  });
});
