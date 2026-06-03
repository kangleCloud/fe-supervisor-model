<template>
  <el-container class="shell">
    <el-aside class="shell__aside" width="252px">
      <div class="shell__brand">
        <div class="shell__brand-mark">SM</div>
        <div>
          <div class="shell__brand-title">Supervisor Console</div>
          <div class="shell__brand-subtitle">be-supervisor-model 前端</div>
        </div>
      </div>

      <el-menu
        class="shell__menu"
        :default-active="String(route.name)"
        router
        background-color="transparent"
        text-color="#d4d7dd"
        active-text-color="#ffffff"
      >
        <el-menu-item index="supervisor" :route="{ name: 'supervisor' }">
          <el-icon><Monitor /></el-icon>
          <span>Supervisor 管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="shell__header">
        <div>
          <div class="shell__eyebrow">控制台</div>
          <h1 class="shell__title">{{ pageTitle }}</h1>
        </div>

        <div class="shell__toolbar">
          <div class="shell__user">
            <span class="shell__user-name">{{ authStore.user?.displayName || authStore.user?.username }}</span>
            <span class="shell__user-role">{{ authStore.user?.roles.join(', ') || '运维用户' }}</span>
          </div>
          <el-button type="danger" plain :icon="SwitchButton" @click="handleLogout">退出</el-button>
        </div>
      </el-header>

      <el-main class="shell__main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { Monitor, SwitchButton } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useRoute, useRouter } from 'vue-router';

import { usePageTitle } from '@/composables/usePageTitle';
import { useAuthStore } from '@/stores/auth/useAuthStore';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const { pageTitle } = usePageTitle();

async function handleLogout() {
  await authStore.logout();
  ElMessage.success('已退出登录');
  await router.push('/login');
}
</script>
