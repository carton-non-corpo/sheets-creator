<script setup lang="ts">
import { Input } from '~/components/ui/input';
import { debounce } from 'lodash';
import type { EnhancedFile } from '~~/common/types/drive';
import { gameFolders } from '~~/common/utils/drives';
import { ScrollArea } from '~/components/ui/scroll-area';
import CardSelector from '~/components/cards/CardSelector.vue';
import { getGameDisplayName } from '~~/common/utils/games';
import { Separator } from '~/components/ui/separator';
import { LoaderCircle } from 'lucide-vue-next';

const gameStore = useGameStore()
const { selectedGame } = storeToRefs(gameStore)

const loading = ref(false);
const error = ref<string | null>(null);
const searchQuery = ref('');
const files = ref<EnhancedFile[]>([]);
const foldersIds = ref<string[]>([]);

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

const searchText = computed(() => {
  if (foldersIds.value.length === 0) return 'Selectionner des catégories...'
  if (foldersIds.value.length === 1) {
    const folder = gameFolders.find(f => f.id === foldersIds.value[0])
    return `Chercher dans ${folder?.name}...` || 'Erreur'
  }
  if (foldersIds.value.length === gameFolders.length) return `Chercher dans ${getGameDisplayName(selectedGame.value)}...` 
  return `Chercher dans les catégories sélectionnées...`
})

watch(foldersIds, () => {
  nextTick(() => fetchFiles());
});

watch(selectedGame, () => {
  nextTick(() => fetchFiles());
  foldersIds.value = gameFolders.filter(folder => folder.game === selectedGame.value).map(folder => folder.id);
  console.log(foldersIds.value);
}, { immediate: true });
</script>

<template>
  <div class="flex flex-col gap-2 p-4 h-full">
    <DrivesCombobox v-model="foldersIds" :folders="gameFolders" />

    <Input
      v-model="searchQuery"
      :placeholder="searchText"
      class="p-2"
      @input="debouncedFetchFiles"
    />

    <Separator />

    <ScrollArea class="h-[calc(100vh-12.5rem)]">
      <div v-if="!loading" class="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
        <CardSelector 
          v-for="card in sortedCards" 
          :key="card.id" 
          :card="card"
        />
      </div>
      <div v-else class="mt-8 flex justify-center w-full">
        <LoaderCircle class="animate-spin" />
      </div>
    </ScrollArea>
  </div>
</template>