<script setup lang="ts">
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import { Badge } from '~/components/ui/badge';
import { ScrollArea } from '~/components/ui/scroll-area';
import { Button } from '~/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import { Check, AlertTriangle } from 'lucide-vue-next';
import type { CardSuggestion } from '~~/common/types/decklist-import';

const props = defineProps<{
  suggestions: CardSuggestion[];
  selectedCards: Map<string, string>;
}>();

const emit = defineEmits<{
  'select-card': [suggestionName: string, fileId: string];
}>();

function handleCardSelection(suggestionName: string, fileId: string) {
  emit('select-card', suggestionName, fileId);
}

function isCardSelected(suggestionName: string, fileId: string): boolean {
  return props.selectedCards.get(suggestionName) === fileId;
}

// Auto-select first available card for each suggestion on mount
onMounted(() => {
  props.suggestions.forEach(suggestion => {
    // Only auto-select if no card is already selected for this suggestion
    if (!props.selectedCards.has(suggestion.name) && suggestion.cards.length > 0) {
      const firstCard = suggestion.cards[0];
      if (firstCard) {
        handleCardSelection(suggestion.name, firstCard.id);
      }
    }
  });
});
</script>

<template>
  <div class="w-full mt-2">
    <ScrollArea class="h-[400px] rounded-md border">
      <Table>
        <TableHeader class="sticky top-0 bg-background">
          <TableRow>
            <TableHead class="w-12">{{ $t('sheet.table.quantity') }}</TableHead>
            <TableHead class="min-w-48">{{ $t('sheet.table.name') }}</TableHead>
            <TableHead>{{ $t('sheet.table.card_suggestions') }}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="suggestion in suggestions" :key="suggestion.name">
            <TableCell class="font-medium">
              <Badge variant="secondary">{{ suggestion.quantity }}</Badge>
            </TableCell>
            <TableCell class="font-medium">
              <div class="flex items-center gap-2">
                {{ suggestion.name }}
                <AlertTriangle
                  v-if="suggestion.cards.length === 0"
                  class="h-4 w-4 text-yellow-500"
                />
              </div>
              <div class="text-xs text-muted-foreground">
                <span v-if="suggestion.cards.length === 0" class="text-yellow-600">
                  {{ $t('decks.import.no_cards_found') }}
                </span>
                <span v-else>
                  {{ $t('decks.import.cards_found', { count: suggestion.cards.length }, suggestion.cards.length) }}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <div class="flex gap-2 overflow-x-auto min-w-0 max-w-[600px] pb-1">
                <TooltipProvider v-for="card in suggestion.cards" :key="card.id">
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <Button
                        :variant="isCardSelected(suggestion.name, card.id) ? 'default' : 'outline'"
                        size="sm"
                        class="relative flex flex-col items-center h-20 w-16 p-1 cursor-pointer overflow-hidden flex-shrink-0"
                        @click="handleCardSelection(suggestion.name, card.id)"
                      >
                        <img
                          v-if="card.thumbnailLink"
                          :src="card.thumbnailLink"
                          :alt="card.name || 'Card image'"
                          class="w-full h-full object-cover"
                          @error="console.log('Image failed to load:', card.thumbnailLink)"
                        />
                        <div
                          v-else
                          class="flex items-center justify-center w-full h-full bg-gray-200 text-xs text-gray-500"
                        >
                          {{ $t('sheet.display.no_image') }}
                        </div>
                        <Check
                          v-if="isCardSelected(suggestion.name, card.id)"
                          class="absolute top-1 right-1 h-3 w-3 text-primary-foreground"
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent v-if="card.imageUrl" side="left" class="p-2">
                      <div class="h-50 w-36 rounded overflow-hidden">
                        <img
                          :src="card.imageUrl"
                          :alt="card.name || 'Card image'"
                          class="w-full h-full object-cover"
                        />
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </ScrollArea>
  </div>
</template>
