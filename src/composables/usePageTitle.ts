import { computed } from 'vue';
import { useRoute } from 'vue-router';

export function usePageTitle() {
  const route = useRoute();

  const pageTitle = computed(() => {
    return typeof route.meta.title === 'string' ? route.meta.title : 'Supervisor Console';
  });

  return {
    pageTitle,
  };
}
