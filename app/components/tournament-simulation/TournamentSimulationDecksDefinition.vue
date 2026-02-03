<script setup lang="ts">
import { TriangleAlert, Trash2 } from 'lucide-vue-next';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '~/components/ui/context-menu';
import type { Deck } from '~~/common/types/tournament';

const { t } = useI18n();

const decks = defineModel<Deck[]>();

const totalPresence = computed(() => {
  if (!decks.value) return 0;
  return decks.value.reduce((sum, deck) => sum + (deck.presence || 0), 0);
});

const noDuplicateNames = computed(() => {
  if (!decks.value) return true;
  const names = decks.value.map(deck => deck.name.trim().toLowerCase()).filter(name => name !== '');
  return names.length === new Set(names).size;
});

const sortDecks = () => {
  if (decks.value) {
    decks.value.sort((a, b) => b.presence - a.presence);
  }
};

const addDeck = () => {
  if (decks.value) {
    decks.value.push({ name: '', presence: 0 });
  }
};

const removeDeck = (index: number) => {
  if (decks.value && decks.value.length > 1) {
    decks.value.splice(index, 1);
  }
};
</script>

<template>
  <div class="space-y-4">
    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
      <ContextMenu v-for="(deck, index) in decks" :key="index">
        <ContextMenuTrigger>
          <div
            class="group relative border-2 border-gray-200 rounded-xl p-4 bg-gradient-to-br from-white to-gray-50 hover:shadow-lg hover:border-blue-300 transition-all duration-200 hover:-translate-y-0.5"
          >
            <div class="absolute top-2 right-2 text-[10px] font-medium text-gray-400">
              #{{ index + 1 }}
            </div>

            <input
              v-model="deck.name"
              name="deck-name"
              class="w-full text-lg font-bold mb-3 bg-transparent border-0 outline-none focus:ring-2 focus:ring-blue-400 rounded-md px-2 py-1 -mx-2 -my-1 text-gray-800 placeholder:text-gray-400"
              :placeholder="t('tournament_simulation.deck_name_placeholder')"
            />

            <div class="flex items-baseline gap-1 pt-2 border-t border-gray-200">
              <input
                v-model.number="deck.presence"
                type="number"
                class="w-10 text-base font-semibold bg-transparent border-0 outline-none focus:ring-2 focus:ring-blue-400 rounded px-1.5 -mx-1.5 text-blue-600"
                placeholder="0"
                @blur="sortDecks"
              />
              <span class="text-sm font-medium text-gray-500">%</span>
              <span class="text-xs text-gray-400 ml-auto">{{ t('tournament_simulation.presence') }}</span>
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem
            :disabled="decks && decks.length <= 1"
            class="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
            @click="removeDeck(index)"
          >
            <Trash2 class="w-4 h-4 text-red-600 " />
            {{ t('tournament_simulation.remove_deck') }}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <button
        class="group relative border-2 border-dashed border-gray-300 rounded-xl p-4 bg-gradient-to-br from-gray-50 to-white hover:shadow-lg hover:border-blue-400 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
        @click="addDeck"
      >
        <div class="flex flex-col items-center justify-center h-full gap-2">
          <span class="text-2xl font-bold text-gray-400 group-hover:text-blue-500 transition-colors">+</span>
          <span class="text-xs text-gray-500 font-medium group-hover:text-blue-600 transition-colors">{{ t('tournament_simulation.add_deck') }}</span>
        </div>
      </button>
    </div>

    <div
      v-if="totalPresence !== 100"
      class="flex items-center gap-2 px-4 py-3 rounded-lg border-2 border-amber-200 bg-amber-50 text-amber-800"
    >
      <TriangleAlert class="w-4 h-4" />
      <div class="flex-1">
        <span>{{ t('tournament_simulation.warning_total_not_100') }}</span>
        <span class="ml-2 text-sm">{{ t('tournament_simulation.warning_current', { total: totalPresence }) }}</span>
      </div>
    </div>

    <div
      v-if="!noDuplicateNames"
      class="flex items-center gap-2 px-4 py-3 rounded-lg border-2 border-red-200 bg-red-50 text-red-800"
    >
      <TriangleAlert class="w-4 h-4" />
      <div class="flex-1">
        <span>{{ t('tournament_simulation.warning_duplicate_deck_names') }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}
</style>
