import { computed, defineComponent, h, inject, provide, type ComputedRef } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import SupervisorDashboardPage from '@/features/supervisor/pages/SupervisorDashboardPage.vue';

const {
  mockArchiveService,
  mockCreateService,
  mockDeleteService,
  mockGetServiceDetail,
  mockListHosts,
  mockListServices,
  mockRefreshServiceStatus,
  mockRestartService,
  mockRestoreService,
  mockStartService,
  mockStopService,
  mockSyncService,
  mockUpdateService,
  mockMessageError,
  mockMessageSuccess,
  mockMessageBoxConfirm,
  mockRefreshOverview,
} = vi.hoisted(() => ({
  mockArchiveService: vi.fn(),
  mockCreateService: vi.fn(),
  mockDeleteService: vi.fn(),
  mockGetServiceDetail: vi.fn(),
  mockListHosts: vi.fn(),
  mockListServices: vi.fn(),
  mockRefreshServiceStatus: vi.fn(),
  mockRestartService: vi.fn(),
  mockRestoreService: vi.fn(),
  mockStartService: vi.fn(),
  mockStopService: vi.fn(),
  mockSyncService: vi.fn(),
  mockUpdateService: vi.fn(),
  mockMessageError: vi.fn(),
  mockMessageSuccess: vi.fn(),
  mockMessageBoxConfirm: vi.fn(),
  mockRefreshOverview: vi.fn(),
}));

const overviewState: {
  overview: ComputedRef<{
    host: string;
    hostName: string;
    executorType: string;
    available: boolean;
    connectionState: 'CONNECTED' | 'UNREACHABLE' | 'UNSUPPORTED';
    collectedAt: string;
    cpu: { usagePercent: number };
    memory: { usagePercent: number; usedBytes: number; totalBytes: number; usedText: string; totalText: string };
    checks: { supervisorctlAvailable: boolean; confDirReadable: boolean };
    warnings: string[];
  } | null>;
  loading: ComputedRef<boolean>;
  refreshing: ComputedRef<boolean>;
  error: ComputedRef<string | null>;
  refresh: typeof mockRefreshOverview;
} = {
  overview: computed(() => ({
    host: '127.0.0.1',
    hostName: 'local',
    executorType: 'local',
    available: false,
    connectionState: 'UNSUPPORTED' as const,
    collectedAt: '2026-06-12 18:32:00',
    cpu: { usagePercent: 0 },
    memory: {
      usagePercent: 0,
      usedBytes: 0,
      totalBytes: 0,
      usedText: '0 B',
      totalText: '0 B',
    },
    checks: {
      supervisorctlAvailable: false,
      confDirReadable: false,
    },
    warnings: ['local 执行器暂不支持服务器概况实时采集，仅支持远端 Linux 主机'],
  })),
  loading: computed(() => false),
  refreshing: computed(() => false),
  error: computed(() => null as string | null),
  refresh: mockRefreshOverview,
};

vi.mock('@/api/supervisor/supervisorApi', () => ({
  archiveService: mockArchiveService,
  createService: mockCreateService,
  deleteService: mockDeleteService,
  getServiceDetail: mockGetServiceDetail,
  listHosts: mockListHosts,
  listServices: mockListServices,
  refreshServiceStatus: mockRefreshServiceStatus,
  restartService: mockRestartService,
  restoreService: mockRestoreService,
  startService: mockStartService,
  stopService: mockStopService,
  syncService: mockSyncService,
  updateService: mockUpdateService,
}));

vi.mock('@/features/supervisor/composables/useSupervisorOverview', () => ({
  useSupervisorOverview: () => overviewState,
}));

vi.mock('element-plus', () => ({
  ElMessage: {
    error: mockMessageError,
    success: mockMessageSuccess,
  },
  ElMessageBox: {
    confirm: mockMessageBoxConfirm,
  },
}));

/* eslint-disable vue/one-component-per-file */

const TABLE_ROWS_KEY = 'tableRows';

