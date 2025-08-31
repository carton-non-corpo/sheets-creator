<script setup lang="ts">
import type { GameFolders } from '~~/common/types/games';
import { ref, computed } from 'vue';
import { ChevronDown, FolderOpen, Minus } from 'lucide-vue-next';
import { getGameDisplayName } from '~~/common/utils/games';
import { Combobox, ComboboxAnchor, ComboboxTrigger, ComboboxList, ComboboxInput, ComboboxViewport, ComboboxEmpty, ComboboxGroup, ComboboxItem } from '~/components/ui/combobox';
import { Checkbox } from '~/components/ui/checkbox';

const props = defineProps<{
  folders: GameFolders[]
}>()

const model = defineModel<string[]>({
  default: () => []
})

const gameStore = useGameStore()
const { selectedGame } = storeToRefs(gameStore)

const open = ref(false)
const searchTerm = ref('')

const gameFolders = computed(() => {
  return props.folders.filter(folder => folder.game === selectedGame.value)
})

// Filter folders based on search term
const filteredFolders = computed(() => {
  if (!searchTerm.value) return gameFolders.value
  return gameFolders.value
    .filter(folder => folder.name.toLowerCase().includes(searchTerm.value.toLowerCase()))
})

const isSelected = (folderId: string) => {
  return model.value.includes(folderId)
}

const toggleFolder = (folderId: string) => {
  if (isSelected(folderId)) {
    model.value = model.value.filter(id => id !== folderId)
  } else {
    model.value = [...model.value, folderId]
  }
}

const selectedText = computed(() => {
  if (model.value.length === 0) return 'Selectionner des catégories...'
  if (model.value.length === 1) {
    const folder = gameFolders.value.find(f => f.id === model.value[0])
    return folder?.name || 'Catégorie inconnue'
  }
  if (model.value.length === gameFolders.value.length) return getGameDisplayName(selectedGame.value)
  return `${model.value.length} catégories sélectionnées`
})

// Computed properties for the master checkbox
const allFoldersSelected = computed(() => {
  return gameFolders.value.length > 0 && model.value.length === gameFolders.value.length
})

const someFoldersSelected = computed(() => {
  return model.value.length > 0 && model.value.length < gameFolders.value.length
})

const noFoldersSelected = computed(() => {
  return model.value.length === 0
})

// Toggle all folders
const toggleAllFolders = () => {
  if (allFoldersSelected.value) {
    // Unselect all
    model.value = []
  } else {
    // Select all
    model.value = gameFolders.value.map(folder => folder.id)
  }
}
</script>

<template>
  <Combobox v-model:open="open" :multiple="true">
    <ComboboxAnchor as-child>
      <ComboboxTrigger
        class="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
      >
        <div class="flex items-center gap-2 overflow-hidden">
          <FolderOpen class="size-4 shrink-0 opacity-50" />
          <p>{{ selectedText }}</p>
        </div>
        <ChevronDown class="size-4 shrink-0 opacity-50" />
      </ComboboxTrigger>
    </ComboboxAnchor>

    <ComboboxList class="w-[300px] p-0">
      <div class="flex items-center gap-3 px-3 py-2 border-b">
        <Checkbox
          :model-value="allFoldersSelected || someFoldersSelected"
          :indeterminate="someFoldersSelected"
          @update:model-value="toggleAllFolders"
          class="pointer-events-auto border-gray-300 data-[state=checked]:bg-green-100 data-[state=checked]:border-green-600 hover:border-green-400 focus-visible:ring-green-500/50 [&[data-state=checked]_svg]:text-green-600"
        >
          <Minus v-if="someFoldersSelected" class="size-3.5" />
        </Checkbox>
        <ComboboxInput
          v-model="searchTerm"
          placeholder="Chercher une catégorie..."
        />
      </div>
      
      <ComboboxViewport class="max-h-[420px]">
        <ComboboxEmpty class="py-6 text-center text-sm">
          Aucune catégorie trouvée.
        </ComboboxEmpty>

        <ComboboxGroup>
          <ComboboxItem
            v-for="folder in filteredFolders"
            :key="folder.id"
            :value="folder.id"
            @click="toggleFolder(folder.id)"
            class="flex items-center space-x-2 px-2 py-1.5 cursor-pointer"
          >
            <Checkbox
              :model-value="isSelected(folder.id)"
              @update:model-value="() => toggleFolder(folder.id)"
              @click.stop
              class="pointer-events-auto border-gray-300 data-[state=checked]:bg-green-100 data-[state=checked]:border-green-600 hover:border-green-400 focus-visible:ring-green-500/50 [&[data-state=checked]_svg]:text-green-600"
            />

            <div class="flex flex-col flex-1 min-w-0">
              <div class="flex items-center gap-1.5">
                <span class="text-sm font-medium truncate">{{ folder.name }}</span>
                <span 
                  v-if="folder.subCategory" 
                  class="inline-flex items-center px-1 py-0.25 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                >
                  {{ folder.subCategory }}
                </span>
              </div>
              <span class="text-xs text-muted-foreground capitalize truncate">
                {{ folder.author ? folder.author : 'Custom' }} {{ folder.bleed ? '• Frond Perdu' : '' }}
              </span>
            </div>
          </ComboboxItem>
        </ComboboxGroup>
      </ComboboxViewport>
    </ComboboxList>
  </Combobox>
</template>