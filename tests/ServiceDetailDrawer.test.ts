import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ServiceDetailDrawer from '@/features/supervisor/components/ServiceDetailDrawer.vue';
import type { SupervisorServiceDetail } from '@/api/supervisor/supervisor.types';

const detail: SupervisorServiceDetail = {
  id: 1,
  host: '127.0.0.1',
  jobName: 'demo',
  moduleName: 'member',
  programName: 'demo_member',
  configName: 'demo_member.ini',
  configPath: 'demo_member.ini',
  fileName: 'demo_member.ini',
  contentProgramName: 'demo_member',
  manageMode: 'TEMPLATE_MANAGED' as const,
  metadataComplete: true,
  parseWarnings: [],
  javaPath: '/usr/local/jdk17/bin/java',
  active: 'prod',
  port: 9001,
  jarName: 'member.jar',
  xms: '128m',
  xmx: '128m',
  user: 'root',
  status: {
    programName: 'demo_member',
    state: 'RUNNING' as const,
    raw: 'demo_member RUNNING pid 12345, uptime 0:10:00',
  },
  fileState: 'MATCH' as const,
  expectedContent: '[program:demo_member]\ncommand=java -jar member.jar',
};

type DrawerProps = {
  modelValue: boolean;
  loading: boolean;
  detail: typeof detail | null;
};

function mountDrawer(props: DrawerProps) {
  return mount(ServiceDetailDrawer, {
    props,
    global: {
      stubs: {
        ElDescriptions: {
          template: '<div><slot /></div>',
        },
        ElDescriptionsItem: {
          props: ['label'],
          template: '<div><span>{{ label }}</span><slot /></div>',
        },
        ElDrawer: {
          template: '<div><slot /></div>',
        },
        ElSkeleton: true,
        ElTag: {
          template: '<span><slot /></span>',
        },
        FileStateTag: {
          props: ['fileState'],
          template: '<span class="file-state-tag">{{ fileState }}</span>',
        },
        ManageModeTag: {
          props: ['mode'],
          template: '<span class="manage-mode-tag">{{ mode }}</span>',
        },
        StatusTag: {
          props: ['state'],
          template: '<span class="status-tag">{{ state }}</span>',
        },
      },
    },
  });
}

describe('ServiceDetailDrawer', () => {
  it('shows fileState and hides remoteContent when the backend does not return it', () => {
    const wrapper = mountDrawer({
      modelValue: true,
      loading: false,
      detail,
    });

    expect(wrapper.text()).toContain('MATCH');
    expect(wrapper.text()).toContain(detail.expectedContent);
    expect(wrapper.text()).not.toContain('现场配置内容');
  });

  it('shows remoteContent when the backend returns a mismatch snapshot', () => {
    const wrapper = mountDrawer({
      modelValue: true,
      loading: false,
      detail: {
        ...detail,
        fileState: 'MISMATCH',
        remoteContent: '[program:demo_member]\ncommand=java -jar changed.jar',
      },
    });

    expect(wrapper.text()).toContain('MISMATCH');
    expect(wrapper.text()).toContain('现场配置内容');
    expect(wrapper.text()).toContain('changed.jar');
  });
});
