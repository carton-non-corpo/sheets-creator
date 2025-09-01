<script setup lang="ts">
import { Switch } from '~/components/ui/switch';
import { Label } from '~/components/ui/label';
import { Button } from '~/components/ui/button';
import { Download, Search } from 'lucide-vue-next';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationEllipsis } from '~/components/ui/pagination';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '~/components/ui/dropdown-menu';
const sheetStore = useSheetStore();
const { sheet } = storeToRefs(sheetStore);

const { exportAllPages, exportSinglePage } = usePdfExport();

const landmarks = ref<boolean>(true);
const currentPage = ref<number>(1);
const previewDialogOpen = ref<boolean>(false);
const cardsPerPage = 9; // 3x3 grid

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
        printIndex: cards.length
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
          bleed: currentBleed
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
      bleed: currentBleed
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
    <div class="flex justify-between gap-8">
      <div class="flex items-center gap-6">
        <div class="flex items-center space-x-2">
          <Switch id="landmarks" v-model="landmarks" class="cursor-pointer" />
          <Label for="landmarks" class="cursor-pointer">Repères</Label>
        </div>
      </div>

      <div class="flex gap-3">
        <Button variant="outline" class="cursor-pointer" @click="previewDialogOpen = true">
          <Search />
          Prévisualiser
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button class="cursor-pointer">
              <Download />
              Exporter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent class="w-auto mr-4 mt-1">
            <DropdownMenuLabel>Choisir l'action</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem class="cursor-pointer" @click="() => exportAllPages(allPages, sheet?.name)">
              Tout exporter
            </DropdownMenuItem>
            <DropdownMenuItem 
              class="cursor-pointer" 
              @click="() => {
                const currentPageData = allPages[currentPage - 1];
                if (currentPageData) exportSinglePage(currentPageData, sheet?.name);
              }"
            >
              Exporter la page actuelle
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    <SheetDisplay :scale="0.5" :show-landmarks="landmarks" :cards="paginatedCards" :bleed="pageBleed" />

    <Pagination 
      v-if="sheet && totalCards > 0"
      v-slot="{ page }" 
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
        <p class="text-lg">Aucune carte ajoutée</p>
        <p class="text-sm mt-2">Ajoutez des cartes pour créer vos planches</p>
      </div>
    </div>

    <!-- Sheet Preview Dialog -->
    <SheetPreview v-model:open="previewDialogOpen" />
  </div>
</template>
