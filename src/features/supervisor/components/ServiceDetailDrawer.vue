<template>
  <el-drawer
    :model-value="modelValue"
    size="620px"
    title="服务详情"
    @close="emit('update:modelValue', false)"
  >
    <div v-if="loading" class="service-detail__loading">
      <el-skeleton :rows="12" animated />
    </div>

    <template v-else-if="detail">
      <section class="service-detail__section">
        <div class="page__section-header">
          <div>
            <h3 class="page__section-title">{{ detail.programName }}</h3>
            <p class="page__section-subtitle">{{ detail.configPath }}</p>
          </div>
          <StatusTag :state="detail.status?.state" />
        </div>

        <el-descriptions :column="2" border>
          <el-descriptions-item label="配置文件">{{ detail.configName }}</el-descriptions-item>
          <el-descriptions-item label="监听端口">{{ detail.parsed.port }}</el-descriptions-item>
          <el-descriptions-item label="Java 路径">{{ detail.parsed.javaPath }}</el-descriptions-item>
          <el-descriptions-item label="运行环境">{{ detail.parsed.active }}</el-descriptions-item>
          <el-descriptions-item label="Jar 包">{{ detail.parsed.jarName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="JVM">{{ detail.parsed.xms }} / {{ detail.parsed.xmx }}</el-descriptions-item>
        </el-descriptions>
      </section>

      <section class="service-detail__section">
        <div class="page__section-header">
          <div>
            <h3 class="page__section-title">附加参数</h3>
            <p class="page__section-subtitle">从配置中提取的 option 列表</p>
          </div>
        </div>

        <div v-if="detail.parsed.options.length" class="service-detail__options">
          <el-tag v-for="option in detail.parsed.options" :key="option" effect="plain">{{ option }}</el-tag>
        </div>
        <EmptyState v-else :icon="CollectionTag" title="没有附加参数" description="当前配置没有解析到额外 option。" />
      </section>

      <section class="service-detail__section">
        <div class="page__section-header">
          <div>
            <h3 class="page__section-title">原始配置</h3>
            <p class="page__section-subtitle">只读展示，便于核对渲染结果</p>
          </div>
        </div>

        <pre class="service-detail__content">{{ detail.content }}</pre>
      </section>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { CollectionTag } from '@element-plus/icons-vue';

import type { SupervisorServiceDetail } from '@/api/supervisor/supervisor.types';
import EmptyState from '@/components/EmptyState.vue';
import StatusTag from '@/features/supervisor/components/StatusTag.vue';

defineProps<{
  modelValue: boolean;
  loading: boolean;
  detail: SupervisorServiceDetail | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();
</script>

<style scoped>
.service-detail__section + .service-detail__section {
  margin-top: 20px;
}

.service-detail__options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.service-detail__content {
  margin: 0;
  padding: 16px;
  border-radius: 8px;
  background: #0f1720;
  color: #e5edf5;
  overflow: auto;
  font-size: 13px;
  line-height: 1.6;
}
</style>
