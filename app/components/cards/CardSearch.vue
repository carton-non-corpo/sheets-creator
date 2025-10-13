<script setup lang="ts">
import { Input } from '~/components/ui/input';
import { useDebounceFn, useIntersectionObserver } from '@vueuse/core';
import type { EnhancedFile } from '~~/common/types/drive';
import { ScrollArea } from '~/components/ui/scroll-area';
import CardShowcase from '~/components/cards/CardShowcase.vue';
import { getGameDisplayName } from '~~/common/utils/games';
import { Separator } from '~/components/ui/separator';
import { LoaderCircle } from 'lucide-vue-next';

const gameStore = useGameStore();
const { selectedGame, currentGameFolders } = storeToRefs(gameStore);

const loading = ref(false);
const error = ref<string | null>(null);
const searchQuery = ref('');
const files = ref<EnhancedFile[]>([]);
const foldersIds = ref<string[]>([]);

// Viewport-based loading
const scrollContainer = ref<HTMLElement>();
const sentinelTop = ref<HTMLElement>();
const sentinelBottom = ref<HTMLElement>();

// Pagination state
const itemsPerPage = 20;
const currentPage = ref(0);
const loadedItems = ref<EnhancedFile[]>([]);

const sortedCards = computed((): EnhancedFile[] => {
  return [...files.value].sort((a, b) => a.name.localeCompare(b.name));
});

const folderDecklistLink = computed(() => {
  if (foldersIds.value.length !== 1) return '';
  const folder = currentGameFolders.value.find(f => f.id === foldersIds.value[0]);
  if (!folder) return '';
  return folder.decklist || '';
});

// Load more items when needed
const loadItems = (page: number) => {
  const startIndex = page * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, sortedCards.value.length);
  const newItems = sortedCards.value.slice(startIndex, endIndex);

  if (page === 0) {
    loadedItems.value = newItems;
  } else {
    loadedItems.value.push(...newItems);
  }
};

// Setup intersection observers for infinite scroll
const { stop: stopTopObserver } = useIntersectionObserver(
  sentinelTop,
  entries => {
    const [entry] = entries;
    if (entry?.isIntersecting && currentPage.value > 0) {
      // Load previous page (if implementing bidirectional scroll)
      // For now, we'll keep it simple and only implement forward loading
    }
  },
  { threshold: 0.1 },
);

const { stop: stopBottomObserver } = useIntersectionObserver(
  sentinelBottom,
  entries => {
    const [entry] = entries;
    if (entry?.isIntersecting && loadedItems.value.length < sortedCards.value.length) {
      currentPage.value++;
      loadItems(currentPage.value);
    }
  },
  { threshold: 0.1 },
);

const searchText = computed(() => {
  if (foldersIds.value.length === 0) return $t('drives.search_within_all_categories');
  if (foldersIds.value.length === 1) {
    const folder = currentGameFolders.value.find(f => f.id === foldersIds.value[0]);
    return folder ? $t('drives.search_within_category', { category: folder.name }) : 'Erreur';
  }
  if (foldersIds.value.length === currentGameFolders.value.length) return  $t('drives.search_within_category', { category: getGameDisplayName(selectedGame.value) });
  return $t('drives.search_within_selected_categories');
});

const debouncedFetchFiles = useDebounceFn(fetchFiles, 800);

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
    const params = new URLSearchParams({
      name: searchQuery.value,
      foldersIds: ids.join(','),
    });
    const res = await fetch(`/api/v1/drive-files?${params.toString()}`);
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
    foldersIds.value = [];
    return;
  }
  foldersIds.value = currentGameFolders.value.map(folder => folder.id);
};

watch(foldersIds, () => {
  nextTick(() => debouncedFetchFiles());
});

watch(searchQuery, () => {
  debouncedFetchFiles();
});

watch(selectedGame, () => {
  nextTick(() => debouncedFetchFiles());
  presetFoldersIds();
  searchQuery.value = '';
}, { immediate: true });

// Reset when cards change
watch(sortedCards, () => {
  currentPage.value = 0;
  loadItems(0);
}, { immediate: true });

// Cleanup
onUnmounted(() => {
  stopTopObserver();
  stopBottomObserver();
});
</script>

<template>
  <div class="flex flex-col gap-2 p-4 h-full">
    <div class="flex items-center gap-3">
      <DrivesCombobox v-model="foldersIds" :folders="currentGameFolders" class="w-full" />

      <NuxtLink
        v-if="foldersIds.length === 1 && folderDecklistLink"
        :to="folderDecklistLink"
        :disabled="!folderDecklistLink"
        target="_blank"
        class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 h-9 px-4 py-2 has-[>svg]:px-3 cursor-pointer"
        :class="!folderDecklistLink ? 'cursor-not-allowed pointer-events-none opacity-50' : ''"
      >
        <span>{{ $t('drives.decklist') }}</span>
      </NuxtLink>
    </div>

    <Input
      v-model="searchQuery"
      :placeholder="searchText"
      class="p-2"
    />

    <Separator />

    <ScrollArea ref="scrollContainer" class="h-[calc(100vh-12.5rem)]">
      <div v-if="!loading">
        <div ref="sentinelTop" class="h-1"></div>

        <div class="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
          <CardShowcase
            v-for="card in loadedItems"
            :key="card.id"
            :card="card"
          />
        </div>

        <!-- Bottom sentinel for loading more items -->
        <div ref="sentinelBottom" class="h-1"></div>
      </div>
      <div v-else class="mt-8 flex justify-center w-full">
        <LoaderCircle class="animate-spin" />
      </div>
    </ScrollArea>
  </div>
</template>
