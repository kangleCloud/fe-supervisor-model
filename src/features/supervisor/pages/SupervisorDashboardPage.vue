<template>
  <div class="page">
    <section class="page__section">
      <div class="page__section-header">
        <div>
          <h2 class="page__section-title">运行概览</h2>
          <p class="page__section-subtitle">按主机与服务状态快速查看当前管控范围。</p>
        </div>
        <el-button :icon="Refresh" :loading="loadingHosts || loadingServices" plain @click="loadAll">
          刷新全部
        </el-button>
      </div>

      <div class="dashboard__metrics">
        <div class="dashboard__metric">
          <div class="dashboard__metric-label">主机总数</div>
          <div class="dashboard__metric-value">{{ metrics.hosts }}</div>
        </div>
        <div class="dashboard__metric">
          <div class="dashboard__metric-label">启用主机</div>
          <div class="dashboard__metric-value">{{ metrics.enabledHosts }}</div>
        </div>
        <div class="dashboard__metric">
          <div class="dashboard__metric-label">服务总数</div>
          <div class="dashboard__metric-value">{{ metrics.services }}</div>
        </div>
        <div class="dashboard__metric">
          <div class="dashboard__metric-label">运行中</div>
          <div class="dashboard__metric-value dashboard__metric-value--success">{{ metrics.running }}</div>
        </div>
      </div>
    </section>

    <section class="page__section">
      <div class="page__section-header">
        <div>
          <h2 class="page__section-title">主机与筛选</h2>
          <p class="page__section-subtitle">先选择目标主机，再执行服务层面的查询与操作。</p>
        </div>
        <div class="dashboard__header-actions">
          <el-button :icon="Plus" :disabled="!selectedHost || selectedHostRecord?.executorType === 'ansible'" type="primary" @click="openCreateDialog">
            新增服务
          </el-button>
          <el-button :icon="Upload" :disabled="!selectedHost" plain @click="openImportDialog">
            初始化导入
          </el-button>
        </div>
      </div>

      <div v-if="selectedHostRecord?.executorType === 'ansible'" class="dashboard__readonly-notice">
        <el-alert title="远端主机只读" type="info" :closable="false" show-icon>
          <template #default>
            <p>当前主机为 <code>ansible</code> 远端只读主机，不支持修改现场配置文件。</p>
            <p>如需查看远端服务，请先执行<strong>初始化导入</strong>，将现有配置快照写入数据库后再查看。</p>
          </template>
        </el-alert>
      </div>

      <div class="dashboard__filters">
        <el-select
          v-model="selectedHost"
          class="dashboard__host-select"
          placeholder="请选择主机"
          @change="onHostChange"
        >
          <el-option v-for="host in enabledHosts" :key="host.ip" :label="`${host.name} (${host.ip})`" :value="host.ip" />
        </el-select>

        <el-input v-model="keyword" :prefix-icon="Search" clearable placeholder="搜索 programName、configPath、Jar 名称" />

        <el-select v-model="statusFilter" placeholder="状态">
          <el-option label="全部状态" value="ALL" />
          <el-option label="RUNNING" value="RUNNING" />
          <el-option label="STOPPED" value="STOPPED" />
          <el-option label="STARTING" value="STARTING" />
          <el-option label="FATAL" value="FATAL" />
          <el-option label="EXITED" value="EXITED" />
        </el-select>
      </div>

      <div class="dashboard__host-meta">
        <div class="dashboard__host-meta-item">
          <span>主机名称</span>
          <strong>{{ selectedHostRecord?.name || '-' }}</strong>
        </div>
        <div class="dashboard__host-meta-item">
          <span>执行器</span>
          <strong>{{ selectedHostRecord?.executorType || '-' }}</strong>
        </div>
        <div class="dashboard__host-meta-item">
          <span>Ansible Pattern</span>
          <strong>{{ selectedHostRecord?.ansiblePattern || '-' }}</strong>
        </div>
      </div>
    </section>

    <section class="page__section">
      <div class="page__section-header">
        <div>
          <h2 class="page__section-title">服务列表</h2>
          <p class="page__section-subtitle">列表字段与后端 `/admin/api/supervisor/services` 的真实响应保持一致。</p>
        </div>
      </div>

      <el-alert
        v-if="!enabledHosts.length"
        title="后端主机白名单为空或全部被禁用，当前无法继续发起服务操作。"
        type="warning"
        :closable="false"
        show-icon
      />

      <template v-else>
        <el-table v-loading="loadingServices" :data="filteredServices" row-key="programName" class="dashboard__table">
          <el-table-column label="程序名" min-width="210">
            <template #default="{ row }">
              <div class="dashboard__program">
                <div class="dashboard__program-name">{{ row.programName }}</div>
                <div class="dashboard__program-meta">{{ row.configPath || row.configName }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="110">
            <template #default="{ row }">
              <StatusTag :state="row.status?.state" />
            </template>
          </el-table-column>
          <el-table-column label="文件状态" width="120">
            <template #default="{ row }">
              <FileStateTag :file-state="row.fileState" />
            </template>
          </el-table-column>
          <el-table-column label="纳管模式" width="110">
            <template #default="{ row }">
              <ManageModeTag :mode="row.manageMode" />
            </template>
          </el-table-column>
          <el-table-column prop="port" label="端口" width="80" />
          <el-table-column prop="active" label="环境" width="90" />
          <el-table-column prop="jarName" label="Jar 包" min-width="160" />
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="{ row }">
              <el-tooltip content="详情">
                <el-button circle plain :icon="View" @click="openDetail(row.programName)" />
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table>

        <template v-if="!loadingServices && !filteredServices.length">
          <div v-if="isRemoteHost">
            <EmptyState
              :icon="Upload"
              title="远端主机尚未导入"
              description="当前主机没有服务数据，请先执行初始化导入以扫描远端配置并写入数据库。"
            >
              <el-button type="primary" @click="openImportDialog">执行初始化导入</el-button>
            </EmptyState>
          </div>
          <EmptyState
            v-else
            :icon="Box"
            title="没有可显示的服务"
            description="调整筛选条件，或先创建一条新的服务配置。"
          />
        </template>
      </template>
    </section>

    <ServiceDetailDrawer v-model="detailVisible" :detail="currentDetail" :loading="loadingDetail" />

    <ServiceFormDialog
      v-model="formVisible"
      :initial-value="formDraft"
      :submitting="submittingForm"
      @submit="handleFormSubmit"
    />

    <ImportDialog
      v-model="importVisible"
      :host="selectedHost"
      :loading="importLoading"
      @done="onImportDone"
    />
  </div>
</template>

<script setup lang="ts">
import {
  Box,
  Plus,
  Refresh,
  Search,
  Upload,
  View,
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { computed, onMounted, ref } from 'vue';

import {
  createService,
  getServiceDetail,
  listHosts,
  listServices,
} from '@/api/supervisor/supervisorApi';
import type {
  ServiceCreatePayload,
  SupervisorHost,
  SupervisorServiceDetail,
  SupervisorServiceRecord,
} from '@/api/supervisor/supervisor.types';
import EmptyState from '@/components/EmptyState.vue';
import FileStateTag from '@/features/supervisor/components/FileStateTag.vue';
import ManageModeTag from '@/features/supervisor/components/ManageModeTag.vue';
import ServiceDetailDrawer from '@/features/supervisor/components/ServiceDetailDrawer.vue';
import ServiceFormDialog from '@/features/supervisor/components/ServiceFormDialog.vue';
import StatusTag from '@/features/supervisor/components/StatusTag.vue';
import {
  createEmptyServiceDraft,
} from '@/features/supervisor/utils/serviceDraft';
import ImportDialog from '@/features/supervisor/components/ImportDialog.vue';

const hosts = ref<SupervisorHost[]>([]);
const services = ref<SupervisorServiceRecord[]>([]);
const selectedHost = ref('');
const keyword = ref('');
const statusFilter = ref('ALL');
const loadingHosts = ref(false);
const loadingServices = ref(false);
const loadingDetail = ref(false);
const currentDetail = ref<SupervisorServiceDetail | null>(null);
const detailVisible = ref(false);
const formVisible = ref(false);
const formDraft = ref<ServiceCreatePayload>(createEmptyServiceDraft(''));
const submittingForm = ref(false);
const importVisible = ref(false);
const importLoading = ref(false);

const enabledHosts = computed(() => hosts.value.filter((host) => host.enabled));

const selectedHostRecord = computed(() => {
  return hosts.value.find((host) => host.ip === selectedHost.value) || null;
});

const isRemoteHost = computed(() => selectedHostRecord.value?.executorType === 'ansible');

const filteredServices = computed(() => {
  return services.value.filter((service) => {
    const normalizedKeyword = keyword.value.trim().toLowerCase();
    const state = service.status?.state?.toUpperCase() || 'UNKNOWN';

    const matchesKeyword =
      !normalizedKeyword ||
      service.programName.toLowerCase().includes(normalizedKeyword) ||
      (service.configPath && service.configPath.toLowerCase().includes(normalizedKeyword)) ||
      (service.jarName && service.jarName.toLowerCase().includes(normalizedKeyword));

    const matchesStatus = statusFilter.value === 'ALL' || state === statusFilter.value;

    return matchesKeyword && matchesStatus;
  });
});

const metrics = computed(() => {
  const running = services.value.filter((service) => service.status?.state?.toUpperCase() === 'RUNNING').length;

  return {
    hosts: hosts.value.length,
    enabledHosts: enabledHosts.value.length,
    services: services.value.length,
    running,
  };
});

onMounted(async () => {
  await loadAll();
});

async function loadAll() {
  await loadHosts();
  if (selectedHost.value) {
    await loadServices();
  }
}

async function loadHosts() {
  loadingHosts.value = true;

  try {
    hosts.value = await listHosts();

    if (!selectedHost.value) {
      selectedHost.value = enabledHosts.value[0]?.ip || hosts.value[0]?.ip || '';
    }
  } catch (error) {
    handleError(error, '加载主机列表失败');
  } finally {
    loadingHosts.value = false;
  }
}

async function loadServices() {
  if (!selectedHost.value) {
    services.value = [];
    return;
  }

  loadingServices.value = true;

  try {
    services.value = await listServices(selectedHost.value);
  } catch (error) {
    handleError(error, '加载服务列表失败');
  } finally {
    loadingServices.value = false;
  }
}

function onHostChange() {
  keyword.value = '';
  statusFilter.value = 'ALL';
  importVisible.value = false;
  void loadServices();
}

async function openDetail(programName: string) {
  if (!selectedHost.value) {
    return;
  }

  detailVisible.value = true;
  loadingDetail.value = true;
  currentDetail.value = null;

  try {
    currentDetail.value = await getServiceDetail(selectedHost.value, programName);
  } catch (error) {
    handleError(error, '加载服务详情失败');
  } finally {
    loadingDetail.value = false;
  }
}

function openCreateDialog() {
  formDraft.value = createEmptyServiceDraft(selectedHost.value);
  formVisible.value = true;
}

function openImportDialog() {
  importVisible.value = true;
}

async function handleFormSubmit(payload: ServiceCreatePayload) {
  submittingForm.value = true;

  try {
    await createService(payload);
    ElMessage.success('服务创建成功');
    formVisible.value = false;
    await loadServices();
  } catch (error) {
    handleError(error, '创建服务失败');
  } finally {
    submittingForm.value = false;
  }
}

function onImportDone() {
  void loadServices();
}

function handleError(error: unknown, fallbackMessage: string) {
  const message = error instanceof Error ? error.message : fallbackMessage;
  ElMessage.error(message || fallbackMessage);
}
</script>

<style scoped>
.dashboard__metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.dashboard__metric {
  min-height: 118px;
  padding: 18px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fcfcfd;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.dashboard__metric-label {
  font-size: 13px;
  color: #6b7280;
}

.dashboard__metric-value {
  font-size: 30px;
  font-weight: 700;
}

.dashboard__metric-value--success {
  color: #117a4d;
}

.dashboard__header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.dashboard__readonly-notice {
  margin-top: 16px;
}

.dashboard__filters {
  display: grid;
  grid-template-columns: minmax(220px, 280px) minmax(240px, 1fr) minmax(160px, 200px);
  gap: 12px;
  margin-top: 16px;
}

.dashboard__host-select {
  width: 100%;
}

.dashboard__host-meta {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.dashboard__host-meta-item {
  padding: 14px 16px;
  border-radius: 8px;
  background: #f7f8fa;
  border: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dashboard__host-meta-item span {
  color: #6b7280;
  font-size: 12px;
}

.dashboard__host-meta-item strong {
  font-size: 15px;
}

.dashboard__table {
  width: 100%;
}

.dashboard__program-name {
  font-weight: 600;
}

.dashboard__program-meta {
  color: #6b7280;
  font-size: 12px;
}

@media (max-width: 1280px) {
  .dashboard__metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1024px) {
  .dashboard__filters,
  .dashboard__host-meta {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .dashboard__metrics {
    grid-template-columns: 1fr;
  }
}
</style>
