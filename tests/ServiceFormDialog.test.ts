import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ServiceFormDialog from '@/features/supervisor/components/ServiceFormDialog.vue';
import type { ServiceCreatePayload, ServiceUpdatePayload } from '@/api/supervisor/supervisor.types';

function mountDialog(props: {
  modelValue: boolean;
  mode: 'create' | 'edit';
  submitting: boolean;
  initialValue: ServiceCreatePayload | ServiceUpdatePayload;
}) {
  return mount(ServiceFormDialog, {
    props,
    global: {
      stubs: {
        ElDialog: {
          props: ['title'],
          template: '<div><h2>{{ $props.title }}</h2><slot /><slot name="footer" /></div>',
        },
        ElForm: {
          template: '<div><slot /></div>',
          methods: {
            validate() {
              return Promise.resolve(true);
            },
          },
        },
        ElFormItem: {
          props: ['label', 'prop'],
          template: '<div><span class="form-label">{{ label }}</span><slot /></div>',
        },
        ElRow: { template: '<div><slot /></div>' },
        ElCol: { template: '<div><slot /></div>' },
        ElInput: {
          props: ['modelValue', 'placeholder', 'disabled'],
          emits: ['update:modelValue'],
          template: `
            <input
              :value="modelValue"
              :placeholder="placeholder"
              :disabled="disabled"
              @input="$emit('update:modelValue', $event.target.value)"
            />
          `,
        },
        ElInputNumber: {
          props: ['modelValue', 'min', 'max'],
          emits: ['update:modelValue'],
          template: `
            <input
              type="number"
              :value="modelValue"
              :min="min"
              :max="max"
              @input="$emit('update:modelValue', Number($event.target.value))"
            />
          `,
        },
        ElButton: {
          props: ['type', 'loading'],
          emits: ['click'],
          template: '<button :disabled="$props.loading" @click="$emit(\'click\')"><slot /></button>',
        },
      },
    },
  });
}

const createDraft = {
  host: '127.0.0.1',
  jobName: '',
  moduleName: '',
  javaPath: '/usr/local/jdk17/bin/java',
  active: 'prod',
  port: 9001,
  jarName: '',
  fileName: '',
  xms: '128m',
  xmx: '128m',
  user: 'root',
};

const editDraft = {
  jobName: 'demo',
  moduleName: 'member',
  javaPath: '/usr/local/jdk17/bin/java',
  active: 'prod',
  port: 9001,
  jarName: 'member.jar',
  fileName: 'member.ini',
  xms: '256m',
  xmx: '256m',
  user: 'root',
};

describe('ServiceFormDialog', () => {
  it('renders create mode with title "新增服务"', () => {
    const wrapper = mountDialog({
      modelValue: true,
      mode: 'create',
      submitting: false,
      initialValue: createDraft,
    });

    expect(wrapper.text()).toContain('新增服务');
  });

  it('renders edit mode with title "编辑服务"', () => {
    const wrapper = mountDialog({
      modelValue: true,
      mode: 'edit',
      submitting: false,
      initialValue: editDraft,
    });

    expect(wrapper.text()).toContain('编辑服务');
  });

  it('shows host field in create mode', () => {
    const wrapper = mountDialog({
      modelValue: true,
      mode: 'create',
      submitting: false,
      initialValue: createDraft,
    });

    expect(wrapper.text()).toContain('目标主机');
  });

  it('hides host field in edit mode', () => {
    const wrapper = mountDialog({
      modelValue: true,
      mode: 'edit',
      submitting: false,
      initialValue: editDraft,
    });

    expect(wrapper.text()).not.toContain('目标主机');
  });

  it('shows all required form fields', () => {
    const wrapper = mountDialog({
      modelValue: true,
      mode: 'create',
      submitting: false,
      initialValue: createDraft,
    });

    const labels = wrapper.findAll('.form-label').map((el) => el.text());
    expect(labels).toContain('目标主机');
    expect(labels).toContain('运行环境');
    expect(labels).toContain('业务名称');
    expect(labels).toContain('模块名称');
    expect(labels).toContain('Java 路径');
    expect(labels).toContain('端口');
    expect(labels).toContain('配置文件名');
  });

  it('shows create submit button text in create mode', () => {
    const wrapper = mountDialog({
      modelValue: true,
      mode: 'create',
      submitting: false,
      initialValue: createDraft,
    });

    expect(wrapper.text()).toContain('创建服务');
  });

  it('shows save submit button text in edit mode', () => {
    const wrapper = mountDialog({
      modelValue: true,
      mode: 'edit',
      submitting: false,
      initialValue: editDraft,
    });

    expect(wrapper.text()).toContain('保存变更');
  });

  it('shows loading state on submit button when submitting', () => {
    const wrapper = mountDialog({
      modelValue: true,
      mode: 'create',
      submitting: true,
      initialValue: createDraft,
    });

    const submitBtn = wrapper.findAll('button').find((b) => b.text() === '创建服务');
    expect(submitBtn).toBeDefined();
    expect(submitBtn!.attributes('disabled')).not.toBeUndefined();
  });

  it('emits submit with draft data when clicking submit in create mode', async () => {
    const wrapper = mountDialog({
      modelValue: true,
      mode: 'create',
      submitting: false,
      initialValue: { ...createDraft, jobName: 'test', moduleName: 'app', active: 'staging', fileName: 'app.ini' },
    });

    const submitBtn = wrapper.findAll('button').find((b) => b.text() === '创建服务');
    await submitBtn!.trigger('click');

    const submitEvents = wrapper.emitted('submit');
    expect(submitEvents).toBeTruthy();
    if (submitEvents) {
      const payload = submitEvents[0][0] as ServiceCreatePayload | ServiceUpdatePayload;
      expect(payload.jobName).toBe('test');
      expect(payload.moduleName).toBe('app');
      expect(payload.active).toBe('staging');
      expect(payload.fileName).toBe('app.ini');
    }
  });
});
