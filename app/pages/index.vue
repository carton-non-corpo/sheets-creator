<script setup lang="ts">
import CardDetailsDialog from '~/components/cards/CardDetailsDialog.vue';
import CardSearch from '~/components/cards/CardSearch.vue';
import SheetSection from '~/components/sheet/SheetSection.vue';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '~/components/ui/resizable';

const { t } = useI18n();

// Sheet store logic
const sheetStore = useSheetStore();
const { addCard, removeCard, getCardQuantity } = sheetStore;

useSeoMeta({
  title: `Carton Camp - ${t('nav.sheets')}`,
  ogTitle: `Carton Camp - ${t('nav.sheets')}`,
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
        <CardSearch
          :get-card-quantity="getCardQuantity"
          @add-card="addCard"
          @remove-card="removeCard"
        />
      </ResizablePanel>
      <ResizableHandle with-handle />
      <ResizablePanel :default-size="60" :min-size="40">
        <SheetSection />
      </ResizablePanel>
    </ResizablePanelGroup>

    <CardDetailsDialog />
  </NuxtLayout>
</template>
