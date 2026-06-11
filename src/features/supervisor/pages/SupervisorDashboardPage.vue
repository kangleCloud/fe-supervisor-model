<template>
  <div class="page">
    <section class="page__section dashboard__kpis">
      <div class="dashboard__kpi">
        <div class="dashboard__kpi-label">主机总数</div>
        <div class="dashboard__kpi-value">{{ metrics.hosts }}</div>
      </div>
      <div class="dashboard__kpi">
        <div class="dashboard__kpi-label">当前页结果</div>
        <div class="dashboard__kpi-value">{{ metrics.services }}</div>
      </div>
      <div class="dashboard__kpi">
        <div class="dashboard__kpi-label">运行中</div>
        <div class="dashboard__kpi-value dashboard__kpi-value--success">{{ metrics.running }}</div>
      </div>
      <div class="dashboard__kpi">
        <div class="dashboard__kpi-label">已归档</div>
        <div class="dashboard__kpi-value dashboard__kpi-value--muted">{{ metrics.archived }}</div>
      </div>
    </section>

    <section class="page__section">
      <div class="page__section-header">
        <div>
          <h2 class="page__section-title">主机与筛选</h2>
          <p class="page__section-subtitle">选择主机、筛选条件查看纳管服务。</p>
        </div>
      </div>

      <div class="dashboard__filter-bar">
        <el-select
          v-model="selectedHost"
          class="dashboard__host-select"
          placeholder="请选择主机"
          @change="onHostChange"
        >
          <el-option
            v-for="h in enabledHosts"
            :key="h.ip"
            :label="`${h.name} (${h.ip})`"
            :value="h.ip"
          />
        </el-select>

        <el-input
          v-model="keyword"
          :prefix-icon="Search"
          clearable
          placeholder="搜索 programName、configName、jobName、moduleName、port"
          @keyup.enter="handleSearch"
        />

        <el-select v-model="statusFilter" placeholder="状态" @change="handleStatusChange">
          <el-option label="全部状态" value="ALL" />
          <el-option label="RUNNING" value="RUNNING" />
          <el-option label="STOPPED" value="STOPPED" />
          <el-option label="STARTING" value="STARTING" />
          <el-option label="STOPPING" value="STOPPING" />
          <el-option label="BACKOFF" value="BACKOFF" />
          <el-option label="FATAL" value="FATAL" />
          <el-option label="EXITED" value="EXITED" />
          <el-option label="UNKNOWN" value="UNKNOWN" />
        </el-select>

        <el-radio-group v-model="archiveFilter" @change="handleSearch">
          <el-radio-button value="false">活跃</el-radio-button>
          <el-radio-button value="true">已归档</el-radio-button>
          <el-radio-button value="all">全部</el-radio-button>
        </el-radio-group>

        <div class="dashboard__filter-actions">
          <el-button :icon="Search" type="primary" @click="handleSearch">查询</el-button>
          <el-button plain @click="handleResetFilters">重置</el-button>
        </div>
      </div>
    </section>

    <section class="page__section">
      <div class="page__section-header">
        <div>
          <h2 class="page__section-title">服务操作</h2>
        </div>
        <div class="dashboard__header-actions">
          <el-button :icon="Plus" type="primary" :disabled="!selectedHost" @click="openCreateDialog">
            新增服务
          </el-button>
          <el-button :icon="Upload" :disabled="!selectedHost" plain @click="openImportDialog">
            初始化导入
          </el-button>
          <el-button
            :icon="RefreshRight"
            :disabled="!selectedHost"
            :loading="refreshingStatus"
            plain
            @click="handleRefreshStatus"
          >
            刷新状态
          </el-button>
        </div>
      </div>
    </section>

    <section class="page__section">
      <div class="page__section-header">
        <div>
          <h2 class="page__section-title">服务列表</h2>
          <p class="page__section-subtitle">
            列表字段与后端真实响应保持一致。每行操作根据运行状态控制可用动作。
          </p>
        </div>
      </div>

      <el-alert
        v-if="!enabledHosts.length"
        title="后端主机白名单为空或全部被禁用。"
        type="warning"
        :closable="false"
        show-icon
      />

      <template v-else>
        <el-table
          v-loading="loadingServices"
          :data="serviceRecords"
          row-key="programName"
          class="dashboard__table"
          highlight-current-row
          :row-class-name="getRowClass"
        >
          <el-table-column label="程序名" min-width="200">
            <template #default="{ row }">
              <div class="dashboard__program">
                <div class="dashboard__program-name">{{ row.programName }}</div>
                <div class="dashboard__program-meta">{{ row.configPath || row.configName }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="纳管模式" width="110">
            <template #default="{ row }">
              <ManageModeTag :mode="row.manageMode" />
            </template>
          </el-table-column>
          <el-table-column label="状态" width="110">
            <template #default="{ row }">
              <StatusTag :state="row.status" />
            </template>
          </el-table-column>
          <el-table-column prop="pid" label="PID" width="80" />
          <el-table-column prop="uptime" label="Uptime" width="100" />
          <el-table-column prop="port" label="端口" width="70" />
          <el-table-column prop="active" label="环境" width="80" />
          <el-table-column prop="jarName" label="Jar" min-width="150" />
          <el-table-column label="归档" width="80">
            <template #default="{ row }">
              <el-tag v-if="row.isArchived" type="danger" size="small" effect="plain">是</el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="updateTime" label="更新时间" width="170" />
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <div v-if="row.isArchived" class="dashboard__row-actions">
                <el-tooltip content="详情">
                  <el-button circle plain :icon="View" size="small" data-testid="action-detail" @click="openDetail(row.programName)" />
                </el-tooltip>
                <el-tooltip content="还原">
                  <el-button
                    circle
                    plain
                    :icon="RefreshLeft"
                    size="small"
                    data-testid="action-restore"
                    @click="handleAction('restore', row)"
                  />
                </el-tooltip>
              </div>
              <div v-else class="dashboard__row-actions">
                <el-tooltip content="详情">
                  <el-button circle plain :icon="View" size="small" data-testid="action-detail" @click="openDetail(row.programName)" />
                </el-tooltip>
                <el-tooltip content="同步">
                  <el-button
                    circle
                    plain
                    :icon="Refresh"
                    size="small"
                    data-testid="action-sync"
                    :loading="actionLoading[row.programName] === 'sync'"
                    @click="handleSyncRow(row)"
                  />
                </el-tooltip>
                <template v-if="showStartAction(row.status)">
                  <el-tooltip content="启动">
                    <el-button
                      circle
                      plain
                      :icon="VideoPlay"
                      size="small"
                      data-testid="action-start"
                      :loading="actionLoading[row.programName] === 'start'"
                      @click="handleAction('start', row)"
                    />
                  </el-tooltip>
                </template>
                <template v-else-if="showStopAction(row.status)">
                  <el-tooltip content="停止">
                    <el-button
                      circle
                      plain
                      :icon="VideoPause"
                      size="small"
                      data-testid="action-stop"
                      :loading="actionLoading[row.programName] === 'stop'"
                      @click="handleAction('stop', row)"
                    />
                  </el-tooltip>
                  <el-tooltip content="重启">
                    <el-button
                      circle
                      plain
                      :icon="RefreshRight"
                      size="small"
                      data-testid="action-restart"
                      :loading="actionLoading[row.programName] === 'restart'"
                      @click="handleAction('restart', row)"
                    />
                  </el-tooltip>
                </template>
                <el-dropdown trigger="click" @command="(cmd: string) => handleDropdownAction(cmd, row)">
                  <el-button circle plain :icon="MoreFilled" size="small" />
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="edit" :icon="EditPen" data-testid="action-edit">编辑</el-dropdown-item>
                      <el-dropdown-item command="archive" :icon="Box" data-testid="action-archive">归档</el-dropdown-item>
                      <el-dropdown-item command="delete" :icon="Delete" data-testid="action-delete" divided>删除</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <template v-if="!loadingServices && !serviceRecords.length">
          <EmptyState
            :icon="Box"
            title="没有可显示的服务"
            :description="archiveFilter === 'true' ? '当前没有归档记录。' : '调整筛选条件，或新增一条服务配置。'"
          />
        </template>

        <div v-if="servicePage.total > 0" class="dashboard__pagination">
          <el-pagination
            :current-page="currentPage"
            :page-size="pageSize"
            :page-sizes="[10, 20, 50]"
            :total="servicePage.total"
            layout="total, sizes, prev, pager, next"
            @current-change="onPageChange"
            @size-change="onPageSizeChange"
          />
        </div>
      </template>
    </section>

    <ServiceDetailDrawer
      v-model="detailVisible"
      :detail="currentDetail"
      :loading="loadingDetail"
      @sync="onDetailSync"
    />

    <ServiceFormDialog
      v-model="formVisible"
      :mode="formMode"
      :initial-value="formDraft"
      :submitting="submittingForm"
      @submit="handleFormSubmit"
    />

    <ImportDialog
      v-model="importVisible"
      :host="selectedHost"
      @done="handleSearch"
    />

    <OperationResultPanel
      v-if="lastResult"
      :synced-fields="lastResult.syncedFields"
      :warnings="lastResult.warnings"
      :command-results="lastResult.commandResults"
      @close="lastResult = null"
    />
  </div>
</template>

<script setup lang="ts">
import {
  Box,
  Delete,
  EditPen,
  MoreFilled,
  Plus,
  Refresh,
  RefreshLeft,
  RefreshRight,
  Search,
  Upload,
  VideoPause,
  VideoPlay,
  View,
} from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { computed, onMounted, reactive, ref } from 'vue';

import {
  archiveService,
  createService,
  deleteService,
  getServiceDetail,
  listHosts,
  listServices,
  refreshServiceStatus,
  restartService,
  restoreService,
  startService,
  stopService,
  syncService,
  updateService,
} from '@/api/supervisor/supervisorApi';
import type {
  OperationResponse,
  ServiceCreatePayload,
  ServiceListRecord,
  ServiceUpdatePayload,
  SupervisorHost,
  SupervisorServiceDetail,
  SupervisorState,
} from '@/api/supervisor/supervisor.types';
import EmptyState from '@/components/EmptyState.vue';
import ImportDialog from '@/features/supervisor/components/ImportDialog.vue';
import ManageModeTag from '@/features/supervisor/components/ManageModeTag.vue';
import OperationResultPanel from '@/features/supervisor/components/OperationResultPanel.vue';
import ServiceDetailDrawer from '@/features/supervisor/components/ServiceDetailDrawer.vue';
import ServiceFormDialog from '@/features/supervisor/components/ServiceFormDialog.vue';
import StatusTag from '@/features/supervisor/components/StatusTag.vue';
import { createEditDraft, createEmptyServiceDraft } from '@/features/supervisor/utils/serviceDraft';

const hosts = ref<SupervisorHost[]>([]);
const serviceRecords = ref<ServiceListRecord[]>([]);
const servicePage = ref({ page: 1, pageSize: 10, total: 0, pages: 0 });
const selectedHost = ref('');
const keyword = ref('');
const statusFilter = ref('ALL');
const archiveFilter = ref('false');
const currentPage = ref(1);
const pageSize = ref(10);
const loadingHosts = ref(false);
const loadingServices = ref(false);
const loadingDetail = ref(false);
const refreshingStatus = ref(false);
const currentDetail = ref<SupervisorServiceDetail | null>(null);
const detailVisible = ref(false);
const formVisible = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const formDraft = ref<ServiceCreatePayload | ServiceUpdatePayload>(createEmptyServiceDraft(''));
const editingProgramName = ref('');
const submittingForm = ref(false);
const importVisible = ref(false);
const lastResult = ref<OperationResponse | null>(null);

const actionLoading = reactive<Record<string, string | null>>({});

const enabledHosts = computed(() => hosts.value.filter((h) => h.enabled));

const metrics = computed(() => {
  const running = serviceRecords.value.filter((s) => s.status === 'RUNNING').length;
  const archivedCount = archiveFilter.value === 'true'
    ? serviceRecords.value.length
    : 0;

  return {
    hosts: hosts.value.length,
    services: serviceRecords.value.length,
    running,
    archived: archivedCount,
  };
});

function showStartAction(status: SupervisorState): boolean {
  return ['STOPPED', 'EXITED', 'FATAL', 'BACKOFF', 'UNKNOWN'].includes(status);
}

function showStopAction(status: SupervisorState): boolean {
  return status === 'RUNNING';
}

function getRowClass({ row }: { row: ServiceListRecord }): string {
  if (row.isArchived) return 'dashboard__row--archived';
  if (row.status === 'FATAL') return 'dashboard__row--fatal';
  return '';
}

onMounted(async () => {
  await loadHosts();
  if (selectedHost.value) {
    await loadServices();
  }
});

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
    serviceRecords.value = [];
    return;
  }

  loadingServices.value = true;
  lastResult.value = null;

  try {
    const result = await listServices({
      host: selectedHost.value,
      keyword: keyword.value || undefined,
      status: statusFilter.value !== 'ALL' ? (statusFilter.value as SupervisorState) : undefined,
      archived: archiveFilter.value !== 'all' ? archiveFilter.value === 'true' : undefined,
      page: currentPage.value,
      pageSize: pageSize.value,
    });
    serviceRecords.value = result.records;
    servicePage.value = {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      pages: result.pages,
    };
  } catch (error) {
    handleError(error, '加载服务列表失败');
  } finally {
    loadingServices.value = false;
  }
}

