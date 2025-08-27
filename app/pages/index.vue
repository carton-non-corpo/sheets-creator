<script setup lang="ts">
import CardSearch from '~/components/cards/CardSearch.vue';
import StripBoardSection from '~/components/strip-board/StripBoardSection.vue';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '~/components/ui/resizable';

definePageMeta({ name: 'Planches', title: 'Planches' })

const stripBoardStore = useStripBoardStore();
const { stripBoard } = storeToRefs(stripBoardStore);

// Watch for changes in the strip board and log them
watch(stripBoard, (newStripBoard) => {
  if (newStripBoard) {
    console.log('Strip board updated:', {
      id: newStripBoard.id,
      name: newStripBoard.name,
      totalCards: newStripBoard.content.length,
      totalQuantity: newStripBoard.content.reduce((sum, card) => sum + card.quantity, 0),
      content: newStripBoard.content.map(card => ({
        id: card.id,
        name: card.name,
        quantity: card.quantity
      }))
    });
  } else {
    console.log('Strip board is null');
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
        <StripBoardSection />
      </ResizablePanel>
    </ResizablePanelGroup>
  </NuxtLayout>
</template>
