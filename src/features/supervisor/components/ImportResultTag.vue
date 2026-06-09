<template>
  <el-tag :type="tagType" effect="light">{{ label }}</el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import type { ImportResultStatus } from '@/api/supervisor/supervisor.types';

const props = defineProps<{
  result: ImportResultStatus;
}>();

const tagType = computed(() => {
  switch (props.result) {
    case 'PLANNED':
      return 'primary';
    case 'IMPORTED':
      return 'success';
    case 'UPDATED':
      return 'warning';
    case 'SKIPPED':
      return 'info';
    default:
      return 'info';
  }
});

const label = computed(() => props.result);
</script>
