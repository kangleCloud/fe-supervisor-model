import { computed, defineComponent, h, inject, provide } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ImportDialog from '@/features/supervisor/components/ImportDialog.vue';

const {
  mockImportServices,
  mockMessageSuccess,
  mockMessageError,
  mockMessageWarning,
  mockMessageBoxConfirm,
} = vi.hoisted(() => ({
  mockImportServices: vi.fn(),
  mockMessageSuccess: vi.fn(),
  mockMessageError: vi.fn(),
  mockMessageWarning: vi.fn(),
  mockMessageBoxConfirm: vi.fn(),
}));

vi.mock('@/api/supervisor/supervisorApi', () => ({
  importServices: mockImportServices,
}));

vi.mock('element-plus', () => ({
  ElMessage: {
    error: mockMessageError,
    success: mockMessageSuccess,
    warning: mockMessageWarning,
  },
  ElMessageBox: {
    confirm: mockMessageBoxConfirm,
  },
}));

/* eslint-disable vue/one-component-per-file */

const IMPORT_TABLE_ROWS_KEY = Symbol('import-table-rows');

const ElTableStub = defineComponent({
  name: 'ElTable',
  props: {
    data: { type: Array, default: () => [] },
  },
  setup(props, { slots }) {
    provide(IMPORT_TABLE_ROWS_KEY, computed(() => props.data));
    return () => h('div', { class: 'el-table-stub' }, slots.default?.());
  },
});

const ElTableColumnStub = defineComponent({
  name: 'ElTableColumn',
  props: {
    label: { type: String, default: '' },
    prop: { type: String, default: '' },
  },
  setup(props, { slots }) {
    const rows = inject<{ value: Record<string, unknown>[] }>(
      IMPORT_TABLE_ROWS_KEY,
      computed(() => [] as Record<string, unknown>[]),
    );
    return () => h(
      'div',
      { class: 'el-table-column-stub' },
      rows.value.map((row, index) => h(
        'div',
        { key: `${props.label || props.prop}-${index}`, class: 'el-table-cell-stub' },
        slots.default ? slots.default({ row }) : String(row[props.prop] ?? ''),
      )),
    );
  },
});

function mountDialog(props: { modelValue: boolean; host: string }) {
  return mount(ImportDialog, {
    props,
    global: {
      stubs: {
        ElAlert: {
          props: ['title', 'description'],
          template: '<div class="alert-stub"><strong>{{ title }}</strong><span>{{ description }}</span></div>',
        },
        ElDialog: { template: '<div><slot /><slot name="footer" /></div>' },
        ElButton: {
          props: ['type', 'loading', 'icon', 'disabled'],
          emits: ['click'],
          template: '<button @click="$emit(\'click\')" :disabled="$props.loading || $props.disabled"><slot /></button>',
        },
        ElIcon: { template: '<i />' },
        ElTag: {
          props: ['type', 'effect'],
          template: '<span :class="$props.type"><slot /></span>',
        },
        ElTable: ElTableStub,
        ElTableColumn: ElTableColumnStub,
        ImportResultTag: {
          props: ['result'],
          template: '<span>{{ result }}</span>',
        },
      },
    },
  });
}

const precheckReport = {
  host: '127.0.0.1',
  mode: 'PRECHECK' as const,
  batchId: 'batch-001',
  summary: { planned: 3, imported: 0, updated: 0, skipped: 0 },
  items: [
    {
      configPath: '/etc/supervisor/app.ini',
      fileName: 'app.ini',
      programName: 'app',
      jobName: 'demo',
      moduleName: 'app',
      javaPath: '/usr/local/jdk17/bin/java',
      active: 'prod',
      port: 8080,
      jarName: 'app.jar',
      xms: '128m',
      xmx: '128m',
      user: 'root',
      manageMode: null,
      metadataComplete: true,
      parseWarnings: [],
      result: 'PLANNED' as const,
      message: 'Ready to import',
    },
  ],
};

const commitReport = {
  ...precheckReport,
  mode: 'COMMIT' as const,
  summary: { planned: 1, imported: 1, updated: 0, skipped: 0 },
  items: [
    {
      ...precheckReport.items[0],
      result: 'IMPORTED' as const,
      message: 'Imported successfully',
    },
  ],
};

