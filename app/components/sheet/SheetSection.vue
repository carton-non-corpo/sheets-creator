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

const totalUniqueCards = computed(() => {
  return sheet.value?.content.length || 0;
});

const totalPages = computed(() => {
  const pages = Math.ceil(totalCards.value / cardsPerPage);
  return Math.max(1, pages);
});

const cardsForPrint = computed(() => {
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

const paginatedCards = computed(() => {
  const startIndex = (currentPage.value - 1) * cardsPerPage;
  const endIndex = startIndex + cardsPerPage;
  return cardsForPrint.value.slice(startIndex, endIndex);
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
              Exporter la planche actuelle
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
    
    <SheetDisplay :scale="0.5" :show-landmarks="landmarks" :cards="paginatedCards" />

    <Pagination 
      v-slot="{ page }" 
      :items-per-page="cardsPerPage" 
      :total="totalCards" 
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

    <!-- Sheet Preview Dialog -->
    <SheetPreview v-model:open="previewDialogOpen" />
  </div>
</template>
