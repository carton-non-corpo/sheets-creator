<script setup lang="ts">
definePageMeta({ name: 'Planches', title: 'Planches' })

const foldersIds = ref<string[]>(['1EAqEy5Hpb-DTOj1nUdwxHpnrBx7MexXH']);

onMounted(async () => {
  const res = await fetch(`/api/v1/drive-files?name=000&foldersIds=${foldersIds.value.join(',')}`);
  const data = await res.json();
});
</script>

<template>
  <NuxtLayout>
    <div class="p-8">
      <h1 class="text-2xl font-bold mb-4">Planches</h1>
      <p>Contenu de la page Planches.</p>
    </div>
  </NuxtLayout>
</template>
