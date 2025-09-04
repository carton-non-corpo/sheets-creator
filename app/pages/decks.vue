<script setup lang="ts">
definePageMeta({ name: 'Decks', title: 'Decks' })
</script>

<template>
  <NuxtLayout>
    <div class="p-8">
      <h1 class="text-2xl font-bold mb-4">{{ $t('decks.title') }}</h1>
      <p>{{ $t('decks.content') }}</p>
    </div>
  </NuxtLayout>
</template>
