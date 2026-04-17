<script setup lang="ts">
import { computed } from 'vue';
import { RotateCw } from 'lucide-vue-next';
import Button from '~/components/ui/button/Button.vue';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import { Badge } from '~/components/ui/badge';
import type { Deck, MatchupWinRates } from '~~/common/types/tournament';
import { simulateSwissTournament, aggregateResultsByDeck } from '~~/common/utils/swiss-tournament';
import TournamentSimulationScoreDistribution from './TournamentSimulationScoreDistribution.vue';

const props = defineProps<{
  decks: Deck[]
  matchupWinRates: MatchupWinRates
  numberOfRounds?: number
  numberOfPlayers?: number
  bestOfThree?: boolean
}>();

const { t } = useI18n();

const numberOfRounds = computed(() => props.numberOfRounds ?? 10);
const numberOfPlayers = computed(() => props.numberOfPlayers ?? 1024);
const bestOfThree = computed(() => props.bestOfThree ?? false);

const runSimulation = () => {
  return simulateSwissTournament(
    props.decks,
    props.matchupWinRates,
    numberOfRounds.value,
    numberOfPlayers.value,
    bestOfThree.value,
  );
};

const results = ref(runSimulation());

const aggregatedResults = computed(() => {
  return aggregateResultsByDeck(results.value.standings);
});

const runNewSimulation = () => {
  results.value = runSimulation();
  console.log('New simulation results:', results.value);
};

// Run simulation when component is mounted or matchup rates change
onMounted(() => {
  results.value = runSimulation();
});

const getWinRateColor = (winRate: number) => {
  if (winRate >= 60) return 'text-green-700 font-semibold';
  if (winRate >= 50) return 'text-green-600';
  if (winRate >= 40) return 'text-orange-600';
  return 'text-red-600';
};
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold">
          {{ t('tournament_simulation.results.title') }}
        </h2>
        <p class="text-sm text-gray-600 mt-1">
          {{ t('tournament_simulation.results.description', { rounds: numberOfRounds, players: numberOfPlayers }) }}
          · {{ bestOfThree ? t('tournament_simulation.configuration.best_of_three') : t('tournament_simulation.configuration.best_of_one') }}
        </p>
      </div>
      <Button @click="runNewSimulation">
        <RotateCw class="w-4 h-4 mr-2" />
        {{ t('tournament_simulation.results.run_new_simulation') }}
      </Button>
    </div>

    <!-- Aggregated Results by Deck -->
    <div class="border rounded-lg overflow-hidden">
      <div class="bg-gray-50 px-4 py-3 border-b">
        <h3 class="font-semibold text-lg">
          {{ t('tournament_simulation.results.deck_performance') }}
        </h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{{ t('tournament_simulation.results.deck_name') }}</TableHead>
            <TableHead class="text-center">
              {{ t('tournament_simulation.results.players') }}
            </TableHead>
            <TableHead class="text-center">
              {{ t('tournament_simulation.results.avg_wins') }}
            </TableHead>
            <TableHead class="text-center">
              {{ t('tournament_simulation.results.avg_win_rate') }}
            </TableHead>
            <TableHead class="text-center">
              {{ t('tournament_simulation.results.top_32') }}
            </TableHead>
            <TableHead class="text-center">
              {{ t('tournament_simulation.results.top_64') }}
            </TableHead>
            <TableHead class="text-center">
              {{ t('tournament_simulation.results.top_128') }}
            </TableHead>
            <TableHead class="text-center">
              {{ t('tournament_simulation.results.top_256') }}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="deck in aggregatedResults" :key="deck.deckName">
            <TableCell class="font-medium">{{ deck.deckName }}</TableCell>
            <TableCell class="text-center">{{ deck.totalPlayers }}</TableCell>
            <TableCell class="text-center">{{ deck.averageWins.toFixed(2) }}</TableCell>
            <TableCell class="text-center" :class="getWinRateColor(deck.averageWinRate)">
              {{ deck.averageWinRate.toFixed(1) }}%
            </TableCell>
            <TableCell class="text-center">
              <Badge v-if="deck.top32Count > 0" variant="default">
                {{ deck.top32Count }}
              </Badge>
              <span v-else class="text-gray-400">-</span>
            </TableCell>
            <TableCell class="text-center">
              <Badge v-if="deck.top64Count > 0" variant="secondary">
                {{ deck.top64Count }}
              </Badge>
              <span v-else class="text-gray-400">-</span>
            </TableCell>
            <TableCell class="text-center">
              <Badge v-if="deck.top128Count > 0" variant="outline">
                {{ deck.top128Count }}
              </Badge>
              <span v-else class="text-gray-400">-</span>
            </TableCell>
            <TableCell class="text-center">
              <Badge v-if="deck.top256Count > 0" variant="outline">
                {{ deck.top256Count }}
              </Badge>
              <span v-else class="text-gray-400">-</span>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Score Distribution -->
    <TournamentSimulationScoreDistribution
      :matches="results.matches"
      :decks="decks"
      :total-rounds="numberOfRounds"
      :number-of-players="numberOfPlayers"
    />
  </div>
</template>
