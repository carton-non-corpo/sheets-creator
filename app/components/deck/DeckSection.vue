<script setup lang="ts">
import { Button } from '~/components/ui/button';
import { Grid2X2, Printer, TableProperties, Upload } from 'lucide-vue-next';
import { Input } from '~/components/ui/input';

type Layout = 'grid' | 'table';
const layout = ref<Layout>('grid');
function setLayout(newLayout: Layout) {
  layout.value = newLayout;
}

const decksStore = useDeckStore();
const { focussedDeck } = storeToRefs(decksStore);
const { updateDeck } = decksStore;
</script>

<template>
  <div class="h-full flex flex-col gap-4 p-4">
    <div class="flex justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="flex items-center justify-center gap-0.25">
          <Button variant="outline" class="cursor-pointer border-r-0 rounded-r-none rounded-l-full" @click="setLayout('grid')">
            <Grid2X2 :class="{'opacity-50': layout !== 'grid'}"/>
          </Button>
          <div class="z-1 w-[1px] h-6 -mx-1 bg-foreground/50"></div>
          <Button
            disabled
            variant="outline"
            class="cursor-pointer border-l-0 rounded-r-full rounded-l-none"
            @click="setLayout('table')"
          >
            <TableProperties :class="{'opacity-50': layout !== 'table'}" />
          </Button>
        </div>
      </div>

      <div class="flex gap-3">
        <Button variant="outline" class="cursor-pointer" disabled>
          <Upload />
          {{ $t('deck.section.import_from_json') }}
        </Button>
        <Button class="cursor-pointer" disabled>
          <Printer />
          {{ $t('deck.section.add_deck_to_sheets') }}
        </Button>
      </div>
    </div>

    <div class="mt-8 space-y-3 xl:space-y-4 w-full h-full">
      <template v-if="focussedDeck">
        <Input
          :model-value="focussedDeck.name"
          :placeholder="$t('deck.section.deck_name_placeholder')"
          class="max-w-128 mb-4"
          @update:model-value="name => {
            if (focussedDeck) {
              updateDeck({
                id: focussedDeck.id,
                name: String(name),
                content: focussedDeck.content,
                bleed: focussedDeck.bleed
              });
            }
          }"
        />

        <div class="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] xl:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3 xl:gap-4">
          <div v-if="focussedDeck.content.length === 0" class="col-span-full text-center text-muted-foreground py-8">
            {{ $t('deck.section.no_cards_in_deck') }}
          </div>
          <div v-for="card in focussedDeck.content" :key="card.id" class="border w-full h-24 flex items-center justify-center bg-white rounded shadow-sm">
            <span class="truncate">{{ card.name }}</span>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
          <span>{{ $t('deck.section.no_deck_selected') }}</span>
        </div>
      </template>
    </div>
  </div>
</template>
