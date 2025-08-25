<script setup lang="ts">
// Minimal logic for new page
console.log('New page loaded');
</script>

<template>
  <NuxtLayout>
    <div class="p-8">
      <h1 class="text-2xl font-bold mb-4">New Page</h1>
      <p>This page uses the new default layout.</p>
      <div class="space-y-6 mt-8">
        <div v-for="i in 40" :key="i" class="bg-white rounded shadow p-4">
          <h2 class="text-lg font-semibold mb-2">Fake Section {{ i }}</h2>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque euismod, nisi eu consectetur consectetur, nisl nisi consectetur nisi, euismod euismod nisi nisi euismod.</p>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
