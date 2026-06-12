<template>
  <div v-if="hasContent" class="op-result">
    <div class="op-result__header">
      <span class="op-result__title">操作结果</span>
      <el-button size="small" :icon="Close" text @click="emit('close')" />
    </div>

    <section v-if="syncedFields && syncedFields.length" class="op-result__section">
      <div class="op-result__section-title">同步字段</div>
      <div class="op-result__fields">
        <el-tag v-for="field in syncedFields" :key="field" effect="plain" size="small">{{ field }}</el-tag>
      </div>
    </section>

    <section v-if="warnings && warnings.length" class="op-result__section">
      <div class="op-result__section-title">告警</div>
      <div class="op-result__warnings">
        <el-tag v-for="w in warnings" :key="w" type="warning" effect="plain" size="small">{{ w }}</el-tag>
      </div>
    </section>

    <section v-if="normalizedSteps.length" class="op-result__section">
      <div class="op-result__section-title">命令执行结果</div>
      <div v-for="step in normalizedSteps" :key="step.key" class="op-result__step">
        <div class="op-result__step-header">
          <div>
            <span class="op-result__step-label">{{ step.label }}</span>
            <span v-if="step.description" class="op-result__step-description">{{ step.description }}</span>
          </div>
          <el-tag :type="step.exitCode === 0 ? 'success' : step.exitCode == null ? 'info' : 'danger'" size="small">
            {{ step.exitCode == null ? 'info' : `exit ${step.exitCode}` }}
          </el-tag>
        </div>
        <code v-if="step.stdout" class="op-result__code">{{ step.stdout }}</code>
        <code v-if="step.stderr" class="op-result__code op-result__code--stderr">{{ step.stderr }}</code>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { Close } from '@element-plus/icons-vue';
import { computed } from 'vue';

import type { OperationCommandPayload } from '@/api/supervisor/supervisor.types';

const props = defineProps<{
  syncedFields?: string[];
  warnings?: string[];
  commandResults?: OperationCommandPayload;
}>();

const emit = defineEmits<{
  close: [];
}>();

interface NormalizedStep {
  key: string;
  label: string;
  description: string;
  exitCode: number | null;
  stdout: string;
  stderr: string;
}

function formatPrimitive(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

function normalizeCommandPayload(payload: OperationCommandPayload | undefined): NormalizedStep[] {
  if (!payload) {
    return [];
  }

  if ('steps' in payload && Array.isArray(payload.steps)) {
    return payload.steps.map((step, index) => ({
      key: `step-${index}`,
      label: `Step ${index + 1}`,
      description: step.backupPath || step.configPath || step.path || '',
      exitCode: step.exitCode ?? null,
      stdout: step.stdout || '',
      stderr: step.stderr || '',
    }));
  }

  if ('exitCode' in payload || 'stdout' in payload || 'stderr' in payload) {
    return [{
      key: 'single',
      label: '命令结果',
      description: formatPrimitive(payload.backupPath) || formatPrimitive(payload.configPath) || formatPrimitive(payload.path),
      exitCode: typeof payload.exitCode === 'number' ? payload.exitCode : null,
      stdout: formatPrimitive(payload.stdout),
      stderr: formatPrimitive(payload.stderr),
    }];
  }

  return Object.entries(payload).map(([key, value]) => {
    const typedValue = value && typeof value === 'object' ? value as Record<string, unknown> : {};
    const lines: string[] = [];

    for (const [field, fieldValue] of Object.entries(typedValue)) {
      if (field === 'stdout' || field === 'stderr' || field === 'exitCode') {
        continue;
      }
      if (fieldValue == null || fieldValue === '') {
        continue;
      }
      if (typeof fieldValue === 'object') {
        lines.push(`${field}: ${JSON.stringify(fieldValue)}`);
        continue;
      }
      lines.push(`${field}: ${String(fieldValue)}`);
    }

    return {
      key,
      label: key,
      description: '',
      exitCode: typeof typedValue.exitCode === 'number' ? typedValue.exitCode : null,
      stdout: typeof typedValue.stdout === 'string' ? typedValue.stdout : lines.join('\n'),
      stderr: typeof typedValue.stderr === 'string' ? typedValue.stderr : '',
    };
  });
}

const normalizedSteps = computed(() => normalizeCommandPayload(props.commandResults));

const hasContent = computed(() =>
  (props.syncedFields && props.syncedFields.length > 0)
  || (props.warnings && props.warnings.length > 0)
  || normalizedSteps.value.length > 0,
);
</script>

<style scoped>
.op-result {
  margin-top: 16px;
  padding: 16px;
  background: var(--surface-muted);
  border: 1px solid var(--surface-strong);
  border-radius: 8px;
}

.op-result__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.op-result__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.op-result__section {
  margin-bottom: 12px;
}

.op-result__section:last-child {
  margin-bottom: 0;
}

.op-result__section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.op-result__fields,
.op-result__warnings {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.op-result__step {
  margin-bottom: 8px;
  padding: 10px;
  background: var(--surface);
  border: 1px solid var(--surface-strong);
  border-radius: 6px;
}

.op-result__step:last-child {
  margin-bottom: 0;
}

.op-result__step-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.op-result__step-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: capitalize;
}

.op-result__step-description {
  display: block;
  margin-top: 2px;
  font-size: 12px;
  color: var(--text-secondary);
  font-family: 'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace;
}

.op-result__code {
  display: block;
  padding: 8px;
  margin: 0;
  background: var(--shell-bg);
  color: #e5edf5;
  border-radius: 4px;
  font-family: 'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}

.op-result__code--stderr {
  margin-top: 4px;
  background: #2d1414;
  color: #f5c6c6;
}
</style>
