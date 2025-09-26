<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';


defineOptions({
  name: 'AppHeader',
});

const route = useRoute();

const pageName = computed(() => {
  if (route.path === '/') return $t('nav.sheets');
  if (route.path === '/decks') return $t('nav.decks');
  return '';
});
</script>

<template>
  <header class="flex flex-shrink-0 items-center gap-4 px-8 py-4 bg-white border-b">
    <div class="text-xl font-semibold">{{ pageName }}</div>
  </header>
</template>
