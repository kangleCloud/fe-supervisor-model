<template>
  <section class="page__section">
    <div class="page__section-header">
      <div>
        <h2 class="page__section-title">远程服务器概况</h2>
        <p class="page__section-subtitle">实时展示目标主机概况、基础检查与告警信息。</p>
      </div>
      <div class="server-health__header-actions">
        <el-button
          :icon="RefreshRight"
          plain
          :disabled="!host"
          :loading="refreshing"
          data-testid="refresh-health"
          @click="emit('refresh')"
        >
          刷新概况
        </el-button>
      </div>
    </div>

    <EmptyState
      v-if="!host"
      :icon="Monitor"
      title="未选择主机"
      description="请先在上方筛选区选择目标主机。"
    />

    <div v-else-if="loading && !overview" class="server-health__skeleton">
      <el-skeleton :rows="6" animated />
    </div>

    <template v-else-if="overview">
      <el-alert
        v-if="error"
        title="主机概况刷新失败"
        :description="error"
        type="error"
        :closable="false"
        show-icon
        class="server-health__alert"
      />

      <div class="server-health__summary">
        <div class="server-health__identity">
          <div class="server-health__identity-label">目标主机</div>
          <div class="server-health__identity-value">{{ hostLabel }}</div>
          <div class="server-health__identity-meta">最近采集 {{ overview.collectedAt }}</div>
        </div>

        <div class="server-health__status-group">
          <el-tag :type="connectionTagType" effect="light">{{ connectionLabel }}</el-tag>
          <el-tag effect="plain">{{ overview.executorType }}</el-tag>
          <el-tag v-if="host.enabled" type="success" effect="plain">已启用</el-tag>
          <el-tag v-else type="info" effect="plain">未启用</el-tag>
        </div>
      </div>

      <div class="server-health__grid">
        <div class="server-health__card">
          <div class="server-health__card-label">CPU 使用率</div>
          <div class="server-health__card-value">{{ overview.cpu.usagePercent.toFixed(2) }}%</div>
          <el-progress :percentage="progressValue(overview.cpu.usagePercent)" :stroke-width="10" :color="progressColor(overview.cpu.usagePercent)" />
        </div>

        <div class="server-health__card">
          <div class="server-health__card-label">内存使用率</div>
          <div class="server-health__card-value">{{ overview.memory.usagePercent.toFixed(2) }}%</div>
          <el-progress :percentage="progressValue(overview.memory.usagePercent)" :stroke-width="10" :color="progressColor(overview.memory.usagePercent)" />
        </div>

        <div class="server-health__card">
          <div class="server-health__card-label">内存占用</div>
          <div class="server-health__card-value">{{ overview.memory.usedText }}</div>
          <div class="server-health__card-meta">总内存 {{ overview.memory.totalText }}</div>
        </div>

        <div class="server-health__card">
          <div class="server-health__card-label">基础检查</div>
          <div class="server-health__checks">
            <div class="server-health__check-item">
              <span>supervisorctl</span>
              <el-tag :type="overview.checks.supervisorctlAvailable ? 'success' : 'danger'" effect="plain">
                {{ overview.checks.supervisorctlAvailable ? '可用' : '不可用' }}
              </el-tag>
            </div>
            <div class="server-health__check-item">
              <span>conf 目录</span>
              <el-tag :type="overview.checks.confDirReadable ? 'success' : 'danger'" effect="plain">
                {{ overview.checks.confDirReadable ? '可读' : '不可读' }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>

      <el-alert
        v-if="overview.warnings.length"
        title="主机提示"
        type="warning"
        :closable="false"
        show-icon
        class="server-health__alert"
      >
        <ul class="server-health__warnings">
          <li v-for="warning in overview.warnings" :key="warning">{{ warning }}</li>
        </ul>
      </el-alert>
    </template>

    <el-alert
      v-else-if="error"
      title="主机概况加载失败"
      :description="error"
      type="error"
      :closable="false"
      show-icon
      class="server-health__alert"
    />
  </section>
</template>

<script setup lang="ts">
import { Monitor, RefreshRight } from '@element-plus/icons-vue';
import { computed } from 'vue';

import type { SupervisorHost, SupervisorOverviewResponse } from '@/api/supervisor/supervisor.types';
import EmptyState from '@/components/EmptyState.vue';

const props = defineProps<{
  host: SupervisorHost | null;
  overview: SupervisorOverviewResponse | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
}>();

const emit = defineEmits<{
  refresh: [];
}>();

const hostLabel = computed(() => {
  if (!props.host && !props.overview) {
    return '-';
  }

  const name = props.overview?.hostName || props.host?.name || '-';
  const ip = props.overview?.host || props.host?.ip || '-';
  return `${name} (${ip})`;
});

const connectionTagType = computed(() => {
  switch (props.overview?.connectionState) {
    case 'CONNECTED':
      return 'success';
    case 'UNREACHABLE':
      return 'danger';
    case 'UNSUPPORTED':
      return 'warning';
    default:
      return 'info';
  }
});

const connectionLabel = computed(() => {
  switch (props.overview?.connectionState) {
    case 'CONNECTED':
      return '已连接';
    case 'UNREACHABLE':
      return '不可达';
    case 'UNSUPPORTED':
      return '不支持';
    default:
      return '未知';
  }
});

function progressValue(value: number) {
  return Math.max(0, Math.min(100, Number(value.toFixed(2))));
}

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

.server-health__skeleton {
  padding: 8px 0;
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

.server-health__checks {
  display: grid;
  gap: 10px;
}

.server-health__check-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
  color: var(--text-secondary);
}

.server-health__alert {
  margin-top: 16px;
}

.server-health__warnings {
  margin: 0;
  padding-left: 18px;
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
