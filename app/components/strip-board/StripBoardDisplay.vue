<script setup lang="ts">
import { Minus, Plus } from 'lucide-vue-next';
import type { StripBoardContentCard } from '~~/common/types/strip_board'
import type { EnhancedFile } from '~~/common/types/drive'

const props = defineProps<{
  scale: number;
  showLandmarks: boolean;
  cards?: Array<StripBoardContentCard & { printIndex: number }>;
}>()

const stripBoardStore = useStripBoardStore();
const { stripBoard } = storeToRefs(stripBoardStore);
const { addCard, removeCard } = stripBoardStore;

function handleCardAddition(card: StripBoardContentCard & { printIndex: number }) {
  
  // Convert the card back to EnhancedFile format for addCard
  const enhancedFile: EnhancedFile = {
    id: card.id,
    name: card.name,
    mimeType: card.mimeType,
    parents: card.parents,
    thumbnailLink: card.thumbnailLink,
    webContentLink: card.webContentLink,
    webViewLink: card.webViewLink,
    imageUrl: card.imageUrl,
    downloadUrl: card.downloadUrl,
    viewUrl: card.viewUrl
  };
  
  addCard(enhancedFile);
}

const cardsForPrint = computed(() => {
  if (props.cards) {
    return props.cards;
  }
  
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

const placeholders = computed(() => 9 - cardsForPrint.value.length)
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
          <div 
            v-for="card in cardsForPrint" 
            :key="card.printIndex" 
            class="relative border-box overflow-hidden group cursor-pointer"
            @click="handleCardAddition(card)"
            @contextmenu.prevent="removeCard(card.id)"
          >
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

            <!-- Gradient black overlay on hover -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>

            <!-- Buttons in top right corner - only show on hover -->
            <div class="absolute top-2 right-2 flex flex-col gap-1">
              <Button 
                size="sm" 
                variant="secondary" 
                class="hidden group-hover:flex h-8 w-8 p-0 ml-auto mr-0.25 rounded shadow-md border-1 border-gray-800 cursor-pointer disabled:!cursor-not-allowed disabled:opacity-70"
                @click="removeCard(card.id)"
              >
                <Minus class="h-5 w-5" />
              </Button>

              <Button 
                size="sm" 
                variant="secondary" 
                class="hidden group-hover:flex h-8 w-8 p-0 ml-auto mr-0.25 rounded shadow-md border-1 border-gray-800 cursor-pointer disabled:!cursor-not-allowed disabled:opacity-70"
                @click="handleCardAddition(card)"
              >
                <Plus class="h-5 w-5" />
              </Button>
            </div>
          </div>
          <div v-for="placeholder in placeholders" :key="placeholder" class="relative border-box overflow-hidden border border-gray-100" />
        </div>
        <div v-if="props.showLandmarks" class="absolute inset-0 pointer-events-none">
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