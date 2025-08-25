<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import Select from '~/components/ui/select/Select.vue'
import { SelectTrigger, SelectContent, SelectItem, SelectGroup, SelectLabel, SelectValue } from '~/components/ui/select'
import { useMainStore } from '~/stores/main'

const route = useRoute()

const mainStore = useMainStore()
const { selectedGame } = mainStore

const pageName = computed(() => {
  if (route.path === '/') return 'Planches'
  if (route.path === '/decks') return 'Decks'
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-row">
    <Nav />
    <div class="flex-1 flex flex-col min-h-screen">
      <header class="flex items-center gap-4 px-8 py-4 bg-white border-b">
        <div class="text-xl font-semibold">{{ pageName }}</div>
        <Select v-model="selectedGame">
          <SelectTrigger class="min-w-[180px]">
            <SelectValue placeholder="Select a game" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Games</SelectLabel>
              <SelectItem value="optcg">One Piece Card Game</SelectItem>
              <SelectItem value="mtg">Magic The Gathering</SelectItem>
              <SelectItem value="other">Other games</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </header>
      <main class="flex-1 overflow-y-auto" style="max-height: calc(100vh - 80px);">
        <slot />
      </main>
    </div>
  </div>
</template>