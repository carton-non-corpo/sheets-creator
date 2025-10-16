<script setup lang="ts">
import { Button } from '~/components/ui/button';
import { Search, Upload, Grid2X2, TableProperties, ChevronsUpDown } from 'lucide-vue-next';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationEllipsis } from '~/components/ui/pagination';
import { Combobox, ComboboxAnchor, ComboboxGroup, ComboboxItem, ComboboxList, ComboboxTrigger } from '~/components/ui/combobox';
import { useResizeObserver } from '@vueuse/core';

const sheetStore = useSheetStore();
const { sheet } = storeToRefs(sheetStore);

const { importSheetsAsJson } = useJsonExport();

type Layout = 'sheet' | 'table';
const layout = ref<Layout>('sheet');

type ImportOption = { function: () => void; label: string;};
const importOptions = [
  { function: importSheetsAsJson, label: $t('sheet.section.import_from_json') },
  { function: openDecklistImport, label: $t('sheet.section.import_from_decklist') },
];

const currentPage = ref<number>(1);
const previewDialogOpen = ref<boolean>(false);
const decklistImportDialogOpen = ref<boolean>(false);
const cardsPerPage = 9; // 3x3 grid

function setLayout(newLayout: Layout) {
  layout.value = newLayout;
}

function openDecklistImport() {
  decklistImportDialogOpen.value = true;
}

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
  <div class="h-full flex flex-col gap-8 p-4">
    <div class="flex justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="flex items-center justify-center gap-0.25">
          <Button variant="outline" class="cursor-pointer border-r-0 rounded-r-none rounded-l-full" @click="setLayout('sheet')">
            <Grid2X2 :class="{'opacity-50': layout !== 'sheet'}"/>
          </Button>
          <div class="z-1 w-[1px] h-6 -mx-1 bg-foreground/50"></div>
          <Button
            variant="outline"
            class="cursor-pointer border-l-0 rounded-r-full rounded-l-none"
            @click="setLayout('table')"
          >
            <TableProperties :class="{'opacity-50': layout !== 'table'}" />
          </Button>
        </div>
      </div>

      <div class="flex gap-3">
        <Combobox by="label" @update:model-value="(value: any) => (value as ImportOption)?.function?.()">
          <ComboboxAnchor as-child>
            <ComboboxTrigger as-child class="w-fit">
              <Button variant="outline" class="justify-between cursor-pointer">
                <Upload class="mr-2" />
                {{ $t('sheet.section.import_sheets') }}
                <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </ComboboxTrigger>
          </ComboboxAnchor>

          <ComboboxList class="w-fit">
            <ComboboxGroup>
              <ComboboxItem
                v-for="option in importOptions"
                :key="option.label"
                :value="option"
                class="cursor-pointer"
              >
                {{ option.label }}
              </ComboboxItem>
            </ComboboxGroup>
          </ComboboxList>
        </Combobox>
        <Button class="cursor-pointer" @click="previewDialogOpen = true">
          <Search />
          {{ $t('sheet.section.preview_and_export') }}
        </Button>
      </div>
    </div>

    <!-- Sheet container with ref for size tracking -->
    <div v-if="layout === 'sheet'" ref="sheetContainer" class="flex-1 flex items-center justify-center min-h-0">
      <SheetDisplay
        :scale="responsiveScale"
        :show-landmarks="true"
        :show-placeholders="true"
        :cards="paginatedCards"
        :bleed="pageBleed"
      />
    </div>

    <!-- Table view -->
    <div v-else-if="layout === 'table'" class="flex flex-1 min-h-0 px-4 mb-4">
      <SheetDataTable :cards="sheet?.content || []" />
    </div>

    <Pagination
      v-if="sheet && totalCards > 0 && layout === 'sheet'"
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
    <div v-if="(!sheet || totalCards === 0) && layout === 'sheet'" class="flex items-center justify-center text-center">
      <div class="text-muted-foreground">
        <p class="text-lg">{{ $t('sheet.section.empty') }}</p>
        <p class="text-sm mt-2">{{ $t('sheet.section.empty_hint') }}</p>
      </div>
    </div>

    <!-- Sheet Preview Dialog -->
    <SheetPreview v-model:open="previewDialogOpen" />

    <!-- Decklist Import Dialog -->
    <SheetDecklistImport v-model:open="decklistImportDialogOpen" />
  </div>
</template>
