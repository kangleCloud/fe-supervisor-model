import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import OperationResultPanel from '@/features/supervisor/components/OperationResultPanel.vue';

function mountPanel(props: {
  syncedFields?: string[];
  warnings?: string[];
  commandResults?: { steps: { exitCode: number; stdout: string; stderr: string; backupPath?: string }[] };
}) {
  return mount(OperationResultPanel, {
    props,
    global: {
      stubs: {
        ElTag: {
          props: ['type', 'effect', 'size'],
          template: '<span :class="$props.type"><slot /></span>',
        },
        ElButton: {
          props: ['size', 'icon', 'text'],
          emits: ['click'],
          template: '<button @click="$emit(\'click\')"><slot /></button>',
        },
        ElIcon: { template: '<i />' },
      },
    },
  });
}

describe('OperationResultPanel', () => {
  it('renders nothing when all props are empty', () => {
    const wrapper = mountPanel({});

    expect(wrapper.find('.op-result').exists()).toBe(false);
  });

  it('renders nothing when syncedFields is empty array', () => {
    const wrapper = mountPanel({ syncedFields: [] });

    expect(wrapper.find('.op-result').exists()).toBe(false);
  });

  it('shows synced fields section when syncedFields has items', () => {
    const wrapper = mountPanel({ syncedFields: ['configContent', 'command'] });

    expect(wrapper.text()).toContain('同步字段');
    expect(wrapper.text()).toContain('configContent');
    expect(wrapper.text()).toContain('command');
  });

  it('shows warnings section when warnings has items', () => {
    const wrapper = mountPanel({ warnings: ['Connection timeout'] });

    expect(wrapper.text()).toContain('告警');
    expect(wrapper.text()).toContain('Connection timeout');
  });

  it('shows command execution results section', () => {
    const wrapper = mountPanel({
      commandResults: {
        steps: [
          { exitCode: 0, stdout: 'OK\n', stderr: '' },
          { exitCode: 1, stdout: '', stderr: 'Error: failed\n' },
        ],
      },
    });

    expect(wrapper.text()).toContain('命令执行结果');
    expect(wrapper.text()).toContain('Step 1');
    expect(wrapper.text()).toContain('Step 2');
    expect(wrapper.text()).toContain('exit 0');
    expect(wrapper.text()).toContain('exit 1');
  });

  it('renders stdout content in code block', () => {
    const wrapper = mountPanel({
      commandResults: {
        steps: [{ exitCode: 0, stdout: 'deploy success', stderr: '' }],
      },
    });

    expect(wrapper.text()).toContain('deploy success');
  });

  it('renders stderr content in stderr code block', () => {
    const wrapper = mountPanel({
      commandResults: {
        steps: [{ exitCode: 1, stdout: '', stderr: 'permission denied' }],
      },
    });

    expect(wrapper.text()).toContain('permission denied');
  });

  it('shows header with close button', () => {
    const wrapper = mountPanel({ syncedFields: ['field1'] });

    expect(wrapper.text()).toContain('操作结果');
    // The close button should exist
    const buttons = wrapper.findAll('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('emits close when close button is clicked', async () => {
    const wrapper = mountPanel({ syncedFields: ['field1'] });

    const closeBtn = wrapper.find('button');
    await closeBtn.trigger('click');

    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('renders multiple sections simultaneously', () => {
    const wrapper = mountPanel({
      syncedFields: ['configContent'],
      warnings: ['Memory warning'],
      commandResults: {
        steps: [{ exitCode: 0, stdout: 'done', stderr: '' }],
      },
    });

    expect(wrapper.text()).toContain('同步字段');
    expect(wrapper.text()).toContain('告警');
    expect(wrapper.text()).toContain('命令执行结果');
  });

  it('renders exit 0 as success tag type', () => {
    const wrapper = mountPanel({
      commandResults: {
        steps: [{ exitCode: 0, stdout: 'ok', stderr: '' }],
      },
    });

    const successTag = wrapper.find('.success');
    expect(successTag.exists()).toBe(true);
    expect(successTag.text()).toBe('exit 0');
  });

  it('renders non-zero exit as danger tag type', () => {
    const wrapper = mountPanel({
      commandResults: {
        steps: [{ exitCode: 127, stdout: '', stderr: 'command not found' }],
      },
    });

    const dangerTag = wrapper.find('.danger');
    expect(dangerTag.exists()).toBe(true);
    expect(dangerTag.text()).toBe('exit 127');
  });
});
