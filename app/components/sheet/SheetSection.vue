<script setup lang="ts">
import { Switch } from '~/components/ui/switch';
import { Label } from '~/components/ui/label';
import { Button } from '~/components/ui/button';
import { Download, Search, Upload } from 'lucide-vue-next';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationEllipsis } from '~/components/ui/pagination';
import { useResizeObserver } from '@vueuse/core';

const sheetStore = useSheetStore();
const { sheet } = storeToRefs(sheetStore);

const { exportSheetsAsJson, importSheetsAsJson } = useJsonExport();

const landmarks = ref<boolean>(true);
const currentPage = ref<number>(1);
const previewDialogOpen = ref<boolean>(false);
const cardsPerPage = 9; // 3x3 grid

// Template ref for the sheet container
const sheetContainer = ref<HTMLElement>();

// Reactive container dimensions
const containerWidth = ref(0);
const containerHeight = ref(0);

// A4 dimensions in mm
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

// Convert mm to pixels (approximately 3.78 pixels per mm at 96 DPI)
const MM_TO_PX = 3.78;

// Computed scale based on container dimensions
const responsiveScale = computed(() => {
  if (!containerWidth.value || !containerHeight.value) {
    return 0.5; // fallback scale
  }

  const a4WidthPx = A4_WIDTH_MM * MM_TO_PX;
  const a4HeightPx = A4_HEIGHT_MM * MM_TO_PX;

  // Calculate scale to fit both width and height with some padding (20px on each side)
  const padding = 40; // 20px on each side
  const availableWidth = containerWidth.value - padding;
  const availableHeight = containerHeight.value - padding;

  const scaleX = availableWidth / a4WidthPx;
  const scaleY = availableHeight / a4HeightPx;

  // Use the smaller scale to ensure it fits in both dimensions
  const scale = Math.min(scaleX, scaleY);

  // Clamp between reasonable bounds
  return Math.max(0.1, Math.min(0.7, scale));
});

// Resize observer to track container size changes
const { stop: stopResizeObserver } = useResizeObserver(sheetContainer, entries => {
  const entry = entries[0];
  if (entry) {
    containerWidth.value = entry.contentRect.width;
    containerHeight.value = entry.contentRect.height;
  }
});

// Cleanup on unmount
onUnmounted(() => {
  stopResizeObserver();
});

const totalCards = computed(() => {
  if (!sheet.value) return 0;
  return sheet.value.content.reduce((sum, card) => sum + card.quantity, 0);
});

// Create pages with bleed breaks for pagination
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

  let currentPageCards = [];
  let currentBleed = cards[0]?.bleed;

  for (const card of cards) {
    // If bleed changes or page is full, start a new page
    if (card.bleed !== currentBleed || currentPageCards.length >= cardsPerPage) {
      if (currentPageCards.length > 0) {
        pages.push({
          pageNumber: pages.length + 1,
          cards: [...currentPageCards],
          bleed: currentBleed,
        });
      }
      currentPageCards = [];
      currentBleed = card.bleed;
    }

    currentPageCards.push(card);
  }

  // Add the last page if it has cards
  if (currentPageCards.length > 0) {
    pages.push({
      pageNumber: pages.length + 1,
      cards: currentPageCards,
      bleed: currentBleed,
    });
  }

  return pages;
});

const totalPages = computed(() => {
  return Math.max(1, allPages.value.length);
});

const paginatedCards = computed(() => {
  const currentPageData = allPages.value[currentPage.value - 1];
  return currentPageData ? currentPageData.cards : [];
});

const pageBleed = computed(() => {
  const currentPageData = allPages.value[currentPage.value - 1];
  return currentPageData ? currentPageData.bleed : 0;
});

// Watch for changes in totalPages and adjust currentPage if needed
watch(totalPages, (newTotalPages, oldTotalPages) => {
  if (newTotalPages < oldTotalPages && currentPage.value > newTotalPages) {
    currentPage.value = Math.max(1, newTotalPages);
  }
}, { immediate: false });
</script>

<template>
  <div class="h-full flex flex-col gap-4 p-4">
    <div class="flex justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="flex items-center space-x-2">
          <Switch id="landmarks" v-model="landmarks" class="cursor-pointer" />
          <Label for="landmarks" class="cursor-pointer">{{ $t('sheet.section.landmarks') }}</Label>
        </div>
        <Button variant="outline" class="cursor-pointer" @click="importSheetsAsJson">
          <Upload />
          {{ $t('sheet.section.import_from_json') }}
        </Button>
      </div>

      <div class="flex gap-3">
        <Button variant="outline" class="cursor-pointer" @click="exportSheetsAsJson">
          <Download />
          {{ $t('sheet.section.export_as_json') }}
        </Button>
        <Button class="cursor-pointer" @click="previewDialogOpen = true">
          <Search />
          {{ $t('sheet.section.preview_and_export') }}
        </Button>
      </div>
    </div>

    <!-- Sheet container with ref for size tracking -->
    <div ref="sheetContainer" class="flex-1 flex items-center justify-center min-h-0">
      <SheetDisplay
        :scale="responsiveScale"
        :show-landmarks="landmarks"
        :show-placeholders="true"
        :cards="paginatedCards"
        :bleed="pageBleed"
      />
    </div>

    <Pagination
      v-if="sheet && totalCards > 0"
      :items-per-page="cardsPerPage"
      :total="totalPages * cardsPerPage"
      :default-page="currentPage"
      @update:page="currentPage = $event"
    >
      <PaginationContent v-slot="{ items }">
        <PaginationPrevious
          class="cursor-pointer disabled:cursor-default"
          @click="currentPage = Math.max(1, currentPage - 1)"
        />

        <template v-for="(item, index) in items" :key="index">
          <PaginationItem
            v-if="item.type === 'page'"
            :value="item.value"
            :is-active="item.value === currentPage"
            class="cursor-pointer disabled:cursor-default"
            @click="currentPage = item.value"
          >
            {{ item.value }}
          </PaginationItem>
          <PaginationEllipsis v-else-if="item.type === 'ellipsis'" :index="index" />
        </template>

        <PaginationNext
          class="cursor-pointer disabled:cursor-default"
          @click="currentPage = Math.min(totalPages, currentPage + 1)"
        />
      </PaginationContent>
    </Pagination>

    <!-- Empty state -->
    <div v-if="!sheet || totalCards === 0" class="flex items-center justify-center text-center">
      <div class="text-muted-foreground">
        <p class="text-lg">{{ $t('sheet.section.empty') }}</p>
        <p class="text-sm mt-2">{{ $t('sheet.section.empty_hint') }}</p>
      </div>
    </div>

    <!-- Sheet Preview Dialog -->
    <SheetPreview v-model:open="previewDialogOpen" />
  </div>
</template>