const ElTableStub = defineComponent({
  name: 'ElTable',
  props: {
    data: {
      type: Array,
      default: () => [],
    },
  },
  setup(props, { slots }) {
    provide(TABLE_ROWS_KEY, computed(() => props.data));
    return () => h('div', { class: 'el-table-stub' }, slots.default?.());
  },
});

const ElTableColumnStub = defineComponent({
  name: 'ElTableColumn',
  props: {
    label: {
      type: String,
      default: '',
    },
    prop: {
      type: String,
      default: '',
    },
  },
  setup(props, { slots }) {
    const rows = inject<{ value: Record<string, unknown>[] }>(
      TABLE_ROWS_KEY,
      computed(() => [] as Record<string, unknown>[]),
    );

    return () => h(
      'div',
      { class: 'el-table-column-stub' },
      rows.value.map((row: Record<string, unknown>, index: number) => h(
        'div',
        {
          key: `${props.label || props.prop}-${index}`,
          class: 'el-table-cell-stub',
        },
        slots.default ? slots.default({ row }) : String(row[props.prop] ?? ''),
      )),
    );
  },
});

const ElButtonStub = defineComponent({
  name: 'ElButton',
  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['click'],
  template: `
    <button :disabled="disabled || loading" @click="$emit('click')">
      <slot />
    </button>
  `,
});

const ElSelectStub = defineComponent({
  name: 'ElSelect',
  props: {
    modelValue: {
      type: String,
      default: '',
    },
  },
  emits: ['update:modelValue', 'change'],
  template: `
    <select
      :value="modelValue"
      @change="$emit('update:modelValue', $event.target.value); $emit('change', $event.target.value)"
    >
      <slot />
    </select>
  `,
});

const ElOptionStub = defineComponent({
  name: 'ElOption',
  props: {
    label: {
      type: String,
      default: '',
    },
    value: {
      type: String,
      default: '',
    },
  },
  template: '<option :value="value">{{ label }}</option>',
});

const ElInputStub = defineComponent({
  name: 'ElInput',
  props: {
    modelValue: {
      type: String,
      default: '',
    },
    placeholder: {
      type: String,
      default: '',
    },
  },
  emits: ['update:modelValue', 'keyup.enter'],
  template: `
    <input
      :value="modelValue"
      :placeholder="placeholder"
      @input="$emit('update:modelValue', $event.target.value)"
      @keyup.enter="$emit('keyup.enter')"
    />
  `,
});

const ElPaginationStub = defineComponent({
  name: 'ElPagination',
  emits: ['current-change', 'size-change'],
  template: `
    <div class="pagination-stub">
      <button class="page-2" @click="$emit('current-change', 2)">page2</button>
      <button class="page-size-20" @click="$emit('size-change', 20)">size20</button>
    </div>
  `,
});

const EmptyStateStub = defineComponent({
  name: 'EmptyState',
  props: {
    title: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
  },
  template: '<div class="empty-state-stub"><div>{{ title }}</div><div>{{ description }}</div><slot /></div>',
});

const StatusTagStub = defineComponent({
  name: 'StatusTag',
  props: {
    state: {
      type: String,
      default: '',
    },
  },
  template: '<span class="status-tag-stub">{{ state }}</span>',
});

const ManageModeTagStub = defineComponent({
  name: 'ManageModeTag',
  props: {
    mode: {
      type: String,
      default: '',
    },
  },
  template: '<span class="manage-mode-tag-stub">{{ mode }}</span>',
});

