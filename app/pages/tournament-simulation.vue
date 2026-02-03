<script lang="ts" setup>
import { Upload, Download } from 'lucide-vue-next';
import TournamentSimulationThread from '~/components/tournament-simulation/TournamentSimulationThread.vue';
import Button from '~/components/ui/button/Button.vue';
import type { Deck, MatchupWinRates } from '~~/common/types/tournament';
import type { TournamentSimulationConfig } from '~/composables/useTournamentSimulationExport';

const { t } = useI18n();
const { exportConfiguration, importConfiguration } = useTournamentSimulationExport();

const currentStep = ref(0);

const steps = computed(() => [
  {
    key: 'decks',
    label: t('tournament_simulation.steps.decks_definition'),
    completed: isDecksStepCompleted.value,
  },
  {
    key: 'matchups_configuration',
    label: t('tournament_simulation.steps.matchups_configuration'),
    completed: isMatchupsStepCompleted.value,
  },
  {
    key: 'results',
    label: t('tournament_simulation.steps.results'),
    completed: false,
  },
]);

const startingDecks = ref<Deck[]>([
  { name: 'Deck', presence: 0 },
]);

const matchupWinRates = ref<MatchupWinRates>({});

const numberOfRounds = ref(10);
const numberOfPlayers = ref(1024);

const isDecksStepCompleted = computed(() => {
  const totalPresence = startingDecks.value.reduce((sum, deck) => sum + deck.presence, 0);
  return totalPresence === 100;
});

const isMatchupsStepCompleted = computed(() => {
  // Check if all matchups are configured
  if (startingDecks.value.length === 0) return false;

  for (const deckA of startingDecks.value) {
    for (const deckB of startingDecks.value) {
      if (deckA.name !== deckB.name) {
        if (matchupWinRates.value[deckA.name]?.[deckB.name] === undefined) {
          return false;
        }
      }
    }
  }

  return true;
});

const goToStep = (step: number) => {
  if (step < currentStep.value || steps.value[currentStep.value]?.completed) {
    currentStep.value = step;
  }
};

const nextStep = () => {
  if (currentStep.value < steps.value.length - 1 && steps.value[currentStep.value]?.completed) {
    currentStep.value++;
  }
};

const handleExport = () => {
  const config: TournamentSimulationConfig = {
    decks: startingDecks.value,
    matchupWinRates: matchupWinRates.value,
    numberOfRounds: numberOfRounds.value,
    numberOfPlayers: numberOfPlayers.value,
  };
  exportConfiguration(config);
};

const handleImport = () => {
  importConfiguration(
    config => {
      startingDecks.value = config.decks;
      matchupWinRates.value = config.matchupWinRates;
      numberOfRounds.value = config.numberOfRounds;
      numberOfPlayers.value = config.numberOfPlayers;
    },
    error => {
      alert(error);
    },
  );
};
</script>

<template>
  <NuxtLayout>
    <ClientOnly>
      <div class="flex flex-col p-4 gap-4">
        <div class="flex gap-4 justify-between">
          <TournamentSimulationThread
            :steps="steps"
            :current-step="currentStep"
            @go-to-step="goToStep"
          />

          <div class="flex justify-end gap-2">
            <Button variant="outline" size="sm" @click="handleImport">
              <Upload class="w-4 h-4 mr-2" />
              {{ t('tournament_simulation.import') }}
            </Button>
            <Button variant="outline" size="sm" @click="handleExport">
              <Download class="w-4 h-4 mr-2" />
              {{ t('tournament_simulation.export') }}
            </Button>
          </div>
        </div>


        <div v-if="currentStep === 0" class="flex flex-col gap-4">
          <TournamentSimulationDecksDefinition v-model="startingDecks" />
          <Button class="w-fit" :disabled="!isDecksStepCompleted" @click="nextStep">
            {{ t('tournament_simulation.go_to_next_step') }}
          </Button>
        </div>

        <div v-else-if="currentStep === 1" class="flex flex-col gap-4">
          <TournamentSimulationMatchupConfiguration
            v-model="matchupWinRates"
            :decks="startingDecks"
          />

          <div class="border rounded-lg p-4 bg-gray-50">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  {{ t('tournament_simulation.configuration.number_of_rounds') }}
                </label>
                <div class="flex items-center gap-4">
                  <input
                    v-model.number="numberOfRounds"
                    type="number"
                    min="1"
                    max="15"
                    class="w-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span class="text-sm text-gray-600">
                    {{ t('tournament_simulation.configuration.rounds_description') }}
                  </span>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  {{ t('tournament_simulation.configuration.number_of_players') }}
                </label>
                <div class="flex items-center gap-4">
                  <input
                    v-model.number="numberOfPlayers"
                    type="number"
                    min="8"
                    max="1000"
                    step="8"
                    class="w-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span class="text-sm text-gray-600">
                    {{ t('tournament_simulation.configuration.players_description') }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="flex gap-2">
            <Button variant="outline" @click="currentStep--">
              {{ t('tournament_simulation.previous_step') }}
            </Button>
            <Button class="w-fit" :disabled="!isMatchupsStepCompleted" @click="nextStep">
              {{ t('tournament_simulation.go_to_next_step') }}
            </Button>
          </div>
        </div>

        <div v-else-if="currentStep === 2" class="flex flex-col gap-4">
          <TournamentSimulationResults
            :decks="startingDecks"
            :matchup-win-rates="matchupWinRates"
            :number-of-rounds="numberOfRounds"
            :number-of-players="numberOfPlayers"
          />
          <div class="flex gap-2">
            <Button variant="outline" @click="currentStep--">
              {{ t('tournament_simulation.previous_step') }}
            </Button>
          </div>
        </div>
      </div>
    </ClientOnly>
  </NuxtLayout>
</template>
