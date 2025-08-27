<script setup lang="ts">
const props = defineProps<{
  scale: number;
}>()

const stripBoardStore = useStripBoardStore();
const { stripBoard } = storeToRefs(stripBoardStore);

const cardsForPrint = computed(() => {
  if (!stripBoard.value) return [];
  
  const cards = [];
  for (const card of stripBoard.value.content) {
    for (let i = 0; i < card.quantity; i++) {
      cards.push({
        ...card,
        printIndex: cards.length // Unique identifier for each printed instance
      });
    }
  }
  return cards;
});
</script>

<template>
  <div class="flex grow justify-center items-center w-full">
    <div 
      class="strip-board-display-container" 
      :style="`transform: scale(${props.scale}); margin-bottom: calc(-297mm * ${1 - props.scale}); transform-origin: top center; width: 210mm; height: 297mm;`"
    >
      <!-- Actual export content - maintains 210mm x 297mm for PDF export -->
      <div 
        id="to-export"
        class="relative flex flex-col bg-white shadow-xl border border-gray-200 rounded-lg"
        style="width: 210mm; height: 297mm;"
      >
        <div 
          class="grid place-content-center w-full h-full z-1"
          style="grid-template-columns: repeat(3, 63mm); grid-template-rows: repeat(3, 88mm);"
        >
          <div v-for="card in cardsForPrint" :key="card.printIndex" class="relative border-box overflow-hidden">
            <div v-if="card.imageUrl" class="w-full h-full">
              <img 
                :src="card.imageUrl" 
                :alt="card.name || 'Card image'"
                class="w-full h-full object-cover"
                @error="console.log('Image failed to load:', card.imageUrl)"
              />
            </div>
            <div v-else class="flex items-center justify-center w-full h-full px-3 bg-gray-200">
              <span class="text-gray-500 text-xs break-all text-center">{{ card.name || 'No image' }}</span>
            </div>
          </div>
        </div>
        <div class="absolute inset-0 pointer-events-none">
          <svg viewBox="0 0 794 1123"><line x1="41" y1="39.93359375" x2="41" y2="62.60546875" stroke="#000" stroke-width="2"></line><line x1="41" y1="1060.39453125" x2="41" y2="1083.06640625" stroke="#000" stroke-width="2"></line><line x1="279" y1="39.93359375" x2="279" y2="62.60546875" stroke="#000" stroke-width="2"></line><line x1="279" y1="1060.39453125" x2="279" y2="1083.06640625" stroke="#000" stroke-width="2"></line><line x1="279" y1="39.93359375" x2="279" y2="62.60546875" stroke="#000" stroke-width="2"></line><line x1="279" y1="1060.39453125" x2="279" y2="1083.06640625" stroke="#000" stroke-width="2"></line><line x1="517" y1="39.93359375" x2="517" y2="62.60546875" stroke="#000" stroke-width="2"></line><line x1="517" y1="1060.39453125" x2="517" y2="1083.06640625" stroke="#000" stroke-width="2"></line><line x1="517" y1="39.93359375" x2="517" y2="62.60546875" stroke="#000" stroke-width="2"></line><line x1="517" y1="1060.39453125" x2="517" y2="1083.06640625" stroke="#000" stroke-width="2"></line><line x1="755" y1="39.93359375" x2="755" y2="62.60546875" stroke="#000" stroke-width="2"></line><line x1="755" y1="1060.39453125" x2="755" y2="1083.06640625" stroke="#000" stroke-width="2"></line><line x1="17.1640625" y1="64" x2="39.8359375" y2="64" stroke="#000" stroke-width="2"></line><line x1="754.1640625" y1="64" x2="776.8359375" y2="64" stroke="#000" stroke-width="2"></line><line x1="17.1640625" y1="396" x2="39.8359375" y2="396" stroke="#000" stroke-width="2"></line><line x1="754.1640625" y1="396" x2="776.8359375" y2="396" stroke="#000" stroke-width="2"></line><line x1="17.1640625" y1="396" x2="39.8359375" y2="396" stroke="#000" stroke-width="2"></line><line x1="754.1640625" y1="396" x2="776.8359375" y2="396" stroke="#000" stroke-width="2"></line><line x1="17.1640625" y1="729" x2="39.8359375" y2="729" stroke="#000" stroke-width="2"></line><line x1="754.1640625" y1="729" x2="776.8359375" y2="729" stroke="#000" stroke-width="2"></line><line x1="17.1640625" y1="729" x2="39.8359375" y2="729" stroke="#000" stroke-width="2"></line><line x1="754.1640625" y1="729" x2="776.8359375" y2="729" stroke="#000" stroke-width="2"></line><line x1="17.1640625" y1="1061" x2="39.8359375" y2="1061" stroke="#000" stroke-width="2"></line><line x1="754.1640625" y1="1061" x2="776.8359375" y2="1061" stroke="#000" stroke-width="2"></line></svg>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* When printing or exporting, reset the scaling to maintain original dimensions */
@media print {
  .strip-board-display-container {
    transform: none !important;
    margin-bottom: 0 !important;
  }
}
</style>