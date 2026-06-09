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

      <div v-if="report" class="import-dialog__result">
        <section class="import-dialog__section">
          <div class="page__section-header">
            <div>
              <h3 class="page__section-title">导入汇总</h3>
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
            <el-table-column prop="programName" label="Program" width="160" show-overflow-tooltip />
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
        <el-button v-if="!report" :loading="loading" :icon="View" @click="handleDryRun">
          预检导入
        </el-button>
        <template v-else>
          <el-button @click="handleClose">关闭</el-button>
          <el-button
            v-if="report.mode === 'DRY_RUN' && report.summary.planned > 0"
            type="primary"
            @click="handleApply"
          >
            确认导入
          </el-button>
          <el-tag v-else-if="report.mode === 'APPLY'" type="success" effect="plain">
            导入完成
          </el-tag>
          <el-tag v-else-if="report.summary.planned === 0" type="info" effect="plain">
            无可导入的文件
          </el-tag>
        </template>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { View } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ref } from 'vue';

import { importServices } from '@/api/supervisor/supervisorApi';
import type { ImportReport } from '@/api/supervisor/supervisor.types';
import ImportResultTag from '@/features/supervisor/components/ImportResultTag.vue';

const props = defineProps<{
  modelValue: boolean;
  host: string;
  loading: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  done: [];
}>();

const report = ref<ImportReport | null>(null);
const internalLoading = ref(false);

async function handleDryRun() {
  internalLoading.value = true;

  try {
    report.value = await importServices({ host: props.host, mode: 'DRY_RUN' });
    ElMessage.success(`预检完成，共 ${report.value.summary.planned} 个文件待导入`);
  } catch (error) {
    handleError(error, '预检失败');
  } finally {
    internalLoading.value = false;
  }
}

async function handleApply() {
  try {
    await ElMessageBox.confirm(
      `确认将 ${report.value?.summary.planned || 0} 个配置写入数据库吗？此操作不可撤销。`,
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
    report.value = await importServices({ host: props.host, mode: 'APPLY' });
    ElMessage.success('导入成功');
    emit('done');
  } catch (error) {
    handleError(error, '导入失败');
  } finally {
    internalLoading.value = false;
  }
}

function handleClose() {
  report.value = null;
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
  color: #6b7280;
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
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fcfcfd;
  text-align: center;
}

.import-dialog__summary-label {
  display: block;
  font-size: 13px;
  color: #6b7280;
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
}
</style>
