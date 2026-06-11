<template>
  <div v-if="hasContent" class="op-result">
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

    <section v-if="commandResults?.steps?.length" class="op-result__section">
      <div class="op-result__section-title">命令执行结果</div>
      <div v-for="(step, index) in commandResults.steps" :key="index" class="op-result__step">
        <div class="op-result__step-header">
          <span class="op-result__step-label">Step {{ index + 1 }}</span>
          <el-tag :type="step.exitCode === 0 ? 'success' : 'danger'" size="small">
            exit {{ step.exitCode }}
          </el-tag>
        </div>
        <code v-if="step.stdout" class="op-result__code">{{ step.stdout }}</code>
        <code v-if="step.stderr" class="op-result__code op-result__code--stderr">{{ step.stderr }}</code>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import type { CommandResults } from '@/api/supervisor/supervisor.types';

const props = defineProps<{
  syncedFields?: string[];
  warnings?: string[];
  commandResults?: CommandResults;
}>();

const hasContent = computed(() =>
  (props.syncedFields && props.syncedFields.length > 0) ||
  (props.warnings && props.warnings.length > 0) ||
  (props.commandResults?.steps && props.commandResults.steps.length > 0),
);
</script>

<style scoped>
.op-result {
  margin-top: 16px;
  padding: 16px;
  background: #f7f8fa;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
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
  color: #374151;
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
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.op-result__step:last-child {
  margin-bottom: 0;
}

.op-result__step-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.op-result__step-label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
}

.op-result__code {
  display: block;
  padding: 8px;
  margin: 0;
  background: #162028;
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
