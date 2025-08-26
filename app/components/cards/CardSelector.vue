<script setup lang="ts">
import { Button } from '~/components/ui/button';
import { Plus, Minus } from 'lucide-vue-next';

const props = defineProps<{
  name: string | null | undefined
  imageUrl: string | null | undefined
}>();

const model = defineModel<number>({ default: 0 });

function increment() {
  model.value++;
}

function decrement() {
  if (model.value > 0) {
    model.value--;
  }
}

</script>

<template>
  <div 
    class="group relative h-full w-full"
  >
    <div v-if="props.imageUrl" class="w-full h-auto">
      <img 
        :src="props.imageUrl" 
        :alt="props.name || 'Card image'"
        class="w-full h-full object-cover"
        @error="console.log('Image failed to load:', props.imageUrl)"
      />
    </div>
    <div v-else class=" flex items-center justify-center w-full h-full rounded-t-lg bg-gray-200">
      <span class="text-gray-500 text-xs">No image</span>
    </div>

    <!-- Buttons in top right corner - only show on hover -->
    <div class="absolute top-1 right-1 flex flex-col gap-1">
      <div 
        class="h-7 w-7 items-center justify-center bg-white text-gray-900 text-xs font-bold rounded-md shadow-lg border-2 border-gray-800"
        :class="model === 0 ? 'group-hover:flex hidden' : 'flex'"
      >
        {{ model }}
      </div>

      <Button 
        size="sm" 
        variant="secondary" 
        @click="decrement"
        :disabled="model === 0"
        class="hidden group-hover:flex h-5 w-5 p-0 ml-auto mr-0.25 rounded-sm shadow-md border-1 border-gray-800 cursor-pointer disabled:cursor-not-allowed"
      >
        <Minus class="h-3 w-3" />
      </Button>

      <Button 
        size="sm" 
        variant="secondary" 
        @click="increment"
        class="hidden group-hover:flex h-5 w-5 p-0 ml-auto mr-0.25 rounded-sm shadow-md border-1 border-gray-800 cursor-pointer disabled:cursor-not-allowed"
      >
        <Plus class="h-3 w-3" />
      </Button>
    </div>

    <!-- Card name at bottom - only show on hover -->
    <div 
      class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 px-3 py-1.5 rounded-b-md"
      :class="props.imageUrl ? 'group-hover:block hidden' : 'block'"
    >
      <h3 class="font-semibold text-sm truncate text-white">{{ props.name }}</h3>
    </div>
  </div>
</template>