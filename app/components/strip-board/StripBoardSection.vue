<script setup lang="ts">
import { Switch } from '~/components/ui/switch';
import { Label } from '~/components/ui/label';
import { Button } from '~/components/ui/button';
import { Download, Search, Layers, FileText, GalleryHorizontalEnd } from 'lucide-vue-next';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationEllipsis } from '~/components/ui/pagination';

const stripBoardStore = useStripBoardStore();
const { stripBoard } = storeToRefs(stripBoardStore);

const landmarks = ref<boolean>(false);

const totalCards = computed(() => {
  if (!stripBoard.value) return 0;
  return stripBoard.value.content.reduce((sum, card) => sum + card.quantity, 0);
});

const totalUniqueCards = computed(() => {
  return stripBoard.value?.content.length || 0;
});
</script>

<template>
  <div class="h-full flex flex-col gap-4 p-4">
    <div class="flex justify-between gap-8">
      <div class="flex items-center gap-6">
        <!-- <div class="flex items-center space-x-2">
          <Switch id="bleeding-edges" class="cursor-pointer" />
          <Label for="bleeding-edges" class="cursor-pointer">Fond Perdu</Label>
        </div> -->
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

    <StripBoardDisplay :scale="0.5" />

    <Pagination v-slot="{ page }" :items-per-page="10" :total="30" :default-page="2">
      <PaginationContent v-slot="{ items }">
        <PaginationPrevious />

        <template v-for="(item, index) in items" :key="index">
          <PaginationItem
            v-if="item.type === 'page'"
            :value="item.value"
            :is-active="item.value === page"
          >
            {{ item.value }}
          </PaginationItem>
        </template>

        <PaginationEllipsis :index="4" />

        <PaginationNext />
      </PaginationContent>
    </Pagination>

    <div class="flex justify-center gap-4">
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
    </div>
  </div>
</template>
