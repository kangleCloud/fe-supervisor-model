<template>
  <el-tag :type="tagType" effect="light">{{ label }}</el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  state?: string | null;
}>();

const normalizedState = computed(() => props.state?.toUpperCase() || 'UNKNOWN');

const tagType = computed(() => {
  switch (normalizedState.value) {
    case 'RUNNING':
      return 'success';
    case 'STARTING':
    case 'BACKOFF':
      return 'warning';
    case 'FATAL':
    case 'EXITED':
      return 'danger';
    case 'STOPPED':
      return 'info';
    default:
      return 'info';
  }
});

const label = computed(() => normalizedState.value);
</script>