function onHostChange() {
  keyword.value = '';
  statusFilter.value = 'ALL';
  archiveFilter.value = 'false';
  currentPage.value = 1;
  void loadServices();
}

function handleSearch() {
  currentPage.value = 1;
  void loadServices();
}

function handleStatusChange() {
  handleSearch();
}

function handleResetFilters() {
  keyword.value = '';
  statusFilter.value = 'ALL';
  archiveFilter.value = 'false';
  currentPage.value = 1;
  void loadServices();
}

function onPageChange(page: number) {
  currentPage.value = page;
  void loadServices();
}

function onPageSizeChange(size: number) {
  pageSize.value = size;
  currentPage.value = 1;
  void loadServices();
}

async function handleRefreshStatus() {
  if (!selectedHost.value) return;

  refreshingStatus.value = true;
  try {
    await refreshServiceStatus(selectedHost.value);
    ElMessage.success('状态刷新成功');
    await loadServices();
  } catch (error) {
    handleError(error, '刷新状态失败');
  } finally {
    refreshingStatus.value = false;
  }
}

async function openDetail(programName: string) {
  if (!selectedHost.value) return;

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

async function refreshDetail() {
  if (!selectedHost.value || !currentDetail.value) return;

  try {
    currentDetail.value = await getServiceDetail(selectedHost.value, currentDetail.value.programName);
  } catch (error) {
    handleError(error, '刷新详情失败');
  }
}

function openCreateDialog() {
  formMode.value = 'create';
  editingProgramName.value = '';
  formDraft.value = createEmptyServiceDraft(selectedHost.value);
  formVisible.value = true;
}

function openEditDialog(row: ServiceListRecord) {
  formMode.value = 'edit';
  editingProgramName.value = row.programName;
  formDraft.value = createEditDraft(row);
  formVisible.value = true;
}

async function handleFormSubmit(payload: ServiceCreatePayload | ServiceUpdatePayload) {
  submittingForm.value = true;
  lastResult.value = null;

  try {
    if (formMode.value === 'create') {
      const createPayload = payload as ServiceCreatePayload;
      const result = await createService(createPayload);
      lastResult.value = result;
      ElMessage.success('服务创建成功');
    } else {
      const updatePayload = payload as ServiceUpdatePayload;
      const result = await updateService(editingProgramName.value, selectedHost.value, updatePayload);
      lastResult.value = result;
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

async function handleAction(
  action: 'start' | 'stop' | 'restart' | 'archive' | 'restore' | 'delete',
  row: ServiceListRecord,
) {
  if (action === 'delete' || action === 'archive' || action === 'restore') {
    const confirmMessages: Record<string, { message: string; title: string; type: 'warning' | 'info'; confirmText: string }> = {
      delete: {
        message: `确认删除服务 ${row.programName} 吗？`,
        title: '删除确认',
        type: 'warning',
        confirmText: '删除',
      },
      archive: {
        message: `确认归档服务 ${row.programName} 吗？归档后服务不可被纳管操作。`,
        title: '归档确认',
        type: 'warning',
        confirmText: '归档',
      },
      restore: {
        message: `确认还原服务 ${row.programName} 吗？`,
        title: '还原确认',
        type: 'info',
        confirmText: '还原',
      },
    };
    const cfg = confirmMessages[action];
    try {
      await ElMessageBox.confirm(cfg.message, cfg.title, {
        type: cfg.type,
        confirmButtonText: cfg.confirmText,
        cancelButtonText: '取消',
      });
    } catch {
      return;
    }
  }

  actionLoading[row.programName] = action;
  lastResult.value = null;

  try {
    let result: OperationResponse;
    const host = selectedHost.value;

    switch (action) {
      case 'start':
        result = await startService(host, row.programName);
        ElMessage.success('启动命令已执行');
        break;
      case 'stop':
        result = await stopService(host, row.programName);
        ElMessage.success('停止命令已执行');
        break;
      case 'restart':
        result = await restartService(host, row.programName);
        ElMessage.success('重启命令已执行');
        break;
      case 'archive':
        result = await archiveService(host, row.programName);
        ElMessage.success('归档成功');
        break;
      case 'restore':
        result = await restoreService(host, row.programName);
        ElMessage.success('还原成功');
        break;
      case 'delete':
        result = await deleteService(host, row.programName);
        ElMessage.success('删除成功');
        if (currentDetail.value?.programName === row.programName) {
          detailVisible.value = false;
          currentDetail.value = null;
        }
        break;
      default:
        return;
    }

    lastResult.value = result;
    await loadServices();

    if (detailVisible.value && currentDetail.value?.programName === row.programName) {
      await refreshDetail();
    }
  } catch (error) {
    handleError(error, `${action} 执行失败`);
  } finally {
    delete actionLoading[row.programName];
  }
}

function handleDropdownAction(cmd: string, row: ServiceListRecord) {
  if (cmd === 'edit') {
    openEditDialog(row);
  } else if (cmd === 'archive' || cmd === 'delete') {
    handleAction(cmd, row);
  }
}

async function handleSyncRow(row: ServiceListRecord) {
  actionLoading[row.programName] = 'sync';
  lastResult.value = null;

  try {
    const result = await syncService(selectedHost.value, row.programName);
    lastResult.value = result;
    ElMessage.success('同步完成');
    await loadServices();
  } catch (error) {
    handleError(error, '同步失败');
  } finally {
    delete actionLoading[row.programName];
  }
}

async function onDetailSync() {
  await loadServices();
  await refreshDetail();
}

function openImportDialog() {
  importVisible.value = true;
}

function handleError(error: unknown, fallbackMessage: string) {
  const message = error instanceof Error ? error.message : fallbackMessage;
  ElMessage.error(message || fallbackMessage);
}
</script>

<style scoped>
.dashboard__kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.dashboard__kpi {
  padding: 14px 16px;
  border: 1px solid var(--surface-strong);
  border-radius: 6px;
  background: var(--surface);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dashboard__kpi-label {
  font-size: 12px;
  color: var(--text-tertiary);
}

.dashboard__kpi-value {
  font-size: 26px;
  font-weight: 700;
}

.dashboard__kpi-value--success {
  color: var(--success);
}

.dashboard__kpi-value--muted {
  color: var(--text-tertiary);
}

.dashboard__header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.dashboard__filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.dashboard__host-select {
  width: 220px;
  flex-shrink: 0;
}

.dashboard__filter-actions {
  display: flex;
  gap: 8px;
}

.dashboard__table {
  width: 100%;
}

.dashboard__program-name {
  font-weight: 600;
  font-family: 'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace;
  font-size: 13px;
}

.dashboard__program-meta {
  color: var(--text-tertiary);
  font-size: 12px;
  font-family: 'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace;
}

.dashboard__row-actions {
  display: flex;
  gap: 6px;
  flex-wrap: nowrap;
  align-items: center;
}

.dashboard__pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

:deep(.dashboard__row--archived) {
  background-color: #fef2f2;
}

:deep(.dashboard__row--fatal) {
  background-color: #fffbeb;
}

@media (max-width: 1280px) {
  .dashboard__kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .dashboard__kpis {
    grid-template-columns: 1fr;
  }

  .dashboard__filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .dashboard__host-select {
    width: 100%;
  }
}
</style>
