<script setup lang="ts">
import { Home, Folders, Printer, Languages } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { useGameStore } from '~/stores/game';
import { Game } from '~~/common/types/games';
import { getGameDisplayName } from '~~/common/utils/games';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectGroup, SelectLabel, SelectValue } from '~/components/ui/select';

defineOptions({
  name: 'AppNav',
});

const { locale, locales, setLocale } = useI18n();

const gameStore = useGameStore();
const { selectedGame } = storeToRefs(gameStore);

const availableLocales = computed(() => {
  return locales.value.filter(l => l.code !== locale.value);
});

const currentLanguageLabel = computed(() => {
  switch (locale.value) {
  case 'en': return 'English';
  case 'fr': return 'Français';
  default: return locale.value;
  }
});

function switchLanguage() {
  const nextLocale = availableLocales.value[0]?.code;
  if (nextLocale) {
    setLocale(nextLocale);
  }
};

</script>

<template>
  <nav class="h-screen w-64 bg-white border-r border-gray-200 flex flex-col">
    <!-- Brand -->
    <div class="p-6 border-b border-gray-100">
      <h1 class="font-bold text-lg text-gray-900">{{ $t('nav.brand') }}</h1>
    </div>

    <!-- Game Selector -->
    <div class="p-4">
      <Select v-model="selectedGame">
        <SelectTrigger class="w-full">
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
    </div>

    <!-- Navigation -->
    <div class="flex-1 px-4 py-2">
      <ul class="space-y-1">
        <li>
          <NuxtLink
            to="/"
            class="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium  transition-colors"
            :class="$route.path === '/' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-900'"
          >
            <Printer class="w-4 h-4" />
            <span>{{ $t('nav.sheets') }}</span>
          </NuxtLink>
        </li>
        <li>
          <NuxtLink
            to="/decks"
            class="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium  transition-colors"
            :class="$route.path === '/decks' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-900'"
          >
            <Folders class="w-4 h-4" />
            <span>{{ $t('nav.decks') }}</span>
          </NuxtLink>
        </li>
      </ul>
    </div>

    <!-- Footer -->
    <div class="p-4 border-t border-gray-100 space-y-1">
      <button
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        :title="$t('nav.language')"
        @click="switchLanguage"
      >
        <Languages class="w-4 h-4" />
        <span>{{ currentLanguageLabel }}</span>
      </button>

      <NuxtLink
        to="https://github.com/carton-non-corpo/sheets-creator"
        target="_blank"
        class="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
      >
        <Home class="w-4 h-4" />
        <span>{{ $t('nav.github') }}</span>
      </NuxtLink>
    </div>
  </nav>
</template>