function mountPage() {
  return mount(SupervisorDashboardPage, {
    global: {
      directives: {
        loading: {
          mounted() {},
        },
      },
      stubs: {
        ElAlert: {
          props: ['title', 'description'],
          template: '<div><div>{{ title }}</div><div>{{ description }}</div><slot /></div>',
        },
        ElButton: ElButtonStub,
        ElInput: ElInputStub,
        ElOption: ElOptionStub,
        ElPagination: ElPaginationStub,
        ElSelect: ElSelectStub,
        ElTable: ElTableStub,
        ElTableColumn: ElTableColumnStub,
        ElDropdown: defineComponent({
          name: 'ElDropdown',
          emits: ['command'],
          setup(props, { emit, slots }) {
            const triggerCommand = (cmd: string) => emit('command', cmd);
            provide('dropdown-trigger-command', triggerCommand);
            return () => h('div', { class: 'el-dropdown-stub' }, [
              slots.default?.(),
              slots.dropdown?.(),
            ]);
          },
        }),
        ElDropdownItem: defineComponent({
          name: 'ElDropdownItem',
          props: { command: { type: String, default: '' } },
          setup(props, { slots }) {
            const trigger = inject<(cmd: string) => void>('dropdown-trigger-command', () => {});
            return () => h('button', { onClick: () => trigger(props.command) }, slots.default?.());
          },
        }),
        ElDropdownMenu: {
          template: '<div><slot /></div>',
        },
        ElIcon: {
          template: '<i />',
        },
        ElRadioButton: {
          template: '<label><slot /></label>',
        },
        ElRadioGroup: {
          props: ['modelValue'],
          emits: ['update:modelValue', 'change'],
          template: '<div><slot /></div>',
        },
        ElTag: {
          template: '<span><slot /></span>',
        },
        ElTooltip: {
          template: '<div><slot /></div>',
        },
        EmptyState: EmptyStateStub,
        ImportDialog: defineComponent({
          name: 'ImportDialog',
          emits: ['done', 'update:modelValue'],
          template: '<div class="import-dialog-stub"><button data-testid="import-done" @click="$emit(\'done\')">导入完成</button></div>',
        }),
        OperationResultPanel: true,
        ManageModeTag: ManageModeTagStub,
        ServerHealthStrip: defineComponent({
          props: ['overview', 'loading', 'refreshing', 'error'],
          emits: ['refresh'],
          template: '<div class="server-health-strip-stub">{{ overview?.connectionState }} {{ overview?.cpu.usagePercent }} {{ overview?.memory.usedText }} {{ overview?.collectedAt }} {{ error }} {{ overview?.warnings?.join("|") }} <button data-testid="refresh-health" @click="$emit(\'refresh\')">刷新概况</button></div>',
        }),
        ServiceDetailDrawer: true,
        ServiceFormDialog: true,
        StatusTag: StatusTagStub,
      },
    },
  });
}

const localHost = {
  name: 'local',
  ip: '127.0.0.1',
  enabled: true,
  executorType: 'local',
  ansiblePattern: null,
};

const pagedResponse = {
  records: [
    {
      id: 1,
      host: '127.0.0.1',
      jobName: 'demo',
      moduleName: 'member',
      programName: 'demo_member',
      configPath: 'demo_member.ini',
      fileName: 'demo_member.ini',
      manageMode: 'TEMPLATE_MANAGED',
      metadataComplete: true,
      parseWarnings: [],
      javaPath: '/usr/local/jdk17/bin/java',
      active: 'prod',
      port: 9001,
      jarName: 'member.jar',
      xms: '128m',
      xmx: '128m',
      user: 'root',
      status: 'RUNNING',
      pid: '12345',
      uptime: '0:10:00',
      updateTime: '2026-06-10 10:00:00',
      isArchived: false,
      archivedAt: null,
      restoredAt: null,
    },
  ],
  page: 1,
  pageSize: 10,
  total: 1,
  pages: 1,
};

