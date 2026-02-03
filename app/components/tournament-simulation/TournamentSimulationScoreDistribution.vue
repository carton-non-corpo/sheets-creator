<script setup lang="ts">
import { computed, ref } from 'vue';
import type { MatchResult } from '~~/common/utils/swiss-tournament';
import type { Deck } from '~~/common/types/tournament';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Label } from '~/components/ui/label';

const props = defineProps<{
  matches: MatchResult[]
  decks: Deck[]
  totalRounds: number
  numberOfPlayers: number
}>();

// Compute deck performance distribution for a specific round and wins count
const computeDeckDistribution = (targetRound: number, targetWins: number) => {
  // Get matches up to target round
  const relevantMatches = props.matches.filter(m => m.round <= targetRound);

  // Track all players and their records
  type PlayerRecord = { deckName: string; wins: number; losses: number };
  const players: PlayerRecord[] = [];

  // Initialize players
  props.decks.forEach(deck => {
    const count = Math.round((deck.presence / 100) * props.numberOfPlayers);
    for (let i = 0; i < count; i++) {
      players.push({ deckName: deck.name, wins: 0, losses: 0 });
    }
  });

  // Simulate match distribution
  // Since matches don't track individual players, we distribute results randomly among deck players
  relevantMatches.forEach(match => {
    const deck1Players = players.filter(p => p.deckName === match.player1 && p.wins + p.losses < targetRound);
    const deck2Players = players.filter(p => p.deckName === match.player2 && p.wins + p.losses < targetRound);

    if (deck1Players.length > 0 && deck2Players.length > 0) {
      const p1 = deck1Players[Math.floor(Math.random() * deck1Players.length)]!;
      const p2 = deck2Players[Math.floor(Math.random() * deck2Players.length)]!;

      if (match.winner === match.player1) {
        p1.wins++;
        p2.losses++;
      } else {
        p2.wins++;
        p1.losses++;
      }
    }
  });

  // Filter players at target score
  const playersAtScore = players.filter(p => p.wins === targetWins && p.wins + p.losses === targetRound);

  // Count by deck
  const deckCounts = new Map<string, number>();
  playersAtScore.forEach(p => {
    deckCounts.set(p.deckName, (deckCounts.get(p.deckName) || 0) + 1);
  });

  const total = playersAtScore.length;

  return Array.from(deckCounts.entries())
    .map(([deckName, count]) => ({
      deckName,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);
};

const { t } = useI18n();

const selectedRound = ref(1);
const selectedWins = ref(0);

const roundOptions = computed(() => {
  return Array.from({ length: props.totalRounds }, (_, i) => i + 1);
});

const winsOptions = computed(() => {
  return Array.from({ length: selectedRound.value + 1 }, (_, i) => i);
});

const deckDistribution = computed(() => {
  if (selectedRound.value > props.totalRounds) {
    return [];
  }

  return computeDeckDistribution(selectedRound.value, selectedWins.value);
});

const totalPlayersAtScore = computed(() => {
  return deckDistribution.value.reduce((sum, deck) => sum + deck.count, 0);
});

// Reset selectedWins when selectedRound changes and current wins is invalid
watch(selectedRound, newRound => {
  if (selectedWins.value > newRound) {
    selectedWins.value = newRound;
  }
});
</script>

<template>
  <div class="border rounded-lg overflow-hidden">
    <div class="bg-gray-50 px-4 py-3 border-b">
      <h3 class="font-semibold text-lg">
        {{ t('tournament_simulation.results.score_distribution.title') }}
      </h3>
      <p class="text-sm text-gray-600 mt-1">
        {{ t('tournament_simulation.results.score_distribution.description') }}
      </p>
    </div>

    <div class="p-4 space-y-4">
      <!-- Selectors -->
      <div class="flex gap-4">
        <div class="flex flex-1 gap-2">
          <Label for="round-select">{{ t('tournament_simulation.results.score_distribution.round') }}</Label>
          <Select v-model="selectedRound">
            <SelectTrigger id="round-select">
              <SelectValue :placeholder="String(selectedRound)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="round in roundOptions" :key="round" :value="round">
                {{ t('tournament_simulation.results.score_distribution.round_number', { round }) }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="flex flex-1 gap-2">
          <Label for="wins-select">{{ t('tournament_simulation.results.score_distribution.wins') }}</Label>
          <Select v-model="selectedWins">
            <SelectTrigger id="wins-select">
              <SelectValue :placeholder="String(selectedWins)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="wins in winsOptions" :key="wins" :value="wins">
                {{ t('tournament_simulation.results.score_distribution.wins_number', { wins }) }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <!-- Results -->
      <div v-if="totalPlayersAtScore > 0">
        <p class="text-sm text-gray-600 mb-3">
          {{ t('tournament_simulation.results.score_distribution.total_players', { count: totalPlayersAtScore }) }}
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{{ t('tournament_simulation.results.deck_name') }}</TableHead>
              <TableHead class="text-center">{{ t('tournament_simulation.results.players') }}</TableHead>
              <TableHead class="text-center">{{ t('tournament_simulation.results.score_distribution.percentage') }}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="deck in deckDistribution" :key="deck.deckName">
              <TableCell class="font-medium">{{ deck.deckName }}</TableCell>
              <TableCell class="text-center">
                <Badge>{{ deck.count }}</Badge>
              </TableCell>
              <TableCell class="text-center"><Badge variant="secondary">{{ deck.percentage.toFixed(1) }}%</Badge></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div v-else class="text-center py-8 text-gray-500">
        {{ t('tournament_simulation.results.score_distribution.no_players') }}
      </div>
    </div>
  </div>
</template>
