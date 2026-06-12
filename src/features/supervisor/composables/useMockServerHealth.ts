import { computed, ref, watch, type Ref } from 'vue';

interface ServerHealthSeed {
  cpuUsage: number;
  memoryUsage: number;
  memoryUsed: string;
  memoryTotal: string;
  status: 'HEALTHY' | 'DEGRADED' | 'OFFLINE';
  highlights: string[];
}

export interface ServerHealthSnapshot extends ServerHealthSeed {
  host: string;
  refreshedAt: string;
}

const HEALTH_FIXTURES: Record<string, ServerHealthSeed> = {
  '127.0.0.1': {
    cpuUsage: 32,
    memoryUsage: 48,
    memoryUsed: '3.8 GB',
    memoryTotal: '8.0 GB',
    status: 'HEALTHY',
    highlights: ['supervisord 正常响应', '本机执行器', '最近 5 分钟无异常'],
  },
  '10.1.0.104': {
    cpuUsage: 67,
    memoryUsage: 72,
    memoryUsed: '11.5 GB',
    memoryTotal: '16.0 GB',
    status: 'DEGRADED',
    highlights: ['Ansible 执行器', '存在较高内存占用', '建议关注重启高峰'],
  },
};

function formatTime(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function createSnapshot(host: string, refreshCount: number): ServerHealthSnapshot {
  const seed = HEALTH_FIXTURES[host] || {
    cpuUsage: 41,
    memoryUsage: 55,
    memoryUsed: '4.4 GB',
    memoryTotal: '8.0 GB',
    status: 'HEALTHY',
    highlights: ['已连接远程主机', '等待后端健康接口接入', '当前为前端模拟数据'],
  };

  const cpuUsage = clamp(seed.cpuUsage + ((refreshCount % 5) - 2) * 3, 8, 95);
  const memoryUsage = clamp(seed.memoryUsage + ((refreshCount % 4) - 1) * 2, 12, 96);
  const memoryTotal = Number.parseFloat(seed.memoryTotal);
  const memoryUsedNumeric = Number.parseFloat(seed.memoryUsed);
  const adjustedMemoryUsed = Math.min(memoryTotal, Math.max(0.5, memoryUsedNumeric + (refreshCount % 3) * 0.4));

  return {
    host,
    cpuUsage,
    memoryUsage,
    memoryUsed: `${adjustedMemoryUsed.toFixed(1)} GB`,
    memoryTotal: seed.memoryTotal,
    status: seed.status,
    highlights: seed.highlights,
    refreshedAt: formatTime(new Date()),
  };
}

export function useMockServerHealth(selectedHost: Ref<string>) {
  const refreshCount = ref(0);
  const snapshot = ref<ServerHealthSnapshot | null>(null);

  function refresh() {
    if (!selectedHost.value) {
      snapshot.value = null;
      return;
    }

    refreshCount.value += 1;
    snapshot.value = createSnapshot(selectedHost.value, refreshCount.value);
  }

  watch(
    selectedHost,
    () => {
      refreshCount.value = 0;
      if (!selectedHost.value) {
        snapshot.value = null;
        return;
      }
      snapshot.value = createSnapshot(selectedHost.value, refreshCount.value);
    },
    { immediate: true },
  );

  return {
    snapshot: computed(() => snapshot.value),
    refresh,
  };
}
