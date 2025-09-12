<script setup lang="ts">
import { Home, Folders, Printer, Languages } from 'lucide-vue-next';

defineOptions({
  name: 'AppNav',
});

const { locale, locales, setLocale } = useI18n();

const availableLocales = computed(() => {
  return locales.value.filter(l => l.code !== locale.value);
});

const switchLanguage = () => {
  const nextLocale = availableLocales.value[0]?.code;
  if (nextLocale) {
    setLocale(nextLocale);
  }
};

const currentLanguageLabel = computed(() => {
  switch (locale.value) {
  case 'en': return 'English';
  case 'fr': return 'Français';
  default: return locale.value;
  }
});
</script>

<template>
  <nav class="h-screen w-64 bg-gradient-to-b from-white via-gray-50 to-gray-100 border-r border-gray-200 flex flex-col py-8 px-6">
    <div class="mb-6 flex items-center gap-3">
      <span class="font-extrabold text-xl tracking-tight text-gray-900">{{ $t('nav.brand') }}</span>
    </div>
    <ul class="flex-1 space-y-2">
      <li>
        <NuxtLink
          to="/"
          class="flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition-colors group"
          :class="{ 'bg-gray-100 text-gray-900': $route.path === '/' }"
        >
          <Printer class="w-5 h-5 text-gray-400 group-hover:text-primary" />
          <span>{{ $t('nav.sheets') }}</span>
        </NuxtLink>
      </li>
      <li>
        <NuxtLink
          class="flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition-colors group cursor-not-allowed"
          disabled
        >
          <Folders class="w-5 h-5 text-gray-400 group-hover:text-primary" />
          <span>{{ $t('nav.decks') }}</span>
        </NuxtLink>
      </li>
    </ul>
    <div class="mt-auto pt-8 border-t border-gray-200">
      <button
        class="w-full flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition-colors group mb-2 cursor-pointer"
        :title="$t('nav.language')"
        @click="switchLanguage"
      >
        <Languages class="w-5 h-5 text-gray-400 group-hover:text-primary" />
        <span>{{ currentLanguageLabel }}</span>
      </button>

      <NuxtLink to="https://github.com/carton-non-corpo/sheets-creator" class="flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition-colors group">
        <Home class="w-5 h-5 text-gray-400 group-hover:text-primary" />
        <span>{{ $t('nav.github') }}</span>
      </NuxtLink>
    </div>
  </nav>
</template>
