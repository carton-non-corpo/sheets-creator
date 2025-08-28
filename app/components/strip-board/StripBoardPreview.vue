<script setup lang="ts">
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '~/components/ui/dialog';
import { ScrollArea } from '~/components/ui/scroll-area';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { X, Download, Printer } from 'lucide-vue-next';

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const stripBoardStore = useStripBoardStore();
const { stripBoard } = storeToRefs(stripBoardStore);

const { cardsPerPage, exportAllPages, exportSinglePage } = usePdfExport();

const totalCards = computed(() => {
  if (!stripBoard.value) return 0;
  return stripBoard.value.content.reduce((sum, card) => sum + card.quantity, 0);
});

const totalPages = computed(() => {
  const pages = Math.ceil(totalCards.value / cardsPerPage);
  return Math.max(1, pages);
});

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

const allPages = computed(() => {
  const pages = [];
  for (let i = 0; i < totalPages.value; i++) {
    const startIndex = i * cardsPerPage;
    const endIndex = startIndex + cardsPerPage;
    const pageCards = cardsForPrint.value.slice(startIndex, endIndex);
    pages.push({
      pageNumber: i + 1,
      cards: pageCards
    });
  }
  return pages;
});

function closeDialog() {
  emit('update:open', false);
};
</script>

<template>
  <Dialog :open="props.open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-w-4xl w-[90vw] h-[85vh] p-0 flex flex-col">
      <DialogHeader class="p-6 pb-4 border-b flex-shrink-0">
        <div class="flex items-center justify-between">
          <div>
            <DialogTitle class="text-xl font-semibold">Prévisualisation des planches</DialogTitle>
            <DialogDescription class="mt-1">
              Aperçu de toutes vos planches
            </DialogDescription>
          </div>
          <div class="flex items-center gap-3">
            <Badge variant="secondary" class="text-sm">
              {{ totalPages }} page{{ totalPages > 1 ? 's' : '' }} • {{ totalCards }} carte{{ totalCards > 1 ? 's' : '' }}
            </Badge>
            <Button variant="outline" size="sm" @click="() => exportAllPages(allPages, stripBoard?.name)">
              <Download class="w-4 h-4 mr-2" />
              Exporter tout
            </Button>
          </div>
        </div>
      </DialogHeader>
      
      <ScrollArea class="flex-1 overflow-hidden">
        <div class="p-6 space-y-4">
          <div 
            v-for="page in allPages" 
            :key="page.pageNumber"
            class="border rounded-lg p-4 bg-gray-50"
          >
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-medium">Page {{ page.pageNumber }}</h3>
              <div class="flex items-center gap-2">
                <Badge variant="outline">{{ page.cards.length }}/{{ cardsPerPage }} cartes</Badge>
                <Button variant="ghost" size="sm" @click="() => exportSinglePage(page, stripBoard?.name)">
                  <Printer class="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div class="flex justify-center overflow-hidden">
              <div class="w-full max-w-md">
                <StripBoardDisplay 
                  :scale="0.25" 
                  :show-landmarks="true" 
                  :cards="page.cards"
                />
              </div>
            </div>
          </div>
          
          <!-- Empty state if no pages -->
          <div v-if="totalPages === 0" class="text-center py-12 text-gray-500">
            <p class="text-lg">Aucune carte à afficher</p>
            <p class="text-sm mt-2">Ajoutez des cartes à votre strip board pour voir la prévisualisation</p>
          </div>
        </div>
      </ScrollArea>
    </DialogContent>
  </Dialog>
</template>