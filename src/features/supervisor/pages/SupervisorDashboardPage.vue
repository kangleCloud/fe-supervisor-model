<template>
  <div class="page">
    <section class="page__section dashboard__kpis">
      <div class="dashboard__kpi">
        <div class="dashboard__kpi-label">主机总数</div>
        <div class="dashboard__kpi-value">{{ metrics.hosts }}</div>
      </div>
      <div class="dashboard__kpi">
        <div class="dashboard__kpi-label">当前筛选总数</div>
        <div class="dashboard__kpi-value">{{ metrics.services }}</div>
      </div>
      <div class="dashboard__kpi">
        <div class="dashboard__kpi-label">当前页 RUNNING</div>
        <div class="dashboard__kpi-value dashboard__kpi-value--success">{{ metrics.running }}</div>
      </div>
      <div class="dashboard__kpi">
        <div class="dashboard__kpi-label">当前页已归档</div>
        <div class="dashboard__kpi-value dashboard__kpi-value--muted">{{ metrics.archived }}</div>
      </div>
    </section>

    <section class="page__section">
      <div class="page__section-header">
        <div>
          <h2 class="page__section-title">主机与筛选</h2>
          <p class="page__section-subtitle">保持轻量筛选，将操作注意力聚焦到服务列表与状态差异。</p>
        </div>
      </div>

      <div class="dashboard__filter-grid">
        <div class="dashboard__filter-field dashboard__filter-field--host">
          <span class="dashboard__field-label">目标主机</span>
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
        </div>

        <div class="dashboard__filter-field dashboard__filter-field--keyword">
          <span class="dashboard__field-label">关键字</span>
          <el-input
            v-model="keyword"
            :prefix-icon="Search"
            clearable
            placeholder="搜索 programName、configPath、jobName、moduleName、port"
            @keyup.enter="handleSearch"
          />
        </div>

        <div class="dashboard__filter-field">
          <span class="dashboard__field-label">状态</span>
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
        </div>

        <div class="dashboard__filter-field dashboard__filter-field--archive">
          <span class="dashboard__field-label">归档筛选</span>
          <el-radio-group v-model="archiveFilter" @change="handleSearch">
            <el-radio-button value="false">活跃</el-radio-button>
            <el-radio-button value="true">已归档</el-radio-button>
            <el-radio-button value="all">全部</el-radio-button>
          </el-radio-group>
        </div>

        <div class="dashboard__filter-actions">
          <el-button :icon="Search" type="primary" @click="handleSearch">查询</el-button>
          <el-button plain @click="handleResetFilters">重置</el-button>
        </div>
      </div>
    </section>

    <ServerHealthStrip
      :host="selectedHostConfig"
      :overview="overview"
      :loading="overviewLoading"
      :refreshing="overviewRefreshing"
      :error="overviewError"
      @refresh="handleRefreshHealth"
    />

    <section class="page__section">
      <div class="page__section-header">
        <div>
          <h2 class="page__section-title">服务列表</h2>
          <p class="page__section-subtitle">
            刷新列表仅重新获取分页数据；刷新状态会先触发后端状态同步，再回拉当前列表。
          </p>
        </div>
        <div class="dashboard__header-actions">
          <el-button :icon="Refresh" :disabled="!selectedHost" plain @click="loadServices">刷新列表</el-button>
          <el-button
            :icon="RefreshRight"
            :disabled="!selectedHost"
            :loading="refreshingStatus"
            plain
            @click="handleRefreshStatus"
          >
            刷新状态
          </el-button>
          <el-button :icon="Plus" type="primary" :disabled="!selectedHost" @click="openCreateDialog">
            新增服务
          </el-button>
          <el-button :icon="Upload" :disabled="!selectedHost" plain @click="openImportDialog">
            初始化导入
          </el-button>
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
          <el-table-column label="程序名" min-width="220">
            <template #default="{ row }">
              <div class="dashboard__program">
                <div class="dashboard__program-name">{{ row.programName }}</div>
                <div class="dashboard__program-meta">{{ row.configPath }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="纳管模式" width="120">
            <template #default="{ row }">
              <ManageModeTag :mode="row.manageMode" />
            </template>
          </el-table-column>
          <el-table-column label="状态" width="110">
            <template #default="{ row }">
              <StatusTag :state="row.status" />
            </template>
          </el-table-column>
          <el-table-column prop="pid" label="PID" width="90" />
          <el-table-column prop="uptime" label="Uptime" width="110" />
          <el-table-column prop="port" label="端口" width="80" />
          <el-table-column prop="active" label="环境" width="90" />
          <el-table-column prop="jarName" label="Jar" min-width="160" />
          <el-table-column label="归档" width="88">
            <template #default="{ row }">
              <el-tag v-if="row.isArchived" type="danger" size="small" effect="plain">是</el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="updateTime" label="更新时间" width="170" />
          <el-table-column label="操作" width="220" fixed="right">
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
      @done="handleImportDone"
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
  ArchivedFilter,
  OperationCommandPayload,
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
import ServerHealthStrip from '@/features/supervisor/components/ServerHealthStrip.vue';
import ServiceDetailDrawer from '@/features/supervisor/components/ServiceDetailDrawer.vue';
import ServiceFormDialog from '@/features/supervisor/components/ServiceFormDialog.vue';
import StatusTag from '@/features/supervisor/components/StatusTag.vue';
import { useSupervisorOverview } from '@/features/supervisor/composables/useSupervisorOverview';
import { createEditDraft, createEmptyServiceDraft } from '@/features/supervisor/utils/serviceDraft';

interface ResultPanelState {
  syncedFields?: string[];
  warnings?: string[];
  commandResults?: OperationCommandPayload;
}

const hosts = ref<SupervisorHost[]>([]);
const serviceRecords = ref<ServiceListRecord[]>([]);
const servicePage = ref({ page: 1, pageSize: 10, total: 0, pages: 0 });
const selectedHost = ref('');
const keyword = ref('');
const statusFilter = ref<'ALL' | SupervisorState>('ALL');
const archiveFilter = ref<ArchivedFilter>('false');
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
const lastResult = ref<ResultPanelState | null>(null);

const actionLoading = reactive<Record<string, string | null>>({});

const enabledHosts = computed(() => hosts.value.filter((h) => h.enabled));
const selectedHostConfig = computed(() => hosts.value.find((h) => h.ip === selectedHost.value) || null);
const {
  overview,
  loading: overviewLoading,
  refreshing: overviewRefreshing,
  error: overviewError,
  refresh: refreshOverview,
} = useSupervisorOverview(selectedHost);

const metrics = computed(() => ({
  hosts: hosts.value.length,
  services: servicePage.value.total,
  running: serviceRecords.value.filter((s) => s.status === 'RUNNING').length,
  archived: serviceRecords.value.filter((s) => s.isArchived).length,
}));

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

function mergeCommandResults(...groups: Array<OperationCommandPayload | undefined>) {
  return groups.reduce<Record<string, unknown>>((accumulator, group, index) => {
    if (!group) {
      return accumulator;
    }
    if ('steps' in group || 'exitCode' in group || 'stdout' in group || 'stderr' in group) {
      return {
        ...accumulator,
        [`group${index + 1}`]: group,
      };
    }
    return { ...accumulator, ...group };
  }, {});
}

function setResultPanel(result: ResultPanelState | null) {
  lastResult.value = result && (
    (result.syncedFields && result.syncedFields.length)
    || (result.warnings && result.warnings.length)
    || result.commandResults
  )
    ? result
    : null;
}

function hydrateDetail(detail: SupervisorServiceDetail): SupervisorServiceDetail {
  const matchingRow = serviceRecords.value.find((item) => item.programName === detail.programName);

  if (!matchingRow) {
    return {
      ...detail,
      manageMode: 'TEMPLATE_MANAGED',
      metadataComplete: true,
      parseWarnings: [],
    };
  }

  return {
    ...detail,
    manageMode: matchingRow.manageMode,
    metadataComplete: matchingRow.metadataComplete,
    parseWarnings: detail.parseWarnings?.length ? detail.parseWarnings : matchingRow.parseWarnings,
  };
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
    servicePage.value = { page: 1, pageSize: pageSize.value, total: 0, pages: 0 };
    return;
  }

  loadingServices.value = true;

  try {
    const result = await listServices({
      host: selectedHost.value,
      keyword: keyword.value || undefined,
      status: statusFilter.value !== 'ALL' ? statusFilter.value : undefined,
      archived: archiveFilter.value,
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
  currentDetail.value = null;
  detailVisible.value = false;
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

async function handleRefreshHealth() {
  const result = await refreshOverview(true);
  if (result?.success) {
    ElMessage.success('服务器概况已更新');
  }
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
    currentDetail.value = hydrateDetail(await getServiceDetail(selectedHost.value, programName));
  } catch (error) {
    handleError(error, '加载服务详情失败');
  } finally {
    loadingDetail.value = false;
  }
}

async function refreshDetail(programName = currentDetail.value?.programName) {
  if (!selectedHost.value || !programName) return;

  try {
    currentDetail.value = hydrateDetail(await getServiceDetail(selectedHost.value, programName));
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

  try {
    if (formMode.value === 'create') {
      const result = await createService(payload as ServiceCreatePayload);
      setResultPanel({ commandResults: result.commandResults });
      ElMessage.success('服务创建成功');
    } else {
      const result = await updateService(editingProgramName.value, selectedHost.value, payload as ServiceUpdatePayload);
      setResultPanel({ commandResults: result.commandResults });
      ElMessage.success('服务更新成功');
      editingProgramName.value = result.programName;
      if (detailVisible.value && currentDetail.value?.programName) {
        await refreshDetail(result.programName);
      }
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

  try {
    const host = selectedHost.value;

    switch (action) {
      case 'start': {
        const result = await startService(host, row.programName);
        setResultPanel({ commandResults: result.commandResult });
        ElMessage.success('启动命令已执行');
        break;
      }
      case 'stop': {
        const result = await stopService(host, row.programName);
        setResultPanel({ commandResults: result.commandResult });
        ElMessage.success('停止命令已执行');
        break;
      }
      case 'restart': {
        const result = await restartService(host, row.programName);
        setResultPanel({ commandResults: result.commandResult });
        ElMessage.success('重启命令已执行');
        break;
      }
      case 'archive': {
        const result = await archiveService(host, row.programName);
        setResultPanel({ commandResults: mergeCommandResults(result.commandResult, result.fileResult) as OperationCommandPayload });
        ElMessage.success('归档成功');
        break;
      }
      case 'restore': {
        const result = await restoreService(host, row.programName);
        setResultPanel({ commandResults: mergeCommandResults(result.commandResult, result.fileResult) as OperationCommandPayload });
        ElMessage.success('还原成功');
        break;
      }
      case 'delete': {
        const result = await deleteService(host, row.programName);
        setResultPanel({ commandResults: result.commandResults });
        ElMessage.success('删除成功');
        if (currentDetail.value?.programName === row.programName) {
          detailVisible.value = false;
          currentDetail.value = null;
        }
        break;
      }
      default:
        return;
    }

    await loadServices();

    if (detailVisible.value && currentDetail.value?.programName === row.programName && action !== 'delete') {
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
    void handleAction(cmd, row);
  }
}

async function handleSyncRow(row: ServiceListRecord) {
  actionLoading[row.programName] = 'sync';

  try {
    const result = await syncService(selectedHost.value, row.programName);
    setResultPanel({
      syncedFields: result.syncedFields,
      warnings: result.warnings,
      commandResults: result.commandResults,
    });
    ElMessage.success('同步完成');
    await loadServices();
    if (detailVisible.value && currentDetail.value?.programName === row.programName) {
      await refreshDetail();
    }
  } catch (error) {
    handleError(error, '同步失败');
  } finally {
    delete actionLoading[row.programName];
  }
}

async function onDetailSync(detail: SupervisorServiceDetail) {
  await loadServices();
  await refreshDetail(detail.programName);
}

function openImportDialog() {
  importVisible.value = true;
}

async function handleImportDone() {
  importVisible.value = false;
  await loadServices();
  if (detailVisible.value && currentDetail.value) {
    await refreshDetail(currentDetail.value.programName);
  }
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
  border-radius: 8px;
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

.dashboard__filter-grid {
  display: grid;
  grid-template-columns: minmax(220px, 1.15fr) minmax(260px, 1.4fr) minmax(180px, 0.9fr) auto auto;
  gap: 12px;
  align-items: end;
}

.dashboard__filter-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dashboard__filter-field--archive {
  min-width: 240px;
}

.dashboard__field-label {
  font-size: 12px;
  color: var(--text-tertiary);
}

.dashboard__host-select {
  width: 100%;
}

.dashboard__filter-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
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
  background-color: color-mix(in srgb, var(--danger) 8%, white);
}

:deep(.dashboard__row--fatal) {
  background-color: color-mix(in srgb, var(--warning) 10%, white);
}

@media (max-width: 1280px) {
  .dashboard__kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dashboard__filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .dashboard__kpis,
  .dashboard__filter-grid {
    grid-template-columns: 1fr;
  }

  .dashboard__filter-actions {
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .dashboard__header-actions {
    width: 100%;
  }
}
</style>
