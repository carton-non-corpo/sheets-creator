<script setup lang="ts">
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { ScrollArea } from '~/components/ui/scroll-area';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip';
import { Download, GalleryHorizontalEnd, Layers, Info } from 'lucide-vue-next';

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const sheetStore = useSheetStore();
const { sheet } = storeToRefs(sheetStore);

const { cardsPerPage, exportAllPages } = usePdfExport();

const { exportSheetsAsJson } = useJsonExport();

const totalCards = computed(() => {
  if (!sheet.value) return 0;
  return sheet.value.content.reduce((sum, card) => sum + card.quantity, 0);
});

const totalUniqueCards = computed(() => {
  return sheet.value?.content.length || 0;
});

// Create pages with bleed breaks
const allPages = computed(() => {
  if (!sheet.value) return [];

  const pages = [];
  const cards = [];

  // Expand all cards with their quantities
  for (const card of sheet.value.content) {
    for (let i = 0; i < card.quantity; i++) {
      cards.push({
        ...card,
        printIndex: cards.length,
      });
    }
  }

  if (cards.length === 0) return [];

  let currentPage = [];
  let currentBleed = cards[0]?.bleed ?? 0;

  for (const card of cards) {
    // If bleed changes or page is full, start a new page
    if (card.bleed !== currentBleed || currentPage.length >= cardsPerPage) {
      if (currentPage.length > 0) {
        pages.push({
          pageNumber: pages.length + 1,
          cards: [...currentPage],
          bleed: currentBleed ?? 0,
        });
      }
      currentPage = [];
      currentBleed = card.bleed ?? 0;
    }

    currentPage.push(card);
  }

  // Add the last page if it has cards
  if (currentPage.length > 0) {
    pages.push({
      pageNumber: pages.length + 1,
      cards: currentPage,
      bleed: currentBleed ?? 0,
    });
  }

  return pages;
});

function closeDialog() {
  emit('update:open', false);
};
</script>

<template>
  <Dialog :open="props.open" @update:open="closeDialog">
    <DialogContent class="min-w-xl max-w-4xl w-[90vw] h-[85vh] p-0 flex flex-col">
      <DialogHeader class="p-6 pb-4 border-b flex-shrink-0">
        <div class="flex items-center justify-between">
          <div class="flex gap-1.5">
            <DialogTitle class="text-xl font-semibold">{{ $t('sheet.preview.title') }}</DialogTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger as-child class="mt-0.5">
                  <Button variant="ghost" size="sm" class="h-auto w-auto py-1 !px-1">
                    <Info class="w-4 h-4 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" class="max-w-xs">
                  <img src="/save_as_pdf.png" alt="Guide d'export PDF" class="w-full" />
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </DialogHeader>

      <ScrollArea class="flex-1 overflow-hidden">
        <div class="p-6 pt-0 space-y-4">

          <div class="flex justify-center gap-4">
            <div class="flex items-center gap-1.5 px-3 py-1.75 text-foreground bg-muted/50 rounded-md border">
              <GalleryHorizontalEnd class="w-4 h-4 text-muted-foreground mr-0.5" />
              <span class="text-sm font-medium">{{ totalUniqueCards }}</span>
              <span class="text-xs text-muted-foreground">{{ $t('sheet.preview.unique', totalUniqueCards) }}</span>
            </div>

            <div class="flex items-center gap-1.5 px-3 py-1.75 text-foreground bg-muted/50 rounded-md border">
              <Layers class="w-4 h-4 text-muted-foreground mr-0.5" />
              <span class="text-sm font-medium">{{ totalCards }}</span>
              <span class="text-xs text-muted-foreground">{{ $t('sheet.preview.total', totalCards) }}</span>
            </div>

            <Button variant="outline" class="cursor-pointer" @click="exportSheetsAsJson">
              <Download />
              {{ $t('sheet.section.export_as_json') }}
            </Button>
            <Button variant="outline" class="cursor-pointer" @click="() => exportAllPages(allPages, sheet?.name)">
              <Download class="w-4 h-4" />
              {{ $t('sheet.section.export_all') }}
            </Button>
          </div>

          <div
            v-for="page in allPages"
            :key="page.pageNumber"
            class="border rounded-lg p-4 bg-gray-50"
          >
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-medium text-foreground">Page {{ page.pageNumber }}</h3>
              <div class="flex items-center gap-2">
                <Badge variant="secondary">{{ page.bleed }}mm bleed</Badge>
                <Badge variant="outline">{{ page.cards.length }}/{{ cardsPerPage }} {{ $t('sheet.preview.cards', page.cards.length) }}</Badge>
              </div>
            </div>

            <div class="flex justify-center overflow-hidden">
              <div class="w-full max-w-md">
                <SheetDisplay
                  :scale="0.25"
                  :show-landmarks="true"
                  :show-placeholders="false"
                  :bleed="page.bleed"
                  :cards="page.cards"
                />
              </div>
            </div>
          </div>

          <!-- Empty state if no pages -->
          <div v-if="allPages.length === 0" class="text-center py-12 text-gray-500">
            <p class="text-lg">{{ $t('sheet.preview.empty') }}</p>
            <p class="text-sm mt-2">{{ $t('sheet.preview.empty_hint') }}</p>
          </div>
        </div>
      </ScrollArea>
    </DialogContent>
  </Dialog>
</template>
