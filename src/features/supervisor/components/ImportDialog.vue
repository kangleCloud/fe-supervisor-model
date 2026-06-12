<template>
  <el-dialog
    :model-value="modelValue"
    title="初始化导入"
    width="900px"
    top="5vh"
    @close="handleClose"
  >
    <div class="import-dialog">
      <p class="import-dialog__host">
        目标主机：<strong>{{ host }}</strong>
      </p>

      <el-alert
        v-if="report?.summary.skipped"
        title="存在跳过项"
        description="预检结果包含 SKIPPED 项，需先处理这些配置后才能提交导入。"
        type="warning"
        :closable="false"
        show-icon
        class="import-dialog__alert"
      />

      <div v-if="report" class="import-dialog__result">
        <section class="import-dialog__section">
          <div class="page__section-header">
            <div>
              <h3 class="page__section-title">导入汇总</h3>
              <p class="page__section-subtitle">当前批次：{{ report.batchId }}</p>
            </div>
          </div>
          <div class="import-dialog__summary">
            <div class="import-dialog__summary-item">
              <span class="import-dialog__summary-label">预检通过</span>
              <span class="import-dialog__summary-value">{{ report.summary.planned }}</span>
            </div>
            <div class="import-dialog__summary-item">
              <span class="import-dialog__summary-label">新增</span>
              <span class="import-dialog__summary-value">{{ report.summary.imported }}</span>
            </div>
            <div class="import-dialog__summary-item">
              <span class="import-dialog__summary-label">更新</span>
              <span class="import-dialog__summary-value">{{ report.summary.updated }}</span>
            </div>
            <div class="import-dialog__summary-item">
              <span class="import-dialog__summary-label">跳过</span>
              <span class="import-dialog__summary-value">{{ report.summary.skipped }}</span>
            </div>
          </div>
        </section>

        <section class="import-dialog__section">
          <div class="page__section-header">
            <div>
              <h3 class="page__section-title">逐文件结果</h3>
              <p class="page__section-subtitle">按后端返回顺序展示</p>
            </div>
          </div>

          <el-table :data="report.items" row-key="configPath" max-height="400">
            <el-table-column prop="configPath" label="配置路径" min-width="220" show-overflow-tooltip />
            <el-table-column prop="fileName" label="文件名" width="160" />
            <el-table-column prop="programName" label="Program" width="180" show-overflow-tooltip />
            <el-table-column label="结果" width="110">
              <template #default="{ row }">
                <ImportResultTag :result="row.result" />
              </template>
            </el-table-column>
            <el-table-column label="元数据完整" width="110">
              <template #default="{ row }">
                <span>{{ row.metadataComplete ? '是' : '否' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="message" label="消息" min-width="240" show-overflow-tooltip />
          </el-table>
        </section>
      </div>
    </div>

    <template #footer>
      <div class="import-dialog__actions">
        <el-button v-if="!report" :loading="internalLoading" :icon="View" @click="handlePrecheck">
          预检导入
        </el-button>
        <template v-else>
          <el-button @click="handleClose">关闭</el-button>
          <el-button
            v-if="canCommit"
            type="primary"
            :loading="internalLoading"
            @click="handleCommit"
          >
            确认导入
          </el-button>
          <el-tag v-else-if="report.mode === 'COMMIT'" type="success" effect="plain">
            导入完成
          </el-tag>
          <el-tag v-else-if="report.summary.planned === 0" type="info" effect="plain">
            无可导入的文件
          </el-tag>
          <el-tag v-else-if="report.summary.skipped > 0" type="warning" effect="plain">
            存在跳过项，禁止提交
          </el-tag>
        </template>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { View } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { computed, ref, watch } from 'vue';

import { importServices } from '@/api/supervisor/supervisorApi';
import type { ImportReport } from '@/api/supervisor/supervisor.types';
import ImportResultTag from '@/features/supervisor/components/ImportResultTag.vue';

const props = defineProps<{
  modelValue: boolean;
  host: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  done: [];
}>();

const report = ref<ImportReport | null>(null);
const batchId = ref('');
const internalLoading = ref(false);

const canCommit = computed(() => (
  report.value?.mode === 'PRECHECK'
  && report.value.summary.planned > 0
  && report.value.summary.skipped === 0
  && !!batchId.value
));

watch(
  () => props.host,
  () => {
    resetState();
  },
);

async function handlePrecheck() {
  internalLoading.value = true;

  try {
    report.value = await importServices({ host: props.host, mode: 'PRECHECK' });
    batchId.value = report.value.batchId;
    ElMessage.success(`预检完成，共 ${report.value.summary.planned} 个文件待导入`);
  } catch (error) {
    handleError(error, '预检失败');
  } finally {
    internalLoading.value = false;
  }
}

async function handleCommit() {
  if (!report.value || !batchId.value) {
    return;
  }

  if (report.value.summary.skipped > 0) {
    ElMessage.warning('存在 SKIPPED 项，无法继续提交导入');
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确认将 ${report.value.summary.planned} 个配置写入数据库吗？此操作不可撤销。`,
      '确认导入',
      {
        type: 'warning',
        confirmButtonText: '确认导入',
        cancelButtonText: '取消',
      },
    );
  } catch {
    return;
  }

  internalLoading.value = true;

  try {
    report.value = await importServices({ host: props.host, mode: 'COMMIT', batchId: batchId.value });
    ElMessage.success('导入成功');
    emit('done');
  } catch (error) {
    handleError(error, '导入失败');
  } finally {
    internalLoading.value = false;
  }
}

function resetState() {
  report.value = null;
  batchId.value = '';
}

function handleClose() {
  resetState();
  emit('update:modelValue', false);
}

function handleError(error: unknown, fallbackMessage: string) {
  const message = error instanceof Error ? error.message : fallbackMessage;
  ElMessage.error(message || fallbackMessage);
}
</script>

<style scoped>
.import-dialog__host {
  margin: 0 0 20px;
  font-size: 14px;
  color: var(--text-tertiary);
}

.import-dialog__alert {
  margin-bottom: 16px;
}

.import-dialog__result {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.import-dialog__summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.import-dialog__summary-item {
  padding: 16px;
  border: 1px solid var(--surface-strong);
  border-radius: 8px;
  background: var(--surface);
  text-align: center;
}

.import-dialog__summary-label {
  display: block;
  font-size: 13px;
  color: var(--text-tertiary);
  margin-bottom: 8px;
}

.import-dialog__summary-value {
  font-size: 28px;
  font-weight: 700;
}

.import-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .import-dialog__summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
