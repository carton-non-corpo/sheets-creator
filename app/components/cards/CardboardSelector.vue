<script setup lang="ts">

const props = defineProps<{
  name: string | null | undefined
  imageUrl: string | null | undefined
}>();

const isHovered = ref(false);

</script>

<template>
  <div 
    class="relative"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <div v-if="props.imageUrl" class="w-full h-auto">
      <img 
        :src="props.imageUrl" 
        :alt="props.name || 'Card image'"
        class="w-full h-full object-cover"
        @error="console.log('Image failed to load:', props.imageUrl)"
      />
    </div>
    <div v-else class=" flex items-center justify-center w-full h-auto rounded-t-lg bg-gray-200">
      <span class="text-gray-500 text-xs">No image</span>
    </div>

    <!-- Only show this if hovering card -->
    <div v-if="isHovered" class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 p-3 rounded-b-md">
      <h3 class="font-semibold text-sm truncate text-white">{{ props.name }}</h3>
    </div>
  </div>
</template>