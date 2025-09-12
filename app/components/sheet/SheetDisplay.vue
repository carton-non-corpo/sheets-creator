<script setup lang="ts">
import { Minus, Plus } from 'lucide-vue-next';
import type { SheetContentCard } from '~~/common/types/sheet'
import type { EnhancedFile } from '~~/common/types/drive'

const props = defineProps<{
  scale: number;
  showLandmarks: boolean;
  showPlaceholders: boolean;
  cards: Array<SheetContentCard & { printIndex: number }> | undefined;
  bleed: number | undefined;
}>()

const sheetStore = useSheetStore();
const { sheet } = storeToRefs(sheetStore);
const { addCard, removeCard } = sheetStore;

function handleCardAddition(card: SheetContentCard & { printIndex: number }) {
  
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
  
  if (!sheet.value) return [];
  
  const cards = [];
  for (const card of sheet.value.content) {
    for (let i = 0; i < card.quantity; i++) {
      cards.push({
        ...card,
        printIndex: cards.length // Unique identifier for each printed instance
      });
    }
  }
  return cards;
});

const gridStyleByBleed = computed(() => {
  return `grid-template-columns: repeat(3, calc(63mm + ${props.bleed}mm)); grid-template-rows: repeat(3, calc(88mm + ${props.bleed}mm));`;
});

const placeholders = computed(() => 9 - cardsForPrint.value.length)
</script>

<template>
  <div class="flex grow justify-center items-center w-full">
    <div 
      class="sheet-display-container" 
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
          :style="gridStyleByBleed"
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
              <span class="text-gray-500 text-xs break-all text-center">{{ card.name || $t('sheet.display.no_image') }}</span>
            </div>

            <!-- Gradient black overlay on hover -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>

            <!-- Buttons in top right corner - only show on hover -->
            <div class="absolute top-2 right-2 flex flex-col gap-1">
              <Button 
                size="sm" 
                variant="secondary" 
                class="hidden group-hover:flex h-8 w-8 p-0 ml-auto mr-0.25 rounded shadow-md border-1 border-gray-800 cursor-pointer hover:bg-gray-200"
                @click.stop="removeCard(card.id)"
              >
                <Minus class="h-5 w-5" />
              </Button>

              <Button 
                size="sm" 
                variant="secondary" 
                class="hidden group-hover:flex h-8 w-8 p-0 ml-auto mr-0.25 rounded shadow-md border-1 border-gray-800 cursor-pointer hover:bg-gray-200"
                @click.stop="handleCardAddition(card)"
              >
                <Plus class="h-5 w-5" />
              </Button>
            </div>
          </div>
          <template v-if="props.showPlaceholders">
            <div v-for="placeholder in placeholders" :key="placeholder" class="relative border-box overflow-hidden border border-gray-100" />
          </template>
        </div>

        <div
          v-if="props.showLandmarks"
          class="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
        >
          <img
            :src="`/landmarks-bleed-${props.bleed}mm.svg`"
            :alt="`Landmarks with ${props.bleed}mm bleed`"
            class="max-w-full max-h-full"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* When printing or exporting, reset the scaling to maintain original dimensions */
@media print {
  .sheet-display-container {
    transform: none !important;
    margin-bottom: 0 !important;
  }
}
</style>
