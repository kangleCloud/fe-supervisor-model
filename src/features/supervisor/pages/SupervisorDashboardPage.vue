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
          <el-button :icon="Plus" :disabled="!selectedHost" type="primary" @click="openCreateDialog">
            新增服务
          </el-button>
          <el-button :icon="RefreshLeft" :disabled="!selectedHost" plain @click="handleReread">reread</el-button>
          <el-button :icon="RefreshRight" :disabled="!selectedHost" plain @click="handleUpdate">update</el-button>
        </div>
      </div>

      <div class="dashboard__filters">
        <el-select
          v-model="selectedHost"
          class="dashboard__host-select"
          placeholder="请选择主机"
          @change="loadServices"
        >
          <el-option v-for="host in enabledHosts" :key="host.ip" :label="`${host.name} (${host.ip})`" :value="host.ip" />
        </el-select>

        <el-input v-model="keyword" :prefix-icon="Search" clearable placeholder="搜索 programName、configName、Jar 名称" />

        <el-select v-model="statusFilter" placeholder="状态">
          <el-option label="全部状态" value="ALL" />
          <el-option label="RUNNING" value="RUNNING" />
          <el-option label="STOPPED" value="STOPPED" />
          <el-option label="STARTING" value="STARTING" />
          <el-option label="FATAL" value="FATAL" />
          <el-option label="EXITED" value="EXITED" />
        </el-select>
      </div>

      <div v-if="selectedHostRecord" class="dashboard__host-meta">
        <div class="dashboard__host-meta-item">
          <span>主机名称</span>
          <strong>{{ selectedHostRecord.name }}</strong>
        </div>
        <div class="dashboard__host-meta-item">
          <span>执行器</span>
          <strong>{{ selectedHostRecord.executorType }}</strong>
        </div>
        <div class="dashboard__host-meta-item">
          <span>Ansible Pattern</span>
          <strong>{{ selectedHostRecord.ansiblePattern || '-' }}</strong>
        </div>
      </div>
    </section>

    <section class="page__section">
      <div class="page__section-header">
        <div>
          <h2 class="page__section-title">服务列表</h2>
          <p class="page__section-subtitle">列表字段与后端 `/api/supervisor/services` 的真实响应保持一致。</p>
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
                <div class="dashboard__program-meta">{{ row.configName }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="120">
            <template #default="{ row }">
              <StatusTag :state="row.status?.state" />
            </template>
          </el-table-column>
          <el-table-column prop="port" label="端口" width="100" />
          <el-table-column prop="active" label="环境" width="110" />
          <el-table-column prop="jarName" label="Jar 包" min-width="160" />
          <el-table-column prop="javaPath" label="Java 路径" min-width="240" show-overflow-tooltip />
          <el-table-column label="操作" width="340" fixed="right">
            <template #default="{ row }">
              <div class="dashboard__row-actions">
                <el-tooltip content="详情">
                  <el-button circle plain :icon="View" @click="openDetail(row.programName)" />
                </el-tooltip>
                <el-tooltip content="启动">
                  <el-button circle plain :icon="VideoPlay" @click="handleServiceCommand('start', row.programName)" />
                </el-tooltip>
                <el-tooltip content="停止">
                  <el-button circle plain :icon="VideoPause" @click="handleServiceCommand('stop', row.programName)" />
                </el-tooltip>
                <el-tooltip content="重启">
                  <el-button circle plain :icon="RefreshRight" @click="handleServiceCommand('restart', row.programName)" />
                </el-tooltip>
                <el-tooltip content="备份">
                  <el-button circle plain :icon="DocumentCopy" @click="handleBackup(row.programName)" />
                </el-tooltip>
                <el-tooltip content="还原">
                  <el-button circle plain :icon="RefreshLeft" @click="handleRestore(row.programName)" />
                </el-tooltip>
                <el-tooltip content="编辑">
                  <el-button circle plain :icon="EditPen" @click="openEditDialog(row)" />
                </el-tooltip>
                <el-tooltip content="删除">
                  <el-button circle plain type="danger" :icon="Delete" @click="handleDelete(row.programName)" />
                </el-tooltip>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <EmptyState
          v-if="!loadingServices && !filteredServices.length"
          :icon="Box"
          title="没有可显示的服务"
          description="调整筛选条件，或先创建一条新的服务配置。"
        />
      </template>
    </section>

    <ServiceDetailDrawer v-model="detailVisible" :detail="currentDetail" :loading="loadingDetail" />

    <ServiceFormDialog
      v-model="formVisible"
      :initial-value="formDraft"
      :mode="formMode"
      :submitting="submittingForm"
      @submit="handleFormSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import {
  Box,
  Delete,
  DocumentCopy,
  EditPen,
  Plus,
  Refresh,
  RefreshLeft,
  RefreshRight,
  Search,
  VideoPause,
  VideoPlay,
  View,
} from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { computed, onMounted, ref } from 'vue';

