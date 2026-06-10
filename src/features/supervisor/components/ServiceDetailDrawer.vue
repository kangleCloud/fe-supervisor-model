<template>
  <el-drawer
    :model-value="modelValue"
    size="700px"
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
          <div class="service-detail__status-group">
            <StatusTag :state="detail.status?.state" />
            <FileStateTag :file-state="detail.fileState" />
          </div>
        </div>

        <el-descriptions :column="2" border>
          <el-descriptions-item label="纳管模式">
            <ManageModeTag :mode="detail.manageMode" />
          </el-descriptions-item>
          <el-descriptions-item label="文件状态">
            <FileStateTag :file-state="detail.fileState" />
          </el-descriptions-item>
          <el-descriptions-item label="配置文件名">{{ detail.configName }}</el-descriptions-item>
          <el-descriptions-item label="文件名称">{{ detail.fileName }}</el-descriptions-item>
          <el-descriptions-item label="内容 ProgramName">{{ detail.contentProgramName }}</el-descriptions-item>
          <el-descriptions-item label="监听端口">{{ detail.port != null ? detail.port : '-' }}</el-descriptions-item>
          <el-descriptions-item label="Java 路径">{{ detail.javaPath || '-' }}</el-descriptions-item>
          <el-descriptions-item label="运行环境">{{ detail.active || '-' }}</el-descriptions-item>
          <el-descriptions-item label="Jar 包">{{ detail.jarName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="JVM">{{ detail.xms || '-' }} / {{ detail.xmx || '-' }}</el-descriptions-item>
          <el-descriptions-item label="运行用户">{{ detail.user || '-' }}</el-descriptions-item>
        </el-descriptions>
      </section>

      <section class="service-detail__section">
        <div class="page__section-header">
          <div>
            <h3 class="page__section-title">治理信息</h3>
          </div>
        </div>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="元数据完整">{{ detail.metadataComplete ? '是' : '否' }}</el-descriptions-item>
          <el-descriptions-item label="解析告警">
            <div v-if="detail.parseWarnings.length" class="service-detail__warnings">
              <el-tag v-for="w in detail.parseWarnings" :key="w" type="warning" effect="plain">{{ w }}</el-tag>
            </div>
            <span v-else>-</span>
          </el-descriptions-item>
        </el-descriptions>
      </section>

      <section class="service-detail__section">
        <div class="page__section-header">
          <div>
            <h3 class="page__section-title">配置文件基线</h3>
            <p class="page__section-subtitle">期望配置内容，用于比对远端现场</p>
          </div>
        </div>
        <pre class="service-detail__content">{{ detail.expectedContent }}</pre>
      </section>

      <section v-if="detail.remoteContent" class="service-detail__section">
        <div class="page__section-header">
          <div>
            <h3 class="page__section-title">现场配置内容</h3>
            <p class="page__section-subtitle service-detail__mismatch-hint">与基线不一致，请关注文件漂移</p>
          </div>
        </div>
        <pre class="service-detail__content">{{ detail.remoteContent }}</pre>
      </section>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import type { SupervisorServiceDetail } from '@/api/supervisor/supervisor.types';
import StatusTag from '@/features/supervisor/components/StatusTag.vue';
import FileStateTag from '@/features/supervisor/components/FileStateTag.vue';
import ManageModeTag from '@/features/supervisor/components/ManageModeTag.vue';

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

.service-detail__status-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.service-detail__warnings {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.service-detail__mismatch-hint {
  color: #e6a23c;
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
  max-height: 400px;
}
</style>
