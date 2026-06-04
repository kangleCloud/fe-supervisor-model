import { shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import LoginPage from '@/features/auth/pages/LoginPage.vue';

const login = vi.fn();
const replace = vi.fn();

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ replace }),
}));

vi.mock('@/stores/auth/useAuthStore', () => ({
  useAuthStore: () => ({
    loading: false,
    login,
  }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the default username and password', () => {
    const wrapper = shallowMount(LoginPage, {
      global: {
        stubs: {
          ElAlert: true,
          ElButton: {
            template: '<button><slot /></button>',
          },
          ElForm: {
            template: '<form><slot /></form>',
          },
          ElFormItem: {
            template: '<div><slot /></div>',
          },
          ElInput: {
            props: ['modelValue'],
            template: '<input :value="modelValue" />',
          },
          ElTag: {
            template: '<span><slot /></span>',
          },
        },
      },
    });

    const [usernameInput, passwordInput] = wrapper.findAll('input');

    expect(usernameInput.element.value).toBe('admin');
    expect(passwordInput.element.value).toBe('Admin@123456');
  });
});