describe('ImportDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMessageBoxConfirm.mockResolvedValue(undefined);
  });

  it('shows target host name', () => {
    const wrapper = mountDialog({ modelValue: true, host: '10.1.0.104' });

    expect(wrapper.text()).toContain('10.1.0.104');
  });

  it('shows "预检导入" button initially', () => {
    const wrapper = mountDialog({ modelValue: true, host: '127.0.0.1' });

    expect(wrapper.text()).toContain('预检导入');
  });

  it('calls importServices with PRECHECK when precheck is clicked', async () => {
    mockImportServices.mockResolvedValue(precheckReport);
    const wrapper = mountDialog({ modelValue: true, host: '127.0.0.1' });

    const precheckBtn = wrapper.findAll('button').find((b) => b.text() === '预检导入');
    expect(precheckBtn).toBeDefined();
    await precheckBtn!.trigger('click');

    expect(mockImportServices).toHaveBeenCalledWith({ host: '127.0.0.1', mode: 'PRECHECK' });
  });

  it('shows summary section and batchId after PRECHECK completes', async () => {
    mockImportServices.mockResolvedValue(precheckReport);
    const wrapper = mountDialog({ modelValue: true, host: '127.0.0.1' });

    const precheckBtn = wrapper.findAll('button').find((b) => b.text() === '预检导入');
    await precheckBtn!.trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('导入汇总');
    expect(wrapper.text()).toContain('当前批次：batch-001');
    expect(wrapper.text()).toContain('3');
  });

  it('shows confirm button after PRECHECK with planned > 0 and no skipped items', async () => {
    mockImportServices.mockResolvedValue(precheckReport);
    const wrapper = mountDialog({ modelValue: true, host: '127.0.0.1' });

    const precheckBtn = wrapper.findAll('button').find((b) => b.text() === '预检导入');
    await precheckBtn!.trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('确认导入');
  });

  it('shows skipped warning and blocks commit when PRECHECK contains skipped items', async () => {
    mockImportServices.mockResolvedValue({
      ...precheckReport,
      summary: { planned: 2, imported: 0, updated: 0, skipped: 1 },
      items: [
        ...precheckReport.items,
        {
          ...precheckReport.items[0],
          configPath: '/etc/supervisor/skipped.ini',
          fileName: 'skipped.ini',
          result: 'SKIPPED' as const,
          message: 'metadata incomplete',
        },
      ],
    });
    const wrapper = mountDialog({ modelValue: true, host: '127.0.0.1' });

    const precheckBtn = wrapper.findAll('button').find((b) => b.text() === '预检导入');
    await precheckBtn!.trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('存在跳过项');
    expect(wrapper.text()).toContain('存在跳过项，禁止提交');
    expect(wrapper.text()).not.toContain('确认导入');
  });

  it('shows "无可导入的文件" when planned is 0', async () => {
    mockImportServices.mockResolvedValue({
      ...precheckReport,
      summary: { planned: 0, imported: 0, updated: 0, skipped: 0 },
    });
    const wrapper = mountDialog({ modelValue: true, host: '127.0.0.1' });

    const precheckBtn = wrapper.findAll('button').find((b) => b.text() === '预检导入');
    await precheckBtn!.trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('无可导入的文件');
  });

  it('uses previous batchId on COMMIT', async () => {
    mockImportServices.mockResolvedValueOnce(precheckReport);
    mockImportServices.mockResolvedValueOnce(commitReport);
    const wrapper = mountDialog({ modelValue: true, host: '127.0.0.1' });

    const precheckBtn = wrapper.findAll('button').find((b) => b.text() === '预检导入');
    await precheckBtn!.trigger('click');
    await flushPromises();

    const confirmBtn = wrapper.findAll('button').find((b) => b.text() === '确认导入');
    await confirmBtn!.trigger('click');
    await flushPromises();

    expect(mockImportServices).toHaveBeenNthCalledWith(2, {
      host: '127.0.0.1',
      mode: 'COMMIT',
      batchId: 'batch-001',
    });
  });

  it('shows "导入完成" tag after COMMIT completes', async () => {
    mockImportServices.mockResolvedValueOnce(precheckReport);
    mockImportServices.mockResolvedValueOnce(commitReport);
    const wrapper = mountDialog({ modelValue: true, host: '127.0.0.1' });

    const precheckBtn = wrapper.findAll('button').find((b) => b.text() === '预检导入');
    await precheckBtn!.trigger('click');
    await flushPromises();

    const confirmBtn = wrapper.findAll('button').find((b) => b.text() === '确认导入');
    await confirmBtn!.trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('导入完成');
  });

  it('clears batch state when host changes', async () => {
    mockImportServices.mockResolvedValue(precheckReport);
    const wrapper = mountDialog({ modelValue: true, host: '127.0.0.1' });

    const precheckBtn = wrapper.findAll('button').find((b) => b.text() === '预检导入');
    await precheckBtn!.trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('当前批次：batch-001');

    await wrapper.setProps({ host: '10.1.0.104' });
    await flushPromises();

    expect(wrapper.text()).not.toContain('当前批次：batch-001');
    expect(wrapper.text()).toContain('预检导入');
  });

  it('clears batch state when dialog closes', async () => {
    mockImportServices.mockResolvedValue(precheckReport);
    const wrapper = mountDialog({ modelValue: true, host: '127.0.0.1' });

    const precheckBtn = wrapper.findAll('button').find((b) => b.text() === '预检导入');
    await precheckBtn!.trigger('click');
    await flushPromises();

    const closeBtn = wrapper.findAll('button').find((b) => b.text() === '关闭');
    await closeBtn!.trigger('click');
    await flushPromises();

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.text()).not.toContain('当前批次：batch-001');
  });
});
