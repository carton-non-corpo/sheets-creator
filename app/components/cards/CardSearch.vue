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
const { selectedGame, currentGameFolders } = storeToRefs(gameStore)

const loading = ref(false);
const error = ref<string | null>(null);
const searchQuery = ref('');
const files = ref<EnhancedFile[]>([]);
const foldersIds = ref<string[]>([]);

const sortedCards = computed((): EnhancedFile[] => {
  return files.value.sort((a, b) => a.name.localeCompare(b.name));
});

const searchText = computed(() => {
  if (foldersIds.value.length === 0) return 'Selectionner des catégories...'
  if (foldersIds.value.length === 1) {
    const folder = currentGameFolders.value.find(f => f.id === foldersIds.value[0])
    return `Chercher dans ${folder?.name}...` || 'Erreur'
  }
  if (foldersIds.value.length === currentGameFolders.value.length) return `Chercher dans ${getGameDisplayName(selectedGame.value)}...` 
  return `Chercher dans les catégories sélectionnées...`
})

const debouncedFetchFiles = debounce(fetchFiles, 300, { trailing: true });

function getTargettedFolders(): string[] {
  // If user is searching by name and no folders are selected, return all folders for the current game
  if (foldersIds.value.length === 0 && searchQuery.value.length >= 3) {
    return currentGameFolders.value.map(folder => folder.id);
  }
  return foldersIds.value;
}

async function fetchFiles() {
  if (loading.value) return;

  if (!foldersIds.value.length && searchQuery.value.length < 3) {
    files.value = [];
    return;
  }

  loading.value = true;
  error.value = null;
  
  try {
    const ids = getTargettedFolders(); 
    const res = await fetch(`/api/v1/drive-files?name=${searchQuery.value}&foldersIds=${ids.join(',')}`);
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

function presetFoldersIds() {
  if (currentGameFolders.value.length >= 5) {
    foldersIds.value = []
    return
  }
  foldersIds.value = currentGameFolders.value.map(folder => folder.id);
};

watch(foldersIds, () => {
  nextTick(() => fetchFiles());
});

watch(selectedGame, () => {
  nextTick(() => fetchFiles());
  presetFoldersIds();
}, { immediate: true });
</script>

<template>
  <div class="flex flex-col gap-2 p-4 h-full">
    <DrivesCombobox v-model="foldersIds" :folders="currentGameFolders" />

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