<script setup lang="ts">
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { Label } from '~/components/ui/label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectGroup, SelectLabel, SelectValue } from '~/components/ui/select';
import { Textarea } from '~/components/ui/textarea';
import { Upload } from 'lucide-vue-next';
import { Game } from '~~/common/types/games';
import { getGameDisplayName } from '~~/common/utils/games';

defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const gameStore = useGameStore();
const { selectedGame } = storeToRefs(gameStore);

const decklistText = ref('');
const toImportFromGame = ref<Game | null>(selectedGame.value);

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

async function goToCardSelection() {
  if (!decklistText.value.trim() || !selectedGame.value) {
    return;
  }

  try {
    const response = await fetch('/api/v1/decklist-import', {
      method: 'POST',
      body: JSON.stringify({
        game: toImportFromGame.value,
        decklist: decklistText.value,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Parsed decklist:', response);

    // TODO: Show card selection dialog with suggestions
    // For now, just close the dialog
    closeDialog();
  } catch (error) {
    console.error('Failed to parse decklist:', error);

    // TODO: Show card selection dialog with suggestions
    // For now, just close the dialog
    closeDialog();
  }
}

function closeDialog() {
  emit('update:open', false);
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <Upload class="h-5 w-5" />
          {{ $t('sheet.section.import_from_decklist')}}
        </DialogTitle>
        <DialogDescription>
          {{ $t('sheet.section.import_from_decklist_description') }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
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

      <DialogFooter>
        <Button variant="outline" @click="closeDialog">
          {{ $t('global.cancel')}}
        </Button>
        <Button :disabled="!decklistText.trim()" @click="goToCardSelection">
          {{ $t('global.continue')}}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
