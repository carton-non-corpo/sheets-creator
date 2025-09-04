<script setup lang="ts">
import Select from '~/components/ui/select/Select.vue'
import { SelectTrigger, SelectContent, SelectItem, SelectGroup, SelectLabel, SelectValue } from '~/components/ui/select'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useGameStore } from '~/stores/game'
import { Game } from '~~/common/types/games'
import { getGameDisplayName } from '~~/common/utils/games'

const route = useRoute()

const gameStore = useGameStore()
const { selectedGame } = storeToRefs(gameStore)

const pageName = computed(() => {
  if (route.path === '/') return $t('nav.sheets')
  if (route.path === '/decks') return $t('nav.decks')
})
</script>

<template>
  <header class="flex flex-shrink-0 items-center gap-4 px-8 py-4 bg-white border-b">
    <div class="text-xl font-semibold">{{ pageName }}</div>
    <Select v-model="selectedGame">
      <SelectTrigger class="min-w-[180px]">
        <SelectValue :placeholder="$t('header.select_game')" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>{{ $t('header.games') }}</SelectLabel>
          <SelectItem v-for="g in Game" :key="g" :value="g">
            {{ getGameDisplayName(g) }}
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  </header>
</template>