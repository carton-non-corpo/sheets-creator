<script setup lang="ts">
import CardDetailsDialog from '~/components/cards/CardDetailsDialog.vue';
import CardSearch from '~/components/cards/CardSearch.vue';
import SheetSection from '~/components/sheet/SheetSection.vue';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '~/components/ui/resizable';

definePageMeta({ name: 'Planches', title: 'Planches' });

</script>

<template>
  <NuxtLayout>
    <ResizablePanelGroup
      direction="horizontal"
      class="w-full"
    >
      <ResizablePanel :default-size="40" :min-size="24">
        <CardSearch />
      </ResizablePanel>
      <ResizableHandle with-handle />
      <ResizablePanel :default-size="60" :min-size="40">
        <SheetSection />
      </ResizablePanel>
    </ResizablePanelGroup>

    <CardDetailsDialog />
  </NuxtLayout>
</template>
