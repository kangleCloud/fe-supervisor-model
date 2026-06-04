<template>
  <div class="login-page">
    <section class="login-page__intro">
      <div class="login-page__badge">Supervisor 控制台</div>
      <h1 class="login-page__title">登录后管理主机上的 Supervisor 服务</h1>
      <p class="login-page__description">
        面向运维后台的前端控制台，集中处理服务查询、启停、配置变更、备份恢复与端口冲突检测。
      </p>

      <div class="login-page__facts">
        <div class="login-page__fact">
          <div class="login-page__fact-label">鉴权头</div>
          <div class="login-page__fact-value">Authorization: Bearer</div>
        </div>
        <div class="login-page__fact">
          <div class="login-page__fact-label">会话存储</div>
          <div class="login-page__fact-value">localStorage</div>
        </div>
        <div class="login-page__fact">
          <div class="login-page__fact-label">技术栈</div>
          <div class="login-page__fact-value">Vue 3 / TS / Element Plus</div>
        </div>
      </div>
    </section>

    <section class="login-page__panel">
      <div class="login-page__panel-header">
        <div>
          <div class="login-page__panel-eyebrow">账号登录</div>
          <h2 class="login-page__panel-title">进入控制台</h2>
        </div>
        <el-tag type="success" effect="light">本地持久化 Token</el-tag>
      </div>

      <el-alert
        title="当前前端预期后端提供 /admin/api/auth/login、/profile、/logout 接口。"
        type="info"
        :closable="false"
        show-icon
      />

      <el-form
        ref="formRef"
        class="login-page__form"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="handleSubmit"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="form.username"
            :prefix-icon="User"
            autocomplete="username"
            placeholder="请输入用户名"
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            :prefix-icon="Lock"
            autocomplete="current-password"
            placeholder="请输入密码"
            show-password
            type="password"
            @keyup.enter="handleSubmit"
          />
        </el-form-item>

        <div class="login-page__actions">
          <el-button class="login-page__submit" type="primary" :loading="authStore.loading" @click="handleSubmit">
            登录
          </el-button>
        </div>
      </el-form>
    </section>
  </div>
</template>

<script setup lang="ts">
import { Lock, User } from '@element-plus/icons-vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { resolvePostLoginRedirect } from '@/router/authRedirect';
import { useAuthStore } from '@/stores/auth/useAuthStore';

interface LoginForm {
  username: string;
  password: string;
}

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const formRef = ref<FormInstance>();
const form = reactive<LoginForm>({
  username: 'admin',
  password: 'Admin@123456',
});

const rules: FormRules<LoginForm> = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
};

async function handleSubmit() {
  const isValid = await formRef.value?.validate().catch(() => false);

  if (!isValid) {
    return;
  }

  try {
    await authStore.login(form);
    ElMessage.success('登录成功');
    await router.replace(resolvePostLoginRedirect(route.query.redirect));
  } catch (error) {
    const message = error instanceof Error ? error.message : '登录失败';
    ElMessage.error(message);
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(360px, 480px);
  background:
    radial-gradient(circle at top left, rgba(31, 143, 95, 0.12), transparent 30%),
    linear-gradient(180deg, #f8fafc 0%, #eef2f5 100%);
}

.login-page__intro {
  padding: 64px clamp(32px, 6vw, 88px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 20px;
}

.login-page__badge {
  width: fit-content;
  padding: 7px 12px;
  border-radius: 999px;
  background: rgba(31, 143, 95, 0.12);
  color: #166345;
  font-size: 12px;
  font-weight: 600;
}

.login-page__title {
  margin: 0;
  max-width: 10ch;
  font-size: clamp(32px, 4vw, 48px);
  line-height: 1.08;
  font-weight: 700;
}

.login-page__description {
  margin: 0;
  max-width: 58ch;
  color: #4b5563;
  font-size: 16px;
}

.login-page__facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.login-page__fact {
  min-height: 120px;
  padding: 18px;
  border: 1px solid #dbe2e8;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.72);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.login-page__fact-label {
  color: #6b7280;
  font-size: 12px;
}

.login-page__fact-value {
  font-size: 16px;
  font-weight: 600;
}

.login-page__panel {
  padding: 32px;
  background: rgba(255, 255, 255, 0.94);
  border-left: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 20px;
}

.login-page__panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.login-page__panel-eyebrow {
  font-size: 12px;
  color: #6b7280;
}

.login-page__panel-title {
  margin: 4px 0 0;
  font-size: 28px;
  font-weight: 700;
}

.login-page__form {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.login-page__actions {
  margin-top: 4px;
}

.login-page__submit {
  width: 100%;
}

@media (max-width: 1024px) {
  .login-page {
    grid-template-columns: 1fr;
  }

  .login-page__facts {
    grid-template-columns: 1fr;
  }
}
</style>
