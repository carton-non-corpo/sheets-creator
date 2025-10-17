<script setup lang="ts">
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { Label } from '~/components/ui/label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectGroup, SelectLabel, SelectValue } from '~/components/ui/select';
import { Textarea } from '~/components/ui/textarea';
import { LoaderCircle, Upload } from 'lucide-vue-next';
import { Game } from '~~/common/types/games';
import { getGameDisplayName } from '~~/common/utils/games';
import type { CardSuggestion, DecklistImportResponse } from '~~/common/types/decklist-import';
import SheetDecklistCardSelection from '~/components/sheet/SheetDecklistCardSelection.vue';

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const gameStore = useGameStore();
const { selectedGame } = storeToRefs(gameStore);

const sheetStore = useSheetStore();
const { addCard } = sheetStore;

const decklistText = ref('');
const toImportFromGame = ref<Game | null>(selectedGame.value);
const dialogStep = ref<'input' | 'selection'>('input');
const isLoadingSuggestions = ref(false);
const cardSuggestions = ref<CardSuggestion[]>([]);
const selectedCards = ref<Map<string, string>>(new Map()); // Map cardName -> selectedFileId

const gamePlaceholder = computed(() => {
  switch (toImportFromGame.value) {
  case Game.OPTCG:
    return '1xOP13-079\n4xEB02-036\n3xPRB02-008';
  case Game.RIFTBOUND:
    return '2 Primal Strength\n1 Qiyana, Victorious\n12 Calm Rune';
  default:
    return '';
  }
});

async function loadCardSuggestions() {
  if (!decklistText.value.trim() || !toImportFromGame.value) {
    return;
  }

  isLoadingSuggestions.value = true;

  try {
    const response = await $fetch<DecklistImportResponse>('/api/v1/decklist-import', {
      method: 'POST',
      body: {
        game: toImportFromGame.value,
        decklist: decklistText.value,
      },
    });

    console.log('Parsed decklist:', response);
    cardSuggestions.value = response.suggestions;
  } catch (error) {
    console.error('Failed to parse decklist:', error);
    // TODO: Show error message to user
  } finally {
    isLoadingSuggestions.value = false;
  }
}

async function goToNextStep() {
  if (dialogStep.value === 'input') {
    await loadCardSuggestions();
    if (cardSuggestions.value.length > 0) {
      dialogStep.value = 'selection';
    }
  } else if (dialogStep.value === 'selection') {
    // Add selected cards to sheet and close dialog
    addSelectedCardsToSheet();
  }
}

async function goToPreviousStep() {
  if (dialogStep.value === 'selection') {
    dialogStep.value = 'input';
  } else if (dialogStep.value === 'input') {
    closeDialog();
  }
}

function selectCardForSuggestion(suggestionName: string, fileId: string) {
  selectedCards.value.set(suggestionName, fileId);
}

function addSelectedCardsToSheet() {
  // Go through each suggestion and add the selected card with its quantity
  cardSuggestions.value.forEach(suggestion => {
    const selectedFileId = selectedCards.value.get(suggestion.name);
    if (selectedFileId) {
      // Find the selected card in the suggestion's cards array
      const selectedCard = suggestion.cards.find(card => card.id === selectedFileId);
      if (selectedCard) {
        // Add the card multiple times based on the quantity
        for (let i = 0; i < suggestion.quantity; i++) {
          addCard(selectedCard);
        }
      }
    }
  });

  // Close the dialog after adding cards
  closeDialog();
}

function resetDialog() {
  dialogStep.value = 'input';
  decklistText.value = '';
  cardSuggestions.value = [];
  selectedCards.value.clear();
  isLoadingSuggestions.value = false;
}

function closeDialog() {
  resetDialog();
  emit('update:open', false);
}

// Reset dialog state when it opens
watch(() => props.open, newValue => {
  if (newValue) {
    resetDialog();
  }
});
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent :class="dialogStep === 'selection' ? '!max-w-2xl max-h-[80vh] overflow-hidden !w-[90vw]' : 'max-w-md'">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <Upload class="h-5 w-5" />
          {{ $t('sheet.section.import_from_decklist')}}
        </DialogTitle>
        <DialogDescription>
          {{ $t('sheet.section.import_from_decklist_description') }}
        </DialogDescription>
      </DialogHeader>


      <div v-if="dialogStep === 'input'" class="space-y-4">
        <div class="space-y-2">
          <Label for="game-select">{{ $t('global.game') }}</Label>
          <Select v-model="toImportFromGame">
            <SelectTrigger class="w-full cursor-pointer">
              <SelectValue :placeholder="$t('header.select_game')" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>{{ $t('header.games') }}</SelectLabel>
                <SelectItem
                  v-for="g in Game"
                  :key="g"
                  :value="g"
                  class="cursor-pointer"
                >
                  {{ getGameDisplayName(g) }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <Label for="decklist-input">{{ $t('global.decklist') }}</Label>
          <Textarea
            id="decklist-input"
            v-model="decklistText"
            :placeholder="gamePlaceholder"
          />
        </div>
      </div>

      <div v-else-if="dialogStep === 'selection'" class="max-h-[50vh] overflow-hidden">
        <SheetDecklistCardSelection
          :suggestions="cardSuggestions"
          :selected-cards="selectedCards"
          @select-card="selectCardForSuggestion"
        />
      </div>

      <DialogFooter>
        <Button variant="outline" class="cursor-pointer" @click="goToPreviousStep">
          {{ dialogStep === 'input' ? $t('global.cancel') : $t('decks.import.go_to_previous_setp') }}
        </Button>
        <Button :disabled="dialogStep === 'input' && (!decklistText.trim() || isLoadingSuggestions)" class="cursor-pointer" @click="goToNextStep">
          <LoaderCircle v-if="isLoadingSuggestions" class="animate-spin size-4" />
          {{ dialogStep === 'selection' ? $t('decks.import.import_cards') : $t('global.continue')}}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
