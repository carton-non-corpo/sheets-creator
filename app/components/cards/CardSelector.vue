<script setup lang="ts">
import { Button } from '~/components/ui/button';
import { Plus, Minus } from 'lucide-vue-next';
import type { EnhancedFile } from '~~/common/types/drive';

const props = defineProps<{
  card: EnhancedFile
}>();

const sheetStore = useSheetStore();
const { addCard, removeCard, getCardQuantity } = sheetStore;

const quantity = computed(() => getCardQuantity(props.card.id));

function increment() {
  addCard(props.card);
}

function decrement() {
  if (quantity.value > 0) {
    removeCard(props.card.id);
  }
}

function goToWebLink() {
  if (props.card.webViewLink) {
    window.open(props.card.webViewLink, '_blank');
  }
}

</script>

<template>
  <div 
    class="group relative h-full w-full min-h-36 cursor-pointer"
    @click="addCard(props.card)"
    @contextmenu.prevent="removeCard(props.card.id)"
  >
    <div v-if="props.card.thumbnailLink" class="w-full h-auto">
      <img 
        :src="props.card.thumbnailLink" 
        :alt="props.card.name || 'Card image'"
        class="w-full h-full object-cover"
        @error="console.log('Image failed to load:', props.card.thumbnailLink)"
      />
    </div>
    <div v-else class="flex items-center justify-center w-full h-full px-3 rounded bg-gray-200">
      <p class="text-gray-500 text-xs break-all">{{ props.card.name || 'No image' }}</p>
    </div>

    <!-- Buttons in top right corner - only show on hover -->
    <div class="absolute top-1 right-1 flex flex-col gap-1">
      <div 
        class="h-7 w-7 items-center justify-center bg-white text-gray-900 text-xs font-bold rounded shadow-lg border-2 border-gray-800"
        :class="quantity === 0 ? 'group-hover:flex hidden' : 'flex'"
      >
        {{ quantity }}
      </div>

      <Button 
        size="sm" 
        variant="secondary" 
        class="hidden group-hover:flex h-5 w-5 p-0 ml-auto mr-0.25 rounded shadow-md border-1 border-gray-800 cursor-pointer hover:bg-gray-200"
        :class="quantity === 0 ? 'opacity-50 cursor-not-allowed' : ''"
        @click.stop="decrement"
      >
        <Minus class="h-3 w-3" />
      </Button>

      <Button 
        size="sm" 
        variant="secondary" 
        class="hidden group-hover:flex h-5 w-5 p-0 ml-auto mr-0.25 rounded shadow-md border-1 border-gray-800 cursor-pointer hover:bg-gray-200"
        @click.stop="increment"
      >
        <Plus class="h-3 w-3" />
      </Button>
    </div>

    <!-- Card Name at Bottom -->
    <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <div class="w-fit text-white text-xs font-medium truncate hover:underline cursor-pointer" @click.stop="goToWebLink">{{ card.name }}</div>
    </div>
  </div>
</template>