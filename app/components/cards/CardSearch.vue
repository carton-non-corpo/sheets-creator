<script setup lang="ts">
import { Input } from '~/components/ui/input';
import { debounce } from 'lodash';
import type { EnhancedFile } from '~~/common/types/drive';
import { gameFolders } from '~~/common/utils/drives';
import { Card, CardContent } from '~/components/ui/card';
import { ScrollArea } from '~/components/ui/scroll-area';
import CardSelector from '~/components/cards/CardSelector.vue';

const gameStore = useGameStore()
const { selectedGame } = storeToRefs(gameStore)

const loading = ref(false);
const error = ref<string | null>(null);
const searchQuery = ref('');
const files = ref<EnhancedFile[]>([]);

const foldersIds = computed(() => gameFolders.filter(folder => folder.game === selectedGame.value).map(folder => folder.id));

const sortedCards = computed((): EnhancedFile[] => {
  return files.value.sort((a, b) => a.name.localeCompare(b.name));
});

const debouncedFetchFiles = debounce(fetchFiles, 300, { trailing: true });

async function fetchFiles() {
  if (loading.value) return;

  if (!foldersIds.value.length) {
    files.value = [];
    return;
  }

  loading.value = true;
  error.value = null;
  
  try {
    const res = await fetch(`/api/v1/drive-files?name=${searchQuery.value}&foldersIds=${foldersIds.value.join(',')}`);
    const data = await res.json();
    
    if (data.error) {
      error.value = data.error;
    } else {
      files.value = data.files || [];
    }
  } catch (err) {
    error.value = 'Failed to fetch files';
    console.error('Error fetching files:', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchFiles();
});

watch(foldersIds, () => {
  fetchFiles();
});
</script>

<template>
  <div class="flex flex-col gap-4 p-4 h-full">
    <Input
      v-model="searchQuery"
      placeholder="Search for a card..."
      class="border-b p-2"
      @input="debouncedFetchFiles"
    />

    <ScrollArea class="h-[calc(100vh-9.5rem)]">
      <div class="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
        <CardSelector 
          v-for="card in sortedCards" 
          :key="card.id" 
          :image-url="card.imageUrl" 
          :name="card.name"
        />
      </div>
    </ScrollArea>
  </div>
</template>