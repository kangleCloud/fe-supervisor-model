import { computed, defineComponent, h, inject, provide } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import SupervisorDashboardPage from '@/features/supervisor/pages/SupervisorDashboardPage.vue';

const {
  mockCreateService,
  mockGetServiceDetail,
  mockListHosts,
  mockListServices,
  mockRefreshServiceStatus,
  mockMessageError,
  mockMessageSuccess,
} = vi.hoisted(() => ({
  mockCreateService: vi.fn(),
  mockGetServiceDetail: vi.fn(),
  mockListHosts: vi.fn(),
  mockListServices: vi.fn(),
  mockRefreshServiceStatus: vi.fn(),
  mockMessageError: vi.fn(),
  mockMessageSuccess: vi.fn(),
}));

vi.mock('@/api/supervisor/supervisorApi', () => ({
  createService: mockCreateService,
  getServiceDetail: mockGetServiceDetail,
  listHosts: mockListHosts,
  listServices: mockListServices,
  refreshServiceStatus: mockRefreshServiceStatus,
}));

vi.mock('element-plus', () => ({
  ElMessage: {
    error: mockMessageError,
    success: mockMessageSuccess,
  },
}));

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
          props: ['title'],
          template: '<div><div>{{ title }}</div><slot /></div>',
        },
        ElButton: ElButtonStub,
        ElInput: ElInputStub,
        ElOption: ElOptionStub,
        ElPagination: ElPaginationStub,
        ElSelect: ElSelectStub,
        ElTable: ElTableStub,
        ElTableColumn: ElTableColumnStub,
        ElDropdown: {
          template: '<div><slot /><slot name="dropdown" /></div>',
        },
        ElDropdownItem: defineComponent({
          name: 'ElDropdownItem',
          props: { command: { type: String, default: '' } },
          emits: ['command'],
          template: '<button><slot /></button>',
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
          template: '<div><slot /></div>',
        },
        ElTag: {
          template: '<span><slot /></span>',
        },
        ElTooltip: {
          template: '<div><slot /></div>',
        },
        EmptyState: EmptyStateStub,
        ImportDialog: true,
        OperationResultPanel: true,
        ManageModeTag: ManageModeTagStub,
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

const remoteHost = {
  name: 'web-104',
  ip: '10.1.0.104',
  enabled: true,
  executorType: 'ansible',
  ansiblePattern: 'web-104',
};

const pagedResponse = {
  records: [
    {
      id: 1,
      host: '127.0.0.1',
      jobName: 'demo',
      moduleName: 'member',
      programName: 'demo_member',
      configName: 'demo_member.ini',
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
    },
  ],
  page: 1,
  pageSize: 10,
  total: 1,
  pages: 1,
};

describe('SupervisorDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListHosts.mockResolvedValue([localHost]);
    mockListServices.mockResolvedValue(pagedResponse);
    mockRefreshServiceStatus.mockResolvedValue({
      host: '127.0.0.1',
      total: 1,
      updated: 1,
      missing: 0,
    });
  });

  it('renders paged records without crashing and shows string status', async () => {
    const wrapper = mountPage();

    await flushPromises();

    expect(mockListServices).toHaveBeenCalledWith({
      host: '127.0.0.1',
      keyword: undefined,
      status: undefined,
      archived: false,
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
      archived: false,
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
});
