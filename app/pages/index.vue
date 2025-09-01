<script setup lang="ts">
import CardSearch from '~/components/cards/CardSearch.vue';
import SheetSection from '~/components/sheet/SheetSection.vue';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '~/components/ui/resizable';

definePageMeta({ name: 'Planches', title: 'Planches' })

const sheetStore = useSheetStore();
const { sheet } = storeToRefs(sheetStore);

// Watch for changes in the sheet and log them
watch(sheet, (newSheet) => {
  if (newSheet) {
    console.log('Sheet updated:', {
      id: newSheet.id,
      name: newSheet.name,
      bleed: newSheet.bleed,
      totalCards: newSheet.content.length,
      totalQuantity: newSheet.content.reduce((sum, card) => sum + card.quantity, 0),
      content: newSheet.content.map(card => ({
        id: card.id,
        name: card.name,
        quantity: card.quantity,
        bleed: card.bleed
      }))
    });
  } else {
    console.log('Sheet is null');
  }
}, { deep: true });
</script>

<template>
  <NuxtLayout>
    <ResizablePanelGroup
      direction="horizontal"
      class="w-full"
    >
      <ResizablePanel :default-size="40" :min-size="24">
        <CardSearch />
      </ResizablePanel>
      <ResizableHandle with-handle />
      <ResizablePanel :default-size="60" :min-size="40">
        <SheetSection />
      </ResizablePanel>
    </ResizablePanelGroup>
  </NuxtLayout>
</template>
