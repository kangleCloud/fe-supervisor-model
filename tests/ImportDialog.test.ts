import { computed, defineComponent, h, inject, provide } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import ImportDialog from '@/features/supervisor/components/ImportDialog.vue';

const { mockImportServices } = vi.hoisted(() => ({
  mockImportServices: vi.fn(),
}));

vi.mock('@/api/supervisor/supervisorApi', () => ({
  importServices: mockImportServices,
}));

vi.mock('element-plus', () => ({
  ElMessage: {
    error: vi.fn(),
    success: vi.fn(),
  },
  ElMessageBox: {
    confirm: vi.fn(),
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
        ElDialog: { template: '<div><slot /><slot name="footer" /></div>' },
        ElButton: {
          props: ['type', 'loading', 'icon', 'disabled'],
          emits: ['click'],
          template: '<button @click="$emit(\'click\')" :disabled="$props.loading"><slot /></button>',
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

const dryRunReport = {
  host: '127.0.0.1',
  mode: 'DRY_RUN' as const,
  summary: { planned: 3, imported: 0, updated: 0, skipped: 0 },
  items: [
    {
      configPath: '/etc/supervisor/app.ini',
      fileName: 'app.ini',
      contentProgramName: 'app',
      programName: 'app',
      configName: 'app.ini',
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

const applyReport = {
  ...dryRunReport,
  mode: 'APPLY' as const,
  summary: { planned: 0, imported: 2, updated: 1, skipped: 0 },
  items: [
    {
      ...dryRunReport.items[0],
      result: 'IMPORTED' as const,
      message: 'Imported successfully',
    },
  ],
};

describe('ImportDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows target host name', () => {
    const wrapper = mountDialog({ modelValue: true, host: '10.1.0.104' });

    expect(wrapper.text()).toContain('10.1.0.104');
  });

  it('shows "预检导入" button initially', () => {
    const wrapper = mountDialog({ modelValue: true, host: '127.0.0.1' });

    expect(wrapper.text()).toContain('预检导入');
  });

  it('calls importServices with DRY_RUN when "预检导入" is clicked', async () => {
    mockImportServices.mockResolvedValue(dryRunReport);
    const wrapper = mountDialog({ modelValue: true, host: '127.0.0.1' });

    const precheckBtn = wrapper.findAll('button').find((b) => b.text() === '预检导入');
    expect(precheckBtn).toBeDefined();
    await precheckBtn!.trigger('click');

    expect(mockImportServices).toHaveBeenCalledWith({ host: '127.0.0.1', mode: 'DRY_RUN' });
  });

  it('shows summary section after DRY_RUN completes', async () => {
    mockImportServices.mockResolvedValue(dryRunReport);
    const wrapper = mountDialog({ modelValue: true, host: '127.0.0.1' });

    const precheckBtn = wrapper.findAll('button').find((b) => b.text() === '预检导入');
    await precheckBtn!.trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('导入汇总');
    expect(wrapper.text()).toContain('预检通过');
    expect(wrapper.text()).toContain('3');
  });

  it('shows "确认导入" button after DRY_RUN with planned > 0', async () => {
    mockImportServices.mockResolvedValue(dryRunReport);
    const wrapper = mountDialog({ modelValue: true, host: '127.0.0.1' });

    const precheckBtn = wrapper.findAll('button').find((b) => b.text() === '预检导入');
    await precheckBtn!.trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('确认导入');
  });

  it('shows "无可导入的文件" when planned is 0', async () => {
    mockImportServices.mockResolvedValue({
      ...dryRunReport,
      summary: { planned: 0, imported: 0, updated: 0, skipped: 0 },
    });
    const wrapper = mountDialog({ modelValue: true, host: '127.0.0.1' });

    const precheckBtn = wrapper.findAll('button').find((b) => b.text() === '预检导入');
    await precheckBtn!.trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('无可导入的文件');
  });

  it('shows "关闭" button after report is loaded', async () => {
    mockImportServices.mockResolvedValue(dryRunReport);
    const wrapper = mountDialog({ modelValue: true, host: '127.0.0.1' });

    const precheckBtn = wrapper.findAll('button').find((b) => b.text() === '预检导入');
    await precheckBtn!.trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('关闭');
  });

  it('shows "导入完成" tag after APPLY completes', async () => {
    // First DRY_RUN, then APPLY
    mockImportServices.mockResolvedValueOnce(dryRunReport);
    mockImportServices.mockResolvedValueOnce(applyReport);

    // Mock ElMessageBox.confirm to resolve for APPLY
    const { ElMessageBox } = await import('element-plus');
    (ElMessageBox.confirm as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const wrapper = mountDialog({ modelValue: true, host: '127.0.0.1' });

    // Run DRY_RUN
    const precheckBtn = wrapper.findAll('button').find((b) => b.text() === '预检导入');
    await precheckBtn!.trigger('click');
    await flushPromises();

    // Click "确认导入"
    const confirmBtn = wrapper.findAll('button').find((b) => b.text() === '确认导入');
    await confirmBtn!.trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('导入完成');
  });
});
