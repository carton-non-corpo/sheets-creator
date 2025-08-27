<script setup lang="ts">
import { Switch } from '~/components/ui/switch';
import { Label } from '~/components/ui/label';
import { Button } from '~/components/ui/button';
import { Download, Search, Layers, GalleryHorizontalEnd } from 'lucide-vue-next';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationEllipsis } from '~/components/ui/pagination';

const stripBoardStore = useStripBoardStore();
const { stripBoard } = storeToRefs(stripBoardStore);

const landmarks = ref<boolean>(true);
const currentPage = ref<number>(1);
const cardsPerPage = 9; // 3x3 grid

const totalCards = computed(() => {
  if (!stripBoard.value) return 0;
  return stripBoard.value.content.reduce((sum, card) => sum + card.quantity, 0);
});

const totalUniqueCards = computed(() => {
  return stripBoard.value?.content.length || 0;
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

const paginatedCards = computed(() => {
  const startIndex = (currentPage.value - 1) * cardsPerPage;
  const endIndex = startIndex + cardsPerPage;
  return cardsForPrint.value.slice(startIndex, endIndex);
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
        <Button variant="outline" class="cursor-pointer">
          <Search />
          Prévisualiser
        </Button>
        <Button class="cursor-pointer">
          <Download />
          Exporter
        </Button>
      </div>
    </div>

    <!-- <div class="flex justify-center gap-4">
      <div class="flex items-center gap-1.5 px-3 py-2 bg-muted/50 rounded-lg border">
        <GalleryHorizontalEnd class="w-4 h-4 text-muted-foreground mr-0.5" />
        <span class="text-sm font-medium">{{ totalUniqueCards }}</span>
        <span class="text-xs text-muted-foreground">unique{{ totalUniqueCards > 1 ? 's' : '' }}</span>
      </div>
      
      <div class="flex items-center gap-1.5 px-3 py-2 bg-muted/50 rounded-lg border">
        <Layers class="w-4 h-4 text-muted-foreground mr-0.5" />
        <span class="text-sm font-medium">{{ totalCards }}</span>
        <span class="text-xs text-muted-foreground">totale{{ totalCards > 1 ? 's' : '' }}</span>
      </div>
    </div> -->

    <StripBoardDisplay :scale="0.5" :show-landmarks="landmarks" :cards="paginatedCards" />

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
  </div>
</template>