import {
  backupService,
  createService,
  deleteService,
  getServiceDetail,
  listHosts,
  listServices,
  reread,
  restartService,
  restoreService,
  startService,
  stopService,
  update as updateHost,
  updateService,
} from '@/api/supervisor/supervisorApi';
import type {
  ServiceUpsertPayload,
  SupervisorHost,
  SupervisorServiceDetail,
  SupervisorServiceRecord,
} from '@/api/supervisor/supervisor.types';
import EmptyState from '@/components/EmptyState.vue';
import ServiceDetailDrawer from '@/features/supervisor/components/ServiceDetailDrawer.vue';
import ServiceFormDialog from '@/features/supervisor/components/ServiceFormDialog.vue';
import StatusTag from '@/features/supervisor/components/StatusTag.vue';
import {
  buildDraftFromService,
  createEmptyServiceDraft,
} from '@/features/supervisor/utils/serviceDraft';

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
const formMode = ref<'create' | 'edit'>('create');
const formDraft = ref<ServiceUpsertPayload>(createEmptyServiceDraft(''));
const editingProgramName = ref('');
const submittingForm = ref(false);

const enabledHosts = computed(() => hosts.value.filter((host) => host.enabled));

const selectedHostRecord = computed(() => {
  return hosts.value.find((host) => host.ip === selectedHost.value) || null;
});

const filteredServices = computed(() => {
  return services.value.filter((service) => {
    const normalizedKeyword = keyword.value.trim().toLowerCase();
    const state = service.status?.state?.toUpperCase() || 'UNKNOWN';

    const matchesKeyword =
      !normalizedKeyword ||
      service.programName.toLowerCase().includes(normalizedKeyword) ||
      service.configName.toLowerCase().includes(normalizedKeyword) ||
      service.jarName.toLowerCase().includes(normalizedKeyword);

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
  formMode.value = 'create';
  editingProgramName.value = '';
  formDraft.value = createEmptyServiceDraft(selectedHost.value);
  formVisible.value = true;
}

async function openEditDialog(service: SupervisorServiceRecord) {
  if (!selectedHost.value) {
    return;
  }

  try {
    const detail = await getServiceDetail(selectedHost.value, service.programName);
    formMode.value = 'edit';
    editingProgramName.value = service.programName;
    formDraft.value = buildDraftFromService(selectedHost.value, detail);
    formVisible.value = true;
  } catch (error) {
    handleError(error, '加载服务详情失败');
  }
}

async function handleFormSubmit(payload: ServiceUpsertPayload) {
  submittingForm.value = true;

  try {
    if (formMode.value === 'create') {
      await createService(payload);
      ElMessage.success('服务创建成功');
    } else {
      await updateService(editingProgramName.value, payload);
      ElMessage.success('服务更新成功');
    }

    formVisible.value = false;
    await loadServices();
  } catch (error) {
    handleError(error, formMode.value === 'create' ? '创建服务失败' : '更新服务失败');
  } finally {
    submittingForm.value = false;
  }
}

async function handleServiceCommand(command: 'start' | 'stop' | 'restart', programName: string) {
  if (!selectedHost.value) {
    return;
  }

  try {
    const payload = { host: selectedHost.value };

    if (command === 'start') {
      await startService(payload, programName);
      ElMessage.success('启动命令已发送');
    }

    if (command === 'stop') {
      await stopService(payload, programName);
      ElMessage.success('停止命令已发送');
    }

    if (command === 'restart') {
      await restartService(payload, programName);
      ElMessage.success('重启命令已发送');
    }

    await loadServices();
  } catch (error) {
    handleError(error, `${command} 命令执行失败`);
  }
}

async function handleBackup(programName: string) {
  if (!selectedHost.value) {
    return;
  }

  try {
    await backupService({ host: selectedHost.value }, programName);
    ElMessage.success('备份成功');
  } catch (error) {
    handleError(error, '备份失败');
  }
}

async function handleRestore(programName: string) {
  if (!selectedHost.value) {
    return;
  }

  try {
    await restoreService({ host: selectedHost.value }, programName);
    ElMessage.success('还原成功');
    await loadServices();
  } catch (error) {
    handleError(error, '还原失败');
  }
}

async function handleDelete(programName: string) {
  if (!selectedHost.value) {
    return;
  }

  try {
    await ElMessageBox.confirm(`确认删除服务 ${programName} 吗？该操作会先自动备份原配置。`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    });

    await deleteService(selectedHost.value, programName, false);
    ElMessage.success('删除成功');
    await loadServices();
  } catch (error) {
    if (error === 'cancel') {
      return;
    }

    handleError(error, '删除失败');
  }
}

async function handleReread() {
  if (!selectedHost.value) {
    return;
  }

  try {
    await reread({ host: selectedHost.value });
    ElMessage.success('reread 已执行');
    await loadServices();
  } catch (error) {
    handleError(error, '执行 reread 失败');
  }
}

async function handleUpdate() {
  if (!selectedHost.value) {
    return;
  }

  try {
    await updateHost({ host: selectedHost.value });
    ElMessage.success('update 已执行');
    await loadServices();
  } catch (error) {
    handleError(error, '执行 update 失败');
  }
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

.dashboard__filters {
  display: grid;
  grid-template-columns: minmax(220px, 280px) minmax(240px, 1fr) minmax(160px, 200px);
  gap: 12px;
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

.dashboard__row-actions {
  display: flex;
  gap: 8px;
  flex-wrap: nowrap;
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
