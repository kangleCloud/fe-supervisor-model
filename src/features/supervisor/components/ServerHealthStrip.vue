<template>
  <section class="page__section">
    <div class="page__section-header">
      <div>
        <h2 class="page__section-title">远程服务器概况</h2>
        <p class="page__section-subtitle">当前按主机展示 CPU、内存与基础状态，后续可直接替换为真实接口。</p>
      </div>
      <div class="server-health__header-actions">
        <el-button
          :icon="RefreshRight"
          plain
          :disabled="!snapshot"
          data-testid="refresh-health"
          @click="emit('refresh')"
        >
          刷新概况
        </el-button>
      </div>
    </div>

    <EmptyState
      v-if="!snapshot"
      :icon="Monitor"
      title="未选择主机"
      description="请先在上方筛选区选择目标主机。"
    />

    <template v-else>
      <div class="server-health__summary">
        <div class="server-health__identity">
          <div class="server-health__identity-label">目标主机</div>
          <div class="server-health__identity-value">{{ hostLabel }}</div>
          <div class="server-health__identity-meta">{{ snapshot.host }} · 最近刷新 {{ snapshot.refreshedAt }}</div>
        </div>

        <div class="server-health__status-group">
          <el-tag :type="statusTagType" effect="light">{{ snapshot.status }}</el-tag>
          <el-tag effect="plain">{{ host?.executorType || 'unknown' }}</el-tag>
          <el-tag v-if="host?.enabled" type="success" effect="plain">已启用</el-tag>
          <el-tag v-else type="info" effect="plain">未启用</el-tag>
        </div>
      </div>

      <div class="server-health__grid">
        <div class="server-health__card">
          <div class="server-health__card-label">CPU 使用率</div>
          <div class="server-health__card-value">{{ snapshot.cpuUsage }}%</div>
          <el-progress :percentage="snapshot.cpuUsage" :stroke-width="10" :color="progressColor(snapshot.cpuUsage)" />
        </div>

        <div class="server-health__card">
          <div class="server-health__card-label">内存使用率</div>
          <div class="server-health__card-value">{{ snapshot.memoryUsage }}%</div>
          <el-progress :percentage="snapshot.memoryUsage" :stroke-width="10" :color="progressColor(snapshot.memoryUsage)" />
        </div>

        <div class="server-health__card">
          <div class="server-health__card-label">内存占用</div>
          <div class="server-health__card-value">{{ snapshot.memoryUsed }}</div>
          <div class="server-health__card-meta">总内存 {{ snapshot.memoryTotal }}</div>
        </div>

        <div class="server-health__card">
          <div class="server-health__card-label">关键状态</div>
          <ul class="server-health__highlights">
            <li v-for="highlight in snapshot.highlights" :key="highlight">{{ highlight }}</li>
          </ul>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { Monitor, RefreshRight } from '@element-plus/icons-vue';
import { computed } from 'vue';

import type { SupervisorHost } from '@/api/supervisor/supervisor.types';
import type { ServerHealthSnapshot } from '@/features/supervisor/composables/useMockServerHealth';
import EmptyState from '@/components/EmptyState.vue';

const props = defineProps<{
  host: SupervisorHost | null;
  snapshot: ServerHealthSnapshot | null;
}>();

const emit = defineEmits<{
  refresh: [];
}>();

const hostLabel = computed(() => {
  if (!props.host) {
    return props.snapshot?.host || '-';
  }

  return `${props.host.name} (${props.host.ip})`;
});

const statusTagType = computed(() => {
  switch (props.snapshot?.status) {
    case 'HEALTHY':
      return 'success';
    case 'DEGRADED':
      return 'warning';
    case 'OFFLINE':
      return 'danger';
    default:
      return 'info';
  }
});

function progressColor(value: number) {
  if (value >= 80) {
    return 'var(--danger)';
  }
  if (value >= 60) {
    return 'var(--warning)';
  }
  return 'var(--accent)';
}
</script>

<style scoped>
.server-health__header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.server-health__summary {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
  padding: 16px;
  border: 1px solid var(--surface-strong);
  border-radius: 10px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbf9 100%);
}

.server-health__identity-label {
  font-size: 12px;
  color: var(--text-tertiary);
}

.server-health__identity-value {
  margin-top: 4px;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.server-health__identity-meta {
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-secondary);
  font-family: 'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace;
}

.server-health__status-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.server-health__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.server-health__card {
  padding: 16px;
  border: 1px solid var(--surface-strong);
  border-radius: 10px;
  background: var(--surface);
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 148px;
}

.server-health__card-label {
  font-size: 13px;
  color: var(--text-tertiary);
}

.server-health__card-value {
  font-size: 26px;
  font-weight: 700;
  color: var(--text-primary);
}

.server-health__card-meta {
  font-size: 12px;
  color: var(--text-secondary);
}

.server-health__highlights {
  margin: 0;
  padding-left: 18px;
  color: var(--text-secondary);
  display: grid;
  gap: 6px;
}

@media (max-width: 1280px) {
  .server-health__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .server-health__summary {
    flex-direction: column;
  }

  .server-health__status-group {
    justify-content: flex-start;
  }

  .server-health__grid {
    grid-template-columns: 1fr;
  }
}
</style>
