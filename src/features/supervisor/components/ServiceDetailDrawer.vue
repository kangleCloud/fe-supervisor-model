<template>
  <el-drawer
    :model-value="modelValue"
    size="720px"
    title="服务详情"
    @close="emit('update:modelValue', false)"
  >
    <div v-if="loading" class="service-detail__loading">
      <el-skeleton :rows="14" animated />
    </div>

    <template v-else-if="detail">
      <el-alert
        v-if="detail.isArchived"
        title="只读归档"
        description="该服务已归档，不可执行同步等纳管操作。"
        type="info"
        :closable="false"
        show-icon
        class="service-detail__archived-alert"
      />

      <div class="service-detail__toolbar">
        <StatusTag :state="detail.status" />
        <ManageModeTag :mode="detail.manageMode" />
        <el-tag v-if="detail.isArchived" type="danger" effect="plain">已归档</el-tag>
        <el-button
          v-if="!detail.isArchived"
          :icon="Refresh"
          size="small"
          plain
          :loading="syncing"
          @click="handleSync"
        >
          同步现场
        </el-button>
      </div>

      <section class="service-detail__section">
        <div class="page__section-header">
          <div>
            <h3 class="page__section-title">基础信息</h3>
            <p class="page__section-subtitle">{{ detail.programName }}</p>
          </div>
        </div>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="主机">{{ detail.hostName || detail.host }}</el-descriptions-item>
          <el-descriptions-item label="纳管模式">
            <ManageModeTag :mode="detail.manageMode" />
          </el-descriptions-item>
          <el-descriptions-item label="配置路径">{{ detail.configPath }}</el-descriptions-item>
          <el-descriptions-item label="文件名称">{{ detail.fileName }}</el-descriptions-item>
          <el-descriptions-item label="程序名（配置中）">{{ detail.programName }}</el-descriptions-item>
          <el-descriptions-item label="归档状态">{{ detail.isArchived ? '已归档' : '未归档' }}</el-descriptions-item>
          <el-descriptions-item label="归档时间">{{ detail.archivedAt || '-' }}</el-descriptions-item>
          <el-descriptions-item label="还原时间">{{ detail.restoredAt || '-' }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ detail.updatedAt || '-' }}</el-descriptions-item>
        </el-descriptions>
      </section>

      <section class="service-detail__section">
        <div class="page__section-header">
          <div>
            <h3 class="page__section-title">模板信息</h3>
          </div>
        </div>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="Job">{{ detail.jobName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="Module">{{ detail.moduleName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="Java 路径">{{ detail.javaPath || '-' }}</el-descriptions-item>
          <el-descriptions-item label="环境">{{ detail.active || '-' }}</el-descriptions-item>
          <el-descriptions-item label="端口">{{ detail.port != null ? detail.port : '-' }}</el-descriptions-item>
          <el-descriptions-item label="Jar">{{ detail.jarName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="Xms">{{ detail.xms || '-' }}</el-descriptions-item>
          <el-descriptions-item label="Xmx">{{ detail.xmx || '-' }}</el-descriptions-item>
          <el-descriptions-item label="User">{{ detail.user || '-' }}</el-descriptions-item>
          <el-descriptions-item label="元数据完整">{{ detail.metadataComplete ? '是' : '否' }}</el-descriptions-item>
        </el-descriptions>
        <div v-if="detail.parseWarnings.length" class="service-detail__warnings-section">
          <div class="service-detail__warnings-label">解析告警</div>
          <div class="service-detail__warnings">
            <el-tag v-for="w in detail.parseWarnings" :key="w" type="warning" effect="plain">{{ w }}</el-tag>
          </div>
        </div>
      </section>

      <section class="service-detail__section">
        <div class="page__section-header">
          <div>
            <h3 class="page__section-title">运行配置</h3>
          </div>
        </div>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="运行状态">
            <StatusTag :state="detail.status" />
          </el-descriptions-item>
          <el-descriptions-item label="PID">{{ detail.pid || '-' }}</el-descriptions-item>
          <el-descriptions-item label="Uptime">{{ detail.uptime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备份状态">{{ detail.hasBackup ? '有备份' : '无备份' }}</el-descriptions-item>
        </el-descriptions>
        <el-descriptions :column="1" border class="service-detail__descriptions--compact">
          <el-descriptions-item label="Command">
            <code class="service-detail__inline-code">{{ detail.command || '-' }}</code>
          </el-descriptions-item>
          <el-descriptions-item label="Directory">
            <code class="service-detail__inline-code">{{ detail.directory || '-' }}</code>
          </el-descriptions-item>
          <el-descriptions-item label="Stdout Logfile">
            <code class="service-detail__inline-code">{{ detail.stdoutLogfile || '-' }}</code>
          </el-descriptions-item>
        </el-descriptions>
      </section>

      <section class="service-detail__section">
        <div class="page__section-header">
          <div>
            <h3 class="page__section-title">同步结果</h3>
          </div>
        </div>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="最近同步">{{ detail.lastSyncAt || '-' }}</el-descriptions-item>
          <el-descriptions-item label="同步状态">{{ detail.syncStatus || '-' }}</el-descriptions-item>
          <el-descriptions-item label="同步错误">
            <span v-if="detail.syncError" class="service-detail__error-text">{{ detail.syncError }}</span>
            <span v-else>-</span>
          </el-descriptions-item>
        </el-descriptions>
      </section>

      <section class="service-detail__section">
        <div class="page__section-header">
          <div>
            <h3 class="page__section-title">主配置内容</h3>
          </div>
        </div>
        <pre class="service-detail__content">{{ detail.configContent || '当前无配置快照' }}</pre>
      </section>

      <section v-if="detail.backupConfigContent" class="service-detail__section">
        <div class="page__section-header">
          <div>
            <h3 class="page__section-title">备份配置内容</h3>
          </div>
        </div>
        <pre class="service-detail__content">{{ detail.backupConfigContent }}</pre>
      </section>

      <OperationResultPanel
        :synced-fields="syncResult?.syncedFields"
        :warnings="syncResult?.warnings"
        :command-results="syncResult?.commandResults"
      />
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { Refresh } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { ref } from 'vue';

import { syncService } from '@/api/supervisor/supervisorApi';
import type { SupervisorServiceDetail, ServiceSyncResponse } from '@/api/supervisor/supervisor.types';
import StatusTag from '@/features/supervisor/components/StatusTag.vue';
import ManageModeTag from '@/features/supervisor/components/ManageModeTag.vue';
import OperationResultPanel from '@/features/supervisor/components/OperationResultPanel.vue';

const props = defineProps<{
  modelValue: boolean;
  loading: boolean;
  detail: SupervisorServiceDetail | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  sync: [detail: SupervisorServiceDetail];
}>();

const syncing = ref(false);
const syncResult = ref<ServiceSyncResponse | null>(null);

async function handleSync() {
  if (!props.detail) return;

  syncing.value = true;
  syncResult.value = null;

  try {
    const result = await syncService(props.detail.host, props.detail.programName);
    syncResult.value = result;
    ElMessage.success('同步完成');
    emit('sync', props.detail);
  } catch (error) {
    const message = error instanceof Error ? error.message : '同步失败';
    ElMessage.error(message);
  } finally {
    syncing.value = false;
  }
}
</script>

<style scoped>
.service-detail__loading {
  padding: 0 12px;
}

.service-detail__archived-alert {
  margin-bottom: 16px;
}

.service-detail__section + .service-detail__section {
  margin-top: 20px;
}

.service-detail__toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.service-detail__descriptions--compact {
  margin-top: 12px;
}

.service-detail__warnings-section {
  margin-top: 12px;
}

.service-detail__warnings-label {
  font-size: 13px;
  color: var(--text-tertiary);
  margin-bottom: 6px;
}

.service-detail__warnings {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.service-detail__error-text {
  color: var(--danger);
  font-size: 12px;
}

.service-detail__inline-code {
  font-family: 'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace;
  font-size: 12px;
  background: var(--surface-muted);
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--text-primary);
}

.service-detail__content {
  margin: 0;
  padding: 16px;
  border-radius: 8px;
  background: var(--shell-bg);
  color: #e5edf5;
  overflow: auto;
  font-family: 'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  max-height: 400px;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
