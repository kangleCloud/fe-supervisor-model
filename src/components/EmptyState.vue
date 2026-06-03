<template>
  <div class="empty-state">
    <el-icon class="empty-state__icon"><component :is="icon" /></el-icon>
    <div class="empty-state__title">{{ title }}</div>
    <div class="empty-state__description">{{ description }}</div>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  description: string;
  icon: object;
}>();
</script>