const detailResponse = {
  id: 1,
  host: '127.0.0.1',
  hostName: 'local',
  programName: 'demo_member',
  configPath: 'demo_member.ini',
  fileName: 'demo_member.ini',
  jobName: 'demo',
  moduleName: 'member',
  javaPath: '/usr/local/jdk17/bin/java',
  active: 'prod',
  port: 9001,
  jarName: 'member.jar',
  xms: '128m',
  xmx: '128m',
  user: 'root',
  status: 'RUNNING',
  pid: '12345',
  uptime: '0:10:00',
  command: 'java -jar member.jar',
  directory: '/data/app',
  stdoutLogfile: '/data/logs/member.log',
  hasBackup: false,
  configContent: null,
  backupConfigContent: null,
  lastSyncAt: null,
  syncStatus: 'UNKNOWN',
  syncError: null,
  isArchived: false,
  archivedAt: null,
  restoredAt: null,
  updatedAt: null,
};

const archivedRecord = {
  id: 2,
  host: '127.0.0.1',
  programName: 'archived_app',
  configPath: 'archived_app.ini',
  fileName: 'archived_app.ini',
  manageMode: 'TEMPLATE_MANAGED',
  metadataComplete: true,
  parseWarnings: [],
  javaPath: null,
  active: null,
  port: null,
  jarName: null,
  xms: null,
  xmx: null,
  user: null,
  jobName: null,
  moduleName: null,
  status: 'STOPPED',
  pid: null,
  uptime: null,
  updateTime: '2026-06-10 10:00:00',
  isArchived: true,
  archivedAt: '2026-06-09 10:00:00',
  restoredAt: null,
};

const stoppedRecord = {
  id: 3,
  host: '127.0.0.1',
  jobName: 'demo',
  moduleName: 'app',
  programName: 'demo_app',
  configPath: 'demo_app.ini',
  fileName: 'demo_app.ini',
  manageMode: 'IMPORTED_READONLY',
  metadataComplete: true,
  parseWarnings: [],
  javaPath: '/usr/local/jdk17/bin/java',
  active: 'staging',
  port: 9002,
  jarName: 'app.jar',
  xms: '256m',
  xmx: '256m',
  user: 'root',
  status: 'STOPPED',
  pid: null,
  uptime: null,
  updateTime: '2026-06-10 10:00:00',
  isArchived: false,
  archivedAt: null,
  restoredAt: null,
};

const fatalRecord = {
  id: 4,
  host: '127.0.0.1',
  programName: 'fatal_svc',
  configPath: 'fatal_svc.ini',
  fileName: 'fatal_svc.ini',
  manageMode: 'TEMPLATE_MANAGED',
  metadataComplete: false,
  parseWarnings: [],
  javaPath: null,
  active: null,
  port: null,
  jarName: null,
  xms: null,
  xmx: null,
  user: null,
  jobName: null,
  moduleName: null,
  status: 'FATAL',
  pid: null,
  uptime: null,
  updateTime: '2026-06-10 10:00:00',
  isArchived: false,
  archivedAt: null,
  restoredAt: null,
};

const archivedPagedResponse = {
  records: [archivedRecord],
  page: 1,
  pageSize: 10,
  total: 1,
  pages: 1,
};

const mixedPagedResponse = {
  records: [pagedResponse.records[0], archivedRecord, stoppedRecord],
  page: 1,
  pageSize: 10,
  total: 3,
  pages: 1,
};

