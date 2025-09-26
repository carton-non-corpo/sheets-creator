<script setup lang="ts">
import CardDetailsDialog from '~/components/cards/CardDetailsDialog.vue';
import CardSearch from '~/components/cards/CardSearch.vue';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '~/components/ui/resizable';

const { t } = useI18n();

useSeoMeta({
  title: `Carton Camp ${t('nav.decks')}`,
  ogTitle: `Carton Camp ${t('nav.decks')}`,
  description: t('meta.description'),
  ogDescription: t('meta.description'),
  ogImage: 'https://i.pinimg.com/736x/b2/60/94/b26094970505bcd59c2e5fe8b6f41cf0.jpg',
});

</script>

<template>
  <NuxtLayout>
    <ResizablePanelGroup
      direction="horizontal"
      class="w-full"
    >
      <ResizablePanel :default-size="40" :min-size="32">
        <CardSearch />
      </ResizablePanel>
      <ResizableHandle with-handle />
      <ResizablePanel :default-size="60" :min-size="40">
        fezjvbcenikn
      </ResizablePanel>
    </ResizablePanelGroup>

    <CardDetailsDialog />
  </NuxtLayout>
</template>
