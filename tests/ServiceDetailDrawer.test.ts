import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ServiceDetailDrawer from '@/features/supervisor/components/ServiceDetailDrawer.vue';
import type { SupervisorServiceDetail } from '@/api/supervisor/supervisor.types';

const { mockSyncService } = vi.hoisted(() => ({
  mockSyncService: vi.fn(),
}));

vi.mock('@/api/supervisor/supervisorApi', () => ({
  syncService: mockSyncService,
}));

vi.mock('element-plus', () => ({
  ElMessage: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const detail: SupervisorServiceDetail = {
  id: 1,
  host: '127.0.0.1',
  hostName: 'local-1',
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
  command: '/usr/local/jdk17/bin/java -jar member.jar',
  directory: '/opt/app/demo',
  stdoutLogfile: '/var/log/supervisor/demo_member.log',
  hasBackup: true,
  configContent: '[program:demo_member]\ncommand=java -jar member.jar',
  backupConfigContent: null,
  lastSyncAt: '2026-06-10 12:00:00',
  syncStatus: 'SUCCESS',
  syncError: null,
  isArchived: false,
  archivedAt: null,
  restoredAt: null,
  updatedAt: '2026-06-10 12:00:00',
};

function mountDrawer(props: {
  modelValue: boolean;
  loading: boolean;
  detail: typeof detail | null;
  lifecycleActionLoading?: 'archive' | 'restore' | 'delete' | null;
}) {
  return mount(ServiceDetailDrawer, {
    props,
    global: {
      stubs: {
        ElDescriptions: { template: '<div><slot /></div>' },
        ElDescriptionsItem: {
          props: ['label'],
          template: '<div><span>{{ label }}</span><slot /></div>',
        },
        ElDrawer: { template: '<div><slot /></div>' },
        ElSkeleton: true,
        ElTag: {
          props: ['type', 'effect'],
          template: '<span><slot /></span>',
        },
        ElAlert: {
          props: ['title', 'description', 'type', 'closable', 'showIcon'],
          template: '<div class="el-alert-stub"><strong>{{ title }}</strong><p>{{ description }}</p><slot /></div>',
        },
        ElButton: { emits: ['click'], template: '<button @click="$emit(\'click\')"><slot /></button>' },
        ElIcon: { template: '<i />' },
        ManageModeTag: {
          props: ['mode'],
          template: '<span>{{ mode }}</span>',
        },
        StatusTag: {
          props: ['state'],
          template: '<span>{{ state }}</span>',
        },
        OperationResultPanel: true,
      },
    },
  });
}

describe('ServiceDetailDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders database snapshot fields', () => {
    const wrapper = mountDrawer({
      modelValue: true,
      loading: false,
      detail,
    });

    expect(wrapper.text()).toContain('demo_member');
    expect(wrapper.text()).toContain('TEMPLATE_MANAGED');
    expect(wrapper.text()).toContain('RUNNING');
  });

  it('shows backupConfigContent when returned', () => {
    const wrapper = mountDrawer({
      modelValue: true,
      loading: false,
      detail: {
        ...detail,
        backupConfigContent: '[program:demo_member]\ncommand=java -jar old.jar',
      },
    });

    expect(wrapper.text()).toContain('备份配置内容');
    expect(wrapper.text()).toContain('old.jar');
  });

  it('hides backupConfigContent section when null', () => {
    const wrapper = mountDrawer({
      modelValue: true,
      loading: false,
      detail,
    });

    expect(wrapper.text()).not.toContain('备份配置内容');
  });

  it('shows syncStatus and syncError when present', () => {
    const wrapper = mountDrawer({
      modelValue: true,
      loading: false,
      detail: {
        ...detail,
        syncStatus: 'FAILED',
        syncError: 'Connection refused',
      },
    });

    expect(wrapper.text()).toContain('FAILED');
    expect(wrapper.text()).toContain('Connection refused');
  });

  it('shows archived alert when detail is archived', () => {
    const wrapper = mountDrawer({
      modelValue: true,
      loading: false,
      detail: { ...detail, isArchived: true },
    });

    expect(wrapper.text()).toContain('归档服务');
    expect(wrapper.text()).toContain('运行与同步类动作已禁用');
  });

  it('shows restore and delete actions when detail is archived', () => {
    const wrapper = mountDrawer({
      modelValue: true,
      loading: false,
      detail: { ...detail, isArchived: true },
    });

    expect(wrapper.find('[data-testid="detail-action-sync"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="detail-action-archive"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="detail-action-restore"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="detail-action-delete"]').exists()).toBe(true);
  });

  it('shows sync and archive actions when detail is not archived', () => {
    const wrapper = mountDrawer({
      modelValue: true,
      loading: false,
      detail,
    });

    expect(wrapper.find('[data-testid="detail-action-sync"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="detail-action-archive"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="detail-action-restore"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="detail-action-delete"]').exists()).toBe(false);
  });

  it('shows archived and restored timestamps in basic info section', () => {
    const wrapper = mountDrawer({
      modelValue: true,
      loading: false,
      detail: {
        ...detail,
        isArchived: true,
        archivedAt: '2026-06-09 10:00:00',
        restoredAt: '2026-06-11 08:00:00',
      },
    });

    expect(wrapper.text()).toContain('2026-06-09 10:00:00');
    expect(wrapper.text()).toContain('2026-06-11 08:00:00');
  });

  it('emits sync and calls syncService for non-archived detail', async () => {
    mockSyncService.mockResolvedValue({
      host: '127.0.0.1',
      programName: 'demo_member',
      status: 'RUNNING',
      pid: '12345',
      uptime: '0:10:00',
      syncedFields: ['configContent'],
      warnings: [],
      lastSyncAt: '2026-06-10 12:05:00',
      syncStatus: 'SUCCESS',
      syncError: null,
      commandResults: {},
    });

    const wrapper = mountDrawer({
      modelValue: true,
      loading: false,
      detail,
    });

    const syncButton = wrapper.findAll('button').find((button) => button.text() === '同步现场');
    expect(syncButton).toBeDefined();

    await syncButton!.trigger('click');

    expect(mockSyncService).toHaveBeenCalledWith('127.0.0.1', 'demo_member');
    expect(wrapper.emitted('sync')).toBeTruthy();
  });

  it('emits archive event without calling extra api', async () => {
    const wrapper = mountDrawer({
      modelValue: true,
      loading: false,
      detail,
    });

    const archiveButton = wrapper.findAll('button').find((button) => button.text() === '归档');
    expect(archiveButton).toBeDefined();

    await archiveButton!.trigger('click');

    expect(wrapper.emitted('archive')).toBeTruthy();
    expect(mockSyncService).not.toHaveBeenCalled();
  });

  it('emits restore event for archived detail', async () => {
    const wrapper = mountDrawer({
      modelValue: true,
      loading: false,
      detail: { ...detail, isArchived: true },
    });

    const restoreButton = wrapper.findAll('button').find((button) => button.text() === '还原');
    expect(restoreButton).toBeDefined();

    await restoreButton!.trigger('click');

    expect(wrapper.emitted('restore')).toBeTruthy();
  });

  it('emits delete event for archived detail', async () => {
    const wrapper = mountDrawer({
      modelValue: true,
      loading: false,
      detail: { ...detail, isArchived: true },
    });

    const deleteButton = wrapper.findAll('button').find((button) => button.text() === '删除');
    expect(deleteButton).toBeDefined();

    await deleteButton!.trigger('click');

    expect(wrapper.emitted('delete')).toBeTruthy();
  });
});
