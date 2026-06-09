<template>
  <el-tag :type="tagType" effect="light">{{ label }}</el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import type { FileState } from '@/api/supervisor/supervisor.types';

const props = defineProps<{
  fileState: FileState;
}>();

const tagType = computed(() => {
  switch (props.fileState) {
    case 'MATCH':
      return 'success';
    case 'MISSING':
      return 'danger';
    case 'MISMATCH':
      return 'warning';
    default:
      return 'info';
  }
});

const label = computed(() => {
  switch (props.fileState) {
    case 'MATCH':
      return 'MATCH';
    case 'MISSING':
      return 'MISSING';
    case 'MISMATCH':
      return 'MISMATCH';
    default:
      return 'UNKNOWN';
  }
});
</script>
