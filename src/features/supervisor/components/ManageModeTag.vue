<template>
  <el-tag :type="tagType" effect="plain">{{ label }}</el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import type { ManageMode } from '@/api/supervisor/supervisor.types';

const props = defineProps<{
  mode: ManageMode;
}>();

const tagType = computed(() => {
  switch (props.mode) {
    case 'TEMPLATE_MANAGED':
      return 'primary';
    case 'IMPORTED_READONLY':
      return 'warning';
    default:
      return 'info';
  }
});

const label = computed(() => {
  switch (props.mode) {
    case 'TEMPLATE_MANAGED':
      return '模板纳管';
    case 'IMPORTED_READONLY':
      return '导入只读';
    default:
      return props.mode || 'UNKNOWN';
  }
});
</script>
