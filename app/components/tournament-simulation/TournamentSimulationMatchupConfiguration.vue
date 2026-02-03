<script setup lang="ts">
import { Input } from '~/components/ui/input';
import type { Deck, MatchupWinRates } from '~~/common/types/tournament';

const props = defineProps<{
  decks: Deck[]
  modelValue: MatchupWinRates
}>();

const emit = defineEmits<{
  'update:modelValue': [value: MatchupWinRates]
}>();

const { t } = useI18n();

// Initialize matchup win rates if not already set
const initializeMatchups = () => {
  const matchups = { ...props.modelValue };

  props.decks.forEach(deckA => {
    if (!matchups[deckA.name]) {
      matchups[deckA.name] = {};
    }

    props.decks.forEach(deckB => {
      if (deckA.name !== deckB.name && matchups[deckA.name]?.[deckB.name] === undefined) {
        matchups[deckA.name]![deckB.name] = 50;
      }
    });
  });

  return matchups;
};

const matchups = computed({
  get: () => initializeMatchups(),
  set: value => emit('update:modelValue', value),
});

const updateWinRate = (deckA: string, deckB: string, value: string) => {
  const numValue = Math.max(0, Math.min(100, Number(value) || 0));
  const newMatchups = { ...matchups.value };

  if (!newMatchups[deckA]) {
    newMatchups[deckA] = {};
  }

  newMatchups[deckA][deckB] = numValue;

  // Mirror the matchup (if A beats B 60%, then B beats A 40%)
  if (!newMatchups[deckB]) {
    newMatchups[deckB] = {};
  }
  newMatchups[deckB][deckA] = 100 - numValue;

  emit('update:modelValue', newMatchups);
};

const getCellColor = (winRate: number) => {
  if (winRate === 50) {
    return 'rgb(249, 250, 251)'; // gray-50
  } else if (winRate > 50) {
    // Green gradient: 50-100% maps to light green to dark green
    const intensity = (winRate - 50) / 50; // 0 to 1
    const scaledIntensity = Math.pow(intensity, 1.5); // Apply non-linear scaling
    const lightness = 95 - (scaledIntensity * 25); // 95% to 70%
    return `hsl(142, ${35 + scaledIntensity * 30}%, ${lightness}%)`;
  } else {
    // Red gradient: 0-50% maps to dark red to light red
    const intensity = (50 - winRate) / 50; // 0 to 1
    const scaledIntensity = Math.pow(intensity, 1.5); // Apply non-linear scaling
    const lightness = 95 - (scaledIntensity * 25); // 95% to 70%
    return `hsl(0, ${35 + scaledIntensity * 30}%, ${lightness}%)`;
  }
};

const getTextColor = (winRate: number) => {
  if (winRate >= 35 && winRate <= 65) {
    return 'rgb(55, 65, 81)'; // gray-700 for neutral values
  } else if (winRate > 65) {
    return 'rgb(5, 46, 22)'; // dark green
  } else {
    return 'rgb(69, 10, 10)'; // dark red
  }
};
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="overflow-x-auto">
      <div class="inline-block min-w-full align-middle">
        <div class="overflow-hidden border rounded-lg">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                  {{ t('tournament_simulation.matchup_configuration.playing_as') }}
                </th>
                <th
                  v-for="deck in decks"
                  :key="`header-${deck.name}`"
                  class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <div class="flex flex-col items-center gap-1">
                    <span>{{ deck.name }}</span>
                    <span class="text-xs text-gray-400">({{ deck.presence }}%)</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="deckA in decks" :key="`row-${deckA.name}`">
                <td class="sticky left-0 z-10 bg-white px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 border-r">
                  <div class="flex flex-col gap-1">
                    <span>{{ deckA.name }}</span>
                    <span class="text-xs text-gray-400">({{ deckA.presence }}%)</span>
                  </div>
                </td>
                <td
                  v-for="deckB in decks"
                  :key="`cell-${deckA.name}-${deckB.name}`"
                  class="px-4 py-3 whitespace-nowrap text-sm transition-colors duration-200"
                  :class="deckA.name === deckB.name ? 'bg-gray-100' : ''"
                  :style="deckA.name !== deckB.name ? { backgroundColor: getCellColor(matchups[deckA.name]?.[deckB.name] ?? 50) } : {}"
                >
                  <div v-if="deckA.name === deckB.name" class="text-center text-gray-400">
                    -
                  </div>
                  <div v-else class="flex items-center justify-center">
                    <div class="relative">
                      <Input
                        :model-value="matchups[deckA.name]?.[deckB.name] ?? 50"
                        type="number"
                        min="0"
                        max="100"
                        class="w-20 text-center bg-transparent border-gray-300 focus:border-blue-500"
                        :style="{ color: getTextColor(matchups[deckA.name]?.[deckB.name] ?? 50) }"
                        @input="updateWinRate(deckA.name, deckB.name, ($event.target as HTMLInputElement).value)"
                      />
                      <span
                        class="absolute right-2 top-1/2 -translate-y-1/2 text-xs pointer-events-none"
                        :style="{ color: getTextColor(matchups[deckA.name]?.[deckB.name] ?? 50), opacity: 0.6 }"
                      >
                        %
                      </span>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
      <p class="font-medium">{{ t('tournament_simulation.matchup_configuration.tip_title') }}</p>
      <p class="mt-1">{{ t('tournament_simulation.matchup_configuration.tip_description') }}</p>
    </div>
  </div>
</template>
