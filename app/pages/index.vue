<script setup lang="ts">
import CardSearch from '~/components/cards/CardSearch.vue';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '~/components/ui/resizable';
import type { DriveFile } from '~~/common/types/drive';

definePageMeta({ name: 'Planches', title: 'Planches' })

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
        <span class="font-semibold">Two</span>
      </ResizablePanel>
    </ResizablePanelGroup>
  </NuxtLayout>
</template>
