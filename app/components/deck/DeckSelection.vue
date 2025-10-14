<script setup lang="ts">

import { FolderPlus, Trash, Search, PanelLeftClose, PanelLeftOpen } from 'lucide-vue-next';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Separator } from '~/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';

const decksStore = useDeckStore();
const { focusDeck, createDeck, deleteDeck } = decksStore;
const { focussedDeck, decks } = storeToRefs(decksStore);

const searchQuery = ref('');
const deckToDelete = ref<string | null>(null);
const showDeleteDialog = ref(false);
const isCollapsed = ref(false);

function handleDeleteClick(deckId: string) {
  deckToDelete.value = deckId;
  showDeleteDialog.value = true;
}

function confirmDelete() {
  if (deckToDelete.value) {
    deleteDeck(deckToDelete.value);
    deckToDelete.value = null;
    showDeleteDialog.value = false;
  }
}

// Filter decks based on search
const filteredDecks = computed(() => {
  if (!searchQuery.value) return decks.value;
  return decks.value.filter(deck =>
    deck.name.toLowerCase().includes(searchQuery.value.toLowerCase()),
  );
});

// Group decks - for now all will be in "Dans mon navigateur" since they're stored locally
const localDecks = computed(() => filteredDecks.value);
const cloudDecks = computed(() => [] as typeof decks.value); // Future: implement cloud storage decks

</script>

<template>
  <div class="flex flex-col h-full bg-background space-y-2" :class="isCollapsed ? 'w-16' : 'w-64'">
    <!-- Header with title and icon -->
    <div class="flex items-center justify-between p-4 pb-2">
      <h1 v-if="!isCollapsed" class="text-lg font-semibold text-foreground">Mes Decks</h1>
      <Button
        size="icon"
        variant="ghost"
        class="cursor-pointer h-6 w-6"
        :class="{ 'mx-auto': isCollapsed }"
        @click="isCollapsed = !isCollapsed"
      >
        <PanelLeftOpen v-if="isCollapsed" class="w-4 h-4 text-muted-foreground" />
        <PanelLeftClose v-else class="w-4 h-4 text-muted-foreground" />
      </Button>
    </div>

    <!-- Search input -->
    <div v-if="!isCollapsed" class="relative mb-6 mx-4">
      <Search class="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        v-model="searchQuery"
        placeholder="Search"
        class="pl-8"
      />
    </div>

    <!-- Content area -->
    <div v-if="!isCollapsed" class="flex-1 space-y-2">
      <!-- Local decks section -->
      <div class="px-4">
        <h2 class="text-sm font-medium text-foreground mb-3">{{ $t('deck.local_decks') }}</h2>
        <div class="space-y-1">
          <template v-if="localDecks.length">
            <div
              v-for="deck in localDecks"
              :key="deck.id"
              class="group flex items-center justify-between px-1.5 py-0.5 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
              :class="{ 'bg-muted': deck.id === focussedDeck?.id }"
              @click="focusDeck(deck.id)"
            >
              <span class="text-sm font-medium text-foreground/70">{{ deck.name }}</span>
              <Button
                size="icon"
                variant="ghost"
                class="opacity-0 group-hover:opacity-100 transition-opacity h-4 w-4 cursor-pointer"
                @click.stop="handleDeleteClick(deck.id)"
              >
                <Trash class="w-3 h-3 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          </template>
          <template v-else-if="!searchQuery">
            <div class="text-sm text-muted-foreground py-2">{{ $t('deck.no_local_decks') }}</div>
          </template>
        </div>
      </div>

      <Separator class="my-4" />

      <!-- Cloud decks section -->
      <div class="px-4">
        <h2 class="text-sm font-medium text-foreground mb-3">Carton Club</h2>
        <div class="space-y-1">
          <template v-if="cloudDecks.length">
            <div
              v-for="deck in cloudDecks"
              :key="deck.id"
              class="group flex items-center justify-between p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
              @click="focusDeck(deck.id)"
            >
              <span class="text-sm font-medium text-foreground">{{ deck.name }}</span>
            </div>
          </template>
          <template v-else>
            <div class="text-sm text-muted-foreground py-2">{{ $t('deck.no_carton_club_decks') }}</div>
          </template>
        </div>
      </div>
    </div>

    <!-- Spacer for collapsed state -->
    <div v-if="isCollapsed" class="flex-1"></div>

    <!-- Create new deck button -->
    <div class="pt-4 px-4 border-t">
      <Button
        variant="outline"
        :class="isCollapsed ? 'w-8 h-8 p-0' : 'w-full'"
        class="cursor-pointer"
        @click="createDeck"
      >
        <FolderPlus class="w-4 h-4" :class="{ 'mr-2': !isCollapsed }" />
        <span v-if="!isCollapsed">{{ $t('deck.create_a_new_deck') }}</span>
      </Button>
    </div>

    <!-- Delete confirmation dialog -->
    <AlertDialog :open="showDeleteDialog" @update:open="showDeleteDialog = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ $t('deck.delete_confirmation_title') }}</AlertDialogTitle>
          <AlertDialogDescription>
            {{ $t('deck.delete_confirmation_message', { name: decks.find(d => d.id === deckToDelete)?.name || '' }) }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel class="cursor-pointer" @click="showDeleteDialog = false">
            {{ $t('common.cancel') }}
          </AlertDialogCancel>
          <AlertDialogAction class="cursor-pointer" @click="confirmDelete">
            {{ $t('common.delete') }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
