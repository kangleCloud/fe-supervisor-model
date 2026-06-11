<template>
  <el-tag :type="tagType" effect="light">{{ label }}</el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import type { SupervisorState } from '@/api/supervisor/supervisor.types';

const props = defineProps<{
  state?: SupervisorState | null;
}>();

const normalizedState = computed<SupervisorState>(() => (props.state || 'UNKNOWN'));

const tagType = computed(() => {
  switch (normalizedState.value) {
    case 'RUNNING':
      return 'success';
    case 'STARTING':
    case 'STOPPING':
    case 'BACKOFF':
      return 'warning';
    case 'FATAL':
      return 'danger';
    case 'STOPPED':
    case 'EXITED':
    case 'UNKNOWN':
    default:
      return 'info';
  }
});

const label = computed(() => normalizedState.value);
</script>