describe('SupervisorDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListHosts.mockResolvedValue([localHost]);
    mockListServices.mockResolvedValue(pagedResponse);
    mockGetServiceDetail.mockResolvedValue(detailResponse);
    mockRefreshServiceStatus.mockResolvedValue({
      host: '127.0.0.1',
      total: 1,
      updated: 1,
      missing: 0,
    });
    mockArchiveService.mockResolvedValue({ commandResult: {}, fileResult: {} });
    mockDeleteService.mockResolvedValue({ commandResults: {} });
    mockRestartService.mockResolvedValue({ commandResult: {} });
    mockRestoreService.mockResolvedValue({ commandResult: {}, fileResult: {} });
    mockStartService.mockResolvedValue({ commandResult: {} });
    mockStopService.mockResolvedValue({ commandResult: {} });
    mockSyncService.mockResolvedValue({ syncedFields: [], warnings: [], commandResults: {} });
    mockUpdateService.mockResolvedValue({ programName: 'demo_member_v2', commandResults: {} });
    mockCreateService.mockResolvedValue({ programName: 'demo_member_manual', commandResults: {} });
    mockMessageBoxConfirm.mockResolvedValue(undefined);
    mockRefreshOverview.mockResolvedValue({ success: true });
    overviewState.overview = computed(() => ({
      host: '127.0.0.1',
      hostName: 'local',
      executorType: 'local',
      available: false,
      connectionState: 'UNSUPPORTED',
      collectedAt: '2026-06-12 18:32:00',
      cpu: { usagePercent: 0 },
      memory: {
        usagePercent: 0,
        usedBytes: 0,
        totalBytes: 0,
        usedText: '0 B',
        totalText: '0 B',
      },
      checks: {
        supervisorctlAvailable: false,
        confDirReadable: false,
      },
      warnings: ['local 执行器暂不支持服务器概况实时采集，仅支持远端 Linux 主机'],
    }));
    overviewState.loading = computed(() => false);
    overviewState.refreshing = computed(() => false);
    overviewState.error = computed(() => null);
  });

  it('renders paged records without crashing and shows string status', async () => {
    const wrapper = mountPage();

    await flushPromises();

    expect(mockListServices).toHaveBeenCalledWith({
      host: '127.0.0.1',
      keyword: undefined,
      status: undefined,
      archived: 'false',
      page: 1,
      pageSize: 10,
    });
    expect(wrapper.text()).toContain('demo_member');
    expect(wrapper.text()).toContain('RUNNING');
    expect(wrapper.text()).toContain('TEMPLATE_MANAGED');
  });

  it('shows empty state when no records for active filter', async () => {
    mockListServices.mockResolvedValue({
      records: [],
      page: 1,
      pageSize: 10,
      total: 0,
      pages: 0,
    });

    const wrapper = mountPage();

    await flushPromises();

    expect(wrapper.text()).toContain('没有可显示的服务');
  });

  it('requests the next page when pagination changes', async () => {
    const wrapper = mountPage();

    await flushPromises();
    mockListServices.mockClear();

    await wrapper.get('.page-2').trigger('click');
    await flushPromises();

    expect(mockListServices).toHaveBeenCalledWith({
      host: '127.0.0.1',
      keyword: undefined,
      status: undefined,
      archived: 'false',
      page: 2,
      pageSize: 10,
    });
  });

  it('refreshes status before reloading the current page', async () => {
    const wrapper = mountPage();

    await flushPromises();
    mockListServices.mockClear();
    mockRefreshServiceStatus.mockClear();

    const refreshButton = wrapper.findAll('button').find((button) => button.text().includes('刷新状态'));
    expect(refreshButton).toBeDefined();

    await refreshButton!.trigger('click');
    await flushPromises();

    expect(mockRefreshServiceStatus).toHaveBeenCalledWith('127.0.0.1');
    expect(mockListServices).toHaveBeenCalledTimes(1);
    expect(mockRefreshServiceStatus.mock.invocationCallOrder[0]).toBeLessThan(mockListServices.mock.invocationCallOrder[0]);
  });

  it('defaults to archived="false" in listServices call', async () => {
    mountPage();
    await flushPromises();

    expect(mockListServices).toHaveBeenCalledWith(
      expect.objectContaining({ archived: 'false' }),
    );
  });

  it('re-requests when page size changes', async () => {
    const wrapper = mountPage();
    await flushPromises();
    mockListServices.mockClear();

    await wrapper.get('.page-size-20').trigger('click');
    await flushPromises();

    expect(mockListServices).toHaveBeenCalledWith(expect.objectContaining({ page: 1, pageSize: 20 }));
  });

  it('re-requests when host changes', async () => {
    mockListHosts.mockResolvedValue([
      localHost,
      { name: 'remote', ip: '10.1.0.104', enabled: true, executorType: 'ansible', ansiblePattern: 'remote' },
    ]);
    const wrapper = mountPage();
    await flushPromises();
    mockListServices.mockClear();

    const selects = wrapper.findAll('select');
    await selects[0].setValue('10.1.0.104');
    await flushPromises();

    expect(mockListServices).toHaveBeenCalledWith(expect.objectContaining({ host: '10.1.0.104', archived: 'false' }));
  });

  it('refreshes overview and shows updated success message', async () => {
    const wrapper = mountPage();
    await flushPromises();

    const refreshHealthButton = wrapper.find('[data-testid="refresh-health"]');
    await refreshHealthButton.trigger('click');

    expect(mockRefreshOverview).toHaveBeenCalledWith(true);
    expect(mockMessageSuccess).toHaveBeenCalledWith('服务器概况已更新');
  });

  it('renders CONNECTED overview data', async () => {
    overviewState.overview = computed(() => ({
      host: '10.1.0.104',
      hostName: 'web-104-host',
      executorType: 'ansible',
      available: true,
      connectionState: 'CONNECTED',
      collectedAt: '2026-06-12 18:30:00',
      cpu: { usagePercent: 12.34 },
      memory: {
        usagePercent: 50,
        usedBytes: 4294967296,
        totalBytes: 8589934592,
        usedText: '4.00 GB',
        totalText: '8.00 GB',
      },
      checks: {
        supervisorctlAvailable: true,
        confDirReadable: true,
      },
      warnings: [],
    }));

    const wrapper = mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain('CONNECTED');
    expect(wrapper.text()).toContain('12.34');
    expect(wrapper.text()).toContain('4.00 GB');
    expect(wrapper.text()).toContain('2026-06-12 18:30:00');
  });

  it('renders UNSUPPORTED overview with backend warnings', async () => {
    const wrapper = mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain('UNSUPPORTED');
    expect(wrapper.text()).toContain('local 执行器暂不支持服务器概况实时采集，仅支持远端 Linux 主机');
  });

  it('treats UNREACHABLE as valid overview state instead of error branch', async () => {
    overviewState.overview = computed(() => ({
      host: '10.1.0.104',
      hostName: 'web-104',
      executorType: 'ansible',
      available: false,
      connectionState: 'UNREACHABLE',
      collectedAt: '2026-06-12 18:31:00',
      cpu: { usagePercent: 0 },
      memory: {
        usagePercent: 0,
        usedBytes: 0,
        totalBytes: 0,
        usedText: '0 B',
        totalText: '0 B',
      },
      checks: {
        supervisorctlAvailable: false,
        confDirReadable: false,
      },
      warnings: ['目标主机不可达: ssh timeout'],
    }));

    const wrapper = mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain('UNREACHABLE');
    expect(wrapper.text()).toContain('目标主机不可达: ssh timeout');
    expect(mockMessageError).not.toHaveBeenCalled();
  });

  it('shows overview request error without treating available=false as failure', async () => {
    overviewState.error = computed(() => 'network failed');
    const wrapper = mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain('network failed');
  });

  it('renders RUNNING row with stop and restart buttons', async () => {
    const wrapper = mountPage();
    await flushPromises();

    expect(wrapper.find('[data-testid="action-stop"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="action-restart"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="action-start"]').exists()).toBe(false);
  });

  it('renders STOPPED row with start button and no stop/restart', async () => {
    mockListServices.mockResolvedValue({
      records: [stoppedRecord],
      page: 1,
      pageSize: 10,
      total: 1,
      pages: 1,
    });

    const wrapper = mountPage();
    await flushPromises();

    expect(wrapper.find('[data-testid="action-start"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="action-stop"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="action-restart"]').exists()).toBe(false);
  });

  it('renders FATAL row with start button', async () => {
    mockListServices.mockResolvedValue({
      records: [fatalRecord],
      page: 1,
      pageSize: 10,
      total: 1,
      pages: 1,
    });

    const wrapper = mountPage();
    await flushPromises();

    expect(wrapper.find('[data-testid="action-start"]').exists()).toBe(true);
  });

  it('renders archived row with only detail and restore buttons', async () => {
    mockListServices.mockResolvedValue(archivedPagedResponse);

    const wrapper = mountPage();
    await flushPromises();

    expect(wrapper.find('[data-testid="action-detail"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="action-restore"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="action-sync"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="action-start"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="action-stop"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="action-restart"]').exists()).toBe(false);
  });

  it('calls syncService when sync button is clicked', async () => {
    const wrapper = mountPage();
    await flushPromises();

    const syncBtn = wrapper.find('[data-testid="action-sync"]');
    expect(syncBtn.exists()).toBe(true);

    await syncBtn.trigger('click');
    await flushPromises();

    expect(mockSyncService).toHaveBeenCalledWith('127.0.0.1', 'demo_member');
  });

  it('calls ElMessageBox.confirm before archive action', async () => {
    mockListServices.mockResolvedValue(mixedPagedResponse);

    const wrapper = mountPage();
    await flushPromises();

    const archiveBtn = wrapper.find('[data-testid="action-archive"]');
    expect(archiveBtn.exists()).toBe(true);
    await archiveBtn.trigger('click');
    await flushPromises();

    expect(mockMessageBoxConfirm).toHaveBeenCalled();
    expect(mockArchiveService).toHaveBeenCalled();
  });

  it('calls ElMessageBox.confirm before restore action', async () => {
    mockListServices.mockResolvedValue(archivedPagedResponse);

    const wrapper = mountPage();
    await flushPromises();

    const restoreBtn = wrapper.find('[data-testid="action-restore"]');
    expect(restoreBtn.exists()).toBe(true);

    await restoreBtn.trigger('click');
    await flushPromises();

    expect(mockMessageBoxConfirm).toHaveBeenCalled();
    expect(mockRestoreService).toHaveBeenCalled();
  });

  it('calls ElMessageBox.confirm before delete action', async () => {
    const wrapper = mountPage();
    await flushPromises();

    const deleteBtn = wrapper.find('[data-testid="action-delete"]');
    expect(deleteBtn.exists()).toBe(true);
    await deleteBtn.trigger('click');
    await flushPromises();

    expect(mockMessageBoxConfirm).toHaveBeenCalled();
    expect(mockDeleteService).toHaveBeenCalled();
  });

  it('starts service when start button is clicked on STOPPED row', async () => {
    mockListServices.mockResolvedValue({
      records: [stoppedRecord],
      page: 1,
      pageSize: 10,
      total: 1,
      pages: 1,
    });

    const wrapper = mountPage();
    await flushPromises();

    const startBtn = wrapper.find('[data-testid="action-start"]');
    expect(startBtn.exists()).toBe(true);

    await startBtn.trigger('click');
    await flushPromises();

    expect(mockStartService).toHaveBeenCalledWith('127.0.0.1', 'demo_app');
  });

  it('stops service when stop button is clicked on RUNNING row', async () => {
    const wrapper = mountPage();
    await flushPromises();

    const stopBtn = wrapper.find('[data-testid="action-stop"]');
    expect(stopBtn.exists()).toBe(true);

    await stopBtn.trigger('click');
    await flushPromises();

    expect(mockStopService).toHaveBeenCalledWith('127.0.0.1', 'demo_member');
  });

  it('refreshes list and open detail when import is done', async () => {
    const wrapper = mountPage();
    await flushPromises();

    await wrapper.get('[data-testid="action-detail"]').trigger('click');
    await flushPromises();

    mockListServices.mockClear();
    mockGetServiceDetail.mockClear();

    await wrapper.get('[data-testid="import-done"]').trigger('click');
    await flushPromises();

    expect(mockListServices).toHaveBeenCalledTimes(1);
    expect(mockGetServiceDetail).toHaveBeenCalledWith('127.0.0.1', 'demo_member');
  });
});
